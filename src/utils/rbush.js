/*
 (c) 2013, Vladimir Agafonkin
 RBush, a JavaScript library for high-performance 2D spatial indexing of points and rectangles.
 https://github.com/mourner/rbush
*/

export default class rbush {

    constructor(maxEntries, format) {

        // jshint newcap: false, validthis: true
        if (!(this instanceof rbush)) return new rbush(maxEntries, format);

        // max entries in a node is 9 by default; min node fill is 40% for best performance
        this._maxEntries = Math.max(4, maxEntries || 9);
        this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));

        if (format) {
            this._initFormat(format);
        }

        this.clear();
    }

    all() {
        return this._all(this.data, []);
    }

    search(bbox) {

        let node = this.data,
            result = [],
            toBBox = this.toBBox;

        if (!this.intersects(bbox, node.bbox)) return result;

        let nodesToSearch = [],
            i, len, child, childBBox;

        while (node) {
            for (i = 0, len = node.children.length; i < len; i++) {

                child = node.children[i];
                childBBox = node.leaf ? toBBox(child) : child.bbox;

                if (this.intersects(bbox, childBBox)) {
                    if (node.leaf) result.push(child);
                    else if (contains(bbox, childBBox)) this._all(child, result);
                    else nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return result;
    }

    load(data) {
        if (!(data && data.length)) return this;

        if (data.length < this._minEntries) {
            for (let i = 0, len = data.length; i < len; i++) {
                this.insert(data[i]);
            }
            return this;
        }

        // recursively build the tree with the given data from stratch using OMT algorithm
        let node = this._build(data.slice(), 0, data.length - 1, 0);

        if (!this.data.children.length) {
            // save as is if tree is empty
            this.data = node;

        } else if (this.data.height === node.height) {
            // split root if trees have the same height
            this._splitRoot(this.data, node);

        } else {
            if (this.data.height < node.height) {
                // swap trees if inserted one is bigger
                let tmpNode = this.data;
                this.data = node;
                node = tmpNode;
            }

            // insert the small tree into the large tree at appropriate level
            this._insert(node, this.data.height - node.height - 1, true);
        }

        return this;
    }

    insert(item) {
        if (item) this._insert(item, this.data.height - 1);
        return this;
    }

    clear() {
        this.data = {
            children: [],
            height: 1,
            bbox: this.empty(),
            leaf: true
        };
        return this;
    }

    remove(item) {
        if (!item) return this;

        let node = this.data,
            bbox = this.toBBox(item),
            path = [],
            indexes = [],
            i, parent, index, goingUp;

        // depth-first iterative tree traversal
        while (node || path.length) {

            if (!node) { // go up
                node = path.pop();
                parent = path[path.length - 1];
                i = indexes.pop();
                goingUp = true;
            }

            if (node.leaf) { // check current node
                index = node.children.indexOf(item);

                if (index !== -1) {
                    // item found, remove the item and condense tree upwards
                    node.children.splice(index, 1);
                    path.push(node);
                    this._condense(path);
                    return this;
                }
            }

            if (!goingUp && !node.leaf && contains(node.bbox, bbox)) { // go down
                path.push(node);
                indexes.push(i);
                i = 0;
                parent = node;
                node = node.children[0];

            } else if (parent) { // go right
                i++;
                node = parent.children[i];
                goingUp = false;

            } else node = null; // nothing found
        }

        return this;
    }

    toBBox(item) { return item; }

    compareMinX(a, b) { return a[0] - b[0]; }
    compareMinY(a, b) { return a[1] - b[1]; }

    toJSON() { return this.data; }

    fromJSON(data) {
        this.data = data;
        return this;
    }

    _all(node, result) {
        let nodesToSearch = [];
        while (node) {
            if (node.leaf) result.push.apply(result, node.children);
            else nodesToSearch.push.apply(nodesToSearch, node.children);

            node = nodesToSearch.pop();
        }
        return result;
    }

    _build(items, left, right, height) {

        let N = right - left + 1,
            M = this._maxEntries,
            node;

        if (N <= M) {
            // reached leaf level; return leaf
            node = {
                children: items.slice(left, right + 1),
                height: 1,
                bbox: null,
                leaf: true
            };
            this.calcBBox(node, this.toBBox);
            return node;
        }

        if (!height) {
            // target height of the bulk-loaded tree
            height = Math.ceil(Math.log(N) / Math.log(M));

            // target number of root entries to maximize storage utilization
            M = Math.ceil(N / Math.pow(M, height - 1));
        }

        // TODO eliminate recursion?

        node = {
            children: [],
            height: height,
            bbox: null
        };

        // split the items into M mostly square tiles

        let N2 = Math.ceil(N / M),
            N1 = N2 * Math.ceil(Math.sqrt(M)),
            i, j, right2, right3;

        this.multiSelect(items, left, right, N1, this.compareMinX);

        for (i = left; i <= right; i += N1) {

            right2 = Math.min(i + N1 - 1, right);

            this.multiSelect(items, i, right2, N2, this.compareMinY);

            for (j = i; j <= right2; j += N2) {

                right3 = Math.min(j + N2 - 1, right2);

                // pack each entry recursively
                node.children.push(this._build(items, j, right3, height - 1));
            }
        }

        this.calcBBox(node, this.toBBox);

        return node;
    }

    _chooseSubtree(bbox, node, level, path) {

        let i, len, child, targetNode, area, enlargement, minArea, minEnlargement;

        while (true) {
            path.push(node);

            if (node.leaf || path.length - 1 === level) break;

            minArea = minEnlargement = Infinity;

            for (i = 0, len = node.children.length; i < len; i++) {
                child = node.children[i];
                area = this.bboxArea(child.bbox);
                enlargement = this.enlargedArea(bbox, child.bbox) - area;

                // choose entry with the least area enlargement
                if (enlargement < minEnlargement) {
                    minEnlargement = enlargement;
                    minArea = area < minArea ? area : minArea;
                    targetNode = child;

                } else if (enlargement === minEnlargement) {
                    // otherwise choose one with the smallest area
                    if (area < minArea) {
                        minArea = area;
                        targetNode = child;
                    }
                }
            }

            node = targetNode;
        }

        return node;
    }

    _insert(item, level, isNode) {

        let toBBox = this.toBBox,
            bbox = isNode ? item.bbox : toBBox(item),
            insertPath = [];

        // find the best node for accommodating the item, saving all nodes along the path too
        let node = this._chooseSubtree(bbox, this.data, level, insertPath);

        // put the item into the node
        node.children.push(item);
        this.extend(node.bbox, bbox);

        // split on node overflow; propagate upwards if necessary
        while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
                this._split(insertPath, level);
                level--;
            } else break;
        }

        // adjust bboxes along the insertion path
        this._adjustParentBBoxes(bbox, insertPath, level);
    }

    // split overflowed node into two
    _split(insertPath, level) {

        let node = insertPath[level],
            M = node.children.length,
            m = this._minEntries;

        this._chooseSplitAxis(node, m, M);

        let newNode = {
            children: node.children.splice(this._chooseSplitIndex(node, m, M)),
            height: node.height
        };

        if (node.leaf) newNode.leaf = true;

        this.calcBBox(node, this.toBBox);
        this.calcBBox(newNode, this.toBBox);

        if (level) insertPath[level - 1].children.push(newNode);
        else this._splitRoot(node, newNode);
    }

    _splitRoot(node, newNode) {
        // split root node
        this.data = {
            children: [node, newNode],
            height: node.height + 1
        };
        this.calcBBox(this.data, this.toBBox);
    }

    _chooseSplitIndex(node, m, M) {

        let i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;

        minOverlap = minArea = Infinity;

        for (i = m; i <= M - m; i++) {
            bbox1 = this.distBBox(node, 0, i, this.toBBox);
            bbox2 = this.distBBox(node, i, M, this.toBBox);

            overlap = this.intersectionArea(bbox1, bbox2);
            area = this.bboxArea(bbox1) + this.bboxArea(bbox2);

            // choose distribution with minimum overlap
            if (overlap < minOverlap) {
                minOverlap = overlap;
                index = i;

                minArea = area < minArea ? area : minArea;

            } else if (overlap === minOverlap) {
                // otherwise choose distribution with minimum area
                if (area < minArea) {
                    minArea = area;
                    index = i;
                }
            }
        }

        return index;
    }

    // sorts node children by the best axis for split
    _chooseSplitAxis(node, m, M) {

        let compareMinX = node.leaf ? this.compareMinX : this.compareNodeMinX,
            compareMinY = node.leaf ? this.compareMinY : this.compareNodeMinY,
            xMargin = this._allDistMargin(node, m, M, compareMinX),
            yMargin = this._allDistMargin(node, m, M, compareMinY);

        // if total distributions margin value is minimal for x, sort by minX,
        // otherwise it's already sorted by minY
        if (xMargin < yMargin) node.children.sort(compareMinX);
    }

    // total margin of all possible split distributions where each node is at least m full
    _allDistMargin(node, m, M, compare) {

        node.children.sort(compare);

        let toBBox = this.toBBox,
            leftBBox = this.distBBox(node, 0, m, toBBox),
            rightBBox = this.distBBox(node, M - m, M, toBBox),
            margin = this.bboxMargin(leftBBox) + this.bboxMargin(rightBBox),
            i, child;

        for (i = m; i < M - m; i++) {
            child = node.children[i];
            this.extend(leftBBox, node.leaf ? toBBox(child) : child.bbox);
            margin += this.bboxMargin(leftBBox);
        }

        for (i = M - m - 1; i >= m; i--) {
            child = node.children[i];
            this.extend(rightBBox, node.leaf ? toBBox(child) : child.bbox);
            margin += this.bboxMargin(rightBBox);
        }

        return margin;
    }

    _adjustParentBBoxes(bbox, path, level) {
        // adjust bboxes along the given tree path
        for (let i = level; i >= 0; i--) {
            this.extend(path[i].bbox, bbox);
        }
    }

    _condense(path) {
        // go through the path, removing empty nodes and updating bboxes
        for (let i = path.length - 1, siblings; i >= 0; i--) {
            if (path[i].children.length === 0) {
                if (i > 0) {
                    siblings = path[i - 1].children;
                    siblings.splice(siblings.indexOf(path[i]), 1);

                } else this.clear();

            } else this.calcBBox(path[i], this.toBBox);
        }
    }

    _initFormat(format) {
        // data format (minX, minY, maxX, maxY accessors)

        // uses eval-type compilation instead of just accepting a toBBox function
        // because the algorithms are very sensitive to sorting functions performance,
        // so they should be dead simple and without inner calls

        // jshint evil: true

        let compareArr = ['return a', ' - b', ';'];

        this.compareMinX = new Function('a', 'b', compareArr.join(format[0]));
        this.compareMinY = new Function('a', 'b', compareArr.join(format[1]));

        this.toBBox = new Function('a', 'return [a' + format.join(', a') + '];');
    }



// calculate node's bbox from bboxes of its children
    calcBBox(node, toBBox) {
        node.bbox = this.distBBox(node, 0, node.children.length, toBBox);
    }

// min bounding rectangle of node children from k to p-1
    distBBox(node, k, p, toBBox) {
        let bbox = this.empty();

        for (let i = k, child; i < p; i++) {
            child = node.children[i];
            this.extend(bbox, node.leaf ? toBBox(child) : child.bbox);
        }

        return bbox;
    }

    empty() { return [Infinity, Infinity, -Infinity, -Infinity]; }

    extend(a, b) {
        a[0] = Math.min(a[0], b[0]);
        a[1] = Math.min(a[1], b[1]);
        a[2] = Math.max(a[2], b[2]);
        a[3] = Math.max(a[3], b[3]);
        return a;
    }

    compareNodeMinX(a, b) { return a.bbox[0] - b.bbox[0]; }
    compareNodeMinY(a, b) { return a.bbox[1] - b.bbox[1]; }

    bboxArea(a)   { return (a[2] - a[0]) * (a[3] - a[1]); }
    bboxMargin(a) { return (a[2] - a[0]) + (a[3] - a[1]); }

    enlargedArea(a, b) {
        return (Math.max(b[2], a[2]) - Math.min(b[0], a[0])) *
            (Math.max(b[3], a[3]) - Math.min(b[1], a[1]));
    }

    intersectionArea (a, b) {
        let minX = Math.max(a[0], b[0]),
            minY = Math.max(a[1], b[1]),
            maxX = Math.min(a[2], b[2]),
            maxY = Math.min(a[3], b[3]);

        return Math.max(0, maxX - minX) *
            Math.max(0, maxY - minY);
    }

    contains(a, b) {
        return a[0] <= b[0] &&
            a[1] <= b[1] &&
            b[2] <= a[2] &&
            b[3] <= a[3];
    }

    intersects (a, b) {
        return b[0] <= a[2] &&
            b[1] <= a[3] &&
            b[2] >= a[0] &&
            b[3] >= a[1];
    }

// sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
// combines selection algorithm with binary divide & conquer approach

    multiSelect(arr, left, right, n, compare) {
        let stack = [left, right],
            mid;

        while (stack.length) {
            right = stack.pop();
            left = stack.pop();

            if (right - left <= n) continue;

            mid = left + Math.ceil((right - left) / n / 2) * n;
            this.select(arr, left, right, mid, compare);

            stack.push(left, mid, mid, right);
        }
    }

// sort array between left and right (inclusive) so that the smallest k elements come first (unordered)
    select(arr, left, right, k, compare) {
        let n, i, z, s, sd, newLeft, newRight, t, j;

        while (right > left) {
            if (right - left > 600) {
                n = right - left + 1;
                i = k - left + 1;
                z = Math.log(n);
                s = 0.5 * Math.exp(2 * z / 3);
                sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (i - n / 2 < 0 ? -1 : 1);
                newLeft = Math.max(left, Math.floor(k - i * s / n + sd));
                newRight = Math.min(right, Math.floor(k + (n - i) * s / n + sd));
                this.select(arr, newLeft, newRight, k, compare);
            }

            t = arr[k];
            i = left;
            j = right;

            this.swap(arr, left, k);
            if (compare(arr[right], t) > 0) this.swap(arr, left, right);

            while (i < j) {
                this.swap(arr, i, j);
                i++;
                j--;
                while (compare(arr[i], t) < 0) i++;
                while (compare(arr[j], t) > 0) j--;
            }

            if (compare(arr[left], t) === 0) this.swap(arr, left, j);
            else {
                j++;
                this.swap(arr, j, right);
            }

            if (j <= k) left = j + 1;
            if (k <= j) right = j - 1;
        }
    }

    swap(arr, i, j) {
        let tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
}

