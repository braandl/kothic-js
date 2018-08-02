//var p = MercatorProjection;
import L from "leaflet";
import MapCSS from "../../kothic/src/style/mapcss";
import Kothic from "./kothic";

L.TileLayer.Kothic = L.GridLayer.extend({
    options: {
        tileSize: 256,
        zoomOffset: 0,
        minZoom: 12,
        maxZoom: 22,
        updateWhenIdle: Boolean(navigator.userAgent.match(/(iPad|iPhone|iPod|iTerminal|contagt|Android|android)/g) ? true : false),
        unloadInvisibleTiles: false,
        buffered: true,
        async: true,
        trackResize: true,
        useCache: Boolean(!navigator.userAgent.match(/(iPad|iPhone|iPod|iTerminal|contagt|Android|android)/g) ? true : false),
        saveToCache: false, //Boolean( !navigator.userAgent.match(/(iPad|iPhone|iPod|iTerminal|contagt|Android|android)/g) ? true : false ),
        attribution: '&copy <a target="_blank" href="https://contagt.com">contagt</a> 2018',
        styles: MapCSS.shared._availableStyles
    },

    initialize: function (url, runtime, building_id, floor, options) {
        console.log("initialize");
        L.Util.setOptions(this, options);
        this.runtime = runtime;
        this.buildingId = building_id;
        this.currentFloor = floor;
        this._url = url;
        this._canvases = {};
        this._scripts = {};
        this._debugMessages = [];
        this.layer = {};
        window.onKothicDataResponse = L.Util.bind(this._onKothicDataResponse, this);
    },

    invalidate: function () {
        if (this.options.useCache) {
            this._truncateTable();
        } else {
            console.log("table has no cache-database");
        }
    },

    _onKothicDataResponse: function (data, zoom, x, y, done) {
        var self = this;
        var error;

        var key = [zoom, x, y].join('/'),
            zoomOffset = this.options.zoomOffset,
            url = self._url.replace('{x}', x).replace('{y}', y).replace('{z}', zoom - zoomOffset),
            canvas = this._canvases[key],
            layer = this;


        if (!canvas) {
            return;
        }


        function onRenderComplete() {

            if (self.options.saveToCache) {
                setTimeout(function () {
                    self._saveTile(canvas, url);
                }, 0);
            }
            if (!self.options.dryrun) {
                done(error, canvas);
            }
            delete layer._scripts[key];
        }

        var styles = this.options.styles;

        Kothic.render(canvas, data, zoom + zoomOffset, {
            styles: styles,
            locales: ['de'],
            onRenderComplete: onRenderComplete
        });
        delete this._canvases[key];
    },

    getDebugMessages: function () {
        return this._debugMessages;
    },

    drawTile: function (canvas, tilePoint, zoom, done) {
        var self = this;
        var zoomOffset = self.options.zoomOffset,
            key = [(zoom - zoomOffset), tilePoint.x, tilePoint.y].join('/'),
            url = self._url.replace('{x}', tilePoint.x).replace('{y}', tilePoint.y).replace('{z}', zoom - zoomOffset);
        self._canvases[key] = canvas;
        self._loadScript(url, tilePoint, zoom - zoomOffset, done);
    },

    createTile: function (coords, done) {
        var tile = L.DomUtil.create('canvas', 'leaflet-tile');
        var self = this;
        var zoomOffset = self.options.zoomOffset,
            key = [(coords.z - zoomOffset), coords.x, coords.y].join('/'),
            url = self._url.replace('{x}', coords.x).replace('{y}', coords.y).replace('{z}', coords.z - zoomOffset);
        self._canvases[key] = tile;
        self._loadScript(url, coords, coords.z - zoomOffset, done);
        return tile;
    },

    enableStyle: function (name) {
        if (MapCSS._availableStyles.indexOf(name) >= 0 && this.options.styles.indexOf(name) < 0) {
            this.options.styles.push(name);
            this.redraw();
        }
    },

    disableStyle: function (name) {
        if (this.options.styles.indexOf(name) >= 0) {
            var i = this.options.styles.indexOf(name);
            this.options.styles.splice(i, 1);
            this.redraw();
        }
    },

    redraw: function () {
        MapCSS.invalidateCache();
        this._map.getPanes().tilePane.empty = false;
        if (this._map && this._map._container) {
            this._update();
        }
    },

    _loadScript: function (url, tilePoint, zoom, done) {
        this.runtime(this, "GetMapTile",
            {
                building_id: this.buildingId,
                floor: this.currentFloor,
                x: tilePoint.x,
                y: tilePoint.y,
                z: zoom
            }, function (response) {
                var content = null;
                if (response.type === ".msgpack") {
                    content = msgpack.unpack(atob(response.res));
                } else if (response.type === ".json") {
                    content = JSON.parse(response.res);
                }
                this._onKothicDataResponse(content, zoom, tilePoint.x, tilePoint.y, done);
            });
    }
});

export default L.TileLayer.Kothic;