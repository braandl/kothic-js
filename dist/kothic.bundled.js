(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

require("./kothic.js");
require("./renderer/line.js");
require("./renderer/path.js");
require("./renderer/polygon.js");
require("./renderer/texticons.js");
require("./renderer/shields.js");
require("./renderer/text.js");
require("./style/mapcss.js");
require("./style/style.js");
require("./style/osmosnimki.js");
require("./utils/collisions.js");
require("./utils/geom.js");
require("./utils/rbush.js");

},{"./kothic.js":2,"./renderer/line.js":3,"./renderer/path.js":4,"./renderer/polygon.js":5,"./renderer/shields.js":6,"./renderer/text.js":7,"./renderer/texticons.js":8,"./style/mapcss.js":9,"./style/osmosnimki.js":10,"./style/style.js":11,"./utils/collisions.js":12,"./utils/geom.js":13,"./utils/rbush.js":14}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mapcss = _interopRequireDefault(require("./style/mapcss"));
var _collisions = _interopRequireDefault(require("./utils/collisions"));
var _style = _interopRequireDefault(require("./style/style"));
var _polygon = _interopRequireDefault(require("./renderer/polygon"));
var _line = _interopRequireDefault(require("./renderer/line"));
var _shields = _interopRequireDefault(require("./renderer/shields"));
var _texticons = _interopRequireDefault(require("./renderer/texticons"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/*
 (c) 2013, Darafei Praliaskouski, Vladimir Agafonkin, Maksim Gurtovenko
 Kothic JS is a full-featured JavaScript map rendering engine using HTML5 Canvas.
 http://github.com/kothic/kothic-js
*/
var Kothic = exports["default"] = /*#__PURE__*/function () {
  function Kothic() {
    _classCallCheck(this, Kothic);
  }
  return _createClass(Kothic, null, [{
    key: "render",
    value: function render(canvas, data, zoom, options) {
      if (data == null) return;
      if (typeof canvas === 'string') {
        canvas = document.getElementById(canvas);
      }
      var styles = options && options.styles || [];
      _mapcss["default"].shared._locales = options && options.locales || [];
      var devicePixelRatio = Math.max(window.devicePixelRatio || 1, 2);
      var width = canvas.width,
        height = canvas.height;
      if (devicePixelRatio !== 1) {
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        canvas.width = canvas.width * devicePixelRatio;
        canvas.height = canvas.height * devicePixelRatio;
      }
      var ctx = canvas.getContext('2d');
      ctx.scale(devicePixelRatio, devicePixelRatio);
      var granularity = data.granularity,
        ws = width / granularity,
        hs = height / granularity,
        collisionBuffer = new _collisions["default"](height, width);

      //console.time('styles');

      // setup layer styles
      var layers = _style["default"].populateLayers(data.features, zoom, styles),
        layerIds = Kothic.getLayerIds(layers);

      // render the map
      _style["default"].setStyles(ctx, _style["default"].defaultCanvasStyles);

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
  }, {
    key: "_renderCollisions",
    value: function _renderCollisions(ctx, node) {
      var i, len, a;
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
  }, {
    key: "getLayerIds",
    value: function getLayerIds(layers) {
      return Object.keys(layers).sort(function (a, b) {
        return parseInt(a, 10) - parseInt(b, 10);
      });
    }
  }, {
    key: "getFrame",
    value: function getFrame(fn) {
      var reqFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
      reqFrame.call(window, fn);
    }
  }, {
    key: "_renderBackground",
    value: function _renderBackground(ctx, width, height, zoom, styles) {
      var style = _mapcss["default"].shared.restyle(styles, {}, {}, zoom, 'canvas', 'canvas');
      var fillRect = function fillRect() {
        ctx.fillRect(-1, -1, width + 1, height + 1);
      };
      for (var i in style) {
        _polygon["default"].shared.fill(ctx, style[i], fillRect);
      }
    }
  }, {
    key: "_renderGeometryFeatures",
    value: function _renderGeometryFeatures(layerIds, layers, ctx, ws, hs, granularity) {
      var layersToRender = {},
        i,
        j,
        len,
        features,
        style,
        queue,
        bgQueue;
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
        if (!queue) continue;
        if (queue.polygons) {
          for (j = 0, len = queue.polygons.length; j < len; j++) {
            _polygon["default"].shared.render(ctx, queue.polygons[j], queue.polygons[j + 1], ws, hs, granularity);
          }
        }
        if (queue.casings) {
          ctx.lineCap = 'butt';
          for (j = 0, len = queue.casings.length; j < len; j++) {
            _line["default"].shared.renderCasing(ctx, queue.casings[j], queue.casings[j + 1], ws, hs, granularity);
          }
        }
        if (queue.lines) {
          ctx.lineCap = 'round';
          for (j = 0, len = queue.lines.length; j < len; j++) {
            _line["default"].shared.render(ctx, queue.lines[j], queue.lines[j + 1], ws, hs, granularity);
          }
        }
      }
    }
  }, {
    key: "_renderTextAndIcons",
    value: function _renderTextAndIcons(layerIds, layers, ctx, ws, hs, collisionBuffer) {
      //TODO: Move to the features detector
      var j,
        style,
        i,
        passes = [];
      for (i = 0; i < layerIds.length; i++) {
        var features = layers[layerIds[i]],
          featuresLen = features.length;

        // render icons without text
        for (j = featuresLen - 1; j >= 0; j--) {
          style = features[j].style;
          if (style.hasOwnProperty('icon-image') && !style.text) {
            _texticons["default"].render(ctx, features[j], collisionBuffer, ws, hs, false, true);
          }
        }

        // render text on features without icons
        for (j = featuresLen - 1; j >= 0; j--) {
          style = features[j].style;
          if (!style.hasOwnProperty('icon-image') && style.text) {
            _texticons["default"].render(ctx, features[j], collisionBuffer, ws, hs, true, false);
          }
        }

        // for features with both icon and text, render both or neither
        for (j = featuresLen - 1; j >= 0; j--) {
          style = features[j].style;
          if (style.hasOwnProperty('icon-image') && style.text) {
            _texticons["default"].render(ctx, features[j], collisionBuffer, ws, hs, true, true);
          }
        }

        // render shields with text
        for (j = featuresLen - 1; j >= 0; j--) {
          style = features[j].style;
          if (style['shield-text']) {
            _shields["default"].render(ctx, features[j], collisionBuffer, ws, hs);
          }
        }
      }
      return passes;
    }
  }]);
}();
;

},{"./renderer/line":3,"./renderer/polygon":5,"./renderer/shields":6,"./renderer/texticons":8,"./style/mapcss":9,"./style/style":11,"./utils/collisions":12}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _path = _interopRequireDefault(require("./path"));
var _style = _interopRequireDefault(require("../style/style"));
var _mapcss = _interopRequireDefault(require("../style/mapcss"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var line = null;
var Line = exports["default"] = /*#__PURE__*/function () {
  function Line() {
    _classCallCheck(this, Line);
    if (line == null) {
      line = this;
      this.pathOpened = false;
    }
    return line;
  }
  return _createClass(Line, [{
    key: "renderCasing",
    value: function renderCasing(ctx, feature, nextFeature, ws, hs, granularity) {
      var style = feature.style,
        nextStyle = nextFeature && nextFeature.style;
      if (!this.pathOpened) {
        this.pathOpened = true;
        ctx.beginPath();
      }
      new _path["default"](ctx, feature, style["casing-dashes"] || style.dashes, false, ws, hs, granularity);
      if (nextFeature && nextStyle.width === style.width && nextStyle['casing-width'] === style['casing-width'] && nextStyle['casing-color'] === style['casing-color'] && nextStyle['casing-dashes'] === style['casing-dashes'] && nextStyle['casing-opacity'] === style['casing-opacity']) {
        return;
      }
      _style["default"].setStyles(ctx, {
        lineWidth: 2 * style["casing-width"] + (style.hasOwnProperty("width") ? style.width : 0),
        strokeStyle: style["casing-color"] || "#000000",
        lineCap: style["casing-linecap"] || style.linecap || "butt",
        lineJoin: style["casing-linejoin"] || style.linejoin || "round",
        globalAlpha: style["casing-opacity"] || 1
      });
      ctx.stroke();
      this.pathOpened = false;
    }
  }, {
    key: "render",
    value: function render(ctx, feature, nextFeature, ws, hs, granularity) {
      var style = feature.style,
        nextStyle = nextFeature && nextFeature.style;
      if (!this.pathOpened) {
        this.pathOpened = true;
        ctx.beginPath();
      }
      new _path["default"](ctx, feature, style.dashes, false, ws, hs, granularity);
      if (nextFeature && nextStyle.width === style.width && nextStyle.color === style.color && nextStyle.image === style.image && nextStyle.opacity === style.opacity) {
        return;
      }
      if ('color' in style || !('image' in style)) {
        var t_width = style.width || 1,
          t_linejoin = "round",
          t_linecap = "round";
        if (t_width <= 2) {
          t_linejoin = "miter";
          t_linecap = "butt";
        }
        _style["default"].setStyles(ctx, {
          lineWidth: t_width,
          strokeStyle: style.color || '#000000',
          lineCap: style.linecap || t_linecap,
          lineJoin: style.linejoin || t_linejoin,
          globalAlpha: style.opacity || 1,
          miterLimit: 4
        });
        ctx.stroke();
      }
      if ('image' in style) {
        // second pass fills with texture
        var image = _mapcss["default"].getImage(style.image);
        if (image) {
          _style["default"].setStyles(ctx, {
            strokeStyle: ctx.createPattern(image, 'repeat') || "#000000",
            lineWidth: style.width || 1,
            lineCap: style.linecap || "round",
            lineJoin: style.linejoin || "round",
            globalAlpha: style.opacity || 1
          });
          ctx.stroke();
        }
      }
      this.pathOpened = false;
    }
  }], [{
    key: "shared",
    get: function get() {
      return new Line();
    }
  }]);
}();
;

},{"../style/mapcss":9,"../style/style":11,"./path":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _geom = _interopRequireDefault(require("../utils/geom"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Path = exports["default"] = /*#__PURE__*/function () {
  function Path(ctx, feature, dashes, fill, ws, hs, granularity) {
    _classCallCheck(this, Path);
    var type = feature.type,
      coords = feature.coordinates;
    if (type === "Polygon") {
      coords = [coords];
      type = "MultiPolygon";
    } else if (type === "LineString") {
      coords = [coords];
      type = "MultiLineString";
    }
    var i,
      j,
      k,
      points,
      len = coords.length,
      len2,
      pointsLen,
      prevPoint,
      point,
      screenPoint,
      dx,
      dy,
      dist;
    if (type === "MultiPolygon") {
      for (i = 0; i < len; i++) {
        for (k = 0, len2 = coords[i].length; k < len2; k++) {
          points = coords[i][k];
          pointsLen = points.length;
          prevPoint = points[0];
          for (j = 0; j <= pointsLen; j++) {
            point = points[j] || points[0];
            screenPoint = _geom["default"].transformPoint(point, ws, hs);
            if (j === 0) {
              ctx.moveTo(screenPoint[0], screenPoint[1]);
              if (dashes) ctx.setLineDash(dashes);else ctx.setLineDash([]);
            } else if (!fill && Path.checkSameBoundary(point, prevPoint, granularity)) {
              ctx.moveTo(screenPoint[0], screenPoint[1]);
            } else {
              ctx.lineTo(screenPoint[0], screenPoint[1]);
            }
            prevPoint = point;
          }
        }
      }
    } else if (type === "MultiLineString") {
      var pad = 50,
        // how many pixels to draw out of the tile to avoid path edges when lines crosses tile borders
        skip = 2; // do not draw line segments shorter than this

      for (i = 0; i < len; i++) {
        points = coords[i];
        pointsLen = points.length;
        for (j = 0; j < pointsLen; j++) {
          point = points[j];

          // continue path off the tile by some amount to fix path edges between tiles
          if ((j === 0 || j === pointsLen - 1) && Path.isTileBoundary(point, granularity)) {
            k = j;
            do {
              k = j ? k - 1 : k + 1;
              if (k < 0 || k >= pointsLen) break;
              prevPoint = points[k];
              dx = point[0] - prevPoint[0];
              dy = point[1] - prevPoint[1];
              dist = Math.sqrt(dx * dx + dy * dy);
            } while (dist <= skip);

            // all points are so close to each other that it doesn't make sense to
            // draw the line beyond the tile border, simply skip the entire line from
            // here
            if (k < 0 || k >= pointsLen) break;
            point[0] = point[0] + pad * dx / dist;
            point[1] = point[1] + pad * dy / dist;
          }
          screenPoint = _geom["default"].transformPoint(point, ws, hs);
          if (j === 0) {
            ctx.moveTo(screenPoint[0], screenPoint[1]);
            if (dashes) ctx.setLineDash(dashes);else ctx.setLineDash([]);
          } else {
            ctx.lineTo(screenPoint[0], screenPoint[1]);
          }
        }
      }
    }
  }

  // check if the point is on the tile boundary
  // returns bitmask of affected tile boundaries
  return _createClass(Path, null, [{
    key: "isTileBoundary",
    value: function isTileBoundary(p, size) {
      var r = 0;
      if (p[0] === 0) r |= 1;else if (p[0] === size) r |= 2;
      if (p[1] === 0) r |= 4;else if (p[1] === size) r |= 8;
      return r;
    }

    /* check if 2 points are both on the same tile boundary
     *
     * If points of the object are on the same tile boundary it is assumed
     * that the object is cut here and would originally continue beyond the
     * tile borders.
     *
     * This does not catch the case where the object is indeed exactly
     * on the tile boundaries, but this case can't properly be detected here.
     */
  }, {
    key: "checkSameBoundary",
    value: function checkSameBoundary(p, q, size) {
      var bp = Path.isTileBoundary(p, size);
      if (!bp) return 0;
      return bp & Path.isTileBoundary(q, size);
    }
  }]);
}();

},{"../utils/geom":13}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mapcss = _interopRequireDefault(require("../style/mapcss"));
var _style = _interopRequireDefault(require("../style/style"));
var _path = _interopRequireDefault(require("./path"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var polygon = null;
var Polygon = exports["default"] = /*#__PURE__*/function () {
  function Polygon() {
    _classCallCheck(this, Polygon);
    if (polygon == null) {
      polygon = this;
    }
    return polygon;
  }
  return _createClass(Polygon, [{
    key: "render",
    value: function render(ctx, feature, nextFeature, ws, hs, granularity) {
      var style = feature.style,
        nextStyle = nextFeature && nextFeature.style;
      if (!this.pathOpened) {
        this.pathOpened = true;
        ctx.beginPath();
      }
      new _path["default"](ctx, feature, false, true, ws, hs, granularity);
      if (nextFeature && nextStyle['fill-color'] === style['fill-color'] && nextStyle['fill-image'] === style['fill-image'] && nextStyle['fill-opacity'] === style['fill-opacity']) {
        return;
      }
      this.fill(ctx, style);
      this.pathOpened = false;
    }
  }, {
    key: "fill",
    value: function fill(ctx, style, fillFn) {
      var opacity = style["fill-opacity"] || style.opacity,
        image;
      if (style.hasOwnProperty('fill-color')) {
        // first pass fills with solid color
        _style["default"].setStyles(ctx, {
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
        image = _mapcss["default"].getImage(style['fill-image']);
        if (image) {
          _style["default"].setStyles(ctx, {
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
  }], [{
    key: "shared",
    get: function get() {
      return new Polygon();
    }
  }]);
}();

},{"../style/mapcss":9,"../style/style":11,"./path":4}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _geom = _interopRequireDefault(require("../utils/geom"));
var _mapcss = _interopRequireDefault(require("../style/mapcss"));
var _style = _interopRequireDefault(require("../style/style"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Shields = exports["default"] = /*#__PURE__*/function () {
  function Shields() {
    _classCallCheck(this, Shields);
  }
  return _createClass(Shields, null, [{
    key: "render",
    value: function render(ctx, feature, collides, ws, hs) {
      var style = feature.style,
        reprPoint = _geom["default"].getReprPoint(feature),
        point,
        img,
        len = 0,
        found = false,
        i,
        sgn;
      if (!reprPoint) {
        return;
      }
      point = _geom["default"].transformPoint(reprPoint, ws, hs);
      if (style["shield-image"]) {
        img = _mapcss["default"].getImage(style["icon-image"]);
        if (!img) {
          return;
        }
      }
      _style["default"].setStyles(ctx, {
        font: _style["default"].getFontString(style["shield-font-family"] || style["font-family"], style["shield-font-size"] || style["font-size"], style),
        fillStyle: style["shield-text-color"] || "#000000",
        globalAlpha: style["shield-text-opacity"] || style.opacity || 1,
        textAlign: 'center',
        textBaseline: 'middle'
      });
      var text = String(style['shield-text']),
        textWidth = ctx.measureText(text).width,
        letterWidth = textWidth / text.length,
        collisionWidth = textWidth + 2,
        collisionHeight = letterWidth * 1.8;
      if (feature.type === 'LineString') {
        len = _geom["default"].getPolyLength(feature.coordinates);
        if (Math.max(collisionHeight / hs, collisionWidth / ws) > len) {
          return;
        }
        for (i = 0, sgn = 1; i < len / 2; i += Math.max(len / 30, collisionHeight / ws), sgn *= -1) {
          reprPoint = _geom["default"].getAngleAndCoordsAtLength(feature.coordinates, len / 2 + sgn * i, 0);
          if (!reprPoint) {
            break;
          }
          reprPoint = [reprPoint[1], reprPoint[2]];
          point = _geom["default"].transformPoint(reprPoint, ws, hs);
          if (img && style["allow-overlap"] !== "true" && collides.checkPointWH(point, img.width, img.height, feature.kothicId)) {
            continue;
          }
          if (style["allow-overlap"] !== "true" && collides.checkPointWH(point, collisionWidth, collisionHeight, feature.kothicId)) {
            continue;
          }
          found = true;
          break;
        }
      }
      if (!found) {
        return;
      }
      if (style["shield-casing-width"]) {
        _style["default"].setStyles(ctx, {
          fillStyle: style["shield-casing-color"] || "#000000",
          globalAlpha: style["shield-casing-opacity"] || style.opacity || 1
        });
        var p = style["shield-casing-width"] + (style["shield-frame-width"] || 0);
        ctx.fillRect(point[0] - collisionWidth / 2 - p, point[1] - collisionHeight / 2 - p, collisionWidth + 2 * p, collisionHeight + 2 * p);
      }
      if (style["shield-frame-width"]) {
        _style["default"].setStyles(ctx, {
          fillStyle: style["shield-frame-color"] || "#000000",
          globalAlpha: style["shield-frame-opacity"] || style.opacity || 1
        });
        ctx.fillRect(point[0] - collisionWidth / 2 - (style["shield-frame-width"] || 0), point[1] - collisionHeight / 2 - (style["shield-frame-width"] || 0), collisionWidth + 2 * (style["shield-frame-width"] || 0), collisionHeight + 2 * (style["shield-frame-width"] || 0));
      }
      if (style["shield-color"]) {
        _style["default"].setStyles(ctx, {
          fillStyle: style["shield-color"] || "#000000",
          globalAlpha: style["shield-opacity"] || style.opacity || 1
        });
        ctx.fillRect(point[0] - collisionWidth / 2, point[1] - collisionHeight / 2, collisionWidth, collisionHeight);
      }
      if (img) {
        ctx.drawImage(img, Math.floor(point[0] - img.width / 2), Math.floor(point[1] - img.height / 2));
      }
      _style["default"].setStyles(ctx, {
        fillStyle: style["shield-text-color"] || "#000000",
        globalAlpha: style["shield-text-opacity"] || style.opacity || 1
      });
      ctx.fillText(text, point[0], Math.ceil(point[1]));
      if (img) {
        collides.addPointWH(point, img.width, img.height, 0, feature.kothicId);
      }
      collides.addPointWH(point, collisionHeight, collisionWidth, (parseFloat(style["shield-casing-width"]) || 0) + (parseFloat(style["shield-frame-width"]) || 0) + (parseFloat(style["-x-mapnik-min-distance"]) || 30), feature.kothicId);
    }
  }]);
}();

},{"../style/mapcss":9,"../style/style":11,"../utils/geom":13}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _geom = _interopRequireDefault(require("../utils/geom"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var TextOnPath = exports["default"] = /*#__PURE__*/function () {
  function TextOnPath(ctx, points, text, halo, collisions) {
    _classCallCheck(this, TextOnPath);
    //widthCache = {};

    // simplify points?

    var textWidth = ctx.measureText(text).width,
      textLen = text.length,
      pathLen = _geom["default"].getPolyLength(points);
    if (pathLen < textWidth) {
      return; // if label won't fit - don't try to
    }
    var avgLetterWidth = TextOnPath.getWidth(ctx, 'a');
    var letter,
      widthUsed,
      prevAngle,
      positions,
      solution = 0,
      flipCount,
      flipped = false,
      axy,
      letterWidth,
      i,
      maxAngle = Math.PI / 6;

    // iterating solutions - start from center or from one of the ends
    while (solution < 2) {
      //TODO change to for?
      widthUsed = solution ? TextOnPath.getWidth(ctx, text.charAt(0)) : (pathLen - textWidth) / 2; // ???
      flipCount = 0;
      prevAngle = null;
      positions = [];

      // iterating label letter by letter (should be fixed to support ligatures/CJK, ok for Cyrillic/latin)
      for (i = 0; i < textLen; i++) {
        letter = text.charAt(i);
        letterWidth = TextOnPath.getWidth(ctx, letter);
        axy = _geom["default"].getAngleAndCoordsAtLength(points, widthUsed, letterWidth);

        // if cannot fit letter - restart with next solution
        if (widthUsed >= pathLen || !axy) {
          solution++;
          positions = [];
          if (flipped) {
            // if label was flipped, flip it back
            points.reverse();
            flipped = false;
          }
          break;
        }
        if (!prevAngle) {
          prevAngle = axy[0];
        }

        // if label collisions with another, restart it from here
        if (TextOnPath.checkCollision(collisions, ctx, letter, axy, avgLetterWidth) || Math.abs(prevAngle - axy[0]) > maxAngle) {
          widthUsed += letterWidth;
          i = -1;
          positions = [];
          flipCount = 0;
          continue;
        }
        while (letterWidth < axy[3] && i < textLen) {
          // try adding following letters to current, until line changes its direction
          i++;
          letter += text.charAt(i);
          letterWidth = TextOnPath.getWidth(ctx, letter);
          if (TextOnPath.checkCollision(collisions, ctx, letter, axy, avgLetterWidth)) {
            i = 0;
            widthUsed += letterWidth;
            positions = [];
            flipCount = 0;
            letter = text.charAt(i);
            letterWidth = TextOnPath.getWidth(ctx, letter);
            axy = _geom["default"].getAngleAndCoordsAtLength(points, widthUsed, letterWidth);
            break;
          }
          if (letterWidth >= axy[3]) {
            i--;
            letter = letter.slice(0, -1);
            letterWidth = TextOnPath.getWidth(ctx, letter);
            break;
          }
        }
        if (!axy) {
          continue;
        }
        if (axy[0] > Math.PI / 2 || axy[0] < -Math.PI / 2) {
          // if current letters cluster was upside-down, count it
          flipCount += letter.length;
        }
        prevAngle = axy[0];
        axy.push(letter);
        positions.push(axy);
        widthUsed += letterWidth;
      } //for

      if (flipCount > textLen / 2) {
        // if more than half of the text is upside down, flip it and restart
        points.reverse();
        positions = [];
        if (flipped) {
          // if it was flipped twice - restart with other start point solution
          solution++;
          points.reverse();
          flipped = false;
        } else {
          flipped = true;
        }
      }
      if (solution >= 2) {
        return;
      }
      if (positions.length > 0) {
        break;
      }
    } //while

    var posLen = positions.length;
    for (i = 0; halo && i < posLen; i++) {
      TextOnPath.renderText(ctx, positions[i], true);
    }
    for (i = 0; i < posLen; i++) {
      axy = positions[i];
      TextOnPath.renderText(ctx, axy);
      TextOnPath.addCollision(collisions, ctx, axy[4], axy, avgLetterWidth);
    }
  }
  return _createClass(TextOnPath, null, [{
    key: "getWidth",
    value: function getWidth(ctx, text) {
      return ctx.measureText(text).width;
    }
  }, {
    key: "getTextCenter",
    value: function getTextCenter(axy, textWidth) {
      return [axy[1] + 0.5 * Math.cos(axy[0]) * textWidth, axy[2] + 0.5 * Math.sin(axy[0]) * textWidth];
    }
  }, {
    key: "getCollisionParams",
    value: function getCollisionParams(textWidth, axy, pxoffset) {
      var textHeight = textWidth * 1.5,
        cos = Math.abs(Math.cos(axy[0])),
        sin = Math.abs(Math.sin(axy[0])),
        w = cos * textWidth + sin * textHeight,
        h = sin * textWidth + cos * textHeight;
      return [TextOnPath.getTextCenter(axy, textWidth + 2 * (pxoffset || 0)), w, h, 0];
    }
  }, {
    key: "checkCollision",
    value: function checkCollision(collisions, ctx, text, axy, letterWidth) {
      var textWidth = TextOnPath.getWidth(ctx, text);
      for (var i = 0; i < textWidth; i += letterWidth) {
        if (collisions.checkPointWH.apply(collisions, TextOnPath.getCollisionParams(letterWidth, axy, i))) {
          return true;
        }
      }
      return false;
    }
  }, {
    key: "addCollision",
    value: function addCollision(collisions, ctx, text, axy, letterWidth) {
      var textWidth = TextOnPath.getWidth(ctx, text),
        params = [];
      for (var i = 0; i < textWidth; i += letterWidth) {
        params.push(TextOnPath.getCollisionParams(letterWidth, axy, i));
      }
      collisions.addPoints(params);
    }
  }, {
    key: "renderText",
    value: function renderText(ctx, axy, halo) {
      var text = axy[4],
        textCenter = TextOnPath.getTextCenter(axy, TextOnPath.getWidth(ctx, text));
      ctx.translate(textCenter[0], textCenter[1]);
      ctx.rotate(axy[0]);
      ctx[halo ? 'strokeText' : 'fillText'](text, 0, 0);
      ctx.rotate(-axy[0]);
      ctx.translate(-textCenter[0], -textCenter[1]);
    }
  }]);
}();

},{"../utils/geom":13}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _style = _interopRequireDefault(require("../style/style"));
var _geom = _interopRequireDefault(require("../utils/geom"));
var _mapcss = _interopRequireDefault(require("../style/mapcss"));
var _text = _interopRequireDefault(require("./text"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Texticons = exports["default"] = /*#__PURE__*/function () {
  function Texticons() {
    _classCallCheck(this, Texticons);
  }
  return _createClass(Texticons, null, [{
    key: "render",
    value: function render(ctx, feature, collides, ws, hs, renderText, renderIcon) {
      var style = feature.style,
        img,
        point,
        w,
        h;
      if (renderIcon || renderText && feature.type !== 'LineString') {
        var reprPoint = _geom["default"].getReprPoint(feature);
        if (!reprPoint) {
          return;
        }
        point = _geom["default"].transformPoint(reprPoint, ws, hs);
      }
      if (renderIcon) {
        img = _mapcss["default"].getImage(style['icon-image']);
        if (!img) {
          return;
        }
        w = img.width;
        h = img.height;
        if (style['icon-width'] || style['icon-height']) {
          if (style['icon-width']) {
            w = style['icon-width'];
            h = img.height * w / img.width;
          }
          if (style['icon-height']) {
            h = style['icon-height'];
            if (!style['icon-width']) {
              w = img.width * h / img.height;
            }
          }
        }
        if (style['allow-overlap'] !== 'true' && collides.checkPointWH(point, w, h, feature.kothicId)) {
          return;
        }
      }
      var text = String(style.text).trim();
      if (renderText && text) {
        _style["default"].setStyles(ctx, {
          lineWidth: style['text-halo-radius'] * 2,
          font: _style["default"].getFontString(style['font-family'], style['font-size'], style)
        });
        var halo = style.hasOwnProperty('text-halo-radius');
        _style["default"].setStyles(ctx, {
          fillStyle: style['text-color'] || '#000000',
          strokeStyle: style['text-halo-color'] || '#ffffff',
          globalAlpha: style['text-opacity'] || style.opacity || 1,
          textAlign: 'center',
          textBaseline: 'middle'
        });
        if (style['text-transform'] === 'uppercase') text = text.toUpperCase();else if (style['text-transform'] === 'lowercase') text = text.toLowerCase();else if (style['text-transform'] === 'capitalize') text = text.replace(/(^|\s)\S/g, function (ch) {
          return ch.toUpperCase();
        });
        if (feature.type === 'Polygon' || feature.type === 'Point') {
          var textWidth = ctx.measureText(text).width,
            letterWidth = textWidth / text.length,
            collisionWidth = textWidth,
            collisionHeight = letterWidth * 2.5,
            offset = style['text-offset'] || 0;
          if (style['text-allow-overlap'] !== 'true' && collides.checkPointWH([point[0], point[1] + offset], collisionWidth, collisionHeight, feature.kothicId)) {
            return;
          }
          if (halo) {
            ctx.strokeText(text, point[0], point[1] + offset);
          }
          ctx.fillText(text, point[0], point[1] + offset);
          var padding = style['-x-kot-min-distance'] || 20;
          collides.addPointWH([point[0], point[1] + offset], collisionWidth, collisionHeight, padding, feature.kothicId);
        } else if (feature.type === 'LineString') {
          var points = _geom["default"].transformPoints(feature.coordinates, ws, hs);
          new _text["default"](ctx, points, text, halo, collides);
        }
      }
      if (renderIcon) {
        ctx.drawImage(img, Math.floor(point[0] - w / 2), Math.floor(point[1] - h / 2), w, h);
        var padding2 = parseFloat(style['-x-kot-min-distance']) || 0;
        collides.addPointWH(point, w, h, padding2, feature.kothicId);
      }
    }
  }]);
}();
;

},{"../style/mapcss":9,"../style/style":11,"../utils/geom":13,"./text":7}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var MapCSSInstance = null;
var MapCSS = exports["default"] = /*#__PURE__*/function () {
  function MapCSS() {
    _classCallCheck(this, MapCSS);
    if (MapCSSInstance == null) {
      MapCSSInstance = this;
      this._styles = {};
      this._availableStyles = [];
      this._images = {};
      this._locales = [];
      this._presence_tags = [];
      this._value_tags = [];
      this._cache = {};
      this._debug = {
        hit: 0,
        miss: 0
      };
    }
    return MapCSSInstance;
  }
  return _createClass(MapCSS, [{
    key: "availableStyles",
    get: function get() {
      return this._availableStyles;
    }
  }, {
    key: "invalidateCache",
    value:
    /**
    * Incalidate styles cache
    */
    function invalidateCache() {
      this._cache = {};
    }
  }, {
    key: "getTagKeys",
    value: function getTagKeys(tags, zoom, type, selector) {
      var keys = [],
        i;
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
  }, {
    key: "restyle",
    value: function restyle(styleNames, tags, zoom, type, selector) {
      var i,
        key = this.getTagKeys(tags, zoom, type, selector),
        actions = this._cache[key] || {};
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
  }], [{
    key: "shared",
    get: function get() {
      return new MapCSS();
    }
  }, {
    key: "onError",
    value: function onError() {}
  }, {
    key: "onImagesLoad",
    value: function onImagesLoad() {}
  }, {
    key: "e_min",
    value: function e_min( /*...*/
    ) {
      return Math.min.apply(null, arguments);
    }
  }, {
    key: "e_max",
    value: function e_max( /*...*/
    ) {
      return Math.max.apply(null, arguments);
    }
  }, {
    key: "e_any",
    value: function e_any( /*...*/
    ) {
      var i;
      for (i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] !== 'undefined' && arguments[i] !== '') {
          return arguments[i];
        }
      }
      return '';
    }
  }, {
    key: "e_num",
    value: function e_num(arg) {
      if (!isNaN(parseFloat(arg))) {
        return parseFloat(arg);
      } else {
        return '';
      }
    }
  }, {
    key: "e_str",
    value: function e_str(arg) {
      return arg;
    }
  }, {
    key: "e_int",
    value: function e_int(arg) {
      return parseInt(arg, 10);
    }
  }, {
    key: "e_tag",
    value: function e_tag(obj, tag) {
      if (obj.hasOwnProperty(tag) && obj[tag] !== null) {
        return tag;
      } else {
        return '';
      }
    }
  }, {
    key: "e_prop",
    value: function e_prop(obj, tag) {
      if (obj.hasOwnProperty(tag) && obj[tag] !== null) {
        return obj[tag];
      } else {
        return '';
      }
    }
  }, {
    key: "e_sqrt",
    value: function e_sqrt(arg) {
      return Math.sqrt(arg);
    }
  }, {
    key: "e_boolean",
    value: function e_boolean(arg, if_exp, else_exp) {
      if (typeof if_exp === 'undefined') {
        if_exp = 'true';
      }
      if (typeof else_exp === 'undefined') {
        else_exp = 'false';
      }
      if (arg === '0' || arg === 'false' || arg === '') {
        return else_exp;
      } else {
        return if_exp;
      }
    }
  }, {
    key: "e_metric",
    value: function e_metric(arg) {
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
  }, {
    key: "e_zmetric",
    value: function e_zmetric(arg) {
      return MapCSS.shared.e_metric(arg);
    }
  }, {
    key: "e_localize",
    value: function e_localize(tags, text) {
      var locales = MapCSS.shared._locales,
        i,
        tag;
      for (i = 0; i < locales.length; i++) {
        tag = text + ':' + locales[i];
        if (tags[tag]) {
          return tags[tag];
        }
      }
      return tags[text];
    }
  }, {
    key: "loadStyle",
    value: function loadStyle(style, restyle, sprite_images, external_images, presence_tags, value_tags) {
      var i;
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
    } /**
      * Call MapCSS.shared.onImagesLoad callback if all sprite and external
      * images was loaded
      */
  }, {
    key: "_onImagesLoad",
    value: function _onImagesLoad(style) {
      if (MapCSS.shared._styles[style].external_images_loaded && MapCSS.shared._styles[style].sprite_loaded) {
        MapCSS.onImagesLoad();
      }
    }
  }, {
    key: "preloadSpriteImage",
    value: function preloadSpriteImage(style, url) {
      var images = MapCSS.shared._styles[style]._images,
        img = new Image();
      delete MapCSS.shared._styles[style]._images;
      img.onload = function () {
        var image;
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
  }, {
    key: "preloadExternalImages",
    value: function preloadExternalImages(style, urlPrefix) {
      var external_images = MapCSS.shared._styles[style].external_images;
      delete MapCSS.shared._styles[style].external_images;
      urlPrefix = urlPrefix || '';
      var len = external_images.length,
        loaded = 0,
        i;
      function loadImage(url) {
        var img = new Image();
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
  }, {
    key: "getImage",
    value: function getImage(ref) {
      var img = MapCSS.shared._images[ref];
      if (img && img.sprite) {
        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img.sprite, 0, img.offset, img.width, img.height, 0, 0, img.width, img.height);
        img = MapCSS.shared._images[ref] = canvas;
      }
      return img;
    }
  }]);
}();

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mapcss = _interopRequireDefault(require("./mapcss"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var osmosnimki = exports["default"] = /*#__PURE__*/function () {
  function osmosnimki() {
    _classCallCheck(this, osmosnimki);
    this.sprite_images = {};
    this.external_images = [];
    this.presence_tags = ['shop'];
    this.value_tags = ['color', 'amenity', 'pk', 'building ', 'wall', 'surface', 'marking', 'service', 'addr:housenumber', 'population', 'leisure', 'waterway', 'aeroway', 'landuse', 'barrier', 'colour', 'railway', 'oneway', 'religion', 'tourism', 'admin_level', 'transport', 'name', 'building', 'place', 'residential', 'highway', 'ele', 'living_street', 'natural', 'boundary', 'capital'];
    _mapcss["default"].loadStyle('styles/contagt', this.restyle, this.sprite_images, this.external_images, this.presence_tags, this.value_tags);
    _mapcss["default"].preloadExternalImages('styles/contagt');
  }
  return _createClass(osmosnimki, [{
    key: "restyle",
    value: function restyle(style, tags, zoom, type, selector) {
      var s_default = {},
        s_centerline = {},
        s_ticks = {},
        s_label = {};
      if (tags["surface"] === "background") {
        s_default['fill-color'] = '#FFFFFF';
        s_default['fill-opacity'] = 1;
        s_default['z-index'] = 1;
      }
      if (tags["surface"] === "floor") {
        s_default['fill-color'] = '#F5F4FF';
        s_default['fill-opacity'] = 1;
        s_default['z-index'] = 31;
      }
      if (tags["surface"] === "steps" && selector === "area") {
        s_default['fill-color'] = '#FFA384';
        s_default['opacity'] = 1;
        s_default['z-index'] = 33;
      }
      if (tags["surface"] === "elevator") {
        s_default['fill-color'] = '#CCA384';
        s_default['opacity'] = 1;
        s_default['z-index'] = 33;
      }
      if (tags["surface"] === "elevator" && selector === "area") {
        s_default['fill-color'] = '#CCA384';
        s_default['opacity'] = 1;
        s_default['z-index'] = 33;
      }
      if (tags["highway"] === "steps") {
        s_default['fill-color'] = '#FFA384';
        s_default['fill-opacity'] = 1;
        s_default['z-index'] = 33;
      }
      if (tags["highway"] === "elevator") {
        s_default['fill-color'] = '#CCA384';
        s_default['fill-opacity'] = 1;
        s_default['z-index'] = 33;
      }
      if (tags["surface"] === "balcony" && selector === "area") {
        s_default['fill-color'] = '#875646';
        s_default['fill-opacity'] = 0.6;
        s_default['z-index'] = 33;
      }
      if (tags["surface"] === "door" && selector == "line") {
        s_default['color'] = '#DBDBDB';
        s_default['width'] = 1;
        s_default['z-index'] = 39;
      }
      if (tags["surface"] === "solid" && selector === "area") {
        s_default['fill-color'] = '#0B0811';
        s_default['fill-opacity'] = 0.9;
        s_default['z-index'] = 30;
      }
      if (tags["surface"] === "transparent" && selector === "area") {
        s_default['fill-color'] = '#FFF';
        s_default['fill-opacity'] = 0.4;
        s_default['z-index'] = 30;
      }
      if (tags["surface"] === "plant" && selector === "area") {
        s_default['fill-color'] = '#83DF60';
        s_default['fill-opacity'] = 0.9;
        s_default['z-index'] = 30;
      }
      if (tags["surface"] === "sand" && selector === "area") {
        s_default['fill-color'] = '#FDD485';
        s_default['color'] = '#000000';
        s_default['opacity'] = 0.8;
        s_default['fill-opacity'] = 0.9;
        s_default['width'] = 1.5;
        s_default['z-index'] = 30;
        s_default['dashes'] = [9, 9];
      }
      if (tags["surface"] === "concrete" && selector === "area") {
        s_default['fill-color'] = '#DDDDDD';
        s_default['fill-opacity'] = 0.9;
        s_default['z-index'] = 30;
        s_default['color'] = '#222222';
        s_default['width'] = 1.5;
        s_default['opacity'] = 0.6;
        s_default['dashes'] = [9, 3];
      }
      if (tags["surface"] === "paving_slab" && selector === "area") {
        s_default['fill-color'] = '#E0D0DB';
        s_default['color'] = '#222222';
        s_default['fill-opacity'] = 0.6;
        s_default['width'] = 1.5;
        s_default['z-index'] = 30;
        s_default['dashes'] = [5, 2];
      }
      if (tags["surface"] === "door" && selector === "area") {
        s_default['fill-color'] = '#607F84';
        s_default['fill-opacity'] = 0.6;
        s_default['color'] = '#000000';
        s_default['width'] = 1.5;
        s_default['z-index'] = 39;
      }
      if (tags["surface"] === "green" && selector === "area") {
        s_default['fill-color'] = '#88C037';
        s_default['fill-opacity'] = 0.2;
        s_default['z-index'] = 30;
      }
      if (tags["surface"] === "window" && selector === "area") {
        s_default['fill-color'] = '#13C5CF';
        s_default['fill-opacity'] = 0.3;
        s_default['color'] = '#000000';
        s_default['width'] = 1.5;
        s_default['z-index'] = 35;
      }
      if (tags["surface"] == "sanitary" && selector == "area") {
        s_default['fill-color'] = '#EECFFC';
        s_default['fill-opacity'] = 1;
        s_default['z-index'] = 36;
      }
      if (tags["surface"] == "beverages" && selector == "area") {
        s_default['fill-color'] = '#E3EFEA';
        s_default['fill-opacity'] = 1;
        s_default['z-index'] = 36;
      }
      if (tags["surface"] == "room" && selector == "area") {
        s_default['fill-color'] = '#E9E9E9';
        s_default['fill-opacity'] = 1;
        s_default['z-index'] = 36;
      }
      if (tags["handrail"] === "yes") {
        s_default['color'] = '#111111';
        s_default['width'] = 1.5;
        s_default['z-index'] = 27;
        s_default['dashes'] = [5, 5];
      }
      if (type === 'way' && tags["wall"] === "yes" && zoom < 12) {
        s_default['color'] = '#000000';
        s_default['width'] = 0.5;
        s_default['z-index'] = 27;
      }
      if (tags["wall"] === "yes" && zoom < 16 && zoom >= 12) {
        s_default['color'] = '#000000';
        s_default['width'] = 1;
        s_default['z-index'] = 27;
      }
      if (tags["wall"] === "yes" && zoom >= 16) {
        s_default['color'] = '#000000';
        s_default['width'] = 1.5;
        s_default['z-index'] = 27;
      }
      if (tags["wall"] >= 16) {
        s_default['color'] = '#000000';
        s_default['width'] = 1.5;
        s_default['z-index'] = 27;
      }
      if (tags["wall"] == "yes" && selector == "area") {
        s_default['fill-color'] = '#E9E9E9';
        s_default['fill-opacity'] = 2;
        s_default['z-index'] = 22;
      }
      if (tags["building"] === "yes" && selector == "area") {
        s_default['fill-color'] = '#DDDAD3';
        s_default['fill-opacity'] = 1;
        s_default['color'] = '#CCC9C4';
        s_default['width'] = 1.5;
        s_default['z-index'] = 8;
      }
      if (selector === 'area' && tags['natural'] === 'coastline') {
        s_default['fill-color'] = '#fcf8e4';
        s_default['-x-mapnik-layer'] = 'bottom';
      }
      if (selector === 'area' && tags['natural'] === 'glacier') {
        s_default['fill-color'] = '#fcfeff';
      }
      if (selector === 'area' && tags['leisure'] === 'park') {
        s_default['fill-color'] = '#c4e9a4';
        s_default['z-index'] = 3;
      }
      if (selector === 'area' && tags['leisure'] === 'garden' || selector === 'area' && tags['landuse'] === 'orchard') {
        s_default['z-index'] = 3;
      }
      if (selector === 'area' && tags['natural'] === 'scrub') {
        s_default['fill-color'] = '#e5f5dc';
        s_default['z-index'] = 3;
      }
      if (selector === 'area' && tags['natural'] === 'heath') {
        s_default['fill-color'] = '#ecffe5';
        s_default['z-index'] = 3;
      }
      if (selector === 'area' && tags['landuse'] === 'industrial' || selector === 'area' && tags['landuse'] === 'military') {
        s_default['fill-color'] = '#ddd8da';
        s_default['z-index'] = 3;
      }
      if (selector === 'area' && tags['amenity'] === 'parking') {
        s_default['fill-color'] = '#ecedf4';
        s_default['z-index'] = 3;
      }
      if (selector === 'area' && tags['natural'] === 'forest' || selector === 'area' && tags['natural'] === 'wood' || selector === 'area' && tags['landuse'] === 'forest' || selector === 'area' && tags['landuse'] === 'wood') {
        s_default['fill-color'] = '#d6f4c6';
        s_default['z-index'] = 3;
      }
      if (selector === 'area' && tags['landuse'] === 'garages' && zoom >= 10) {
        s_default['fill-color'] = '#ddd8da';
        s_default['z-index'] = 3;
      }
      if (selector === 'area' && tags['natural'] === 'forest' || selector === 'area' && tags['natural'] === 'wood' && zoom >= 10 || selector === 'area' && tags['landuse'] === 'forest' || selector === 'area' && tags['landuse'] === 'wood') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = 0;
        s_default['font-size'] = '10';
        s_default['font-family'] = 'DejaVu Serif Italic';
        s_default['text-color'] = 'green';
        s_default['text-allow-overlap'] = 'false';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['-x-mapnik-min-distance'] = '0 ';
      }
      if (selector === 'area' && tags['landuse'] === 'grass' || selector === 'area' && tags['natural'] === 'grass' || selector === 'area' && tags['natural'] === 'meadow' || selector === 'area' && tags['landuse'] === 'meadow' || selector === 'area' && tags['landuse'] === 'recreation_ground') {
        s_default['fill-color'] = '#f4ffe5';
        s_default['z-index'] = 4;
      }
      if (selector === 'area' && tags['natural'] === 'wetland') {
        s_default['z-index'] = 4;
      }
      if (selector === 'area' && tags['landuse'] === 'farmland' || selector === 'area' && tags['landuse'] === 'farm' || selector === 'area' && tags['landuse'] === 'field') {
        s_default['fill-color'] = '#fff5c4';
        s_default['z-index'] = 5;
      }
      if (selector === 'area' && tags['landuse'] === 'cemetery') {
        s_default['fill-color'] = '#e5f5dc';
        s_default['z-index'] = 5;
      }
      if (selector === 'area' && tags['aeroway'] === 'aerodrome') {
        s_default['color'] = '#008ac6';
        s_default['width'] = 0.8;
        s_default['z-index'] = 5;
      }
      if (selector === 'area' && tags['leisure'] === 'stadium' || selector === 'area' && tags['leisure'] === 'pitch') {
        s_default['fill-color'] = '#e3deb1';
        s_default['z-index'] = 5;
      }
      if (type === 'way' && tags['waterway'] === 'river') {
        s_default['color'] = '#C4D4F5';
        s_default['width'] = 0.9;
        s_default['z-index'] = 9;
      }
      if (type === 'way' && tags['waterway'] === 'stream') {
        s_default['color'] = '#C4D4F5';
        s_default['width'] = 0.5;
        s_default['z-index'] = 9;
      }
      if (type === 'way' && tags['waterway'] === 'canal') {
        s_default['color'] = '#abc4f5';
        s_default['width'] = 0.6;
        s_default['z-index'] = 9;
      }
      if (selector === 'area' && tags['waterway'] === 'riverbank' || selector === 'area' && tags['natural'] === 'water' || selector === 'area' && tags['landuse'] === 'reservoir') {
        s_default['fill-color'] = '#C4D4F5';
        s_default['color'] = '#C4D4F5';
        s_default['width'] = 0.1;
        s_default['z-index'] = 9;
      }
      if (selector === 'area' && tags['natural'] === 'water') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = 1;
        s_default['font-size'] = '10';
        s_default['font-family'] = 'DejaVu Serif Italic';
        s_default['text-color'] = '#285fd1';
        s_default['text-allow-overlap'] = 'false';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
      }
      if (type === 'way' && tags['highway'] === 'construction') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['width'] = 2;
        s_default['color'] = '#ffffff';
        s_default['z-index'] = 10;
        s_default['dashes'] = [9, 9];
      }
      if (type === 'way' && tags['highway'] === 'construction') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['width'] = 3;
        s_default['color'] = '#ffffff';
        s_default['z-index'] = 10;
        s_default['dashes'] = [9, 9];
      }
      if (type === 'way' && tags['highway'] === 'footway' || type === 'way' && tags['highway'] === 'path' || type === 'way' && tags['highway'] === 'cycleway' || type === 'way' && tags['highway'] === 'pedestrian') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['casing-width'] = 0.3;
        s_default['casing-color'] = '#bf96ce';
        s_default['width'] = 0.2;
        s_default['color'] = '#ffffff';
        s_default['z-index'] = 10;
        s_default['dashes'] = [2, 2];
      }
      if (type === 'way' && tags['highway'] === 'steps') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['casing-width'] = 0.3;
        s_default['casing-color'] = '#ffffff';
        s_default['width'] = 3;
        s_default['color'] = '#bf96ce';
        s_default['z-index'] = 10;
        s_default['dashes'] = [1, 1];
        s_default['linecap'] = 'butt';
      }
      if (type === 'way' && tags['highway'] === 'road' || type === 'way' && tags['highway'] === 'track') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 1.5;
        s_default['color'] = '#ffffff';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 9;
      }
      if (type === 'way' && tags['highway'] === 'road' || type === 'way' && tags['highway'] === 'track') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 2.5;
        s_default['color'] = '#ffffff';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 9;
      }
      if (type === 'way' && tags['highway'] === 'service') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 1.2;
        s_default['color'] = '#ffffff';
        s_default['casing-width'] = 0.3;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 10;
      }
      if (type === 'way' && tags['highway'] === 'residential' && zoom === 16 || type === 'way' && tags['highway'] === 'unclassified' && zoom === 16 || type === 'way' && tags['highway'] === 'living_street' && zoom === 16 || type === 'way' && tags['highway'] === 'service' && (tags['living_street'] === '-1' || tags['living_street'] === 'false' || tags['living_street'] === 'no') && tags['service'] !== 'parking_aisle' && zoom === 16) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 3.5;
        s_default['color'] = '#ffffff';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 10;
      }
      if (type === 'way' && tags['highway'] === 'residential' || type === 'way' && tags['highway'] === 'unclassified' || type === 'way' && tags['highway'] === 'living_street' || type === 'way' && tags['highway'] === 'service' && (tags['living_street'] === '-1' || tags['living_street'] === 'false' || tags['living_street'] === 'no') && tags['service'] !== 'parking_aisle') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 4.5;
        s_default['color'] = '#ffffff';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 10;
      }
      if (type === 'way' && tags['highway'] === 'secondary' && zoom === 16 || type === 'way' && tags['highway'] === 'secondary_link' && zoom === 16 || type === 'way' && tags['highway'] === 'tertiary' && zoom === 16 || type === 'way' && tags['highway'] === 'tertiary_link' && zoom === 16) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Bold';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 7;
        s_default['color'] = '#fcffd1';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 11;
      }
      if (type === 'way' && tags['highway'] === 'secondary' && zoom === 17 || type === 'way' && tags['highway'] === 'secondary_link' && zoom === 17 || type === 'way' && tags['highway'] === 'tertiary' && zoom === 17 || type === 'way' && tags['highway'] === 'tertiary_link' && zoom === 17) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Bold';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 8;
        s_default['color'] = '#fcffd1';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 11;
      }
      if (type === 'way' && tags['highway'] === 'secondary' && zoom === 18 || type === 'way' && tags['highway'] === 'secondary_link' && zoom === 18 || type === 'way' && tags['highway'] === 'tertiary' && zoom === 18 || type === 'way' && tags['highway'] === 'tertiary_link' && zoom === 18) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Bold';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 9;
        s_default['color'] = '#fcffd1';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 11;
      }
      if (type === 'way' && tags['highway'] === 'primary' && zoom === 16 || type === 'way' && tags['highway'] === 'primary_link' && zoom === 16) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Bold';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 9;
        s_default['color'] = '#fcea97';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 12;
      }
      if (type === 'way' && tags['highway'] === 'primary' && zoom === 17 || type === 'way' && tags['highway'] === 'primary_link' && zoom === 17) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Bold';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 10;
        s_default['color'] = '#fcea97';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 12;
      }
      if (type === 'way' && tags['highway'] === 'primary' && zoom === 18 || type === 'way' && tags['highway'] === 'primary_link' && zoom === 18) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Bold';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 11;
        s_default['color'] = '#fcea97';
        s_default['casing-width'] = 0.5;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 12;
      }
      if (type === 'way' && tags['highway'] === 'trunk' && zoom === 17 || type === 'way' && tags['highway'] === 'trunk_link' && zoom === 17 || type === 'way' && tags['highway'] === 'motorway' && zoom === 17 || type === 'way' && tags['highway'] === 'motorway_link' && zoom === 17) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Bold';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 12;
        s_default['color'] = '#ffd780';
        s_default['casing-width'] = 1;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 13;
      }
      if (type === 'way' && tags['highway'] === 'trunk' && zoom === 18 || type === 'way' && tags['highway'] === 'trunk_link' && zoom === 18 || type === 'way' && tags['highway'] === 'motorway' && zoom === 18 || type === 'way' && tags['highway'] === 'motorway_link' && zoom === 18) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-position'] = 'line';
        s_default['text-color'] = '#404040';
        s_default['font-family'] = 'DejaVu Sans Bold';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['width'] = 13;
        s_default['color'] = '#ffd780';
        s_default['casing-width'] = 1;
        s_default['casing-color'] = '#996703';
        s_default['z-index'] = 13;
      }
      if (type === 'way' && tags['highway'] === 'trunk' || type === 'way' && tags['highway'] === 'trunk_link' || type === 'way' && tags['highway'] === 'motorway' || type === 'way' && tags['highway'] === 'motorway_link' || type === 'way' && tags['highway'] === 'primary' || type === 'way' && tags['highway'] === 'primary_link') {
        s_centerline['width'] = 0.3;
        s_centerline['color'] = '#fa6478';
        s_centerline['z-index'] = 14;
        s_centerline['-x-mapnik-layer'] = 'top';
      }
      if (type === 'way' && (tags['oneway'] === '1' || tags['oneway'] === 'true' || tags['oneway'] === 'yes')) {
        s_default['line-style'] = 'arrows';
        s_default['z-index'] = 15;
        s_default['-x-mapnik-layer'] = 'top';
      }
      if (selector === 'line' && tags['railway'] === 'rail') {
        s_default['width'] = 1.4;
        s_default['color'] = '#606060';
        s_default['z-index'] = 15;
      }
      if (selector === 'line' && tags['railway'] === 'rail') {
        s_ticks['width'] = 1;
        s_ticks['color'] = '#ffffff';
        s_ticks['dashes'] = [6, 6];
        s_ticks['z-index'] = 16;
      }
      if (type === 'way' && tags['railway'] === 'subway') {
        s_default['width'] = 3;
        s_default['color'] = '#072889';
        s_default['z-index'] = 15;
        s_default['dashes'] = [3, 3];
        s_default['opacity'] = 0.3;
        s_default['linecap'] = 'butt';
        s_default['-x-mapnik-layer'] = 'top';
      }
      if (type === 'way' && tags['barrier'] === 'fence') {
        s_default['width'] = 0.3;
        s_default['color'] = 'black';
        s_default['z-index'] = 16;
        s_default['-x-mapnik-layer'] = 'top';
      }
      if (type === 'way' && tags['barrier'] === 'wall') {
        s_default['width'] = 0.5;
        s_default['color'] = 'black';
        s_default['z-index'] = 16;
        s_default['-x-mapnik-layer'] = 'top';
      }
      if (type === 'way' && tags['marking'] === 'sport' && !tags.hasOwnProperty('colour') && !tags.hasOwnProperty('color')) {
        s_default['width'] = 0.5;
        s_default['color'] = '#a0a0a0';
        s_default['z-index'] = 16;
        s_default['-x-mapnik-layer'] = 'top';
      }
      if (type === 'way' && tags['marking'] === 'sport' && tags['colour'] === 'white' || type === 'way' && tags['marking'] === 'sport' && tags['color'] === 'white') {
        s_default['width'] = 1;
        s_default['color'] = 'white';
        s_default['z-index'] = 16;
        s_default['-x-mapnik-layer'] = 'top';
      }
      if (type === 'way' && tags['marking'] === 'sport' && tags['colour'] === 'red' || type === 'way' && tags['marking'] === 'sport' && tags['color'] === 'red') {
        s_default['width'] = 1;
        s_default['color'] = '#c00000';
        s_default['z-index'] = 16;
        s_default['-x-mapnik-layer'] = 'top';
      }
      if (type === 'way' && tags['marking'] === 'sport' && tags['colour'] === 'black' || type === 'way' && tags['marking'] === 'sport' && tags['color'] === 'black') {
        s_default['width'] = 1;
        s_default['color'] = 'black';
        s_default['z-index'] = 16;
        s_default['-x-mapnik-layer'] = 'top';
      }
      if (type === 'node' && tags['amenity'] === 'place_of_worship') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-color'] = '#623f00';
        s_default['font-family'] = 'DejaVu Serif Italic';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-offset'] = 3;
        s_default['max-width'] = 70;
      }
      if (selector === 'area' && tags['amenity'] === 'place_of_worship') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-color'] = '#623f00';
        s_default['font-family'] = 'DejaVu Serif Italic';
        s_default['font-size'] = '9';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-offset'] = 3;
        s_default['max-width'] = 70;
        s_default['z-index'] = 16;
        s_default['width'] = 0.1;
        s_default['color'] = '#111111';
        s_default['text-opacity'] = '1';
        s_default['fill-color'] = '#777777';
        s_default['fill-opacity'] = 0.5;
      }
      if (selector === 'area' && tags['boundary'] === 'administrative' && tags['admin_level'] === '2') {
        s_default['width'] = 0.5;
        s_default['color'] = '#202020';
        s_default['dashes'] = [6, 4];
        s_default['opacity'] = 0.7;
        s_default['z-index'] = 16;
      }
      if (selector === 'area' && tags['boundary'] === 'administrative' && tags['admin_level'] === '3') {
        s_default['width'] = 1.3;
        s_default['color'] = '#ff99cc';
        s_default['opacity'] = 0.5;
        s_default['z-index'] = 16;
      }
      if (selector === 'area' && tags['boundary'] === 'administrative' && tags['admin_level'] === '6') {
        s_default['width'] = 0.5;
        s_default['color'] = '#101010';
        s_default['dashes'] = [1, 2];
        s_default['opacity'] = 0.6;
        s_default['z-index'] = 16.1;
      }
      if (selector === 'area' && tags['boundary'] === 'administrative' && tags['admin_level'] === '4') {
        s_default['width'] = 0.7;
        s_default['color'] = '#000000';
        s_default['dashes'] = [1, 2];
        s_default['opacity'] = 0.8;
        s_default['z-index'] = 16.3;
      }
      if (type === 'way' && tags['railway'] === 'tram') {
        s_default['z-index'] = 17;
      }
      if (type === 'node' && tags['railway'] === 'station' && tags['transport'] !== 'subway') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = 7;
        s_default['font-size'] = '9';
        s_default['font-family'] = 'DejaVu Sans Mono Book';
        s_default['text-halo-radius'] = 1;
        s_default['text-color'] = '#000d6c';
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-allow-overlap'] = 'false';
        s_default['-x-mapnik-min-distance'] = '0';
      }
      if (type === 'node' && tags['railway'] === 'subway_entrance') {
        s_default['z-index'] = 17;
      }
      if (type === 'node' && tags['railway'] === 'subway_entrance' && tags.hasOwnProperty('name')) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = 11;
        s_default['font-size'] = '9';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['text-halo-radius'] = 2;
        s_default['text-color'] = '#1300bb';
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-allow-overlap'] = 'false';
        s_default['-x-mapnik-min-distance'] = '0';
      }
      if (type === 'node' && tags['aeroway'] === 'aerodrome') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = 12;
        s_default['font-size'] = '9';
        s_default['font-family'] = 'DejaVu Sans Condensed Bold';
        s_default['text-halo-radius'] = 1;
        s_default['text-color'] = '#1e7ca5';
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-allow-overlap'] = 'false';
        s_default['z-index'] = 17;
      }
      if (type === 'node' && tags['place'] === 'town') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['font-size'] = '80';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['text-color'] = '#101010';
        s_default['text-opacity'] = '0.2';
        s_default['text-allow-overlap'] = 'true';
        s_default['z-index'] = 20;
      }
      if (type === 'node' && tags['place'] === 'city') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['font-size'] = '100';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['text-color'] = '#101010';
        s_default['text-opacity'] = '0.3';
        s_default['text-allow-overlap'] = 'true';
        s_default['z-index'] = 20;
      }
      if (type === 'node' && tags['place'] === 'village') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = 1;
        s_default['font-size'] = '9';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['text-halo-radius'] = 1;
        s_default['text-color'] = '#606060';
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-allow-overlap'] = 'false';
      }
      if (type === 'node' && tags['place'] === 'hamlet') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = 1;
        s_default['font-size'] = '8';
        s_default['font-family'] = 'DejaVu Sans Book';
        s_default['text-halo-radius'] = 1;
        s_default['text-color'] = '#505050';
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-allow-overlap'] = 'false';
      }
      if (selector === 'area' && tags['landuse'] === 'nature_reserve' || selector === 'area' && tags['leisure'] === 'park') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = 1;
        s_default['font-size'] = '10';
        s_default['font-family'] = 'DejaVu Serif Italic';
        s_default['text-halo-radius'] = 0;
        s_default['text-color'] = '#3c8000';
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-allow-overlap'] = 'false';
      }
      if (type === 'way' && tags['waterway'] === 'stream' || type === 'way' && tags['waterway'] === 'river' || type === 'way' && tags['waterway'] === 'canal') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['font-size'] = '9';
        s_default['font-family'] = 'DejaVu Sans Oblique';
        s_default['text-color'] = '#547bd1';
        s_default['text-halo-radius'] = 1;
        s_default['text-halo-color'] = '#ffffff';
        s_default['text-position'] = 'line';
      }
      if (type === 'node' && tags['place'] === 'ocean') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = 0;
        s_default['font-size'] = '11';
        s_default['font-family'] = 'DejaVu Sans Oblique';
        s_default['text-halo-radius'] = 1;
        s_default['text-color'] = '#202020';
        s_default['text-halo-color'] = '#ffffff';
        s_default['z-index'] = -1;
        s_default['-x-mapnik-min-distance'] = '0';
      }
      if (type === 'node' && tags['place'] === 'sea') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = 0;
        s_default['font-size'] = '10';
        s_default['font-family'] = 'DejaVu Sans Oblique';
        s_default['text-halo-radius'] = 1;
        s_default['text-color'] = '#4976d1';
        s_default['text-halo-color'] = '#ffffff';
        s_default['-x-mapnik-min-distance'] = '0';
      }
      if (type === 'node' && tags['natural'] === 'peak') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = 3;
        s_default['font-size'] = '7';
        s_default['font-family'] = 'DejaVu Sans Mono Book';
        s_default['text-halo-radius'] = 0;
        s_default['text-color'] = '#664229';
        s_default['text-halo-color'] = '#ffffff';
        s_default['-x-mapnik-min-distance'] = '0';
      }
      if (selector === 'area' && tags['boundary'] === 'administrative' && tags['admin_level'] === '6') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['text-offset'] = -10;
        s_default['font-size'] = '12';
        s_default['font-family'] = 'DejaVu Sans ExtraLight';
        s_default['text-halo-radius'] = 1;
        s_default['text-color'] = '#7848a0';
        s_default['text-halo-color'] = '#ffffff';
      }
      if (type === 'node' && tags['place'] === 'suburb') {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'name');
        s_default['font-size'] = '12';
        s_default['font-family'] = 'DejaVu Sans ExtraLight';
        s_default['text-color'] = '#7848a0';
        s_default['z-index'] = 20;
      }
      if (selector === 'area' && tags.hasOwnProperty('building')) {
        s_default['width'] = 0.3;
        s_default['color'] = '#cca352';
        s_default['z-index'] = 17;
      }
      if (selector === 'area' && tags.hasOwnProperty('building') && zoom >= 19) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'addr:housenumber');
        s_default['text-halo-radius'] = 1;
        s_default['text-position'] = 'center';
        s_default['font-size'] = '8';
        s_default['-x-mapnik-min-distance'] = '10';
        s_default['opacity'] = 0.8;
      }
      if (type === 'node' && tags['highway'] === 'milestone' && tags.hasOwnProperty('pk')) {
        s_default['text'] = _mapcss["default"].e_localize(tags, 'pk');
        s_default['font-size'] = '7';
        s_default['text-halo-radius'] = 5;
        s_default['-x-mapnik-min-distance'] = '0';
      }
      if (type === 'way' && selector === 'line' && tags['highway'] === undefined) {
        s_default['color'] = '#000000';
        s_default['width'] = 0.5;
      }
      if (type === 'way' && selector === 'line' && tags['highway'] === undefined) {
        s_default['color'] = '#000000';
        s_default['width'] = 1;
      }
      if (type === 'way' && selector === 'line' && tags['highway'] === undefined) {
        s_default['color'] = '#000000';
        s_default['width'] = 1.5;
      }
      if (Object.keys(s_default).length) {
        style['default'] = s_default;
      }
      if (Object.keys(s_centerline).length) {
        style['centerline'] = s_centerline;
      }
      if (Object.keys(s_ticks).length) {
        style['ticks'] = s_ticks;
      }
      if (Object.keys(s_label).length) {
        style['label'] = s_label;
      }
      return style;
    }
  }]);
}();

},{"./mapcss":9}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _mapcss = _interopRequireDefault(require("./mapcss"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Style = exports["default"] = /*#__PURE__*/function () {
  function Style() {
    _classCallCheck(this, Style);
    this._defaultCanvasStyles = {
      strokeStyle: 'rgba(0,0,0,0.5)',
      fillStyle: 'rgba(0,0,0,0.5)',
      lineWidth: 1,
      lineCap: 'round',
      lineJoin: 'round',
      textAlign: 'center',
      textBaseline: 'middle'
    };
  }
  return _createClass(Style, null, [{
    key: "defaultCanvasStyles",
    get: function get() {
      return this._defaultCanvasStyles;
    }
  }, {
    key: "populateLayers",
    value: function populateLayers(features, zoom, styles) {
      var layers = {},
        i,
        len,
        feature,
        layerId,
        layerStyle;
      var styledFeatures = Style.styleFeatures(features, zoom, styles);
      for (i = 0, len = styledFeatures.length; i < len; i++) {
        feature = styledFeatures[i];
        layerStyle = feature.style['-x-mapnik-layer'];
        layerId = !layerStyle ? feature.properties.layer || 1000 : layerStyle === 'top' ? 10000 : layerStyle;
        layers[layerId] = layers[layerId] || [];
        layers[layerId].push(feature);
      }
      return layers;
    }
  }, {
    key: "getStyle",
    value: function getStyle(feature, zoom, styleNames) {
      var shape = feature.type,
        type,
        selector;
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
      return _mapcss["default"].shared.restyle(styleNames, feature.properties, zoom, type, selector);
    }
  }, {
    key: "styleFeatures",
    value: function styleFeatures(features, zoom, styleNames) {
      var styledFeatures = [],
        i,
        j,
        len,
        feature,
        style,
        restyledFeature,
        k;
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
        return a.zIndex < b.zIndex ? -1 : a.zIndex > b.zIndex ? 1 : 0;
      });
      return styledFeatures;
    }
  }, {
    key: "getFontString",
    value: function getFontString(name, size, st) {
      name = name || '';
      size = size || 9;
      var family = name ? name + ', ' : '';
      name = name.toLowerCase();
      var styles = [];
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
  }, {
    key: "setStyles",
    value: function setStyles(ctx, styles) {
      var i;
      for (i in styles) {
        if (styles.hasOwnProperty(i)) {
          ctx[i] = styles[i];
        }
      }
    }
  }]);
}();

},{"./mapcss":9}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _rbush = _interopRequireDefault(require("./rbush"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var CollisionBuffer = exports["default"] = /*#__PURE__*/function () {
  function CollisionBuffer(height, width) {
    _classCallCheck(this, CollisionBuffer);
    this.buffer = new _rbush["default"]();
    this.height = height;
    this.width = width;
  }
  return _createClass(CollisionBuffer, [{
    key: "addPointWH",
    value: function addPointWH(point, w, h, d, id) {
      this.buffer.insert(CollisionBuffer.getBoxFromPoint(point, w, h, d, id));
    }
  }, {
    key: "addPoints",
    value: function addPoints(params) {
      var points = [];
      for (var i = 0, len = params.length; i < len; i++) {
        points.push(CollisionBuffer.getBoxFromPoint.apply(this, params[i]));
      }
      this.buffer.load(points);
    }
  }, {
    key: "checkBox",
    value: function checkBox(b, id) {
      var result = this.buffer.search(b),
        i,
        len;
      if (b[0] < 0 || b[1] < 0 || b[2] > this.width || b[3] > this.height) {
        return true;
      }
      for (i = 0, len = result.length; i < len; i++) {
        // if it's the same object (only different styles), don't detect collision
        if (id !== result[i][4]) {
          return false; //true
        }
      }
      return false;
    }
  }, {
    key: "checkPointWH",
    value: function checkPointWH(point, w, h, id) {
      return this.checkBox(CollisionBuffer.getBoxFromPoint(point, w, h, 0), id);
    }
  }], [{
    key: "getBoxFromPoint",
    value: function getBoxFromPoint(point, w, h, d, id) {
      var dx = w / 2 + d,
        dy = h / 2 + d;
      return [point[0] - dx, point[1] - dy, point[0] + dx, point[1] + dy, id];
    }
  }]);
}();

},{"./rbush":14}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var Geom = exports["default"] = /*#__PURE__*/function () {
  function Geom() {
    _classCallCheck(this, Geom);
  }
  return _createClass(Geom, null, [{
    key: "transformPoint",
    value: function transformPoint(point, ws, hs) {
      return [ws * point[0], hs * point[1]];
    }
  }, {
    key: "transformPoints",
    value: function transformPoints(points, ws, hs) {
      var transformed = [],
        i,
        len;
      for (i = 0, len = points.length; i < len; i++) {
        if (points[i] !== undefined) transformed.push(this.transformPoint(points[i], ws, hs));
      }
      return transformed;
    }
  }, {
    key: "getReprPoint",
    value: function getReprPoint(feature) {
      var point, len;
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
  }, {
    key: "getPolyLength",
    value: function getPolyLength(points) {
      var pointsLen = points.length,
        c,
        pc,
        i,
        dx,
        dy,
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
  }, {
    key: "getAngleAndCoordsAtLength",
    value: function getAngleAndCoordsAtLength(points, dist, width) {
      var pointsLen = points.length,
        dx,
        dy,
        x,
        y,
        i,
        c,
        pc,
        len = 0,
        segLen = 0,
        angle,
        partLen,
        sameseg = true,
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
  }]);
}();

},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/*
 (c) 2013, Vladimir Agafonkin
 RBush, a JavaScript library for high-performance 2D spatial indexing of points and rectangles.
 https://github.com/mourner/rbush
*/
var rbush = exports["default"] = /*#__PURE__*/function () {
  function rbush(maxEntries, format) {
    _classCallCheck(this, rbush);
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
  return _createClass(rbush, [{
    key: "all",
    value: function all() {
      return this._all(this.data, []);
    }
  }, {
    key: "search",
    value: function search(bbox) {
      var node = this.data,
        result = [],
        toBBox = this.toBBox;
      if (!this.intersects(bbox, node.bbox)) return result;
      var nodesToSearch = [],
        i,
        len,
        child,
        childBBox;
      while (node) {
        for (i = 0, len = node.children.length; i < len; i++) {
          child = node.children[i];
          childBBox = node.leaf ? toBBox(child) : child.bbox;
          if (this.intersects(bbox, childBBox)) {
            if (node.leaf) result.push(child);else if (contains(bbox, childBBox)) this._all(child, result);else nodesToSearch.push(child);
          }
        }
        node = nodesToSearch.pop();
      }
      return result;
    }
  }, {
    key: "load",
    value: function load(data) {
      if (!(data && data.length)) return this;
      if (data.length < this._minEntries) {
        for (var i = 0, len = data.length; i < len; i++) {
          this.insert(data[i]);
        }
        return this;
      }

      // recursively build the tree with the given data from stratch using OMT algorithm
      var node = this._build(data.slice(), 0, data.length - 1, 0);
      if (!this.data.children.length) {
        // save as is if tree is empty
        this.data = node;
      } else if (this.data.height === node.height) {
        // split root if trees have the same height
        this._splitRoot(this.data, node);
      } else {
        if (this.data.height < node.height) {
          // swap trees if inserted one is bigger
          var tmpNode = this.data;
          this.data = node;
          node = tmpNode;
        }

        // insert the small tree into the large tree at appropriate level
        this._insert(node, this.data.height - node.height - 1, true);
      }
      return this;
    }
  }, {
    key: "insert",
    value: function insert(item) {
      if (item) this._insert(item, this.data.height - 1);
      return this;
    }
  }, {
    key: "clear",
    value: function clear() {
      this.data = {
        children: [],
        height: 1,
        bbox: this.empty(),
        leaf: true
      };
      return this;
    }
  }, {
    key: "remove",
    value: function remove(item) {
      if (!item) return this;
      var node = this.data,
        bbox = this.toBBox(item),
        path = [],
        indexes = [],
        i,
        parent,
        index,
        goingUp;

      // depth-first iterative tree traversal
      while (node || path.length) {
        if (!node) {
          // go up
          node = path.pop();
          parent = path[path.length - 1];
          i = indexes.pop();
          goingUp = true;
        }
        if (node.leaf) {
          // check current node
          index = node.children.indexOf(item);
          if (index !== -1) {
            // item found, remove the item and condense tree upwards
            node.children.splice(index, 1);
            path.push(node);
            this._condense(path);
            return this;
          }
        }
        if (!goingUp && !node.leaf && contains(node.bbox, bbox)) {
          // go down
          path.push(node);
          indexes.push(i);
          i = 0;
          parent = node;
          node = node.children[0];
        } else if (parent) {
          // go right
          i++;
          node = parent.children[i];
          goingUp = false;
        } else node = null; // nothing found
      }
      return this;
    }
  }, {
    key: "toBBox",
    value: function toBBox(item) {
      return item;
    }
  }, {
    key: "compareMinX",
    value: function compareMinX(a, b) {
      return a[0] - b[0];
    }
  }, {
    key: "compareMinY",
    value: function compareMinY(a, b) {
      return a[1] - b[1];
    }
  }, {
    key: "toJSON",
    value: function toJSON() {
      return this.data;
    }
  }, {
    key: "fromJSON",
    value: function fromJSON(data) {
      this.data = data;
      return this;
    }
  }, {
    key: "_all",
    value: function _all(node, result) {
      var nodesToSearch = [];
      while (node) {
        if (node.leaf) result.push.apply(result, node.children);else nodesToSearch.push.apply(nodesToSearch, node.children);
        node = nodesToSearch.pop();
      }
      return result;
    }
  }, {
    key: "_build",
    value: function _build(items, left, right, height) {
      var N = right - left + 1,
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

      var N2 = Math.ceil(N / M),
        N1 = N2 * Math.ceil(Math.sqrt(M)),
        i,
        j,
        right2,
        right3;
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
  }, {
    key: "_chooseSubtree",
    value: function _chooseSubtree(bbox, node, level, path) {
      var i, len, child, targetNode, area, enlargement, minArea, minEnlargement;
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
  }, {
    key: "_insert",
    value: function _insert(item, level, isNode) {
      var toBBox = this.toBBox,
        bbox = isNode ? item.bbox : toBBox(item),
        insertPath = [];

      // find the best node for accommodating the item, saving all nodes along the path too
      var node = this._chooseSubtree(bbox, this.data, level, insertPath);

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
  }, {
    key: "_split",
    value: function _split(insertPath, level) {
      var node = insertPath[level],
        M = node.children.length,
        m = this._minEntries;
      this._chooseSplitAxis(node, m, M);
      var newNode = {
        children: node.children.splice(this._chooseSplitIndex(node, m, M)),
        height: node.height
      };
      if (node.leaf) newNode.leaf = true;
      this.calcBBox(node, this.toBBox);
      this.calcBBox(newNode, this.toBBox);
      if (level) insertPath[level - 1].children.push(newNode);else this._splitRoot(node, newNode);
    }
  }, {
    key: "_splitRoot",
    value: function _splitRoot(node, newNode) {
      // split root node
      this.data = {
        children: [node, newNode],
        height: node.height + 1
      };
      this.calcBBox(this.data, this.toBBox);
    }
  }, {
    key: "_chooseSplitIndex",
    value: function _chooseSplitIndex(node, m, M) {
      var i, bbox1, bbox2, overlap, area, minOverlap, minArea, index;
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
  }, {
    key: "_chooseSplitAxis",
    value: function _chooseSplitAxis(node, m, M) {
      var compareMinX = node.leaf ? this.compareMinX : this.compareNodeMinX,
        compareMinY = node.leaf ? this.compareMinY : this.compareNodeMinY,
        xMargin = this._allDistMargin(node, m, M, compareMinX),
        yMargin = this._allDistMargin(node, m, M, compareMinY);

      // if total distributions margin value is minimal for x, sort by minX,
      // otherwise it's already sorted by minY
      if (xMargin < yMargin) node.children.sort(compareMinX);
    }

    // total margin of all possible split distributions where each node is at least m full
  }, {
    key: "_allDistMargin",
    value: function _allDistMargin(node, m, M, compare) {
      node.children.sort(compare);
      var toBBox = this.toBBox,
        leftBBox = this.distBBox(node, 0, m, toBBox),
        rightBBox = this.distBBox(node, M - m, M, toBBox),
        margin = this.bboxMargin(leftBBox) + this.bboxMargin(rightBBox),
        i,
        child;
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
  }, {
    key: "_adjustParentBBoxes",
    value: function _adjustParentBBoxes(bbox, path, level) {
      // adjust bboxes along the given tree path
      for (var i = level; i >= 0; i--) {
        this.extend(path[i].bbox, bbox);
      }
    }
  }, {
    key: "_condense",
    value: function _condense(path) {
      // go through the path, removing empty nodes and updating bboxes
      for (var i = path.length - 1, siblings; i >= 0; i--) {
        if (path[i].children.length === 0) {
          if (i > 0) {
            siblings = path[i - 1].children;
            siblings.splice(siblings.indexOf(path[i]), 1);
          } else this.clear();
        } else this.calcBBox(path[i], this.toBBox);
      }
    }
  }, {
    key: "_initFormat",
    value: function _initFormat(format) {
      // data format (minX, minY, maxX, maxY accessors)

      // uses eval-type compilation instead of just accepting a toBBox function
      // because the algorithms are very sensitive to sorting functions performance,
      // so they should be dead simple and without inner calls

      // jshint evil: true

      var compareArr = ['return a', ' - b', ';'];
      this.compareMinX = new Function('a', 'b', compareArr.join(format[0]));
      this.compareMinY = new Function('a', 'b', compareArr.join(format[1]));
      this.toBBox = new Function('a', 'return [a' + format.join(', a') + '];');
    }

    // calculate node's bbox from bboxes of its children
  }, {
    key: "calcBBox",
    value: function calcBBox(node, toBBox) {
      node.bbox = this.distBBox(node, 0, node.children.length, toBBox);
    }

    // min bounding rectangle of node children from k to p-1
  }, {
    key: "distBBox",
    value: function distBBox(node, k, p, toBBox) {
      var bbox = this.empty();
      for (var i = k, child; i < p; i++) {
        child = node.children[i];
        this.extend(bbox, node.leaf ? toBBox(child) : child.bbox);
      }
      return bbox;
    }
  }, {
    key: "empty",
    value: function empty() {
      return [Infinity, Infinity, -Infinity, -Infinity];
    }
  }, {
    key: "extend",
    value: function extend(a, b) {
      a[0] = Math.min(a[0], b[0]);
      a[1] = Math.min(a[1], b[1]);
      a[2] = Math.max(a[2], b[2]);
      a[3] = Math.max(a[3], b[3]);
      return a;
    }
  }, {
    key: "compareNodeMinX",
    value: function compareNodeMinX(a, b) {
      return a.bbox[0] - b.bbox[0];
    }
  }, {
    key: "compareNodeMinY",
    value: function compareNodeMinY(a, b) {
      return a.bbox[1] - b.bbox[1];
    }
  }, {
    key: "bboxArea",
    value: function bboxArea(a) {
      return (a[2] - a[0]) * (a[3] - a[1]);
    }
  }, {
    key: "bboxMargin",
    value: function bboxMargin(a) {
      return a[2] - a[0] + (a[3] - a[1]);
    }
  }, {
    key: "enlargedArea",
    value: function enlargedArea(a, b) {
      return (Math.max(b[2], a[2]) - Math.min(b[0], a[0])) * (Math.max(b[3], a[3]) - Math.min(b[1], a[1]));
    }
  }, {
    key: "intersectionArea",
    value: function intersectionArea(a, b) {
      var minX = Math.max(a[0], b[0]),
        minY = Math.max(a[1], b[1]),
        maxX = Math.min(a[2], b[2]),
        maxY = Math.min(a[3], b[3]);
      return Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
    }
  }, {
    key: "contains",
    value: function contains(a, b) {
      return a[0] <= b[0] && a[1] <= b[1] && b[2] <= a[2] && b[3] <= a[3];
    }
  }, {
    key: "intersects",
    value: function intersects(a, b) {
      return b[0] <= a[2] && b[1] <= a[3] && b[2] >= a[0] && b[3] >= a[1];
    }

    // sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
    // combines selection algorithm with binary divide & conquer approach
  }, {
    key: "multiSelect",
    value: function multiSelect(arr, left, right, n, compare) {
      var stack = [left, right],
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
  }, {
    key: "select",
    value: function select(arr, left, right, k, compare) {
      var n, i, z, s, sd, newLeft, newRight, t, j;
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
        if (compare(arr[left], t) === 0) this.swap(arr, left, j);else {
          j++;
          this.swap(arr, j, right);
        }
        if (j <= k) left = j + 1;
        if (k <= j) right = j - 1;
      }
    }
  }, {
    key: "swap",
    value: function swap(arr, i, j) {
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }]);
}();

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMva290aGljLmpzIiwic3JjL3JlbmRlcmVyL2xpbmUuanMiLCJzcmMvcmVuZGVyZXIvcGF0aC5qcyIsInNyYy9yZW5kZXJlci9wb2x5Z29uLmpzIiwic3JjL3JlbmRlcmVyL3NoaWVsZHMuanMiLCJzcmMvcmVuZGVyZXIvdGV4dC5qcyIsInNyYy9yZW5kZXJlci90ZXh0aWNvbnMuanMiLCJzcmMvc3R5bGUvbWFwY3NzLmpzIiwic3JjL3N0eWxlL29zbW9zbmlta2kuanMiLCJzcmMvc3R5bGUvc3R5bGUuanMiLCJzcmMvdXRpbHMvY29sbGlzaW9ucy5qcyIsInNyYy91dGlscy9nZW9tLmpzIiwic3JjL3V0aWxzL3JidXNoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxPQUFBO0FBQ0EsT0FBQTtBQUNBLE9BQUE7QUFDQSxPQUFBO0FBQ0EsT0FBQTtBQUNBLE9BQUE7QUFDQSxPQUFBO0FBQ0EsT0FBQTtBQUNBLE9BQUE7QUFDQSxPQUFBO0FBQ0EsT0FBQTtBQUNBLE9BQUE7QUFDQSxPQUFBOzs7Ozs7Ozs7QUNaQSxJQUFBLE9BQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFDQSxJQUFBLFdBQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFDQSxJQUFBLE1BQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFDQSxJQUFBLFFBQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFDQSxJQUFBLEtBQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFDQSxJQUFBLFFBQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFDQSxJQUFBLFVBQUEsR0FBQSxzQkFBQSxDQUFBLE9BQUE7QUFBNkMsU0FBQSx1QkFBQSxDQUFBLFdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQSxVQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBO0FBQUEsU0FBQSxRQUFBLENBQUEsc0NBQUEs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LENBQUM7UUFBRSxLQUFLO1FBQUUsQ0FBQztRQUNYLE1BQU0sR0FBRyxFQUFFO01BRWYsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2xDLElBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7VUFDOUIsV0FBVyxHQUFHLFFBQVEsQ0FBQyxNQUFNOztRQUVqQztRQUNBLEtBQUssQ0FBQyxHQUFHLFdBQVcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtVQUNuQyxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7VUFDekIsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRTtZQUNuRCxxQkFBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUM7VUFDNUU7UUFDSjs7UUFFQTtRQUNBLEtBQUssQ0FBQyxHQUFHLFdBQVcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtVQUNuQyxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7VUFDekIsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtZQUNuRCxxQkFBUyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUM7VUFDNUU7UUFDSjs7UUFFQTtRQUNBLEtBQUssQ0FBQyxHQUFHLFdBQVcsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtVQUNuQyxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUs7VUFDekIsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUU7WUFDbEQscUJBQVMsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsRUFBRSxlQUFlLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO1VBQzNFO1FBQ0o7O1FBRUE7UUFDQSxLQUFLLENBQUMsR0FBRyxXQUFXLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7VUFDbkMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLO1VBQ3pCLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFO1lBQ3RCLG1CQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsZUFBZSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUM7VUFDN0Q7UUFDSjtNQUNKO01BRUEsT0FBTyxNQUFNO0lBQ2pCO0VBQUM7QUFBQTtBQUNKOzs7Ozs7Ozs7QUNsT0QsSUFBQSxLQUFBLEdBQUEsc0JBQUEsQ0FBQSxPQUFBO0FBQ0EsSUFBQSxNQUFBLEdBQUEsc0JBQUEsQ0FBQSxPQUFBO0FBQ0EsSUFBQSxPQUFBLEdBQUEsc0JBQUEsQ0FBQSxPQUFBO0FBQXFDLFNBQUEsdUJBQUEsQ0FBQSxXQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsVUFBQSxHQUFBLENBQUEsZ0JBQUEsQ0FBQTtBQUFBLFNBQUEsUUFBQSxDQUFBLHNDQUFBLE9BQUEsd0JBQUEsTUFBQSx1QkFBQSxNQUFBLENBQUEsUUFBQSxhQUFBLENBQUEsa0JBQUEsQ0FBQSxnQkFBQSxDQUFBLFdBQUEsQ0FBQSx5QkFBQSxNQUFBLElBQUEsQ0FBQSxDQUFBLFdBQUEsS0FBQSxNQUFBLElBQUEsQ0FBQSxLQUFBLE1BQUEsQ0FBQSxTQUFBLHFCQUFBLENBQUEsS0FBQSxPQUFBLENBQUEsQ0FBQTtBQUFBLFNBQUEsZ0JBQUEsQ0FBQSxFQUFBLENBQUEsVUFBQSxDQUFBLFlBQUEsQ0FBQSxhQUFBLFNBQUE7QUFBQSxTQUFBLGtCQUFBLENBQUEsRUFBQSxDQUFBLGFBQUEsQ0FBQSxNQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsTUFBQSxFQUFBLENBQUEsVUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsVUFBQSxHQUFBLENBQUEsQ0FBQSxVQUFBLFFBQUEsQ0FBQSxDQUFBLFlBQUEsa0JBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxRQUFBLFFBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxDQUFBLEVBQUEsY0FBQSxDQUFBLENBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQTtBQUFBLFNBQUEsYUFBQSxDQUFBLEVBQUEsQ0FBQSxFQUFBLENBQUEsV0FBQSxDQUFBLElBQUEsaUJBQUEsQ0FBQSxDQUFBLENBQUEsU0FBQSxFQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsaUJBQUEsQ0FBQSxDQUFBLEVBQUEsQ0FBQSxHQUFBLE1BQUEsQ0FBQSxjQUFBLENBQUEsQ0FBQSxpQkFBQSxRQUFBLFNBQUEsQ0FBQTtBQUFBLFNBQUEsZUFBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLFlBQUEsQ0FBQSxDQUFBLGdDQUFBLE9BQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxHQUFBLENBQUE7QUFBQSxTQUFBLGFBQUEsQ0FBQSxFQUFBLENBQUEsb0JBQUEsT0FBQSxDQUFBLENBQUEsTUFBQSxDQUFBLFNBQUEsQ0FBQSxNQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsTUFBQSxDQUFBLFdBQUEsa0JBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLENBQUEsRUFBQSxDQUFBLGdDQUFBLE9BQUEsQ0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLFNBQUEseUVBQUEsQ0FB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LFFBQUEsQ0FBQSxzQ0FBQSxPQUFBLHdCQUFBLE1BQUEsdUJBQUEsTUFBQSxDQUFBLFFBQUEsYUFBQSxDQUFBLGtCQUFBLENBQUEsZ0JBQUEsQ0FBQSxXQUFBLENBQUEseUJBQUEsTUFBQSxJQUFBLENBQUEsQ0FBQSxXQUFBLEtBQUEsTUFBQSxJQUFBLENBQUEsS0FBQSxNQUFBLENBQUEsU0FBQSxxQkFBQSxDQUFBLEtBQUEsT0FBQSxDQUFBLENBQUE7QUFBQSxTQUFBLGdCQUFBLENBQUEsRUFBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLENBQUEsYUFBQSxTQUFBO0FBQUEsU0FBQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxhQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLE1BQUEsRUFBQSxDQUFBLFVBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBLFVBQUEsR0FBQSxDQUFBLENBQUEsVUFBQSxRQUFBLENBQUEsQ0FBQSxZQUFBLGtCQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsUUFBQSxRQUFBLE1BQUEsQ0FBQSxjQUFBLENBQUEsQ0FBQSxFQUFBLGNBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxHQUFBLENBQUE7QUFBQSxTQUFBLGFBQUEsQ0FBQSxFQUFBLENBQUEsRUFBQSxDQUFBLFdBQUEsQ0FBQSxJQUFBLGlCQUFBLENBQUEsQ0FBQSxDQUFBLFNBQUEsRUFBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLGlCQUFBLENBQUEsQ0FBQSxFQUFBLENBQUEsR0FBQSxNQUFBLENBQUEsY0FBQSxDQUFBLENBQUEsaUJBQUEsUUFBQSxTQUFBLENBQUE7QUFBQSxTQUFBLGVBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxZQUFBLENBQUEsQ0FBQSxnQ0FBQSxPQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBO0FBQUEsU0FBQSxhQUFBLENBQUEsRUFBQSxDQUFBLG9CQUFBLE9BQUEsQ0FBQSxDQUFBLE1BQUEsQ0FBQSxTQUFBLENBQUEsTUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFB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QUFJLENBQUMsQ0FBQyxDQUFDO0lBQUU7RUFBQztJQUFBLEdBQUE7SUFBQSxLQUFBLEVBQ3ZELFNBQUEsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7TUFBRSxPQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFBRTtFQUFDO0lBQUEsR0FBQTtJQUFBLEtBQUEsRUFFdkQsU0FBQSxRQUFRLENBQUMsQ0FBQyxFQUFJO01BQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFFO0VBQUM7SUFBQSxHQUFBO0lBQUEsS0FBQSxFQUN2RCxTQUFBLFVBQVUsQ0FBQyxDQUFDLEVBQUU7TUFBRSxPQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUFFO0VBQUM7SUFBQSxHQUFBO0lBQUEsS0FBQSxFQUV2RCxTQUFBLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO01BQ2YsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUM5QyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJ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RyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDaEIsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7TUFDZixHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRztJQUNoQjtFQUFDO0FBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQgJy4va290aGljLmpzJztcbmltcG9ydCAnLi9yZW5kZXJlci9saW5lLmpzJztcbmltcG9ydCAnLi9yZW5kZXJlci9wYXRoLmpzJztcbmltcG9ydCAnLi9yZW5kZXJlci9wb2x5Z29uLmpzJztcbmltcG9ydCAnLi9yZW5kZXJlci90ZXh0aWNvbnMuanMnO1xuaW1wb3J0ICcuL3JlbmRlcmVyL3NoaWVsZHMuanMnO1xuaW1wb3J0ICcuL3JlbmRlcmVyL3RleHQuanMnO1xuaW1wb3J0ICcuL3N0eWxlL21hcGNzcy5qcyc7XG5pbXBvcnQgJy4vc3R5bGUvc3R5bGUuanMnO1xuaW1wb3J0ICcuL3N0eWxlL29zbW9zbmlta2kuanMnO1xuaW1wb3J0ICcuL3V0aWxzL2NvbGxpc2lvbnMuanMnO1xuaW1wb3J0ICcuL3V0aWxzL2dlb20uanMnO1xuaW1wb3J0ICcuL3V0aWxzL3JidXNoLmpzJztcbiIsImltcG9ydCBNYXBDU1MgZnJvbSAnLi9zdHlsZS9tYXBjc3MnO1xuaW1wb3J0IENvbGxpc2lvbkJ1ZmZlciBmcm9tIFwiLi91dGlscy9jb2xsaXNpb25zXCI7XG5pbXBvcnQgU3R5bGUgZnJvbSBcIi4vc3R5bGUvc3R5bGVcIjtcbmltcG9ydCBQb2x5Z29uIGZyb20gXCIuL3JlbmRlcmVyL3BvbHlnb25cIjtcbmltcG9ydCBMaW5lIGZyb20gXCIuL3JlbmRlcmVyL2xpbmVcIjtcbmltcG9ydCBTaGllbGRzIGZyb20gXCIuL3JlbmRlcmVyL3NoaWVsZHNcIjtcbmltcG9ydCBUZXh0aWNvbnMgZnJvbSBcIi4vcmVuZGVyZXIvdGV4dGljb25zXCI7XG5cbi8qXG4gKGMpIDIwMTMsIERhcmFmZWkgUHJhbGlhc2tvdXNraSwgVmxhZGltaXIgQWdhZm9ua2luLCBNYWtzaW0gR3VydG92ZW5rb1xuIEtvdGhpYyBKUyBpcyBhIGZ1bGwtZmVhdHVyZWQgSmF2YVNjcmlwdCBtYXAgcmVuZGVyaW5nIGVuZ2luZSB1c2luZyBIVE1MNSBDYW52YXMuXG4gaHR0cDovL2dpdGh1Yi5jb20va290aGljL2tvdGhpYy1qc1xuKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEtvdGhpYyB7XG5cbiAgICBzdGF0aWMgcmVuZGVyKGNhbnZhcywgZGF0YSwgem9vbSwgb3B0aW9ucykge1xuXG4gICAgICAgIGlmIChkYXRhID09IG51bGwpIHJldHVybjtcbiAgICAgICAgaWYgKHR5cGVvZiBjYW52YXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChjYW52YXMpO1xuICAgICAgICB9XG5cblxuICAgICAgICBsZXQgc3R5bGVzID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5zdHlsZXMpIHx8IFtdO1xuICAgICAgICBNYXBDU1Muc2hhcmVkLl9sb2NhbGVzID0gKG9wdGlvbnMgJiYgb3B0aW9ucy5sb2NhbGVzKSB8fCBbXTtcblxuICAgICAgICBsZXQgZGV2aWNlUGl4ZWxSYXRpbyA9IE1hdGgubWF4KHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvIHx8IDEsIDIpO1xuXG4gICAgICAgIGxldCB3aWR0aCA9IGNhbnZhcy53aWR0aCxcbiAgICAgICAgICAgIGhlaWdodCA9IGNhbnZhcy5oZWlnaHQ7XG5cbiAgICAgICAgaWYgKGRldmljZVBpeGVsUmF0aW8gIT09IDEpIHtcbiAgICAgICAgICAgIGNhbnZhcy5zdHlsZS53aWR0aCA9IHdpZHRoICsgJ3B4JztcbiAgICAgICAgICAgIGNhbnZhcy5zdHlsZS5oZWlnaHQgPSBoZWlnaHQgKyAncHgnO1xuICAgICAgICAgICAgY2FudmFzLndpZHRoID0gY2FudmFzLndpZHRoICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgICAgIGNhbnZhcy5oZWlnaHQgPSBjYW52YXMuaGVpZ2h0ICogZGV2aWNlUGl4ZWxSYXRpbztcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgICAgICAgY3R4LnNjYWxlKGRldmljZVBpeGVsUmF0aW8sIGRldmljZVBpeGVsUmF0aW8pO1xuXG5cbiAgICAgICAgbGV0IGdyYW51bGFyaXR5ID0gZGF0YS5ncmFudWxhcml0eSxcbiAgICAgICAgICAgIHdzID0gd2lkdGggLyBncmFudWxhcml0eSwgaHMgPSBoZWlnaHQgLyBncmFudWxhcml0eSxcbiAgICAgICAgICAgIGNvbGxpc2lvbkJ1ZmZlciA9IG5ldyBDb2xsaXNpb25CdWZmZXIoaGVpZ2h0LCB3aWR0aCk7XG5cbiAgICAgICAgLy9jb25zb2xlLnRpbWUoJ3N0eWxlcycpO1xuXG4gICAgICAgIC8vIHNldHVwIGxheWVyIHN0eWxlc1xuICAgICAgICBsZXQgbGF5ZXJzID0gU3R5bGUucG9wdWxhdGVMYXllcnMoZGF0YS5mZWF0dXJlcywgem9vbSwgc3R5bGVzKSxcbiAgICAgICAgICAgIGxheWVySWRzID0gS290aGljLmdldExheWVySWRzKGxheWVycyk7XG5cbiAgICAgICAgLy8gcmVuZGVyIHRoZSBtYXBcbiAgICAgICAgU3R5bGUuc2V0U3R5bGVzKGN0eCwgU3R5bGUuZGVmYXVsdENhbnZhc1N0eWxlcyk7XG5cbiAgICAgICAgLy9jb25zb2xlLnRpbWVFbmQoJ3N0eWxlcycpO1xuXG4gICAgICAgIEtvdGhpYy5nZXRGcmFtZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUudGltZSgnZ2VvbWV0cnknKTtcbiAgICAgICAgICAgIEtvdGhpYy5fcmVuZGVyQmFja2dyb3VuZChjdHgsIHdpZHRoLCBoZWlnaHQsIHpvb20sIHN0eWxlcyk7XG4gICAgICAgICAgICBLb3RoaWMuX3JlbmRlckdlb21ldHJ5RmVhdHVyZXMobGF5ZXJJZHMsIGxheWVycywgY3R4LCB3cywgaHMsIGdyYW51bGFyaXR5KTtcblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy5vblJlbmRlckNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5vblJlbmRlckNvbXBsZXRlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vY29uc29sZS50aW1lRW5kKCdnZW9tZXRyeScpO1xuXG4gICAgICAgICAgICBLb3RoaWMuZ2V0RnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS50aW1lKCd0ZXh0L2ljb25zJyk7XG4gICAgICAgICAgICAgICAgS290aGljLl9yZW5kZXJUZXh0QW5kSWNvbnMobGF5ZXJJZHMsIGxheWVycywgY3R4LCB3cywgaHMsIGNvbGxpc2lvbkJ1ZmZlcik7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLnRpbWVFbmQoJ3RleHQvaWNvbnMnKTtcblxuICAgICAgICAgICAgICAgIC8vS290aGljLl9yZW5kZXJDb2xsaXNpb25zKGN0eCwgY29sbGlzaW9uQnVmZmVyLmJ1ZmZlci5kYXRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgX3JlbmRlckNvbGxpc2lvbnMoY3R4LCBub2RlKSB7XG4gICAgICAgIGxldCBpLCBsZW4sIGE7XG4gICAgICAgIGlmIChub2RlLmxlYWYpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlU3R5bGUgPSAncmVkJztcbiAgICAgICAgICAgICAgICBjdHgubGluZVdpZHRoID0gMTtcbiAgICAgICAgICAgICAgICBhID0gbm9kZS5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlUmVjdChNYXRoLnJvdW5kKGFbMF0pLCBNYXRoLnJvdW5kKGFbMV0pLCBNYXRoLnJvdW5kKGFbMl0gLSBhWzBdKSwgTWF0aC5yb3VuZChhWzNdIC0gYVsxXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIEtvdGhpYy5fcmVuZGVyQ29sbGlzaW9ucyhjdHgsIG5vZGUuY2hpbGRyZW5baV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGdldExheWVySWRzKGxheWVycykge1xuICAgICAgICByZXR1cm4gT2JqZWN0LmtleXMobGF5ZXJzKS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoYSwgMTApIC0gcGFyc2VJbnQoYiwgMTApO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0RnJhbWUoZm4pIHtcbiAgICAgICAgbGV0IHJlcUZyYW1lID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCB3aW5kb3cubW96UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG4gICAgICAgICAgICAgICAgICAgICAgIHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1zUmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuXG4gICAgICAgIHJlcUZyYW1lLmNhbGwod2luZG93LCBmbik7XG4gICAgfVxuXG4gICAgc3RhdGljIF9yZW5kZXJCYWNrZ3JvdW5kKGN0eCwgd2lkdGgsIGhlaWdodCwgem9vbSwgc3R5bGVzKSB7XG4gICAgICAgIGxldCBzdHlsZSA9IE1hcENTUy5zaGFyZWQucmVzdHlsZShzdHlsZXMsIHt9LCB7fSwgem9vbSwgJ2NhbnZhcycsICdjYW52YXMnKTtcblxuICAgICAgICBsZXQgZmlsbFJlY3QgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjdHguZmlsbFJlY3QoLTEsIC0xLCB3aWR0aCArIDEsIGhlaWdodCArIDEpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAobGV0IGkgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgIFBvbHlnb24uc2hhcmVkLmZpbGwoY3R4LCBzdHlsZVtpXSwgZmlsbFJlY3QpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIF9yZW5kZXJHZW9tZXRyeUZlYXR1cmVzKGxheWVySWRzLCBsYXllcnMsIGN0eCwgd3MsIGhzLCBncmFudWxhcml0eSkge1xuICAgICAgICBsZXQgbGF5ZXJzVG9SZW5kZXIgPSB7fSxcbiAgICAgICAgICAgIGksIGosIGxlbiwgZmVhdHVyZXMsIHN0eWxlLCBxdWV1ZSwgYmdRdWV1ZTtcblxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsYXllcklkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZmVhdHVyZXMgPSBsYXllcnNbbGF5ZXJJZHNbaV1dO1xuXG4gICAgICAgICAgICBiZ1F1ZXVlID0gbGF5ZXJzVG9SZW5kZXIuX2JnID0gbGF5ZXJzVG9SZW5kZXIuX2JnIHx8IHt9O1xuICAgICAgICAgICAgcXVldWUgPSBsYXllcnNUb1JlbmRlcltsYXllcklkc1tpXV0gPSBsYXllcnNUb1JlbmRlcltsYXllcklkc1tpXV0gfHwge307XG5cbiAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbiA9IGZlYXR1cmVzLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgc3R5bGUgPSBmZWF0dXJlc1tqXS5zdHlsZTtcblxuICAgICAgICAgICAgICAgIGlmICgnZmlsbC1jb2xvcicgaW4gc3R5bGUgfHwgJ2ZpbGwtaW1hZ2UnIGluIHN0eWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZVsnZmlsbC1wb3NpdGlvbiddID09PSAnYmFja2dyb3VuZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJnUXVldWUucG9seWdvbnMgPSBiZ1F1ZXVlLnBvbHlnb25zIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgYmdRdWV1ZS5wb2x5Z29ucy5wdXNoKGZlYXR1cmVzW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHF1ZXVlLnBvbHlnb25zID0gcXVldWUucG9seWdvbnMgfHwgW107XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wb2x5Z29ucy5wdXNoKGZlYXR1cmVzW2pdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICgnY2FzaW5nLXdpZHRoJyBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBxdWV1ZS5jYXNpbmdzID0gcXVldWUuY2FzaW5ncyB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgcXVldWUuY2FzaW5ncy5wdXNoKGZlYXR1cmVzW2pdKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoJ3dpZHRoJyBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBxdWV1ZS5saW5lcyA9IHF1ZXVlLmxpbmVzIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICBxdWV1ZS5saW5lcy5wdXNoKGZlYXR1cmVzW2pdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsYXllcklkcyA9IFsnX2JnJ10uY29uY2F0KGxheWVySWRzKTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGF5ZXJJZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHF1ZXVlID0gbGF5ZXJzVG9SZW5kZXJbbGF5ZXJJZHNbaV1dO1xuICAgICAgICAgICAgaWYgKCFxdWV1ZSlcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgaWYgKHF1ZXVlLnBvbHlnb25zKSB7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuID0gcXVldWUucG9seWdvbnMubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgUG9seWdvbi5zaGFyZWQucmVuZGVyKGN0eCwgcXVldWUucG9seWdvbnNbal0sIHF1ZXVlLnBvbHlnb25zW2ogKyAxXSwgd3MsIGhzLCBncmFudWxhcml0eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHF1ZXVlLmNhc2luZ3MpIHtcbiAgICAgICAgICAgICAgICBjdHgubGluZUNhcCA9ICdidXR0JztcbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwLCBsZW4gPSBxdWV1ZS5jYXNpbmdzLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIExpbmUuc2hhcmVkLnJlbmRlckNhc2luZyhjdHgsIHF1ZXVlLmNhc2luZ3Nbal0sIHF1ZXVlLmNhc2luZ3NbaiArIDFdLCB3cywgaHMsIGdyYW51bGFyaXR5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocXVldWUubGluZXMpIHtcbiAgICAgICAgICAgICAgICBjdHgubGluZUNhcCA9ICdyb3VuZCc7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuID0gcXVldWUubGluZXMubGVuZ3RoOyBqIDwgbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgTGluZS5zaGFyZWQucmVuZGVyKGN0eCwgcXVldWUubGluZXNbal0sIHF1ZXVlLmxpbmVzW2ogKyAxXSwgd3MsIGhzLCBncmFudWxhcml0eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIF9yZW5kZXJUZXh0QW5kSWNvbnMobGF5ZXJJZHMsIGxheWVycywgY3R4LCB3cywgaHMsIGNvbGxpc2lvbkJ1ZmZlcikge1xuICAgICAgICAvL1RPRE86IE1vdmUgdG8gdGhlIGZlYXR1cmVzIGRldGVjdG9yXG4gICAgICAgIGxldCBqLCBzdHlsZSwgaSxcbiAgICAgICAgICAgIHBhc3NlcyA9IFtdO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsYXllcklkcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbGV0IGZlYXR1cmVzID0gbGF5ZXJzW2xheWVySWRzW2ldXSxcbiAgICAgICAgICAgICAgICBmZWF0dXJlc0xlbiA9IGZlYXR1cmVzLmxlbmd0aDtcblxuICAgICAgICAgICAgLy8gcmVuZGVyIGljb25zIHdpdGhvdXQgdGV4dFxuICAgICAgICAgICAgZm9yIChqID0gZmVhdHVyZXNMZW4gLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgICAgICAgIHN0eWxlID0gZmVhdHVyZXNbal0uc3R5bGU7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLmhhc093blByb3BlcnR5KCdpY29uLWltYWdlJykgJiYgIXN0eWxlLnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgVGV4dGljb25zLnJlbmRlcihjdHgsIGZlYXR1cmVzW2pdLCBjb2xsaXNpb25CdWZmZXIsIHdzLCBocywgZmFsc2UsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcmVuZGVyIHRleHQgb24gZmVhdHVyZXMgd2l0aG91dCBpY29uc1xuICAgICAgICAgICAgZm9yIChqID0gZmVhdHVyZXNMZW4gLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgICAgICAgIHN0eWxlID0gZmVhdHVyZXNbal0uc3R5bGU7XG4gICAgICAgICAgICAgICAgaWYgKCFzdHlsZS5oYXNPd25Qcm9wZXJ0eSgnaWNvbi1pbWFnZScpICYmIHN0eWxlLnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgVGV4dGljb25zLnJlbmRlcihjdHgsIGZlYXR1cmVzW2pdLCBjb2xsaXNpb25CdWZmZXIsIHdzLCBocywgdHJ1ZSwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZm9yIGZlYXR1cmVzIHdpdGggYm90aCBpY29uIGFuZCB0ZXh0LCByZW5kZXIgYm90aCBvciBuZWl0aGVyXG4gICAgICAgICAgICBmb3IgKGogPSBmZWF0dXJlc0xlbiAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgICAgICAgc3R5bGUgPSBmZWF0dXJlc1tqXS5zdHlsZTtcbiAgICAgICAgICAgICAgICBpZiAoc3R5bGUuaGFzT3duUHJvcGVydHkoJ2ljb24taW1hZ2UnKSAmJiBzdHlsZS50ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIFRleHRpY29ucy5yZW5kZXIoY3R4LCBmZWF0dXJlc1tqXSwgY29sbGlzaW9uQnVmZmVyLCB3cywgaHMsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcmVuZGVyIHNoaWVsZHMgd2l0aCB0ZXh0XG4gICAgICAgICAgICBmb3IgKGogPSBmZWF0dXJlc0xlbiAtIDE7IGogPj0gMDsgai0tKSB7XG4gICAgICAgICAgICAgICAgc3R5bGUgPSBmZWF0dXJlc1tqXS5zdHlsZTtcbiAgICAgICAgICAgICAgICBpZiAoc3R5bGVbJ3NoaWVsZC10ZXh0J10pIHtcbiAgICAgICAgICAgICAgICAgICAgU2hpZWxkcy5yZW5kZXIoY3R4LCBmZWF0dXJlc1tqXSwgY29sbGlzaW9uQnVmZmVyLCB3cywgaHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwYXNzZXM7XG4gICAgfVxufTsiLCJpbXBvcnQgUGF0aCBmcm9tIFwiLi9wYXRoXCI7XG5pbXBvcnQgU3R5bGUgZnJvbSBcIi4uL3N0eWxlL3N0eWxlXCI7XG5pbXBvcnQgTWFwQ1NTIGZyb20gXCIuLi9zdHlsZS9tYXBjc3NcIjtcblxubGV0IGxpbmUgPSBudWxsO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMaW5lIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBpZiAobGluZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBsaW5lID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMucGF0aE9wZW5lZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBsaW5lO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgc2hhcmVkKCkge1xuICAgICAgICByZXR1cm4gbmV3IExpbmUoKTtcbiAgICB9XG5cbiAgICByZW5kZXJDYXNpbmcoY3R4LCBmZWF0dXJlLCBuZXh0RmVhdHVyZSwgd3MsIGhzLCBncmFudWxhcml0eSkge1xuICAgICAgICBsZXQgc3R5bGUgPSBmZWF0dXJlLnN0eWxlLFxuICAgICAgICAgICAgbmV4dFN0eWxlID0gbmV4dEZlYXR1cmUgJiYgbmV4dEZlYXR1cmUuc3R5bGU7XG5cbiAgICAgICAgaWYgKCF0aGlzLnBhdGhPcGVuZWQpIHtcbiAgICAgICAgICAgIHRoaXMucGF0aE9wZW5lZCA9IHRydWU7XG4gICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIH1cblxuICAgICAgICBuZXcgUGF0aChjdHgsIGZlYXR1cmUsIHN0eWxlW1wiY2FzaW5nLWRhc2hlc1wiXSB8fCBzdHlsZS5kYXNoZXMsIGZhbHNlLCB3cywgaHMsIGdyYW51bGFyaXR5KTtcblxuICAgICAgICBpZiAobmV4dEZlYXR1cmUgJiZcbiAgICAgICAgICAgICAgICBuZXh0U3R5bGUud2lkdGggPT09IHN0eWxlLndpZHRoICYmXG4gICAgICAgICAgICAgICAgbmV4dFN0eWxlWydjYXNpbmctd2lkdGgnXSA9PT0gc3R5bGVbJ2Nhc2luZy13aWR0aCddICYmXG4gICAgICAgICAgICAgICAgbmV4dFN0eWxlWydjYXNpbmctY29sb3InXSA9PT0gc3R5bGVbJ2Nhc2luZy1jb2xvciddICYmXG4gICAgICAgICAgICAgICAgbmV4dFN0eWxlWydjYXNpbmctZGFzaGVzJ10gPT09IHN0eWxlWydjYXNpbmctZGFzaGVzJ10gJiZcbiAgICAgICAgICAgICAgICBuZXh0U3R5bGVbJ2Nhc2luZy1vcGFjaXR5J10gPT09IHN0eWxlWydjYXNpbmctb3BhY2l0eSddKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBTdHlsZS5zZXRTdHlsZXMoY3R4LCB7XG4gICAgICAgICAgICBsaW5lV2lkdGg6IDIgKiBzdHlsZVtcImNhc2luZy13aWR0aFwiXSArIChzdHlsZS5oYXNPd25Qcm9wZXJ0eShcIndpZHRoXCIpID8gc3R5bGUud2lkdGggOiAwKSxcbiAgICAgICAgICAgIHN0cm9rZVN0eWxlOiBzdHlsZVtcImNhc2luZy1jb2xvclwiXSB8fCBcIiMwMDAwMDBcIixcbiAgICAgICAgICAgIGxpbmVDYXA6IHN0eWxlW1wiY2FzaW5nLWxpbmVjYXBcIl0gfHwgc3R5bGUubGluZWNhcCB8fCBcImJ1dHRcIixcbiAgICAgICAgICAgIGxpbmVKb2luOiBzdHlsZVtcImNhc2luZy1saW5lam9pblwiXSB8fCBzdHlsZS5saW5lam9pbiB8fCBcInJvdW5kXCIsXG4gICAgICAgICAgICBnbG9iYWxBbHBoYTogc3R5bGVbXCJjYXNpbmctb3BhY2l0eVwiXSB8fCAxXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgdGhpcy5wYXRoT3BlbmVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcmVuZGVyKGN0eCwgZmVhdHVyZSwgbmV4dEZlYXR1cmUsIHdzLCBocywgZ3JhbnVsYXJpdHkpIHtcbiAgICAgICAgbGV0IHN0eWxlID0gZmVhdHVyZS5zdHlsZSxcbiAgICAgICAgICAgIG5leHRTdHlsZSA9IG5leHRGZWF0dXJlICYmIG5leHRGZWF0dXJlLnN0eWxlO1xuXG4gICAgICAgIGlmICghdGhpcy5wYXRoT3BlbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhdGhPcGVuZWQgPSB0cnVlO1xuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbmV3IFBhdGgoY3R4LCBmZWF0dXJlLCBzdHlsZS5kYXNoZXMsIGZhbHNlLCB3cywgaHMsIGdyYW51bGFyaXR5KTtcblxuICAgICAgICBpZiAobmV4dEZlYXR1cmUgJiZcbiAgICAgICAgICAgICAgICBuZXh0U3R5bGUud2lkdGggPT09IHN0eWxlLndpZHRoICYmXG4gICAgICAgICAgICAgICAgbmV4dFN0eWxlLmNvbG9yID09PSBzdHlsZS5jb2xvciAmJlxuICAgICAgICAgICAgICAgIG5leHRTdHlsZS5pbWFnZSA9PT0gc3R5bGUuaW1hZ2UgJiZcbiAgICAgICAgICAgICAgICBuZXh0U3R5bGUub3BhY2l0eSA9PT0gc3R5bGUub3BhY2l0eSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCdjb2xvcicgaW4gc3R5bGUgfHwgISgnaW1hZ2UnIGluIHN0eWxlKSkge1xuICAgICAgICAgICAgbGV0IHRfd2lkdGggPSBzdHlsZS53aWR0aCB8fCAxLFxuICAgICAgICAgICAgICAgIHRfbGluZWpvaW4gPSBcInJvdW5kXCIsXG4gICAgICAgICAgICAgICAgdF9saW5lY2FwID0gXCJyb3VuZFwiO1xuXG4gICAgICAgICAgICBpZiAodF93aWR0aCA8PSAyKSB7XG4gICAgICAgICAgICAgICAgdF9saW5lam9pbiA9IFwibWl0ZXJcIjtcbiAgICAgICAgICAgICAgICB0X2xpbmVjYXAgPSBcImJ1dHRcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFN0eWxlLnNldFN0eWxlcyhjdHgsIHtcbiAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IHRfd2lkdGgsXG4gICAgICAgICAgICAgICAgc3Ryb2tlU3R5bGU6IHN0eWxlLmNvbG9yIHx8ICcjMDAwMDAwJyxcbiAgICAgICAgICAgICAgICBsaW5lQ2FwOiBzdHlsZS5saW5lY2FwIHx8IHRfbGluZWNhcCxcbiAgICAgICAgICAgICAgICBsaW5lSm9pbjogc3R5bGUubGluZWpvaW4gfHwgdF9saW5lam9pbixcbiAgICAgICAgICAgICAgICBnbG9iYWxBbHBoYTogc3R5bGUub3BhY2l0eSB8fCAxLFxuICAgICAgICAgICAgICAgIG1pdGVyTGltaXQ6IDRcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgICAgICB9XG5cblxuICAgICAgICBpZiAoJ2ltYWdlJyBpbiBzdHlsZSkge1xuICAgICAgICAgICAgLy8gc2Vjb25kIHBhc3MgZmlsbHMgd2l0aCB0ZXh0dXJlXG4gICAgICAgICAgICBsZXQgaW1hZ2UgPSBNYXBDU1MuZ2V0SW1hZ2Uoc3R5bGUuaW1hZ2UpO1xuXG4gICAgICAgICAgICBpZiAoaW1hZ2UpIHtcbiAgICAgICAgICAgICAgICBTdHlsZS5zZXRTdHlsZXMoY3R4LCB7XG4gICAgICAgICAgICAgICAgICAgIHN0cm9rZVN0eWxlOiBjdHguY3JlYXRlUGF0dGVybihpbWFnZSwgJ3JlcGVhdCcpIHx8IFwiIzAwMDAwMFwiLFxuICAgICAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IHN0eWxlLndpZHRoIHx8IDEsXG4gICAgICAgICAgICAgICAgICAgIGxpbmVDYXA6IHN0eWxlLmxpbmVjYXAgfHwgXCJyb3VuZFwiLFxuICAgICAgICAgICAgICAgICAgICBsaW5lSm9pbjogc3R5bGUubGluZWpvaW4gfHwgXCJyb3VuZFwiLFxuICAgICAgICAgICAgICAgICAgICBnbG9iYWxBbHBoYTogc3R5bGUub3BhY2l0eSB8fCAxXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5wYXRoT3BlbmVkID0gZmFsc2U7XG4gICAgfVxufTtcbiIsImltcG9ydCBHZW9tIGZyb20gXCIuLi91dGlscy9nZW9tXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBhdGgge1xuXG4gICAgY29uc3RydWN0b3IgKGN0eCwgZmVhdHVyZSwgZGFzaGVzLCBmaWxsLCB3cywgaHMsIGdyYW51bGFyaXR5KSB7XG5cbiAgICAgICAgbGV0IHR5cGUgPSBmZWF0dXJlLnR5cGUsXG4gICAgICAgICAgICBjb29yZHMgPSBmZWF0dXJlLmNvb3JkaW5hdGVzO1xuXG4gICAgICAgIGlmICh0eXBlID09PSBcIlBvbHlnb25cIikge1xuICAgICAgICAgICAgY29vcmRzID0gW2Nvb3Jkc107XG4gICAgICAgICAgICB0eXBlID0gXCJNdWx0aVBvbHlnb25cIjtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBcIkxpbmVTdHJpbmdcIikge1xuICAgICAgICAgICAgY29vcmRzID0gW2Nvb3Jkc107XG4gICAgICAgICAgICB0eXBlID0gXCJNdWx0aUxpbmVTdHJpbmdcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBpLCBqLCBrLFxuICAgICAgICAgICAgcG9pbnRzLFxuICAgICAgICAgICAgbGVuID0gY29vcmRzLmxlbmd0aCxcbiAgICAgICAgICAgIGxlbjIsIHBvaW50c0xlbixcbiAgICAgICAgICAgIHByZXZQb2ludCwgcG9pbnQsIHNjcmVlblBvaW50LFxuICAgICAgICAgICAgZHgsIGR5LCBkaXN0O1xuXG4gICAgICAgIGlmICh0eXBlID09PSBcIk11bHRpUG9seWdvblwiKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGsgPSAwLCBsZW4yID0gY29vcmRzW2ldLmxlbmd0aDsgayA8IGxlbjI7IGsrKykge1xuICAgICAgICAgICAgICAgICAgICBwb2ludHMgPSBjb29yZHNbaV1ba107XG4gICAgICAgICAgICAgICAgICAgIHBvaW50c0xlbiA9IHBvaW50cy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHByZXZQb2ludCA9IHBvaW50c1swXTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDw9IHBvaW50c0xlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb2ludCA9IHBvaW50c1tqXSB8fCBwb2ludHNbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICBzY3JlZW5Qb2ludCA9IEdlb20udHJhbnNmb3JtUG9pbnQocG9pbnQsIHdzLCBocyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChqID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhzY3JlZW5Qb2ludFswXSwgc2NyZWVuUG9pbnRbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXNoZXMpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zZXRMaW5lRGFzaChkYXNoZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LnNldExpbmVEYXNoKFtdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFmaWxsICYmIFBhdGguY2hlY2tTYW1lQm91bmRhcnkocG9pbnQsIHByZXZQb2ludCwgZ3JhbnVsYXJpdHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhzY3JlZW5Qb2ludFswXSwgc2NyZWVuUG9pbnRbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHNjcmVlblBvaW50WzBdLCBzY3JlZW5Qb2ludFsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmV2UG9pbnQgPSBwb2ludDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBcIk11bHRpTGluZVN0cmluZ1wiKSB7XG4gICAgICAgICAgICBsZXQgcGFkID0gNTAsIC8vIGhvdyBtYW55IHBpeGVscyB0byBkcmF3IG91dCBvZiB0aGUgdGlsZSB0byBhdm9pZCBwYXRoIGVkZ2VzIHdoZW4gbGluZXMgY3Jvc3NlcyB0aWxlIGJvcmRlcnNcbiAgICAgICAgICAgICAgICBza2lwID0gMjsgLy8gZG8gbm90IGRyYXcgbGluZSBzZWdtZW50cyBzaG9ydGVyIHRoYW4gdGhpc1xuXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwb2ludHMgPSBjb29yZHNbaV07XG4gICAgICAgICAgICAgICAgcG9pbnRzTGVuID0gcG9pbnRzLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBwb2ludHNMZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICBwb2ludCA9IHBvaW50c1tqXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjb250aW51ZSBwYXRoIG9mZiB0aGUgdGlsZSBieSBzb21lIGFtb3VudCB0byBmaXggcGF0aCBlZGdlcyBiZXR3ZWVuIHRpbGVzXG4gICAgICAgICAgICAgICAgICAgIGlmICgoaiA9PT0gMCB8fCBqID09PSBwb2ludHNMZW4gLSAxKSAmJiBQYXRoLmlzVGlsZUJvdW5kYXJ5KHBvaW50LCBncmFudWxhcml0eSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGsgPSBqO1xuICAgICAgICAgICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGsgPSBqID8gayAtIDEgOiBrICsgMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoayA8IDAgfHwgayA+PSBwb2ludHNMZW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZQb2ludCA9IHBvaW50c1trXTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR4ID0gcG9pbnRbMF0gLSBwcmV2UG9pbnRbMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHkgPSBwb2ludFsxXSAtIHByZXZQb2ludFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXN0ID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gd2hpbGUgKGRpc3QgPD0gc2tpcCk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFsbCBwb2ludHMgYXJlIHNvIGNsb3NlIHRvIGVhY2ggb3RoZXIgdGhhdCBpdCBkb2Vzbid0IG1ha2Ugc2Vuc2UgdG9cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRyYXcgdGhlIGxpbmUgYmV5b25kIHRoZSB0aWxlIGJvcmRlciwgc2ltcGx5IHNraXAgdGhlIGVudGlyZSBsaW5lIGZyb21cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhlcmVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChrIDwgMCB8fCBrID49IHBvaW50c0xlbilcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRbMF0gPSBwb2ludFswXSArIHBhZCAqIGR4IC8gZGlzdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50WzFdID0gcG9pbnRbMV0gKyBwYWQgKiBkeSAvIGRpc3Q7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgc2NyZWVuUG9pbnQgPSBHZW9tLnRyYW5zZm9ybVBvaW50KHBvaW50LCB3cywgaHMpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChqID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubW92ZVRvKHNjcmVlblBvaW50WzBdLCBzY3JlZW5Qb2ludFsxXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGFzaGVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zZXRMaW5lRGFzaChkYXNoZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zZXRMaW5lRGFzaChbXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdHgubGluZVRvKHNjcmVlblBvaW50WzBdLCBzY3JlZW5Qb2ludFsxXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgLy8gY2hlY2sgaWYgdGhlIHBvaW50IGlzIG9uIHRoZSB0aWxlIGJvdW5kYXJ5XG4gICAgLy8gcmV0dXJucyBiaXRtYXNrIG9mIGFmZmVjdGVkIHRpbGUgYm91bmRhcmllc1xuICAgIHN0YXRpYyBpc1RpbGVCb3VuZGFyeShwLCBzaXplKSB7XG4gICAgICAgIGxldCByID0gMDtcbiAgICAgICAgaWYgKHBbMF0gPT09IDApXG4gICAgICAgICAgICByIHw9IDE7XG4gICAgICAgIGVsc2UgaWYgKHBbMF0gPT09IHNpemUpXG4gICAgICAgICAgICByIHw9IDI7XG4gICAgICAgIGlmIChwWzFdID09PSAwKVxuICAgICAgICAgICAgciB8PSA0O1xuICAgICAgICBlbHNlIGlmIChwWzFdID09PSBzaXplKVxuICAgICAgICAgICAgciB8PSA4O1xuICAgICAgICByZXR1cm4gcjtcbiAgICB9XG5cbiAgICAvKiBjaGVjayBpZiAyIHBvaW50cyBhcmUgYm90aCBvbiB0aGUgc2FtZSB0aWxlIGJvdW5kYXJ5XG4gICAgICpcbiAgICAgKiBJZiBwb2ludHMgb2YgdGhlIG9iamVjdCBhcmUgb24gdGhlIHNhbWUgdGlsZSBib3VuZGFyeSBpdCBpcyBhc3N1bWVkXG4gICAgICogdGhhdCB0aGUgb2JqZWN0IGlzIGN1dCBoZXJlIGFuZCB3b3VsZCBvcmlnaW5hbGx5IGNvbnRpbnVlIGJleW9uZCB0aGVcbiAgICAgKiB0aWxlIGJvcmRlcnMuXG4gICAgICpcbiAgICAgKiBUaGlzIGRvZXMgbm90IGNhdGNoIHRoZSBjYXNlIHdoZXJlIHRoZSBvYmplY3QgaXMgaW5kZWVkIGV4YWN0bHlcbiAgICAgKiBvbiB0aGUgdGlsZSBib3VuZGFyaWVzLCBidXQgdGhpcyBjYXNlIGNhbid0IHByb3Blcmx5IGJlIGRldGVjdGVkIGhlcmUuXG4gICAgICovXG4gICAgc3RhdGljIGNoZWNrU2FtZUJvdW5kYXJ5KHAsIHEsIHNpemUpIHtcbiAgICAgICAgbGV0IGJwID0gUGF0aC5pc1RpbGVCb3VuZGFyeShwLCBzaXplKTtcbiAgICAgICAgaWYgKCFicClcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICByZXR1cm4gKGJwICYgUGF0aC5pc1RpbGVCb3VuZGFyeShxLCBzaXplKSk7XG4gICAgfVxufSIsImltcG9ydCBNYXBDU1MgZnJvbSBcIi4uL3N0eWxlL21hcGNzc1wiO1xuaW1wb3J0IFN0eWxlIGZyb20gXCIuLi9zdHlsZS9zdHlsZVwiO1xuaW1wb3J0IFBhdGggZnJvbSBcIi4vcGF0aFwiO1xuXG5sZXQgcG9seWdvbiA9IG51bGw7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBvbHlnb24ge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIGlmIChwb2x5Z29uID09IG51bGwpIHtcbiAgICAgICAgICAgIHBvbHlnb24gPSB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwb2x5Z29uXG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBzaGFyZWQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgUG9seWdvbigpO1xuICAgIH1cblxuICAgIHJlbmRlcihjdHgsIGZlYXR1cmUsIG5leHRGZWF0dXJlLCB3cywgaHMsIGdyYW51bGFyaXR5KSB7XG4gICAgICAgIGxldCBzdHlsZSA9IGZlYXR1cmUuc3R5bGUsXG4gICAgICAgICAgICBuZXh0U3R5bGUgPSBuZXh0RmVhdHVyZSAmJiBuZXh0RmVhdHVyZS5zdHlsZTtcblxuICAgICAgICBpZiAoIXRoaXMucGF0aE9wZW5lZCkge1xuICAgICAgICAgICAgdGhpcy5wYXRoT3BlbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ldyBQYXRoKGN0eCwgZmVhdHVyZSwgZmFsc2UsIHRydWUsIHdzLCBocywgZ3JhbnVsYXJpdHkpO1xuXG4gICAgICAgIGlmIChuZXh0RmVhdHVyZSAmJlxuICAgICAgICAgICAgICAgIChuZXh0U3R5bGVbJ2ZpbGwtY29sb3InXSA9PT0gc3R5bGVbJ2ZpbGwtY29sb3InXSkgJiZcbiAgICAgICAgICAgICAgICAobmV4dFN0eWxlWydmaWxsLWltYWdlJ10gPT09IHN0eWxlWydmaWxsLWltYWdlJ10pICYmXG4gICAgICAgICAgICAgICAgKG5leHRTdHlsZVsnZmlsbC1vcGFjaXR5J10gPT09IHN0eWxlWydmaWxsLW9wYWNpdHknXSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuZmlsbChjdHgsIHN0eWxlKTtcblxuICAgICAgICB0aGlzLnBhdGhPcGVuZWQgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBmaWxsKGN0eCwgc3R5bGUsIGZpbGxGbikge1xuICAgICAgICBsZXQgb3BhY2l0eSA9IHN0eWxlW1wiZmlsbC1vcGFjaXR5XCJdIHx8IHN0eWxlLm9wYWNpdHksIGltYWdlO1xuXG4gICAgICAgIGlmIChzdHlsZS5oYXNPd25Qcm9wZXJ0eSgnZmlsbC1jb2xvcicpKSB7XG4gICAgICAgICAgICAvLyBmaXJzdCBwYXNzIGZpbGxzIHdpdGggc29saWQgY29sb3JcbiAgICAgICAgICAgIFN0eWxlLnNldFN0eWxlcyhjdHgsIHtcbiAgICAgICAgICAgICAgICBmaWxsU3R5bGU6IHN0eWxlW1wiZmlsbC1jb2xvclwiXSB8fCBcIiMwMDAwMDBcIixcbiAgICAgICAgICAgICAgICBnbG9iYWxBbHBoYTogb3BhY2l0eSB8fCAxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChmaWxsRm4pIHtcbiAgICAgICAgICAgICAgICBmaWxsRm4oKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3R4LmZpbGwoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdHlsZS5oYXNPd25Qcm9wZXJ0eSgnZmlsbC1pbWFnZScpKSB7XG4gICAgICAgICAgICAvLyBzZWNvbmQgcGFzcyBmaWxscyB3aXRoIHRleHR1cmVcbiAgICAgICAgICAgIGltYWdlID0gTWFwQ1NTLmdldEltYWdlKHN0eWxlWydmaWxsLWltYWdlJ10pO1xuICAgICAgICAgICAgaWYgKGltYWdlKSB7XG4gICAgICAgICAgICAgICAgU3R5bGUuc2V0U3R5bGVzKGN0eCwge1xuICAgICAgICAgICAgICAgICAgICBmaWxsU3R5bGU6IGN0eC5jcmVhdGVQYXR0ZXJuKGltYWdlLCAncmVwZWF0JyksXG4gICAgICAgICAgICAgICAgICAgIGdsb2JhbEFscGhhOiBvcGFjaXR5IHx8IDFcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoZmlsbEZuKSB7XG4gICAgICAgICAgICAgICAgICAgIGZpbGxGbigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IEdlb20gZnJvbSBcIi4uL3V0aWxzL2dlb21cIjtcbmltcG9ydCBNYXBDU1MgZnJvbSBcIi4uL3N0eWxlL21hcGNzc1wiO1xuaW1wb3J0IFN0eWxlIGZyb20gXCIuLi9zdHlsZS9zdHlsZVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTaGllbGRzIHtcblxuICAgIHN0YXRpYyByZW5kZXIoY3R4LCBmZWF0dXJlLCBjb2xsaWRlcywgd3MsIGhzKSB7XG4gICAgICAgIGxldCBzdHlsZSA9IGZlYXR1cmUuc3R5bGUsIHJlcHJQb2ludCA9IEdlb20uZ2V0UmVwclBvaW50KGZlYXR1cmUpLFxuICAgICAgICAgICAgcG9pbnQsIGltZywgbGVuID0gMCwgZm91bmQgPSBmYWxzZSwgaSwgc2duO1xuXG4gICAgICAgIGlmICghcmVwclBvaW50KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBwb2ludCA9IEdlb20udHJhbnNmb3JtUG9pbnQocmVwclBvaW50LCB3cywgaHMpO1xuXG4gICAgICAgIGlmIChzdHlsZVtcInNoaWVsZC1pbWFnZVwiXSkge1xuICAgICAgICAgICAgaW1nID0gTWFwQ1NTLmdldEltYWdlKHN0eWxlW1wiaWNvbi1pbWFnZVwiXSk7XG5cbiAgICAgICAgICAgIGlmICghaW1nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgU3R5bGUuc2V0U3R5bGVzKGN0eCwge1xuICAgICAgICAgICAgZm9udDogU3R5bGUuZ2V0Rm9udFN0cmluZyhzdHlsZVtcInNoaWVsZC1mb250LWZhbWlseVwiXSB8fCBzdHlsZVtcImZvbnQtZmFtaWx5XCJdLCBzdHlsZVtcInNoaWVsZC1mb250LXNpemVcIl0gfHwgc3R5bGVbXCJmb250LXNpemVcIl0sIHN0eWxlKSxcbiAgICAgICAgICAgIGZpbGxTdHlsZTogc3R5bGVbXCJzaGllbGQtdGV4dC1jb2xvclwiXSB8fCBcIiMwMDAwMDBcIixcbiAgICAgICAgICAgIGdsb2JhbEFscGhhOiBzdHlsZVtcInNoaWVsZC10ZXh0LW9wYWNpdHlcIl0gfHwgc3R5bGUub3BhY2l0eSB8fCAxLFxuICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgICAgIHRleHRCYXNlbGluZTogJ21pZGRsZSdcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IHRleHQgPSBTdHJpbmcoc3R5bGVbJ3NoaWVsZC10ZXh0J10pLFxuICAgICAgICAgICAgdGV4dFdpZHRoID0gY3R4Lm1lYXN1cmVUZXh0KHRleHQpLndpZHRoLFxuICAgICAgICAgICAgbGV0dGVyV2lkdGggPSB0ZXh0V2lkdGggLyB0ZXh0Lmxlbmd0aCxcbiAgICAgICAgICAgIGNvbGxpc2lvbldpZHRoID0gdGV4dFdpZHRoICsgMixcbiAgICAgICAgICAgIGNvbGxpc2lvbkhlaWdodCA9IGxldHRlcldpZHRoICogMS44O1xuXG4gICAgICAgIGlmIChmZWF0dXJlLnR5cGUgPT09ICdMaW5lU3RyaW5nJykge1xuICAgICAgICAgICAgbGVuID0gR2VvbS5nZXRQb2x5TGVuZ3RoKGZlYXR1cmUuY29vcmRpbmF0ZXMpO1xuXG4gICAgICAgICAgICBpZiAoTWF0aC5tYXgoY29sbGlzaW9uSGVpZ2h0IC8gaHMsIGNvbGxpc2lvbldpZHRoIC8gd3MpID4gbGVuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBzZ24gPSAxOyBpIDwgbGVuIC8gMjsgaSArPSBNYXRoLm1heChsZW4gLyAzMCwgY29sbGlzaW9uSGVpZ2h0IC8gd3MpLCBzZ24gKj0gLTEpIHtcbiAgICAgICAgICAgICAgICByZXByUG9pbnQgPSBHZW9tLmdldEFuZ2xlQW5kQ29vcmRzQXRMZW5ndGgoZmVhdHVyZS5jb29yZGluYXRlcywgbGVuIC8gMiArIHNnbiAqIGksIDApO1xuICAgICAgICAgICAgICAgIGlmICghcmVwclBvaW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJlcHJQb2ludCA9IFtyZXByUG9pbnRbMV0sIHJlcHJQb2ludFsyXV07XG5cbiAgICAgICAgICAgICAgICBwb2ludCA9IEdlb20udHJhbnNmb3JtUG9pbnQocmVwclBvaW50LCB3cywgaHMpO1xuICAgICAgICAgICAgICAgIGlmIChpbWcgJiYgKHN0eWxlW1wiYWxsb3ctb3ZlcmxhcFwiXSAhPT0gXCJ0cnVlXCIpICYmXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGVzLmNoZWNrUG9pbnRXSChwb2ludCwgaW1nLndpZHRoLCBpbWcuaGVpZ2h0LCBmZWF0dXJlLmtvdGhpY0lkKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKChzdHlsZVtcImFsbG93LW92ZXJsYXBcIl0gIT09IFwidHJ1ZVwiKSAmJlxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlcy5jaGVja1BvaW50V0gocG9pbnQsIGNvbGxpc2lvbldpZHRoLCBjb2xsaXNpb25IZWlnaHQsIGZlYXR1cmUua290aGljSWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWZvdW5kKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3R5bGVbXCJzaGllbGQtY2FzaW5nLXdpZHRoXCJdKSB7XG4gICAgICAgICAgICBTdHlsZS5zZXRTdHlsZXMoY3R4LCB7XG4gICAgICAgICAgICAgICAgZmlsbFN0eWxlOiBzdHlsZVtcInNoaWVsZC1jYXNpbmctY29sb3JcIl0gfHwgXCIjMDAwMDAwXCIsXG4gICAgICAgICAgICAgICAgZ2xvYmFsQWxwaGE6IHN0eWxlW1wic2hpZWxkLWNhc2luZy1vcGFjaXR5XCJdIHx8IHN0eWxlLm9wYWNpdHkgfHwgMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsZXQgcCA9IHN0eWxlW1wic2hpZWxkLWNhc2luZy13aWR0aFwiXSArIChzdHlsZVtcInNoaWVsZC1mcmFtZS13aWR0aFwiXSB8fCAwKTtcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdChwb2ludFswXSAtIGNvbGxpc2lvbldpZHRoIC8gMiAtIHAsXG4gICAgICAgICAgICAgICAgcG9pbnRbMV0gLSBjb2xsaXNpb25IZWlnaHQgLyAyIC0gcCxcbiAgICAgICAgICAgICAgICBjb2xsaXNpb25XaWR0aCArIDIgKiBwLFxuICAgICAgICAgICAgICAgIGNvbGxpc2lvbkhlaWdodCArIDIgKiBwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdHlsZVtcInNoaWVsZC1mcmFtZS13aWR0aFwiXSkge1xuICAgICAgICAgICAgU3R5bGUuc2V0U3R5bGVzKGN0eCwge1xuICAgICAgICAgICAgICAgIGZpbGxTdHlsZTogc3R5bGVbXCJzaGllbGQtZnJhbWUtY29sb3JcIl0gfHwgXCIjMDAwMDAwXCIsXG4gICAgICAgICAgICAgICAgZ2xvYmFsQWxwaGE6IHN0eWxlW1wic2hpZWxkLWZyYW1lLW9wYWNpdHlcIl0gfHwgc3R5bGUub3BhY2l0eSB8fCAxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdChwb2ludFswXSAtIGNvbGxpc2lvbldpZHRoIC8gMiAtIChzdHlsZVtcInNoaWVsZC1mcmFtZS13aWR0aFwiXSB8fCAwKSxcbiAgICAgICAgICAgICAgICBwb2ludFsxXSAtIGNvbGxpc2lvbkhlaWdodCAvIDIgLSAoc3R5bGVbXCJzaGllbGQtZnJhbWUtd2lkdGhcIl0gfHwgMCksXG4gICAgICAgICAgICAgICAgY29sbGlzaW9uV2lkdGggKyAyICogKHN0eWxlW1wic2hpZWxkLWZyYW1lLXdpZHRoXCJdIHx8IDApLFxuICAgICAgICAgICAgICAgIGNvbGxpc2lvbkhlaWdodCArIDIgKiAoc3R5bGVbXCJzaGllbGQtZnJhbWUtd2lkdGhcIl0gfHwgMCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0eWxlW1wic2hpZWxkLWNvbG9yXCJdKSB7XG4gICAgICAgICAgICBTdHlsZS5zZXRTdHlsZXMoY3R4LCB7XG4gICAgICAgICAgICAgICAgZmlsbFN0eWxlOiBzdHlsZVtcInNoaWVsZC1jb2xvclwiXSB8fCBcIiMwMDAwMDBcIixcbiAgICAgICAgICAgICAgICBnbG9iYWxBbHBoYTogc3R5bGVbXCJzaGllbGQtb3BhY2l0eVwiXSB8fCBzdHlsZS5vcGFjaXR5IHx8IDFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgY3R4LmZpbGxSZWN0KHBvaW50WzBdIC0gY29sbGlzaW9uV2lkdGggLyAyLFxuICAgICAgICAgICAgICAgIHBvaW50WzFdIC0gY29sbGlzaW9uSGVpZ2h0IC8gMixcbiAgICAgICAgICAgICAgICBjb2xsaXNpb25XaWR0aCxcbiAgICAgICAgICAgICAgICBjb2xsaXNpb25IZWlnaHQpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGltZykge1xuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsXG4gICAgICAgICAgICAgICAgTWF0aC5mbG9vcihwb2ludFswXSAtIGltZy53aWR0aCAvIDIpLFxuICAgICAgICAgICAgICAgIE1hdGguZmxvb3IocG9pbnRbMV0gLSBpbWcuaGVpZ2h0IC8gMikpO1xuICAgICAgICB9XG4gICAgICAgIFN0eWxlLnNldFN0eWxlcyhjdHgsIHtcbiAgICAgICAgICAgIGZpbGxTdHlsZTogc3R5bGVbXCJzaGllbGQtdGV4dC1jb2xvclwiXSB8fCBcIiMwMDAwMDBcIixcbiAgICAgICAgICAgIGdsb2JhbEFscGhhOiBzdHlsZVtcInNoaWVsZC10ZXh0LW9wYWNpdHlcIl0gfHwgc3R5bGUub3BhY2l0eSB8fCAxXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGN0eC5maWxsVGV4dCh0ZXh0LCBwb2ludFswXSwgTWF0aC5jZWlsKHBvaW50WzFdKSk7XG4gICAgICAgIGlmIChpbWcpIHtcbiAgICAgICAgICAgIGNvbGxpZGVzLmFkZFBvaW50V0gocG9pbnQsIGltZy53aWR0aCwgaW1nLmhlaWdodCwgMCwgZmVhdHVyZS5rb3RoaWNJZCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb2xsaWRlcy5hZGRQb2ludFdIKHBvaW50LCBjb2xsaXNpb25IZWlnaHQsIGNvbGxpc2lvbldpZHRoLFxuICAgICAgICAgICAgKHBhcnNlRmxvYXQoc3R5bGVbXCJzaGllbGQtY2FzaW5nLXdpZHRoXCJdKSB8fCAwKSArIChwYXJzZUZsb2F0KHN0eWxlW1wic2hpZWxkLWZyYW1lLXdpZHRoXCJdKSB8fCAwKSArIChwYXJzZUZsb2F0KHN0eWxlW1wiLXgtbWFwbmlrLW1pbi1kaXN0YW5jZVwiXSkgfHwgMzApLCBmZWF0dXJlLmtvdGhpY0lkKTtcblxuICAgIH1cbn0iLCJpbXBvcnQgR2VvbSBmcm9tIFwiLi4vdXRpbHMvZ2VvbVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXh0T25QYXRoIHtcblxuICAgIGNvbnN0cnVjdG9yIChjdHgsIHBvaW50cywgdGV4dCwgaGFsbywgY29sbGlzaW9ucykge1xuICAgICAgICAvL3dpZHRoQ2FjaGUgPSB7fTtcblxuICAgICAgICAvLyBzaW1wbGlmeSBwb2ludHM/XG5cbiAgICAgICAgbGV0IHRleHRXaWR0aCA9IGN0eC5tZWFzdXJlVGV4dCh0ZXh0KS53aWR0aCxcbiAgICAgICAgICAgIHRleHRMZW4gPSB0ZXh0Lmxlbmd0aCxcbiAgICAgICAgICAgIHBhdGhMZW4gPSBHZW9tLmdldFBvbHlMZW5ndGgocG9pbnRzKTtcblxuICAgICAgICBpZiAocGF0aExlbiA8IHRleHRXaWR0aCkge1xuICAgICAgICAgICAgcmV0dXJuOyAgLy8gaWYgbGFiZWwgd29uJ3QgZml0IC0gZG9uJ3QgdHJ5IHRvXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgYXZnTGV0dGVyV2lkdGggPSBUZXh0T25QYXRoLmdldFdpZHRoKGN0eCwgJ2EnKTtcblxuICAgICAgICBsZXQgbGV0dGVyLFxuICAgICAgICAgICAgd2lkdGhVc2VkLFxuICAgICAgICAgICAgcHJldkFuZ2xlLFxuICAgICAgICAgICAgcG9zaXRpb25zLFxuICAgICAgICAgICAgc29sdXRpb24gPSAwLFxuICAgICAgICAgICAgZmxpcENvdW50LFxuICAgICAgICAgICAgZmxpcHBlZCA9IGZhbHNlLFxuICAgICAgICAgICAgYXh5LFxuICAgICAgICAgICAgbGV0dGVyV2lkdGgsXG4gICAgICAgICAgICBpLFxuICAgICAgICAgICAgbWF4QW5nbGUgPSBNYXRoLlBJIC8gNjtcblxuICAgICAgICAvLyBpdGVyYXRpbmcgc29sdXRpb25zIC0gc3RhcnQgZnJvbSBjZW50ZXIgb3IgZnJvbSBvbmUgb2YgdGhlIGVuZHNcbiAgICAgICAgd2hpbGUgKHNvbHV0aW9uIDwgMikgeyAvL1RPRE8gY2hhbmdlIHRvIGZvcj9cbiAgICAgICAgICAgIHdpZHRoVXNlZCA9IHNvbHV0aW9uID8gVGV4dE9uUGF0aC5nZXRXaWR0aChjdHgsIHRleHQuY2hhckF0KDApKSA6IChwYXRoTGVuIC0gdGV4dFdpZHRoKSAvIDI7IC8vID8/P1xuICAgICAgICAgICAgZmxpcENvdW50ID0gMDtcbiAgICAgICAgICAgIHByZXZBbmdsZSA9IG51bGw7XG4gICAgICAgICAgICBwb3NpdGlvbnMgPSBbXTtcblxuICAgICAgICAgICAgLy8gaXRlcmF0aW5nIGxhYmVsIGxldHRlciBieSBsZXR0ZXIgKHNob3VsZCBiZSBmaXhlZCB0byBzdXBwb3J0IGxpZ2F0dXJlcy9DSkssIG9rIGZvciBDeXJpbGxpYy9sYXRpbilcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCB0ZXh0TGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXR0ZXIgPSB0ZXh0LmNoYXJBdChpKTtcbiAgICAgICAgICAgICAgICBsZXR0ZXJXaWR0aCA9IFRleHRPblBhdGguZ2V0V2lkdGgoY3R4LCBsZXR0ZXIpO1xuICAgICAgICAgICAgICAgIGF4eSA9IEdlb20uZ2V0QW5nbGVBbmRDb29yZHNBdExlbmd0aChwb2ludHMsIHdpZHRoVXNlZCwgbGV0dGVyV2lkdGgpO1xuXG4gICAgICAgICAgICAgICAgLy8gaWYgY2Fubm90IGZpdCBsZXR0ZXIgLSByZXN0YXJ0IHdpdGggbmV4dCBzb2x1dGlvblxuICAgICAgICAgICAgICAgIGlmICh3aWR0aFVzZWQgPj0gcGF0aExlbiB8fCAhYXh5KSB7XG4gICAgICAgICAgICAgICAgICAgIHNvbHV0aW9uKys7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmxpcHBlZCkgeyAgLy8gaWYgbGFiZWwgd2FzIGZsaXBwZWQsIGZsaXAgaXQgYmFja1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZsaXBwZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXByZXZBbmdsZSkge1xuICAgICAgICAgICAgICAgICAgICBwcmV2QW5nbGUgPSBheHlbMF07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gaWYgbGFiZWwgY29sbGlzaW9ucyB3aXRoIGFub3RoZXIsIHJlc3RhcnQgaXQgZnJvbSBoZXJlXG4gICAgICAgICAgICAgICAgaWYgKFRleHRPblBhdGguY2hlY2tDb2xsaXNpb24oY29sbGlzaW9ucywgY3R4LCBsZXR0ZXIsIGF4eSwgYXZnTGV0dGVyV2lkdGgpIHx8IE1hdGguYWJzKHByZXZBbmdsZSAtIGF4eVswXSkgPiBtYXhBbmdsZSkge1xuICAgICAgICAgICAgICAgICAgICB3aWR0aFVzZWQgKz0gbGV0dGVyV2lkdGg7XG4gICAgICAgICAgICAgICAgICAgIGkgPSAtMTtcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25zID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZsaXBDb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHdoaWxlIChsZXR0ZXJXaWR0aCA8IGF4eVszXSAmJiBpIDwgdGV4dExlbikgeyAvLyB0cnkgYWRkaW5nIGZvbGxvd2luZyBsZXR0ZXJzIHRvIGN1cnJlbnQsIHVudGlsIGxpbmUgY2hhbmdlcyBpdHMgZGlyZWN0aW9uXG4gICAgICAgICAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgICAgICAgICAgbGV0dGVyICs9IHRleHQuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgICAgICBsZXR0ZXJXaWR0aCA9IFRleHRPblBhdGguZ2V0V2lkdGgoY3R4LCBsZXR0ZXIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoVGV4dE9uUGF0aC5jaGVja0NvbGxpc2lvbihjb2xsaXNpb25zLCBjdHgsIGxldHRlciwgYXh5LCBhdmdMZXR0ZXJXaWR0aCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGkgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGhVc2VkICs9IGxldHRlcldpZHRoO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25zID0gW107XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGlwQ291bnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0dGVyID0gdGV4dC5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXR0ZXJXaWR0aCA9IFRleHRPblBhdGguZ2V0V2lkdGgoY3R4LCBsZXR0ZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYXh5ID0gR2VvbS5nZXRBbmdsZUFuZENvb3Jkc0F0TGVuZ3RoKHBvaW50cywgd2lkdGhVc2VkLCBsZXR0ZXJXaWR0aCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAobGV0dGVyV2lkdGggPj0gYXh5WzNdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpLS07XG4gICAgICAgICAgICAgICAgICAgICAgICBsZXR0ZXIgPSBsZXR0ZXIuc2xpY2UoMCwgLTEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0dGVyV2lkdGggPSBUZXh0T25QYXRoLmdldFdpZHRoKGN0eCwgbGV0dGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFheHkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKChheHlbMF0gPiAoTWF0aC5QSSAvIDIpKSB8fCAoYXh5WzBdIDwgKC1NYXRoLlBJIC8gMikpKSB7IC8vIGlmIGN1cnJlbnQgbGV0dGVycyBjbHVzdGVyIHdhcyB1cHNpZGUtZG93biwgY291bnQgaXRcbiAgICAgICAgICAgICAgICAgICAgZmxpcENvdW50ICs9IGxldHRlci5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcHJldkFuZ2xlID0gYXh5WzBdO1xuICAgICAgICAgICAgICAgIGF4eS5wdXNoKGxldHRlcik7XG4gICAgICAgICAgICAgICAgcG9zaXRpb25zLnB1c2goYXh5KTtcbiAgICAgICAgICAgICAgICB3aWR0aFVzZWQgKz0gbGV0dGVyV2lkdGg7XG4gICAgICAgICAgICB9IC8vZm9yXG5cbiAgICAgICAgICAgIGlmIChmbGlwQ291bnQgPiB0ZXh0TGVuIC8gMikgeyAvLyBpZiBtb3JlIHRoYW4gaGFsZiBvZiB0aGUgdGV4dCBpcyB1cHNpZGUgZG93biwgZmxpcCBpdCBhbmQgcmVzdGFydFxuICAgICAgICAgICAgICAgIHBvaW50cy5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgcG9zaXRpb25zID0gW107XG5cbiAgICAgICAgICAgICAgICBpZiAoZmxpcHBlZCkgeyAvLyBpZiBpdCB3YXMgZmxpcHBlZCB0d2ljZSAtIHJlc3RhcnQgd2l0aCBvdGhlciBzdGFydCBwb2ludCBzb2x1dGlvblxuICAgICAgICAgICAgICAgICAgICBzb2x1dGlvbisrO1xuICAgICAgICAgICAgICAgICAgICBwb2ludHMucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgICAgICBmbGlwcGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZmxpcHBlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc29sdXRpb24gPj0gMikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHBvc2l0aW9ucy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gLy93aGlsZVxuXG4gICAgICAgIGxldCBwb3NMZW4gPSBwb3NpdGlvbnMubGVuZ3RoO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGhhbG8gJiYgKGkgPCBwb3NMZW4pOyBpKyspIHtcbiAgICAgICAgICAgIFRleHRPblBhdGgucmVuZGVyVGV4dChjdHgsIHBvc2l0aW9uc1tpXSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcG9zTGVuOyBpKyspIHtcbiAgICAgICAgICAgIGF4eSA9IHBvc2l0aW9uc1tpXTtcbiAgICAgICAgICAgIFRleHRPblBhdGgucmVuZGVyVGV4dChjdHgsIGF4eSk7XG4gICAgICAgICAgICBUZXh0T25QYXRoLmFkZENvbGxpc2lvbihjb2xsaXNpb25zLCBjdHgsIGF4eVs0XSwgYXh5LCBhdmdMZXR0ZXJXaWR0aCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0V2lkdGgoY3R4LCB0ZXh0KSB7XG4gICAgICAgIHJldHVybiBjdHgubWVhc3VyZVRleHQodGV4dCkud2lkdGg7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFRleHRDZW50ZXIoYXh5LCB0ZXh0V2lkdGgpIHtcbiAgICAgICAgcmV0dXJuIFtheHlbMV0gKyAwLjUgKiBNYXRoLmNvcyhheHlbMF0pICogdGV4dFdpZHRoLFxuICAgICAgICAgICAgYXh5WzJdICsgMC41ICogTWF0aC5zaW4oYXh5WzBdKSAqIHRleHRXaWR0aF07XG4gICAgfVxuXG4gICAgc3RhdGljIGdldENvbGxpc2lvblBhcmFtcyh0ZXh0V2lkdGgsIGF4eSwgcHhvZmZzZXQpIHtcbiAgICAgICAgbGV0IHRleHRIZWlnaHQgPSB0ZXh0V2lkdGggKiAxLjUsXG4gICAgICAgICAgICBjb3MgPSBNYXRoLmFicyhNYXRoLmNvcyhheHlbMF0pKSxcbiAgICAgICAgICAgIHNpbiA9IE1hdGguYWJzKE1hdGguc2luKGF4eVswXSkpLFxuICAgICAgICAgICAgdyA9IGNvcyAqIHRleHRXaWR0aCArIHNpbiAqIHRleHRIZWlnaHQsXG4gICAgICAgICAgICBoID0gc2luICogdGV4dFdpZHRoICsgY29zICogdGV4dEhlaWdodDtcblxuICAgICAgICByZXR1cm4gW1RleHRPblBhdGguZ2V0VGV4dENlbnRlcihheHksIHRleHRXaWR0aCArIDIgKiAocHhvZmZzZXQgfHwgMCkpLCB3LCBoLCAwXTtcbiAgICB9XG5cbiAgICBzdGF0aWMgY2hlY2tDb2xsaXNpb24oY29sbGlzaW9ucywgY3R4LCB0ZXh0LCBheHksIGxldHRlcldpZHRoKSB7XG4gICAgICAgIGxldCB0ZXh0V2lkdGggPSBUZXh0T25QYXRoLmdldFdpZHRoKGN0eCwgdGV4dCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0ZXh0V2lkdGg7IGkgKz0gbGV0dGVyV2lkdGgpIHtcbiAgICAgICAgICAgIGlmIChjb2xsaXNpb25zLmNoZWNrUG9pbnRXSC5hcHBseShjb2xsaXNpb25zLCBUZXh0T25QYXRoLmdldENvbGxpc2lvblBhcmFtcyhsZXR0ZXJXaWR0aCwgYXh5LCBpKSkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgc3RhdGljIGFkZENvbGxpc2lvbihjb2xsaXNpb25zLCBjdHgsIHRleHQsIGF4eSwgbGV0dGVyV2lkdGgpIHtcbiAgICAgICAgbGV0IHRleHRXaWR0aCA9IFRleHRPblBhdGguZ2V0V2lkdGgoY3R4LCB0ZXh0KSxcbiAgICAgICAgICAgIHBhcmFtcyA9IFtdO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dFdpZHRoOyBpICs9IGxldHRlcldpZHRoKSB7XG4gICAgICAgICAgICBwYXJhbXMucHVzaChUZXh0T25QYXRoLmdldENvbGxpc2lvblBhcmFtcyhsZXR0ZXJXaWR0aCwgYXh5LCBpKSk7XG4gICAgICAgIH1cbiAgICAgICAgY29sbGlzaW9ucy5hZGRQb2ludHMocGFyYW1zKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgcmVuZGVyVGV4dChjdHgsIGF4eSwgaGFsbykge1xuICAgICAgICBsZXQgdGV4dCA9IGF4eVs0XSxcbiAgICAgICAgICAgIHRleHRDZW50ZXIgPSBUZXh0T25QYXRoLmdldFRleHRDZW50ZXIoYXh5LCBUZXh0T25QYXRoLmdldFdpZHRoKGN0eCwgdGV4dCkpO1xuXG4gICAgICAgIGN0eC50cmFuc2xhdGUodGV4dENlbnRlclswXSwgdGV4dENlbnRlclsxXSk7XG4gICAgICAgIGN0eC5yb3RhdGUoYXh5WzBdKTtcbiAgICAgICAgY3R4W2hhbG8gPyAnc3Ryb2tlVGV4dCcgOiAnZmlsbFRleHQnXSh0ZXh0LCAwLCAwKTtcbiAgICAgICAgY3R4LnJvdGF0ZSgtYXh5WzBdKTtcbiAgICAgICAgY3R4LnRyYW5zbGF0ZSgtdGV4dENlbnRlclswXSwgLXRleHRDZW50ZXJbMV0pO1xuICAgIH1cblxuXG59XG4iLCJpbXBvcnQgU3R5bGUgZnJvbSBcIi4uL3N0eWxlL3N0eWxlXCI7XG5pbXBvcnQgR2VvbSBmcm9tIFwiLi4vdXRpbHMvZ2VvbVwiO1xuaW1wb3J0IE1hcENTUyBmcm9tIFwiLi4vc3R5bGUvbWFwY3NzXCI7XG5pbXBvcnQgVGV4dE9uUGF0aCBmcm9tIFwiLi90ZXh0XCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRleHRpY29ucyB7XG5cbiAgICBzdGF0aWMgcmVuZGVyKGN0eCwgZmVhdHVyZSwgY29sbGlkZXMsIHdzLCBocywgcmVuZGVyVGV4dCwgcmVuZGVySWNvbikge1xuICAgICAgICBsZXQgc3R5bGUgPSBmZWF0dXJlLnN0eWxlLCBpbWcsIHBvaW50LCB3LCBoO1xuXG4gICAgICAgIGlmIChyZW5kZXJJY29uIHx8IChyZW5kZXJUZXh0ICYmIGZlYXR1cmUudHlwZSAhPT0gJ0xpbmVTdHJpbmcnKSkge1xuICAgICAgICAgICAgbGV0IHJlcHJQb2ludCA9IEdlb20uZ2V0UmVwclBvaW50KGZlYXR1cmUpO1xuICAgICAgICAgICAgaWYgKCFyZXByUG9pbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwb2ludCA9IEdlb20udHJhbnNmb3JtUG9pbnQocmVwclBvaW50LCB3cywgaHMpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlbmRlckljb24pIHtcbiAgICAgICAgICAgIGltZyA9IE1hcENTUy5nZXRJbWFnZShzdHlsZVsnaWNvbi1pbWFnZSddKTtcbiAgICAgICAgICAgIGlmICghaW1nKSB7IHJldHVybjsgfVxuXG4gICAgICAgICAgICB3ID0gaW1nLndpZHRoO1xuICAgICAgICAgICAgaCA9IGltZy5oZWlnaHQ7XG5cbiAgICAgICAgICAgIGlmIChzdHlsZVsnaWNvbi13aWR0aCddIHx8IHN0eWxlWydpY29uLWhlaWdodCddKXtcbiAgICAgICAgICAgICAgICBpZiAoc3R5bGVbJ2ljb24td2lkdGgnXSkge1xuICAgICAgICAgICAgICAgICAgICB3ID0gc3R5bGVbJ2ljb24td2lkdGgnXTtcbiAgICAgICAgICAgICAgICAgICAgaCA9IGltZy5oZWlnaHQgKiB3IC8gaW1nLndpZHRoO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3R5bGVbJ2ljb24taGVpZ2h0J10pIHtcbiAgICAgICAgICAgICAgICAgICAgaCA9IHN0eWxlWydpY29uLWhlaWdodCddO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXN0eWxlWydpY29uLXdpZHRoJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHcgPSBpbWcud2lkdGggKiBoIC8gaW1nLmhlaWdodDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoc3R5bGVbJ2FsbG93LW92ZXJsYXAnXSAhPT0gJ3RydWUnKSAmJlxuICAgICAgICAgICAgICAgIGNvbGxpZGVzLmNoZWNrUG9pbnRXSChwb2ludCwgdywgaCwgZmVhdHVyZS5rb3RoaWNJZCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdGV4dCA9IFN0cmluZyhzdHlsZS50ZXh0KS50cmltKCk7XG5cbiAgICAgICAgaWYgKHJlbmRlclRleHQgJiYgdGV4dCkge1xuICAgICAgICAgICAgU3R5bGUuc2V0U3R5bGVzKGN0eCwge1xuICAgICAgICAgICAgICAgIGxpbmVXaWR0aDogc3R5bGVbJ3RleHQtaGFsby1yYWRpdXMnXSAqIDIsXG4gICAgICAgICAgICAgICAgZm9udDogU3R5bGUuZ2V0Rm9udFN0cmluZyhzdHlsZVsnZm9udC1mYW1pbHknXSwgc3R5bGVbJ2ZvbnQtc2l6ZSddLCBzdHlsZSlcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgaGFsbyA9IChzdHlsZS5oYXNPd25Qcm9wZXJ0eSgndGV4dC1oYWxvLXJhZGl1cycpKTtcblxuICAgICAgICAgICAgU3R5bGUuc2V0U3R5bGVzKGN0eCwge1xuICAgICAgICAgICAgICAgIGZpbGxTdHlsZTogc3R5bGVbJ3RleHQtY29sb3InXSB8fCAnIzAwMDAwMCcsXG4gICAgICAgICAgICAgICAgc3Ryb2tlU3R5bGU6IHN0eWxlWyd0ZXh0LWhhbG8tY29sb3InXSB8fCAnI2ZmZmZmZicsXG4gICAgICAgICAgICAgICAgZ2xvYmFsQWxwaGE6IHN0eWxlWyd0ZXh0LW9wYWNpdHknXSB8fCBzdHlsZS5vcGFjaXR5IHx8IDEsXG4gICAgICAgICAgICAgICAgdGV4dEFsaWduOiAnY2VudGVyJyxcbiAgICAgICAgICAgICAgICB0ZXh0QmFzZWxpbmU6ICdtaWRkbGUnXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHN0eWxlWyd0ZXh0LXRyYW5zZm9ybSddID09PSAndXBwZXJjYXNlJylcbiAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgZWxzZSBpZiAoc3R5bGVbJ3RleHQtdHJhbnNmb3JtJ10gPT09ICdsb3dlcmNhc2UnKVxuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBlbHNlIGlmIChzdHlsZVsndGV4dC10cmFuc2Zvcm0nXSA9PT0gJ2NhcGl0YWxpemUnKVxuICAgICAgICAgICAgICAgIHRleHQgPSB0ZXh0LnJlcGxhY2UoLyhefFxccylcXFMvZywgZnVuY3Rpb24oY2gpIHsgcmV0dXJuIGNoLnRvVXBwZXJDYXNlKCk7IH0pO1xuXG4gICAgICAgICAgICBpZiAoZmVhdHVyZS50eXBlID09PSAnUG9seWdvbicgfHwgZmVhdHVyZS50eXBlID09PSAnUG9pbnQnKSB7XG4gICAgICAgICAgICAgICAgbGV0IHRleHRXaWR0aCA9IGN0eC5tZWFzdXJlVGV4dCh0ZXh0KS53aWR0aCxcbiAgICAgICAgICAgICAgICAgICAgbGV0dGVyV2lkdGggPSB0ZXh0V2lkdGggLyB0ZXh0Lmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgY29sbGlzaW9uV2lkdGggPSB0ZXh0V2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpc2lvbkhlaWdodCA9IGxldHRlcldpZHRoICogMi41LFxuICAgICAgICAgICAgICAgICAgICBvZmZzZXQgPSBzdHlsZVsndGV4dC1vZmZzZXQnXSB8fCAwO1xuXG4gICAgICAgICAgICAgICAgaWYgKChzdHlsZVsndGV4dC1hbGxvdy1vdmVybGFwJ10gIT09ICd0cnVlJykgJiZcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZXMuY2hlY2tQb2ludFdIKFtwb2ludFswXSwgcG9pbnRbMV0gKyBvZmZzZXRdLCBjb2xsaXNpb25XaWR0aCwgY29sbGlzaW9uSGVpZ2h0LCBmZWF0dXJlLmtvdGhpY0lkKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGhhbG8pIHtcbiAgICAgICAgICAgICAgICAgICAgY3R4LnN0cm9rZVRleHQodGV4dCwgcG9pbnRbMF0sIHBvaW50WzFdICsgb2Zmc2V0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY3R4LmZpbGxUZXh0KHRleHQsIHBvaW50WzBdLCBwb2ludFsxXSArIG9mZnNldCk7XG5cbiAgICAgICAgICAgICAgICBsZXQgcGFkZGluZyA9IHN0eWxlWycteC1rb3QtbWluLWRpc3RhbmNlJ10gfHwgMjA7XG4gICAgICAgICAgICAgICAgY29sbGlkZXMuYWRkUG9pbnRXSChbcG9pbnRbMF0sIHBvaW50WzFdICsgb2Zmc2V0XSwgY29sbGlzaW9uV2lkdGgsIGNvbGxpc2lvbkhlaWdodCwgcGFkZGluZywgZmVhdHVyZS5rb3RoaWNJZCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmVhdHVyZS50eXBlID09PSAnTGluZVN0cmluZycpIHtcblxuICAgICAgICAgICAgICAgIGxldCBwb2ludHMgPSBHZW9tLnRyYW5zZm9ybVBvaW50cyhmZWF0dXJlLmNvb3JkaW5hdGVzLCB3cywgaHMpO1xuICAgICAgICAgICAgICAgIG5ldyBUZXh0T25QYXRoKGN0eCwgcG9pbnRzLCB0ZXh0LCBoYWxvLCBjb2xsaWRlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocmVuZGVySWNvbikge1xuICAgICAgICAgICAgY3R4LmRyYXdJbWFnZShpbWcsXG4gICAgICAgICAgICAgICAgTWF0aC5mbG9vcihwb2ludFswXSAtIHcgLyAyKSxcbiAgICAgICAgICAgICAgICBNYXRoLmZsb29yKHBvaW50WzFdIC0gaCAvIDIpLCB3LCBoKTtcblxuICAgICAgICAgICAgbGV0IHBhZGRpbmcyID0gcGFyc2VGbG9hdChzdHlsZVsnLXgta290LW1pbi1kaXN0YW5jZSddKSB8fCAwO1xuICAgICAgICAgICAgY29sbGlkZXMuYWRkUG9pbnRXSChwb2ludCwgdywgaCwgcGFkZGluZzIsIGZlYXR1cmUua290aGljSWQpO1xuICAgICAgICB9XG4gICAgfVxufTsiLCJsZXQgTWFwQ1NTSW5zdGFuY2UgPSBudWxsO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNYXBDU1Mge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIGlmIChNYXBDU1NJbnN0YW5jZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBNYXBDU1NJbnN0YW5jZSA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLl9zdHlsZXM9IHt9O1xuICAgICAgICAgICAgdGhpcy5fYXZhaWxhYmxlU3R5bGVzPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX2ltYWdlcz0ge307XG4gICAgICAgICAgICB0aGlzLl9sb2NhbGVzPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3ByZXNlbmNlX3RhZ3M9IFtdO1xuICAgICAgICAgICAgdGhpcy5fdmFsdWVfdGFncz0gW107XG4gICAgICAgICAgICB0aGlzLl9jYWNoZT0ge307XG4gICAgICAgICAgICB0aGlzLl9kZWJ1Zz0ge2hpdDogMCwgbWlzczogMH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gTWFwQ1NTSW5zdGFuY2VcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IHNoYXJlZCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBNYXBDU1MoKTtcbiAgICB9XG5cbiAgICBnZXQgYXZhaWxhYmxlU3R5bGVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYXZhaWxhYmxlU3R5bGVzO1xuICAgIH1cblxuICAgIHN0YXRpYyBvbkVycm9yKCkge1xuICAgIH1cblxuICAgIHN0YXRpYyBvbkltYWdlc0xvYWQoKSB7XG4gICAgfS8qKlxuICAgICAqIEluY2FsaWRhdGUgc3R5bGVzIGNhY2hlXG4gICAgICovXG4gICAgaW52YWxpZGF0ZUNhY2hlKCkge1xuICAgICAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgIH1cblxuICAgIHN0YXRpYyBlX21pbigvKi4uLiovKSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1pbi5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBlX21heCgvKi4uLiovKSB7XG4gICAgICAgIHJldHVybiBNYXRoLm1heC5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICBzdGF0aWMgZV9hbnkoLyouLi4qLykge1xuICAgICAgICBsZXQgaTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mKGFyZ3VtZW50c1tpXSkgIT09ICd1bmRlZmluZWQnICYmIGFyZ3VtZW50c1tpXSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICBzdGF0aWMgZV9udW0oYXJnKSB7XG4gICAgICAgIGlmICghaXNOYU4ocGFyc2VGbG9hdChhcmcpKSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQoYXJnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgZV9zdHIoYXJnKSB7XG4gICAgICAgIHJldHVybiBhcmc7XG4gICAgfVxuICAgIHN0YXRpYyBlX2ludChhcmcpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlSW50KGFyZywgMTApO1xuICAgIH1cbiAgICBzdGF0aWMgZV90YWcob2JqLCB0YWcpIHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eSh0YWcpICYmIG9ialt0YWddICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGFnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBlX3Byb3Aob2JqLCB0YWcpIHtcbiAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eSh0YWcpICYmIG9ialt0YWddICE9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gb2JqW3RhZ107XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGVfc3FydChhcmcpIHtcbiAgICAgICAgcmV0dXJuIE1hdGguc3FydChhcmcpO1xuICAgIH1cbiAgICBzdGF0aWMgZV9ib29sZWFuKGFyZywgaWZfZXhwLCBlbHNlX2V4cCkge1xuICAgICAgICBpZiAodHlwZW9mKGlmX2V4cCkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpZl9leHAgPSAndHJ1ZSc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mKGVsc2VfZXhwKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGVsc2VfZXhwID0gJ2ZhbHNlJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChhcmcgPT09ICcwJyB8fCBhcmcgPT09ICdmYWxzZScgfHwgYXJnID09PSAnJykge1xuICAgICAgICAgICAgcmV0dXJuIGVsc2VfZXhwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGlmX2V4cDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgZV9tZXRyaWMoYXJnKSB7XG4gICAgICAgIGlmICgvXFxkXFxzKm1tJC8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICByZXR1cm4gMTAwMCAqIHBhcnNlSW50KGFyZywgMTApO1xuICAgICAgICB9IGVsc2UgaWYgKC9cXGRcXHMqY20kLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHJldHVybiAxMDAgKiBwYXJzZUludChhcmcsIDEwKTtcbiAgICAgICAgfSBlbHNlIGlmICgvXFxkXFxzKmRtJC8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICByZXR1cm4gMTAgKiBwYXJzZUludChhcmcsIDEwKTtcbiAgICAgICAgfSBlbHNlIGlmICgvXFxkXFxzKmttJC8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICByZXR1cm4gMC4wMDEgKiBwYXJzZUludChhcmcsIDEwKTtcbiAgICAgICAgfSBlbHNlIGlmICgvXFxkXFxzKmluJC8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICByZXR1cm4gMC4wMjU0ICogcGFyc2VJbnQoYXJnLCAxMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoL1xcZFxccypmdCQvLnRlc3QoYXJnKSkge1xuICAgICAgICAgICAgcmV0dXJuIDAuMzA0OCAqIHBhcnNlSW50KGFyZywgMTApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KGFyZywgMTApO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyAgZV96bWV0cmljKGFyZykge1xuICAgICAgICByZXR1cm4gTWFwQ1NTLnNoYXJlZC5lX21ldHJpYyhhcmcpO1xuICAgIH1cbiAgICBzdGF0aWMgZV9sb2NhbGl6ZSh0YWdzLCB0ZXh0KSB7XG4gICAgICAgIGxldCBsb2NhbGVzID0gTWFwQ1NTLnNoYXJlZC5fbG9jYWxlcywgaSwgdGFnO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsb2NhbGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0YWcgPSB0ZXh0ICsgJzonICsgbG9jYWxlc1tpXTtcbiAgICAgICAgICAgIGlmICh0YWdzW3RhZ10pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGFnc1t0YWddO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRhZ3NbdGV4dF07XG4gICAgfVxuXG4gICAgc3RhdGljIGxvYWRTdHlsZShzdHlsZSwgcmVzdHlsZSwgc3ByaXRlX2ltYWdlcywgZXh0ZXJuYWxfaW1hZ2VzLCBwcmVzZW5jZV90YWdzLCB2YWx1ZV90YWdzKSB7XG4gICAgICAgIGxldCBpO1xuICAgICAgICBzcHJpdGVfaW1hZ2VzID0gc3ByaXRlX2ltYWdlcyB8fCBbXTtcbiAgICAgICAgZXh0ZXJuYWxfaW1hZ2VzID0gZXh0ZXJuYWxfaW1hZ2VzIHx8IFtdO1xuXG4gICAgICAgIGlmIChwcmVzZW5jZV90YWdzKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcHJlc2VuY2VfdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChNYXBDU1Muc2hhcmVkLl9wcmVzZW5jZV90YWdzLmluZGV4T2YocHJlc2VuY2VfdGFnc1tpXSkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIE1hcENTUy5zaGFyZWQuX3ByZXNlbmNlX3RhZ3MucHVzaChwcmVzZW5jZV90YWdzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWVfdGFncykge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHZhbHVlX3RhZ3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoTWFwQ1NTLnNoYXJlZC5fdmFsdWVfdGFncy5pbmRleE9mKHZhbHVlX3RhZ3NbaV0pIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICBNYXBDU1Muc2hhcmVkLl92YWx1ZV90YWdzLnB1c2godmFsdWVfdGFnc1tpXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgTWFwQ1NTLnNoYXJlZC5fc3R5bGVzW3N0eWxlXSA9IHtcbiAgICAgICAgICAgIHJlc3R5bGU6IHJlc3R5bGUsXG4gICAgICAgICAgICBpbWFnZXM6IHNwcml0ZV9pbWFnZXMsXG4gICAgICAgICAgICBleHRlcm5hbF9pbWFnZXM6IGV4dGVybmFsX2ltYWdlcyxcbiAgICAgICAgICAgIHRleHR1cmVzOiB7fSxcbiAgICAgICAgICAgIHNwcml0ZV9sb2FkZWQ6ICFzcHJpdGVfaW1hZ2VzLFxuICAgICAgICAgICAgZXh0ZXJuYWxfaW1hZ2VzX2xvYWRlZDogIWV4dGVybmFsX2ltYWdlcy5sZW5ndGhcbiAgICAgICAgfTtcblxuICAgICAgICBNYXBDU1Muc2hhcmVkLl9hdmFpbGFibGVTdHlsZXMucHVzaChzdHlsZSk7XG4gICAgfS8qKlxuICAgICAqIENhbGwgTWFwQ1NTLnNoYXJlZC5vbkltYWdlc0xvYWQgY2FsbGJhY2sgaWYgYWxsIHNwcml0ZSBhbmQgZXh0ZXJuYWxcbiAgICAgKiBpbWFnZXMgd2FzIGxvYWRlZFxuICAgICAqL1xuICAgIHN0YXRpYyBfb25JbWFnZXNMb2FkKHN0eWxlKSB7XG4gICAgICAgIGlmIChNYXBDU1Muc2hhcmVkLl9zdHlsZXNbc3R5bGVdLmV4dGVybmFsX2ltYWdlc19sb2FkZWQgJiZcbiAgICAgICAgICAgICAgICBNYXBDU1Muc2hhcmVkLl9zdHlsZXNbc3R5bGVdLnNwcml0ZV9sb2FkZWQpIHtcbiAgICAgICAgICAgIE1hcENTUy5vbkltYWdlc0xvYWQoKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgcHJlbG9hZFNwcml0ZUltYWdlKHN0eWxlLCB1cmwpIHtcblxuICAgICAgICBsZXQgaW1hZ2VzID0gTWFwQ1NTLnNoYXJlZC5fc3R5bGVzW3N0eWxlXS5faW1hZ2VzLFxuICAgICAgICAgICAgaW1nID0gbmV3IEltYWdlKCk7XG5cbiAgICAgICAgZGVsZXRlIE1hcENTUy5zaGFyZWQuX3N0eWxlc1tzdHlsZV0uX2ltYWdlcztcblxuICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGV0IGltYWdlO1xuICAgICAgICAgICAgZm9yIChpbWFnZSBpbiBpbWFnZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW1hZ2VzLmhhc093blByb3BlcnR5KGltYWdlKSkge1xuICAgICAgICAgICAgICAgICAgICBpbWFnZXNbaW1hZ2VdLnNwcml0ZSA9IGltZztcbiAgICAgICAgICAgICAgICAgICAgTWFwQ1NTLnNoYXJlZC5faW1hZ2VzW2ltYWdlXSA9IGltYWdlc1tpbWFnZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgTWFwQ1NTLnNoYXJlZC5fc3R5bGVzW3N0eWxlXS5zcHJpdGVfbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIE1hcENTUy5fb25JbWFnZXNMb2FkKHN0eWxlKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgTWFwQ1NTLm9uRXJyb3IoZSk7XG4gICAgICAgIH07XG4gICAgICAgIGltZy5zcmMgPSB1cmw7XG4gICAgfVxuICAgIHN0YXRpYyBwcmVsb2FkRXh0ZXJuYWxJbWFnZXMoc3R5bGUsIHVybFByZWZpeCkge1xuICAgICAgICBsZXQgZXh0ZXJuYWxfaW1hZ2VzID0gTWFwQ1NTLnNoYXJlZC5fc3R5bGVzW3N0eWxlXS5leHRlcm5hbF9pbWFnZXM7XG4gICAgICAgIGRlbGV0ZSBNYXBDU1Muc2hhcmVkLl9zdHlsZXNbc3R5bGVdLmV4dGVybmFsX2ltYWdlcztcblxuICAgICAgICB1cmxQcmVmaXggPSB1cmxQcmVmaXggfHwgJyc7XG4gICAgICAgIGxldCBsZW4gPSBleHRlcm5hbF9pbWFnZXMubGVuZ3RoLCBsb2FkZWQgPSAwLCBpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGxvYWRJbWFnZSh1cmwpIHtcbiAgICAgICAgICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbG9hZGVkKys7XG4gICAgICAgICAgICAgICAgTWFwQ1NTLnNoYXJlZC5faW1hZ2VzW3VybF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHNwcml0ZTogaW1nLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGltZy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBpbWcud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogMFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZCA9PT0gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIE1hcENTUy5zaGFyZWQuX3N0eWxlc1tzdHlsZV0uZXh0ZXJuYWxfaW1hZ2VzX2xvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIE1hcENTUy5fb25JbWFnZXNMb2FkKHN0eWxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbG9hZGVkKys7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZCA9PT0gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIE1hcENTUy5zaGFyZWQuX3N0eWxlc1tzdHlsZV0uZXh0ZXJuYWxfaW1hZ2VzX2xvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIE1hcENTUy5fb25JbWFnZXNMb2FkKHN0eWxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLnNyYyA9IHVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgbG9hZEltYWdlKHVybFByZWZpeCArIGV4dGVybmFsX2ltYWdlc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGdldEltYWdlKHJlZikge1xuICAgICAgICBsZXQgaW1nID0gTWFwQ1NTLnNoYXJlZC5faW1hZ2VzW3JlZl07XG5cbiAgICAgICAgaWYgKGltZyAmJiBpbWcuc3ByaXRlKSB7XG4gICAgICAgICAgICBsZXQgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWcud2lkdGg7XG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodDtcblxuICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKGltZy5zcHJpdGUsXG4gICAgICAgICAgICAgICAgICAgIDAsIGltZy5vZmZzZXQsIGltZy53aWR0aCwgaW1nLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgMCwgMCwgaW1nLndpZHRoLCBpbWcuaGVpZ2h0KTtcblxuICAgICAgICAgICAgaW1nID0gTWFwQ1NTLnNoYXJlZC5faW1hZ2VzW3JlZl0gPSBjYW52YXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW1nO1xuICAgIH1cbiAgICBnZXRUYWdLZXlzKHRhZ3MsIHpvb20sIHR5cGUsIHNlbGVjdG9yKSB7XG4gICAgICAgIGxldCBrZXlzID0gW10sIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLl9wcmVzZW5jZV90YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGFncy5oYXNPd25Qcm9wZXJ0eSh0aGlzLl9wcmVzZW5jZV90YWdzW2ldKSkge1xuICAgICAgICAgICAgICAgIGtleXMucHVzaCh0aGlzLl9wcmVzZW5jZV90YWdzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLl92YWx1ZV90YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGFncy5oYXNPd25Qcm9wZXJ0eSh0aGlzLl92YWx1ZV90YWdzW2ldKSkge1xuICAgICAgICAgICAgICAgIGtleXMucHVzaCh0aGlzLl92YWx1ZV90YWdzW2ldICsgJzonICsgdGFnc1t0aGlzLl92YWx1ZV90YWdzW2ldXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW3pvb20sIHR5cGUsIHNlbGVjdG9yLCBrZXlzLmpvaW4oJzonKV0uam9pbignOicpO1xuICAgIH1cbiAgICByZXN0eWxlKHN0eWxlTmFtZXMsIHRhZ3MsIHpvb20sIHR5cGUsIHNlbGVjdG9yKSB7XG4gICAgICAgIGxldCBpLCBrZXkgPSB0aGlzLmdldFRhZ0tleXModGFncywgem9vbSwgdHlwZSwgc2VsZWN0b3IpLCBhY3Rpb25zID0gdGhpcy5fY2FjaGVba2V5XSB8fCB7fTtcblxuICAgICAgICBpZiAoIXRoaXMuX2NhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2RlYnVnLm1pc3MgKz0gMTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzdHlsZU5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9ucyA9IE1hcENTUy5zaGFyZWQuX3N0eWxlc1tzdHlsZU5hbWVzW2ldXS5yZXN0eWxlKGFjdGlvbnMsIHRhZ3MsIHpvb20sIHR5cGUsIHNlbGVjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2NhY2hlW2tleV0gPSBhY3Rpb25zO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZGVidWcuaGl0ICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYWN0aW9ucztcbiAgICB9XG59XG4iLCJpbXBvcnQgTWFwQ1NTIGZyb20gXCIuL21hcGNzc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBvc21vc25pbWtpIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnNwcml0ZV9pbWFnZXMgPSB7fTtcbiAgICAgICAgdGhpcy5leHRlcm5hbF9pbWFnZXMgPSBbXTtcbiAgICAgICAgdGhpcy5wcmVzZW5jZV90YWdzID0gWydzaG9wJ107XG4gICAgICAgIHRoaXMudmFsdWVfdGFncyA9IFsnY29sb3InLCAnYW1lbml0eScsICdwaycsICdidWlsZGluZyAnLCAnd2FsbCcsICdzdXJmYWNlJywgJ21hcmtpbmcnLCAnc2VydmljZScsICdhZGRyOmhvdXNlbnVtYmVyJywgJ3BvcHVsYXRpb24nLCAnbGVpc3VyZScsICd3YXRlcndheScsICdhZXJvd2F5JywgJ2xhbmR1c2UnLCAnYmFycmllcicsICdjb2xvdXInLCAncmFpbHdheScsICdvbmV3YXknLCAncmVsaWdpb24nLCAndG91cmlzbScsICdhZG1pbl9sZXZlbCcsICd0cmFuc3BvcnQnLCAnbmFtZScsICdidWlsZGluZycsICdwbGFjZScsICdyZXNpZGVudGlhbCcsICdoaWdod2F5JywgJ2VsZScsICdsaXZpbmdfc3RyZWV0JywgJ25hdHVyYWwnLCAnYm91bmRhcnknLCAnY2FwaXRhbCddO1xuXG4gICAgICAgIE1hcENTUy5sb2FkU3R5bGUoJ3N0eWxlcy9jb250YWd0JywgdGhpcy5yZXN0eWxlLCB0aGlzLnNwcml0ZV9pbWFnZXMsIHRoaXMuZXh0ZXJuYWxfaW1hZ2VzLCB0aGlzLnByZXNlbmNlX3RhZ3MsIHRoaXMudmFsdWVfdGFncyk7XG4gICAgICAgIE1hcENTUy5wcmVsb2FkRXh0ZXJuYWxJbWFnZXMoJ3N0eWxlcy9jb250YWd0Jyk7XG4gICAgfVxuXG4gICAgcmVzdHlsZShzdHlsZSwgdGFncywgem9vbSwgdHlwZSwgc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIHNfZGVmYXVsdCA9IHt9LCBzX2NlbnRlcmxpbmUgPSB7fSwgc190aWNrcyA9IHt9LCBzX2xhYmVsID0ge307XG4gICAgICAgIFxuICAgICAgICBpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwiYmFja2dyb3VuZFwiKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjRkZGRkZGJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxO1xuXHRcdH1cblx0XHRcbiAgICAgICAgXG5cdFx0aWYgKHRhZ3NbXCJzdXJmYWNlXCJdID09PSBcImZsb29yXCIpIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNGNUY0RkYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDMxO1xuXHRcdH1cblx0XHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJzdGVwc1wiICYmIHNlbGVjdG9yID09PSBcImFyZWFcIikgXG5cdFx0e1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI0ZGQTM4NCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ29wYWNpdHknXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDMzO1xuXHRcdH1cblx0XHRcblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwiZWxldmF0b3JcIiApIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNDQ0EzODQnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzMztcblx0XHR9XG5cdFx0XG5cdFx0aWYgKHRhZ3NbXCJzdXJmYWNlXCJdID09PSBcImVsZXZhdG9yXCIgJiYgc2VsZWN0b3IgPT09IFwiYXJlYVwiKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjQ0NBMzg0JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnb3BhY2l0eSddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzM7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wiaGlnaHdheVwiXSA9PT0gXCJzdGVwc1wiKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjRkZBMzg0JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzMztcblx0XHR9XG5cdFx0XG5cdFx0XG5cdFx0aWYgKHRhZ3NbXCJoaWdod2F5XCJdID09PSBcImVsZXZhdG9yXCIpIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNDQ0EzODQnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDMzO1xuXHRcdH1cblx0XHRcblx0XHRcblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwiYmFsY29ueVwiICYmIHNlbGVjdG9yID09PSBcImFyZWFcIiApIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyM4NzU2NDYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDAuNjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzM7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJkb29yXCIgJiYgc2VsZWN0b3IgPT0gXCJsaW5lXCIpIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjREJEQkRCJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDM5O1xuXHRcdH1cblx0XHRcblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwic29saWRcIiAmJiBzZWxlY3RvciA9PT0gXCJhcmVhXCIgKSBcblx0XHR7XG5cdFx0XHRcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyMwQjA4MTEnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDAuOTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzA7XG5cdFx0fVxuXHRcdFxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJ0cmFuc3BhcmVudFwiICYmIHNlbGVjdG9yID09PSBcImFyZWFcIiApIFxuXHRcdHtcblx0XHRcdFxuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI0ZGRic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMC40O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzMDtcblx0XHR9XG5cdFx0XG5cdFx0XG5cdFx0aWYgKHRhZ3NbXCJzdXJmYWNlXCJdID09PSBcInBsYW50XCIgICYmIHNlbGVjdG9yID09PSBcImFyZWFcIiApIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyM4M0RGNjAnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDAuOTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzA7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJzYW5kXCIgICYmIHNlbGVjdG9yID09PSBcImFyZWFcIiApIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNGREQ0ODUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMwMDAwMDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAwLjg7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMC45O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMS41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZGFzaGVzJ10gPSBbOSwgOV07XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJjb25jcmV0ZVwiICAmJiBzZWxlY3RvciA9PT0gXCJhcmVhXCIgKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjREREREREJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAwLjk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDMwO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMyMjIyMjInO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMS41O1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAwLjY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Rhc2hlcyddID0gWzksIDNdO1xuXHRcdH1cdFxuXHRcdFxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJwYXZpbmdfc2xhYlwiICYmIHNlbGVjdG9yID09PSBcImFyZWFcIiApIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNFMEQwREInO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMyMjIyMjInO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDAuNjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzA7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Rhc2hlcyddID0gWzUsIDJdO1xuXHRcdH1cblx0XHRcblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwiZG9vclwiICAmJiBzZWxlY3RvciA9PT0gXCJhcmVhXCIgKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjNjA3Rjg0JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAwLjY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzAwMDAwMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDM5O1xuXHRcdH1cblx0XHRcblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwiZ3JlZW5cIiAgJiYgc2VsZWN0b3IgPT09IFwiYXJlYVwiICkgXG5cdFx0e1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnIzg4QzAzNyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMC4yO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzMDtcblx0XHR9XG5cdFx0aWYgKHRhZ3NbXCJzdXJmYWNlXCJdID09PSBcIndpbmRvd1wiICAmJiBzZWxlY3RvciA9PT0gXCJhcmVhXCIgKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjMTNDNUNGJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAwLjM7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzAwMDAwMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDM1O1xuXHRcdH1cblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT0gXCJzYW5pdGFyeVwiICAmJiBzZWxlY3RvciA9PSBcImFyZWFcIikgXG5cdFx0e1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI0VFQ0ZGQyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzY7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PSBcImJldmVyYWdlc1wiICAmJiBzZWxlY3RvciA9PSBcImFyZWFcIikgXG5cdFx0e1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI0UzRUZFQSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzY7XG5cdFx0fVxuXHRcdFxuXHRcdGlmKHRhZ3NbXCJzdXJmYWNlXCJdID09IFwicm9vbVwiICYmIHNlbGVjdG9yID09IFwiYXJlYVwiKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjRTlFOUU5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzNjtcblx0XHR9XG5cdFx0XG5cdFx0aWYodGFnc1tcImhhbmRyYWlsXCJdID09PSBcInllc1wiKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzExMTExMSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDI3O1xuICAgICAgICAgICAgc19kZWZhdWx0WydkYXNoZXMnXSA9IFs1LCA1XTtcblx0XHR9XG5cdFx0XG5cdFx0aWYodHlwZSA9PT0gJ3dheScgJiYgdGFnc1tcIndhbGxcIl0gPT09IFwieWVzXCIgJiYgem9vbSA8IDEyICkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMwMDAwMDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMC41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAyNztcblx0XHR9XG5cdFx0XG5cdFx0aWYodGFnc1tcIndhbGxcIl0gPT09IFwieWVzXCIgJiYgem9vbSA8IDE2ICYmIHpvb20gPj0gMTIpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjMDAwMDAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDI3O1xuXHRcdH1cblx0XHRcblx0XHRpZih0YWdzW1wid2FsbFwiXSA9PT0gXCJ5ZXNcIiAgJiYgem9vbSA+PSAxNiApIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjMDAwMDAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMjc7XG5cdFx0fVxuXHRcdFxuXHRcdGlmKHRhZ3NbXCJ3YWxsXCJdID49IDE2ICkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMwMDAwMDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMS41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAyNztcblx0XHR9XG5cdFx0XG5cdFx0aWYodGFnc1tcIndhbGxcIl0gPT0gXCJ5ZXNcIiAmJiBzZWxlY3RvciA9PSBcImFyZWFcIikge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI0U5RTlFOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMjI7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wiYnVpbGRpbmdcIl0gPT09IFwieWVzXCIgJiYgc2VsZWN0b3IgPT0gXCJhcmVhXCIpIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNERERBRDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI0NDQzlDNCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDg7XG5cdFx0fVxuXHRcdFxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ25hdHVyYWwnXSA9PT0gJ2NvYXN0bGluZScpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2ZjZjhlNCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1sYXllciddID0gJ2JvdHRvbSc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnZ2xhY2llcicpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2ZjZmVmZic7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xlaXN1cmUnXSA9PT0gJ3BhcmsnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNjNGU5YTQnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsZWlzdXJlJ10gPT09ICdnYXJkZW4nKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ29yY2hhcmQnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnc2NydWInKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNlNWY1ZGMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyduYXR1cmFsJ10gPT09ICdoZWF0aCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2VjZmZlNSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ2luZHVzdHJpYWwnKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ21pbGl0YXJ5JykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjZGRkOGRhJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snYW1lbml0eSddID09PSAncGFya2luZycpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2VjZWRmNCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDM7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnZm9yZXN0JykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyduYXR1cmFsJ10gPT09ICd3b29kJykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICdmb3Jlc3QnKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ3dvb2QnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNkNmY0YzYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICdnYXJhZ2VzJykgJiYgem9vbSA+PSAxMCkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNkZGQ4ZGEnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyduYXR1cmFsJ10gPT09ICdmb3Jlc3QnKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ25hdHVyYWwnXSA9PT0gJ3dvb2QnKSAmJiB6b29tID49IDEwKSB8fCAoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbGFuZHVzZSddID09PSAnZm9yZXN0JykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICd3b29kJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb2Zmc2V0J10gPSAwO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICcxMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNlcmlmIEl0YWxpYyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICdncmVlbic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtYWxsb3ctb3ZlcmxhcCddID0gJ2ZhbHNlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1taW4tZGlzdGFuY2UnXSA9ICcwICc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ2dyYXNzJykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyduYXR1cmFsJ10gPT09ICdncmFzcycpKSB8fCAoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnbWVhZG93JykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICdtZWFkb3cnKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ3JlY3JlYXRpb25fZ3JvdW5kJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjZjRmZmU1JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gNDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnd2V0bGFuZCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSA0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICdmYXJtbGFuZCcpKSB8fCAoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbGFuZHVzZSddID09PSAnZmFybScpKSB8fCAoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbGFuZHVzZSddID09PSAnZmllbGQnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNmZmY1YzQnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSA1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICdjZW1ldGVyeScpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2U1ZjVkYyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2Flcm93YXknXSA9PT0gJ2Flcm9kcm9tZScpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMwMDhhYzYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMC44O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSA1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsZWlzdXJlJ10gPT09ICdzdGFkaXVtJykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsZWlzdXJlJ10gPT09ICdwaXRjaCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2UzZGViMSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWyd3YXRlcndheSddID09PSAncml2ZXInKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjQzRENEY1JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuOTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gOTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ3dhdGVyd2F5J10gPT09ICdzdHJlYW0nKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjQzRENEY1JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gOTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ3dhdGVyd2F5J10gPT09ICdjYW5hbCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNhYmM0ZjUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMC42O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSA5O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyd3YXRlcndheSddID09PSAncml2ZXJiYW5rJykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyduYXR1cmFsJ10gPT09ICd3YXRlcicpKSB8fCAoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbGFuZHVzZSddID09PSAncmVzZXJ2b2lyJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjQzRENEY1JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjQzRENEY1JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gOTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnd2F0ZXInKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1vZmZzZXQnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzEwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2VyaWYgSXRhbGljJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyMyODVmZDEnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWFsbG93LW92ZXJsYXAnXSA9ICdmYWxzZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnY29uc3RydWN0aW9uJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtcG9zaXRpb24nXSA9ICdsaW5lJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM0MDQwNDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIEJvb2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAyO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZGFzaGVzJ10gPSBbOSwgOV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdjb25zdHJ1Y3Rpb24nKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy13aWR0aCddID0gMC41O1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctY29sb3InXSA9ICcjOTk2NzAzJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDM7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDEwO1xuICAgICAgICAgICAgc19kZWZhdWx0WydkYXNoZXMnXSA9IFs5LCA5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ2Zvb3R3YXknKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdwYXRoJykpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnY3ljbGV3YXknKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdwZWRlc3RyaWFuJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtcG9zaXRpb24nXSA9ICdsaW5lJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM0MDQwNDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIEJvb2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnI2JmOTZjZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjI7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDEwO1xuICAgICAgICAgICAgc19kZWZhdWx0WydkYXNoZXMnXSA9IFsyLCAyXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3N0ZXBzJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtcG9zaXRpb24nXSA9ICdsaW5lJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM0MDQwNDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIEJvb2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAzO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNiZjk2Y2UnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZGFzaGVzJ10gPSBbMSwgMV07XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2xpbmVjYXAnXSA9ICdidXR0JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3JvYWQnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICd0cmFjaycpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb29rJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMS41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdyb2FkJykpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAndHJhY2snKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDIuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLXdpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSA5O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnc2VydmljZScpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEuMjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLXdpZHRoJ10gPSAwLjM7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3Jlc2lkZW50aWFsJykgJiYgem9vbSA9PT0gMTYpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAndW5jbGFzc2lmaWVkJykgJiYgem9vbSA9PT0gMTYpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnbGl2aW5nX3N0cmVldCcpICYmIHpvb20gPT09IDE2KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3NlcnZpY2UnICYmICh0YWdzWydsaXZpbmdfc3RyZWV0J10gPT09ICctMScgfHwgdGFnc1snbGl2aW5nX3N0cmVldCddID09PSAnZmFsc2UnIHx8IHRhZ3NbJ2xpdmluZ19zdHJlZXQnXSA9PT0gJ25vJykgJiYgdGFnc1snc2VydmljZSddICE9PSAncGFya2luZ19haXNsZScpICYmIHpvb20gPT09IDE2KSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb29rJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMy41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDEwO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdyZXNpZGVudGlhbCcpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3VuY2xhc3NpZmllZCcpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ2xpdmluZ19zdHJlZXQnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdzZXJ2aWNlJyAmJiAodGFnc1snbGl2aW5nX3N0cmVldCddID09PSAnLTEnIHx8IHRhZ3NbJ2xpdmluZ19zdHJlZXQnXSA9PT0gJ2ZhbHNlJyB8fCB0YWdzWydsaXZpbmdfc3RyZWV0J10gPT09ICdubycpICYmIHRhZ3NbJ3NlcnZpY2UnXSAhPT0gJ3BhcmtpbmdfYWlzbGUnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDQuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLXdpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnc2Vjb25kYXJ5JykgJiYgem9vbSA9PT0gMTYpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnc2Vjb25kYXJ5X2xpbmsnKSAmJiB6b29tID09PSAxNikgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICd0ZXJ0aWFyeScpICYmIHpvb20gPT09IDE2KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3RlcnRpYXJ5X2xpbmsnKSAmJiB6b29tID09PSAxNikpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9sZCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZjZmZkMSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy13aWR0aCddID0gMC41O1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctY29sb3InXSA9ICcjOTk2NzAzJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdzZWNvbmRhcnknKSAmJiB6b29tID09PSAxNykgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdzZWNvbmRhcnlfbGluaycpICYmIHpvb20gPT09IDE3KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3RlcnRpYXJ5JykgJiYgem9vbSA9PT0gMTcpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAndGVydGlhcnlfbGluaycpICYmIHpvb20gPT09IDE3KSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb2xkJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gODtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjZmNmZmQxJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLXdpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3NlY29uZGFyeScpICYmIHpvb20gPT09IDE4KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3NlY29uZGFyeV9saW5rJykgJiYgem9vbSA9PT0gMTgpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAndGVydGlhcnknKSAmJiB6b29tID09PSAxOCkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICd0ZXJ0aWFyeV9saW5rJykgJiYgem9vbSA9PT0gMTgpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtcG9zaXRpb24nXSA9ICdsaW5lJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM0MDQwNDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIEJvbGQnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSA5O1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmY2ZmZDEnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDExO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAncHJpbWFyeScpICYmIHpvb20gPT09IDE2KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3ByaW1hcnlfbGluaycpICYmIHpvb20gPT09IDE2KSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb2xkJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gOTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjZmNlYTk3JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLXdpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3ByaW1hcnknKSAmJiB6b29tID09PSAxNykgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdwcmltYXJ5X2xpbmsnKSAmJiB6b29tID09PSAxNykpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9sZCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEwO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmY2VhOTcnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDEyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAncHJpbWFyeScpICYmIHpvb20gPT09IDE4KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3ByaW1hcnlfbGluaycpICYmIHpvb20gPT09IDE4KSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb2xkJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMTE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZjZWE5Nyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy13aWR0aCddID0gMC41O1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctY29sb3InXSA9ICcjOTk2NzAzJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICd0cnVuaycpICYmIHpvb20gPT09IDE3KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3RydW5rX2xpbmsnKSAmJiB6b29tID09PSAxNykgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdtb3RvcndheScpICYmIHpvb20gPT09IDE3KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ21vdG9yd2F5X2xpbmsnKSAmJiB6b29tID09PSAxNykpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9sZCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEyO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmZmQ3ODAnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3RydW5rJykgJiYgem9vbSA9PT0gMTgpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAndHJ1bmtfbGluaycpICYmIHpvb20gPT09IDE4KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ21vdG9yd2F5JykgJiYgem9vbSA9PT0gMTgpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnbW90b3J3YXlfbGluaycpICYmIHpvb20gPT09IDE4KSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb2xkJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMTM7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZmZDc4MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy13aWR0aCddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDEzO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICd0cnVuaycpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3RydW5rX2xpbmsnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdtb3RvcndheScpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ21vdG9yd2F5X2xpbmsnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdwcmltYXJ5JykpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAncHJpbWFyeV9saW5rJykpKSB7XG4gICAgICAgICAgICBzX2NlbnRlcmxpbmVbJ3dpZHRoJ10gPSAwLjM7XG4gICAgICAgICAgICBzX2NlbnRlcmxpbmVbJ2NvbG9yJ10gPSAnI2ZhNjQ3OCc7XG4gICAgICAgICAgICBzX2NlbnRlcmxpbmVbJ3otaW5kZXgnXSA9IDE0O1xuICAgICAgICAgICAgc19jZW50ZXJsaW5lWycteC1tYXBuaWstbGF5ZXInXSA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgKHRhZ3NbJ29uZXdheSddID09PSAnMScgfHwgdGFnc1snb25ld2F5J10gPT09ICd0cnVlJyB8fCB0YWdzWydvbmV3YXknXSA9PT0gJ3llcycpKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnbGluZS1zdHlsZSddID0gJ2Fycm93cyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE1O1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbGF5ZXInXSA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdsaW5lJyAmJiB0YWdzWydyYWlsd2F5J10gPT09ICdyYWlsJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjQ7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzYwNjA2MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdsaW5lJyAmJiB0YWdzWydyYWlsd2F5J10gPT09ICdyYWlsJykpKSB7XG4gICAgICAgICAgICBzX3RpY2tzWyd3aWR0aCddID0gMTtcbiAgICAgICAgICAgIHNfdGlja3NbJ2NvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX3RpY2tzWydkYXNoZXMnXSA9IFs2LCA2XTtcbiAgICAgICAgICAgIHNfdGlja3NbJ3otaW5kZXgnXSA9IDE2O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1sncmFpbHdheSddID09PSAnc3Vid2F5JykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAzO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMwNzI4ODknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZGFzaGVzJ10gPSBbMywgM107XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ29wYWNpdHknXSA9IDAuMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnbGluZWNhcCddID0gJ2J1dHQnO1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbGF5ZXInXSA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snYmFycmllciddID09PSAnZmVuY2UnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICdibGFjayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE2O1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbGF5ZXInXSA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snYmFycmllciddID09PSAnd2FsbCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMC41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJ2JsYWNrJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1sYXllciddID0gJ3RvcCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydtYXJraW5nJ10gPT09ICdzcG9ydCcgJiYgKCF0YWdzLmhhc093blByb3BlcnR5KCdjb2xvdXInKSkgJiYgKCF0YWdzLmhhc093blByb3BlcnR5KCdjb2xvcicpKSkpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2EwYTBhMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE2O1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbGF5ZXInXSA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snbWFya2luZyddID09PSAnc3BvcnQnICYmIHRhZ3NbJ2NvbG91ciddID09PSAnd2hpdGUnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydtYXJraW5nJ10gPT09ICdzcG9ydCcgJiYgdGFnc1snY29sb3InXSA9PT0gJ3doaXRlJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJ3doaXRlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1sYXllciddID0gJ3RvcCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydtYXJraW5nJ10gPT09ICdzcG9ydCcgJiYgdGFnc1snY29sb3VyJ10gPT09ICdyZWQnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydtYXJraW5nJ10gPT09ICdzcG9ydCcgJiYgdGFnc1snY29sb3InXSA9PT0gJ3JlZCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjYzAwMDAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1sYXllciddID0gJ3RvcCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydtYXJraW5nJ10gPT09ICdzcG9ydCcgJiYgdGFnc1snY29sb3VyJ10gPT09ICdibGFjaycpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ21hcmtpbmcnXSA9PT0gJ3Nwb3J0JyAmJiB0YWdzWydjb2xvciddID09PSAnYmxhY2snKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnYmxhY2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxNjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnLXgtbWFwbmlrLWxheWVyJ10gPSAndG9wJztcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ25vZGUnICYmIHRhZ3NbJ2FtZW5pdHknXSA9PT0gJ3BsYWNlX29mX3dvcnNoaXAnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM2MjNmMDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTZXJpZiBJdGFsaWMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb2Zmc2V0J10gPSAzO1xuICAgICAgICAgICAgc19kZWZhdWx0WydtYXgtd2lkdGgnXSA9IDcwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydhbWVuaXR5J10gPT09ICdwbGFjZV9vZl93b3JzaGlwJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNjIzZjAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2VyaWYgSXRhbGljJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnbWF4LXdpZHRoJ10gPSA3MDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzExMTExMSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb3BhY2l0eSddID0gJzEnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnIzc3Nzc3Nyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMC41O1xuICAgICAgICB9XG5cbiAgICAgXG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydib3VuZGFyeSddID09PSAnYWRtaW5pc3RyYXRpdmUnICYmIHRhZ3NbJ2FkbWluX2xldmVsJ10gPT09ICcyJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzIwMjAyMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Rhc2hlcyddID0gWzYsIDRdO1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAwLjc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE2O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydib3VuZGFyeSddID09PSAnYWRtaW5pc3RyYXRpdmUnICYmIHRhZ3NbJ2FkbWluX2xldmVsJ10gPT09ICczJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjM7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZmOTljYyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ29wYWNpdHknXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTY7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2JvdW5kYXJ5J10gPT09ICdhZG1pbmlzdHJhdGl2ZScgJiYgdGFnc1snYWRtaW5fbGV2ZWwnXSA9PT0gJzYnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjMTAxMDEwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZGFzaGVzJ10gPSBbMSwgMl07XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ29wYWNpdHknXSA9IDAuNjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTYuMTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydib3VuZGFyeSddID09PSAnYWRtaW5pc3RyYXRpdmUnICYmIHRhZ3NbJ2FkbWluX2xldmVsJ10gPT09ICc0JykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzAwMDAwMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Rhc2hlcyddID0gWzEsIDJdO1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAwLjg7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE2LjM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydyYWlsd2F5J10gPT09ICd0cmFtJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE3O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ25vZGUnICYmIHRhZ3NbJ3JhaWx3YXknXSA9PT0gJ3N0YXRpb24nICYmIHRhZ3NbJ3RyYW5zcG9ydCddICE9PSAnc3Vid2F5JykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb2Zmc2V0J10gPSA3O1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBNb25vIEJvb2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzAwMGQ2Yyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWFsbG93LW92ZXJsYXAnXSA9ICdmYWxzZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1taW4tZGlzdGFuY2UnXSA9ICcwJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICdub2RlJyAmJiB0YWdzWydyYWlsd2F5J10gPT09ICdzdWJ3YXlfZW50cmFuY2UnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1sncmFpbHdheSddID09PSAnc3Vid2F5X2VudHJhbmNlJyAmJiAodGFncy5oYXNPd25Qcm9wZXJ0eSgnbmFtZScpKSkpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb2Zmc2V0J10gPSAxMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDI7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjMTMwMGJiJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtYWxsb3ctb3ZlcmxhcCddID0gJ2ZhbHNlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnLXgtbWFwbmlrLW1pbi1kaXN0YW5jZSddID0gJzAnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ25vZGUnICYmIHRhZ3NbJ2Flcm93YXknXSA9PT0gJ2Flcm9kcm9tZScpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMTI7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIENvbmRlbnNlZCBCb2xkJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyMxZTdjYTUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1hbGxvdy1vdmVybGFwJ10gPSAnZmFsc2UnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxNztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ25vZGUnICYmIHRhZ3NbJ3BsYWNlJ10gPT09ICd0b3duJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzgwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb29rJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyMxMDEwMTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9wYWNpdHknXSA9ICcwLjInO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWFsbG93LW92ZXJsYXAnXSA9ICd0cnVlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMjA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1sncGxhY2UnXSA9PT0gJ2NpdHknKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnMTAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb29rJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyMxMDEwMTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9wYWNpdHknXSA9ICcwLjMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWFsbG93LW92ZXJsYXAnXSA9ICd0cnVlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMjA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1sncGxhY2UnXSA9PT0gJ3ZpbGxhZ2UnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1vZmZzZXQnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIEJvb2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzYwNjA2MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWFsbG93LW92ZXJsYXAnXSA9ICdmYWxzZSc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1sncGxhY2UnXSA9PT0gJ2hhbWxldCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNTA1MDUwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtYWxsb3ctb3ZlcmxhcCddID0gJ2ZhbHNlJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbGFuZHVzZSddID09PSAnbmF0dXJlX3Jlc2VydmUnKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xlaXN1cmUnXSA9PT0gJ3BhcmsnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1vZmZzZXQnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzEwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2VyaWYgSXRhbGljJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyMzYzgwMDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1hbGxvdy1vdmVybGFwJ10gPSAnZmFsc2UnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snd2F0ZXJ3YXknXSA9PT0gJ3N0cmVhbScpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ3dhdGVyd2F5J10gPT09ICdyaXZlcicpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ3dhdGVyd2F5J10gPT09ICdjYW5hbCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBPYmxpcXVlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM1NDdiZDEnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ25vZGUnICYmIHRhZ3NbJ3BsYWNlJ10gPT09ICdvY2VhbicpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnMTEnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIE9ibGlxdWUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzIwMjAyMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAtMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnLXgtbWFwbmlrLW1pbi1kaXN0YW5jZSddID0gJzAnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1sncGxhY2UnXSA9PT0gJ3NlYScpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnMTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIE9ibGlxdWUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQ5NzZkMSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbWluLWRpc3RhbmNlJ10gPSAnMCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1snbmF0dXJhbCddID09PSAncGVhaycpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnNyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgTW9ubyBCb29rJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM2NjQyMjknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnLXgtbWFwbmlrLW1pbi1kaXN0YW5jZSddID0gJzAnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydib3VuZGFyeSddID09PSAnYWRtaW5pc3RyYXRpdmUnICYmIHRhZ3NbJ2FkbWluX2xldmVsJ10gPT09ICc2JykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb2Zmc2V0J10gPSAtMTA7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzEyJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBFeHRyYUxpZ2h0JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM3ODQ4YTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICdub2RlJyAmJiB0YWdzWydwbGFjZSddID09PSAnc3VidXJiJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzEyJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBFeHRyYUxpZ2h0JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM3ODQ4YTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAyMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgKHRhZ3MuaGFzT3duUHJvcGVydHkoJ2J1aWxkaW5nJykpKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjY2NhMzUyJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmICh0YWdzLmhhc093blByb3BlcnR5KCdidWlsZGluZycpKSkgJiYgem9vbSA+PSAxOSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ2FkZHI6aG91c2VudW1iZXInKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2NlbnRlcic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzgnO1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbWluLWRpc3RhbmNlJ10gPSAnMTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAwLjg7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1snaGlnaHdheSddID09PSAnbWlsZXN0b25lJyAmJiAodGFncy5oYXNPd25Qcm9wZXJ0eSgncGsnKSkpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAncGsnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnNyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1taW4tZGlzdGFuY2UnXSA9ICcwJztcbiAgICAgICAgfVxuICAgICAgIFxuICAgICAgICBpZih0eXBlID09PSAnd2F5JyAmJiBzZWxlY3RvciA9PT0gJ2xpbmUnICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzAwMDAwMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjU7XG5cdFx0fVxuXHRcdFxuXHRcdGlmKHR5cGUgPT09ICd3YXknICYmIHNlbGVjdG9yID09PSAnbGluZScgJiYgdGFnc1snaGlnaHdheSddID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjMDAwMDAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDE7XG5cdFx0fVxuXHRcdFxuXHRcdGlmKHR5cGUgPT09ICd3YXknICYmIHNlbGVjdG9yID09PSAnbGluZScgJiYgdGFnc1snaGlnaHdheSddID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjMDAwMDAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEuNTtcblx0XHR9XG5cdFx0XG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhzX2RlZmF1bHQpLmxlbmd0aCkge1xuICAgICAgICAgICAgc3R5bGVbJ2RlZmF1bHQnXSA9IHNfZGVmYXVsdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoT2JqZWN0LmtleXMoc19jZW50ZXJsaW5lKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHN0eWxlWydjZW50ZXJsaW5lJ10gPSBzX2NlbnRlcmxpbmU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHNfdGlja3MpLmxlbmd0aCkge1xuICAgICAgICAgICAgc3R5bGVbJ3RpY2tzJ10gPSBzX3RpY2tzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhzX2xhYmVsKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHN0eWxlWydsYWJlbCddID0gc19sYWJlbDtcbiAgICAgICAgfVxuICAgICAgIFxuICAgICAgICByZXR1cm4gc3R5bGU7XG4gICAgfVxuXG59IiwiaW1wb3J0IE1hcENTUyBmcm9tIFwiLi9tYXBjc3NcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3R5bGUge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX2RlZmF1bHRDYW52YXNTdHlsZXMgPSB7XG4gICAgICAgICAgICBzdHJva2VTdHlsZTogJ3JnYmEoMCwwLDAsMC41KScsXG4gICAgICAgICAgICBmaWxsU3R5bGU6XG4gICAgICAgICAgICAgICAgJ3JnYmEoMCwwLDAsMC41KScsXG4gICAgICAgICAgICBsaW5lV2lkdGg6XG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgIGxpbmVDYXA6XG4gICAgICAgICAgICAgICAgJ3JvdW5kJyxcbiAgICAgICAgICAgIGxpbmVKb2luOlxuICAgICAgICAgICAgICAgICdyb3VuZCcsXG4gICAgICAgICAgICB0ZXh0QWxpZ246XG4gICAgICAgICAgICAgICAgJ2NlbnRlcicsXG4gICAgICAgICAgICB0ZXh0QmFzZWxpbmU6XG4gICAgICAgICAgICAgICAgJ21pZGRsZSdcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBkZWZhdWx0Q2FudmFzU3R5bGVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmYXVsdENhbnZhc1N0eWxlcztcbiAgICB9XG5cbiAgICBzdGF0aWMgcG9wdWxhdGVMYXllcnMoZmVhdHVyZXMsIHpvb20sIHN0eWxlcykge1xuICAgICAgICBsZXQgbGF5ZXJzID0ge30sXG4gICAgICAgICAgICBpLCBsZW4sIGZlYXR1cmUsIGxheWVySWQsIGxheWVyU3R5bGU7XG5cbiAgICAgICAgbGV0IHN0eWxlZEZlYXR1cmVzID0gU3R5bGUuc3R5bGVGZWF0dXJlcyhmZWF0dXJlcywgem9vbSwgc3R5bGVzKTtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBzdHlsZWRGZWF0dXJlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgZmVhdHVyZSA9IHN0eWxlZEZlYXR1cmVzW2ldO1xuICAgICAgICAgICAgbGF5ZXJTdHlsZSA9IGZlYXR1cmUuc3R5bGVbJy14LW1hcG5pay1sYXllciddO1xuICAgICAgICAgICAgbGF5ZXJJZCA9ICFsYXllclN0eWxlID8gZmVhdHVyZS5wcm9wZXJ0aWVzLmxheWVyIHx8IDEwMDAgOlxuICAgICAgICAgICAgICAgIGxheWVyU3R5bGUgPT09ICd0b3AnID8gMTAwMDAgOiBsYXllclN0eWxlO1xuXG4gICAgICAgICAgICBsYXllcnNbbGF5ZXJJZF0gPSBsYXllcnNbbGF5ZXJJZF0gfHwgW107XG4gICAgICAgICAgICBsYXllcnNbbGF5ZXJJZF0ucHVzaChmZWF0dXJlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsYXllcnM7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFN0eWxlKGZlYXR1cmUsIHpvb20sIHN0eWxlTmFtZXMpIHtcbiAgICAgICAgbGV0IHNoYXBlID0gZmVhdHVyZS50eXBlLFxuICAgICAgICAgICAgdHlwZSwgc2VsZWN0b3I7XG4gICAgICAgIGlmIChzaGFwZSA9PT0gJ0xpbmVTdHJpbmcnIHx8IHNoYXBlID09PSAnTXVsdGlMaW5lU3RyaW5nJykge1xuICAgICAgICAgICAgdHlwZSA9ICd3YXknO1xuICAgICAgICAgICAgc2VsZWN0b3IgPSAnbGluZSc7XG4gICAgICAgIH0gZWxzZSBpZiAoc2hhcGUgPT09ICdQb2x5Z29uJyB8fCBzaGFwZSA9PT0gJ011bHRpUG9seWdvbicpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnd2F5JztcbiAgICAgICAgICAgIHNlbGVjdG9yID0gJ2FyZWEnO1xuICAgICAgICB9IGVsc2UgaWYgKHNoYXBlID09PSAnUG9pbnQnIHx8IHNoYXBlID09PSAnTXVsdGlQb2ludCcpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnbm9kZSc7XG4gICAgICAgICAgICBzZWxlY3RvciA9ICdub2RlJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXBDU1Muc2hhcmVkLnJlc3R5bGUoc3R5bGVOYW1lcywgZmVhdHVyZS5wcm9wZXJ0aWVzLCB6b29tLCB0eXBlLCBzZWxlY3Rvcik7XG4gICAgfVxuXG4gICAgc3RhdGljIHN0eWxlRmVhdHVyZXMoZmVhdHVyZXMsIHpvb20sIHN0eWxlTmFtZXMpIHtcbiAgICAgICAgbGV0IHN0eWxlZEZlYXR1cmVzID0gW10sXG4gICAgICAgICAgICBpLCBqLCBsZW4sIGZlYXR1cmUsIHN0eWxlLCByZXN0eWxlZEZlYXR1cmUsIGs7XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gZmVhdHVyZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGZlYXR1cmUgPSBmZWF0dXJlc1tpXTtcbiAgICAgICAgICAgIHN0eWxlID0gU3R5bGUuZ2V0U3R5bGUoZmVhdHVyZSwgem9vbSwgc3R5bGVOYW1lcyk7XG4gICAgICAgICAgICBmb3IgKGogaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoaiA9PT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3R5bGVkRmVhdHVyZSA9IGZlYXR1cmU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdHlsZWRGZWF0dXJlID0ge307XG4gICAgICAgICAgICAgICAgICAgIGZvciAoayBpbiBmZWF0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0eWxlZEZlYXR1cmVba10gPSBmZWF0dXJlW2tdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzdHlsZWRGZWF0dXJlLmtvdGhpY0lkID0gaSArIDE7XG4gICAgICAgICAgICAgICAgcmVzdHlsZWRGZWF0dXJlLnN0eWxlID0gc3R5bGVbal07XG4gICAgICAgICAgICAgICAgcmVzdHlsZWRGZWF0dXJlLnpJbmRleCA9IHN0eWxlW2pdWyd6LWluZGV4J10gfHwgMDtcbiAgICAgICAgICAgICAgICByZXN0eWxlZEZlYXR1cmUuc29ydEtleSA9IHJlc3R5bGVkRmVhdHVyZS56SW5kZXg7XG5cbiAgICAgICAgICAgICAgICBzdHlsZWRGZWF0dXJlcy5wdXNoKHJlc3R5bGVkRmVhdHVyZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIHN0eWxlZEZlYXR1cmVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhLnpJbmRleCA8IGIuekluZGV4ID8gLTEgOlxuICAgICAgICAgICAgICAgIGEuekluZGV4ID4gYi56SW5kZXggPyAxIDogMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHN0eWxlZEZlYXR1cmVzO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRGb250U3RyaW5nKG5hbWUsIHNpemUsIHN0KSB7XG4gICAgICAgIG5hbWUgPSBuYW1lIHx8ICcnO1xuICAgICAgICBzaXplID0gc2l6ZSB8fCA5O1xuXG4gICAgICAgIGxldCBmYW1pbHkgPSBuYW1lID8gbmFtZSArICcsICcgOiAnJztcblxuICAgICAgICBuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGxldCBzdHlsZXMgPSBbXTtcbiAgICAgICAgaWYgKHN0Wydmb250LXN0eWxlJ10gPT09ICdpdGFsaWMnIHx8IHN0Wydmb250LXN0eWxlJ10gPT09ICdvYmxpcXVlJykge1xuICAgICAgICAgICAgc3R5bGVzLnB1c2goc3RbJ2ZvbnQtc3R5bGUnXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0Wydmb250LWxldGlhbnQnXSA9PT0gJ3NtYWxsLWNhcHMnKSB7XG4gICAgICAgICAgICBzdHlsZXMucHVzaChzdFsnZm9udC1sZXRpYW50J10pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdFsnZm9udC13ZWlnaHQnXSA9PT0gJ2JvbGQnKSB7XG4gICAgICAgICAgICBzdHlsZXMucHVzaChzdFsnZm9udC13ZWlnaHQnXSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdHlsZXMucHVzaChzaXplICsgJ3B4Jyk7XG5cbiAgICAgICAgaWYgKG5hbWUuaW5kZXhPZignc2VyaWYnKSAhPT0gLTEgJiYgbmFtZS5pbmRleE9mKCdzYW5zLXNlcmlmJykgPT09IC0xKSB7XG4gICAgICAgICAgICBmYW1pbHkgKz0gJ0dlb3JnaWEsIHNlcmlmJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZhbWlseSArPSAnXCJIZWx2ZXRpY2EgTmV1ZVwiLCBBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmJztcbiAgICAgICAgfVxuICAgICAgICBzdHlsZXMucHVzaChmYW1pbHkpO1xuXG4gICAgICAgIHJldHVybiBzdHlsZXMuam9pbignICcpO1xuICAgIH1cblxuICAgIHN0YXRpYyBzZXRTdHlsZXMoY3R4LCBzdHlsZXMpIHtcbiAgICAgICAgbGV0IGk7XG4gICAgICAgIGZvciAoaSBpbiBzdHlsZXMpIHtcbiAgICAgICAgICAgIGlmIChzdHlsZXMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBjdHhbaV0gPSBzdHlsZXNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59IiwiaW1wb3J0IHJidXNoIGZyb20gXCIuL3JidXNoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbGxpc2lvbkJ1ZmZlciB7XG4gICAgY29uc3RydWN0b3IoaGVpZ2h0LCB3aWR0aCkge1xuICAgICAgICB0aGlzLmJ1ZmZlciA9IG5ldyByYnVzaCgpO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIH1cblxuICAgIGFkZFBvaW50V0gocG9pbnQsIHcsIGgsIGQsIGlkKSB7XG4gICAgICAgIHRoaXMuYnVmZmVyLmluc2VydChDb2xsaXNpb25CdWZmZXIuZ2V0Qm94RnJvbVBvaW50KHBvaW50LCB3LCBoLCBkLCBpZCkpO1xuICAgIH1cblxuICAgIGFkZFBvaW50cyhwYXJhbXMpIHtcbiAgICAgICAgbGV0IHBvaW50cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gcGFyYW1zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBwb2ludHMucHVzaChDb2xsaXNpb25CdWZmZXIuZ2V0Qm94RnJvbVBvaW50LmFwcGx5KHRoaXMsIHBhcmFtc1tpXSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYnVmZmVyLmxvYWQocG9pbnRzKTtcbiAgICB9XG5cbiAgICBjaGVja0JveChiLCBpZCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5idWZmZXIuc2VhcmNoKGIpLFxuICAgICAgICAgICAgaSwgbGVuO1xuXG4gICAgICAgIGlmIChiWzBdIDwgMCB8fCBiWzFdIDwgMCB8fCBiWzJdID4gdGhpcy53aWR0aCB8fCBiWzNdID4gdGhpcy5oZWlnaHQpIHsgcmV0dXJuIHRydWU7IH1cblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZXN1bHQubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIC8vIGlmIGl0J3MgdGhlIHNhbWUgb2JqZWN0IChvbmx5IGRpZmZlcmVudCBzdHlsZXMpLCBkb24ndCBkZXRlY3QgY29sbGlzaW9uXG4gICAgICAgICAgICBpZiAoaWQgIT09IHJlc3VsdFtpXVs0XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcdC8vdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNoZWNrUG9pbnRXSChwb2ludCwgdywgaCwgaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hlY2tCb3goQ29sbGlzaW9uQnVmZmVyLmdldEJveEZyb21Qb2ludChwb2ludCwgdywgaCwgMCksIGlkKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0Qm94RnJvbVBvaW50KHBvaW50LCB3LCBoLCBkLCBpZCkge1xuICAgICAgICBsZXQgZHggPSB3IC8gMiArIGQsXG4gICAgICAgICAgICBkeSA9IGggLyAyICsgZDtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHBvaW50WzBdIC0gZHgsXG4gICAgICAgICAgICBwb2ludFsxXSAtIGR5LFxuICAgICAgICAgICAgcG9pbnRbMF0gKyBkeCxcbiAgICAgICAgICAgIHBvaW50WzFdICsgZHksXG4gICAgICAgICAgICBpZFxuICAgICAgICBdO1xuICAgIH1cbn1cbiIsIlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VvbSB7XG5cbiAgICBzdGF0aWMgdHJhbnNmb3JtUG9pbnQgKHBvaW50LCB3cywgaHMpIHtcblx0XHRyZXR1cm4gW3dzICogcG9pbnRbMF0sIGhzICogcG9pbnRbMV1dO1xuICAgIH1cblxuICAgIHN0YXRpYyB0cmFuc2Zvcm1Qb2ludHMgKHBvaW50cywgd3MsIGhzKSB7XG4gICAgICAgIGxldCB0cmFuc2Zvcm1lZCA9IFtdLCBpLCBsZW47XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHBvaW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKHBvaW50c1tpXSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0XHR0cmFuc2Zvcm1lZC5wdXNoKHRoaXMudHJhbnNmb3JtUG9pbnQocG9pbnRzW2ldLCB3cywgaHMpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJhbnNmb3JtZWQ7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFJlcHJQb2ludCAoZmVhdHVyZSkge1xuICAgICAgICBsZXQgcG9pbnQsIGxlbjtcbiAgICAgICAgc3dpdGNoIChmZWF0dXJlLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnUG9pbnQnOlxuICAgICAgICAgICAgcG9pbnQgPSBmZWF0dXJlLmNvb3JkaW5hdGVzO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1BvbHlnb24nOlxuICAgICAgICAgICAgcG9pbnQgPSBmZWF0dXJlLnJlcHJwb2ludDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdMaW5lU3RyaW5nJzpcbiAgICAgICAgICAgIGxlbiA9IEdlb20uZ2V0UG9seUxlbmd0aChmZWF0dXJlLmNvb3JkaW5hdGVzKTtcbiAgICAgICAgICAgIHBvaW50ID0gR2VvbS5nZXRBbmdsZUFuZENvb3Jkc0F0TGVuZ3RoKGZlYXR1cmUuY29vcmRpbmF0ZXMsIGxlbiAvIDIsIDApO1xuICAgICAgICAgICAgcG9pbnQgPSBbcG9pbnRbMV0sIHBvaW50WzJdXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdHZW9tZXRyeUNvbGxlY3Rpb24nOlxuICAgICAgICAgICAgLy9UT0RPOiBEaXNhc3NlbWJsZSBnZW9tZXRyeSBjb2xsZWN0aW9uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNhc2UgJ011bHRpUG9pbnQnOlxuXHRcdFx0Y29uc29sZS5sb2coJ011bHRpUG9pbnQnKTtcbiAgICAgICAgICAgIC8vVE9ETzogRGlzYXNzZW1ibGUgbXVsdGkgcG9pbnRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY2FzZSAnTXVsdGlQb2x5Z29uJzpcbiAgICAgICAgICAgIHBvaW50ID0gZmVhdHVyZS5yZXBycG9pbnQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnTXVsdGlMaW5lU3RyaW5nJzpcblx0XHRcdGNvbnNvbGUubG9nKCdNdWx0aUxpbmVTdHJpbmcnKTtcbiAgICAgICAgICAgIC8vVE9ETzogRGlzYXNzZW1ibGUgZ2VvbWV0cnkgY29sbGVjdGlvblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwb2ludDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UG9seUxlbmd0aCAocG9pbnRzKSB7XG4gICAgICAgIGxldCBwb2ludHNMZW4gPSBwb2ludHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGMsIHBjLCBpLFxuICAgICAgICAgICAgICAgIGR4LCBkeSxcbiAgICAgICAgICAgICAgICBsZW4gPSAwO1xuXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBwb2ludHNMZW47IGkrKykge1xuICAgICAgICAgICAgYyA9IHBvaW50c1tpXTtcbiAgICAgICAgICAgIHBjID0gcG9pbnRzW2kgLSAxXTtcbiAgICAgICAgICAgIGR4ID0gcGNbMF0gLSBjWzBdO1xuICAgICAgICAgICAgZHkgPSBwY1sxXSAtIGNbMV07XG4gICAgICAgICAgICBsZW4gKz0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGVuO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRBbmdsZUFuZENvb3Jkc0F0TGVuZ3RoIChwb2ludHMsIGRpc3QsIHdpZHRoKSB7XG4gICAgICAgIGxldCBwb2ludHNMZW4gPSBwb2ludHMubGVuZ3RoLFxuICAgICAgICAgICAgZHgsIGR5LCB4LCB5LFxuICAgICAgICAgICAgaSwgYywgcGMsXG4gICAgICAgICAgICBsZW4gPSAwLFxuICAgICAgICAgICAgc2VnTGVuID0gMCxcbiAgICAgICAgICAgIGFuZ2xlLCBwYXJ0TGVuLCBzYW1lc2VnID0gdHJ1ZSxcbiAgICAgICAgICAgIGdvdHh5ID0gZmFsc2U7XG5cbiAgICAgICAgd2lkdGggPSB3aWR0aCB8fCAwOyAvLyBieSBkZWZhdWx0IHdlIHRoaW5rIHRoYXQgYSBsZXR0ZXIgaXMgMCBweCB3aWRlXG5cbiAgICAgICAgZm9yIChpID0gMTsgaSA8IHBvaW50c0xlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZ290eHkpIHtcbiAgICAgICAgICAgICAgICBzYW1lc2VnID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGMgPSBwb2ludHNbaV07XG4gICAgICAgICAgICBwYyA9IHBvaW50c1tpIC0gMV07XG5cbiAgICAgICAgICAgIGR4ID0gY1swXSAtIHBjWzBdO1xuICAgICAgICAgICAgZHkgPSBjWzFdIC0gcGNbMV07XG4gICAgICAgICAgICBzZWdMZW4gPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXG4gICAgICAgICAgICBpZiAoIWdvdHh5ICYmIGxlbiArIHNlZ0xlbiA+PSBkaXN0KSB7XG4gICAgICAgICAgICAgICAgcGFydExlbiA9IGRpc3QgLSBsZW47XG4gICAgICAgICAgICAgICAgeCA9IHBjWzBdICsgZHggKiBwYXJ0TGVuIC8gc2VnTGVuO1xuICAgICAgICAgICAgICAgIHkgPSBwY1sxXSArIGR5ICogcGFydExlbiAvIHNlZ0xlbjtcblxuICAgICAgICAgICAgICAgIGdvdHh5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGdvdHh5ICYmIGxlbiArIHNlZ0xlbiA+PSBkaXN0ICsgd2lkdGgpIHtcbiAgICAgICAgICAgICAgICBwYXJ0TGVuID0gZGlzdCArIHdpZHRoIC0gbGVuO1xuICAgICAgICAgICAgICAgIGR4ID0gcGNbMF0gKyBkeCAqIHBhcnRMZW4gLyBzZWdMZW47XG4gICAgICAgICAgICAgICAgZHkgPSBwY1sxXSArIGR5ICogcGFydExlbiAvIHNlZ0xlbjtcbiAgICAgICAgICAgICAgICBhbmdsZSA9IE1hdGguYXRhbjIoZHkgLSB5LCBkeCAtIHgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNhbWVzZWcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFthbmdsZSwgeCwgeSwgc2VnTGVuIC0gcGFydExlbl07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFthbmdsZSwgeCwgeSwgMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZW4gKz0gc2VnTGVuO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4iLCIvKlxuIChjKSAyMDEzLCBWbGFkaW1pciBBZ2Fmb25raW5cbiBSQnVzaCwgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2gtcGVyZm9ybWFuY2UgMkQgc3BhdGlhbCBpbmRleGluZyBvZiBwb2ludHMgYW5kIHJlY3RhbmdsZXMuXG4gaHR0cHM6Ly9naXRodWIuY29tL21vdXJuZXIvcmJ1c2hcbiovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHJidXNoIHtcblxuICAgIGNvbnN0cnVjdG9yKG1heEVudHJpZXMsIGZvcm1hdCkge1xuXG4gICAgICAgIC8vIGpzaGludCBuZXdjYXA6IGZhbHNlLCB2YWxpZHRoaXM6IHRydWVcbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIHJidXNoKSkgcmV0dXJuIG5ldyByYnVzaChtYXhFbnRyaWVzLCBmb3JtYXQpO1xuXG4gICAgICAgIC8vIG1heCBlbnRyaWVzIGluIGEgbm9kZSBpcyA5IGJ5IGRlZmF1bHQ7IG1pbiBub2RlIGZpbGwgaXMgNDAlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgICAgIHRoaXMuX21heEVudHJpZXMgPSBNYXRoLm1heCg0LCBtYXhFbnRyaWVzIHx8IDkpO1xuICAgICAgICB0aGlzLl9taW5FbnRyaWVzID0gTWF0aC5tYXgoMiwgTWF0aC5jZWlsKHRoaXMuX21heEVudHJpZXMgKiAwLjQpKTtcblxuICAgICAgICBpZiAoZm9ybWF0KSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0Rm9ybWF0KGZvcm1hdCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgYWxsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWxsKHRoaXMuZGF0YSwgW10pO1xuICAgIH1cblxuICAgIHNlYXJjaChiYm94KSB7XG5cbiAgICAgICAgbGV0IG5vZGUgPSB0aGlzLmRhdGEsXG4gICAgICAgICAgICByZXN1bHQgPSBbXSxcbiAgICAgICAgICAgIHRvQkJveCA9IHRoaXMudG9CQm94O1xuXG4gICAgICAgIGlmICghdGhpcy5pbnRlcnNlY3RzKGJib3gsIG5vZGUuYmJveCkpIHJldHVybiByZXN1bHQ7XG5cbiAgICAgICAgbGV0IG5vZGVzVG9TZWFyY2ggPSBbXSxcbiAgICAgICAgICAgIGksIGxlbiwgY2hpbGQsIGNoaWxkQkJveDtcblxuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXG4gICAgICAgICAgICAgICAgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGNoaWxkQkJveCA9IG5vZGUubGVhZiA/IHRvQkJveChjaGlsZCkgOiBjaGlsZC5iYm94O1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaW50ZXJzZWN0cyhiYm94LCBjaGlsZEJCb3gpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmxlYWYpIHJlc3VsdC5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY29udGFpbnMoYmJveCwgY2hpbGRCQm94KSkgdGhpcy5fYWxsKGNoaWxkLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIG5vZGVzVG9TZWFyY2gucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZSA9IG5vZGVzVG9TZWFyY2gucG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGxvYWQoZGF0YSkge1xuICAgICAgICBpZiAoIShkYXRhICYmIGRhdGEubGVuZ3RoKSkgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgaWYgKGRhdGEubGVuZ3RoIDwgdGhpcy5fbWluRW50cmllcykge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluc2VydChkYXRhW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVjdXJzaXZlbHkgYnVpbGQgdGhlIHRyZWUgd2l0aCB0aGUgZ2l2ZW4gZGF0YSBmcm9tIHN0cmF0Y2ggdXNpbmcgT01UIGFsZ29yaXRobVxuICAgICAgICBsZXQgbm9kZSA9IHRoaXMuX2J1aWxkKGRhdGEuc2xpY2UoKSwgMCwgZGF0YS5sZW5ndGggLSAxLCAwKTtcblxuICAgICAgICBpZiAoIXRoaXMuZGF0YS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIHNhdmUgYXMgaXMgaWYgdHJlZSBpcyBlbXB0eVxuICAgICAgICAgICAgdGhpcy5kYXRhID0gbm9kZTtcblxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZGF0YS5oZWlnaHQgPT09IG5vZGUuaGVpZ2h0KSB7XG4gICAgICAgICAgICAvLyBzcGxpdCByb290IGlmIHRyZWVzIGhhdmUgdGhlIHNhbWUgaGVpZ2h0XG4gICAgICAgICAgICB0aGlzLl9zcGxpdFJvb3QodGhpcy5kYXRhLCBub2RlKTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YS5oZWlnaHQgPCBub2RlLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIC8vIHN3YXAgdHJlZXMgaWYgaW5zZXJ0ZWQgb25lIGlzIGJpZ2dlclxuICAgICAgICAgICAgICAgIGxldCB0bXBOb2RlID0gdGhpcy5kYXRhO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YSA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbm9kZSA9IHRtcE5vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGluc2VydCB0aGUgc21hbGwgdHJlZSBpbnRvIHRoZSBsYXJnZSB0cmVlIGF0IGFwcHJvcHJpYXRlIGxldmVsXG4gICAgICAgICAgICB0aGlzLl9pbnNlcnQobm9kZSwgdGhpcy5kYXRhLmhlaWdodCAtIG5vZGUuaGVpZ2h0IC0gMSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpbnNlcnQoaXRlbSkge1xuICAgICAgICBpZiAoaXRlbSkgdGhpcy5faW5zZXJ0KGl0ZW0sIHRoaXMuZGF0YS5oZWlnaHQgLSAxKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IHtcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbXSxcbiAgICAgICAgICAgIGhlaWdodDogMSxcbiAgICAgICAgICAgIGJib3g6IHRoaXMuZW1wdHkoKSxcbiAgICAgICAgICAgIGxlYWY6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmVtb3ZlKGl0ZW0pIHtcbiAgICAgICAgaWYgKCFpdGVtKSByZXR1cm4gdGhpcztcblxuICAgICAgICBsZXQgbm9kZSA9IHRoaXMuZGF0YSxcbiAgICAgICAgICAgIGJib3ggPSB0aGlzLnRvQkJveChpdGVtKSxcbiAgICAgICAgICAgIHBhdGggPSBbXSxcbiAgICAgICAgICAgIGluZGV4ZXMgPSBbXSxcbiAgICAgICAgICAgIGksIHBhcmVudCwgaW5kZXgsIGdvaW5nVXA7XG5cbiAgICAgICAgLy8gZGVwdGgtZmlyc3QgaXRlcmF0aXZlIHRyZWUgdHJhdmVyc2FsXG4gICAgICAgIHdoaWxlIChub2RlIHx8IHBhdGgubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgIGlmICghbm9kZSkgeyAvLyBnbyB1cFxuICAgICAgICAgICAgICAgIG5vZGUgPSBwYXRoLnBvcCgpO1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICBpID0gaW5kZXhlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICBnb2luZ1VwID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5vZGUubGVhZikgeyAvLyBjaGVjayBjdXJyZW50IG5vZGVcbiAgICAgICAgICAgICAgICBpbmRleCA9IG5vZGUuY2hpbGRyZW4uaW5kZXhPZihpdGVtKTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaXRlbSBmb3VuZCwgcmVtb3ZlIHRoZSBpdGVtIGFuZCBjb25kZW5zZSB0cmVlIHVwd2FyZHNcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICBwYXRoLnB1c2gobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbmRlbnNlKHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZ29pbmdVcCAmJiAhbm9kZS5sZWFmICYmIGNvbnRhaW5zKG5vZGUuYmJveCwgYmJveCkpIHsgLy8gZ28gZG93blxuICAgICAgICAgICAgICAgIHBhdGgucHVzaChub2RlKTtcbiAgICAgICAgICAgICAgICBpbmRleGVzLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gbm9kZTtcbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJlbnQpIHsgLy8gZ28gcmlnaHRcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgbm9kZSA9IHBhcmVudC5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBnb2luZ1VwID0gZmFsc2U7XG5cbiAgICAgICAgICAgIH0gZWxzZSBub2RlID0gbnVsbDsgLy8gbm90aGluZyBmb3VuZFxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdG9CQm94KGl0ZW0pIHsgcmV0dXJuIGl0ZW07IH1cblxuICAgIGNvbXBhcmVNaW5YKGEsIGIpIHsgcmV0dXJuIGFbMF0gLSBiWzBdOyB9XG4gICAgY29tcGFyZU1pblkoYSwgYikgeyByZXR1cm4gYVsxXSAtIGJbMV07IH1cblxuICAgIHRvSlNPTigpIHsgcmV0dXJuIHRoaXMuZGF0YTsgfVxuXG4gICAgZnJvbUpTT04oZGF0YSkge1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBfYWxsKG5vZGUsIHJlc3VsdCkge1xuICAgICAgICBsZXQgbm9kZXNUb1NlYXJjaCA9IFtdO1xuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgaWYgKG5vZGUubGVhZikgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBub2RlLmNoaWxkcmVuKTtcbiAgICAgICAgICAgIGVsc2Ugbm9kZXNUb1NlYXJjaC5wdXNoLmFwcGx5KG5vZGVzVG9TZWFyY2gsIG5vZGUuY2hpbGRyZW4pO1xuXG4gICAgICAgICAgICBub2RlID0gbm9kZXNUb1NlYXJjaC5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIF9idWlsZChpdGVtcywgbGVmdCwgcmlnaHQsIGhlaWdodCkge1xuXG4gICAgICAgIGxldCBOID0gcmlnaHQgLSBsZWZ0ICsgMSxcbiAgICAgICAgICAgIE0gPSB0aGlzLl9tYXhFbnRyaWVzLFxuICAgICAgICAgICAgbm9kZTtcblxuICAgICAgICBpZiAoTiA8PSBNKSB7XG4gICAgICAgICAgICAvLyByZWFjaGVkIGxlYWYgbGV2ZWw7IHJldHVybiBsZWFmXG4gICAgICAgICAgICBub2RlID0ge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBpdGVtcy5zbGljZShsZWZ0LCByaWdodCArIDEpLFxuICAgICAgICAgICAgICAgIGhlaWdodDogMSxcbiAgICAgICAgICAgICAgICBiYm94OiBudWxsLFxuICAgICAgICAgICAgICAgIGxlYWY6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmNhbGNCQm94KG5vZGUsIHRoaXMudG9CQm94KTtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFoZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIHRhcmdldCBoZWlnaHQgb2YgdGhlIGJ1bGstbG9hZGVkIHRyZWVcbiAgICAgICAgICAgIGhlaWdodCA9IE1hdGguY2VpbChNYXRoLmxvZyhOKSAvIE1hdGgubG9nKE0pKTtcblxuICAgICAgICAgICAgLy8gdGFyZ2V0IG51bWJlciBvZiByb290IGVudHJpZXMgdG8gbWF4aW1pemUgc3RvcmFnZSB1dGlsaXphdGlvblxuICAgICAgICAgICAgTSA9IE1hdGguY2VpbChOIC8gTWF0aC5wb3coTSwgaGVpZ2h0IC0gMSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETyBlbGltaW5hdGUgcmVjdXJzaW9uP1xuXG4gICAgICAgIG5vZGUgPSB7XG4gICAgICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGJib3g6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzcGxpdCB0aGUgaXRlbXMgaW50byBNIG1vc3RseSBzcXVhcmUgdGlsZXNcblxuICAgICAgICBsZXQgTjIgPSBNYXRoLmNlaWwoTiAvIE0pLFxuICAgICAgICAgICAgTjEgPSBOMiAqIE1hdGguY2VpbChNYXRoLnNxcnQoTSkpLFxuICAgICAgICAgICAgaSwgaiwgcmlnaHQyLCByaWdodDM7XG5cbiAgICAgICAgdGhpcy5tdWx0aVNlbGVjdChpdGVtcywgbGVmdCwgcmlnaHQsIE4xLCB0aGlzLmNvbXBhcmVNaW5YKTtcblxuICAgICAgICBmb3IgKGkgPSBsZWZ0OyBpIDw9IHJpZ2h0OyBpICs9IE4xKSB7XG5cbiAgICAgICAgICAgIHJpZ2h0MiA9IE1hdGgubWluKGkgKyBOMSAtIDEsIHJpZ2h0KTtcblxuICAgICAgICAgICAgdGhpcy5tdWx0aVNlbGVjdChpdGVtcywgaSwgcmlnaHQyLCBOMiwgdGhpcy5jb21wYXJlTWluWSk7XG5cbiAgICAgICAgICAgIGZvciAoaiA9IGk7IGogPD0gcmlnaHQyOyBqICs9IE4yKSB7XG5cbiAgICAgICAgICAgICAgICByaWdodDMgPSBNYXRoLm1pbihqICsgTjIgLSAxLCByaWdodDIpO1xuXG4gICAgICAgICAgICAgICAgLy8gcGFjayBlYWNoIGVudHJ5IHJlY3Vyc2l2ZWx5XG4gICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5wdXNoKHRoaXMuX2J1aWxkKGl0ZW1zLCBqLCByaWdodDMsIGhlaWdodCAtIDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsY0JCb3gobm9kZSwgdGhpcy50b0JCb3gpO1xuXG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIF9jaG9vc2VTdWJ0cmVlKGJib3gsIG5vZGUsIGxldmVsLCBwYXRoKSB7XG5cbiAgICAgICAgbGV0IGksIGxlbiwgY2hpbGQsIHRhcmdldE5vZGUsIGFyZWEsIGVubGFyZ2VtZW50LCBtaW5BcmVhLCBtaW5FbmxhcmdlbWVudDtcblxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgcGF0aC5wdXNoKG5vZGUpO1xuXG4gICAgICAgICAgICBpZiAobm9kZS5sZWFmIHx8IHBhdGgubGVuZ3RoIC0gMSA9PT0gbGV2ZWwpIGJyZWFrO1xuXG4gICAgICAgICAgICBtaW5BcmVhID0gbWluRW5sYXJnZW1lbnQgPSBJbmZpbml0eTtcblxuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGNoaWxkID0gbm9kZS5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBhcmVhID0gdGhpcy5iYm94QXJlYShjaGlsZC5iYm94KTtcbiAgICAgICAgICAgICAgICBlbmxhcmdlbWVudCA9IHRoaXMuZW5sYXJnZWRBcmVhKGJib3gsIGNoaWxkLmJib3gpIC0gYXJlYTtcblxuICAgICAgICAgICAgICAgIC8vIGNob29zZSBlbnRyeSB3aXRoIHRoZSBsZWFzdCBhcmVhIGVubGFyZ2VtZW50XG4gICAgICAgICAgICAgICAgaWYgKGVubGFyZ2VtZW50IDwgbWluRW5sYXJnZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWluRW5sYXJnZW1lbnQgPSBlbmxhcmdlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgbWluQXJlYSA9IGFyZWEgPCBtaW5BcmVhID8gYXJlYSA6IG1pbkFyZWE7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUgPSBjaGlsZDtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZW5sYXJnZW1lbnQgPT09IG1pbkVubGFyZ2VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBjaG9vc2Ugb25lIHdpdGggdGhlIHNtYWxsZXN0IGFyZWFcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZWEgPCBtaW5BcmVhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5BcmVhID0gYXJlYTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUgPSBjaGlsZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZSA9IHRhcmdldE5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICBfaW5zZXJ0KGl0ZW0sIGxldmVsLCBpc05vZGUpIHtcblxuICAgICAgICBsZXQgdG9CQm94ID0gdGhpcy50b0JCb3gsXG4gICAgICAgICAgICBiYm94ID0gaXNOb2RlID8gaXRlbS5iYm94IDogdG9CQm94KGl0ZW0pLFxuICAgICAgICAgICAgaW5zZXJ0UGF0aCA9IFtdO1xuXG4gICAgICAgIC8vIGZpbmQgdGhlIGJlc3Qgbm9kZSBmb3IgYWNjb21tb2RhdGluZyB0aGUgaXRlbSwgc2F2aW5nIGFsbCBub2RlcyBhbG9uZyB0aGUgcGF0aCB0b29cbiAgICAgICAgbGV0IG5vZGUgPSB0aGlzLl9jaG9vc2VTdWJ0cmVlKGJib3gsIHRoaXMuZGF0YSwgbGV2ZWwsIGluc2VydFBhdGgpO1xuXG4gICAgICAgIC8vIHB1dCB0aGUgaXRlbSBpbnRvIHRoZSBub2RlXG4gICAgICAgIG5vZGUuY2hpbGRyZW4ucHVzaChpdGVtKTtcbiAgICAgICAgdGhpcy5leHRlbmQobm9kZS5iYm94LCBiYm94KTtcblxuICAgICAgICAvLyBzcGxpdCBvbiBub2RlIG92ZXJmbG93OyBwcm9wYWdhdGUgdXB3YXJkcyBpZiBuZWNlc3NhcnlcbiAgICAgICAgd2hpbGUgKGxldmVsID49IDApIHtcbiAgICAgICAgICAgIGlmIChpbnNlcnRQYXRoW2xldmVsXS5jaGlsZHJlbi5sZW5ndGggPiB0aGlzLl9tYXhFbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3BsaXQoaW5zZXJ0UGF0aCwgbGV2ZWwpO1xuICAgICAgICAgICAgICAgIGxldmVsLS07XG4gICAgICAgICAgICB9IGVsc2UgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGp1c3QgYmJveGVzIGFsb25nIHRoZSBpbnNlcnRpb24gcGF0aFxuICAgICAgICB0aGlzLl9hZGp1c3RQYXJlbnRCQm94ZXMoYmJveCwgaW5zZXJ0UGF0aCwgbGV2ZWwpO1xuICAgIH1cblxuICAgIC8vIHNwbGl0IG92ZXJmbG93ZWQgbm9kZSBpbnRvIHR3b1xuICAgIF9zcGxpdChpbnNlcnRQYXRoLCBsZXZlbCkge1xuXG4gICAgICAgIGxldCBub2RlID0gaW5zZXJ0UGF0aFtsZXZlbF0sXG4gICAgICAgICAgICBNID0gbm9kZS5jaGlsZHJlbi5sZW5ndGgsXG4gICAgICAgICAgICBtID0gdGhpcy5fbWluRW50cmllcztcblxuICAgICAgICB0aGlzLl9jaG9vc2VTcGxpdEF4aXMobm9kZSwgbSwgTSk7XG5cbiAgICAgICAgbGV0IG5ld05vZGUgPSB7XG4gICAgICAgICAgICBjaGlsZHJlbjogbm9kZS5jaGlsZHJlbi5zcGxpY2UodGhpcy5fY2hvb3NlU3BsaXRJbmRleChub2RlLCBtLCBNKSksXG4gICAgICAgICAgICBoZWlnaHQ6IG5vZGUuaGVpZ2h0XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKG5vZGUubGVhZikgbmV3Tm9kZS5sZWFmID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLmNhbGNCQm94KG5vZGUsIHRoaXMudG9CQm94KTtcbiAgICAgICAgdGhpcy5jYWxjQkJveChuZXdOb2RlLCB0aGlzLnRvQkJveCk7XG5cbiAgICAgICAgaWYgKGxldmVsKSBpbnNlcnRQYXRoW2xldmVsIC0gMV0uY2hpbGRyZW4ucHVzaChuZXdOb2RlKTtcbiAgICAgICAgZWxzZSB0aGlzLl9zcGxpdFJvb3Qobm9kZSwgbmV3Tm9kZSk7XG4gICAgfVxuXG4gICAgX3NwbGl0Um9vdChub2RlLCBuZXdOb2RlKSB7XG4gICAgICAgIC8vIHNwbGl0IHJvb3Qgbm9kZVxuICAgICAgICB0aGlzLmRhdGEgPSB7XG4gICAgICAgICAgICBjaGlsZHJlbjogW25vZGUsIG5ld05vZGVdLFxuICAgICAgICAgICAgaGVpZ2h0OiBub2RlLmhlaWdodCArIDFcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jYWxjQkJveCh0aGlzLmRhdGEsIHRoaXMudG9CQm94KTtcbiAgICB9XG5cbiAgICBfY2hvb3NlU3BsaXRJbmRleChub2RlLCBtLCBNKSB7XG5cbiAgICAgICAgbGV0IGksIGJib3gxLCBiYm94Miwgb3ZlcmxhcCwgYXJlYSwgbWluT3ZlcmxhcCwgbWluQXJlYSwgaW5kZXg7XG5cbiAgICAgICAgbWluT3ZlcmxhcCA9IG1pbkFyZWEgPSBJbmZpbml0eTtcblxuICAgICAgICBmb3IgKGkgPSBtOyBpIDw9IE0gLSBtOyBpKyspIHtcbiAgICAgICAgICAgIGJib3gxID0gdGhpcy5kaXN0QkJveChub2RlLCAwLCBpLCB0aGlzLnRvQkJveCk7XG4gICAgICAgICAgICBiYm94MiA9IHRoaXMuZGlzdEJCb3gobm9kZSwgaSwgTSwgdGhpcy50b0JCb3gpO1xuXG4gICAgICAgICAgICBvdmVybGFwID0gdGhpcy5pbnRlcnNlY3Rpb25BcmVhKGJib3gxLCBiYm94Mik7XG4gICAgICAgICAgICBhcmVhID0gdGhpcy5iYm94QXJlYShiYm94MSkgKyB0aGlzLmJib3hBcmVhKGJib3gyKTtcblxuICAgICAgICAgICAgLy8gY2hvb3NlIGRpc3RyaWJ1dGlvbiB3aXRoIG1pbmltdW0gb3ZlcmxhcFxuICAgICAgICAgICAgaWYgKG92ZXJsYXAgPCBtaW5PdmVybGFwKSB7XG4gICAgICAgICAgICAgICAgbWluT3ZlcmxhcCA9IG92ZXJsYXA7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuXG4gICAgICAgICAgICAgICAgbWluQXJlYSA9IGFyZWEgPCBtaW5BcmVhID8gYXJlYSA6IG1pbkFyZWE7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3ZlcmxhcCA9PT0gbWluT3ZlcmxhcCkge1xuICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBjaG9vc2UgZGlzdHJpYnV0aW9uIHdpdGggbWluaW11bSBhcmVhXG4gICAgICAgICAgICAgICAgaWYgKGFyZWEgPCBtaW5BcmVhKSB7XG4gICAgICAgICAgICAgICAgICAgIG1pbkFyZWEgPSBhcmVhO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cblxuICAgIC8vIHNvcnRzIG5vZGUgY2hpbGRyZW4gYnkgdGhlIGJlc3QgYXhpcyBmb3Igc3BsaXRcbiAgICBfY2hvb3NlU3BsaXRBeGlzKG5vZGUsIG0sIE0pIHtcblxuICAgICAgICBsZXQgY29tcGFyZU1pblggPSBub2RlLmxlYWYgPyB0aGlzLmNvbXBhcmVNaW5YIDogdGhpcy5jb21wYXJlTm9kZU1pblgsXG4gICAgICAgICAgICBjb21wYXJlTWluWSA9IG5vZGUubGVhZiA/IHRoaXMuY29tcGFyZU1pblkgOiB0aGlzLmNvbXBhcmVOb2RlTWluWSxcbiAgICAgICAgICAgIHhNYXJnaW4gPSB0aGlzLl9hbGxEaXN0TWFyZ2luKG5vZGUsIG0sIE0sIGNvbXBhcmVNaW5YKSxcbiAgICAgICAgICAgIHlNYXJnaW4gPSB0aGlzLl9hbGxEaXN0TWFyZ2luKG5vZGUsIG0sIE0sIGNvbXBhcmVNaW5ZKTtcblxuICAgICAgICAvLyBpZiB0b3RhbCBkaXN0cmlidXRpb25zIG1hcmdpbiB2YWx1ZSBpcyBtaW5pbWFsIGZvciB4LCBzb3J0IGJ5IG1pblgsXG4gICAgICAgIC8vIG90aGVyd2lzZSBpdCdzIGFscmVhZHkgc29ydGVkIGJ5IG1pbllcbiAgICAgICAgaWYgKHhNYXJnaW4gPCB5TWFyZ2luKSBub2RlLmNoaWxkcmVuLnNvcnQoY29tcGFyZU1pblgpO1xuICAgIH1cblxuICAgIC8vIHRvdGFsIG1hcmdpbiBvZiBhbGwgcG9zc2libGUgc3BsaXQgZGlzdHJpYnV0aW9ucyB3aGVyZSBlYWNoIG5vZGUgaXMgYXQgbGVhc3QgbSBmdWxsXG4gICAgX2FsbERpc3RNYXJnaW4obm9kZSwgbSwgTSwgY29tcGFyZSkge1xuXG4gICAgICAgIG5vZGUuY2hpbGRyZW4uc29ydChjb21wYXJlKTtcblxuICAgICAgICBsZXQgdG9CQm94ID0gdGhpcy50b0JCb3gsXG4gICAgICAgICAgICBsZWZ0QkJveCA9IHRoaXMuZGlzdEJCb3gobm9kZSwgMCwgbSwgdG9CQm94KSxcbiAgICAgICAgICAgIHJpZ2h0QkJveCA9IHRoaXMuZGlzdEJCb3gobm9kZSwgTSAtIG0sIE0sIHRvQkJveCksXG4gICAgICAgICAgICBtYXJnaW4gPSB0aGlzLmJib3hNYXJnaW4obGVmdEJCb3gpICsgdGhpcy5iYm94TWFyZ2luKHJpZ2h0QkJveCksXG4gICAgICAgICAgICBpLCBjaGlsZDtcblxuICAgICAgICBmb3IgKGkgPSBtOyBpIDwgTSAtIG07IGkrKykge1xuICAgICAgICAgICAgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgdGhpcy5leHRlbmQobGVmdEJCb3gsIG5vZGUubGVhZiA/IHRvQkJveChjaGlsZCkgOiBjaGlsZC5iYm94KTtcbiAgICAgICAgICAgIG1hcmdpbiArPSB0aGlzLmJib3hNYXJnaW4obGVmdEJCb3gpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gTSAtIG0gLSAxOyBpID49IG07IGktLSkge1xuICAgICAgICAgICAgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgdGhpcy5leHRlbmQocmlnaHRCQm94LCBub2RlLmxlYWYgPyB0b0JCb3goY2hpbGQpIDogY2hpbGQuYmJveCk7XG4gICAgICAgICAgICBtYXJnaW4gKz0gdGhpcy5iYm94TWFyZ2luKHJpZ2h0QkJveCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWFyZ2luO1xuICAgIH1cblxuICAgIF9hZGp1c3RQYXJlbnRCQm94ZXMoYmJveCwgcGF0aCwgbGV2ZWwpIHtcbiAgICAgICAgLy8gYWRqdXN0IGJib3hlcyBhbG9uZyB0aGUgZ2l2ZW4gdHJlZSBwYXRoXG4gICAgICAgIGZvciAobGV0IGkgPSBsZXZlbDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5kKHBhdGhbaV0uYmJveCwgYmJveCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfY29uZGVuc2UocGF0aCkge1xuICAgICAgICAvLyBnbyB0aHJvdWdoIHRoZSBwYXRoLCByZW1vdmluZyBlbXB0eSBub2RlcyBhbmQgdXBkYXRpbmcgYmJveGVzXG4gICAgICAgIGZvciAobGV0IGkgPSBwYXRoLmxlbmd0aCAtIDEsIHNpYmxpbmdzOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKHBhdGhbaV0uY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzID0gcGF0aFtpIC0gMV0uY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzLnNwbGljZShzaWJsaW5ncy5pbmRleE9mKHBhdGhbaV0pLCAxKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB0aGlzLmNsZWFyKCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB0aGlzLmNhbGNCQm94KHBhdGhbaV0sIHRoaXMudG9CQm94KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9pbml0Rm9ybWF0KGZvcm1hdCkge1xuICAgICAgICAvLyBkYXRhIGZvcm1hdCAobWluWCwgbWluWSwgbWF4WCwgbWF4WSBhY2Nlc3NvcnMpXG5cbiAgICAgICAgLy8gdXNlcyBldmFsLXR5cGUgY29tcGlsYXRpb24gaW5zdGVhZCBvZiBqdXN0IGFjY2VwdGluZyBhIHRvQkJveCBmdW5jdGlvblxuICAgICAgICAvLyBiZWNhdXNlIHRoZSBhbGdvcml0aG1zIGFyZSB2ZXJ5IHNlbnNpdGl2ZSB0byBzb3J0aW5nIGZ1bmN0aW9ucyBwZXJmb3JtYW5jZSxcbiAgICAgICAgLy8gc28gdGhleSBzaG91bGQgYmUgZGVhZCBzaW1wbGUgYW5kIHdpdGhvdXQgaW5uZXIgY2FsbHNcblxuICAgICAgICAvLyBqc2hpbnQgZXZpbDogdHJ1ZVxuXG4gICAgICAgIGxldCBjb21wYXJlQXJyID0gWydyZXR1cm4gYScsICcgLSBiJywgJzsnXTtcblxuICAgICAgICB0aGlzLmNvbXBhcmVNaW5YID0gbmV3IEZ1bmN0aW9uKCdhJywgJ2InLCBjb21wYXJlQXJyLmpvaW4oZm9ybWF0WzBdKSk7XG4gICAgICAgIHRoaXMuY29tcGFyZU1pblkgPSBuZXcgRnVuY3Rpb24oJ2EnLCAnYicsIGNvbXBhcmVBcnIuam9pbihmb3JtYXRbMV0pKTtcblxuICAgICAgICB0aGlzLnRvQkJveCA9IG5ldyBGdW5jdGlvbignYScsICdyZXR1cm4gW2EnICsgZm9ybWF0LmpvaW4oJywgYScpICsgJ107Jyk7XG4gICAgfVxuXG5cblxuLy8gY2FsY3VsYXRlIG5vZGUncyBiYm94IGZyb20gYmJveGVzIG9mIGl0cyBjaGlsZHJlblxuICAgIGNhbGNCQm94KG5vZGUsIHRvQkJveCkge1xuICAgICAgICBub2RlLmJib3ggPSB0aGlzLmRpc3RCQm94KG5vZGUsIDAsIG5vZGUuY2hpbGRyZW4ubGVuZ3RoLCB0b0JCb3gpO1xuICAgIH1cblxuLy8gbWluIGJvdW5kaW5nIHJlY3RhbmdsZSBvZiBub2RlIGNoaWxkcmVuIGZyb20gayB0byBwLTFcbiAgICBkaXN0QkJveChub2RlLCBrLCBwLCB0b0JCb3gpIHtcbiAgICAgICAgbGV0IGJib3ggPSB0aGlzLmVtcHR5KCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IGssIGNoaWxkOyBpIDwgcDsgaSsrKSB7XG4gICAgICAgICAgICBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgICAgICB0aGlzLmV4dGVuZChiYm94LCBub2RlLmxlYWYgPyB0b0JCb3goY2hpbGQpIDogY2hpbGQuYmJveCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYmJveDtcbiAgICB9XG5cbiAgICBlbXB0eSgpIHsgcmV0dXJuIFtJbmZpbml0eSwgSW5maW5pdHksIC1JbmZpbml0eSwgLUluZmluaXR5XTsgfVxuXG4gICAgZXh0ZW5kKGEsIGIpIHtcbiAgICAgICAgYVswXSA9IE1hdGgubWluKGFbMF0sIGJbMF0pO1xuICAgICAgICBhWzFdID0gTWF0aC5taW4oYVsxXSwgYlsxXSk7XG4gICAgICAgIGFbMl0gPSBNYXRoLm1heChhWzJdLCBiWzJdKTtcbiAgICAgICAgYVszXSA9IE1hdGgubWF4KGFbM10sIGJbM10pO1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICBjb21wYXJlTm9kZU1pblgoYSwgYikgeyByZXR1cm4gYS5iYm94WzBdIC0gYi5iYm94WzBdOyB9XG4gICAgY29tcGFyZU5vZGVNaW5ZKGEsIGIpIHsgcmV0dXJuIGEuYmJveFsxXSAtIGIuYmJveFsxXTsgfVxuXG4gICAgYmJveEFyZWEoYSkgICB7IHJldHVybiAoYVsyXSAtIGFbMF0pICogKGFbM10gLSBhWzFdKTsgfVxuICAgIGJib3hNYXJnaW4oYSkgeyByZXR1cm4gKGFbMl0gLSBhWzBdKSArIChhWzNdIC0gYVsxXSk7IH1cblxuICAgIGVubGFyZ2VkQXJlYShhLCBiKSB7XG4gICAgICAgIHJldHVybiAoTWF0aC5tYXgoYlsyXSwgYVsyXSkgLSBNYXRoLm1pbihiWzBdLCBhWzBdKSkgKlxuICAgICAgICAgICAgKE1hdGgubWF4KGJbM10sIGFbM10pIC0gTWF0aC5taW4oYlsxXSwgYVsxXSkpO1xuICAgIH1cblxuICAgIGludGVyc2VjdGlvbkFyZWEgKGEsIGIpIHtcbiAgICAgICAgbGV0IG1pblggPSBNYXRoLm1heChhWzBdLCBiWzBdKSxcbiAgICAgICAgICAgIG1pblkgPSBNYXRoLm1heChhWzFdLCBiWzFdKSxcbiAgICAgICAgICAgIG1heFggPSBNYXRoLm1pbihhWzJdLCBiWzJdKSxcbiAgICAgICAgICAgIG1heFkgPSBNYXRoLm1pbihhWzNdLCBiWzNdKTtcblxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoMCwgbWF4WCAtIG1pblgpICpcbiAgICAgICAgICAgIE1hdGgubWF4KDAsIG1heFkgLSBtaW5ZKTtcbiAgICB9XG5cbiAgICBjb250YWlucyhhLCBiKSB7XG4gICAgICAgIHJldHVybiBhWzBdIDw9IGJbMF0gJiZcbiAgICAgICAgICAgIGFbMV0gPD0gYlsxXSAmJlxuICAgICAgICAgICAgYlsyXSA8PSBhWzJdICYmXG4gICAgICAgICAgICBiWzNdIDw9IGFbM107XG4gICAgfVxuXG4gICAgaW50ZXJzZWN0cyAoYSwgYikge1xuICAgICAgICByZXR1cm4gYlswXSA8PSBhWzJdICYmXG4gICAgICAgICAgICBiWzFdIDw9IGFbM10gJiZcbiAgICAgICAgICAgIGJbMl0gPj0gYVswXSAmJlxuICAgICAgICAgICAgYlszXSA+PSBhWzFdO1xuICAgIH1cblxuLy8gc29ydCBhbiBhcnJheSBzbyB0aGF0IGl0ZW1zIGNvbWUgaW4gZ3JvdXBzIG9mIG4gdW5zb3J0ZWQgaXRlbXMsIHdpdGggZ3JvdXBzIHNvcnRlZCBiZXR3ZWVuIGVhY2ggb3RoZXI7XG4vLyBjb21iaW5lcyBzZWxlY3Rpb24gYWxnb3JpdGhtIHdpdGggYmluYXJ5IGRpdmlkZSAmIGNvbnF1ZXIgYXBwcm9hY2hcblxuICAgIG11bHRpU2VsZWN0KGFyciwgbGVmdCwgcmlnaHQsIG4sIGNvbXBhcmUpIHtcbiAgICAgICAgbGV0IHN0YWNrID0gW2xlZnQsIHJpZ2h0XSxcbiAgICAgICAgICAgIG1pZDtcblxuICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICByaWdodCA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgbGVmdCA9IHN0YWNrLnBvcCgpO1xuXG4gICAgICAgICAgICBpZiAocmlnaHQgLSBsZWZ0IDw9IG4pIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBtaWQgPSBsZWZ0ICsgTWF0aC5jZWlsKChyaWdodCAtIGxlZnQpIC8gbiAvIDIpICogbjtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0KGFyciwgbGVmdCwgcmlnaHQsIG1pZCwgY29tcGFyZSk7XG5cbiAgICAgICAgICAgIHN0YWNrLnB1c2gobGVmdCwgbWlkLCBtaWQsIHJpZ2h0KTtcbiAgICAgICAgfVxuICAgIH1cblxuLy8gc29ydCBhcnJheSBiZXR3ZWVuIGxlZnQgYW5kIHJpZ2h0IChpbmNsdXNpdmUpIHNvIHRoYXQgdGhlIHNtYWxsZXN0IGsgZWxlbWVudHMgY29tZSBmaXJzdCAodW5vcmRlcmVkKVxuICAgIHNlbGVjdChhcnIsIGxlZnQsIHJpZ2h0LCBrLCBjb21wYXJlKSB7XG4gICAgICAgIGxldCBuLCBpLCB6LCBzLCBzZCwgbmV3TGVmdCwgbmV3UmlnaHQsIHQsIGo7XG5cbiAgICAgICAgd2hpbGUgKHJpZ2h0ID4gbGVmdCkge1xuICAgICAgICAgICAgaWYgKHJpZ2h0IC0gbGVmdCA+IDYwMCkge1xuICAgICAgICAgICAgICAgIG4gPSByaWdodCAtIGxlZnQgKyAxO1xuICAgICAgICAgICAgICAgIGkgPSBrIC0gbGVmdCArIDE7XG4gICAgICAgICAgICAgICAgeiA9IE1hdGgubG9nKG4pO1xuICAgICAgICAgICAgICAgIHMgPSAwLjUgKiBNYXRoLmV4cCgyICogeiAvIDMpO1xuICAgICAgICAgICAgICAgIHNkID0gMC41ICogTWF0aC5zcXJ0KHogKiBzICogKG4gLSBzKSAvIG4pICogKGkgLSBuIC8gMiA8IDAgPyAtMSA6IDEpO1xuICAgICAgICAgICAgICAgIG5ld0xlZnQgPSBNYXRoLm1heChsZWZ0LCBNYXRoLmZsb29yKGsgLSBpICogcyAvIG4gKyBzZCkpO1xuICAgICAgICAgICAgICAgIG5ld1JpZ2h0ID0gTWF0aC5taW4ocmlnaHQsIE1hdGguZmxvb3IoayArIChuIC0gaSkgKiBzIC8gbiArIHNkKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QoYXJyLCBuZXdMZWZ0LCBuZXdSaWdodCwgaywgY29tcGFyZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHQgPSBhcnJba107XG4gICAgICAgICAgICBpID0gbGVmdDtcbiAgICAgICAgICAgIGogPSByaWdodDtcblxuICAgICAgICAgICAgdGhpcy5zd2FwKGFyciwgbGVmdCwgayk7XG4gICAgICAgICAgICBpZiAoY29tcGFyZShhcnJbcmlnaHRdLCB0KSA+IDApIHRoaXMuc3dhcChhcnIsIGxlZnQsIHJpZ2h0KTtcblxuICAgICAgICAgICAgd2hpbGUgKGkgPCBqKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zd2FwKGFyciwgaSwgaik7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIGotLTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoY29tcGFyZShhcnJbaV0sIHQpIDwgMCkgaSsrO1xuICAgICAgICAgICAgICAgIHdoaWxlIChjb21wYXJlKGFycltqXSwgdCkgPiAwKSBqLS07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjb21wYXJlKGFycltsZWZ0XSwgdCkgPT09IDApIHRoaXMuc3dhcChhcnIsIGxlZnQsIGopO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgICAgIHRoaXMuc3dhcChhcnIsIGosIHJpZ2h0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGogPD0gaykgbGVmdCA9IGogKyAxO1xuICAgICAgICAgICAgaWYgKGsgPD0gaikgcmlnaHQgPSBqIC0gMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN3YXAoYXJyLCBpLCBqKSB7XG4gICAgICAgIGxldCB0bXAgPSBhcnJbaV07XG4gICAgICAgIGFycltpXSA9IGFycltqXTtcbiAgICAgICAgYXJyW2pdID0gdG1wO1xuICAgIH1cbn1cblxuIl19
