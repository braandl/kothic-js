
export default class Geom {

    static transformPoint (point, ws, hs) {
		return [ws * point[0], hs * point[1]];
    }

    static transformPoints (points, ws, hs) {
        let transformed = [], i, len;
        for (i = 0, len = points.length; i < len; i++) {
			if (points[i] !== undefined)
				transformed.push(this.transformPoint(points[i], ws, hs));
        }
        return transformed;
    }

    static getReprPoint (feature) {
        let point, len;
        switch (feature.type) {
        case 'Point':
            point = feature.coordinates;
            break;
        case 'Polygon':
            point = feature.reprpoint;
            break;
        case 'LineString':
            len = Geom.getPolyLength(feature.coordinates);
            point = Geom.getAngleAndCoordsAtLength(feature.coordinates, len / 2, 0);
            point = [point[1], point[2]];
            break;
        case 'GeometryCollection':
            //TODO: Disassemble geometry collection
            return;
        case 'MultiPoint':
			console.log('MultiPoint');
            //TODO: Disassemble multi point
            return;
        case 'MultiPolygon':
            point = feature.reprpoint;
            break;
        case 'MultiLineString':
			console.log('MultiLineString');
            //TODO: Disassemble geometry collection
            return;
        }
        return point;
    }

    static getPolyLength (points) {
        let pointsLen = points.length,
                c, pc, i,
                dx, dy,
                len = 0;

        for (i = 1; i < pointsLen; i++) {
            c = points[i];
            pc = points[i - 1];
            dx = pc[0] - c[0];
            dy = pc[1] - c[1];
            len += Math.sqrt(dx * dx + dy * dy);
        }
        return len;
    }

    static getAngleAndCoordsAtLength (points, dist, width) {
        let pointsLen = points.length,
            dx, dy, x, y,
            i, c, pc,
            len = 0,
            segLen = 0,
            angle, partLen, sameseg = true,
            gotxy = false;

        width = width || 0; // by default we think that a letter is 0 px wide

        for (i = 1; i < pointsLen; i++) {
            if (gotxy) {
                sameseg = false;
            }

            c = points[i];
            pc = points[i - 1];

            dx = c[0] - pc[0];
            dy = c[1] - pc[1];
            segLen = Math.sqrt(dx * dx + dy * dy);

            if (!gotxy && len + segLen >= dist) {
                partLen = dist - len;
                x = pc[0] + dx * partLen / segLen;
                y = pc[1] + dy * partLen / segLen;

                gotxy = true;
            }

            if (gotxy && len + segLen >= dist + width) {
                partLen = dist + width - len;
                dx = pc[0] + dx * partLen / segLen;
                dy = pc[1] + dy * partLen / segLen;
                angle = Math.atan2(dy - y, dx - x);

                if (sameseg) {
                    return [angle, x, y, segLen - partLen];
                } else {
                    return [angle, x, y, 0];
                }
            }

            len += segLen;
        }
    }
}

