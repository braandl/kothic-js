L.TileLayer.Kothic.Clickable = L.TileLayer.Kothic.extend({
    options: {
        pixelThreshold:10
    },

    initialize: function(url, runtime, building_id, floor, options) {
        this._data = {};
        options.useCache = false;
        options.saveToCache = false;
        L.TileLayer.Kothic.prototype.initialize.call(this, url, runtime, building_id, floor, options);
    },

    onAdd: function(map) {
        this._map = map;
        this._map.on("click", L.Util.bind(this._onclick, this));
        L.GridLayer.prototype.onAdd.call(this, map);
    },

    _onclick: function(e) {
        var tileClickPos = this._map.project(e.latlng);
        var tileX = Math.floor(tileClickPos.x / this.options.tileSize);
        var tileY = Math.floor(tileClickPos.y / this.options.tileSize);
        var key = [this._map.getZoom() - this.options.zoomOffset, tileX, tileY].join('/');
        var pixelsToKothicUnits = this._granularity / this.options.tileSize;
        tileClickPos.x %= this.options.tileSize;
        tileClickPos.y %= this.options.tileSize;
        var dataX = tileClickPos.x * pixelsToKothicUnits;
        // we've already inverted the Y axis of the data
        var dataY = tileClickPos.y * pixelsToKothicUnits;
        var threshold = this.options.pixelThreshold * pixelsToKothicUnits;
        var coordinatePos = 0;
        var coordinatePosPolygon = 0;

        var lowest = Number.MAX_VALUE, nearestFeature = null;
        for(var i = 0; i < this._data[key].features.length; i++) {
            if (typeof(this._data[key].features[i].coordinates[0]) === 'object') { // Linestring or Polygon
                //console.log(this._data[key].features[i].coordinates[0][0]);
                for (var j = 0; j < this._data[key].features[i].coordinates.length; j++) {
                    if (typeof(this._data[key].features[i].coordinates[j][0]) === 'number') {
                        var dx = Math.abs(this._data[key].features[i].coordinates[j][0] - dataX),
                            dy = Math.abs(this._data[key].features[i].coordinates[j][1] - dataY);
                        if (dx < threshold && dy < threshold) {
                            var dist = Math.sqrt(dx * dx + dy * dy);
                            if (dist < lowest) {
                                lowest = dist;
                                nearestFeature = this._data[key].features[i];
                                coordinatePos = j;
                            }
                        }
                    } else if (typeof(this._data[key].features[i].coordinates[j][0]) === 'object'){
                        // Implement for Polygons
                    }
                }
                //console.log(this._data[key].features[i].coordinates[0]);
            } else { // Point
                var dx = Math.abs(this._data[key].features[i].coordinates[0] - dataX), dy = Math.abs(this._data[key].features[i].coordinates[1] - dataY);
                if(dx < threshold && dy < threshold) {
                    var dist = Math.sqrt(dx * dx + dy * dy);
                    if(dist < lowest) {
                        lowest = dist;
                        nearestFeature = this._data[key].features[i];
                    }
                }
            }
        }
        if(nearestFeature != null && nearestFeature.type === 'Point') {
            var featLatLng = this._map.unproject(new L.Point(tileX * this.options.tileSize + nearestFeature.coordinates[0] / pixelsToKothicUnits, tileY * this.options.tileSize + nearestFeature.coordinates[1] / pixelsToKothicUnits ) );

            var ev = { latlng: featLatLng, feature: nearestFeature };
            this.fire("featureclick", ev);
        } else if (nearestFeature != null && nearestFeature.type === 'LineString') {

            var featLatLng = this._map.unproject(new L.Point(tileX * this.options.tileSize + nearestFeature.coordinates[coordinatePos][0] / pixelsToKothicUnits, tileY * this.options.tileSize + nearestFeature.coordinates[coordinatePos][1] / pixelsToKothicUnits ) );

            var ev = { latlng: featLatLng, feature: nearestFeature };
            this.fire("featureclick", ev);
        } else if (nearestFeature != null && nearestFeature.type === 'Polygon') {

            var featLatLng = this._map.unproject(new L.Point(tileX * this.options.tileSize + nearestFeature.coordinates[coordinatePos][coordinatePosPolygon][0] / pixelsToKothicUnits, tileY * this.options.tileSize + nearestFeature.coordinates[coordinatePos][coordinatePosPolygon][1] / pixelsToKothicUnits ) );

            var ev = { latlng: featLatLng, feature: nearestFeature };
            this.fire("featureclick", ev);
        }
    },

    _onKothicDataResponse: function(data, zoom, x, y, done) {

        L.TileLayer.Kothic.prototype._onKothicDataResponse.call(this, data, zoom, x, y, done);
        var key = [zoom, x, y].join('/');
        // save for click events
        if(!this._data[key]) {
            this._data[key] = {};
            for(var property in data) {
                if(property != "features") {
                    this._data[key][property] = data[property];
                }
            }
            this._data[key].features = [];
            for(var i = 0; i < data.features.length; i++) {
                //if(data.features[i].type == "Point") {
                    this._data[key].features.push(data.features[i]);
                //}
            }
        }
        this._granularity = data.granularity;
    }
});