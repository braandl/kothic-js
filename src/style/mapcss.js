let MapCSSInstance = null;

export default class MapCSS {

    constructor() {
        if (MapCSSInstance == null) {
            MapCSSInstance = this;
            this._styles= {};
            this._availableStyles= [];
            this._images= {};
            this._locales= [];
            this._presence_tags= [];
            this._value_tags= [];
            this._cache= {};
            this._debug= {hit: 0, miss: 0}
        }
        return MapCSSInstance
    }

    static get shared() {
        return new MapCSS();
    }

    get availableStyles() {
        return this._availableStyles;
    }

    static onError() {
    }

    static onImagesLoad() {
    }/**
     * Incalidate styles cache
     */
    invalidateCache() {
        this._cache = {};
    }

    static e_min(/*...*/) {
        return Math.min.apply(null, arguments);
    }

    static e_max(/*...*/) {
        return Math.max.apply(null, arguments);
    }
    static e_any(/*...*/) {
        let i;

        for (i = 0; i < arguments.length; i++) {
            if (typeof(arguments[i]) !== 'undefined' && arguments[i] !== '') {
                return arguments[i];
            }
        }

        return '';
    }
    static e_num(arg) {
        if (!isNaN(parseFloat(arg))) {
            return parseFloat(arg);
        } else {
            return '';
        }
    }
    static e_str(arg) {
        return arg;
    }
    static e_int(arg) {
        return parseInt(arg, 10);
    }
    static e_tag(obj, tag) {
        if (obj.hasOwnProperty(tag) && obj[tag] !== null) {
            return tag;
        } else {
            return '';
        }
    }
    static e_prop(obj, tag) {
        if (obj.hasOwnProperty(tag) && obj[tag] !== null) {
            return obj[tag];
        } else {
            return '';
        }
    }
    static e_sqrt(arg) {
        return Math.sqrt(arg);
    }
    static e_boolean(arg, if_exp, else_exp) {
        if (typeof(if_exp) === 'undefined') {
            if_exp = 'true';
        }

        if (typeof(else_exp) === 'undefined') {
            else_exp = 'false';
        }

        if (arg === '0' || arg === 'false' || arg === '') {
            return else_exp;
        } else {
            return if_exp;
        }
    }
    static e_metric(arg) {
        if (/\d\s*mm$/.test(arg)) {
            return 1000 * parseInt(arg, 10);
        } else if (/\d\s*cm$/.test(arg)) {
            return 100 * parseInt(arg, 10);
        } else if (/\d\s*dm$/.test(arg)) {
            return 10 * parseInt(arg, 10);
        } else if (/\d\s*km$/.test(arg)) {
            return 0.001 * parseInt(arg, 10);
        } else if (/\d\s*in$/.test(arg)) {
            return 0.0254 * parseInt(arg, 10);
        } else if (/\d\s*ft$/.test(arg)) {
            return 0.3048 * parseInt(arg, 10);
        } else {
            return parseInt(arg, 10);
        }
    }
    static  e_zmetric(arg) {
        return MapCSS.shared.e_metric(arg);
    }
    static e_localize(tags, text) {
        let locales = MapCSS.shared._locales, i, tag;

        for (i = 0; i < locales.length; i++) {
            tag = text + ':' + locales[i];
            if (tags[tag]) {
                return tags[tag];
            }
        }

        return tags[text];
    }

