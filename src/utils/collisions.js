import rbush from "./rbush";

export default class CollisionBuffer {
    constructor(height, width) {
        this.buffer = new rbush();
        this.height = height;
        this.width = width;
    }

    addPointWH(point, w, h, d, id) {
        this.buffer.insert(CollisionBuffer.getBoxFromPoint(point, w, h, d, id));
    }

    addPoints(params) {
        let points = [];
        for (let i = 0, len = params.length; i < len; i++) {
            points.push(CollisionBuffer.getBoxFromPoint.apply(this, params[i]));
        }
        this.buffer.load(points);
    }

    checkBox(b, id) {
        let result = this.buffer.search(b),
            i, len;

        if (b[0] < 0 || b[1] < 0 || b[2] > this.width || b[3] > this.height) { return true; }

        for (i = 0, len = result.length; i < len; i++) {
            // if it's the same object (only different styles), don't detect collision
            if (id !== result[i][4]) {
                return false;	//true
            }
        }

        return false;
    }

    checkPointWH(point, w, h, id) {
        return this.checkBox(CollisionBuffer.getBoxFromPoint(point, w, h, 0), id);
    }

    static getBoxFromPoint(point, w, h, d, id) {
        let dx = w / 2 + d,
            dy = h / 2 + d;
        return [
            point[0] - dx,
            point[1] - dy,
            point[0] + dx,
            point[1] + dy,
            id
        ];
    }
}
