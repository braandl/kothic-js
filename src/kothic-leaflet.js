import L from "leaflet";
import MapCSS from "../../kothic/src/style/mapcss";
import Kothic from "./kothic";
import PouchDB from "pouchdb";

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
        saveToCache: Boolean( !navigator.userAgent.match(/(iPad|iPhone|iPod|iTerminal|contagt|Android|android)/g) ? true : false ),
        attribution: '&copy <a target="_blank" href="https://contagt.com">contagt</a> 2018',
        styles: MapCSS.shared._availableStyles
    },

    initialize: function (url, runtime, building_id, floor, options) {
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
        let self = this;
        let error;

        let key = [zoom, x, y].join('/'),
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

        let styles = this.options.styles;

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
        let self = this;
        let zoomOffset = self.options.zoomOffset,
            key = [(zoom - zoomOffset), tilePoint.x, tilePoint.y].join('/'),
            url = self._url.replace('{x}', tilePoint.x).replace('{y}', tilePoint.y).replace('{z}', zoom - zoomOffset);
        self._canvases[key] = canvas;
        self._loadScript(url, tilePoint, zoom - zoomOffset, done);
    },

    drawTileWithUrl: function(canvas, cachedUrl, tilePoint, zoom, done) {
        let self = this;
        let zoomOffset = self.options.zoomOffset,
            key = [(zoom - zoomOffset), tilePoint.x, tilePoint.y].join('/'),
            url=cachedUrl;
        self._canvases[key] = canvas;
        self._loadScript(url, tilePoint, zoom-zoomOffset, done);
    },

    createTile: function(coords, done) {
        let tile = L.DomUtil.create('canvas', 'leaflet-tile');
        let self = this;
        let size = this.getTileSize();
        tile.width = size.x;
        tile.height = size.y;
        setTimeout(function() {
            let zoomOffset = self.options.zoomOffset,
                key = [(coords.z - zoomOffset), coords.x, coords.y].join('/'),
                url=self._url.replace('{x}',coords.x).
                replace('{y}',coords.y).
                replace('{z}',coords.z-zoomOffset);
            self._canvases[key] = tile;
            self._loadScript(url, coords, coords.z-zoomOffset, done);
        },0);
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
            let i = this.options.styles.indexOf(name);
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
                let content = null;
                /*if (response.type === ".msgpack") {
                    content = msgpack.unpack(atob(response.res));
                } else*/ if (response.type === ".json") {
                    content = JSON.parse(response.res);
                    this._onKothicDataResponse(content, zoom, tilePoint.x, tilePoint.y, done);
                } else {
                    console.error("msgpack not supported in this version.");
                }
            });
    }
});

L.TileLayer.Kothic.addInitHook(function() {

    if (!this.options.useCache) {
        this._db     = null;
        this._canvas = null;
        return;
    }

    this._db = new PouchDB('contagt-vector-tiles', {size: 100});
    this._canvas = document.createElement('canvas');

    if (!(this._canvas.getContext && this._canvas.getContext('2d'))) {
        // HTML5 canvas is needed to pack the tiles as base64 data. If
        //   the browser doesn't support canvas, the code will forcefully
        //   skip caching the tiles.
        this._canvas = null;
    }
});

L.TileLayer.prototype.options.useCache     = true;
L.TileLayer.prototype.options.saveToCache  = true;
L.TileLayer.prototype.options.useOnlyCache = false;
L.TileLayer.prototype.options.cacheMaxAge  = 24*3600 * 1000;

