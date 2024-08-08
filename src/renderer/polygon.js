import MapCSS from "../style/mapcss";
import Style from "../style/style";
import Path from "./path";

let polygon = null;

export default class Polygon {

    constructor() {
        if (polygon == null) {
            polygon = this;
        }
        return polygon
    }

    static get shared() {
        return new Polygon();
    }

    render(ctx, feature, nextFeature, ws, hs, granularity) {
        let style = feature.style,
            nextStyle = nextFeature && nextFeature.style;

        if (!this.pathOpened) {
            this.pathOpened = true;
            ctx.beginPath();
        }

        new Path(ctx, feature, false, true, ws, hs, granularity);

        if (nextFeature &&
                (nextStyle['fill-color'] === style['fill-color']) &&
                (nextStyle['fill-image'] === style['fill-image']) &&
                (nextStyle['fill-opacity'] === style['fill-opacity'])) {
            return;
        }

        this.fill(ctx, style);

        this.pathOpened = false;
    }

    fill(ctx, style, fillFn) {
        let opacity = style["fill-opacity"] || style.opacity, image;

        if (style.hasOwnProperty('fill-color')) {
            // first pass fills with solid color
            Style.setStyles(ctx, {
                fillStyle: style["fill-color"] || "#000000",
                globalAlpha: opacity || 1
            });
            if (fillFn) {
                fillFn();
            } else {
                ctx.fill();
            }
        }

        if (style.hasOwnProperty('fill-image')) {
            // second pass fills with texture
            image = MapCSS.getImage(style['fill-image']);
            if (image) {
                Style.setStyles(ctx, {
                    fillStyle: ctx.createPattern(image, 'repeat'),
                    globalAlpha: opacity || 1
                });
                if (fillFn) {
                    fillFn();
                } else {
                    ctx.fill();
                }
            }
        }
    }
}