    static loadStyle(style, restyle, sprite_images, external_images, presence_tags, value_tags) {
        let i;
        sprite_images = sprite_images || [];
        external_images = external_images || [];

        if (presence_tags) {
            for (i = 0; i < presence_tags.length; i++) {
                if (MapCSS.shared._presence_tags.indexOf(presence_tags[i]) < 0) {
                    MapCSS.shared._presence_tags.push(presence_tags[i]);
                }
            }
        }

        if (value_tags) {
            for (i = 0; i < value_tags.length; i++) {
                if (MapCSS.shared._value_tags.indexOf(value_tags[i]) < 0) {
                    MapCSS.shared._value_tags.push(value_tags[i]);
                }
            }
        }

        MapCSS.shared._styles[style] = {
            restyle: restyle,
            images: sprite_images,
            external_images: external_images,
            textures: {},
            sprite_loaded: !sprite_images,
            external_images_loaded: !external_images.length
        };

        MapCSS.shared._availableStyles.push(style);
    }/**
     * Call MapCSS.shared.onImagesLoad callback if all sprite and external
     * images was loaded
     */
    static _onImagesLoad(style) {
        if (MapCSS.shared._styles[style].external_images_loaded &&
                MapCSS.shared._styles[style].sprite_loaded) {
            MapCSS.onImagesLoad();
        }
    }
    static preloadSpriteImage(style, url) {

        let images = MapCSS.shared._styles[style]._images,
            img = new Image();

        delete MapCSS.shared._styles[style]._images;

        img.onload = function () {
            let image;
            for (image in images) {
                if (images.hasOwnProperty(image)) {
                    images[image].sprite = img;
                    MapCSS.shared._images[image] = images[image];
                }
            }
            MapCSS.shared._styles[style].sprite_loaded = true;
            MapCSS._onImagesLoad(style);
        };
        img.onerror = function (e) {
            MapCSS.onError(e);
        };
        img.src = url;
    }
    static preloadExternalImages(style, urlPrefix) {
        let external_images = MapCSS.shared._styles[style].external_images;
        delete MapCSS.shared._styles[style].external_images;

        urlPrefix = urlPrefix || '';
        let len = external_images.length, loaded = 0, i;

        function loadImage(url) {
            let img = new Image();
            img.onload = function () {
                loaded++;
                MapCSS.shared._images[url] = {
                    sprite: img,
                    height: img.height,
                    width: img.width,
                    offset: 0
                };
                if (loaded === len) {
                    MapCSS.shared._styles[style].external_images_loaded = true;
                    MapCSS._onImagesLoad(style);
                }
            };
            img.onerror = function () {
                loaded++;
                if (loaded === len) {
                    MapCSS.shared._styles[style].external_images_loaded = true;
                    MapCSS._onImagesLoad(style);
                }
            };
            img.src = url;
        }

        for (i = 0; i < len; i++) {
            loadImage(urlPrefix + external_images[i]);
        }
    }
    static getImage(ref) {
        let img = MapCSS.shared._images[ref];

        if (img && img.sprite) {
            let canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            canvas.getContext('2d').drawImage(img.sprite,
                    0, img.offset, img.width, img.height,
                    0, 0, img.width, img.height);

            img = MapCSS.shared._images[ref] = canvas;
        }

        return img;
    }
    getTagKeys(tags, zoom, type, selector) {
        let keys = [], i;
        for (i = 0; i < this._presence_tags.length; i++) {
            if (tags.hasOwnProperty(this._presence_tags[i])) {
                keys.push(this._presence_tags[i]);
            }
        }

        for (i = 0; i < this._value_tags.length; i++) {
            if (tags.hasOwnProperty(this._value_tags[i])) {
                keys.push(this._value_tags[i] + ':' + tags[this._value_tags[i]]);
            }
        }

        return [zoom, type, selector, keys.join(':')].join(':');
    }
    restyle(styleNames, tags, zoom, type, selector) {
        let i, key = this.getTagKeys(tags, zoom, type, selector), actions = this._cache[key] || {};

        if (!this._cache.hasOwnProperty(key)) {
            this._debug.miss += 1;
            for (i = 0; i < styleNames.length; i++) {
                actions = MapCSS.shared._styles[styleNames[i]].restyle(actions, tags, zoom, type, selector);
            }
            this._cache[key] = actions;
        } else {
            this._debug.hit += 1;
        }

        return actions;
    }
}