L.TileLayer.Kothic.include({
    _truncateTable: function() {
        let self = this;
        this._db.destroy().then(function () {
            console.log("Deleted Table. Recreated.");
            self._db = new PouchDB('contagt-vector-tiles', {size: 100});
        });
    },

    // Overwrites L.TileLayer.prototype._loadTile
    createTile: function(tilePoint, done) {

        // create a <canvas> element for drawing
        let tile = L.DomUtil.create('canvas', 'leaflet-tile');
        // setup tile width and height according to the options
        let size = this.getTileSize();
        tile.width = size.x;
        tile.height = size.y;

        tile._layer  = this;
        tile.onerror = this._tileOnError;

        //this._map._adjustTilePoint(tilePoint);

        let tileUrl = this._getTileUrl(tilePoint);
        this.fire('tileloadstart', {
            tile: tile,
            url: tileUrl
        });

        let self = this;
        setTimeout(function() {
            if (self.options.useCache && self._canvas) {
                self._db.get(tileUrl, {revs_info: true}, self._onCacheLookup(tile, tileUrl, tilePoint, done));
            } else if (self._map != null) {
                // Fall back to standard behaviour
                tile.onload = self._tileOnLoad;
                tile.src = tileUrl;
                self.drawTile(tile, tilePoint, tilePoint.z, done);
            }
        }, 1);

        return tile;
    },

    _getTileUrl: function(tilePoint) {
        return this._url.replace('{x}',tilePoint.x).
        replace('{y}',tilePoint.y).
        replace('{z}',tilePoint.z);
    },

    // Returns a callback (closure over tile/key/originalSrc) to be run when the DB
    //   backend is finished with a fetch operation.
    _onCacheLookup: function(tile,tileUrl,tilePoint, done) {
        return function(err,data) {
            if (data && this._map != null) {
                this.fire('tilecachehit', {
                    tile: tile,
                    url: tileUrl
                });
                if (Date.now() > data.timestamp + this.options.cacheMaxAge && !this.options.useOnlyCache) {

                    // Tile is too old, try to refresh it
// 					console.log('Tile is too old: ', tileUrl);
                    this.drawTileWithUrl(tile, tileUrl, tilePoint, tilePoint.z, done);
                    tile.onerror = function(ev) {
                        // If the tile is too old but couldn't be fetched from the network,
                        //   serve the one still in cache.
                        let ctx = tile.getContext("2d");
                        let image = new Image();
                        image.src = data.dataUrl;
                        image.onload = function () {
                            ctx.drawImage(image,0,0, 256, 256);
                        };
                        //self.tileDrawn(tile);
                        done(err, tile);
                    }
                } else {
                    // Serve tile from cached data
// 					console.log('Tile is cached: ', tileUrl);
                    let ctx = tile.getContext("2d");
                    let image = new Image();
                    image.src = data.dataUrl;
                    image.onload = function () {
                        ctx.drawImage(image,0, 0, 256, 256);
                    };
                    //this.tileDrawn(tile);
                    done(err, tile);
                }
            } else if (this._map != null) {
                this.fire('tilecachemiss', {
                    tile: tile,
                    url: tileUrl
                });
                if (this.options.useOnlyCache) {
                    // Offline, not cached
// 					console.log('Tile not in cache', tileUrl);
                    this.drawTileWithUrl(tile, L.Util.emptyImageUrl, tilePoint, tilePoint.z, done);
                } else {
                    // Online, not cached, request the tile normally
// 					console.log('Requesting tile normally', tileUrl);
                    this.drawTileWithUrl(tile, tileUrl, tilePoint, tilePoint.z, done);
                }
            }
        }.bind(this);
    },

    // Returns an event handler (closure over DB key), which runs
    //   when the tile (which is an <img>) is ready.
    // The handler will delete the document from pouchDB if an existing revision is passed.
    //   This will keep just the latest valid copy of the image in the cache.
    _saveTile: function(canvas, tileUrl, existingRevision) {
        this._canvas = canvas;
        if (this._canvas === null) return;
        let dataUrl = this._canvas.toDataURL('image/png');
        let doc = {_id: tileUrl, dataUrl: dataUrl, timestamp: Date.now()};

        if (existingRevision) {
            this._db.remove(doc);
        }
        this._db.put(doc);
    },


    // Seeds the cache given a bounding box (latLngBounds), and
    //   the minimum and maximum zoom levels
    // Use with care! This can spawn thousands of requests and
    //   flood tileservers!
    seed: function(bbox, minZoom, maxZoom) {
        if (minZoom > maxZoom) return;
        if (!this._map) return;

        let queue = [];

        for (let z = minZoom; z<maxZoom; z++) {

            let northEastPoint = this._map.project(bbox.getNorthEast(),z);
            let southWestPoint = this._map.project(bbox.getSouthWest(),z);

            // Calculate tile indexes as per L.TileLayer._update and
            //   L.TileLayer._addTilesFromCenterOut
            let tileSize   = this._getTileSize();
            let tileBounds = L.bounds(
                northEastPoint.divideBy(tileSize)._floor(),
                southWestPoint.divideBy(tileSize)._floor());

            for (let j = tileBounds.min.y; j <= tileBounds.max.y; j++) {
                for (let i = tileBounds.min.x; i <= tileBounds.max.x; i++) {
                    point = new L.Point(i, j);
                    point.z = z;
                    queue.push(this.getTileUrl(point));
                }
            }
        }

        let seedData = {
            bbox: bbox,
            minZoom: minZoom,
            maxZoom: maxZoom,
            queueLength: queue.length
        };
        this.fire('seedstart', seedData);
        let tile = this._createTile();
        tile._layer = this;
        this._seedOneTile(tile, queue, seedData);
    },

    // Uses a defined tile to eat through one item in the queue and
    //   asynchronously recursively call itself when the tile has
    //   finished loading.
    _seedOneTile: function(tile, remaining, seedData) {
        if (!remaining.length) {
            this.fire('seedend', seedData);
            return;
        }
        this.fire('seedprogress', {
            bbox:    seedData.bbox,
            minZoom: seedData.minZoom,
            maxZoom: seedData.maxZoom,
            queueLength: seedData.queueLength,
            remainingLength: remaining.length
        });

        let url = remaining.pop();

        this._db.get(url, function(err,data){
            if (!data) {
                tile.onload = function(ev){
                    this._saveTile(url)(ev);
                    this._seedOneTile(tile, remaining, seedData);
                }.bind(this);
                tile.crossOrigin = 'Anonymous';
                tile.src = url;
            } else {
                this._seedOneTile(tile, remaining, seedData);
            }
        }.bind(this));

    }
});

export default L.TileLayer.Kothic;