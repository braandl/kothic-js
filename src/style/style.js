import MapCSS from "./mapcss";

export default class Style {

    constructor() {
        this._defaultCanvasStyles = {
            strokeStyle: 'rgba(0,0,0,0.5)',
            fillStyle:
                'rgba(0,0,0,0.5)',
            lineWidth:
                1,
            lineCap:
                'round',
            lineJoin:
                'round',
            textAlign:
                'center',
            textBaseline:
                'middle'
        }
    }


    static get defaultCanvasStyles() {
        return this._defaultCanvasStyles;
    }

    static populateLayers(features, zoom, styles) {
        let layers = {},
            i, len, feature, layerId, layerStyle;

        let styledFeatures = Style.styleFeatures(features, zoom, styles);

        for (i = 0, len = styledFeatures.length; i < len; i++) {
            feature = styledFeatures[i];
            layerStyle = feature.style['-x-mapnik-layer'];
            layerId = !layerStyle ? feature.properties.layer || 1000 :
                layerStyle === 'top' ? 10000 : layerStyle;

            layers[layerId] = layers[layerId] || [];
            layers[layerId].push(feature);
        }

        return layers;
    }

    static getStyle(feature, zoom, styleNames) {
        let shape = feature.type,
            type, selector;
        if (shape === 'LineString' || shape === 'MultiLineString') {
            type = 'way';
            selector = 'line';
        } else if (shape === 'Polygon' || shape === 'MultiPolygon') {
            type = 'way';
            selector = 'area';
        } else if (shape === 'Point' || shape === 'MultiPoint') {
            type = 'node';
            selector = 'node';
        }

        return MapCSS.shared.restyle(styleNames, feature.properties, zoom, type, selector);
    }

    static styleFeatures(features, zoom, styleNames) {
        let styledFeatures = [],
            i, j, len, feature, style, restyledFeature, k;

        for (i = 0, len = features.length; i < len; i++) {
            feature = features[i];
            style = Style.getStyle(feature, zoom, styleNames);
            for (j in style) {
                if (j === 'default') {
                    restyledFeature = feature;
                } else {
                    restyledFeature = {};
                    for (k in feature) {
                        restyledFeature[k] = feature[k];
                    }
                }

                restyledFeature.kothicId = i + 1;
                restyledFeature.style = style[j];
                restyledFeature.zIndex = style[j]['z-index'] || 0;
                restyledFeature.sortKey = restyledFeature.zIndex;

                styledFeatures.push(restyledFeature);
            }
        }


        styledFeatures.sort(function (a, b) {
            return a.zIndex < b.zIndex ? -1 :
                a.zIndex > b.zIndex ? 1 : 0;
        });

        return styledFeatures;
    }

    static getFontString(name, size, st) {
        name = name || '';
        size = size || 9;

        let family = name ? name + ', ' : '';

        name = name.toLowerCase();

        let styles = [];
        if (st['font-style'] === 'italic' || st['font-style'] === 'oblique') {
            styles.push(st['font-style']);
        }
        if (st['font-letiant'] === 'small-caps') {
            styles.push(st['font-letiant']);
        }
        if (st['font-weight'] === 'bold') {
            styles.push(st['font-weight']);
        }

        styles.push(size + 'px');

        if (name.indexOf('serif') !== -1 && name.indexOf('sans-serif') === -1) {
            family += 'Georgia, serif';
        } else {
            family += '"Helvetica Neue", Arial, Helvetica, sans-serif';
        }
        styles.push(family);

        return styles.join(' ');
    }

    static setStyles(ctx, styles) {
        let i;
        for (i in styles) {
            if (styles.hasOwnProperty(i)) {
                ctx[i] = styles[i];
            }
        }
    }
}