import MapCSS from './style/mapcss';
import CollisionBuffer from "./utils/collisions";
import Style from "./style/style";
import Polygon from "./renderer/polygon";
import Line from "./renderer/line";
import Shields from "./renderer/shields";
import Texticons from "./renderer/texticons";

/*
 (c) 2013, Darafei Praliaskouski, Vladimir Agafonkin, Maksim Gurtovenko
 Kothic JS is a full-featured JavaScript map rendering engine using HTML5 Canvas.
 http://github.com/kothic/kothic-js
*/
export default class Kothic {

    static render(canvas, data, zoom, options) {

        if (data == null) return;
        if (typeof canvas === 'string') {
            canvas = document.getElementById(canvas);
        }


        let styles = (options && options.styles) || [];
        MapCSS.shared._locales = (options && options.locales) || [];

        let devicePixelRatio = Math.max(window.devicePixelRatio || 1, 2);

        let width = canvas.width,
            height = canvas.height;

        if (devicePixelRatio !== 1) {
            canvas.style.width = width + 'px';
            canvas.style.height = height + 'px';
            canvas.width = canvas.width * devicePixelRatio;
            canvas.height = canvas.height * devicePixelRatio;
        }

        let ctx = canvas.getContext('2d');
        ctx.scale(devicePixelRatio, devicePixelRatio);


        let granularity = data.granularity,
            ws = width / granularity, hs = height / granularity,
            collisionBuffer = new CollisionBuffer(height, width);

        //console.time('styles');

        // setup layer styles
        let layers = Style.populateLayers(data.features, zoom, styles),
            layerIds = Kothic.getLayerIds(layers);

        // render the map
        Style.setStyles(ctx, Style.defaultCanvasStyles);

        //console.timeEnd('styles');

        Kothic.getFrame(function () {
            //console.time('geometry');
            Kothic._renderBackground(ctx, width, height, zoom, styles);
            Kothic._renderGeometryFeatures(layerIds, layers, ctx, ws, hs, granularity);

            if (options && options.onRenderComplete) {
                options.onRenderComplete();
            }

            //console.timeEnd('geometry');

            Kothic.getFrame(function () {
                //console.time('text/icons');
                Kothic._renderTextAndIcons(layerIds, layers, ctx, ws, hs, collisionBuffer);
                //console.timeEnd('text/icons');

                //Kothic._renderCollisions(ctx, collisionBuffer.buffer.data);
            });
        });
    }

    static _renderCollisions(ctx, node) {
        let i, len, a;
        if (node.leaf) {
            for (i = 0, len = node.children.length; i < len; i++) {
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 1;
                a = node.children[i];
                ctx.strokeRect(Math.round(a[0]), Math.round(a[1]), Math.round(a[2] - a[0]), Math.round(a[3] - a[1]));
            }
        } else {
            for (i = 0, len = node.children.length; i < len; i++) {
                Kothic._renderCollisions(ctx, node.children[i]);
            }
        }
    }

    static getLayerIds(layers) {
        return Object.keys(layers).sort(function (a, b) {
            return parseInt(a, 10) - parseInt(b, 10);
        });
    }

    static getFrame(fn) {
        let reqFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                       window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

        reqFrame.call(window, fn);
    }

    static _renderBackground(ctx, width, height, zoom, styles) {
        let style = MapCSS.shared.restyle(styles, {}, {}, zoom, 'canvas', 'canvas');

        let fillRect = function () {
            ctx.fillRect(-1, -1, width + 1, height + 1);
        };

        for (let i in style) {
            Polygon.shared.fill(ctx, style[i], fillRect);
        }
    }

    static _renderGeometryFeatures(layerIds, layers, ctx, ws, hs, granularity) {
        let layersToRender = {},
            i, j, len, features, style, queue, bgQueue;


        for (i = 0; i < layerIds.length; i++) {
            features = layers[layerIds[i]];

            bgQueue = layersToRender._bg = layersToRender._bg || {};
            queue = layersToRender[layerIds[i]] = layersToRender[layerIds[i]] || {};

            for (j = 0, len = features.length; j < len; j++) {
                style = features[j].style;

                if ('fill-color' in style || 'fill-image' in style) {
                    if (style['fill-position'] === 'background') {
                        bgQueue.polygons = bgQueue.polygons || [];
                        bgQueue.polygons.push(features[j]);
                    } else {
                        queue.polygons = queue.polygons || [];
                        queue.polygons.push(features[j]);
                    }
                }

                if ('casing-width' in style) {
                    queue.casings = queue.casings || [];
                    queue.casings.push(features[j]);
                }

                if ('width' in style) {
                    queue.lines = queue.lines || [];
                    queue.lines.push(features[j]);
                }
            }
        }

        layerIds = ['_bg'].concat(layerIds);

        for (i = 0; i < layerIds.length; i++) {
            queue = layersToRender[layerIds[i]];
            if (!queue)
                continue;

            if (queue.polygons) {
                for (j = 0, len = queue.polygons.length; j < len; j++) {
                    Polygon.shared.render(ctx, queue.polygons[j], queue.polygons[j + 1], ws, hs, granularity);
                }
            }
            if (queue.casings) {
                ctx.lineCap = 'butt';
                for (j = 0, len = queue.casings.length; j < len; j++) {
                    Line.shared.renderCasing(ctx, queue.casings[j], queue.casings[j + 1], ws, hs, granularity);
                }
            }
            if (queue.lines) {
                ctx.lineCap = 'round';
                for (j = 0, len = queue.lines.length; j < len; j++) {
                    Line.shared.render(ctx, queue.lines[j], queue.lines[j + 1], ws, hs, granularity);
                }
            }
        }
    }

    static _renderTextAndIcons(layerIds, layers, ctx, ws, hs, collisionBuffer) {
        //TODO: Move to the features detector
        let j, style, i,
            passes = [];

        for (i = 0; i < layerIds.length; i++) {
            let features = layers[layerIds[i]],
                featuresLen = features.length;

            // render icons without text
            for (j = featuresLen - 1; j >= 0; j--) {
                style = features[j].style;
                if (style.hasOwnProperty('icon-image') && !style.text) {
                    Texticons.render(ctx, features[j], collisionBuffer, ws, hs, false, true);
                }
            }

            // render text on features without icons
            for (j = featuresLen - 1; j >= 0; j--) {
                style = features[j].style;
                if (!style.hasOwnProperty('icon-image') && style.text) {
                    Texticons.render(ctx, features[j], collisionBuffer, ws, hs, true, false);
                }
            }

            // for features with both icon and text, render both or neither
            for (j = featuresLen - 1; j >= 0; j--) {
                style = features[j].style;
                if (style.hasOwnProperty('icon-image') && style.text) {
                    Texticons.render(ctx, features[j], collisionBuffer, ws, hs, true, true);
                }
            }

            // render shields with text
            for (j = featuresLen - 1; j >= 0; j--) {
                style = features[j].style;
                if (style['shield-text']) {
                    Shields.render(ctx, features[j], collisionBuffer, ws, hs);
                }
            }
        }

        return passes;
    }
};