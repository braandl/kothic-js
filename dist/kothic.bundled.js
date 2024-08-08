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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*
 (c) 2013, Darafei Praliaskouski, Vladimir Agafonkin, Maksim Gurtovenko
 Kothic JS is a full-featured JavaScript map rendering engine using HTML5 Canvas.
 http://github.com/kothic/kothic-js
*/
var Kothic =
/*#__PURE__*/
function () {
  function Kothic() {
    _classCallCheck(this, Kothic);
  }

  _createClass(Kothic, null, [{
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
          collisionBuffer = new _collisions["default"](height, width); //console.time('styles');
      // setup layer styles

      var layers = _style["default"].populateLayers(data.features, zoom, styles),
          layerIds = Kothic.getLayerIds(layers); // render the map


      _style["default"].setStyles(ctx, _style["default"].defaultCanvasStyles); //console.timeEnd('styles');


      Kothic.getFrame(function () {
        //console.time('geometry');
        Kothic._renderBackground(ctx, width, height, zoom, styles);

        Kothic._renderGeometryFeatures(layerIds, layers, ctx, ws, hs, granularity);

        if (options && options.onRenderComplete) {
          options.onRenderComplete();
        } //console.timeEnd('geometry');


        Kothic.getFrame(function () {
          //console.time('text/icons');
          Kothic._renderTextAndIcons(layerIds, layers, ctx, ws, hs, collisionBuffer); //console.timeEnd('text/icons');
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
            featuresLen = features.length; // render icons without text

        for (j = featuresLen - 1; j >= 0; j--) {
          style = features[j].style;

          if (style.hasOwnProperty('icon-image') && !style.text) {
            _texticons["default"].render(ctx, features[j], collisionBuffer, ws, hs, false, true);
          }
        } // render text on features without icons


        for (j = featuresLen - 1; j >= 0; j--) {
          style = features[j].style;

          if (!style.hasOwnProperty('icon-image') && style.text) {
            _texticons["default"].render(ctx, features[j], collisionBuffer, ws, hs, true, false);
          }
        } // for features with both icon and text, render both or neither


        for (j = featuresLen - 1; j >= 0; j--) {
          style = features[j].style;

          if (style.hasOwnProperty('icon-image') && style.text) {
            _texticons["default"].render(ctx, features[j], collisionBuffer, ws, hs, true, true);
          }
        } // render shields with text


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

  return Kothic;
}();

exports["default"] = Kothic;
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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var line = null;

var Line =
/*#__PURE__*/
function () {
  function Line() {
    _classCallCheck(this, Line);

    if (line == null) {
      line = this;
      this.pathOpened = false;
    }

    return line;
  }

  _createClass(Line, [{
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

  return Line;
}();

exports["default"] = Line;
;

},{"../style/mapcss":9,"../style/style":11,"./path":4}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _geom = _interopRequireDefault(require("../utils/geom"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Path =
/*#__PURE__*/
function () {
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
          point = points[j]; // continue path off the tile by some amount to fix path edges between tiles

          if ((j === 0 || j === pointsLen - 1) && Path.isTileBoundary(point, granularity)) {
            k = j;

            do {
              k = j ? k - 1 : k + 1;
              if (k < 0 || k >= pointsLen) break;
              prevPoint = points[k];
              dx = point[0] - prevPoint[0];
              dy = point[1] - prevPoint[1];
              dist = Math.sqrt(dx * dx + dy * dy);
            } while (dist <= skip); // all points are so close to each other that it doesn't make sense to
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
  } // check if the point is on the tile boundary
  // returns bitmask of affected tile boundaries


  _createClass(Path, null, [{
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

  return Path;
}();

exports["default"] = Path;

},{"../utils/geom":13}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mapcss = _interopRequireDefault(require("../style/mapcss"));

var _style = _interopRequireDefault(require("../style/style"));

var _path = _interopRequireDefault(require("./path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var polygon = null;

var Polygon =
/*#__PURE__*/
function () {
  function Polygon() {
    _classCallCheck(this, Polygon);

    if (polygon == null) {
      polygon = this;
    }

    return polygon;
  }

  _createClass(Polygon, [{
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

  return Polygon;
}();

exports["default"] = Polygon;

},{"../style/mapcss":9,"../style/style":11,"./path":4}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _geom = _interopRequireDefault(require("../utils/geom"));

var _mapcss = _interopRequireDefault(require("../style/mapcss"));

var _style = _interopRequireDefault(require("../style/style"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Shields =
/*#__PURE__*/
function () {
  function Shields() {
    _classCallCheck(this, Shields);
  }

  _createClass(Shields, null, [{
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

  return Shields;
}();

exports["default"] = Shields;

},{"../style/mapcss":9,"../style/style":11,"../utils/geom":13}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _geom = _interopRequireDefault(require("../utils/geom"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var TextOnPath =
/*#__PURE__*/
function () {
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
        maxAngle = Math.PI / 6; // iterating solutions - start from center or from one of the ends

    while (solution < 2) {
      //TODO change to for?
      widthUsed = solution ? TextOnPath.getWidth(ctx, text.charAt(0)) : (pathLen - textWidth) / 2; // ???

      flipCount = 0;
      prevAngle = null;
      positions = []; // iterating label letter by letter (should be fixed to support ligatures/CJK, ok for Cyrillic/latin)

      for (i = 0; i < textLen; i++) {
        letter = text.charAt(i);
        letterWidth = TextOnPath.getWidth(ctx, letter);
        axy = _geom["default"].getAngleAndCoordsAtLength(points, widthUsed, letterWidth); // if cannot fit letter - restart with next solution

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
        } // if label collisions with another, restart it from here


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

  _createClass(TextOnPath, null, [{
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

      for (var _i = 0; _i < textWidth; _i += letterWidth) {
        if (collisions.checkPointWH.apply(collisions, TextOnPath.getCollisionParams(letterWidth, axy, _i))) {
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

      for (var _i2 = 0; _i2 < textWidth; _i2 += letterWidth) {
        params.push(TextOnPath.getCollisionParams(letterWidth, axy, _i2));
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

  return TextOnPath;
}();

exports["default"] = TextOnPath;

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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Texticons =
/*#__PURE__*/
function () {
  function Texticons() {
    _classCallCheck(this, Texticons);
  }

  _createClass(Texticons, null, [{
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

  return Texticons;
}();

exports["default"] = Texticons;
;

},{"../style/mapcss":9,"../style/style":11,"../utils/geom":13,"./text":7}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var MapCSSInstance = null;

var MapCSS =
/*#__PURE__*/
function () {
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

  _createClass(MapCSS, [{
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
  }, {
    key: "availableStyles",
    get: function get() {
      return this._availableStyles;
    }
  }], [{
    key: "onError",
    value: function onError() {}
  }, {
    key: "onImagesLoad",
    value: function onImagesLoad() {}
    /**
    * Incalidate styles cache
    */

  }, {
    key: "invalidateCache",
    value: function invalidateCache() {
      this._cache = {};
    }
  }, {
    key: "e_min",
    value: function e_min()
    /*...*/
    {
      return Math.min.apply(null, arguments);
    }
  }, {
    key: "e_max",
    value: function e_max()
    /*...*/
    {
      return Math.max.apply(null, arguments);
    }
  }, {
    key: "e_any",
    value: function e_any()
    /*...*/
    {
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
    }
    /**
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
  }, {
    key: "shared",
    get: function get() {
      return new MapCSS();
    }
  }]);

  return MapCSS;
}();

exports["default"] = MapCSS;

},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mapcss = _interopRequireDefault(require("./mapcss"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var osmosnimki =
/*#__PURE__*/
function () {
  function osmosnimki() {
    _classCallCheck(this, osmosnimki);

    this.sprite_images = {};
    this.external_images = [];
    this.presence_tags = ['shop'];
    this.value_tags = ['color', 'amenity', 'pk', 'building ', 'wall', 'surface', 'marking', 'service', 'addr:housenumber', 'population', 'leisure', 'waterway', 'aeroway', 'landuse', 'barrier', 'colour', 'railway', 'oneway', 'religion', 'tourism', 'admin_level', 'transport', 'name', 'building', 'place', 'residential', 'highway', 'ele', 'living_street', 'natural', 'boundary', 'capital'];

    _mapcss["default"].loadStyle('styles/contagt', this.restyle, this.sprite_images, this.external_images, this.presence_tags, this.value_tags);

    _mapcss["default"].preloadExternalImages('styles/contagt');
  }

  _createClass(osmosnimki, [{
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

  return osmosnimki;
}();

exports["default"] = osmosnimki;

},{"./mapcss":9}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mapcss = _interopRequireDefault(require("./mapcss"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Style =
/*#__PURE__*/
function () {
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

  _createClass(Style, null, [{
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
  }, {
    key: "defaultCanvasStyles",
    get: function get() {
      return this._defaultCanvasStyles;
    }
  }]);

  return Style;
}();

exports["default"] = Style;

},{"./mapcss":9}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _rbush = _interopRequireDefault(require("./rbush"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var CollisionBuffer =
/*#__PURE__*/
function () {
  function CollisionBuffer(height, width) {
    _classCallCheck(this, CollisionBuffer);

    this.buffer = new _rbush["default"]();
    this.height = height;
    this.width = width;
  }

  _createClass(CollisionBuffer, [{
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

  return CollisionBuffer;
}();

exports["default"] = CollisionBuffer;

},{"./rbush":14}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Geom =
/*#__PURE__*/
function () {
  function Geom() {
    _classCallCheck(this, Geom);
  }

  _createClass(Geom, null, [{
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
          console.log('MultiPoint'); //TODO: Disassemble multi point

          return;

        case 'MultiPolygon':
          point = feature.reprpoint;
          break;

        case 'MultiLineString':
          console.log('MultiLineString'); //TODO: Disassemble geometry collection

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

  return Geom;
}();

exports["default"] = Geom;

},{}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/*
 (c) 2013, Vladimir Agafonkin
 RBush, a JavaScript library for high-performance 2D spatial indexing of points and rectangles.
 https://github.com/mourner/rbush
*/
var rbush =
/*#__PURE__*/
function () {
  function rbush(maxEntries, format) {
    _classCallCheck(this, rbush);

    // jshint newcap: false, validthis: true
    if (!(this instanceof rbush)) return new rbush(maxEntries, format); // max entries in a node is 9 by default; min node fill is 40% for best performance

    this._maxEntries = Math.max(4, maxEntries || 9);
    this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));

    if (format) {
      this._initFormat(format);
    }

    this.clear();
  }

  _createClass(rbush, [{
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
      } // recursively build the tree with the given data from stratch using OMT algorithm


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
        } // insert the small tree into the large tree at appropriate level


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
          goingUp; // depth-first iterative tree traversal

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
        height = Math.ceil(Math.log(N) / Math.log(M)); // target number of root entries to maximize storage utilization

        M = Math.ceil(N / Math.pow(M, height - 1));
      } // TODO eliminate recursion?


      node = {
        children: [],
        height: height,
        bbox: null
      }; // split the items into M mostly square tiles

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
          right3 = Math.min(j + N2 - 1, right2); // pack each entry recursively

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
          enlargement = this.enlargedArea(bbox, child.bbox) - area; // choose entry with the least area enlargement

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
          insertPath = []; // find the best node for accommodating the item, saving all nodes along the path too

      var node = this._chooseSubtree(bbox, this.data, level, insertPath); // put the item into the node


      node.children.push(item);
      this.extend(node.bbox, bbox); // split on node overflow; propagate upwards if necessary

      while (level >= 0) {
        if (insertPath[level].children.length > this._maxEntries) {
          this._split(insertPath, level);

          level--;
        } else break;
      } // adjust bboxes along the insertion path


      this._adjustParentBBoxes(bbox, insertPath, level);
    } // split overflowed node into two

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
        area = this.bboxArea(bbox1) + this.bboxArea(bbox2); // choose distribution with minimum overlap

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
    } // sorts node children by the best axis for split

  }, {
    key: "_chooseSplitAxis",
    value: function _chooseSplitAxis(node, m, M) {
      var compareMinX = node.leaf ? this.compareMinX : this.compareNodeMinX,
          compareMinY = node.leaf ? this.compareMinY : this.compareNodeMinY,
          xMargin = this._allDistMargin(node, m, M, compareMinX),
          yMargin = this._allDistMargin(node, m, M, compareMinY); // if total distributions margin value is minimal for x, sort by minX,
      // otherwise it's already sorted by minY


      if (xMargin < yMargin) node.children.sort(compareMinX);
    } // total margin of all possible split distributions where each node is at least m full

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
    } // calculate node's bbox from bboxes of its children

  }, {
    key: "calcBBox",
    value: function calcBBox(node, toBBox) {
      node.bbox = this.distBBox(node, 0, node.children.length, toBBox);
    } // min bounding rectangle of node children from k to p-1

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
    } // sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
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
    } // sort array between left and right (inclusive) so that the smallest k elements come first (unordered)

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

          while (compare(arr[i], t) < 0) {
            i++;
          }

          while (compare(arr[j], t) > 0) {
            j--;
          }
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

  return rbush;
}();

exports["default"] = rbush;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvaW5kZXguanMiLCJzcmMva290aGljLmpzIiwic3JjL3JlbmRlcmVyL2xpbmUuanMiLCJzcmMvcmVuZGVyZXIvcGF0aC5qcyIsInNyYy9yZW5kZXJlci9wb2x5Z29uLmpzIiwic3JjL3JlbmRlcmVyL3NoaWVsZHMuanMiLCJzcmMvcmVuZGVyZXIvdGV4dC5qcyIsInNyYy9yZW5kZXJlci90ZXh0aWNvbnMuanMiLCJzcmMvc3R5bGUvbWFwY3NzLmpzIiwic3JjL3N0eWxlL29zbW9zbmlta2kuanMiLCJzcmMvc3R5bGUvc3R5bGUuanMiLCJzcmMvdXRpbHMvY29sbGlzaW9ucy5qcyIsInNyYy91dGlscy9nZW9tLmpzIiwic3JjL3V0aWxzL3JidXNoLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztBQ1pBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOztBQUNBOzs7Ozs7Ozs7O0FBRUE7Ozs7O0lBS3FCLE07Ozs7Ozs7OzsyQkFFSCxNLEVBQVEsSSxFQUFNLEksRUFBTSxPLEVBQVM7QUFFdkMsVUFBSSxJQUFJLElBQUksSUFBWixFQUFrQjs7QUFDbEIsVUFBSSxPQUFPLE1BQVAsS0FBa0IsUUFBdEIsRUFBZ0M7QUFDNUIsUUFBQSxNQUFNLEdBQUcsUUFBUSxDQUFDLGNBQVQsQ0FBd0IsTUFBeEIsQ0FBVDtBQUNIOztBQUdELFVBQUksTUFBTSxHQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsTUFBcEIsSUFBK0IsRUFBNUM7QUFDQSx5QkFBTyxNQUFQLENBQWMsUUFBZCxHQUEwQixPQUFPLElBQUksT0FBTyxDQUFDLE9BQXBCLElBQWdDLEVBQXpEO0FBRUEsVUFBSSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsR0FBTCxDQUFTLE1BQU0sQ0FBQyxnQkFBUCxJQUEyQixDQUFwQyxFQUF1QyxDQUF2QyxDQUF2QjtBQUVBLFVBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxLQUFuQjtBQUFBLFVBQ0ksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQURwQjs7QUFHQSxVQUFJLGdCQUFnQixLQUFLLENBQXpCLEVBQTRCO0FBQ3hCLFFBQUEsTUFBTSxDQUFDLEtBQVAsQ0FBYSxLQUFiLEdBQXFCLEtBQUssR0FBRyxJQUE3QjtBQUNBLFFBQUEsTUFBTSxDQUFDLEtBQVAsQ0FBYSxNQUFiLEdBQXNCLE1BQU0sR0FBRyxJQUEvQjtBQUNBLFFBQUEsTUFBTSxDQUFDLEtBQVAsR0FBZSxNQUFNLENBQUMsS0FBUCxHQUFlLGdCQUE5QjtBQUNBLFFBQUEsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsTUFBTSxDQUFDLE1BQVAsR0FBZ0IsZ0JBQWhDO0FBQ0g7O0FBRUQsVUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsSUFBbEIsQ0FBVjtBQUNBLE1BQUEsR0FBRyxDQUFDLEtBQUosQ0FBVSxnQkFBVixFQUE0QixnQkFBNUI7QUFHQSxVQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBdkI7QUFBQSxVQUNJLEVBQUUsR0FBRyxLQUFLLEdBQUcsV0FEakI7QUFBQSxVQUM4QixFQUFFLEdBQUcsTUFBTSxHQUFHLFdBRDVDO0FBQUEsVUFFSSxlQUFlLEdBQUcsSUFBSSxzQkFBSixDQUFvQixNQUFwQixFQUE0QixLQUE1QixDQUZ0QixDQTNCdUMsQ0ErQnZDO0FBRUE7O0FBQ0EsVUFBSSxNQUFNLEdBQUcsa0JBQU0sY0FBTixDQUFxQixJQUFJLENBQUMsUUFBMUIsRUFBb0MsSUFBcEMsRUFBMEMsTUFBMUMsQ0FBYjtBQUFBLFVBQ0ksUUFBUSxHQUFHLE1BQU0sQ0FBQyxXQUFQLENBQW1CLE1BQW5CLENBRGYsQ0FsQ3VDLENBcUN2Qzs7O0FBQ0Esd0JBQU0sU0FBTixDQUFnQixHQUFoQixFQUFxQixrQkFBTSxtQkFBM0IsRUF0Q3VDLENBd0N2Qzs7O0FBRUEsTUFBQSxNQUFNLENBQUMsUUFBUCxDQUFnQixZQUFZO0FBQ3hCO0FBQ0EsUUFBQSxNQUFNLENBQUMsaUJBQVAsQ0FBeUIsR0FBekIsRUFBOEIsS0FBOUIsRUFBcUMsTUFBckMsRUFBNkMsSUFBN0MsRUFBbUQsTUFBbkQ7O0FBQ0EsUUFBQSxNQUFNLENBQUMsdUJBQVAsQ0FBK0IsUUFBL0IsRUFBeUMsTUFBekMsRUFBaUQsR0FBakQsRUFBc0QsRUFBdEQsRUFBMEQsRUFBMUQsRUFBOEQsV0FBOUQ7O0FBRUEsWUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLGdCQUF2QixFQUF5QztBQUNyQyxVQUFBLE9BQU8sQ0FBQyxnQkFBUjtBQUNILFNBUHVCLENBU3hCOzs7QUFFQSxRQUFBLE1BQU0sQ0FBQyxRQUFQLENBQWdCLFlBQVk7QUFDeEI7QUFDQSxVQUFBLE1BQU0sQ0FBQyxtQkFBUCxDQUEyQixRQUEzQixFQUFxQyxNQUFyQyxFQUE2QyxHQUE3QyxFQUFrRCxFQUFsRCxFQUFzRCxFQUF0RCxFQUEwRCxlQUExRCxFQUZ3QixDQUd4QjtBQUVBOztBQUNILFNBTkQ7QUFPSCxPQWxCRDtBQW1CSDs7O3NDQUV3QixHLEVBQUssSSxFQUFNO0FBQ2hDLFVBQUksQ0FBSixFQUFPLEdBQVAsRUFBWSxDQUFaOztBQUNBLFVBQUksSUFBSSxDQUFDLElBQVQsRUFBZTtBQUNYLGFBQUssQ0FBQyxHQUFHLENBQUosRUFBTyxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQUwsQ0FBYyxNQUFoQyxFQUF3QyxDQUFDLEdBQUcsR0FBNUMsRUFBaUQsQ0FBQyxFQUFsRCxFQUFzRDtBQUNsRCxVQUFBLEdBQUcsQ0FBQyxXQUFKLEdBQWtCLEtBQWxCO0FBQ0EsVUFBQSxHQUFHLENBQUMsU0FBSixHQUFnQixDQUFoQjtBQUNBLFVBQUEsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFMLENBQWMsQ0FBZCxDQUFKO0FBQ0EsVUFBQSxHQUFHLENBQUMsVUFBSixDQUFlLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBQyxDQUFDLENBQUQsQ0FBWixDQUFmLEVBQWlDLElBQUksQ0FBQyxLQUFMLENBQVcsQ0FBQyxDQUFDLENBQUQsQ0FBWixDQUFqQyxFQUFtRCxJQUFJLENBQUMsS0FBTCxDQUFXLENBQUMsQ0FBQyxDQUFELENBQUQsR0FBTyxDQUFDLENBQUMsQ0FBRCxDQUFuQixDQUFuRCxFQUE0RSxJQUFJLENBQUMsS0FBTCxDQUFXLENBQUMsQ0FBQyxDQUFELENBQUQsR0FBTyxDQUFDLENBQUMsQ0FBRCxDQUFuQixDQUE1RTtBQUNIO0FBQ0osT0FQRCxNQU9PO0FBQ0gsYUFBSyxDQUFDLEdBQUcsQ0FBSixFQUFPLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBTCxDQUFjLE1BQWhDLEVBQXdDLENBQUMsR0FBRyxHQUE1QyxFQUFpRCxDQUFDLEVBQWxELEVBQXNEO0FBQ2xELFVBQUEsTUFBTSxDQUFDLGlCQUFQLENBQXlCLEdBQXpCLEVBQThCLElBQUksQ0FBQyxRQUFMLENBQWMsQ0FBZCxDQUE5QjtBQUNIO0FBQ0o7QUFDSjs7O2dDQUVrQixNLEVBQVE7QUFDdkIsYUFBTyxNQUFNLENBQUMsSUFBUCxDQUFZLE1BQVosRUFBb0IsSUFBcEIsQ0FBeUIsVUFBVSxDQUFWLEVBQWEsQ0FBYixFQUFnQjtBQUM1QyxlQUFPLFFBQVEsQ0FBQyxDQUFELEVBQUksRUFBSixDQUFSLEdBQWtCLFFBQVEsQ0FBQyxDQUFELEVBQUksRUFBSixDQUFqQztBQUNILE9BRk0sQ0FBUDtBQUdIOzs7NkJBRWUsRSxFQUFJO0FBQ2hCLFVBQUksUUFBUSxHQUFHLE1BQU0sQ0FBQyxxQkFBUCxJQUFnQyxNQUFNLENBQUMsd0JBQXZDLElBQ0EsTUFBTSxDQUFDLDJCQURQLElBQ3NDLE1BQU0sQ0FBQyx1QkFENUQ7QUFHQSxNQUFBLFFBQVEsQ0FBQyxJQUFULENBQWMsTUFBZCxFQUFzQixFQUF0QjtBQUNIOzs7c0NBRXdCLEcsRUFBSyxLLEVBQU8sTSxFQUFRLEksRUFBTSxNLEVBQVE7QUFDdkQsVUFBSSxLQUFLLEdBQUcsbUJBQU8sTUFBUCxDQUFjLE9BQWQsQ0FBc0IsTUFBdEIsRUFBOEIsRUFBOUIsRUFBa0MsRUFBbEMsRUFBc0MsSUFBdEMsRUFBNEMsUUFBNUMsRUFBc0QsUUFBdEQsQ0FBWjs7QUFFQSxVQUFJLFFBQVEsR0FBRyxTQUFYLFFBQVcsR0FBWTtBQUN2QixRQUFBLEdBQUcsQ0FBQyxRQUFKLENBQWEsQ0FBQyxDQUFkLEVBQWlCLENBQUMsQ0FBbEIsRUFBcUIsS0FBSyxHQUFHLENBQTdCLEVBQWdDLE1BQU0sR0FBRyxDQUF6QztBQUNILE9BRkQ7O0FBSUEsV0FBSyxJQUFJLENBQVQsSUFBYyxLQUFkLEVBQXFCO0FBQ2pCLDRCQUFRLE1BQVIsQ0FBZSxJQUFmLENBQW9CLEdBQXBCLEVBQXlCLEtBQUssQ0FBQyxDQUFELENBQTlCLEVBQW1DLFFBQW5DO0FBQ0g7QUFDSjs7OzRDQUU4QixRLEVBQVUsTSxFQUFRLEcsRUFBSyxFLEVBQUksRSxFQUFJLFcsRUFBYTtBQUN2RSxVQUFJLGNBQWMsR0FBRyxFQUFyQjtBQUFBLFVBQ0ksQ0FESjtBQUFBLFVBQ08sQ0FEUDtBQUFBLFVBQ1UsR0FEVjtBQUFBLFVBQ2UsUUFEZjtBQUFBLFVBQ3lCLEtBRHpCO0FBQUEsVUFDZ0MsS0FEaEM7QUFBQSxVQUN1QyxPQUR2Qzs7QUFJQSxXQUFLLENBQUMsR0FBRyxDQUFULEVBQVksQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUF6QixFQUFpQyxDQUFDLEVBQWxDLEVBQXNDO0FBQ2xDLFFBQUEsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBRCxDQUFULENBQWpCO0FBRUEsUUFBQSxPQUFPLEdBQUcsY0FBYyxDQUFDLEdBQWYsR0FBcUIsY0FBYyxDQUFDLEdBQWYsSUFBc0IsRUFBckQ7QUFDQSxRQUFBLEtBQUssR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUQsQ0FBVCxDQUFkLEdBQThCLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBRCxDQUFULENBQWQsSUFBK0IsRUFBckU7O0FBRUEsYUFBSyxDQUFDLEdBQUcsQ0FBSixFQUFPLEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBM0IsRUFBbUMsQ0FBQyxHQUFHLEdBQXZDLEVBQTRDLENBQUMsRUFBN0MsRUFBaUQ7QUFDN0MsVUFBQSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUQsQ0FBUixDQUFZLEtBQXBCOztBQUVBLGNBQUksZ0JBQWdCLEtBQWhCLElBQXlCLGdCQUFnQixLQUE3QyxFQUFvRDtBQUNoRCxnQkFBSSxLQUFLLENBQUMsZUFBRCxDQUFMLEtBQTJCLFlBQS9CLEVBQTZDO0FBQ3pDLGNBQUEsT0FBTyxDQUFDLFFBQVIsR0FBbUIsT0FBTyxDQUFDLFFBQVIsSUFBb0IsRUFBdkM7QUFDQSxjQUFBLE9BQU8sQ0FBQyxRQUFSLENBQWlCLElBQWpCLENBQXNCLFFBQVEsQ0FBQyxDQUFELENBQTlCO0FBQ0gsYUFIRCxNQUdPO0FBQ0gsY0FBQSxLQUFLLENBQUMsUUFBTixHQUFpQixLQUFLLENBQUMsUUFBTixJQUFrQixFQUFuQztBQUNBLGNBQUEsS0FBSyxDQUFDLFFBQU4sQ0FBZSxJQUFmLENBQW9CLFFBQVEsQ0FBQyxDQUFELENBQTVCO0FBQ0g7QUFDSjs7QUFFRCxjQUFJLGtCQUFrQixLQUF0QixFQUE2QjtBQUN6QixZQUFBLEtBQUssQ0FBQyxPQUFOLEdBQWdCLEtBQUssQ0FBQyxPQUFOLElBQWlCLEVBQWpDO0FBQ0EsWUFBQSxLQUFLLENBQUMsT0FBTixDQUFjLElBQWQsQ0FBbUIsUUFBUSxDQUFDLENBQUQsQ0FBM0I7QUFDSDs7QUFFRCxjQUFJLFdBQVcsS0FBZixFQUFzQjtBQUNsQixZQUFBLEtBQUssQ0FBQyxLQUFOLEdBQWMsS0FBSyxDQUFDLEtBQU4sSUFBZSxFQUE3QjtBQUNBLFlBQUEsS0FBSyxDQUFDLEtBQU4sQ0FBWSxJQUFaLENBQWlCLFFBQVEsQ0FBQyxDQUFELENBQXpCO0FBQ0g7QUFDSjtBQUNKOztBQUVELE1BQUEsUUFBUSxHQUFHLENBQUMsS0FBRCxFQUFRLE1BQVIsQ0FBZSxRQUFmLENBQVg7O0FBRUEsV0FBSyxDQUFDLEdBQUcsQ0FBVCxFQUFZLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBekIsRUFBaUMsQ0FBQyxFQUFsQyxFQUFzQztBQUNsQyxRQUFBLEtBQUssR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUQsQ0FBVCxDQUF0QjtBQUNBLFlBQUksQ0FBQyxLQUFMLEVBQ0k7O0FBRUosWUFBSSxLQUFLLENBQUMsUUFBVixFQUFvQjtBQUNoQixlQUFLLENBQUMsR0FBRyxDQUFKLEVBQU8sR0FBRyxHQUFHLEtBQUssQ0FBQyxRQUFOLENBQWUsTUFBakMsRUFBeUMsQ0FBQyxHQUFHLEdBQTdDLEVBQWtELENBQUMsRUFBbkQsRUFBdUQ7QUFDbkQsZ0NBQVEsTUFBUixDQUFlLE1BQWYsQ0FBc0IsR0FBdEIsRUFBMkIsS0FBSyxDQUFDLFFBQU4sQ0FBZSxDQUFmLENBQTNCLEVBQThDLEtBQUssQ0FBQyxRQUFOLENBQWUsQ0FBQyxHQUFHLENBQW5CLENBQTlDLEVBQXFFLEVBQXJFLEVBQXlFLEVBQXpFLEVBQTZFLFdBQTdFO0FBQ0g7QUFDSjs7QUFDRCxZQUFJLEtBQUssQ0FBQyxPQUFWLEVBQW1CO0FBQ2YsVUFBQSxHQUFHLENBQUMsT0FBSixHQUFjLE1BQWQ7O0FBQ0EsZUFBSyxDQUFDLEdBQUcsQ0FBSixFQUFPLEdBQUcsR0FBRyxLQUFLLENBQUMsT0FBTixDQUFjLE1BQWhDLEVBQXdDLENBQUMsR0FBRyxHQUE1QyxFQUFpRCxDQUFDLEVBQWxELEVBQXNEO0FBQ2xELDZCQUFLLE1BQUwsQ0FBWSxZQUFaLENBQXlCLEdBQXpCLEVBQThCLEtBQUssQ0FBQyxPQUFOLENBQWMsQ0FBZCxDQUE5QixFQUFnRCxLQUFLLENBQUMsT0FBTixDQUFjLENBQUMsR0FBRyxDQUFsQixDQUFoRCxFQUFzRSxFQUF0RSxFQUEwRSxFQUExRSxFQUE4RSxXQUE5RTtBQUNIO0FBQ0o7O0FBQ0QsWUFBSSxLQUFLLENBQUMsS0FBVixFQUFpQjtBQUNiLFVBQUEsR0FBRyxDQUFDLE9BQUosR0FBYyxPQUFkOztBQUNBLGVBQUssQ0FBQyxHQUFHLENBQUosRUFBTyxHQUFHLEdBQUcsS0FBSyxDQUFDLEtBQU4sQ0FBWSxNQUE5QixFQUFzQyxDQUFDLEdBQUcsR0FBMUMsRUFBK0MsQ0FBQyxFQUFoRCxFQUFvRDtBQUNoRCw2QkFBSyxNQUFMLENBQVksTUFBWixDQUFtQixHQUFuQixFQUF3QixLQUFLLENBQUMsS0FBTixDQUFZLENBQVosQ0FBeEIsRUFBd0MsS0FBSyxDQUFDLEtBQU4sQ0FBWSxDQUFDLEdBQUcsQ0FBaEIsQ0FBeEMsRUFBNEQsRUFBNUQsRUFBZ0UsRUFBaEUsRUFBb0UsV0FBcEU7QUFDSDtBQUNKO0FBQ0o7QUFDSjs7O3dDQUUwQixRLEVBQVUsTSxFQUFRLEcsRUFBSyxFLEVBQUksRSxFQUFJLGUsRUFBaUI7QUFDdkU7QUFDQSxVQUFJLENBQUo7QUFBQSxVQUFPLEtBQVA7QUFBQSxVQUFjLENBQWQ7QUFBQSxVQUNJLE1BQU0sR0FBRyxFQURiOztBQUdBLFdBQUssQ0FBQyxHQUFHLENBQVQsRUFBWSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQXpCLEVBQWlDLENBQUMsRUFBbEMsRUFBc0M7QUFDbEMsWUFBSSxRQUFRLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFELENBQVQsQ0FBckI7QUFBQSxZQUNJLFdBQVcsR0FBRyxRQUFRLENBQUMsTUFEM0IsQ0FEa0MsQ0FJbEM7O0FBQ0EsYUFBSyxDQUFDLEdBQUcsV0FBVyxHQUFHLENBQXZCLEVBQTBCLENBQUMsSUFBSSxDQUEvQixFQUFrQyxDQUFDLEVBQW5DLEVBQXVDO0FBQ25DLFVBQUEsS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFELENBQVIsQ0FBWSxLQUFwQjs7QUFDQSxjQUFJLEtBQUssQ0FBQyxjQUFOLENBQXFCLFlBQXJCLEtBQXNDLENBQUMsS0FBSyxDQUFDLElBQWpELEVBQXVEO0FBQ25ELGtDQUFVLE1BQVYsQ0FBaUIsR0FBakIsRUFBc0IsUUFBUSxDQUFDLENBQUQsQ0FBOUIsRUFBbUMsZUFBbkMsRUFBb0QsRUFBcEQsRUFBd0QsRUFBeEQsRUFBNEQsS0FBNUQsRUFBbUUsSUFBbkU7QUFDSDtBQUNKLFNBVmlDLENBWWxDOzs7QUFDQSxhQUFLLENBQUMsR0FBRyxXQUFXLEdBQUcsQ0FBdkIsRUFBMEIsQ0FBQyxJQUFJLENBQS9CLEVBQWtDLENBQUMsRUFBbkMsRUFBdUM7QUFDbkMsVUFBQSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUQsQ0FBUixDQUFZLEtBQXBCOztBQUNBLGNBQUksQ0FBQyxLQUFLLENBQUMsY0FBTixDQUFxQixZQUFyQixDQUFELElBQXVDLEtBQUssQ0FBQyxJQUFqRCxFQUF1RDtBQUNuRCxrQ0FBVSxNQUFWLENBQWlCLEdBQWpCLEVBQXNCLFFBQVEsQ0FBQyxDQUFELENBQTlCLEVBQW1DLGVBQW5DLEVBQW9ELEVBQXBELEVBQXdELEVBQXhELEVBQTRELElBQTVELEVBQWtFLEtBQWxFO0FBQ0g7QUFDSixTQWxCaUMsQ0FvQmxDOzs7QUFDQSxhQUFLLENBQUMsR0FBRyxXQUFXLEdBQUcsQ0FBdkIsRUFBMEIsQ0FBQyxJQUFJLENBQS9CLEVBQWtDLENBQUMsRUFBbkMsRUFBdUM7QUFDbkMsVUFBQSxLQUFLLEdBQUcsUUFBUSxDQUFDLENBQUQsQ0FBUixDQUFZLEtBQXBCOztBQUNBLGNBQUksS0FBSyxDQUFDLGNBQU4sQ0FBcUIsWUFBckIsS0FBc0MsS0FBSyxDQUFDLElBQWhELEVBQXNEO0FBQ2xELGtDQUFVLE1BQVYsQ0FBaUIsR0FBakIsRUFBc0IsUUFBUSxDQUFDLENBQUQsQ0FBOUIsRUFBbUMsZUFBbkMsRUFBb0QsRUFBcEQsRUFBd0QsRUFBeEQsRUFBNEQsSUFBNUQsRUFBa0UsSUFBbEU7QUFDSDtBQUNKLFNBMUJpQyxDQTRCbEM7OztBQUNBLGFBQUssQ0FBQyxHQUFHLFdBQVcsR0FBRyxDQUF2QixFQUEwQixDQUFDLElBQUksQ0FBL0IsRUFBa0MsQ0FBQyxFQUFuQyxFQUF1QztBQUNuQyxVQUFBLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBRCxDQUFSLENBQVksS0FBcEI7O0FBQ0EsY0FBSSxLQUFLLENBQUMsYUFBRCxDQUFULEVBQTBCO0FBQ3RCLGdDQUFRLE1BQVIsQ0FBZSxHQUFmLEVBQW9CLFFBQVEsQ0FBQyxDQUFELENBQTVCLEVBQWlDLGVBQWpDLEVBQWtELEVBQWxELEVBQXNELEVBQXREO0FBQ0g7QUFDSjtBQUNKOztBQUVELGFBQU8sTUFBUDtBQUNIOzs7Ozs7O0FBQ0o7Ozs7Ozs7Ozs7QUNsT0Q7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUFFQSxJQUFJLElBQUksR0FBRyxJQUFYOztJQUVxQixJOzs7QUFFakIsa0JBQWM7QUFBQTs7QUFDVixRQUFJLElBQUksSUFBSSxJQUFaLEVBQWtCO0FBQ2QsTUFBQSxJQUFJLEdBQUcsSUFBUDtBQUNBLFdBQUssVUFBTCxHQUFrQixLQUFsQjtBQUNIOztBQUNELFdBQU8sSUFBUDtBQUNIOzs7O2lDQU1ZLEcsRUFBSyxPLEVBQVMsVyxFQUFhLEUsRUFBSSxFLEVBQUksVyxFQUFhO0FBQ3pELFVBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFwQjtBQUFBLFVBQ0ksU0FBUyxHQUFHLFdBQVcsSUFBSSxXQUFXLENBQUMsS0FEM0M7O0FBR0EsVUFBSSxDQUFDLEtBQUssVUFBVixFQUFzQjtBQUNsQixhQUFLLFVBQUwsR0FBa0IsSUFBbEI7QUFDQSxRQUFBLEdBQUcsQ0FBQyxTQUFKO0FBQ0g7O0FBRUQsVUFBSSxnQkFBSixDQUFTLEdBQVQsRUFBYyxPQUFkLEVBQXVCLEtBQUssQ0FBQyxlQUFELENBQUwsSUFBMEIsS0FBSyxDQUFDLE1BQXZELEVBQStELEtBQS9ELEVBQXNFLEVBQXRFLEVBQTBFLEVBQTFFLEVBQThFLFdBQTlFOztBQUVBLFVBQUksV0FBVyxJQUNQLFNBQVMsQ0FBQyxLQUFWLEtBQW9CLEtBQUssQ0FBQyxLQUQ5QixJQUVJLFNBQVMsQ0FBQyxjQUFELENBQVQsS0FBOEIsS0FBSyxDQUFDLGNBQUQsQ0FGdkMsSUFHSSxTQUFTLENBQUMsY0FBRCxDQUFULEtBQThCLEtBQUssQ0FBQyxjQUFELENBSHZDLElBSUksU0FBUyxDQUFDLGVBQUQsQ0FBVCxLQUErQixLQUFLLENBQUMsZUFBRCxDQUp4QyxJQUtJLFNBQVMsQ0FBQyxnQkFBRCxDQUFULEtBQWdDLEtBQUssQ0FBQyxnQkFBRCxDQUw3QyxFQUtpRTtBQUM3RDtBQUNIOztBQUVELHdCQUFNLFNBQU4sQ0FBZ0IsR0FBaEIsRUFBcUI7QUFDakIsUUFBQSxTQUFTLEVBQUUsSUFBSSxLQUFLLENBQUMsY0FBRCxDQUFULElBQTZCLEtBQUssQ0FBQyxjQUFOLENBQXFCLE9BQXJCLElBQWdDLEtBQUssQ0FBQyxLQUF0QyxHQUE4QyxDQUEzRSxDQURNO0FBRWpCLFFBQUEsV0FBVyxFQUFFLEtBQUssQ0FBQyxjQUFELENBQUwsSUFBeUIsU0FGckI7QUFHakIsUUFBQSxPQUFPLEVBQUUsS0FBSyxDQUFDLGdCQUFELENBQUwsSUFBMkIsS0FBSyxDQUFDLE9BQWpDLElBQTRDLE1BSHBDO0FBSWpCLFFBQUEsUUFBUSxFQUFFLEtBQUssQ0FBQyxpQkFBRCxDQUFMLElBQTRCLEtBQUssQ0FBQyxRQUFsQyxJQUE4QyxPQUp2QztBQUtqQixRQUFBLFdBQVcsRUFBRSxLQUFLLENBQUMsZ0JBQUQsQ0FBTCxJQUEyQjtBQUx2QixPQUFyQjs7QUFRQSxNQUFBLEdBQUcsQ0FBQyxNQUFKO0FBQ0EsV0FBSyxVQUFMLEdBQWtCLEtBQWxCO0FBQ0g7OzsyQkFFTSxHLEVBQUssTyxFQUFTLFcsRUFBYSxFLEVBQUksRSxFQUFJLFcsRUFBYTtBQUNuRCxVQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBcEI7QUFBQSxVQUNJLFNBQVMsR0FBRyxXQUFXLElBQUksV0FBVyxDQUFDLEtBRDNDOztBQUdBLFVBQUksQ0FBQyxLQUFLLFVBQVYsRUFBc0I7QUFDbEIsYUFBSyxVQUFMLEdBQWtCLElBQWxCO0FBQ0EsUUFBQSxHQUFHLENBQUMsU0FBSjtBQUNIOztBQUVELFVBQUksZ0JBQUosQ0FBUyxHQUFULEVBQWMsT0FBZCxFQUF1QixLQUFLLENBQUMsTUFBN0IsRUFBcUMsS0FBckMsRUFBNEMsRUFBNUMsRUFBZ0QsRUFBaEQsRUFBb0QsV0FBcEQ7O0FBRUEsVUFBSSxXQUFXLElBQ1AsU0FBUyxDQUFDLEtBQVYsS0FBb0IsS0FBSyxDQUFDLEtBRDlCLElBRUksU0FBUyxDQUFDLEtBQVYsS0FBb0IsS0FBSyxDQUFDLEtBRjlCLElBR0ksU0FBUyxDQUFDLEtBQVYsS0FBb0IsS0FBSyxDQUFDLEtBSDlCLElBSUksU0FBUyxDQUFDLE9BQVYsS0FBc0IsS0FBSyxDQUFDLE9BSnBDLEVBSTZDO0FBQ3pDO0FBQ0g7O0FBRUQsVUFBSSxXQUFXLEtBQVgsSUFBb0IsRUFBRSxXQUFXLEtBQWIsQ0FBeEIsRUFBNkM7QUFDekMsWUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLEtBQU4sSUFBZSxDQUE3QjtBQUFBLFlBQ0ksVUFBVSxHQUFHLE9BRGpCO0FBQUEsWUFFSSxTQUFTLEdBQUcsT0FGaEI7O0FBSUEsWUFBSSxPQUFPLElBQUksQ0FBZixFQUFrQjtBQUNkLFVBQUEsVUFBVSxHQUFHLE9BQWI7QUFDQSxVQUFBLFNBQVMsR0FBRyxNQUFaO0FBQ0g7O0FBQ0QsMEJBQU0sU0FBTixDQUFnQixHQUFoQixFQUFxQjtBQUNqQixVQUFBLFNBQVMsRUFBRSxPQURNO0FBRWpCLFVBQUEsV0FBVyxFQUFFLEtBQUssQ0FBQyxLQUFOLElBQWUsU0FGWDtBQUdqQixVQUFBLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTixJQUFpQixTQUhUO0FBSWpCLFVBQUEsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFOLElBQWtCLFVBSlg7QUFLakIsVUFBQSxXQUFXLEVBQUUsS0FBSyxDQUFDLE9BQU4sSUFBaUIsQ0FMYjtBQU1qQixVQUFBLFVBQVUsRUFBRTtBQU5LLFNBQXJCOztBQVFBLFFBQUEsR0FBRyxDQUFDLE1BQUo7QUFDSDs7QUFHRCxVQUFJLFdBQVcsS0FBZixFQUFzQjtBQUNsQjtBQUNBLFlBQUksS0FBSyxHQUFHLG1CQUFPLFFBQVAsQ0FBZ0IsS0FBSyxDQUFDLEtBQXRCLENBQVo7O0FBRUEsWUFBSSxLQUFKLEVBQVc7QUFDUCw0QkFBTSxTQUFOLENBQWdCLEdBQWhCLEVBQXFCO0FBQ2pCLFlBQUEsV0FBVyxFQUFFLEdBQUcsQ0FBQyxhQUFKLENBQWtCLEtBQWxCLEVBQXlCLFFBQXpCLEtBQXNDLFNBRGxDO0FBRWpCLFlBQUEsU0FBUyxFQUFFLEtBQUssQ0FBQyxLQUFOLElBQWUsQ0FGVDtBQUdqQixZQUFBLE9BQU8sRUFBRSxLQUFLLENBQUMsT0FBTixJQUFpQixPQUhUO0FBSWpCLFlBQUEsUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFOLElBQWtCLE9BSlg7QUFLakIsWUFBQSxXQUFXLEVBQUUsS0FBSyxDQUFDLE9BQU4sSUFBaUI7QUFMYixXQUFyQjs7QUFRQSxVQUFBLEdBQUcsQ0FBQyxNQUFKO0FBQ0g7QUFDSjs7QUFDRCxXQUFLLFVBQUwsR0FBa0IsS0FBbEI7QUFDSDs7O3dCQTdGbUI7QUFDaEIsYUFBTyxJQUFJLElBQUosRUFBUDtBQUNIOzs7Ozs7O0FBNEZKOzs7Ozs7Ozs7O0FDOUdEOzs7Ozs7Ozs7O0lBRXFCLEk7OztBQUVqQixnQkFBYSxHQUFiLEVBQWtCLE9BQWxCLEVBQTJCLE1BQTNCLEVBQW1DLElBQW5DLEVBQXlDLEVBQXpDLEVBQTZDLEVBQTdDLEVBQWlELFdBQWpELEVBQThEO0FBQUE7O0FBRTFELFFBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFuQjtBQUFBLFFBQ0ksTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQURyQjs7QUFHQSxRQUFJLElBQUksS0FBSyxTQUFiLEVBQXdCO0FBQ3BCLE1BQUEsTUFBTSxHQUFHLENBQUMsTUFBRCxDQUFUO0FBQ0EsTUFBQSxJQUFJLEdBQUcsY0FBUDtBQUNILEtBSEQsTUFHTyxJQUFJLElBQUksS0FBSyxZQUFiLEVBQTJCO0FBQzlCLE1BQUEsTUFBTSxHQUFHLENBQUMsTUFBRCxDQUFUO0FBQ0EsTUFBQSxJQUFJLEdBQUcsaUJBQVA7QUFDSDs7QUFFRCxRQUFJLENBQUo7QUFBQSxRQUFPLENBQVA7QUFBQSxRQUFVLENBQVY7QUFBQSxRQUNJLE1BREo7QUFBQSxRQUVJLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFGakI7QUFBQSxRQUdJLElBSEo7QUFBQSxRQUdVLFNBSFY7QUFBQSxRQUlJLFNBSko7QUFBQSxRQUllLEtBSmY7QUFBQSxRQUlzQixXQUp0QjtBQUFBLFFBS0ksRUFMSjtBQUFBLFFBS1EsRUFMUjtBQUFBLFFBS1ksSUFMWjs7QUFPQSxRQUFJLElBQUksS0FBSyxjQUFiLEVBQTZCO0FBQ3pCLFdBQUssQ0FBQyxHQUFHLENBQVQsRUFBWSxDQUFDLEdBQUcsR0FBaEIsRUFBcUIsQ0FBQyxFQUF0QixFQUEwQjtBQUN0QixhQUFLLENBQUMsR0FBRyxDQUFKLEVBQU8sSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFELENBQU4sQ0FBVSxNQUE3QixFQUFxQyxDQUFDLEdBQUcsSUFBekMsRUFBK0MsQ0FBQyxFQUFoRCxFQUFvRDtBQUNoRCxVQUFBLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBRCxDQUFOLENBQVUsQ0FBVixDQUFUO0FBQ0EsVUFBQSxTQUFTLEdBQUcsTUFBTSxDQUFDLE1BQW5CO0FBQ0EsVUFBQSxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUQsQ0FBbEI7O0FBRUEsZUFBSyxDQUFDLEdBQUcsQ0FBVCxFQUFZLENBQUMsSUFBSSxTQUFqQixFQUE0QixDQUFDLEVBQTdCLEVBQWlDO0FBQzdCLFlBQUEsS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFELENBQU4sSUFBYSxNQUFNLENBQUMsQ0FBRCxDQUEzQjtBQUNBLFlBQUEsV0FBVyxHQUFHLGlCQUFLLGNBQUwsQ0FBb0IsS0FBcEIsRUFBMkIsRUFBM0IsRUFBK0IsRUFBL0IsQ0FBZDs7QUFFQSxnQkFBSSxDQUFDLEtBQUssQ0FBVixFQUFhO0FBQ1QsY0FBQSxHQUFHLENBQUMsTUFBSixDQUFXLFdBQVcsQ0FBQyxDQUFELENBQXRCLEVBQTJCLFdBQVcsQ0FBQyxDQUFELENBQXRDO0FBQ0Esa0JBQUksTUFBSixFQUNJLEdBQUcsQ0FBQyxXQUFKLENBQWdCLE1BQWhCLEVBREosS0FHSSxHQUFHLENBQUMsV0FBSixDQUFnQixFQUFoQjtBQUNQLGFBTkQsTUFPSyxJQUFJLENBQUMsSUFBRCxJQUFTLElBQUksQ0FBQyxpQkFBTCxDQUF1QixLQUF2QixFQUE4QixTQUE5QixFQUF5QyxXQUF6QyxDQUFiLEVBQW9FO0FBQ3JFLGNBQUEsR0FBRyxDQUFDLE1BQUosQ0FBVyxXQUFXLENBQUMsQ0FBRCxDQUF0QixFQUEyQixXQUFXLENBQUMsQ0FBRCxDQUF0QztBQUNILGFBRkksTUFFRTtBQUNILGNBQUEsR0FBRyxDQUFDLE1BQUosQ0FBVyxXQUFXLENBQUMsQ0FBRCxDQUF0QixFQUEyQixXQUFXLENBQUMsQ0FBRCxDQUF0QztBQUNIOztBQUNELFlBQUEsU0FBUyxHQUFHLEtBQVo7QUFDSDtBQUNKO0FBQ0o7QUFDSixLQTNCRCxNQTJCTyxJQUFJLElBQUksS0FBSyxpQkFBYixFQUFnQztBQUNuQyxVQUFJLEdBQUcsR0FBRyxFQUFWO0FBQUEsVUFBYztBQUNWLE1BQUEsSUFBSSxHQUFHLENBRFgsQ0FEbUMsQ0FFckI7O0FBRWQsV0FBSyxDQUFDLEdBQUcsQ0FBVCxFQUFZLENBQUMsR0FBRyxHQUFoQixFQUFxQixDQUFDLEVBQXRCLEVBQTBCO0FBQ3RCLFFBQUEsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFELENBQWY7QUFDQSxRQUFBLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBbkI7O0FBRUEsYUFBSyxDQUFDLEdBQUcsQ0FBVCxFQUFZLENBQUMsR0FBRyxTQUFoQixFQUEyQixDQUFDLEVBQTVCLEVBQWdDO0FBQzVCLFVBQUEsS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFELENBQWQsQ0FENEIsQ0FHNUI7O0FBQ0EsY0FBSSxDQUFDLENBQUMsS0FBSyxDQUFOLElBQVcsQ0FBQyxLQUFLLFNBQVMsR0FBRyxDQUE5QixLQUFvQyxJQUFJLENBQUMsY0FBTCxDQUFvQixLQUFwQixFQUEyQixXQUEzQixDQUF4QyxFQUFpRjtBQUM3RSxZQUFBLENBQUMsR0FBRyxDQUFKOztBQUNBLGVBQUc7QUFDQyxjQUFBLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQVAsR0FBVyxDQUFDLEdBQUcsQ0FBcEI7QUFDQSxrQkFBSSxDQUFDLEdBQUcsQ0FBSixJQUFTLENBQUMsSUFBSSxTQUFsQixFQUNJO0FBQ0osY0FBQSxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUQsQ0FBbEI7QUFFQSxjQUFBLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBRCxDQUFMLEdBQVcsU0FBUyxDQUFDLENBQUQsQ0FBekI7QUFDQSxjQUFBLEVBQUUsR0FBRyxLQUFLLENBQUMsQ0FBRCxDQUFMLEdBQVcsU0FBUyxDQUFDLENBQUQsQ0FBekI7QUFDQSxjQUFBLElBQUksR0FBRyxJQUFJLENBQUMsSUFBTCxDQUFVLEVBQUUsR0FBRyxFQUFMLEdBQVUsRUFBRSxHQUFHLEVBQXpCLENBQVA7QUFDSCxhQVRELFFBU1MsSUFBSSxJQUFJLElBVGpCLEVBRjZFLENBYTdFO0FBQ0E7QUFDQTs7O0FBQ0EsZ0JBQUksQ0FBQyxHQUFHLENBQUosSUFBUyxDQUFDLElBQUksU0FBbEIsRUFDSTtBQUVKLFlBQUEsS0FBSyxDQUFDLENBQUQsQ0FBTCxHQUFXLEtBQUssQ0FBQyxDQUFELENBQUwsR0FBVyxHQUFHLEdBQUcsRUFBTixHQUFXLElBQWpDO0FBQ0EsWUFBQSxLQUFLLENBQUMsQ0FBRCxDQUFMLEdBQVcsS0FBSyxDQUFDLENBQUQsQ0FBTCxHQUFXLEdBQUcsR0FBRyxFQUFOLEdBQVcsSUFBakM7QUFDSDs7QUFDRCxVQUFBLFdBQVcsR0FBRyxpQkFBSyxjQUFMLENBQW9CLEtBQXBCLEVBQTJCLEVBQTNCLEVBQStCLEVBQS9CLENBQWQ7O0FBRUEsY0FBSSxDQUFDLEtBQUssQ0FBVixFQUFhO0FBQ1QsWUFBQSxHQUFHLENBQUMsTUFBSixDQUFXLFdBQVcsQ0FBQyxDQUFELENBQXRCLEVBQTJCLFdBQVcsQ0FBQyxDQUFELENBQXRDO0FBQ0EsZ0JBQUksTUFBSixFQUNJLEdBQUcsQ0FBQyxXQUFKLENBQWdCLE1BQWhCLEVBREosS0FHSSxHQUFHLENBQUMsV0FBSixDQUFnQixFQUFoQjtBQUNQLFdBTkQsTUFNTztBQUNILFlBQUEsR0FBRyxDQUFDLE1BQUosQ0FBVyxXQUFXLENBQUMsQ0FBRCxDQUF0QixFQUEyQixXQUFXLENBQUMsQ0FBRCxDQUF0QztBQUNIO0FBQ0o7QUFDSjtBQUNKO0FBQ0osRyxDQUVEO0FBQ0E7Ozs7O21DQUNzQixDLEVBQUcsSSxFQUFNO0FBQzNCLFVBQUksQ0FBQyxHQUFHLENBQVI7QUFDQSxVQUFJLENBQUMsQ0FBQyxDQUFELENBQUQsS0FBUyxDQUFiLEVBQ0ksQ0FBQyxJQUFJLENBQUwsQ0FESixLQUVLLElBQUksQ0FBQyxDQUFDLENBQUQsQ0FBRCxLQUFTLElBQWIsRUFDRCxDQUFDLElBQUksQ0FBTDtBQUNKLFVBQUksQ0FBQyxDQUFDLENBQUQsQ0FBRCxLQUFTLENBQWIsRUFDSSxDQUFDLElBQUksQ0FBTCxDQURKLEtBRUssSUFBSSxDQUFDLENBQUMsQ0FBRCxDQUFELEtBQVMsSUFBYixFQUNELENBQUMsSUFBSSxDQUFMO0FBQ0osYUFBTyxDQUFQO0FBQ0g7QUFFRDs7Ozs7Ozs7Ozs7O3NDQVN5QixDLEVBQUcsQyxFQUFHLEksRUFBTTtBQUNqQyxVQUFJLEVBQUUsR0FBRyxJQUFJLENBQUMsY0FBTCxDQUFvQixDQUFwQixFQUF1QixJQUF2QixDQUFUO0FBQ0EsVUFBSSxDQUFDLEVBQUwsRUFDSSxPQUFPLENBQVA7QUFDSixhQUFRLEVBQUUsR0FBRyxJQUFJLENBQUMsY0FBTCxDQUFvQixDQUFwQixFQUF1QixJQUF2QixDQUFiO0FBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7QUNsSUw7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7QUFFQSxJQUFJLE9BQU8sR0FBRyxJQUFkOztJQUVxQixPOzs7QUFFakIscUJBQWM7QUFBQTs7QUFDVixRQUFJLE9BQU8sSUFBSSxJQUFmLEVBQXFCO0FBQ2pCLE1BQUEsT0FBTyxHQUFHLElBQVY7QUFDSDs7QUFDRCxXQUFPLE9BQVA7QUFDSDs7OzsyQkFNTSxHLEVBQUssTyxFQUFTLFcsRUFBYSxFLEVBQUksRSxFQUFJLFcsRUFBYTtBQUNuRCxVQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBcEI7QUFBQSxVQUNJLFNBQVMsR0FBRyxXQUFXLElBQUksV0FBVyxDQUFDLEtBRDNDOztBQUdBLFVBQUksQ0FBQyxLQUFLLFVBQVYsRUFBc0I7QUFDbEIsYUFBSyxVQUFMLEdBQWtCLElBQWxCO0FBQ0EsUUFBQSxHQUFHLENBQUMsU0FBSjtBQUNIOztBQUVELFVBQUksZ0JBQUosQ0FBUyxHQUFULEVBQWMsT0FBZCxFQUF1QixLQUF2QixFQUE4QixJQUE5QixFQUFvQyxFQUFwQyxFQUF3QyxFQUF4QyxFQUE0QyxXQUE1Qzs7QUFFQSxVQUFJLFdBQVcsSUFDTixTQUFTLENBQUMsWUFBRCxDQUFULEtBQTRCLEtBQUssQ0FBQyxZQUFELENBRHRDLElBRUssU0FBUyxDQUFDLFlBQUQsQ0FBVCxLQUE0QixLQUFLLENBQUMsWUFBRCxDQUZ0QyxJQUdLLFNBQVMsQ0FBQyxjQUFELENBQVQsS0FBOEIsS0FBSyxDQUFDLGNBQUQsQ0FINUMsRUFHK0Q7QUFDM0Q7QUFDSDs7QUFFRCxXQUFLLElBQUwsQ0FBVSxHQUFWLEVBQWUsS0FBZjtBQUVBLFdBQUssVUFBTCxHQUFrQixLQUFsQjtBQUNIOzs7eUJBRUksRyxFQUFLLEssRUFBTyxNLEVBQVE7QUFDckIsVUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLGNBQUQsQ0FBTCxJQUF5QixLQUFLLENBQUMsT0FBN0M7QUFBQSxVQUFzRCxLQUF0RDs7QUFFQSxVQUFJLEtBQUssQ0FBQyxjQUFOLENBQXFCLFlBQXJCLENBQUosRUFBd0M7QUFDcEM7QUFDQSwwQkFBTSxTQUFOLENBQWdCLEdBQWhCLEVBQXFCO0FBQ2pCLFVBQUEsU0FBUyxFQUFFLEtBQUssQ0FBQyxZQUFELENBQUwsSUFBdUIsU0FEakI7QUFFakIsVUFBQSxXQUFXLEVBQUUsT0FBTyxJQUFJO0FBRlAsU0FBckI7O0FBSUEsWUFBSSxNQUFKLEVBQVk7QUFDUixVQUFBLE1BQU07QUFDVCxTQUZELE1BRU87QUFDSCxVQUFBLEdBQUcsQ0FBQyxJQUFKO0FBQ0g7QUFDSjs7QUFFRCxVQUFJLEtBQUssQ0FBQyxjQUFOLENBQXFCLFlBQXJCLENBQUosRUFBd0M7QUFDcEM7QUFDQSxRQUFBLEtBQUssR0FBRyxtQkFBTyxRQUFQLENBQWdCLEtBQUssQ0FBQyxZQUFELENBQXJCLENBQVI7O0FBQ0EsWUFBSSxLQUFKLEVBQVc7QUFDUCw0QkFBTSxTQUFOLENBQWdCLEdBQWhCLEVBQXFCO0FBQ2pCLFlBQUEsU0FBUyxFQUFFLEdBQUcsQ0FBQyxhQUFKLENBQWtCLEtBQWxCLEVBQXlCLFFBQXpCLENBRE07QUFFakIsWUFBQSxXQUFXLEVBQUUsT0FBTyxJQUFJO0FBRlAsV0FBckI7O0FBSUEsY0FBSSxNQUFKLEVBQVk7QUFDUixZQUFBLE1BQU07QUFDVCxXQUZELE1BRU87QUFDSCxZQUFBLEdBQUcsQ0FBQyxJQUFKO0FBQ0g7QUFDSjtBQUNKO0FBQ0o7Ozt3QkExRG1CO0FBQ2hCLGFBQU8sSUFBSSxPQUFKLEVBQVA7QUFDSDs7Ozs7Ozs7Ozs7Ozs7OztBQ2pCTDs7QUFDQTs7QUFDQTs7Ozs7Ozs7OztJQUVxQixPOzs7Ozs7Ozs7MkJBRUgsRyxFQUFLLE8sRUFBUyxRLEVBQVUsRSxFQUFJLEUsRUFBSTtBQUMxQyxVQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBcEI7QUFBQSxVQUEyQixTQUFTLEdBQUcsaUJBQUssWUFBTCxDQUFrQixPQUFsQixDQUF2QztBQUFBLFVBQ0ksS0FESjtBQUFBLFVBQ1csR0FEWDtBQUFBLFVBQ2dCLEdBQUcsR0FBRyxDQUR0QjtBQUFBLFVBQ3lCLEtBQUssR0FBRyxLQURqQztBQUFBLFVBQ3dDLENBRHhDO0FBQUEsVUFDMkMsR0FEM0M7O0FBR0EsVUFBSSxDQUFDLFNBQUwsRUFBZ0I7QUFDWjtBQUNIOztBQUVELE1BQUEsS0FBSyxHQUFHLGlCQUFLLGNBQUwsQ0FBb0IsU0FBcEIsRUFBK0IsRUFBL0IsRUFBbUMsRUFBbkMsQ0FBUjs7QUFFQSxVQUFJLEtBQUssQ0FBQyxjQUFELENBQVQsRUFBMkI7QUFDdkIsUUFBQSxHQUFHLEdBQUcsbUJBQU8sUUFBUCxDQUFnQixLQUFLLENBQUMsWUFBRCxDQUFyQixDQUFOOztBQUVBLFlBQUksQ0FBQyxHQUFMLEVBQVU7QUFDTjtBQUNIO0FBQ0o7O0FBRUQsd0JBQU0sU0FBTixDQUFnQixHQUFoQixFQUFxQjtBQUNqQixRQUFBLElBQUksRUFBRSxrQkFBTSxhQUFOLENBQW9CLEtBQUssQ0FBQyxvQkFBRCxDQUFMLElBQStCLEtBQUssQ0FBQyxhQUFELENBQXhELEVBQXlFLEtBQUssQ0FBQyxrQkFBRCxDQUFMLElBQTZCLEtBQUssQ0FBQyxXQUFELENBQTNHLEVBQTBILEtBQTFILENBRFc7QUFFakIsUUFBQSxTQUFTLEVBQUUsS0FBSyxDQUFDLG1CQUFELENBQUwsSUFBOEIsU0FGeEI7QUFHakIsUUFBQSxXQUFXLEVBQUUsS0FBSyxDQUFDLHFCQUFELENBQUwsSUFBZ0MsS0FBSyxDQUFDLE9BQXRDLElBQWlELENBSDdDO0FBSWpCLFFBQUEsU0FBUyxFQUFFLFFBSk07QUFLakIsUUFBQSxZQUFZLEVBQUU7QUFMRyxPQUFyQjs7QUFRQSxVQUFJLElBQUksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQUQsQ0FBTixDQUFqQjtBQUFBLFVBQ0ksU0FBUyxHQUFHLEdBQUcsQ0FBQyxXQUFKLENBQWdCLElBQWhCLEVBQXNCLEtBRHRDO0FBQUEsVUFFSSxXQUFXLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxNQUZuQztBQUFBLFVBR0ksY0FBYyxHQUFHLFNBQVMsR0FBRyxDQUhqQztBQUFBLFVBSUksZUFBZSxHQUFHLFdBQVcsR0FBRyxHQUpwQzs7QUFNQSxVQUFJLE9BQU8sQ0FBQyxJQUFSLEtBQWlCLFlBQXJCLEVBQW1DO0FBQy9CLFFBQUEsR0FBRyxHQUFHLGlCQUFLLGFBQUwsQ0FBbUIsT0FBTyxDQUFDLFdBQTNCLENBQU47O0FBRUEsWUFBSSxJQUFJLENBQUMsR0FBTCxDQUFTLGVBQWUsR0FBRyxFQUEzQixFQUErQixjQUFjLEdBQUcsRUFBaEQsSUFBc0QsR0FBMUQsRUFBK0Q7QUFDM0Q7QUFDSDs7QUFFRCxhQUFLLENBQUMsR0FBRyxDQUFKLEVBQU8sR0FBRyxHQUFHLENBQWxCLEVBQXFCLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBL0IsRUFBa0MsQ0FBQyxJQUFJLElBQUksQ0FBQyxHQUFMLENBQVMsR0FBRyxHQUFHLEVBQWYsRUFBbUIsZUFBZSxHQUFHLEVBQXJDLENBQUwsRUFBK0MsR0FBRyxJQUFJLENBQUMsQ0FBekYsRUFBNEY7QUFDeEYsVUFBQSxTQUFTLEdBQUcsaUJBQUsseUJBQUwsQ0FBK0IsT0FBTyxDQUFDLFdBQXZDLEVBQW9ELEdBQUcsR0FBRyxDQUFOLEdBQVUsR0FBRyxHQUFHLENBQXBFLEVBQXVFLENBQXZFLENBQVo7O0FBQ0EsY0FBSSxDQUFDLFNBQUwsRUFBZ0I7QUFDWjtBQUNIOztBQUVELFVBQUEsU0FBUyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUQsQ0FBVixFQUFlLFNBQVMsQ0FBQyxDQUFELENBQXhCLENBQVo7QUFFQSxVQUFBLEtBQUssR0FBRyxpQkFBSyxjQUFMLENBQW9CLFNBQXBCLEVBQStCLEVBQS9CLEVBQW1DLEVBQW5DLENBQVI7O0FBQ0EsY0FBSSxHQUFHLElBQUssS0FBSyxDQUFDLGVBQUQsQ0FBTCxLQUEyQixNQUFuQyxJQUNBLFFBQVEsQ0FBQyxZQUFULENBQXNCLEtBQXRCLEVBQTZCLEdBQUcsQ0FBQyxLQUFqQyxFQUF3QyxHQUFHLENBQUMsTUFBNUMsRUFBb0QsT0FBTyxDQUFDLFFBQTVELENBREosRUFDMkU7QUFDdkU7QUFDSDs7QUFDRCxjQUFLLEtBQUssQ0FBQyxlQUFELENBQUwsS0FBMkIsTUFBNUIsSUFDQSxRQUFRLENBQUMsWUFBVCxDQUFzQixLQUF0QixFQUE2QixjQUE3QixFQUE2QyxlQUE3QyxFQUE4RCxPQUFPLENBQUMsUUFBdEUsQ0FESixFQUNxRjtBQUNqRjtBQUNIOztBQUNELFVBQUEsS0FBSyxHQUFHLElBQVI7QUFDQTtBQUNIO0FBQ0o7O0FBRUQsVUFBSSxDQUFDLEtBQUwsRUFBWTtBQUNSO0FBQ0g7O0FBRUQsVUFBSSxLQUFLLENBQUMscUJBQUQsQ0FBVCxFQUFrQztBQUM5QiwwQkFBTSxTQUFOLENBQWdCLEdBQWhCLEVBQXFCO0FBQ2pCLFVBQUEsU0FBUyxFQUFFLEtBQUssQ0FBQyxxQkFBRCxDQUFMLElBQWdDLFNBRDFCO0FBRWpCLFVBQUEsV0FBVyxFQUFFLEtBQUssQ0FBQyx1QkFBRCxDQUFMLElBQWtDLEtBQUssQ0FBQyxPQUF4QyxJQUFtRDtBQUYvQyxTQUFyQjs7QUFJQSxZQUFJLENBQUMsR0FBRyxLQUFLLENBQUMscUJBQUQsQ0FBTCxJQUFnQyxLQUFLLENBQUMsb0JBQUQsQ0FBTCxJQUErQixDQUEvRCxDQUFSO0FBQ0EsUUFBQSxHQUFHLENBQUMsUUFBSixDQUFhLEtBQUssQ0FBQyxDQUFELENBQUwsR0FBVyxjQUFjLEdBQUcsQ0FBNUIsR0FBZ0MsQ0FBN0MsRUFDSSxLQUFLLENBQUMsQ0FBRCxDQUFMLEdBQVcsZUFBZSxHQUFHLENBQTdCLEdBQWlDLENBRHJDLEVBRUksY0FBYyxHQUFHLElBQUksQ0FGekIsRUFHSSxlQUFlLEdBQUcsSUFBSSxDQUgxQjtBQUlIOztBQUVELFVBQUksS0FBSyxDQUFDLG9CQUFELENBQVQsRUFBaUM7QUFDN0IsMEJBQU0sU0FBTixDQUFnQixHQUFoQixFQUFxQjtBQUNqQixVQUFBLFNBQVMsRUFBRSxLQUFLLENBQUMsb0JBQUQsQ0FBTCxJQUErQixTQUR6QjtBQUVqQixVQUFBLFdBQVcsRUFBRSxLQUFLLENBQUMsc0JBQUQsQ0FBTCxJQUFpQyxLQUFLLENBQUMsT0FBdkMsSUFBa0Q7QUFGOUMsU0FBckI7O0FBSUEsUUFBQSxHQUFHLENBQUMsUUFBSixDQUFhLEtBQUssQ0FBQyxDQUFELENBQUwsR0FBVyxjQUFjLEdBQUcsQ0FBNUIsSUFBaUMsS0FBSyxDQUFDLG9CQUFELENBQUwsSUFBK0IsQ0FBaEUsQ0FBYixFQUNJLEtBQUssQ0FBQyxDQUFELENBQUwsR0FBVyxlQUFlLEdBQUcsQ0FBN0IsSUFBa0MsS0FBSyxDQUFDLG9CQUFELENBQUwsSUFBK0IsQ0FBakUsQ0FESixFQUVJLGNBQWMsR0FBRyxLQUFLLEtBQUssQ0FBQyxvQkFBRCxDQUFMLElBQStCLENBQXBDLENBRnJCLEVBR0ksZUFBZSxHQUFHLEtBQUssS0FBSyxDQUFDLG9CQUFELENBQUwsSUFBK0IsQ0FBcEMsQ0FIdEI7QUFJSDs7QUFFRCxVQUFJLEtBQUssQ0FBQyxjQUFELENBQVQsRUFBMkI7QUFDdkIsMEJBQU0sU0FBTixDQUFnQixHQUFoQixFQUFxQjtBQUNqQixVQUFBLFNBQVMsRUFBRSxLQUFLLENBQUMsY0FBRCxDQUFMLElBQXlCLFNBRG5CO0FBRWpCLFVBQUEsV0FBVyxFQUFFLEtBQUssQ0FBQyxnQkFBRCxDQUFMLElBQTJCLEtBQUssQ0FBQyxPQUFqQyxJQUE0QztBQUZ4QyxTQUFyQjs7QUFJQSxRQUFBLEdBQUcsQ0FBQyxRQUFKLENBQWEsS0FBSyxDQUFDLENBQUQsQ0FBTCxHQUFXLGNBQWMsR0FBRyxDQUF6QyxFQUNJLEtBQUssQ0FBQyxDQUFELENBQUwsR0FBVyxlQUFlLEdBQUcsQ0FEakMsRUFFSSxjQUZKLEVBR0ksZUFISjtBQUlIOztBQUVELFVBQUksR0FBSixFQUFTO0FBQ0wsUUFBQSxHQUFHLENBQUMsU0FBSixDQUFjLEdBQWQsRUFDSSxJQUFJLENBQUMsS0FBTCxDQUFXLEtBQUssQ0FBQyxDQUFELENBQUwsR0FBVyxHQUFHLENBQUMsS0FBSixHQUFZLENBQWxDLENBREosRUFFSSxJQUFJLENBQUMsS0FBTCxDQUFXLEtBQUssQ0FBQyxDQUFELENBQUwsR0FBVyxHQUFHLENBQUMsTUFBSixHQUFhLENBQW5DLENBRko7QUFHSDs7QUFDRCx3QkFBTSxTQUFOLENBQWdCLEdBQWhCLEVBQXFCO0FBQ2pCLFFBQUEsU0FBUyxFQUFFLEtBQUssQ0FBQyxtQkFBRCxDQUFMLElBQThCLFNBRHhCO0FBRWpCLFFBQUEsV0FBVyxFQUFFLEtBQUssQ0FBQyxxQkFBRCxDQUFMLElBQWdDLEtBQUssQ0FBQyxPQUF0QyxJQUFpRDtBQUY3QyxPQUFyQjs7QUFLQSxNQUFBLEdBQUcsQ0FBQyxRQUFKLENBQWEsSUFBYixFQUFtQixLQUFLLENBQUMsQ0FBRCxDQUF4QixFQUE2QixJQUFJLENBQUMsSUFBTCxDQUFVLEtBQUssQ0FBQyxDQUFELENBQWYsQ0FBN0I7O0FBQ0EsVUFBSSxHQUFKLEVBQVM7QUFDTCxRQUFBLFFBQVEsQ0FBQyxVQUFULENBQW9CLEtBQXBCLEVBQTJCLEdBQUcsQ0FBQyxLQUEvQixFQUFzQyxHQUFHLENBQUMsTUFBMUMsRUFBa0QsQ0FBbEQsRUFBcUQsT0FBTyxDQUFDLFFBQTdEO0FBQ0g7O0FBRUQsTUFBQSxRQUFRLENBQUMsVUFBVCxDQUFvQixLQUFwQixFQUEyQixlQUEzQixFQUE0QyxjQUE1QyxFQUNJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxxQkFBRCxDQUFOLENBQVYsSUFBNEMsQ0FBN0MsS0FBbUQsVUFBVSxDQUFDLEtBQUssQ0FBQyxvQkFBRCxDQUFOLENBQVYsSUFBMkMsQ0FBOUYsS0FBb0csVUFBVSxDQUFDLEtBQUssQ0FBQyx3QkFBRCxDQUFOLENBQVYsSUFBK0MsRUFBbkosQ0FESixFQUM0SixPQUFPLENBQUMsUUFEcEs7QUFHSDs7Ozs7Ozs7Ozs7Ozs7OztBQzNITDs7Ozs7Ozs7OztJQUVxQixVOzs7QUFFakIsc0JBQWEsR0FBYixFQUFrQixNQUFsQixFQUEwQixJQUExQixFQUFnQyxJQUFoQyxFQUFzQyxVQUF0QyxFQUFrRDtBQUFBOztBQUM5QztBQUVBO0FBRUEsUUFBSSxTQUFTLEdBQUcsR0FBRyxDQUFDLFdBQUosQ0FBZ0IsSUFBaEIsRUFBc0IsS0FBdEM7QUFBQSxRQUNJLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFEbkI7QUFBQSxRQUVJLE9BQU8sR0FBRyxpQkFBSyxhQUFMLENBQW1CLE1BQW5CLENBRmQ7O0FBSUEsUUFBSSxPQUFPLEdBQUcsU0FBZCxFQUF5QjtBQUNyQixhQURxQixDQUNaO0FBQ1o7O0FBRUQsUUFBSSxjQUFjLEdBQUcsVUFBVSxDQUFDLFFBQVgsQ0FBb0IsR0FBcEIsRUFBeUIsR0FBekIsQ0FBckI7QUFFQSxRQUFJLE1BQUo7QUFBQSxRQUNJLFNBREo7QUFBQSxRQUVJLFNBRko7QUFBQSxRQUdJLFNBSEo7QUFBQSxRQUlJLFFBQVEsR0FBRyxDQUpmO0FBQUEsUUFLSSxTQUxKO0FBQUEsUUFNSSxPQUFPLEdBQUcsS0FOZDtBQUFBLFFBT0ksR0FQSjtBQUFBLFFBUUksV0FSSjtBQUFBLFFBU0ksQ0FUSjtBQUFBLFFBVUksUUFBUSxHQUFHLElBQUksQ0FBQyxFQUFMLEdBQVUsQ0FWekIsQ0FmOEMsQ0EyQjlDOztBQUNBLFdBQU8sUUFBUSxHQUFHLENBQWxCLEVBQXFCO0FBQUU7QUFDbkIsTUFBQSxTQUFTLEdBQUcsUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFYLENBQW9CLEdBQXBCLEVBQXlCLElBQUksQ0FBQyxNQUFMLENBQVksQ0FBWixDQUF6QixDQUFILEdBQThDLENBQUMsT0FBTyxHQUFHLFNBQVgsSUFBd0IsQ0FBMUYsQ0FEaUIsQ0FDNEU7O0FBQzdGLE1BQUEsU0FBUyxHQUFHLENBQVo7QUFDQSxNQUFBLFNBQVMsR0FBRyxJQUFaO0FBQ0EsTUFBQSxTQUFTLEdBQUcsRUFBWixDQUppQixDQU1qQjs7QUFDQSxXQUFLLENBQUMsR0FBRyxDQUFULEVBQVksQ0FBQyxHQUFHLE9BQWhCLEVBQXlCLENBQUMsRUFBMUIsRUFBOEI7QUFDMUIsUUFBQSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQUwsQ0FBWSxDQUFaLENBQVQ7QUFDQSxRQUFBLFdBQVcsR0FBRyxVQUFVLENBQUMsUUFBWCxDQUFvQixHQUFwQixFQUF5QixNQUF6QixDQUFkO0FBQ0EsUUFBQSxHQUFHLEdBQUcsaUJBQUsseUJBQUwsQ0FBK0IsTUFBL0IsRUFBdUMsU0FBdkMsRUFBa0QsV0FBbEQsQ0FBTixDQUgwQixDQUsxQjs7QUFDQSxZQUFJLFNBQVMsSUFBSSxPQUFiLElBQXdCLENBQUMsR0FBN0IsRUFBa0M7QUFDOUIsVUFBQSxRQUFRO0FBQ1IsVUFBQSxTQUFTLEdBQUcsRUFBWjs7QUFDQSxjQUFJLE9BQUosRUFBYTtBQUFHO0FBQ1osWUFBQSxNQUFNLENBQUMsT0FBUDtBQUNBLFlBQUEsT0FBTyxHQUFHLEtBQVY7QUFDSDs7QUFDRDtBQUNIOztBQUVELFlBQUksQ0FBQyxTQUFMLEVBQWdCO0FBQ1osVUFBQSxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUQsQ0FBZjtBQUNILFNBbEJ5QixDQW9CMUI7OztBQUNBLFlBQUksVUFBVSxDQUFDLGNBQVgsQ0FBMEIsVUFBMUIsRUFBc0MsR0FBdEMsRUFBMkMsTUFBM0MsRUFBbUQsR0FBbkQsRUFBd0QsY0FBeEQsS0FBMkUsSUFBSSxDQUFDLEdBQUwsQ0FBUyxTQUFTLEdBQUcsR0FBRyxDQUFDLENBQUQsQ0FBeEIsSUFBK0IsUUFBOUcsRUFBd0g7QUFDcEgsVUFBQSxTQUFTLElBQUksV0FBYjtBQUNBLFVBQUEsQ0FBQyxHQUFHLENBQUMsQ0FBTDtBQUNBLFVBQUEsU0FBUyxHQUFHLEVBQVo7QUFDQSxVQUFBLFNBQVMsR0FBRyxDQUFaO0FBQ0E7QUFDSDs7QUFFRCxlQUFPLFdBQVcsR0FBRyxHQUFHLENBQUMsQ0FBRCxDQUFqQixJQUF3QixDQUFDLEdBQUcsT0FBbkMsRUFBNEM7QUFBRTtBQUMxQyxVQUFBLENBQUM7QUFDRCxVQUFBLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTCxDQUFZLENBQVosQ0FBVjtBQUNBLFVBQUEsV0FBVyxHQUFHLFVBQVUsQ0FBQyxRQUFYLENBQW9CLEdBQXBCLEVBQXlCLE1BQXpCLENBQWQ7O0FBQ0EsY0FBSSxVQUFVLENBQUMsY0FBWCxDQUEwQixVQUExQixFQUFzQyxHQUF0QyxFQUEyQyxNQUEzQyxFQUFtRCxHQUFuRCxFQUF3RCxjQUF4RCxDQUFKLEVBQTZFO0FBQ3pFLFlBQUEsQ0FBQyxHQUFHLENBQUo7QUFDQSxZQUFBLFNBQVMsSUFBSSxXQUFiO0FBQ0EsWUFBQSxTQUFTLEdBQUcsRUFBWjtBQUNBLFlBQUEsU0FBUyxHQUFHLENBQVo7QUFDQSxZQUFBLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTCxDQUFZLENBQVosQ0FBVDtBQUNBLFlBQUEsV0FBVyxHQUFHLFVBQVUsQ0FBQyxRQUFYLENBQW9CLEdBQXBCLEVBQXlCLE1BQXpCLENBQWQ7QUFDQSxZQUFBLEdBQUcsR0FBRyxpQkFBSyx5QkFBTCxDQUErQixNQUEvQixFQUF1QyxTQUF2QyxFQUFrRCxXQUFsRCxDQUFOO0FBQ0E7QUFDSDs7QUFDRCxjQUFJLFdBQVcsSUFBSSxHQUFHLENBQUMsQ0FBRCxDQUF0QixFQUEyQjtBQUN2QixZQUFBLENBQUM7QUFDRCxZQUFBLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBUCxDQUFhLENBQWIsRUFBZ0IsQ0FBQyxDQUFqQixDQUFUO0FBQ0EsWUFBQSxXQUFXLEdBQUcsVUFBVSxDQUFDLFFBQVgsQ0FBb0IsR0FBcEIsRUFBeUIsTUFBekIsQ0FBZDtBQUNBO0FBQ0g7QUFDSjs7QUFFRCxZQUFJLENBQUMsR0FBTCxFQUFVO0FBQ047QUFDSDs7QUFFRCxZQUFLLEdBQUcsQ0FBQyxDQUFELENBQUgsR0FBVSxJQUFJLENBQUMsRUFBTCxHQUFVLENBQXJCLElBQTZCLEdBQUcsQ0FBQyxDQUFELENBQUgsR0FBVSxDQUFDLElBQUksQ0FBQyxFQUFOLEdBQVcsQ0FBdEQsRUFBMkQ7QUFBRTtBQUN6RCxVQUFBLFNBQVMsSUFBSSxNQUFNLENBQUMsTUFBcEI7QUFDSDs7QUFFRCxRQUFBLFNBQVMsR0FBRyxHQUFHLENBQUMsQ0FBRCxDQUFmO0FBQ0EsUUFBQSxHQUFHLENBQUMsSUFBSixDQUFTLE1BQVQ7QUFDQSxRQUFBLFNBQVMsQ0FBQyxJQUFWLENBQWUsR0FBZjtBQUNBLFFBQUEsU0FBUyxJQUFJLFdBQWI7QUFDSCxPQXRFZ0IsQ0FzRWY7OztBQUVGLFVBQUksU0FBUyxHQUFHLE9BQU8sR0FBRyxDQUExQixFQUE2QjtBQUFFO0FBQzNCLFFBQUEsTUFBTSxDQUFDLE9BQVA7QUFDQSxRQUFBLFNBQVMsR0FBRyxFQUFaOztBQUVBLFlBQUksT0FBSixFQUFhO0FBQUU7QUFDWCxVQUFBLFFBQVE7QUFDUixVQUFBLE1BQU0sQ0FBQyxPQUFQO0FBQ0EsVUFBQSxPQUFPLEdBQUcsS0FBVjtBQUNILFNBSkQsTUFJTztBQUNILFVBQUEsT0FBTyxHQUFHLElBQVY7QUFDSDtBQUNKOztBQUVELFVBQUksUUFBUSxJQUFJLENBQWhCLEVBQW1CO0FBQ2Y7QUFDSDs7QUFFRCxVQUFJLFNBQVMsQ0FBQyxNQUFWLEdBQW1CLENBQXZCLEVBQTBCO0FBQ3RCO0FBQ0g7QUFDSixLQXhINkMsQ0F3SDVDOzs7QUFFRixRQUFJLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBdkI7O0FBRUEsU0FBSyxDQUFDLEdBQUcsQ0FBVCxFQUFZLElBQUksSUFBSyxDQUFDLEdBQUcsTUFBekIsRUFBa0MsQ0FBQyxFQUFuQyxFQUF1QztBQUNuQyxNQUFBLFVBQVUsQ0FBQyxVQUFYLENBQXNCLEdBQXRCLEVBQTJCLFNBQVMsQ0FBQyxDQUFELENBQXBDLEVBQXlDLElBQXpDO0FBQ0g7O0FBRUQsU0FBSyxDQUFDLEdBQUcsQ0FBVCxFQUFZLENBQUMsR0FBRyxNQUFoQixFQUF3QixDQUFDLEVBQXpCLEVBQTZCO0FBQ3pCLE1BQUEsR0FBRyxHQUFHLFNBQVMsQ0FBQyxDQUFELENBQWY7QUFDQSxNQUFBLFVBQVUsQ0FBQyxVQUFYLENBQXNCLEdBQXRCLEVBQTJCLEdBQTNCO0FBQ0EsTUFBQSxVQUFVLENBQUMsWUFBWCxDQUF3QixVQUF4QixFQUFvQyxHQUFwQyxFQUF5QyxHQUFHLENBQUMsQ0FBRCxDQUE1QyxFQUFpRCxHQUFqRCxFQUFzRCxjQUF0RDtBQUNIO0FBQ0o7Ozs7NkJBRWUsRyxFQUFLLEksRUFBTTtBQUN2QixhQUFPLEdBQUcsQ0FBQyxXQUFKLENBQWdCLElBQWhCLEVBQXNCLEtBQTdCO0FBQ0g7OztrQ0FFb0IsRyxFQUFLLFMsRUFBVztBQUNqQyxhQUFPLENBQUMsR0FBRyxDQUFDLENBQUQsQ0FBSCxHQUFTLE1BQU0sSUFBSSxDQUFDLEdBQUwsQ0FBUyxHQUFHLENBQUMsQ0FBRCxDQUFaLENBQU4sR0FBeUIsU0FBbkMsRUFDSCxHQUFHLENBQUMsQ0FBRCxDQUFILEdBQVMsTUFBTSxJQUFJLENBQUMsR0FBTCxDQUFTLEdBQUcsQ0FBQyxDQUFELENBQVosQ0FBTixHQUF5QixTQUQvQixDQUFQO0FBRUg7Ozt1Q0FFeUIsUyxFQUFXLEcsRUFBSyxRLEVBQVU7QUFDaEQsVUFBSSxVQUFVLEdBQUcsU0FBUyxHQUFHLEdBQTdCO0FBQUEsVUFDSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFJLENBQUMsR0FBTCxDQUFTLEdBQUcsQ0FBQyxDQUFELENBQVosQ0FBVCxDQURWO0FBQUEsVUFFSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUwsQ0FBUyxJQUFJLENBQUMsR0FBTCxDQUFTLEdBQUcsQ0FBQyxDQUFELENBQVosQ0FBVCxDQUZWO0FBQUEsVUFHSSxDQUFDLEdBQUcsR0FBRyxHQUFHLFNBQU4sR0FBa0IsR0FBRyxHQUFHLFVBSGhDO0FBQUEsVUFJSSxDQUFDLEdBQUcsR0FBRyxHQUFHLFNBQU4sR0FBa0IsR0FBRyxHQUFHLFVBSmhDO0FBTUEsYUFBTyxDQUFDLFVBQVUsQ0FBQyxhQUFYLENBQXlCLEdBQXpCLEVBQThCLFNBQVMsR0FBRyxLQUFLLFFBQVEsSUFBSSxDQUFqQixDQUExQyxDQUFELEVBQWlFLENBQWpFLEVBQW9FLENBQXBFLEVBQXVFLENBQXZFLENBQVA7QUFDSDs7O21DQUVxQixVLEVBQVksRyxFQUFLLEksRUFBTSxHLEVBQUssVyxFQUFhO0FBQzNELFVBQUksU0FBUyxHQUFHLFVBQVUsQ0FBQyxRQUFYLENBQW9CLEdBQXBCLEVBQXlCLElBQXpCLENBQWhCOztBQUVBLFdBQUssSUFBSSxFQUFDLEdBQUcsQ0FBYixFQUFnQixFQUFDLEdBQUcsU0FBcEIsRUFBK0IsRUFBQyxJQUFJLFdBQXBDLEVBQWlEO0FBQzdDLFlBQUksVUFBVSxDQUFDLFlBQVgsQ0FBd0IsS0FBeEIsQ0FBOEIsVUFBOUIsRUFBMEMsVUFBVSxDQUFDLGtCQUFYLENBQThCLFdBQTlCLEVBQTJDLEdBQTNDLEVBQWdELEVBQWhELENBQTFDLENBQUosRUFBbUc7QUFDL0YsaUJBQU8sSUFBUDtBQUNIO0FBQ0o7O0FBQ0QsYUFBTyxLQUFQO0FBQ0g7OztpQ0FFbUIsVSxFQUFZLEcsRUFBSyxJLEVBQU0sRyxFQUFLLFcsRUFBYTtBQUN6RCxVQUFJLFNBQVMsR0FBRyxVQUFVLENBQUMsUUFBWCxDQUFvQixHQUFwQixFQUF5QixJQUF6QixDQUFoQjtBQUFBLFVBQ0ksTUFBTSxHQUFHLEVBRGI7O0FBR0EsV0FBSyxJQUFJLEdBQUMsR0FBRyxDQUFiLEVBQWdCLEdBQUMsR0FBRyxTQUFwQixFQUErQixHQUFDLElBQUksV0FBcEMsRUFBaUQ7QUFDN0MsUUFBQSxNQUFNLENBQUMsSUFBUCxDQUFZLFVBQVUsQ0FBQyxrQkFBWCxDQUE4QixXQUE5QixFQUEyQyxHQUEzQyxFQUFnRCxHQUFoRCxDQUFaO0FBQ0g7O0FBQ0QsTUFBQSxVQUFVLENBQUMsU0FBWCxDQUFxQixNQUFyQjtBQUNIOzs7K0JBRWlCLEcsRUFBSyxHLEVBQUssSSxFQUFNO0FBQzlCLFVBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFELENBQWQ7QUFBQSxVQUNJLFVBQVUsR0FBRyxVQUFVLENBQUMsYUFBWCxDQUF5QixHQUF6QixFQUE4QixVQUFVLENBQUMsUUFBWCxDQUFvQixHQUFwQixFQUF5QixJQUF6QixDQUE5QixDQURqQjtBQUdBLE1BQUEsR0FBRyxDQUFDLFNBQUosQ0FBYyxVQUFVLENBQUMsQ0FBRCxDQUF4QixFQUE2QixVQUFVLENBQUMsQ0FBRCxDQUF2QztBQUNBLE1BQUEsR0FBRyxDQUFDLE1BQUosQ0FBVyxHQUFHLENBQUMsQ0FBRCxDQUFkO0FBQ0EsTUFBQSxHQUFHLENBQUMsSUFBSSxHQUFHLFlBQUgsR0FBa0IsVUFBdkIsQ0FBSCxDQUFzQyxJQUF0QyxFQUE0QyxDQUE1QyxFQUErQyxDQUEvQztBQUNBLE1BQUEsR0FBRyxDQUFDLE1BQUosQ0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFELENBQWY7QUFDQSxNQUFBLEdBQUcsQ0FBQyxTQUFKLENBQWMsQ0FBQyxVQUFVLENBQUMsQ0FBRCxDQUF6QixFQUE4QixDQUFDLFVBQVUsQ0FBQyxDQUFELENBQXpDO0FBQ0g7Ozs7Ozs7Ozs7Ozs7Ozs7QUM1TEw7O0FBQ0E7O0FBQ0E7O0FBQ0E7Ozs7Ozs7Ozs7SUFFcUIsUzs7Ozs7Ozs7OzJCQUVILEcsRUFBSyxPLEVBQVMsUSxFQUFVLEUsRUFBSSxFLEVBQUksVSxFQUFZLFUsRUFBWTtBQUNsRSxVQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBcEI7QUFBQSxVQUEyQixHQUEzQjtBQUFBLFVBQWdDLEtBQWhDO0FBQUEsVUFBdUMsQ0FBdkM7QUFBQSxVQUEwQyxDQUExQzs7QUFFQSxVQUFJLFVBQVUsSUFBSyxVQUFVLElBQUksT0FBTyxDQUFDLElBQVIsS0FBaUIsWUFBbEQsRUFBaUU7QUFDN0QsWUFBSSxTQUFTLEdBQUcsaUJBQUssWUFBTCxDQUFrQixPQUFsQixDQUFoQjs7QUFDQSxZQUFJLENBQUMsU0FBTCxFQUFnQjtBQUNaO0FBQ0g7O0FBQ0QsUUFBQSxLQUFLLEdBQUcsaUJBQUssY0FBTCxDQUFvQixTQUFwQixFQUErQixFQUEvQixFQUFtQyxFQUFuQyxDQUFSO0FBQ0g7O0FBRUQsVUFBSSxVQUFKLEVBQWdCO0FBQ1osUUFBQSxHQUFHLEdBQUcsbUJBQU8sUUFBUCxDQUFnQixLQUFLLENBQUMsWUFBRCxDQUFyQixDQUFOOztBQUNBLFlBQUksQ0FBQyxHQUFMLEVBQVU7QUFBRTtBQUFTOztBQUVyQixRQUFBLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBUjtBQUNBLFFBQUEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFSOztBQUVBLFlBQUksS0FBSyxDQUFDLFlBQUQsQ0FBTCxJQUF1QixLQUFLLENBQUMsYUFBRCxDQUFoQyxFQUFnRDtBQUM1QyxjQUFJLEtBQUssQ0FBQyxZQUFELENBQVQsRUFBeUI7QUFDckIsWUFBQSxDQUFDLEdBQUcsS0FBSyxDQUFDLFlBQUQsQ0FBVDtBQUNBLFlBQUEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFKLEdBQWEsQ0FBYixHQUFpQixHQUFHLENBQUMsS0FBekI7QUFDSDs7QUFDRCxjQUFJLEtBQUssQ0FBQyxhQUFELENBQVQsRUFBMEI7QUFDdEIsWUFBQSxDQUFDLEdBQUcsS0FBSyxDQUFDLGFBQUQsQ0FBVDs7QUFDQSxnQkFBSSxDQUFDLEtBQUssQ0FBQyxZQUFELENBQVYsRUFBMEI7QUFDdEIsY0FBQSxDQUFDLEdBQUcsR0FBRyxDQUFDLEtBQUosR0FBWSxDQUFaLEdBQWdCLEdBQUcsQ0FBQyxNQUF4QjtBQUNIO0FBQ0o7QUFDSjs7QUFDRCxZQUFLLEtBQUssQ0FBQyxlQUFELENBQUwsS0FBMkIsTUFBNUIsSUFDQSxRQUFRLENBQUMsWUFBVCxDQUFzQixLQUF0QixFQUE2QixDQUE3QixFQUFnQyxDQUFoQyxFQUFtQyxPQUFPLENBQUMsUUFBM0MsQ0FESixFQUMwRDtBQUN0RDtBQUNIO0FBQ0o7O0FBRUQsVUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFQLENBQU4sQ0FBbUIsSUFBbkIsRUFBWDs7QUFFQSxVQUFJLFVBQVUsSUFBSSxJQUFsQixFQUF3QjtBQUNwQiwwQkFBTSxTQUFOLENBQWdCLEdBQWhCLEVBQXFCO0FBQ2pCLFVBQUEsU0FBUyxFQUFFLEtBQUssQ0FBQyxrQkFBRCxDQUFMLEdBQTRCLENBRHRCO0FBRWpCLFVBQUEsSUFBSSxFQUFFLGtCQUFNLGFBQU4sQ0FBb0IsS0FBSyxDQUFDLGFBQUQsQ0FBekIsRUFBMEMsS0FBSyxDQUFDLFdBQUQsQ0FBL0MsRUFBOEQsS0FBOUQ7QUFGVyxTQUFyQjs7QUFLQSxZQUFJLElBQUksR0FBSSxLQUFLLENBQUMsY0FBTixDQUFxQixrQkFBckIsQ0FBWjs7QUFFQSwwQkFBTSxTQUFOLENBQWdCLEdBQWhCLEVBQXFCO0FBQ2pCLFVBQUEsU0FBUyxFQUFFLEtBQUssQ0FBQyxZQUFELENBQUwsSUFBdUIsU0FEakI7QUFFakIsVUFBQSxXQUFXLEVBQUUsS0FBSyxDQUFDLGlCQUFELENBQUwsSUFBNEIsU0FGeEI7QUFHakIsVUFBQSxXQUFXLEVBQUUsS0FBSyxDQUFDLGNBQUQsQ0FBTCxJQUF5QixLQUFLLENBQUMsT0FBL0IsSUFBMEMsQ0FIdEM7QUFJakIsVUFBQSxTQUFTLEVBQUUsUUFKTTtBQUtqQixVQUFBLFlBQVksRUFBRTtBQUxHLFNBQXJCOztBQVFBLFlBQUksS0FBSyxDQUFDLGdCQUFELENBQUwsS0FBNEIsV0FBaEMsRUFDSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQUwsRUFBUCxDQURKLEtBRUssSUFBSSxLQUFLLENBQUMsZ0JBQUQsQ0FBTCxLQUE0QixXQUFoQyxFQUNELElBQUksR0FBRyxJQUFJLENBQUMsV0FBTCxFQUFQLENBREMsS0FFQSxJQUFJLEtBQUssQ0FBQyxnQkFBRCxDQUFMLEtBQTRCLFlBQWhDLEVBQ0QsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFMLENBQWEsV0FBYixFQUEwQixVQUFTLEVBQVQsRUFBYTtBQUFFLGlCQUFPLEVBQUUsQ0FBQyxXQUFILEVBQVA7QUFBMEIsU0FBbkUsQ0FBUDs7QUFFSixZQUFJLE9BQU8sQ0FBQyxJQUFSLEtBQWlCLFNBQWpCLElBQThCLE9BQU8sQ0FBQyxJQUFSLEtBQWlCLE9BQW5ELEVBQTREO0FBQ3hELGNBQUksU0FBUyxHQUFHLEdBQUcsQ0FBQyxXQUFKLENBQWdCLElBQWhCLEVBQXNCLEtBQXRDO0FBQUEsY0FDSSxXQUFXLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxNQURuQztBQUFBLGNBRUksY0FBYyxHQUFHLFNBRnJCO0FBQUEsY0FHSSxlQUFlLEdBQUcsV0FBVyxHQUFHLEdBSHBDO0FBQUEsY0FJSSxNQUFNLEdBQUcsS0FBSyxDQUFDLGFBQUQsQ0FBTCxJQUF3QixDQUpyQzs7QUFNQSxjQUFLLEtBQUssQ0FBQyxvQkFBRCxDQUFMLEtBQWdDLE1BQWpDLElBQ0EsUUFBUSxDQUFDLFlBQVQsQ0FBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBRCxDQUFOLEVBQVcsS0FBSyxDQUFDLENBQUQsQ0FBTCxHQUFXLE1BQXRCLENBQXRCLEVBQXFELGNBQXJELEVBQXFFLGVBQXJFLEVBQXNGLE9BQU8sQ0FBQyxRQUE5RixDQURKLEVBQzZHO0FBQ3pHO0FBQ0g7O0FBRUQsY0FBSSxJQUFKLEVBQVU7QUFDTixZQUFBLEdBQUcsQ0FBQyxVQUFKLENBQWUsSUFBZixFQUFxQixLQUFLLENBQUMsQ0FBRCxDQUExQixFQUErQixLQUFLLENBQUMsQ0FBRCxDQUFMLEdBQVcsTUFBMUM7QUFDSDs7QUFDRCxVQUFBLEdBQUcsQ0FBQyxRQUFKLENBQWEsSUFBYixFQUFtQixLQUFLLENBQUMsQ0FBRCxDQUF4QixFQUE2QixLQUFLLENBQUMsQ0FBRCxDQUFMLEdBQVcsTUFBeEM7QUFFQSxjQUFJLE9BQU8sR0FBRyxLQUFLLENBQUMscUJBQUQsQ0FBTCxJQUFnQyxFQUE5QztBQUNBLFVBQUEsUUFBUSxDQUFDLFVBQVQsQ0FBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBRCxDQUFOLEVBQVcsS0FBSyxDQUFDLENBQUQsQ0FBTCxHQUFXLE1BQXRCLENBQXBCLEVBQW1ELGNBQW5ELEVBQW1FLGVBQW5FLEVBQW9GLE9BQXBGLEVBQTZGLE9BQU8sQ0FBQyxRQUFyRztBQUVILFNBcEJELE1Bb0JPLElBQUksT0FBTyxDQUFDLElBQVIsS0FBaUIsWUFBckIsRUFBbUM7QUFFdEMsY0FBSSxNQUFNLEdBQUcsaUJBQUssZUFBTCxDQUFxQixPQUFPLENBQUMsV0FBN0IsRUFBMEMsRUFBMUMsRUFBOEMsRUFBOUMsQ0FBYjs7QUFDQSxjQUFJLGdCQUFKLENBQWUsR0FBZixFQUFvQixNQUFwQixFQUE0QixJQUE1QixFQUFrQyxJQUFsQyxFQUF3QyxRQUF4QztBQUNIO0FBQ0o7O0FBRUQsVUFBSSxVQUFKLEVBQWdCO0FBQ1osUUFBQSxHQUFHLENBQUMsU0FBSixDQUFjLEdBQWQsRUFDSSxJQUFJLENBQUMsS0FBTCxDQUFXLEtBQUssQ0FBQyxDQUFELENBQUwsR0FBVyxDQUFDLEdBQUcsQ0FBMUIsQ0FESixFQUVJLElBQUksQ0FBQyxLQUFMLENBQVcsS0FBSyxDQUFDLENBQUQsQ0FBTCxHQUFXLENBQUMsR0FBRyxDQUExQixDQUZKLEVBRWtDLENBRmxDLEVBRXFDLENBRnJDO0FBSUEsWUFBSSxRQUFRLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxxQkFBRCxDQUFOLENBQVYsSUFBNEMsQ0FBM0Q7QUFDQSxRQUFBLFFBQVEsQ0FBQyxVQUFULENBQW9CLEtBQXBCLEVBQTJCLENBQTNCLEVBQThCLENBQTlCLEVBQWlDLFFBQWpDLEVBQTJDLE9BQU8sQ0FBQyxRQUFuRDtBQUNIO0FBQ0o7Ozs7Ozs7QUFDSjs7Ozs7Ozs7Ozs7Ozs7OztBQ3hHRCxJQUFJLGNBQWMsR0FBRyxJQUFyQjs7SUFFcUIsTTs7O0FBRWpCLG9CQUFjO0FBQUE7O0FBQ1YsUUFBSSxjQUFjLElBQUksSUFBdEIsRUFBNEI7QUFDeEIsTUFBQSxjQUFjLEdBQUcsSUFBakI7QUFDQSxXQUFLLE9BQUwsR0FBYyxFQUFkO0FBQ0EsV0FBSyxnQkFBTCxHQUF1QixFQUF2QjtBQUNBLFdBQUssT0FBTCxHQUFjLEVBQWQ7QUFDQSxXQUFLLFFBQUwsR0FBZSxFQUFmO0FBQ0EsV0FBSyxjQUFMLEdBQXFCLEVBQXJCO0FBQ0EsV0FBSyxXQUFMLEdBQWtCLEVBQWxCO0FBQ0EsV0FBSyxNQUFMLEdBQWEsRUFBYjtBQUNBLFdBQUssTUFBTCxHQUFhO0FBQUMsUUFBQSxHQUFHLEVBQUUsQ0FBTjtBQUFTLFFBQUEsSUFBSSxFQUFFO0FBQWYsT0FBYjtBQUNIOztBQUNELFdBQU8sY0FBUDtBQUNIOzs7OytCQTBPVSxJLEVBQU0sSSxFQUFNLEksRUFBTSxRLEVBQVU7QUFDbkMsVUFBSSxJQUFJLEdBQUcsRUFBWDtBQUFBLFVBQWUsQ0FBZjs7QUFDQSxXQUFLLENBQUMsR0FBRyxDQUFULEVBQVksQ0FBQyxHQUFHLEtBQUssY0FBTCxDQUFvQixNQUFwQyxFQUE0QyxDQUFDLEVBQTdDLEVBQWlEO0FBQzdDLFlBQUksSUFBSSxDQUFDLGNBQUwsQ0FBb0IsS0FBSyxjQUFMLENBQW9CLENBQXBCLENBQXBCLENBQUosRUFBaUQ7QUFDN0MsVUFBQSxJQUFJLENBQUMsSUFBTCxDQUFVLEtBQUssY0FBTCxDQUFvQixDQUFwQixDQUFWO0FBQ0g7QUFDSjs7QUFFRCxXQUFLLENBQUMsR0FBRyxDQUFULEVBQVksQ0FBQyxHQUFHLEtBQUssV0FBTCxDQUFpQixNQUFqQyxFQUF5QyxDQUFDLEVBQTFDLEVBQThDO0FBQzFDLFlBQUksSUFBSSxDQUFDLGNBQUwsQ0FBb0IsS0FBSyxXQUFMLENBQWlCLENBQWpCLENBQXBCLENBQUosRUFBOEM7QUFDMUMsVUFBQSxJQUFJLENBQUMsSUFBTCxDQUFVLEtBQUssV0FBTCxDQUFpQixDQUFqQixJQUFzQixHQUF0QixHQUE0QixJQUFJLENBQUMsS0FBSyxXQUFMLENBQWlCLENBQWpCLENBQUQsQ0FBMUM7QUFDSDtBQUNKOztBQUVELGFBQU8sQ0FBQyxJQUFELEVBQU8sSUFBUCxFQUFhLFFBQWIsRUFBdUIsSUFBSSxDQUFDLElBQUwsQ0FBVSxHQUFWLENBQXZCLEVBQXVDLElBQXZDLENBQTRDLEdBQTVDLENBQVA7QUFDSDs7OzRCQUNPLFUsRUFBWSxJLEVBQU0sSSxFQUFNLEksRUFBTSxRLEVBQVU7QUFDNUMsVUFBSSxDQUFKO0FBQUEsVUFBTyxHQUFHLEdBQUcsS0FBSyxVQUFMLENBQWdCLElBQWhCLEVBQXNCLElBQXRCLEVBQTRCLElBQTVCLEVBQWtDLFFBQWxDLENBQWI7QUFBQSxVQUEwRCxPQUFPLEdBQUcsS0FBSyxNQUFMLENBQVksR0FBWixLQUFvQixFQUF4Rjs7QUFFQSxVQUFJLENBQUMsS0FBSyxNQUFMLENBQVksY0FBWixDQUEyQixHQUEzQixDQUFMLEVBQXNDO0FBQ2xDLGFBQUssTUFBTCxDQUFZLElBQVosSUFBb0IsQ0FBcEI7O0FBQ0EsYUFBSyxDQUFDLEdBQUcsQ0FBVCxFQUFZLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBM0IsRUFBbUMsQ0FBQyxFQUFwQyxFQUF3QztBQUNwQyxVQUFBLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBUCxDQUFjLE9BQWQsQ0FBc0IsVUFBVSxDQUFDLENBQUQsQ0FBaEMsRUFBcUMsT0FBckMsQ0FBNkMsT0FBN0MsRUFBc0QsSUFBdEQsRUFBNEQsSUFBNUQsRUFBa0UsSUFBbEUsRUFBd0UsUUFBeEUsQ0FBVjtBQUNIOztBQUNELGFBQUssTUFBTCxDQUFZLEdBQVosSUFBbUIsT0FBbkI7QUFDSCxPQU5ELE1BTU87QUFDSCxhQUFLLE1BQUwsQ0FBWSxHQUFaLElBQW1CLENBQW5CO0FBQ0g7O0FBRUQsYUFBTyxPQUFQO0FBQ0g7Ozt3QkFsUXFCO0FBQ2xCLGFBQU8sS0FBSyxnQkFBWjtBQUNIOzs7OEJBRWdCLENBQ2hCOzs7bUNBRXFCLENBQ3JCO0FBQUE7Ozs7OztzQ0FHd0I7QUFDckIsV0FBSyxNQUFMLEdBQWMsRUFBZDtBQUNIOzs7O0FBRVk7QUFBUztBQUNsQixhQUFPLElBQUksQ0FBQyxHQUFMLENBQVMsS0FBVCxDQUFlLElBQWYsRUFBcUIsU0FBckIsQ0FBUDtBQUNIOzs7O0FBRVk7QUFBUztBQUNsQixhQUFPLElBQUksQ0FBQyxHQUFMLENBQVMsS0FBVCxDQUFlLElBQWYsRUFBcUIsU0FBckIsQ0FBUDtBQUNIOzs7O0FBQ1k7QUFBUztBQUNsQixVQUFJLENBQUo7O0FBRUEsV0FBSyxDQUFDLEdBQUcsQ0FBVCxFQUFZLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBMUIsRUFBa0MsQ0FBQyxFQUFuQyxFQUF1QztBQUNuQyxZQUFJLE9BQU8sU0FBUyxDQUFDLENBQUQsQ0FBaEIsS0FBeUIsV0FBekIsSUFBd0MsU0FBUyxDQUFDLENBQUQsQ0FBVCxLQUFpQixFQUE3RCxFQUFpRTtBQUM3RCxpQkFBTyxTQUFTLENBQUMsQ0FBRCxDQUFoQjtBQUNIO0FBQ0o7O0FBRUQsYUFBTyxFQUFQO0FBQ0g7OzswQkFDWSxHLEVBQUs7QUFDZCxVQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFELENBQVgsQ0FBVixFQUE2QjtBQUN6QixlQUFPLFVBQVUsQ0FBQyxHQUFELENBQWpCO0FBQ0gsT0FGRCxNQUVPO0FBQ0gsZUFBTyxFQUFQO0FBQ0g7QUFDSjs7OzBCQUNZLEcsRUFBSztBQUNkLGFBQU8sR0FBUDtBQUNIOzs7MEJBQ1ksRyxFQUFLO0FBQ2QsYUFBTyxRQUFRLENBQUMsR0FBRCxFQUFNLEVBQU4sQ0FBZjtBQUNIOzs7MEJBQ1ksRyxFQUFLLEcsRUFBSztBQUNuQixVQUFJLEdBQUcsQ0FBQyxjQUFKLENBQW1CLEdBQW5CLEtBQTJCLEdBQUcsQ0FBQyxHQUFELENBQUgsS0FBYSxJQUE1QyxFQUFrRDtBQUM5QyxlQUFPLEdBQVA7QUFDSCxPQUZELE1BRU87QUFDSCxlQUFPLEVBQVA7QUFDSDtBQUNKOzs7MkJBQ2EsRyxFQUFLLEcsRUFBSztBQUNwQixVQUFJLEdBQUcsQ0FBQyxjQUFKLENBQW1CLEdBQW5CLEtBQTJCLEdBQUcsQ0FBQyxHQUFELENBQUgsS0FBYSxJQUE1QyxFQUFrRDtBQUM5QyxlQUFPLEdBQUcsQ0FBQyxHQUFELENBQVY7QUFDSCxPQUZELE1BRU87QUFDSCxlQUFPLEVBQVA7QUFDSDtBQUNKOzs7MkJBQ2EsRyxFQUFLO0FBQ2YsYUFBTyxJQUFJLENBQUMsSUFBTCxDQUFVLEdBQVYsQ0FBUDtBQUNIOzs7OEJBQ2dCLEcsRUFBSyxNLEVBQVEsUSxFQUFVO0FBQ3BDLFVBQUksT0FBTyxNQUFQLEtBQW1CLFdBQXZCLEVBQW9DO0FBQ2hDLFFBQUEsTUFBTSxHQUFHLE1BQVQ7QUFDSDs7QUFFRCxVQUFJLE9BQU8sUUFBUCxLQUFxQixXQUF6QixFQUFzQztBQUNsQyxRQUFBLFFBQVEsR0FBRyxPQUFYO0FBQ0g7O0FBRUQsVUFBSSxHQUFHLEtBQUssR0FBUixJQUFlLEdBQUcsS0FBSyxPQUF2QixJQUFrQyxHQUFHLEtBQUssRUFBOUMsRUFBa0Q7QUFDOUMsZUFBTyxRQUFQO0FBQ0gsT0FGRCxNQUVPO0FBQ0gsZUFBTyxNQUFQO0FBQ0g7QUFDSjs7OzZCQUNlLEcsRUFBSztBQUNqQixVQUFJLFdBQVcsSUFBWCxDQUFnQixHQUFoQixDQUFKLEVBQTBCO0FBQ3RCLGVBQU8sT0FBTyxRQUFRLENBQUMsR0FBRCxFQUFNLEVBQU4sQ0FBdEI7QUFDSCxPQUZELE1BRU8sSUFBSSxXQUFXLElBQVgsQ0FBZ0IsR0FBaEIsQ0FBSixFQUEwQjtBQUM3QixlQUFPLE1BQU0sUUFBUSxDQUFDLEdBQUQsRUFBTSxFQUFOLENBQXJCO0FBQ0gsT0FGTSxNQUVBLElBQUksV0FBVyxJQUFYLENBQWdCLEdBQWhCLENBQUosRUFBMEI7QUFDN0IsZUFBTyxLQUFLLFFBQVEsQ0FBQyxHQUFELEVBQU0sRUFBTixDQUFwQjtBQUNILE9BRk0sTUFFQSxJQUFJLFdBQVcsSUFBWCxDQUFnQixHQUFoQixDQUFKLEVBQTBCO0FBQzdCLGVBQU8sUUFBUSxRQUFRLENBQUMsR0FBRCxFQUFNLEVBQU4sQ0FBdkI7QUFDSCxPQUZNLE1BRUEsSUFBSSxXQUFXLElBQVgsQ0FBZ0IsR0FBaEIsQ0FBSixFQUEwQjtBQUM3QixlQUFPLFNBQVMsUUFBUSxDQUFDLEdBQUQsRUFBTSxFQUFOLENBQXhCO0FBQ0gsT0FGTSxNQUVBLElBQUksV0FBVyxJQUFYLENBQWdCLEdBQWhCLENBQUosRUFBMEI7QUFDN0IsZUFBTyxTQUFTLFFBQVEsQ0FBQyxHQUFELEVBQU0sRUFBTixDQUF4QjtBQUNILE9BRk0sTUFFQTtBQUNILGVBQU8sUUFBUSxDQUFDLEdBQUQsRUFBTSxFQUFOLENBQWY7QUFDSDtBQUNKOzs7OEJBQ2lCLEcsRUFBSztBQUNuQixhQUFPLE1BQU0sQ0FBQyxNQUFQLENBQWMsUUFBZCxDQUF1QixHQUF2QixDQUFQO0FBQ0g7OzsrQkFDaUIsSSxFQUFNLEksRUFBTTtBQUMxQixVQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsTUFBUCxDQUFjLFFBQTVCO0FBQUEsVUFBc0MsQ0FBdEM7QUFBQSxVQUF5QyxHQUF6Qzs7QUFFQSxXQUFLLENBQUMsR0FBRyxDQUFULEVBQVksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUF4QixFQUFnQyxDQUFDLEVBQWpDLEVBQXFDO0FBQ2pDLFFBQUEsR0FBRyxHQUFHLElBQUksR0FBRyxHQUFQLEdBQWEsT0FBTyxDQUFDLENBQUQsQ0FBMUI7O0FBQ0EsWUFBSSxJQUFJLENBQUMsR0FBRCxDQUFSLEVBQWU7QUFDWCxpQkFBTyxJQUFJLENBQUMsR0FBRCxDQUFYO0FBQ0g7QUFDSjs7QUFFRCxhQUFPLElBQUksQ0FBQyxJQUFELENBQVg7QUFDSDs7OzhCQUVnQixLLEVBQU8sTyxFQUFTLGEsRUFBZSxlLEVBQWlCLGEsRUFBZSxVLEVBQVk7QUFDeEYsVUFBSSxDQUFKO0FBQ0EsTUFBQSxhQUFhLEdBQUcsYUFBYSxJQUFJLEVBQWpDO0FBQ0EsTUFBQSxlQUFlLEdBQUcsZUFBZSxJQUFJLEVBQXJDOztBQUVBLFVBQUksYUFBSixFQUFtQjtBQUNmLGFBQUssQ0FBQyxHQUFHLENBQVQsRUFBWSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQTlCLEVBQXNDLENBQUMsRUFBdkMsRUFBMkM7QUFDdkMsY0FBSSxNQUFNLENBQUMsTUFBUCxDQUFjLGNBQWQsQ0FBNkIsT0FBN0IsQ0FBcUMsYUFBYSxDQUFDLENBQUQsQ0FBbEQsSUFBeUQsQ0FBN0QsRUFBZ0U7QUFDNUQsWUFBQSxNQUFNLENBQUMsTUFBUCxDQUFjLGNBQWQsQ0FBNkIsSUFBN0IsQ0FBa0MsYUFBYSxDQUFDLENBQUQsQ0FBL0M7QUFDSDtBQUNKO0FBQ0o7O0FBRUQsVUFBSSxVQUFKLEVBQWdCO0FBQ1osYUFBSyxDQUFDLEdBQUcsQ0FBVCxFQUFZLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBM0IsRUFBbUMsQ0FBQyxFQUFwQyxFQUF3QztBQUNwQyxjQUFJLE1BQU0sQ0FBQyxNQUFQLENBQWMsV0FBZCxDQUEwQixPQUExQixDQUFrQyxVQUFVLENBQUMsQ0FBRCxDQUE1QyxJQUFtRCxDQUF2RCxFQUEwRDtBQUN0RCxZQUFBLE1BQU0sQ0FBQyxNQUFQLENBQWMsV0FBZCxDQUEwQixJQUExQixDQUErQixVQUFVLENBQUMsQ0FBRCxDQUF6QztBQUNIO0FBQ0o7QUFDSjs7QUFFRCxNQUFBLE1BQU0sQ0FBQyxNQUFQLENBQWMsT0FBZCxDQUFzQixLQUF0QixJQUErQjtBQUMzQixRQUFBLE9BQU8sRUFBRSxPQURrQjtBQUUzQixRQUFBLE1BQU0sRUFBRSxhQUZtQjtBQUczQixRQUFBLGVBQWUsRUFBRSxlQUhVO0FBSTNCLFFBQUEsUUFBUSxFQUFFLEVBSmlCO0FBSzNCLFFBQUEsYUFBYSxFQUFFLENBQUMsYUFMVztBQU0zQixRQUFBLHNCQUFzQixFQUFFLENBQUMsZUFBZSxDQUFDO0FBTmQsT0FBL0I7O0FBU0EsTUFBQSxNQUFNLENBQUMsTUFBUCxDQUFjLGdCQUFkLENBQStCLElBQS9CLENBQW9DLEtBQXBDO0FBQ0g7QUFBQTs7Ozs7OztrQ0FJb0IsSyxFQUFPO0FBQ3hCLFVBQUksTUFBTSxDQUFDLE1BQVAsQ0FBYyxPQUFkLENBQXNCLEtBQXRCLEVBQTZCLHNCQUE3QixJQUNJLE1BQU0sQ0FBQyxNQUFQLENBQWMsT0FBZCxDQUFzQixLQUF0QixFQUE2QixhQURyQyxFQUNvRDtBQUNoRCxRQUFBLE1BQU0sQ0FBQyxZQUFQO0FBQ0g7QUFDSjs7O3VDQUN5QixLLEVBQU8sRyxFQUFLO0FBRWxDLFVBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFQLENBQWMsT0FBZCxDQUFzQixLQUF0QixFQUE2QixPQUExQztBQUFBLFVBQ0ksR0FBRyxHQUFHLElBQUksS0FBSixFQURWO0FBR0EsYUFBTyxNQUFNLENBQUMsTUFBUCxDQUFjLE9BQWQsQ0FBc0IsS0FBdEIsRUFBNkIsT0FBcEM7O0FBRUEsTUFBQSxHQUFHLENBQUMsTUFBSixHQUFhLFlBQVk7QUFDckIsWUFBSSxLQUFKOztBQUNBLGFBQUssS0FBTCxJQUFjLE1BQWQsRUFBc0I7QUFDbEIsY0FBSSxNQUFNLENBQUMsY0FBUCxDQUFzQixLQUF0QixDQUFKLEVBQWtDO0FBQzlCLFlBQUEsTUFBTSxDQUFDLEtBQUQsQ0FBTixDQUFjLE1BQWQsR0FBdUIsR0FBdkI7QUFDQSxZQUFBLE1BQU0sQ0FBQyxNQUFQLENBQWMsT0FBZCxDQUFzQixLQUF0QixJQUErQixNQUFNLENBQUMsS0FBRCxDQUFyQztBQUNIO0FBQ0o7O0FBQ0QsUUFBQSxNQUFNLENBQUMsTUFBUCxDQUFjLE9BQWQsQ0FBc0IsS0FBdEIsRUFBNkIsYUFBN0IsR0FBNkMsSUFBN0M7O0FBQ0EsUUFBQSxNQUFNLENBQUMsYUFBUCxDQUFxQixLQUFyQjtBQUNILE9BVkQ7O0FBV0EsTUFBQSxHQUFHLENBQUMsT0FBSixHQUFjLFVBQVUsQ0FBVixFQUFhO0FBQ3ZCLFFBQUEsTUFBTSxDQUFDLE9BQVAsQ0FBZSxDQUFmO0FBQ0gsT0FGRDs7QUFHQSxNQUFBLEdBQUcsQ0FBQyxHQUFKLEdBQVUsR0FBVjtBQUNIOzs7MENBQzRCLEssRUFBTyxTLEVBQVc7QUFDM0MsVUFBSSxlQUFlLEdBQUcsTUFBTSxDQUFDLE1BQVAsQ0FBYyxPQUFkLENBQXNCLEtBQXRCLEVBQTZCLGVBQW5EO0FBQ0EsYUFBTyxNQUFNLENBQUMsTUFBUCxDQUFjLE9BQWQsQ0FBc0IsS0FBdEIsRUFBNkIsZUFBcEM7QUFFQSxNQUFBLFNBQVMsR0FBRyxTQUFTLElBQUksRUFBekI7QUFDQSxVQUFJLEdBQUcsR0FBRyxlQUFlLENBQUMsTUFBMUI7QUFBQSxVQUFrQyxNQUFNLEdBQUcsQ0FBM0M7QUFBQSxVQUE4QyxDQUE5Qzs7QUFFQSxlQUFTLFNBQVQsQ0FBbUIsR0FBbkIsRUFBd0I7QUFDcEIsWUFBSSxHQUFHLEdBQUcsSUFBSSxLQUFKLEVBQVY7O0FBQ0EsUUFBQSxHQUFHLENBQUMsTUFBSixHQUFhLFlBQVk7QUFDckIsVUFBQSxNQUFNO0FBQ04sVUFBQSxNQUFNLENBQUMsTUFBUCxDQUFjLE9BQWQsQ0FBc0IsR0FBdEIsSUFBNkI7QUFDekIsWUFBQSxNQUFNLEVBQUUsR0FEaUI7QUFFekIsWUFBQSxNQUFNLEVBQUUsR0FBRyxDQUFDLE1BRmE7QUFHekIsWUFBQSxLQUFLLEVBQUUsR0FBRyxDQUFDLEtBSGM7QUFJekIsWUFBQSxNQUFNLEVBQUU7QUFKaUIsV0FBN0I7O0FBTUEsY0FBSSxNQUFNLEtBQUssR0FBZixFQUFvQjtBQUNoQixZQUFBLE1BQU0sQ0FBQyxNQUFQLENBQWMsT0FBZCxDQUFzQixLQUF0QixFQUE2QixzQkFBN0IsR0FBc0QsSUFBdEQ7O0FBQ0EsWUFBQSxNQUFNLENBQUMsYUFBUCxDQUFxQixLQUFyQjtBQUNIO0FBQ0osU0FaRDs7QUFhQSxRQUFBLEdBQUcsQ0FBQyxPQUFKLEdBQWMsWUFBWTtBQUN0QixVQUFBLE1BQU07O0FBQ04sY0FBSSxNQUFNLEtBQUssR0FBZixFQUFvQjtBQUNoQixZQUFBLE1BQU0sQ0FBQyxNQUFQLENBQWMsT0FBZCxDQUFzQixLQUF0QixFQUE2QixzQkFBN0IsR0FBc0QsSUFBdEQ7O0FBQ0EsWUFBQSxNQUFNLENBQUMsYUFBUCxDQUFxQixLQUFyQjtBQUNIO0FBQ0osU0FORDs7QUFPQSxRQUFBLEdBQUcsQ0FBQyxHQUFKLEdBQVUsR0FBVjtBQUNIOztBQUVELFdBQUssQ0FBQyxHQUFHLENBQVQsRUFBWSxDQUFDLEdBQUcsR0FBaEIsRUFBcUIsQ0FBQyxFQUF0QixFQUEwQjtBQUN0QixRQUFBLFNBQVMsQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFDLENBQUQsQ0FBNUIsQ0FBVDtBQUNIO0FBQ0o7Ozs2QkFDZSxHLEVBQUs7QUFDakIsVUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQVAsQ0FBYyxPQUFkLENBQXNCLEdBQXRCLENBQVY7O0FBRUEsVUFBSSxHQUFHLElBQUksR0FBRyxDQUFDLE1BQWYsRUFBdUI7QUFDbkIsWUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQVQsQ0FBdUIsUUFBdkIsQ0FBYjtBQUNBLFFBQUEsTUFBTSxDQUFDLEtBQVAsR0FBZSxHQUFHLENBQUMsS0FBbkI7QUFDQSxRQUFBLE1BQU0sQ0FBQyxNQUFQLEdBQWdCLEdBQUcsQ0FBQyxNQUFwQjtBQUVBLFFBQUEsTUFBTSxDQUFDLFVBQVAsQ0FBa0IsSUFBbEIsRUFBd0IsU0FBeEIsQ0FBa0MsR0FBRyxDQUFDLE1BQXRDLEVBQ1EsQ0FEUixFQUNXLEdBQUcsQ0FBQyxNQURmLEVBQ3VCLEdBQUcsQ0FBQyxLQUQzQixFQUNrQyxHQUFHLENBQUMsTUFEdEMsRUFFUSxDQUZSLEVBRVcsQ0FGWCxFQUVjLEdBQUcsQ0FBQyxLQUZsQixFQUV5QixHQUFHLENBQUMsTUFGN0I7QUFJQSxRQUFBLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBUCxDQUFjLE9BQWQsQ0FBc0IsR0FBdEIsSUFBNkIsTUFBbkM7QUFDSDs7QUFFRCxhQUFPLEdBQVA7QUFDSDs7O3dCQXZPbUI7QUFDaEIsYUFBTyxJQUFJLE1BQUosRUFBUDtBQUNIOzs7Ozs7Ozs7Ozs7Ozs7O0FDckJMOzs7Ozs7Ozs7O0lBRXFCLFU7OztBQUVqQix3QkFBYztBQUFBOztBQUNWLFNBQUssYUFBTCxHQUFxQixFQUFyQjtBQUNBLFNBQUssZUFBTCxHQUF1QixFQUF2QjtBQUNBLFNBQUssYUFBTCxHQUFxQixDQUFDLE1BQUQsQ0FBckI7QUFDQSxTQUFLLFVBQUwsR0FBa0IsQ0FBQyxPQUFELEVBQVUsU0FBVixFQUFxQixJQUFyQixFQUEyQixXQUEzQixFQUF3QyxNQUF4QyxFQUFnRCxTQUFoRCxFQUEyRCxTQUEzRCxFQUFzRSxTQUF0RSxFQUFpRixrQkFBakYsRUFBcUcsWUFBckcsRUFBbUgsU0FBbkgsRUFBOEgsVUFBOUgsRUFBMEksU0FBMUksRUFBcUosU0FBckosRUFBZ0ssU0FBaEssRUFBMkssUUFBM0ssRUFBcUwsU0FBckwsRUFBZ00sUUFBaE0sRUFBME0sVUFBMU0sRUFBc04sU0FBdE4sRUFBaU8sYUFBak8sRUFBZ1AsV0FBaFAsRUFBNlAsTUFBN1AsRUFBcVEsVUFBclEsRUFBaVIsT0FBalIsRUFBMFIsYUFBMVIsRUFBeVMsU0FBelMsRUFBb1QsS0FBcFQsRUFBMlQsZUFBM1QsRUFBNFUsU0FBNVUsRUFBdVYsVUFBdlYsRUFBbVcsU0FBblcsQ0FBbEI7O0FBRUEsdUJBQU8sU0FBUCxDQUFpQixnQkFBakIsRUFBbUMsS0FBSyxPQUF4QyxFQUFpRCxLQUFLLGFBQXRELEVBQXFFLEtBQUssZUFBMUUsRUFBMkYsS0FBSyxhQUFoRyxFQUErRyxLQUFLLFVBQXBIOztBQUNBLHVCQUFPLHFCQUFQLENBQTZCLGdCQUE3QjtBQUNIOzs7OzRCQUVPLEssRUFBTyxJLEVBQU0sSSxFQUFNLEksRUFBTSxRLEVBQVU7QUFDdkMsVUFBSSxTQUFTLEdBQUcsRUFBaEI7QUFBQSxVQUFvQixZQUFZLEdBQUcsRUFBbkM7QUFBQSxVQUF1QyxPQUFPLEdBQUcsRUFBakQ7QUFBQSxVQUFxRCxPQUFPLEdBQUcsRUFBL0Q7O0FBRUEsVUFBSSxJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFlBQXhCLEVBQ047QUFDVSxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsQ0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsQ0FBdkI7QUFDVDs7QUFHRCxVQUFJLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsT0FBeEIsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixDQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUVELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUFwQixJQUErQixRQUFRLEtBQUssTUFBaEQsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixDQUF2QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUVELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixVQUF4QixFQUNBO0FBQ1UsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLENBQXZCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ1Q7O0FBRUQsVUFBSSxJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFVBQXBCLElBQWtDLFFBQVEsS0FBSyxNQUFuRCxFQUNBO0FBQ1UsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLENBQXZCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ1Q7O0FBRUQsVUFBSSxJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE9BQXhCLEVBQ0E7QUFDVSxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsQ0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDVDs7QUFHRCxVQUFJLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsVUFBeEIsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixDQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUdELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixTQUFwQixJQUFpQyxRQUFRLEtBQUssTUFBbEQsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUVELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixNQUFwQixJQUE4QixRQUFRLElBQUksTUFBOUMsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixDQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUVELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUFwQixJQUErQixRQUFRLEtBQUssTUFBaEQsRUFDQTtBQUVVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUdELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixhQUFwQixJQUFxQyxRQUFRLEtBQUssTUFBdEQsRUFDQTtBQUVVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixNQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUdELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUFwQixJQUFnQyxRQUFRLEtBQUssTUFBakQsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUVELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixNQUFwQixJQUErQixRQUFRLEtBQUssTUFBaEQsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixHQUF2QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixHQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFFBQUQsQ0FBVCxHQUFzQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQXRCO0FBQ1Q7O0FBRUQsVUFBSSxJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFVBQXBCLElBQW1DLFFBQVEsS0FBSyxNQUFwRCxFQUNBO0FBQ1UsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLEdBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLEdBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEdBQXZCO0FBQ0EsUUFBQSxTQUFTLENBQUMsUUFBRCxDQUFULEdBQXNCLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBdEI7QUFDVDs7QUFHRCxVQUFJLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsYUFBcEIsSUFBcUMsUUFBUSxLQUFLLE1BQXRELEVBQ0E7QUFDVSxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsU0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsR0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsR0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxRQUFELENBQVQsR0FBc0IsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUF0QjtBQUNUOztBQUVELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixNQUFwQixJQUErQixRQUFRLEtBQUssTUFBaEQsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixHQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUVELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUFwQixJQUFnQyxRQUFRLEtBQUssTUFBakQsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUNELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixRQUFwQixJQUFpQyxRQUFRLEtBQUssTUFBbEQsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixHQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUNELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixJQUFtQixVQUFuQixJQUFrQyxRQUFRLElBQUksTUFBbEQsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixDQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUVELFVBQUksSUFBSSxDQUFDLFNBQUQsQ0FBSixJQUFtQixXQUFuQixJQUFtQyxRQUFRLElBQUksTUFBbkQsRUFDQTtBQUNVLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixDQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUVELFVBQUcsSUFBSSxDQUFDLFNBQUQsQ0FBSixJQUFtQixNQUFuQixJQUE2QixRQUFRLElBQUksTUFBNUMsRUFBb0Q7QUFDMUMsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLENBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ1Q7O0FBRUQsVUFBRyxJQUFJLENBQUMsVUFBRCxDQUFKLEtBQXFCLEtBQXhCLEVBQStCO0FBQ3JCLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixHQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFFBQUQsQ0FBVCxHQUFzQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQXRCO0FBQ1Q7O0FBRUQsVUFBRyxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsTUFBRCxDQUFKLEtBQWlCLEtBQW5DLElBQTRDLElBQUksR0FBRyxFQUF0RCxFQUEyRDtBQUNqRCxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsU0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsR0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDVDs7QUFFRCxVQUFHLElBQUksQ0FBQyxNQUFELENBQUosS0FBaUIsS0FBakIsSUFBMEIsSUFBSSxHQUFHLEVBQWpDLElBQXVDLElBQUksSUFBSSxFQUFsRCxFQUFzRDtBQUM1QyxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsU0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsQ0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDVDs7QUFFRCxVQUFHLElBQUksQ0FBQyxNQUFELENBQUosS0FBaUIsS0FBakIsSUFBMkIsSUFBSSxJQUFJLEVBQXRDLEVBQTJDO0FBQ2pDLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixHQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUVELFVBQUcsSUFBSSxDQUFDLE1BQUQsQ0FBSixJQUFnQixFQUFuQixFQUF3QjtBQUNkLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixHQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNUOztBQUVELFVBQUcsSUFBSSxDQUFDLE1BQUQsQ0FBSixJQUFnQixLQUFoQixJQUF5QixRQUFRLElBQUksTUFBeEMsRUFBZ0Q7QUFDdEMsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLENBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ1Q7O0FBRUQsVUFBSSxJQUFJLENBQUMsVUFBRCxDQUFKLEtBQXFCLEtBQXJCLElBQThCLFFBQVEsSUFBSSxNQUE5QyxFQUNBO0FBQ1UsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLENBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLEdBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLENBQXZCO0FBQ1Q7O0FBRUssVUFBTSxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFdBQWpELEVBQWdFO0FBQzVELFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGlCQUFELENBQVQsR0FBK0IsUUFBL0I7QUFDSDs7QUFFRCxVQUFNLFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsU0FBakQsRUFBOEQ7QUFDMUQsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0g7O0FBRUQsVUFBTSxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE1BQWpELEVBQTJEO0FBQ3ZELFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixDQUF2QjtBQUNIOztBQUVELFVBQU0sUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixRQUE3QyxJQUE2RCxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFNBQTVHLEVBQXlIO0FBQ3JILFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixDQUF2QjtBQUNIOztBQUVELFVBQU0sUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUFqRCxFQUE0RDtBQUN4RCxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsQ0FBdkI7QUFDSDs7QUFFRCxVQUFNLFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsT0FBakQsRUFBNEQ7QUFDeEQsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLENBQXZCO0FBQ0g7O0FBRUQsVUFBTSxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFlBQTdDLElBQWlFLFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsVUFBaEgsRUFBOEg7QUFDMUgsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLENBQXZCO0FBQ0g7O0FBRUQsVUFBTSxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFNBQWpELEVBQThEO0FBQzFELFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixDQUF2QjtBQUNIOztBQUdELFVBQU0sUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixRQUE3QyxJQUE2RCxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE1BQXhHLElBQXNILFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsUUFBakssSUFBaUwsUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixNQUFoTyxFQUEwTztBQUN0TyxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsQ0FBdkI7QUFDSDs7QUFFRCxVQUFNLFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsU0FBNUMsSUFBMEQsSUFBSSxJQUFJLEVBQXZFLEVBQTRFO0FBQ3hFLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixDQUF2QjtBQUNIOztBQUVELFVBQU0sUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixRQUE3QyxJQUE2RCxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE1BQTVDLElBQXVELElBQUksSUFBSSxFQUEzSCxJQUFvSSxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFFBQS9LLElBQStMLFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsTUFBOU8sRUFBd1A7QUFDcFAsUUFBQSxTQUFTLENBQUMsTUFBRCxDQUFULEdBQW9CLG1CQUFPLFVBQVAsQ0FBa0IsSUFBbEIsRUFBd0IsTUFBeEIsQ0FBcEI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxhQUFELENBQVQsR0FBMkIsQ0FBM0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxXQUFELENBQVQsR0FBeUIsSUFBekI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxhQUFELENBQVQsR0FBMkIscUJBQTNCO0FBQ0EsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLE9BQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsb0JBQUQsQ0FBVCxHQUFrQyxPQUFsQztBQUNBLFFBQUEsU0FBUyxDQUFDLGtCQUFELENBQVQsR0FBZ0MsQ0FBaEM7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLFNBQS9CO0FBQ0EsUUFBQSxTQUFTLENBQUMsd0JBQUQsQ0FBVCxHQUFzQyxJQUF0QztBQUNIOztBQUVELFVBQU0sUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUE3QyxJQUE0RCxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE9BQXZHLElBQXNILFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsUUFBakssSUFBaUwsUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixRQUE1TixJQUE0TyxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLG1CQUEzUixFQUFrVDtBQUM5UyxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsQ0FBdkI7QUFDSDs7QUFFRCxVQUFNLFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsU0FBakQsRUFBOEQ7QUFDMUQsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLENBQXZCO0FBQ0g7O0FBRUQsVUFBTSxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFVBQTdDLElBQStELFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsTUFBMUcsSUFBd0gsUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUF2SyxFQUFrTDtBQUM5SyxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsQ0FBdkI7QUFDSDs7QUFFRCxVQUFNLFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsVUFBakQsRUFBK0Q7QUFDM0QsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLENBQXZCO0FBQ0g7O0FBRUQsVUFBTSxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFdBQWpELEVBQWdFO0FBQzVELFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixHQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixDQUF2QjtBQUNIOztBQUVELFVBQU0sUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixTQUE3QyxJQUE4RCxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE9BQTdHLEVBQXdIO0FBQ3BILFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixDQUF2QjtBQUNIOztBQUVELFVBQU0sSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFVBQUQsQ0FBSixLQUFxQixPQUE3QyxFQUF3RDtBQUNwRCxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsU0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsR0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsQ0FBdkI7QUFDSDs7QUFFRCxVQUFNLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxVQUFELENBQUosS0FBcUIsUUFBN0MsRUFBeUQ7QUFDckQsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLEdBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLENBQXZCO0FBQ0g7O0FBRUQsVUFBTSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsVUFBRCxDQUFKLEtBQXFCLE9BQTdDLEVBQXdEO0FBQ3BELFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixHQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixDQUF2QjtBQUNIOztBQUVELFVBQU0sUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFVBQUQsQ0FBSixLQUFxQixXQUE5QyxJQUFpRSxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE9BQTVHLElBQTJILFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsV0FBMUssRUFBeUw7QUFDckwsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLEdBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLENBQXZCO0FBQ0g7O0FBRUQsVUFBTSxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE9BQWpELEVBQTREO0FBQ3hELFFBQUEsU0FBUyxDQUFDLE1BQUQsQ0FBVCxHQUFvQixtQkFBTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCLE1BQXhCLENBQXBCO0FBQ0EsUUFBQSxTQUFTLENBQUMsYUFBRCxDQUFULEdBQTJCLENBQTNCO0FBQ0EsUUFBQSxTQUFTLENBQUMsV0FBRCxDQUFULEdBQXlCLElBQXpCO0FBQ0EsUUFBQSxTQUFTLENBQUMsYUFBRCxDQUFULEdBQTJCLHFCQUEzQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLG9CQUFELENBQVQsR0FBa0MsT0FBbEM7QUFDQSxRQUFBLFNBQVMsQ0FBQyxrQkFBRCxDQUFULEdBQWdDLENBQWhDO0FBQ0EsUUFBQSxTQUFTLENBQUMsaUJBQUQsQ0FBVCxHQUErQixTQUEvQjtBQUNIOztBQUVELFVBQU0sSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixjQUE1QyxFQUE4RDtBQUMxRCxRQUFBLFNBQVMsQ0FBQyxNQUFELENBQVQsR0FBb0IsbUJBQU8sVUFBUCxDQUFrQixJQUFsQixFQUF3QixNQUF4QixDQUFwQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGVBQUQsQ0FBVCxHQUE2QixNQUE3QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGFBQUQsQ0FBVCxHQUEyQixrQkFBM0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxXQUFELENBQVQsR0FBeUIsR0FBekI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxrQkFBRCxDQUFULEdBQWdDLENBQWhDO0FBQ0EsUUFBQSxTQUFTLENBQUMsaUJBQUQsQ0FBVCxHQUErQixTQUEvQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGtCQUFELENBQVQsR0FBZ0MsQ0FBaEM7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLFNBQS9CO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLEdBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLFNBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLENBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ0EsUUFBQSxTQUFTLENBQUMsUUFBRCxDQUFULEdBQXNCLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBdEI7QUFDSDs7QUFFRCxVQUFNLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsY0FBNUMsRUFBOEQ7QUFDMUQsUUFBQSxTQUFTLENBQUMsTUFBRCxDQUFULEdBQW9CLG1CQUFPLFVBQVAsQ0FBa0IsSUFBbEIsRUFBd0IsTUFBeEIsQ0FBcEI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxlQUFELENBQVQsR0FBNkIsTUFBN0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxhQUFELENBQVQsR0FBMkIsa0JBQTNCO0FBQ0EsUUFBQSxTQUFTLENBQUMsV0FBRCxDQUFULEdBQXlCLEdBQXpCO0FBQ0EsUUFBQSxTQUFTLENBQUMsa0JBQUQsQ0FBVCxHQUFnQyxDQUFoQztBQUNBLFFBQUEsU0FBUyxDQUFDLGlCQUFELENBQVQsR0FBK0IsU0FBL0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxrQkFBRCxDQUFULEdBQWdDLENBQWhDO0FBQ0EsUUFBQSxTQUFTLENBQUMsaUJBQUQsQ0FBVCxHQUErQixTQUEvQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixTQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixDQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFFBQUQsQ0FBVCxHQUFzQixDQUFDLENBQUQsRUFBSSxDQUFKLENBQXRCO0FBQ0g7O0FBRUQsVUFBTSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFNBQXhDLElBQXlELElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsTUFBL0YsSUFBNkcsSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixVQUFuSixJQUFxSyxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFlBQS9NLEVBQStOO0FBQzNOLFFBQUEsU0FBUyxDQUFDLE1BQUQsQ0FBVCxHQUFvQixtQkFBTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCLE1BQXhCLENBQXBCO0FBQ0EsUUFBQSxTQUFTLENBQUMsZUFBRCxDQUFULEdBQTZCLE1BQTdCO0FBQ0EsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsYUFBRCxDQUFULEdBQTJCLGtCQUEzQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFdBQUQsQ0FBVCxHQUF5QixHQUF6QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGtCQUFELENBQVQsR0FBZ0MsQ0FBaEM7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLFNBQS9CO0FBQ0EsUUFBQSxTQUFTLENBQUMsa0JBQUQsQ0FBVCxHQUFnQyxDQUFoQztBQUNBLFFBQUEsU0FBUyxDQUFDLGlCQUFELENBQVQsR0FBK0IsU0FBL0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsR0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsU0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsR0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsU0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxRQUFELENBQVQsR0FBc0IsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUF0QjtBQUNIOztBQUVELFVBQU0sSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUE1QyxFQUF1RDtBQUNuRCxRQUFBLFNBQVMsQ0FBQyxNQUFELENBQVQsR0FBb0IsbUJBQU8sVUFBUCxDQUFrQixJQUFsQixFQUF3QixNQUF4QixDQUFwQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGVBQUQsQ0FBVCxHQUE2QixNQUE3QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGFBQUQsQ0FBVCxHQUEyQixrQkFBM0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxXQUFELENBQVQsR0FBeUIsR0FBekI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxrQkFBRCxDQUFULEdBQWdDLENBQWhDO0FBQ0EsUUFBQSxTQUFTLENBQUMsaUJBQUQsQ0FBVCxHQUErQixTQUEvQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGtCQUFELENBQVQsR0FBZ0MsQ0FBaEM7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLFNBQS9CO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLEdBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLFNBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLENBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ0EsUUFBQSxTQUFTLENBQUMsUUFBRCxDQUFULEdBQXNCLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBdEI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsTUFBdkI7QUFDSDs7QUFFRCxVQUFNLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsTUFBeEMsSUFBc0QsSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUFoRyxFQUEyRztBQUN2RyxRQUFBLFNBQVMsQ0FBQyxNQUFELENBQVQsR0FBb0IsbUJBQU8sVUFBUCxDQUFrQixJQUFsQixFQUF3QixNQUF4QixDQUFwQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGVBQUQsQ0FBVCxHQUE2QixNQUE3QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGFBQUQsQ0FBVCxHQUEyQixrQkFBM0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxXQUFELENBQVQsR0FBeUIsR0FBekI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxrQkFBRCxDQUFULEdBQWdDLENBQWhDO0FBQ0EsUUFBQSxTQUFTLENBQUMsaUJBQUQsQ0FBVCxHQUErQixTQUEvQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixHQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixTQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixDQUF2QjtBQUNIOztBQUVELFVBQU0sSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixNQUF4QyxJQUFzRCxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE9BQWhHLEVBQTJHO0FBQ3ZHLFFBQUEsU0FBUyxDQUFDLE1BQUQsQ0FBVCxHQUFvQixtQkFBTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCLE1BQXhCLENBQXBCO0FBQ0EsUUFBQSxTQUFTLENBQUMsZUFBRCxDQUFULEdBQTZCLE1BQTdCO0FBQ0EsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsYUFBRCxDQUFULEdBQTJCLGtCQUEzQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFdBQUQsQ0FBVCxHQUF5QixHQUF6QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGtCQUFELENBQVQsR0FBZ0MsQ0FBaEM7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLFNBQS9CO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLEdBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLEdBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLFNBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLENBQXZCO0FBQ0g7O0FBRUQsVUFBSSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFNBQTFDLEVBQXFEO0FBQ2pELFFBQUEsU0FBUyxDQUFDLE1BQUQsQ0FBVCxHQUFvQixtQkFBTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCLE1BQXhCLENBQXBCO0FBQ0EsUUFBQSxTQUFTLENBQUMsZUFBRCxDQUFULEdBQTZCLE1BQTdCO0FBQ0EsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsYUFBRCxDQUFULEdBQTJCLGtCQUEzQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFdBQUQsQ0FBVCxHQUF5QixHQUF6QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGtCQUFELENBQVQsR0FBZ0MsQ0FBaEM7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLFNBQS9CO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLEdBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLEdBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLFNBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ0g7O0FBRUQsVUFBTSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLGFBQXZDLElBQXlELElBQUksS0FBSyxFQUFuRSxJQUE0RSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLGNBQXZDLElBQTBELElBQUksS0FBSyxFQUE5SSxJQUF1SixJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLGVBQXZDLElBQTJELElBQUksS0FBSyxFQUExTixJQUFtTyxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFNBQXRDLEtBQW9ELElBQUksQ0FBQyxlQUFELENBQUosS0FBMEIsSUFBMUIsSUFBa0MsSUFBSSxDQUFDLGVBQUQsQ0FBSixLQUEwQixPQUE1RCxJQUF1RSxJQUFJLENBQUMsZUFBRCxDQUFKLEtBQTBCLElBQXJKLEtBQThKLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsZUFBbkwsSUFBdU0sSUFBSSxLQUFLLEVBQXRiLEVBQTJiO0FBQ3ZiLFFBQUEsU0FBUyxDQUFDLE1BQUQsQ0FBVCxHQUFvQixtQkFBTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCLE1BQXhCLENBQXBCO0FBQ0EsUUFBQSxTQUFTLENBQUMsZUFBRCxDQUFULEdBQTZCLE1BQTdCO0FBQ0EsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsYUFBRCxDQUFULEdBQTJCLGtCQUEzQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFdBQUQsQ0FBVCxHQUF5QixHQUF6QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGtCQUFELENBQVQsR0FBZ0MsQ0FBaEM7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLFNBQS9CO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLEdBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLEdBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLFNBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ0g7O0FBRUQsVUFBTSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLGFBQXhDLElBQTZELElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsY0FBbkcsSUFBeUgsSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixlQUEvSixJQUFzTCxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFNBQXRDLEtBQW9ELElBQUksQ0FBQyxlQUFELENBQUosS0FBMEIsSUFBMUIsSUFBa0MsSUFBSSxDQUFDLGVBQUQsQ0FBSixLQUEwQixPQUE1RCxJQUF1RSxJQUFJLENBQUMsZUFBRCxDQUFKLEtBQTBCLElBQXJKLEtBQThKLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsZUFBNVcsRUFBK1g7QUFDM1gsUUFBQSxTQUFTLENBQUMsTUFBRCxDQUFULEdBQW9CLG1CQUFPLFVBQVAsQ0FBa0IsSUFBbEIsRUFBd0IsTUFBeEIsQ0FBcEI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxlQUFELENBQVQsR0FBNkIsTUFBN0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxhQUFELENBQVQsR0FBMkIsa0JBQTNCO0FBQ0EsUUFBQSxTQUFTLENBQUMsV0FBRCxDQUFULEdBQXlCLEdBQXpCO0FBQ0EsUUFBQSxTQUFTLENBQUMsa0JBQUQsQ0FBVCxHQUFnQyxDQUFoQztBQUNBLFFBQUEsU0FBUyxDQUFDLGlCQUFELENBQVQsR0FBK0IsU0FBL0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsR0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsU0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsR0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsU0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDSDs7QUFFRCxVQUFNLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsV0FBdkMsSUFBdUQsSUFBSSxLQUFLLEVBQWpFLElBQTBFLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsZ0JBQXZDLElBQTRELElBQUksS0FBSyxFQUE5SSxJQUF1SixJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFVBQXZDLElBQXNELElBQUksS0FBSyxFQUFyTixJQUE4TixJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLGVBQXZDLElBQTJELElBQUksS0FBSyxFQUFyUyxFQUEwUztBQUN0UyxRQUFBLFNBQVMsQ0FBQyxNQUFELENBQVQsR0FBb0IsbUJBQU8sVUFBUCxDQUFrQixJQUFsQixFQUF3QixNQUF4QixDQUFwQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGVBQUQsQ0FBVCxHQUE2QixNQUE3QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGFBQUQsQ0FBVCxHQUEyQixrQkFBM0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxXQUFELENBQVQsR0FBeUIsR0FBekI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxrQkFBRCxDQUFULEdBQWdDLENBQWhDO0FBQ0EsUUFBQSxTQUFTLENBQUMsaUJBQUQsQ0FBVCxHQUErQixTQUEvQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixDQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixTQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNIOztBQUVELFVBQU0sSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixXQUF2QyxJQUF1RCxJQUFJLEtBQUssRUFBakUsSUFBMEUsSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixnQkFBdkMsSUFBNEQsSUFBSSxLQUFLLEVBQTlJLElBQXVKLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsVUFBdkMsSUFBc0QsSUFBSSxLQUFLLEVBQXJOLElBQThOLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsZUFBdkMsSUFBMkQsSUFBSSxLQUFLLEVBQXJTLEVBQTBTO0FBQ3RTLFFBQUEsU0FBUyxDQUFDLE1BQUQsQ0FBVCxHQUFvQixtQkFBTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCLE1BQXhCLENBQXBCO0FBQ0EsUUFBQSxTQUFTLENBQUMsZUFBRCxDQUFULEdBQTZCLE1BQTdCO0FBQ0EsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsYUFBRCxDQUFULEdBQTJCLGtCQUEzQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFdBQUQsQ0FBVCxHQUF5QixHQUF6QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGtCQUFELENBQVQsR0FBZ0MsQ0FBaEM7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLFNBQS9CO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLENBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLEdBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLFNBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ0g7O0FBRUQsVUFBTSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFdBQXZDLElBQXVELElBQUksS0FBSyxFQUFqRSxJQUEwRSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLGdCQUF2QyxJQUE0RCxJQUFJLEtBQUssRUFBOUksSUFBdUosSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixVQUF2QyxJQUFzRCxJQUFJLEtBQUssRUFBck4sSUFBOE4sSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixlQUF2QyxJQUEyRCxJQUFJLEtBQUssRUFBclMsRUFBMFM7QUFDdFMsUUFBQSxTQUFTLENBQUMsTUFBRCxDQUFULEdBQW9CLG1CQUFPLFVBQVAsQ0FBa0IsSUFBbEIsRUFBd0IsTUFBeEIsQ0FBcEI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxlQUFELENBQVQsR0FBNkIsTUFBN0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxhQUFELENBQVQsR0FBMkIsa0JBQTNCO0FBQ0EsUUFBQSxTQUFTLENBQUMsV0FBRCxDQUFULEdBQXlCLEdBQXpCO0FBQ0EsUUFBQSxTQUFTLENBQUMsa0JBQUQsQ0FBVCxHQUFnQyxDQUFoQztBQUNBLFFBQUEsU0FBUyxDQUFDLGlCQUFELENBQVQsR0FBK0IsU0FBL0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsQ0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsU0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsR0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsU0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDSDs7QUFFRCxVQUFNLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsU0FBdkMsSUFBcUQsSUFBSSxLQUFLLEVBQS9ELElBQXdFLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsY0FBdkMsSUFBMEQsSUFBSSxLQUFLLEVBQTlJLEVBQW1KO0FBQy9JLFFBQUEsU0FBUyxDQUFDLE1BQUQsQ0FBVCxHQUFvQixtQkFBTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCLE1BQXhCLENBQXBCO0FBQ0EsUUFBQSxTQUFTLENBQUMsZUFBRCxDQUFULEdBQTZCLE1BQTdCO0FBQ0EsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsYUFBRCxDQUFULEdBQTJCLGtCQUEzQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFdBQUQsQ0FBVCxHQUF5QixHQUF6QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGtCQUFELENBQVQsR0FBZ0MsQ0FBaEM7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLFNBQS9CO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLENBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLEdBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLFNBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ0g7O0FBRUQsVUFBTSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFNBQXZDLElBQXFELElBQUksS0FBSyxFQUEvRCxJQUF3RSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLGNBQXZDLElBQTBELElBQUksS0FBSyxFQUE5SSxFQUFtSjtBQUMvSSxRQUFBLFNBQVMsQ0FBQyxNQUFELENBQVQsR0FBb0IsbUJBQU8sVUFBUCxDQUFrQixJQUFsQixFQUF3QixNQUF4QixDQUFwQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGVBQUQsQ0FBVCxHQUE2QixNQUE3QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGFBQUQsQ0FBVCxHQUEyQixrQkFBM0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxXQUFELENBQVQsR0FBeUIsR0FBekI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxrQkFBRCxDQUFULEdBQWdDLENBQWhDO0FBQ0EsUUFBQSxTQUFTLENBQUMsaUJBQUQsQ0FBVCxHQUErQixTQUEvQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixFQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixHQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixTQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNIOztBQUVELFVBQU0sSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixTQUF2QyxJQUFxRCxJQUFJLEtBQUssRUFBL0QsSUFBd0UsSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixjQUF2QyxJQUEwRCxJQUFJLEtBQUssRUFBOUksRUFBbUo7QUFDL0ksUUFBQSxTQUFTLENBQUMsTUFBRCxDQUFULEdBQW9CLG1CQUFPLFVBQVAsQ0FBa0IsSUFBbEIsRUFBd0IsTUFBeEIsQ0FBcEI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxlQUFELENBQVQsR0FBNkIsTUFBN0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxhQUFELENBQVQsR0FBMkIsa0JBQTNCO0FBQ0EsUUFBQSxTQUFTLENBQUMsV0FBRCxDQUFULEdBQXlCLEdBQXpCO0FBQ0EsUUFBQSxTQUFTLENBQUMsa0JBQUQsQ0FBVCxHQUFnQyxDQUFoQztBQUNBLFFBQUEsU0FBUyxDQUFDLGlCQUFELENBQVQsR0FBK0IsU0FBL0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsRUFBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsU0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsR0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsU0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDSDs7QUFFRCxVQUFNLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsT0FBdkMsSUFBbUQsSUFBSSxLQUFLLEVBQTdELElBQXNFLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsWUFBdkMsSUFBd0QsSUFBSSxLQUFLLEVBQXRJLElBQStJLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsVUFBdkMsSUFBc0QsSUFBSSxLQUFLLEVBQTdNLElBQXNOLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsZUFBdkMsSUFBMkQsSUFBSSxLQUFLLEVBQTdSLEVBQWtTO0FBQzlSLFFBQUEsU0FBUyxDQUFDLE1BQUQsQ0FBVCxHQUFvQixtQkFBTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCLE1BQXhCLENBQXBCO0FBQ0EsUUFBQSxTQUFTLENBQUMsZUFBRCxDQUFULEdBQTZCLE1BQTdCO0FBQ0EsUUFBQSxTQUFTLENBQUMsWUFBRCxDQUFULEdBQTBCLFNBQTFCO0FBQ0EsUUFBQSxTQUFTLENBQUMsYUFBRCxDQUFULEdBQTJCLGtCQUEzQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFdBQUQsQ0FBVCxHQUF5QixHQUF6QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGtCQUFELENBQVQsR0FBZ0MsQ0FBaEM7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLFNBQS9CO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLEVBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLENBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsY0FBRCxDQUFULEdBQTRCLFNBQTVCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ0g7O0FBRUQsVUFBTSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE9BQXZDLElBQW1ELElBQUksS0FBSyxFQUE3RCxJQUFzRSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFlBQXZDLElBQXdELElBQUksS0FBSyxFQUF0SSxJQUErSSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFVBQXZDLElBQXNELElBQUksS0FBSyxFQUE3TSxJQUFzTixJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLGVBQXZDLElBQTJELElBQUksS0FBSyxFQUE3UixFQUFrUztBQUM5UixRQUFBLFNBQVMsQ0FBQyxNQUFELENBQVQsR0FBb0IsbUJBQU8sVUFBUCxDQUFrQixJQUFsQixFQUF3QixNQUF4QixDQUFwQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGVBQUQsQ0FBVCxHQUE2QixNQUE3QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGFBQUQsQ0FBVCxHQUEyQixrQkFBM0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxXQUFELENBQVQsR0FBeUIsR0FBekI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxrQkFBRCxDQUFULEdBQWdDLENBQWhDO0FBQ0EsUUFBQSxTQUFTLENBQUMsaUJBQUQsQ0FBVCxHQUErQixTQUEvQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixFQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixDQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGNBQUQsQ0FBVCxHQUE0QixTQUE1QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNIOztBQUVELFVBQU0sSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUF4QyxJQUF1RCxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFlBQTdGLElBQWlILElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsVUFBdkosSUFBeUssSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixlQUEvTSxJQUFzTyxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLFNBQTVRLElBQTZSLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsY0FBdlUsRUFBeVY7QUFDclYsUUFBQSxZQUFZLENBQUMsT0FBRCxDQUFaLEdBQXdCLEdBQXhCO0FBQ0EsUUFBQSxZQUFZLENBQUMsT0FBRCxDQUFaLEdBQXdCLFNBQXhCO0FBQ0EsUUFBQSxZQUFZLENBQUMsU0FBRCxDQUFaLEdBQTBCLEVBQTFCO0FBQ0EsUUFBQSxZQUFZLENBQUMsaUJBQUQsQ0FBWixHQUFrQyxLQUFsQztBQUNIOztBQUVELFVBQU0sSUFBSSxLQUFLLEtBQVQsS0FBbUIsSUFBSSxDQUFDLFFBQUQsQ0FBSixLQUFtQixHQUFuQixJQUEwQixJQUFJLENBQUMsUUFBRCxDQUFKLEtBQW1CLE1BQTdDLElBQXVELElBQUksQ0FBQyxRQUFELENBQUosS0FBbUIsS0FBN0YsQ0FBTixFQUE2RztBQUN6RyxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsUUFBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLEtBQS9CO0FBQ0g7O0FBRUQsVUFBTSxRQUFRLEtBQUssTUFBYixJQUF1QixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE1BQWpELEVBQTJEO0FBQ3ZELFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixHQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixTQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNIOztBQUVELFVBQU0sUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixNQUFqRCxFQUEyRDtBQUN2RCxRQUFBLE9BQU8sQ0FBQyxPQUFELENBQVAsR0FBbUIsQ0FBbkI7QUFDQSxRQUFBLE9BQU8sQ0FBQyxPQUFELENBQVAsR0FBbUIsU0FBbkI7QUFDQSxRQUFBLE9BQU8sQ0FBQyxRQUFELENBQVAsR0FBb0IsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUFwQjtBQUNBLFFBQUEsT0FBTyxDQUFDLFNBQUQsQ0FBUCxHQUFxQixFQUFyQjtBQUNIOztBQUVELFVBQU0sSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixRQUE1QyxFQUF3RDtBQUNwRCxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsQ0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsU0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxRQUFELENBQVQsR0FBc0IsQ0FBQyxDQUFELEVBQUksQ0FBSixDQUF0QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixHQUF2QjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixNQUF2QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGlCQUFELENBQVQsR0FBK0IsS0FBL0I7QUFDSDs7QUFFRCxVQUFNLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsT0FBNUMsRUFBdUQ7QUFDbkQsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLEdBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLE9BQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ0EsUUFBQSxTQUFTLENBQUMsaUJBQUQsQ0FBVCxHQUErQixLQUEvQjtBQUNIOztBQUVELFVBQU0sSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixNQUE1QyxFQUFzRDtBQUNsRCxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsR0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsT0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLEtBQS9CO0FBQ0g7O0FBRUQsVUFBTSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE9BQXRDLElBQWtELENBQUMsSUFBSSxDQUFDLGNBQUwsQ0FBb0IsUUFBcEIsQ0FBbkQsSUFBc0YsQ0FBQyxJQUFJLENBQUMsY0FBTCxDQUFvQixPQUFwQixDQUE3RixFQUE4SDtBQUMxSCxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsR0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsU0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLEtBQS9CO0FBQ0g7O0FBRUQsVUFBTSxJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE9BQXRDLElBQWlELElBQUksQ0FBQyxRQUFELENBQUosS0FBbUIsT0FBdEUsSUFBcUYsSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUF0QyxJQUFpRCxJQUFJLENBQUMsT0FBRCxDQUFKLEtBQWtCLE9BQTVKLEVBQXVLO0FBQ25LLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixDQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLE9BQUQsQ0FBVCxHQUFxQixPQUFyQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFNBQUQsQ0FBVCxHQUF1QixFQUF2QjtBQUNBLFFBQUEsU0FBUyxDQUFDLGlCQUFELENBQVQsR0FBK0IsS0FBL0I7QUFDSDs7QUFFRCxVQUFNLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsT0FBdEMsSUFBaUQsSUFBSSxDQUFDLFFBQUQsQ0FBSixLQUFtQixLQUF0RSxJQUFtRixJQUFJLEtBQUssS0FBVCxJQUFrQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLE9BQXRDLElBQWlELElBQUksQ0FBQyxPQUFELENBQUosS0FBa0IsS0FBMUosRUFBbUs7QUFDL0osUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLENBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsU0FBRCxDQUFULEdBQXVCLEVBQXZCO0FBQ0EsUUFBQSxTQUFTLENBQUMsaUJBQUQsQ0FBVCxHQUErQixLQUEvQjtBQUNIOztBQUVELFVBQU0sSUFBSSxLQUFLLEtBQVQsSUFBa0IsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixPQUF0QyxJQUFpRCxJQUFJLENBQUMsUUFBRCxDQUFKLEtBQW1CLE9BQXRFLElBQXFGLElBQUksS0FBSyxLQUFULElBQWtCLElBQUksQ0FBQyxTQUFELENBQUosS0FBb0IsT0FBdEMsSUFBaUQsSUFBSSxDQUFDLE9BQUQsQ0FBSixLQUFrQixPQUE1SixFQUF1SztBQUNuSyxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsQ0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsT0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxpQkFBRCxDQUFULEdBQStCLEtBQS9CO0FBQ0g7O0FBR0QsVUFBTSxJQUFJLEtBQUssTUFBVCxJQUFtQixJQUFJLENBQUMsU0FBRCxDQUFKLEtBQW9CLGtCQUE3QyxFQUFtRTtBQUMvRCxRQUFBLFNBQVMsQ0FBQyxNQUFELENBQVQsR0FBb0IsbUJBQU8sVUFBUCxDQUFrQixJQUFsQixFQUF3QixNQUF4QixDQUFwQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFlBQUQsQ0FBVCxHQUEwQixTQUExQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGFBQUQsQ0FBVCxHQUEyQixxQkFBM0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxXQUFELENBQVQsR0FBeUIsR0FBekI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxrQkFBRCxDQUFULEdBQWdDLENBQWhDO0FBQ0EsUUFBQSxTQUFTLENBQUMsaUJBQUQsQ0FBVCxHQUErQixTQUEvQjtBQUNBLFFBQUEsU0FBUyxDQUFDLGFBQUQsQ0FBVCxHQUEyQixDQUEzQjtBQUNBLFFBQUEsU0FBUyxDQUFDLFdBQUQsQ0FBVCxHQUF5QixFQUF6QjtBQUNIOztBQUVELFVBQU0sUUFBUSxLQUFLLE1BQWIsSUFBdUIsSUFBSSxDQUFDLFNBQUQsQ0FBSixLQUFvQixrQkFBakQsRUFBdUU7QUFDbkUsUUFBQSxTQUFTLENBQUMsTUFBRCxDQUFULEdBQW9CLG1CQUFPLFVBQVAsQ0FBa0IsSUFBbEIsRUFBd0IsTUFBeEIsQ0FBcEI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxhQUFELENBQVQsR0FBMkIscUJBQTNCO0FBQ0EsUUFBQSxTQUFTLENBQUMsV0FBRCxDQUFULEdBQXlCLEdBQXpCO0FBQ0EsUUFBQSxTQUFTLENBQUMsa0JBQUQsQ0FBVCxHQUFnQyxDQUFoQztBQUNBLFFBQUEsU0FBUyxDQUFDLGlCQUFELENBQVQsR0FBK0IsU0FBL0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxhQUFELENBQVQsR0FBMkIsQ0FBM0I7QUFDQSxRQUFBLFNBQVMsQ0FBQyxXQUFELENBQVQsR0FBeUIsRUFBekI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsR0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxPQUFELENBQVQsR0FBcUIsU0FBckI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsR0FBNUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxZQUFELENBQVQsR0FBMEIsU0FBMUI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxjQUFELENBQVQsR0FBNEIsR0FBNUI7QUFDSDs7QUFJRCxVQUFNLFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxVQUFELENBQUosS0FBcUIsZ0JBQTVDLElBQWdFLElBQUksQ0FBQyxhQUFELENBQUosS0FBd0IsR0FBOUYsRUFBcUc7QUFDakcsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLEdBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsUUFBRCxDQUFULEdBQXNCLENBQUMsQ0FBRCxFQUFJLENBQUosQ0FBdEI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsR0FBdkI7QUFDQSxRQUFBLFNBQVMsQ0FBQyxTQUFELENBQVQsR0FBdUIsRUFBdkI7QUFDSDs7QUFFRCxVQUFNLFFBQVEsS0FBSyxNQUFiLElBQXVCLElBQUksQ0FBQyxVQUFELENBQUosS0FBcUIsZ0JBQTVDLElBQWdFLElBQUksQ0FBQyxhQUFELENBQUosS0FBd0IsR0FBOUYsRUFBcUc7QUFDakcsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLEdBQXJCO0FBQ0EsUUFBQSxTQUFTLENBQUMsT0FBRCxDQUFULEdBQXFCLFNB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QUssR0FBRyxDQUFDLEdBQUcsQ0FBWjtBQUNmO0FBQ0o7Ozt5QkFFSSxHLEVBQUssQyxFQUFHLEMsRUFBRztBQUNaLFVBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFELENBQWI7QUFDQSxNQUFBLEdBQUcsQ0FBQyxDQUFELENBQUgsR0FBUyxHQUFHLENBQUMsQ0FBRCxDQUFaO0FBQ0EsTUFBQSxHQUFHLENBQUMsQ0FBRCxDQUFILEdBQVMsR0FBVDtBQUNIIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0ICcuL2tvdGhpYy5qcyc7XG5pbXBvcnQgJy4vcmVuZGVyZXIvbGluZS5qcyc7XG5pbXBvcnQgJy4vcmVuZGVyZXIvcGF0aC5qcyc7XG5pbXBvcnQgJy4vcmVuZGVyZXIvcG9seWdvbi5qcyc7XG5pbXBvcnQgJy4vcmVuZGVyZXIvdGV4dGljb25zLmpzJztcbmltcG9ydCAnLi9yZW5kZXJlci9zaGllbGRzLmpzJztcbmltcG9ydCAnLi9yZW5kZXJlci90ZXh0LmpzJztcbmltcG9ydCAnLi9zdHlsZS9tYXBjc3MuanMnO1xuaW1wb3J0ICcuL3N0eWxlL3N0eWxlLmpzJztcbmltcG9ydCAnLi9zdHlsZS9vc21vc25pbWtpLmpzJztcbmltcG9ydCAnLi91dGlscy9jb2xsaXNpb25zLmpzJztcbmltcG9ydCAnLi91dGlscy9nZW9tLmpzJztcbmltcG9ydCAnLi91dGlscy9yYnVzaC5qcyc7XG4iLCJpbXBvcnQgTWFwQ1NTIGZyb20gJy4vc3R5bGUvbWFwY3NzJztcbmltcG9ydCBDb2xsaXNpb25CdWZmZXIgZnJvbSBcIi4vdXRpbHMvY29sbGlzaW9uc1wiO1xuaW1wb3J0IFN0eWxlIGZyb20gXCIuL3N0eWxlL3N0eWxlXCI7XG5pbXBvcnQgUG9seWdvbiBmcm9tIFwiLi9yZW5kZXJlci9wb2x5Z29uXCI7XG5pbXBvcnQgTGluZSBmcm9tIFwiLi9yZW5kZXJlci9saW5lXCI7XG5pbXBvcnQgU2hpZWxkcyBmcm9tIFwiLi9yZW5kZXJlci9zaGllbGRzXCI7XG5pbXBvcnQgVGV4dGljb25zIGZyb20gXCIuL3JlbmRlcmVyL3RleHRpY29uc1wiO1xuXG4vKlxuIChjKSAyMDEzLCBEYXJhZmVpIFByYWxpYXNrb3Vza2ksIFZsYWRpbWlyIEFnYWZvbmtpbiwgTWFrc2ltIEd1cnRvdmVua29cbiBLb3RoaWMgSlMgaXMgYSBmdWxsLWZlYXR1cmVkIEphdmFTY3JpcHQgbWFwIHJlbmRlcmluZyBlbmdpbmUgdXNpbmcgSFRNTDUgQ2FudmFzLlxuIGh0dHA6Ly9naXRodWIuY29tL2tvdGhpYy9rb3RoaWMtanNcbiovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBLb3RoaWMge1xuXG4gICAgc3RhdGljIHJlbmRlcihjYW52YXMsIGRhdGEsIHpvb20sIG9wdGlvbnMpIHtcblxuICAgICAgICBpZiAoZGF0YSA9PSBudWxsKSByZXR1cm47XG4gICAgICAgIGlmICh0eXBlb2YgY2FudmFzID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoY2FudmFzKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgbGV0IHN0eWxlcyA9IChvcHRpb25zICYmIG9wdGlvbnMuc3R5bGVzKSB8fCBbXTtcbiAgICAgICAgTWFwQ1NTLnNoYXJlZC5fbG9jYWxlcyA9IChvcHRpb25zICYmIG9wdGlvbnMubG9jYWxlcykgfHwgW107XG5cbiAgICAgICAgbGV0IGRldmljZVBpeGVsUmF0aW8gPSBNYXRoLm1heCh3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyB8fCAxLCAyKTtcblxuICAgICAgICBsZXQgd2lkdGggPSBjYW52YXMud2lkdGgsXG4gICAgICAgICAgICBoZWlnaHQgPSBjYW52YXMuaGVpZ2h0O1xuXG4gICAgICAgIGlmIChkZXZpY2VQaXhlbFJhdGlvICE9PSAxKSB7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUud2lkdGggPSB3aWR0aCArICdweCc7XG4gICAgICAgICAgICBjYW52YXMuc3R5bGUuaGVpZ2h0ID0gaGVpZ2h0ICsgJ3B4JztcbiAgICAgICAgICAgIGNhbnZhcy53aWR0aCA9IGNhbnZhcy53aWR0aCAqIGRldmljZVBpeGVsUmF0aW87XG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gY2FudmFzLmhlaWdodCAqIGRldmljZVBpeGVsUmF0aW87XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgY3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XG4gICAgICAgIGN0eC5zY2FsZShkZXZpY2VQaXhlbFJhdGlvLCBkZXZpY2VQaXhlbFJhdGlvKTtcblxuXG4gICAgICAgIGxldCBncmFudWxhcml0eSA9IGRhdGEuZ3JhbnVsYXJpdHksXG4gICAgICAgICAgICB3cyA9IHdpZHRoIC8gZ3JhbnVsYXJpdHksIGhzID0gaGVpZ2h0IC8gZ3JhbnVsYXJpdHksXG4gICAgICAgICAgICBjb2xsaXNpb25CdWZmZXIgPSBuZXcgQ29sbGlzaW9uQnVmZmVyKGhlaWdodCwgd2lkdGgpO1xuXG4gICAgICAgIC8vY29uc29sZS50aW1lKCdzdHlsZXMnKTtcblxuICAgICAgICAvLyBzZXR1cCBsYXllciBzdHlsZXNcbiAgICAgICAgbGV0IGxheWVycyA9IFN0eWxlLnBvcHVsYXRlTGF5ZXJzKGRhdGEuZmVhdHVyZXMsIHpvb20sIHN0eWxlcyksXG4gICAgICAgICAgICBsYXllcklkcyA9IEtvdGhpYy5nZXRMYXllcklkcyhsYXllcnMpO1xuXG4gICAgICAgIC8vIHJlbmRlciB0aGUgbWFwXG4gICAgICAgIFN0eWxlLnNldFN0eWxlcyhjdHgsIFN0eWxlLmRlZmF1bHRDYW52YXNTdHlsZXMpO1xuXG4gICAgICAgIC8vY29uc29sZS50aW1lRW5kKCdzdHlsZXMnKTtcblxuICAgICAgICBLb3RoaWMuZ2V0RnJhbWUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy9jb25zb2xlLnRpbWUoJ2dlb21ldHJ5Jyk7XG4gICAgICAgICAgICBLb3RoaWMuX3JlbmRlckJhY2tncm91bmQoY3R4LCB3aWR0aCwgaGVpZ2h0LCB6b29tLCBzdHlsZXMpO1xuICAgICAgICAgICAgS290aGljLl9yZW5kZXJHZW9tZXRyeUZlYXR1cmVzKGxheWVySWRzLCBsYXllcnMsIGN0eCwgd3MsIGhzLCBncmFudWxhcml0eSk7XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMub25SZW5kZXJDb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMub25SZW5kZXJDb21wbGV0ZSgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL2NvbnNvbGUudGltZUVuZCgnZ2VvbWV0cnknKTtcblxuICAgICAgICAgICAgS290aGljLmdldEZyYW1lKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvL2NvbnNvbGUudGltZSgndGV4dC9pY29ucycpO1xuICAgICAgICAgICAgICAgIEtvdGhpYy5fcmVuZGVyVGV4dEFuZEljb25zKGxheWVySWRzLCBsYXllcnMsIGN0eCwgd3MsIGhzLCBjb2xsaXNpb25CdWZmZXIpO1xuICAgICAgICAgICAgICAgIC8vY29uc29sZS50aW1lRW5kKCd0ZXh0L2ljb25zJyk7XG5cbiAgICAgICAgICAgICAgICAvL0tvdGhpYy5fcmVuZGVyQ29sbGlzaW9ucyhjdHgsIGNvbGxpc2lvbkJ1ZmZlci5idWZmZXIuZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhdGljIF9yZW5kZXJDb2xsaXNpb25zKGN0eCwgbm9kZSkge1xuICAgICAgICBsZXQgaSwgbGVuLCBhO1xuICAgICAgICBpZiAobm9kZS5sZWFmKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBub2RlLmNoaWxkcmVuLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY3R4LnN0cm9rZVN0eWxlID0gJ3JlZCc7XG4gICAgICAgICAgICAgICAgY3R4LmxpbmVXaWR0aCA9IDE7XG4gICAgICAgICAgICAgICAgYSA9IG5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgICAgICAgICAgY3R4LnN0cm9rZVJlY3QoTWF0aC5yb3VuZChhWzBdKSwgTWF0aC5yb3VuZChhWzFdKSwgTWF0aC5yb3VuZChhWzJdIC0gYVswXSksIE1hdGgucm91bmQoYVszXSAtIGFbMV0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IG5vZGUuY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBLb3RoaWMuX3JlbmRlckNvbGxpc2lvbnMoY3R4LCBub2RlLmNoaWxkcmVuW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBnZXRMYXllcklkcyhsYXllcnMpIHtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5rZXlzKGxheWVycykuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlSW50KGEsIDEwKSAtIHBhcnNlSW50KGIsIDEwKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldEZyYW1lKGZuKSB7XG4gICAgICAgIGxldCByZXFGcmFtZSA9IHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgd2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8IHdpbmRvdy5tc1JlcXVlc3RBbmltYXRpb25GcmFtZTtcblxuICAgICAgICByZXFGcmFtZS5jYWxsKHdpbmRvdywgZm4pO1xuICAgIH1cblxuICAgIHN0YXRpYyBfcmVuZGVyQmFja2dyb3VuZChjdHgsIHdpZHRoLCBoZWlnaHQsIHpvb20sIHN0eWxlcykge1xuICAgICAgICBsZXQgc3R5bGUgPSBNYXBDU1Muc2hhcmVkLnJlc3R5bGUoc3R5bGVzLCB7fSwge30sIHpvb20sICdjYW52YXMnLCAnY2FudmFzJyk7XG5cbiAgICAgICAgbGV0IGZpbGxSZWN0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY3R4LmZpbGxSZWN0KC0xLCAtMSwgd2lkdGggKyAxLCBoZWlnaHQgKyAxKTtcbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKGxldCBpIGluIHN0eWxlKSB7XG4gICAgICAgICAgICBQb2x5Z29uLnNoYXJlZC5maWxsKGN0eCwgc3R5bGVbaV0sIGZpbGxSZWN0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBfcmVuZGVyR2VvbWV0cnlGZWF0dXJlcyhsYXllcklkcywgbGF5ZXJzLCBjdHgsIHdzLCBocywgZ3JhbnVsYXJpdHkpIHtcbiAgICAgICAgbGV0IGxheWVyc1RvUmVuZGVyID0ge30sXG4gICAgICAgICAgICBpLCBqLCBsZW4sIGZlYXR1cmVzLCBzdHlsZSwgcXVldWUsIGJnUXVldWU7XG5cblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGF5ZXJJZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGZlYXR1cmVzID0gbGF5ZXJzW2xheWVySWRzW2ldXTtcblxuICAgICAgICAgICAgYmdRdWV1ZSA9IGxheWVyc1RvUmVuZGVyLl9iZyA9IGxheWVyc1RvUmVuZGVyLl9iZyB8fCB7fTtcbiAgICAgICAgICAgIHF1ZXVlID0gbGF5ZXJzVG9SZW5kZXJbbGF5ZXJJZHNbaV1dID0gbGF5ZXJzVG9SZW5kZXJbbGF5ZXJJZHNbaV1dIHx8IHt9O1xuXG4gICAgICAgICAgICBmb3IgKGogPSAwLCBsZW4gPSBmZWF0dXJlcy5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgIHN0eWxlID0gZmVhdHVyZXNbal0uc3R5bGU7XG5cbiAgICAgICAgICAgICAgICBpZiAoJ2ZpbGwtY29sb3InIGluIHN0eWxlIHx8ICdmaWxsLWltYWdlJyBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoc3R5bGVbJ2ZpbGwtcG9zaXRpb24nXSA9PT0gJ2JhY2tncm91bmQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiZ1F1ZXVlLnBvbHlnb25zID0gYmdRdWV1ZS5wb2x5Z29ucyB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJnUXVldWUucG9seWdvbnMucHVzaChmZWF0dXJlc1tqXSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBxdWV1ZS5wb2x5Z29ucyA9IHF1ZXVlLnBvbHlnb25zIHx8IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcXVldWUucG9seWdvbnMucHVzaChmZWF0dXJlc1tqXSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoJ2Nhc2luZy13aWR0aCcgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcXVldWUuY2FzaW5ncyA9IHF1ZXVlLmNhc2luZ3MgfHwgW107XG4gICAgICAgICAgICAgICAgICAgIHF1ZXVlLmNhc2luZ3MucHVzaChmZWF0dXJlc1tqXSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCd3aWR0aCcgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcXVldWUubGluZXMgPSBxdWV1ZS5saW5lcyB8fCBbXTtcbiAgICAgICAgICAgICAgICAgICAgcXVldWUubGluZXMucHVzaChmZWF0dXJlc1tqXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGF5ZXJJZHMgPSBbJ19iZyddLmNvbmNhdChsYXllcklkcyk7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxheWVySWRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBxdWV1ZSA9IGxheWVyc1RvUmVuZGVyW2xheWVySWRzW2ldXTtcbiAgICAgICAgICAgIGlmICghcXVldWUpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgIGlmIChxdWV1ZS5wb2x5Z29ucykge1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbiA9IHF1ZXVlLnBvbHlnb25zLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIFBvbHlnb24uc2hhcmVkLnJlbmRlcihjdHgsIHF1ZXVlLnBvbHlnb25zW2pdLCBxdWV1ZS5wb2x5Z29uc1tqICsgMV0sIHdzLCBocywgZ3JhbnVsYXJpdHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChxdWV1ZS5jYXNpbmdzKSB7XG4gICAgICAgICAgICAgICAgY3R4LmxpbmVDYXAgPSAnYnV0dCc7XG4gICAgICAgICAgICAgICAgZm9yIChqID0gMCwgbGVuID0gcXVldWUuY2FzaW5ncy5sZW5ndGg7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICBMaW5lLnNoYXJlZC5yZW5kZXJDYXNpbmcoY3R4LCBxdWV1ZS5jYXNpbmdzW2pdLCBxdWV1ZS5jYXNpbmdzW2ogKyAxXSwgd3MsIGhzLCBncmFudWxhcml0eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHF1ZXVlLmxpbmVzKSB7XG4gICAgICAgICAgICAgICAgY3R4LmxpbmVDYXAgPSAncm91bmQnO1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDAsIGxlbiA9IHF1ZXVlLmxpbmVzLmxlbmd0aDsgaiA8IGxlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIExpbmUuc2hhcmVkLnJlbmRlcihjdHgsIHF1ZXVlLmxpbmVzW2pdLCBxdWV1ZS5saW5lc1tqICsgMV0sIHdzLCBocywgZ3JhbnVsYXJpdHkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN0YXRpYyBfcmVuZGVyVGV4dEFuZEljb25zKGxheWVySWRzLCBsYXllcnMsIGN0eCwgd3MsIGhzLCBjb2xsaXNpb25CdWZmZXIpIHtcbiAgICAgICAgLy9UT0RPOiBNb3ZlIHRvIHRoZSBmZWF0dXJlcyBkZXRlY3RvclxuICAgICAgICBsZXQgaiwgc3R5bGUsIGksXG4gICAgICAgICAgICBwYXNzZXMgPSBbXTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGF5ZXJJZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBmZWF0dXJlcyA9IGxheWVyc1tsYXllcklkc1tpXV0sXG4gICAgICAgICAgICAgICAgZmVhdHVyZXNMZW4gPSBmZWF0dXJlcy5sZW5ndGg7XG5cbiAgICAgICAgICAgIC8vIHJlbmRlciBpY29ucyB3aXRob3V0IHRleHRcbiAgICAgICAgICAgIGZvciAoaiA9IGZlYXR1cmVzTGVuIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgICAgICBzdHlsZSA9IGZlYXR1cmVzW2pdLnN0eWxlO1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZS5oYXNPd25Qcm9wZXJ0eSgnaWNvbi1pbWFnZScpICYmICFzdHlsZS50ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIFRleHRpY29ucy5yZW5kZXIoY3R4LCBmZWF0dXJlc1tqXSwgY29sbGlzaW9uQnVmZmVyLCB3cywgaHMsIGZhbHNlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHJlbmRlciB0ZXh0IG9uIGZlYXR1cmVzIHdpdGhvdXQgaWNvbnNcbiAgICAgICAgICAgIGZvciAoaiA9IGZlYXR1cmVzTGVuIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgICAgICAgICAgICBzdHlsZSA9IGZlYXR1cmVzW2pdLnN0eWxlO1xuICAgICAgICAgICAgICAgIGlmICghc3R5bGUuaGFzT3duUHJvcGVydHkoJ2ljb24taW1hZ2UnKSAmJiBzdHlsZS50ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgIFRleHRpY29ucy5yZW5kZXIoY3R4LCBmZWF0dXJlc1tqXSwgY29sbGlzaW9uQnVmZmVyLCB3cywgaHMsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGZvciBmZWF0dXJlcyB3aXRoIGJvdGggaWNvbiBhbmQgdGV4dCwgcmVuZGVyIGJvdGggb3IgbmVpdGhlclxuICAgICAgICAgICAgZm9yIChqID0gZmVhdHVyZXNMZW4gLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgICAgICAgIHN0eWxlID0gZmVhdHVyZXNbal0uc3R5bGU7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlLmhhc093blByb3BlcnR5KCdpY29uLWltYWdlJykgJiYgc3R5bGUudGV4dCkge1xuICAgICAgICAgICAgICAgICAgICBUZXh0aWNvbnMucmVuZGVyKGN0eCwgZmVhdHVyZXNbal0sIGNvbGxpc2lvbkJ1ZmZlciwgd3MsIGhzLCB0cnVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIHJlbmRlciBzaGllbGRzIHdpdGggdGV4dFxuICAgICAgICAgICAgZm9yIChqID0gZmVhdHVyZXNMZW4gLSAxOyBqID49IDA7IGotLSkge1xuICAgICAgICAgICAgICAgIHN0eWxlID0gZmVhdHVyZXNbal0uc3R5bGU7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlWydzaGllbGQtdGV4dCddKSB7XG4gICAgICAgICAgICAgICAgICAgIFNoaWVsZHMucmVuZGVyKGN0eCwgZmVhdHVyZXNbal0sIGNvbGxpc2lvbkJ1ZmZlciwgd3MsIGhzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGFzc2VzO1xuICAgIH1cbn07IiwiaW1wb3J0IFBhdGggZnJvbSBcIi4vcGF0aFwiO1xuaW1wb3J0IFN0eWxlIGZyb20gXCIuLi9zdHlsZS9zdHlsZVwiO1xuaW1wb3J0IE1hcENTUyBmcm9tIFwiLi4vc3R5bGUvbWFwY3NzXCI7XG5cbmxldCBsaW5lID0gbnVsbDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTGluZSB7XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgaWYgKGxpbmUgPT0gbnVsbCkge1xuICAgICAgICAgICAgbGluZSA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLnBhdGhPcGVuZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGluZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IHNoYXJlZCgpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBMaW5lKCk7XG4gICAgfVxuXG4gICAgcmVuZGVyQ2FzaW5nKGN0eCwgZmVhdHVyZSwgbmV4dEZlYXR1cmUsIHdzLCBocywgZ3JhbnVsYXJpdHkpIHtcbiAgICAgICAgbGV0IHN0eWxlID0gZmVhdHVyZS5zdHlsZSxcbiAgICAgICAgICAgIG5leHRTdHlsZSA9IG5leHRGZWF0dXJlICYmIG5leHRGZWF0dXJlLnN0eWxlO1xuXG4gICAgICAgIGlmICghdGhpcy5wYXRoT3BlbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnBhdGhPcGVuZWQgPSB0cnVlO1xuICAgICAgICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgbmV3IFBhdGgoY3R4LCBmZWF0dXJlLCBzdHlsZVtcImNhc2luZy1kYXNoZXNcIl0gfHwgc3R5bGUuZGFzaGVzLCBmYWxzZSwgd3MsIGhzLCBncmFudWxhcml0eSk7XG5cbiAgICAgICAgaWYgKG5leHRGZWF0dXJlICYmXG4gICAgICAgICAgICAgICAgbmV4dFN0eWxlLndpZHRoID09PSBzdHlsZS53aWR0aCAmJlxuICAgICAgICAgICAgICAgIG5leHRTdHlsZVsnY2FzaW5nLXdpZHRoJ10gPT09IHN0eWxlWydjYXNpbmctd2lkdGgnXSAmJlxuICAgICAgICAgICAgICAgIG5leHRTdHlsZVsnY2FzaW5nLWNvbG9yJ10gPT09IHN0eWxlWydjYXNpbmctY29sb3InXSAmJlxuICAgICAgICAgICAgICAgIG5leHRTdHlsZVsnY2FzaW5nLWRhc2hlcyddID09PSBzdHlsZVsnY2FzaW5nLWRhc2hlcyddICYmXG4gICAgICAgICAgICAgICAgbmV4dFN0eWxlWydjYXNpbmctb3BhY2l0eSddID09PSBzdHlsZVsnY2FzaW5nLW9wYWNpdHknXSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgU3R5bGUuc2V0U3R5bGVzKGN0eCwge1xuICAgICAgICAgICAgbGluZVdpZHRoOiAyICogc3R5bGVbXCJjYXNpbmctd2lkdGhcIl0gKyAoc3R5bGUuaGFzT3duUHJvcGVydHkoXCJ3aWR0aFwiKSA/IHN0eWxlLndpZHRoIDogMCksXG4gICAgICAgICAgICBzdHJva2VTdHlsZTogc3R5bGVbXCJjYXNpbmctY29sb3JcIl0gfHwgXCIjMDAwMDAwXCIsXG4gICAgICAgICAgICBsaW5lQ2FwOiBzdHlsZVtcImNhc2luZy1saW5lY2FwXCJdIHx8IHN0eWxlLmxpbmVjYXAgfHwgXCJidXR0XCIsXG4gICAgICAgICAgICBsaW5lSm9pbjogc3R5bGVbXCJjYXNpbmctbGluZWpvaW5cIl0gfHwgc3R5bGUubGluZWpvaW4gfHwgXCJyb3VuZFwiLFxuICAgICAgICAgICAgZ2xvYmFsQWxwaGE6IHN0eWxlW1wiY2FzaW5nLW9wYWNpdHlcIl0gfHwgMVxuICAgICAgICB9KTtcblxuICAgICAgICBjdHguc3Ryb2tlKCk7XG4gICAgICAgIHRoaXMucGF0aE9wZW5lZCA9IGZhbHNlO1xuICAgIH1cblxuICAgIHJlbmRlcihjdHgsIGZlYXR1cmUsIG5leHRGZWF0dXJlLCB3cywgaHMsIGdyYW51bGFyaXR5KSB7XG4gICAgICAgIGxldCBzdHlsZSA9IGZlYXR1cmUuc3R5bGUsXG4gICAgICAgICAgICBuZXh0U3R5bGUgPSBuZXh0RmVhdHVyZSAmJiBuZXh0RmVhdHVyZS5zdHlsZTtcblxuICAgICAgICBpZiAoIXRoaXMucGF0aE9wZW5lZCkge1xuICAgICAgICAgICAgdGhpcy5wYXRoT3BlbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGN0eC5iZWdpblBhdGgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ldyBQYXRoKGN0eCwgZmVhdHVyZSwgc3R5bGUuZGFzaGVzLCBmYWxzZSwgd3MsIGhzLCBncmFudWxhcml0eSk7XG5cbiAgICAgICAgaWYgKG5leHRGZWF0dXJlICYmXG4gICAgICAgICAgICAgICAgbmV4dFN0eWxlLndpZHRoID09PSBzdHlsZS53aWR0aCAmJlxuICAgICAgICAgICAgICAgIG5leHRTdHlsZS5jb2xvciA9PT0gc3R5bGUuY29sb3IgJiZcbiAgICAgICAgICAgICAgICBuZXh0U3R5bGUuaW1hZ2UgPT09IHN0eWxlLmltYWdlICYmXG4gICAgICAgICAgICAgICAgbmV4dFN0eWxlLm9wYWNpdHkgPT09IHN0eWxlLm9wYWNpdHkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgnY29sb3InIGluIHN0eWxlIHx8ICEoJ2ltYWdlJyBpbiBzdHlsZSkpIHtcbiAgICAgICAgICAgIGxldCB0X3dpZHRoID0gc3R5bGUud2lkdGggfHwgMSxcbiAgICAgICAgICAgICAgICB0X2xpbmVqb2luID0gXCJyb3VuZFwiLFxuICAgICAgICAgICAgICAgIHRfbGluZWNhcCA9IFwicm91bmRcIjtcblxuICAgICAgICAgICAgaWYgKHRfd2lkdGggPD0gMikge1xuICAgICAgICAgICAgICAgIHRfbGluZWpvaW4gPSBcIm1pdGVyXCI7XG4gICAgICAgICAgICAgICAgdF9saW5lY2FwID0gXCJidXR0XCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBTdHlsZS5zZXRTdHlsZXMoY3R4LCB7XG4gICAgICAgICAgICAgICAgbGluZVdpZHRoOiB0X3dpZHRoLFxuICAgICAgICAgICAgICAgIHN0cm9rZVN0eWxlOiBzdHlsZS5jb2xvciB8fCAnIzAwMDAwMCcsXG4gICAgICAgICAgICAgICAgbGluZUNhcDogc3R5bGUubGluZWNhcCB8fCB0X2xpbmVjYXAsXG4gICAgICAgICAgICAgICAgbGluZUpvaW46IHN0eWxlLmxpbmVqb2luIHx8IHRfbGluZWpvaW4sXG4gICAgICAgICAgICAgICAgZ2xvYmFsQWxwaGE6IHN0eWxlLm9wYWNpdHkgfHwgMSxcbiAgICAgICAgICAgICAgICBtaXRlckxpbWl0OiA0XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGN0eC5zdHJva2UoKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKCdpbWFnZScgaW4gc3R5bGUpIHtcbiAgICAgICAgICAgIC8vIHNlY29uZCBwYXNzIGZpbGxzIHdpdGggdGV4dHVyZVxuICAgICAgICAgICAgbGV0IGltYWdlID0gTWFwQ1NTLmdldEltYWdlKHN0eWxlLmltYWdlKTtcblxuICAgICAgICAgICAgaWYgKGltYWdlKSB7XG4gICAgICAgICAgICAgICAgU3R5bGUuc2V0U3R5bGVzKGN0eCwge1xuICAgICAgICAgICAgICAgICAgICBzdHJva2VTdHlsZTogY3R4LmNyZWF0ZVBhdHRlcm4oaW1hZ2UsICdyZXBlYXQnKSB8fCBcIiMwMDAwMDBcIixcbiAgICAgICAgICAgICAgICAgICAgbGluZVdpZHRoOiBzdHlsZS53aWR0aCB8fCAxLFxuICAgICAgICAgICAgICAgICAgICBsaW5lQ2FwOiBzdHlsZS5saW5lY2FwIHx8IFwicm91bmRcIixcbiAgICAgICAgICAgICAgICAgICAgbGluZUpvaW46IHN0eWxlLmxpbmVqb2luIHx8IFwicm91bmRcIixcbiAgICAgICAgICAgICAgICAgICAgZ2xvYmFsQWxwaGE6IHN0eWxlLm9wYWNpdHkgfHwgMVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgY3R4LnN0cm9rZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMucGF0aE9wZW5lZCA9IGZhbHNlO1xuICAgIH1cbn07XG4iLCJpbXBvcnQgR2VvbSBmcm9tIFwiLi4vdXRpbHMvZ2VvbVwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQYXRoIHtcblxuICAgIGNvbnN0cnVjdG9yIChjdHgsIGZlYXR1cmUsIGRhc2hlcywgZmlsbCwgd3MsIGhzLCBncmFudWxhcml0eSkge1xuXG4gICAgICAgIGxldCB0eXBlID0gZmVhdHVyZS50eXBlLFxuICAgICAgICAgICAgY29vcmRzID0gZmVhdHVyZS5jb29yZGluYXRlcztcblxuICAgICAgICBpZiAodHlwZSA9PT0gXCJQb2x5Z29uXCIpIHtcbiAgICAgICAgICAgIGNvb3JkcyA9IFtjb29yZHNdO1xuICAgICAgICAgICAgdHlwZSA9IFwiTXVsdGlQb2x5Z29uXCI7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJMaW5lU3RyaW5nXCIpIHtcbiAgICAgICAgICAgIGNvb3JkcyA9IFtjb29yZHNdO1xuICAgICAgICAgICAgdHlwZSA9IFwiTXVsdGlMaW5lU3RyaW5nXCI7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgaSwgaiwgayxcbiAgICAgICAgICAgIHBvaW50cyxcbiAgICAgICAgICAgIGxlbiA9IGNvb3Jkcy5sZW5ndGgsXG4gICAgICAgICAgICBsZW4yLCBwb2ludHNMZW4sXG4gICAgICAgICAgICBwcmV2UG9pbnQsIHBvaW50LCBzY3JlZW5Qb2ludCxcbiAgICAgICAgICAgIGR4LCBkeSwgZGlzdDtcblxuICAgICAgICBpZiAodHlwZSA9PT0gXCJNdWx0aVBvbHlnb25cIikge1xuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChrID0gMCwgbGVuMiA9IGNvb3Jkc1tpXS5sZW5ndGg7IGsgPCBsZW4yOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRzID0gY29vcmRzW2ldW2tdO1xuICAgICAgICAgICAgICAgICAgICBwb2ludHNMZW4gPSBwb2ludHMubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICBwcmV2UG9pbnQgPSBwb2ludHNbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8PSBwb2ludHNMZW47IGorKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9pbnQgPSBwb2ludHNbal0gfHwgcG9pbnRzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2NyZWVuUG9pbnQgPSBHZW9tLnRyYW5zZm9ybVBvaW50KHBvaW50LCB3cywgaHMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoaiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oc2NyZWVuUG9pbnRbMF0sIHNjcmVlblBvaW50WzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGFzaGVzKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguc2V0TGluZURhc2goZGFzaGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5zZXRMaW5lRGFzaChbXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIGlmICghZmlsbCAmJiBQYXRoLmNoZWNrU2FtZUJvdW5kYXJ5KHBvaW50LCBwcmV2UG9pbnQsIGdyYW51bGFyaXR5KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN0eC5tb3ZlVG8oc2NyZWVuUG9pbnRbMF0sIHNjcmVlblBvaW50WzFdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhzY3JlZW5Qb2ludFswXSwgc2NyZWVuUG9pbnRbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldlBvaW50ID0gcG9pbnQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gXCJNdWx0aUxpbmVTdHJpbmdcIikge1xuICAgICAgICAgICAgbGV0IHBhZCA9IDUwLCAvLyBob3cgbWFueSBwaXhlbHMgdG8gZHJhdyBvdXQgb2YgdGhlIHRpbGUgdG8gYXZvaWQgcGF0aCBlZGdlcyB3aGVuIGxpbmVzIGNyb3NzZXMgdGlsZSBib3JkZXJzXG4gICAgICAgICAgICAgICAgc2tpcCA9IDI7IC8vIGRvIG5vdCBkcmF3IGxpbmUgc2VnbWVudHMgc2hvcnRlciB0aGFuIHRoaXNcblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcG9pbnRzID0gY29vcmRzW2ldO1xuICAgICAgICAgICAgICAgIHBvaW50c0xlbiA9IHBvaW50cy5sZW5ndGg7XG5cbiAgICAgICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgcG9pbnRzTGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICAgICAgcG9pbnQgPSBwb2ludHNbal07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY29udGludWUgcGF0aCBvZmYgdGhlIHRpbGUgYnkgc29tZSBhbW91bnQgdG8gZml4IHBhdGggZWRnZXMgYmV0d2VlbiB0aWxlc1xuICAgICAgICAgICAgICAgICAgICBpZiAoKGogPT09IDAgfHwgaiA9PT0gcG9pbnRzTGVuIC0gMSkgJiYgUGF0aC5pc1RpbGVCb3VuZGFyeShwb2ludCwgZ3JhbnVsYXJpdHkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBrID0gajtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrID0gaiA/IGsgLSAxIDogayArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGsgPCAwIHx8IGsgPj0gcG9pbnRzTGVuKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2UG9pbnQgPSBwb2ludHNba107XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkeCA9IHBvaW50WzBdIC0gcHJldlBvaW50WzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGR5ID0gcG9pbnRbMV0gLSBwcmV2UG9pbnRbMV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzdCA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IHdoaWxlIChkaXN0IDw9IHNraXApO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBhbGwgcG9pbnRzIGFyZSBzbyBjbG9zZSB0byBlYWNoIG90aGVyIHRoYXQgaXQgZG9lc24ndCBtYWtlIHNlbnNlIHRvXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkcmF3IHRoZSBsaW5lIGJleW9uZCB0aGUgdGlsZSBib3JkZXIsIHNpbXBseSBza2lwIHRoZSBlbnRpcmUgbGluZSBmcm9tXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBoZXJlXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoayA8IDAgfHwgayA+PSBwb2ludHNMZW4pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50WzBdID0gcG9pbnRbMF0gKyBwYWQgKiBkeCAvIGRpc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICBwb2ludFsxXSA9IHBvaW50WzFdICsgcGFkICogZHkgLyBkaXN0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHNjcmVlblBvaW50ID0gR2VvbS50cmFuc2Zvcm1Qb2ludChwb2ludCwgd3MsIGhzKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoaiA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4Lm1vdmVUbyhzY3JlZW5Qb2ludFswXSwgc2NyZWVuUG9pbnRbMV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRhc2hlcylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguc2V0TGluZURhc2goZGFzaGVzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdHguc2V0TGluZURhc2goW10pO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgY3R4LmxpbmVUbyhzY3JlZW5Qb2ludFswXSwgc2NyZWVuUG9pbnRbMV0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNoZWNrIGlmIHRoZSBwb2ludCBpcyBvbiB0aGUgdGlsZSBib3VuZGFyeVxuICAgIC8vIHJldHVybnMgYml0bWFzayBvZiBhZmZlY3RlZCB0aWxlIGJvdW5kYXJpZXNcbiAgICBzdGF0aWMgaXNUaWxlQm91bmRhcnkocCwgc2l6ZSkge1xuICAgICAgICBsZXQgciA9IDA7XG4gICAgICAgIGlmIChwWzBdID09PSAwKVxuICAgICAgICAgICAgciB8PSAxO1xuICAgICAgICBlbHNlIGlmIChwWzBdID09PSBzaXplKVxuICAgICAgICAgICAgciB8PSAyO1xuICAgICAgICBpZiAocFsxXSA9PT0gMClcbiAgICAgICAgICAgIHIgfD0gNDtcbiAgICAgICAgZWxzZSBpZiAocFsxXSA9PT0gc2l6ZSlcbiAgICAgICAgICAgIHIgfD0gODtcbiAgICAgICAgcmV0dXJuIHI7XG4gICAgfVxuXG4gICAgLyogY2hlY2sgaWYgMiBwb2ludHMgYXJlIGJvdGggb24gdGhlIHNhbWUgdGlsZSBib3VuZGFyeVxuICAgICAqXG4gICAgICogSWYgcG9pbnRzIG9mIHRoZSBvYmplY3QgYXJlIG9uIHRoZSBzYW1lIHRpbGUgYm91bmRhcnkgaXQgaXMgYXNzdW1lZFxuICAgICAqIHRoYXQgdGhlIG9iamVjdCBpcyBjdXQgaGVyZSBhbmQgd291bGQgb3JpZ2luYWxseSBjb250aW51ZSBiZXlvbmQgdGhlXG4gICAgICogdGlsZSBib3JkZXJzLlxuICAgICAqXG4gICAgICogVGhpcyBkb2VzIG5vdCBjYXRjaCB0aGUgY2FzZSB3aGVyZSB0aGUgb2JqZWN0IGlzIGluZGVlZCBleGFjdGx5XG4gICAgICogb24gdGhlIHRpbGUgYm91bmRhcmllcywgYnV0IHRoaXMgY2FzZSBjYW4ndCBwcm9wZXJseSBiZSBkZXRlY3RlZCBoZXJlLlxuICAgICAqL1xuICAgIHN0YXRpYyBjaGVja1NhbWVCb3VuZGFyeShwLCBxLCBzaXplKSB7XG4gICAgICAgIGxldCBicCA9IFBhdGguaXNUaWxlQm91bmRhcnkocCwgc2l6ZSk7XG4gICAgICAgIGlmICghYnApXG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgcmV0dXJuIChicCAmIFBhdGguaXNUaWxlQm91bmRhcnkocSwgc2l6ZSkpO1xuICAgIH1cbn0iLCJpbXBvcnQgTWFwQ1NTIGZyb20gXCIuLi9zdHlsZS9tYXBjc3NcIjtcbmltcG9ydCBTdHlsZSBmcm9tIFwiLi4vc3R5bGUvc3R5bGVcIjtcbmltcG9ydCBQYXRoIGZyb20gXCIuL3BhdGhcIjtcblxubGV0IHBvbHlnb24gPSBudWxsO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBQb2x5Z29uIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBpZiAocG9seWdvbiA9PSBudWxsKSB7XG4gICAgICAgICAgICBwb2x5Z29uID0gdGhpcztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcG9seWdvblxuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgc2hhcmVkKCkge1xuICAgICAgICByZXR1cm4gbmV3IFBvbHlnb24oKTtcbiAgICB9XG5cbiAgICByZW5kZXIoY3R4LCBmZWF0dXJlLCBuZXh0RmVhdHVyZSwgd3MsIGhzLCBncmFudWxhcml0eSkge1xuICAgICAgICBsZXQgc3R5bGUgPSBmZWF0dXJlLnN0eWxlLFxuICAgICAgICAgICAgbmV4dFN0eWxlID0gbmV4dEZlYXR1cmUgJiYgbmV4dEZlYXR1cmUuc3R5bGU7XG5cbiAgICAgICAgaWYgKCF0aGlzLnBhdGhPcGVuZWQpIHtcbiAgICAgICAgICAgIHRoaXMucGF0aE9wZW5lZCA9IHRydWU7XG4gICAgICAgICAgICBjdHguYmVnaW5QYXRoKCk7XG4gICAgICAgIH1cblxuICAgICAgICBuZXcgUGF0aChjdHgsIGZlYXR1cmUsIGZhbHNlLCB0cnVlLCB3cywgaHMsIGdyYW51bGFyaXR5KTtcblxuICAgICAgICBpZiAobmV4dEZlYXR1cmUgJiZcbiAgICAgICAgICAgICAgICAobmV4dFN0eWxlWydmaWxsLWNvbG9yJ10gPT09IHN0eWxlWydmaWxsLWNvbG9yJ10pICYmXG4gICAgICAgICAgICAgICAgKG5leHRTdHlsZVsnZmlsbC1pbWFnZSddID09PSBzdHlsZVsnZmlsbC1pbWFnZSddKSAmJlxuICAgICAgICAgICAgICAgIChuZXh0U3R5bGVbJ2ZpbGwtb3BhY2l0eSddID09PSBzdHlsZVsnZmlsbC1vcGFjaXR5J10pKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmZpbGwoY3R4LCBzdHlsZSk7XG5cbiAgICAgICAgdGhpcy5wYXRoT3BlbmVkID0gZmFsc2U7XG4gICAgfVxuXG4gICAgZmlsbChjdHgsIHN0eWxlLCBmaWxsRm4pIHtcbiAgICAgICAgbGV0IG9wYWNpdHkgPSBzdHlsZVtcImZpbGwtb3BhY2l0eVwiXSB8fCBzdHlsZS5vcGFjaXR5LCBpbWFnZTtcblxuICAgICAgICBpZiAoc3R5bGUuaGFzT3duUHJvcGVydHkoJ2ZpbGwtY29sb3InKSkge1xuICAgICAgICAgICAgLy8gZmlyc3QgcGFzcyBmaWxscyB3aXRoIHNvbGlkIGNvbG9yXG4gICAgICAgICAgICBTdHlsZS5zZXRTdHlsZXMoY3R4LCB7XG4gICAgICAgICAgICAgICAgZmlsbFN0eWxlOiBzdHlsZVtcImZpbGwtY29sb3JcIl0gfHwgXCIjMDAwMDAwXCIsXG4gICAgICAgICAgICAgICAgZ2xvYmFsQWxwaGE6IG9wYWNpdHkgfHwgMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoZmlsbEZuKSB7XG4gICAgICAgICAgICAgICAgZmlsbEZuKCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGN0eC5maWxsKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3R5bGUuaGFzT3duUHJvcGVydHkoJ2ZpbGwtaW1hZ2UnKSkge1xuICAgICAgICAgICAgLy8gc2Vjb25kIHBhc3MgZmlsbHMgd2l0aCB0ZXh0dXJlXG4gICAgICAgICAgICBpbWFnZSA9IE1hcENTUy5nZXRJbWFnZShzdHlsZVsnZmlsbC1pbWFnZSddKTtcbiAgICAgICAgICAgIGlmIChpbWFnZSkge1xuICAgICAgICAgICAgICAgIFN0eWxlLnNldFN0eWxlcyhjdHgsIHtcbiAgICAgICAgICAgICAgICAgICAgZmlsbFN0eWxlOiBjdHguY3JlYXRlUGF0dGVybihpbWFnZSwgJ3JlcGVhdCcpLFxuICAgICAgICAgICAgICAgICAgICBnbG9iYWxBbHBoYTogb3BhY2l0eSB8fCAxXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgaWYgKGZpbGxGbikge1xuICAgICAgICAgICAgICAgICAgICBmaWxsRm4oKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjdHguZmlsbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCBHZW9tIGZyb20gXCIuLi91dGlscy9nZW9tXCI7XG5pbXBvcnQgTWFwQ1NTIGZyb20gXCIuLi9zdHlsZS9tYXBjc3NcIjtcbmltcG9ydCBTdHlsZSBmcm9tIFwiLi4vc3R5bGUvc3R5bGVcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2hpZWxkcyB7XG5cbiAgICBzdGF0aWMgcmVuZGVyKGN0eCwgZmVhdHVyZSwgY29sbGlkZXMsIHdzLCBocykge1xuICAgICAgICBsZXQgc3R5bGUgPSBmZWF0dXJlLnN0eWxlLCByZXByUG9pbnQgPSBHZW9tLmdldFJlcHJQb2ludChmZWF0dXJlKSxcbiAgICAgICAgICAgIHBvaW50LCBpbWcsIGxlbiA9IDAsIGZvdW5kID0gZmFsc2UsIGksIHNnbjtcblxuICAgICAgICBpZiAoIXJlcHJQb2ludCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcG9pbnQgPSBHZW9tLnRyYW5zZm9ybVBvaW50KHJlcHJQb2ludCwgd3MsIGhzKTtcblxuICAgICAgICBpZiAoc3R5bGVbXCJzaGllbGQtaW1hZ2VcIl0pIHtcbiAgICAgICAgICAgIGltZyA9IE1hcENTUy5nZXRJbWFnZShzdHlsZVtcImljb24taW1hZ2VcIl0pO1xuXG4gICAgICAgICAgICBpZiAoIWltZykge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIFN0eWxlLnNldFN0eWxlcyhjdHgsIHtcbiAgICAgICAgICAgIGZvbnQ6IFN0eWxlLmdldEZvbnRTdHJpbmcoc3R5bGVbXCJzaGllbGQtZm9udC1mYW1pbHlcIl0gfHwgc3R5bGVbXCJmb250LWZhbWlseVwiXSwgc3R5bGVbXCJzaGllbGQtZm9udC1zaXplXCJdIHx8IHN0eWxlW1wiZm9udC1zaXplXCJdLCBzdHlsZSksXG4gICAgICAgICAgICBmaWxsU3R5bGU6IHN0eWxlW1wic2hpZWxkLXRleHQtY29sb3JcIl0gfHwgXCIjMDAwMDAwXCIsXG4gICAgICAgICAgICBnbG9iYWxBbHBoYTogc3R5bGVbXCJzaGllbGQtdGV4dC1vcGFjaXR5XCJdIHx8IHN0eWxlLm9wYWNpdHkgfHwgMSxcbiAgICAgICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgICAgICB0ZXh0QmFzZWxpbmU6ICdtaWRkbGUnXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCB0ZXh0ID0gU3RyaW5nKHN0eWxlWydzaGllbGQtdGV4dCddKSxcbiAgICAgICAgICAgIHRleHRXaWR0aCA9IGN0eC5tZWFzdXJlVGV4dCh0ZXh0KS53aWR0aCxcbiAgICAgICAgICAgIGxldHRlcldpZHRoID0gdGV4dFdpZHRoIC8gdGV4dC5sZW5ndGgsXG4gICAgICAgICAgICBjb2xsaXNpb25XaWR0aCA9IHRleHRXaWR0aCArIDIsXG4gICAgICAgICAgICBjb2xsaXNpb25IZWlnaHQgPSBsZXR0ZXJXaWR0aCAqIDEuODtcblxuICAgICAgICBpZiAoZmVhdHVyZS50eXBlID09PSAnTGluZVN0cmluZycpIHtcbiAgICAgICAgICAgIGxlbiA9IEdlb20uZ2V0UG9seUxlbmd0aChmZWF0dXJlLmNvb3JkaW5hdGVzKTtcblxuICAgICAgICAgICAgaWYgKE1hdGgubWF4KGNvbGxpc2lvbkhlaWdodCAvIGhzLCBjb2xsaXNpb25XaWR0aCAvIHdzKSA+IGxlbikge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yIChpID0gMCwgc2duID0gMTsgaSA8IGxlbiAvIDI7IGkgKz0gTWF0aC5tYXgobGVuIC8gMzAsIGNvbGxpc2lvbkhlaWdodCAvIHdzKSwgc2duICo9IC0xKSB7XG4gICAgICAgICAgICAgICAgcmVwclBvaW50ID0gR2VvbS5nZXRBbmdsZUFuZENvb3Jkc0F0TGVuZ3RoKGZlYXR1cmUuY29vcmRpbmF0ZXMsIGxlbiAvIDIgKyBzZ24gKiBpLCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoIXJlcHJQb2ludCkge1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXByUG9pbnQgPSBbcmVwclBvaW50WzFdLCByZXByUG9pbnRbMl1dO1xuXG4gICAgICAgICAgICAgICAgcG9pbnQgPSBHZW9tLnRyYW5zZm9ybVBvaW50KHJlcHJQb2ludCwgd3MsIGhzKTtcbiAgICAgICAgICAgICAgICBpZiAoaW1nICYmIChzdHlsZVtcImFsbG93LW92ZXJsYXBcIl0gIT09IFwidHJ1ZVwiKSAmJlxuICAgICAgICAgICAgICAgICAgICBjb2xsaWRlcy5jaGVja1BvaW50V0gocG9pbnQsIGltZy53aWR0aCwgaW1nLmhlaWdodCwgZmVhdHVyZS5rb3RoaWNJZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgoc3R5bGVbXCJhbGxvdy1vdmVybGFwXCJdICE9PSBcInRydWVcIikgJiZcbiAgICAgICAgICAgICAgICAgICAgY29sbGlkZXMuY2hlY2tQb2ludFdIKHBvaW50LCBjb2xsaXNpb25XaWR0aCwgY29sbGlzaW9uSGVpZ2h0LCBmZWF0dXJlLmtvdGhpY0lkKSkge1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFmb3VuZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHN0eWxlW1wic2hpZWxkLWNhc2luZy13aWR0aFwiXSkge1xuICAgICAgICAgICAgU3R5bGUuc2V0U3R5bGVzKGN0eCwge1xuICAgICAgICAgICAgICAgIGZpbGxTdHlsZTogc3R5bGVbXCJzaGllbGQtY2FzaW5nLWNvbG9yXCJdIHx8IFwiIzAwMDAwMFwiLFxuICAgICAgICAgICAgICAgIGdsb2JhbEFscGhhOiBzdHlsZVtcInNoaWVsZC1jYXNpbmctb3BhY2l0eVwiXSB8fCBzdHlsZS5vcGFjaXR5IHx8IDFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgbGV0IHAgPSBzdHlsZVtcInNoaWVsZC1jYXNpbmctd2lkdGhcIl0gKyAoc3R5bGVbXCJzaGllbGQtZnJhbWUtd2lkdGhcIl0gfHwgMCk7XG4gICAgICAgICAgICBjdHguZmlsbFJlY3QocG9pbnRbMF0gLSBjb2xsaXNpb25XaWR0aCAvIDIgLSBwLFxuICAgICAgICAgICAgICAgIHBvaW50WzFdIC0gY29sbGlzaW9uSGVpZ2h0IC8gMiAtIHAsXG4gICAgICAgICAgICAgICAgY29sbGlzaW9uV2lkdGggKyAyICogcCxcbiAgICAgICAgICAgICAgICBjb2xsaXNpb25IZWlnaHQgKyAyICogcCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoc3R5bGVbXCJzaGllbGQtZnJhbWUtd2lkdGhcIl0pIHtcbiAgICAgICAgICAgIFN0eWxlLnNldFN0eWxlcyhjdHgsIHtcbiAgICAgICAgICAgICAgICBmaWxsU3R5bGU6IHN0eWxlW1wic2hpZWxkLWZyYW1lLWNvbG9yXCJdIHx8IFwiIzAwMDAwMFwiLFxuICAgICAgICAgICAgICAgIGdsb2JhbEFscGhhOiBzdHlsZVtcInNoaWVsZC1mcmFtZS1vcGFjaXR5XCJdIHx8IHN0eWxlLm9wYWNpdHkgfHwgMVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjdHguZmlsbFJlY3QocG9pbnRbMF0gLSBjb2xsaXNpb25XaWR0aCAvIDIgLSAoc3R5bGVbXCJzaGllbGQtZnJhbWUtd2lkdGhcIl0gfHwgMCksXG4gICAgICAgICAgICAgICAgcG9pbnRbMV0gLSBjb2xsaXNpb25IZWlnaHQgLyAyIC0gKHN0eWxlW1wic2hpZWxkLWZyYW1lLXdpZHRoXCJdIHx8IDApLFxuICAgICAgICAgICAgICAgIGNvbGxpc2lvbldpZHRoICsgMiAqIChzdHlsZVtcInNoaWVsZC1mcmFtZS13aWR0aFwiXSB8fCAwKSxcbiAgICAgICAgICAgICAgICBjb2xsaXNpb25IZWlnaHQgKyAyICogKHN0eWxlW1wic2hpZWxkLWZyYW1lLXdpZHRoXCJdIHx8IDApKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdHlsZVtcInNoaWVsZC1jb2xvclwiXSkge1xuICAgICAgICAgICAgU3R5bGUuc2V0U3R5bGVzKGN0eCwge1xuICAgICAgICAgICAgICAgIGZpbGxTdHlsZTogc3R5bGVbXCJzaGllbGQtY29sb3JcIl0gfHwgXCIjMDAwMDAwXCIsXG4gICAgICAgICAgICAgICAgZ2xvYmFsQWxwaGE6IHN0eWxlW1wic2hpZWxkLW9wYWNpdHlcIl0gfHwgc3R5bGUub3BhY2l0eSB8fCAxXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGN0eC5maWxsUmVjdChwb2ludFswXSAtIGNvbGxpc2lvbldpZHRoIC8gMixcbiAgICAgICAgICAgICAgICBwb2ludFsxXSAtIGNvbGxpc2lvbkhlaWdodCAvIDIsXG4gICAgICAgICAgICAgICAgY29sbGlzaW9uV2lkdGgsXG4gICAgICAgICAgICAgICAgY29sbGlzaW9uSGVpZ2h0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbWcpIHtcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1nLFxuICAgICAgICAgICAgICAgIE1hdGguZmxvb3IocG9pbnRbMF0gLSBpbWcud2lkdGggLyAyKSxcbiAgICAgICAgICAgICAgICBNYXRoLmZsb29yKHBvaW50WzFdIC0gaW1nLmhlaWdodCAvIDIpKTtcbiAgICAgICAgfVxuICAgICAgICBTdHlsZS5zZXRTdHlsZXMoY3R4LCB7XG4gICAgICAgICAgICBmaWxsU3R5bGU6IHN0eWxlW1wic2hpZWxkLXRleHQtY29sb3JcIl0gfHwgXCIjMDAwMDAwXCIsXG4gICAgICAgICAgICBnbG9iYWxBbHBoYTogc3R5bGVbXCJzaGllbGQtdGV4dC1vcGFjaXR5XCJdIHx8IHN0eWxlLm9wYWNpdHkgfHwgMVxuICAgICAgICB9KTtcblxuICAgICAgICBjdHguZmlsbFRleHQodGV4dCwgcG9pbnRbMF0sIE1hdGguY2VpbChwb2ludFsxXSkpO1xuICAgICAgICBpZiAoaW1nKSB7XG4gICAgICAgICAgICBjb2xsaWRlcy5hZGRQb2ludFdIKHBvaW50LCBpbWcud2lkdGgsIGltZy5oZWlnaHQsIDAsIGZlYXR1cmUua290aGljSWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29sbGlkZXMuYWRkUG9pbnRXSChwb2ludCwgY29sbGlzaW9uSGVpZ2h0LCBjb2xsaXNpb25XaWR0aCxcbiAgICAgICAgICAgIChwYXJzZUZsb2F0KHN0eWxlW1wic2hpZWxkLWNhc2luZy13aWR0aFwiXSkgfHwgMCkgKyAocGFyc2VGbG9hdChzdHlsZVtcInNoaWVsZC1mcmFtZS13aWR0aFwiXSkgfHwgMCkgKyAocGFyc2VGbG9hdChzdHlsZVtcIi14LW1hcG5pay1taW4tZGlzdGFuY2VcIl0pIHx8IDMwKSwgZmVhdHVyZS5rb3RoaWNJZCk7XG5cbiAgICB9XG59IiwiaW1wb3J0IEdlb20gZnJvbSBcIi4uL3V0aWxzL2dlb21cIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGV4dE9uUGF0aCB7XG5cbiAgICBjb25zdHJ1Y3RvciAoY3R4LCBwb2ludHMsIHRleHQsIGhhbG8sIGNvbGxpc2lvbnMpIHtcbiAgICAgICAgLy93aWR0aENhY2hlID0ge307XG5cbiAgICAgICAgLy8gc2ltcGxpZnkgcG9pbnRzP1xuXG4gICAgICAgIGxldCB0ZXh0V2lkdGggPSBjdHgubWVhc3VyZVRleHQodGV4dCkud2lkdGgsXG4gICAgICAgICAgICB0ZXh0TGVuID0gdGV4dC5sZW5ndGgsXG4gICAgICAgICAgICBwYXRoTGVuID0gR2VvbS5nZXRQb2x5TGVuZ3RoKHBvaW50cyk7XG5cbiAgICAgICAgaWYgKHBhdGhMZW4gPCB0ZXh0V2lkdGgpIHtcbiAgICAgICAgICAgIHJldHVybjsgIC8vIGlmIGxhYmVsIHdvbid0IGZpdCAtIGRvbid0IHRyeSB0b1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGF2Z0xldHRlcldpZHRoID0gVGV4dE9uUGF0aC5nZXRXaWR0aChjdHgsICdhJyk7XG5cbiAgICAgICAgbGV0IGxldHRlcixcbiAgICAgICAgICAgIHdpZHRoVXNlZCxcbiAgICAgICAgICAgIHByZXZBbmdsZSxcbiAgICAgICAgICAgIHBvc2l0aW9ucyxcbiAgICAgICAgICAgIHNvbHV0aW9uID0gMCxcbiAgICAgICAgICAgIGZsaXBDb3VudCxcbiAgICAgICAgICAgIGZsaXBwZWQgPSBmYWxzZSxcbiAgICAgICAgICAgIGF4eSxcbiAgICAgICAgICAgIGxldHRlcldpZHRoLFxuICAgICAgICAgICAgaSxcbiAgICAgICAgICAgIG1heEFuZ2xlID0gTWF0aC5QSSAvIDY7XG5cbiAgICAgICAgLy8gaXRlcmF0aW5nIHNvbHV0aW9ucyAtIHN0YXJ0IGZyb20gY2VudGVyIG9yIGZyb20gb25lIG9mIHRoZSBlbmRzXG4gICAgICAgIHdoaWxlIChzb2x1dGlvbiA8IDIpIHsgLy9UT0RPIGNoYW5nZSB0byBmb3I/XG4gICAgICAgICAgICB3aWR0aFVzZWQgPSBzb2x1dGlvbiA/IFRleHRPblBhdGguZ2V0V2lkdGgoY3R4LCB0ZXh0LmNoYXJBdCgwKSkgOiAocGF0aExlbiAtIHRleHRXaWR0aCkgLyAyOyAvLyA/Pz9cbiAgICAgICAgICAgIGZsaXBDb3VudCA9IDA7XG4gICAgICAgICAgICBwcmV2QW5nbGUgPSBudWxsO1xuICAgICAgICAgICAgcG9zaXRpb25zID0gW107XG5cbiAgICAgICAgICAgIC8vIGl0ZXJhdGluZyBsYWJlbCBsZXR0ZXIgYnkgbGV0dGVyIChzaG91bGQgYmUgZml4ZWQgdG8gc3VwcG9ydCBsaWdhdHVyZXMvQ0pLLCBvayBmb3IgQ3lyaWxsaWMvbGF0aW4pXG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdGV4dExlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgbGV0dGVyID0gdGV4dC5jaGFyQXQoaSk7XG4gICAgICAgICAgICAgICAgbGV0dGVyV2lkdGggPSBUZXh0T25QYXRoLmdldFdpZHRoKGN0eCwgbGV0dGVyKTtcbiAgICAgICAgICAgICAgICBheHkgPSBHZW9tLmdldEFuZ2xlQW5kQ29vcmRzQXRMZW5ndGgocG9pbnRzLCB3aWR0aFVzZWQsIGxldHRlcldpZHRoKTtcblxuICAgICAgICAgICAgICAgIC8vIGlmIGNhbm5vdCBmaXQgbGV0dGVyIC0gcmVzdGFydCB3aXRoIG5leHQgc29sdXRpb25cbiAgICAgICAgICAgICAgICBpZiAod2lkdGhVc2VkID49IHBhdGhMZW4gfHwgIWF4eSkge1xuICAgICAgICAgICAgICAgICAgICBzb2x1dGlvbisrO1xuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbnMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZsaXBwZWQpIHsgIC8vIGlmIGxhYmVsIHdhcyBmbGlwcGVkLCBmbGlwIGl0IGJhY2tcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50cy5yZXZlcnNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBmbGlwcGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCFwcmV2QW5nbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcHJldkFuZ2xlID0gYXh5WzBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGlmIGxhYmVsIGNvbGxpc2lvbnMgd2l0aCBhbm90aGVyLCByZXN0YXJ0IGl0IGZyb20gaGVyZVxuICAgICAgICAgICAgICAgIGlmIChUZXh0T25QYXRoLmNoZWNrQ29sbGlzaW9uKGNvbGxpc2lvbnMsIGN0eCwgbGV0dGVyLCBheHksIGF2Z0xldHRlcldpZHRoKSB8fCBNYXRoLmFicyhwcmV2QW5nbGUgLSBheHlbMF0pID4gbWF4QW5nbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGhVc2VkICs9IGxldHRlcldpZHRoO1xuICAgICAgICAgICAgICAgICAgICBpID0gLTE7XG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmbGlwQ291bnQgPSAwO1xuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB3aGlsZSAobGV0dGVyV2lkdGggPCBheHlbM10gJiYgaSA8IHRleHRMZW4pIHsgLy8gdHJ5IGFkZGluZyBmb2xsb3dpbmcgbGV0dGVycyB0byBjdXJyZW50LCB1bnRpbCBsaW5lIGNoYW5nZXMgaXRzIGRpcmVjdGlvblxuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgICAgIGxldHRlciArPSB0ZXh0LmNoYXJBdChpKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0dGVyV2lkdGggPSBUZXh0T25QYXRoLmdldFdpZHRoKGN0eCwgbGV0dGVyKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKFRleHRPblBhdGguY2hlY2tDb2xsaXNpb24oY29sbGlzaW9ucywgY3R4LCBsZXR0ZXIsIGF4eSwgYXZnTGV0dGVyV2lkdGgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoVXNlZCArPSBsZXR0ZXJXaWR0aDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9ucyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZmxpcENvdW50ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldHRlciA9IHRleHQuY2hhckF0KGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0dGVyV2lkdGggPSBUZXh0T25QYXRoLmdldFdpZHRoKGN0eCwgbGV0dGVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGF4eSA9IEdlb20uZ2V0QW5nbGVBbmRDb29yZHNBdExlbmd0aChwb2ludHMsIHdpZHRoVXNlZCwgbGV0dGVyV2lkdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKGxldHRlcldpZHRoID49IGF4eVszXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaS0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgbGV0dGVyID0gbGV0dGVyLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldHRlcldpZHRoID0gVGV4dE9uUGF0aC5nZXRXaWR0aChjdHgsIGxldHRlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghYXh5KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICgoYXh5WzBdID4gKE1hdGguUEkgLyAyKSkgfHwgKGF4eVswXSA8ICgtTWF0aC5QSSAvIDIpKSkgeyAvLyBpZiBjdXJyZW50IGxldHRlcnMgY2x1c3RlciB3YXMgdXBzaWRlLWRvd24sIGNvdW50IGl0XG4gICAgICAgICAgICAgICAgICAgIGZsaXBDb3VudCArPSBsZXR0ZXIubGVuZ3RoO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHByZXZBbmdsZSA9IGF4eVswXTtcbiAgICAgICAgICAgICAgICBheHkucHVzaChsZXR0ZXIpO1xuICAgICAgICAgICAgICAgIHBvc2l0aW9ucy5wdXNoKGF4eSk7XG4gICAgICAgICAgICAgICAgd2lkdGhVc2VkICs9IGxldHRlcldpZHRoO1xuICAgICAgICAgICAgfSAvL2ZvclxuXG4gICAgICAgICAgICBpZiAoZmxpcENvdW50ID4gdGV4dExlbiAvIDIpIHsgLy8gaWYgbW9yZSB0aGFuIGhhbGYgb2YgdGhlIHRleHQgaXMgdXBzaWRlIGRvd24sIGZsaXAgaXQgYW5kIHJlc3RhcnRcbiAgICAgICAgICAgICAgICBwb2ludHMucmV2ZXJzZSgpO1xuICAgICAgICAgICAgICAgIHBvc2l0aW9ucyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgaWYgKGZsaXBwZWQpIHsgLy8gaWYgaXQgd2FzIGZsaXBwZWQgdHdpY2UgLSByZXN0YXJ0IHdpdGggb3RoZXIgc3RhcnQgcG9pbnQgc29sdXRpb25cbiAgICAgICAgICAgICAgICAgICAgc29sdXRpb24rKztcbiAgICAgICAgICAgICAgICAgICAgcG9pbnRzLnJldmVyc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgZmxpcHBlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGZsaXBwZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNvbHV0aW9uID49IDIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChwb3NpdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IC8vd2hpbGVcblxuICAgICAgICBsZXQgcG9zTGVuID0gcG9zaXRpb25zLmxlbmd0aDtcblxuICAgICAgICBmb3IgKGkgPSAwOyBoYWxvICYmIChpIDwgcG9zTGVuKTsgaSsrKSB7XG4gICAgICAgICAgICBUZXh0T25QYXRoLnJlbmRlclRleHQoY3R4LCBwb3NpdGlvbnNbaV0sIHRydWUpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHBvc0xlbjsgaSsrKSB7XG4gICAgICAgICAgICBheHkgPSBwb3NpdGlvbnNbaV07XG4gICAgICAgICAgICBUZXh0T25QYXRoLnJlbmRlclRleHQoY3R4LCBheHkpO1xuICAgICAgICAgICAgVGV4dE9uUGF0aC5hZGRDb2xsaXNpb24oY29sbGlzaW9ucywgY3R4LCBheHlbNF0sIGF4eSwgYXZnTGV0dGVyV2lkdGgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFdpZHRoKGN0eCwgdGV4dCkge1xuICAgICAgICByZXR1cm4gY3R4Lm1lYXN1cmVUZXh0KHRleHQpLndpZHRoO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRUZXh0Q2VudGVyKGF4eSwgdGV4dFdpZHRoKSB7XG4gICAgICAgIHJldHVybiBbYXh5WzFdICsgMC41ICogTWF0aC5jb3MoYXh5WzBdKSAqIHRleHRXaWR0aCxcbiAgICAgICAgICAgIGF4eVsyXSArIDAuNSAqIE1hdGguc2luKGF4eVswXSkgKiB0ZXh0V2lkdGhdO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRDb2xsaXNpb25QYXJhbXModGV4dFdpZHRoLCBheHksIHB4b2Zmc2V0KSB7XG4gICAgICAgIGxldCB0ZXh0SGVpZ2h0ID0gdGV4dFdpZHRoICogMS41LFxuICAgICAgICAgICAgY29zID0gTWF0aC5hYnMoTWF0aC5jb3MoYXh5WzBdKSksXG4gICAgICAgICAgICBzaW4gPSBNYXRoLmFicyhNYXRoLnNpbihheHlbMF0pKSxcbiAgICAgICAgICAgIHcgPSBjb3MgKiB0ZXh0V2lkdGggKyBzaW4gKiB0ZXh0SGVpZ2h0LFxuICAgICAgICAgICAgaCA9IHNpbiAqIHRleHRXaWR0aCArIGNvcyAqIHRleHRIZWlnaHQ7XG5cbiAgICAgICAgcmV0dXJuIFtUZXh0T25QYXRoLmdldFRleHRDZW50ZXIoYXh5LCB0ZXh0V2lkdGggKyAyICogKHB4b2Zmc2V0IHx8IDApKSwgdywgaCwgMF07XG4gICAgfVxuXG4gICAgc3RhdGljIGNoZWNrQ29sbGlzaW9uKGNvbGxpc2lvbnMsIGN0eCwgdGV4dCwgYXh5LCBsZXR0ZXJXaWR0aCkge1xuICAgICAgICBsZXQgdGV4dFdpZHRoID0gVGV4dE9uUGF0aC5nZXRXaWR0aChjdHgsIHRleHQpO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGV4dFdpZHRoOyBpICs9IGxldHRlcldpZHRoKSB7XG4gICAgICAgICAgICBpZiAoY29sbGlzaW9ucy5jaGVja1BvaW50V0guYXBwbHkoY29sbGlzaW9ucywgVGV4dE9uUGF0aC5nZXRDb2xsaXNpb25QYXJhbXMobGV0dGVyV2lkdGgsIGF4eSwgaSkpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHN0YXRpYyBhZGRDb2xsaXNpb24oY29sbGlzaW9ucywgY3R4LCB0ZXh0LCBheHksIGxldHRlcldpZHRoKSB7XG4gICAgICAgIGxldCB0ZXh0V2lkdGggPSBUZXh0T25QYXRoLmdldFdpZHRoKGN0eCwgdGV4dCksXG4gICAgICAgICAgICBwYXJhbXMgPSBbXTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRleHRXaWR0aDsgaSArPSBsZXR0ZXJXaWR0aCkge1xuICAgICAgICAgICAgcGFyYW1zLnB1c2goVGV4dE9uUGF0aC5nZXRDb2xsaXNpb25QYXJhbXMobGV0dGVyV2lkdGgsIGF4eSwgaSkpO1xuICAgICAgICB9XG4gICAgICAgIGNvbGxpc2lvbnMuYWRkUG9pbnRzKHBhcmFtcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIHJlbmRlclRleHQoY3R4LCBheHksIGhhbG8pIHtcbiAgICAgICAgbGV0IHRleHQgPSBheHlbNF0sXG4gICAgICAgICAgICB0ZXh0Q2VudGVyID0gVGV4dE9uUGF0aC5nZXRUZXh0Q2VudGVyKGF4eSwgVGV4dE9uUGF0aC5nZXRXaWR0aChjdHgsIHRleHQpKTtcblxuICAgICAgICBjdHgudHJhbnNsYXRlKHRleHRDZW50ZXJbMF0sIHRleHRDZW50ZXJbMV0pO1xuICAgICAgICBjdHgucm90YXRlKGF4eVswXSk7XG4gICAgICAgIGN0eFtoYWxvID8gJ3N0cm9rZVRleHQnIDogJ2ZpbGxUZXh0J10odGV4dCwgMCwgMCk7XG4gICAgICAgIGN0eC5yb3RhdGUoLWF4eVswXSk7XG4gICAgICAgIGN0eC50cmFuc2xhdGUoLXRleHRDZW50ZXJbMF0sIC10ZXh0Q2VudGVyWzFdKTtcbiAgICB9XG5cblxufVxuIiwiaW1wb3J0IFN0eWxlIGZyb20gXCIuLi9zdHlsZS9zdHlsZVwiO1xuaW1wb3J0IEdlb20gZnJvbSBcIi4uL3V0aWxzL2dlb21cIjtcbmltcG9ydCBNYXBDU1MgZnJvbSBcIi4uL3N0eWxlL21hcGNzc1wiO1xuaW1wb3J0IFRleHRPblBhdGggZnJvbSBcIi4vdGV4dFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBUZXh0aWNvbnMge1xuXG4gICAgc3RhdGljIHJlbmRlcihjdHgsIGZlYXR1cmUsIGNvbGxpZGVzLCB3cywgaHMsIHJlbmRlclRleHQsIHJlbmRlckljb24pIHtcbiAgICAgICAgbGV0IHN0eWxlID0gZmVhdHVyZS5zdHlsZSwgaW1nLCBwb2ludCwgdywgaDtcblxuICAgICAgICBpZiAocmVuZGVySWNvbiB8fCAocmVuZGVyVGV4dCAmJiBmZWF0dXJlLnR5cGUgIT09ICdMaW5lU3RyaW5nJykpIHtcbiAgICAgICAgICAgIGxldCByZXByUG9pbnQgPSBHZW9tLmdldFJlcHJQb2ludChmZWF0dXJlKTtcbiAgICAgICAgICAgIGlmICghcmVwclBvaW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9pbnQgPSBHZW9tLnRyYW5zZm9ybVBvaW50KHJlcHJQb2ludCwgd3MsIGhzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChyZW5kZXJJY29uKSB7XG4gICAgICAgICAgICBpbWcgPSBNYXBDU1MuZ2V0SW1hZ2Uoc3R5bGVbJ2ljb24taW1hZ2UnXSk7XG4gICAgICAgICAgICBpZiAoIWltZykgeyByZXR1cm47IH1cblxuICAgICAgICAgICAgdyA9IGltZy53aWR0aDtcbiAgICAgICAgICAgIGggPSBpbWcuaGVpZ2h0O1xuXG4gICAgICAgICAgICBpZiAoc3R5bGVbJ2ljb24td2lkdGgnXSB8fCBzdHlsZVsnaWNvbi1oZWlnaHQnXSl7XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlWydpY29uLXdpZHRoJ10pIHtcbiAgICAgICAgICAgICAgICAgICAgdyA9IHN0eWxlWydpY29uLXdpZHRoJ107XG4gICAgICAgICAgICAgICAgICAgIGggPSBpbWcuaGVpZ2h0ICogdyAvIGltZy53aWR0aDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHN0eWxlWydpY29uLWhlaWdodCddKSB7XG4gICAgICAgICAgICAgICAgICAgIGggPSBzdHlsZVsnaWNvbi1oZWlnaHQnXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFzdHlsZVsnaWNvbi13aWR0aCddKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3ID0gaW1nLndpZHRoICogaCAvIGltZy5oZWlnaHQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoKHN0eWxlWydhbGxvdy1vdmVybGFwJ10gIT09ICd0cnVlJykgJiZcbiAgICAgICAgICAgICAgICBjb2xsaWRlcy5jaGVja1BvaW50V0gocG9pbnQsIHcsIGgsIGZlYXR1cmUua290aGljSWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHRleHQgPSBTdHJpbmcoc3R5bGUudGV4dCkudHJpbSgpO1xuXG4gICAgICAgIGlmIChyZW5kZXJUZXh0ICYmIHRleHQpIHtcbiAgICAgICAgICAgIFN0eWxlLnNldFN0eWxlcyhjdHgsIHtcbiAgICAgICAgICAgICAgICBsaW5lV2lkdGg6IHN0eWxlWyd0ZXh0LWhhbG8tcmFkaXVzJ10gKiAyLFxuICAgICAgICAgICAgICAgIGZvbnQ6IFN0eWxlLmdldEZvbnRTdHJpbmcoc3R5bGVbJ2ZvbnQtZmFtaWx5J10sIHN0eWxlWydmb250LXNpemUnXSwgc3R5bGUpXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGV0IGhhbG8gPSAoc3R5bGUuaGFzT3duUHJvcGVydHkoJ3RleHQtaGFsby1yYWRpdXMnKSk7XG5cbiAgICAgICAgICAgIFN0eWxlLnNldFN0eWxlcyhjdHgsIHtcbiAgICAgICAgICAgICAgICBmaWxsU3R5bGU6IHN0eWxlWyd0ZXh0LWNvbG9yJ10gfHwgJyMwMDAwMDAnLFxuICAgICAgICAgICAgICAgIHN0cm9rZVN0eWxlOiBzdHlsZVsndGV4dC1oYWxvLWNvbG9yJ10gfHwgJyNmZmZmZmYnLFxuICAgICAgICAgICAgICAgIGdsb2JhbEFscGhhOiBzdHlsZVsndGV4dC1vcGFjaXR5J10gfHwgc3R5bGUub3BhY2l0eSB8fCAxLFxuICAgICAgICAgICAgICAgIHRleHRBbGlnbjogJ2NlbnRlcicsXG4gICAgICAgICAgICAgICAgdGV4dEJhc2VsaW5lOiAnbWlkZGxlJ1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIGlmIChzdHlsZVsndGV4dC10cmFuc2Zvcm0nXSA9PT0gJ3VwcGVyY2FzZScpXG4gICAgICAgICAgICAgICAgdGV4dCA9IHRleHQudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHN0eWxlWyd0ZXh0LXRyYW5zZm9ybSddID09PSAnbG93ZXJjYXNlJylcbiAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgICAgZWxzZSBpZiAoc3R5bGVbJ3RleHQtdHJhbnNmb3JtJ10gPT09ICdjYXBpdGFsaXplJylcbiAgICAgICAgICAgICAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKC8oXnxcXHMpXFxTL2csIGZ1bmN0aW9uKGNoKSB7IHJldHVybiBjaC50b1VwcGVyQ2FzZSgpOyB9KTtcblxuICAgICAgICAgICAgaWYgKGZlYXR1cmUudHlwZSA9PT0gJ1BvbHlnb24nIHx8IGZlYXR1cmUudHlwZSA9PT0gJ1BvaW50Jykge1xuICAgICAgICAgICAgICAgIGxldCB0ZXh0V2lkdGggPSBjdHgubWVhc3VyZVRleHQodGV4dCkud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGxldHRlcldpZHRoID0gdGV4dFdpZHRoIC8gdGV4dC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpc2lvbldpZHRoID0gdGV4dFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBjb2xsaXNpb25IZWlnaHQgPSBsZXR0ZXJXaWR0aCAqIDIuNSxcbiAgICAgICAgICAgICAgICAgICAgb2Zmc2V0ID0gc3R5bGVbJ3RleHQtb2Zmc2V0J10gfHwgMDtcblxuICAgICAgICAgICAgICAgIGlmICgoc3R5bGVbJ3RleHQtYWxsb3ctb3ZlcmxhcCddICE9PSAndHJ1ZScpICYmXG4gICAgICAgICAgICAgICAgICAgIGNvbGxpZGVzLmNoZWNrUG9pbnRXSChbcG9pbnRbMF0sIHBvaW50WzFdICsgb2Zmc2V0XSwgY29sbGlzaW9uV2lkdGgsIGNvbGxpc2lvbkhlaWdodCwgZmVhdHVyZS5rb3RoaWNJZCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChoYWxvKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5zdHJva2VUZXh0KHRleHQsIHBvaW50WzBdLCBwb2ludFsxXSArIG9mZnNldCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGN0eC5maWxsVGV4dCh0ZXh0LCBwb2ludFswXSwgcG9pbnRbMV0gKyBvZmZzZXQpO1xuXG4gICAgICAgICAgICAgICAgbGV0IHBhZGRpbmcgPSBzdHlsZVsnLXgta290LW1pbi1kaXN0YW5jZSddIHx8IDIwO1xuICAgICAgICAgICAgICAgIGNvbGxpZGVzLmFkZFBvaW50V0goW3BvaW50WzBdLCBwb2ludFsxXSArIG9mZnNldF0sIGNvbGxpc2lvbldpZHRoLCBjb2xsaXNpb25IZWlnaHQsIHBhZGRpbmcsIGZlYXR1cmUua290aGljSWQpO1xuXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZlYXR1cmUudHlwZSA9PT0gJ0xpbmVTdHJpbmcnKSB7XG5cbiAgICAgICAgICAgICAgICBsZXQgcG9pbnRzID0gR2VvbS50cmFuc2Zvcm1Qb2ludHMoZmVhdHVyZS5jb29yZGluYXRlcywgd3MsIGhzKTtcbiAgICAgICAgICAgICAgICBuZXcgVGV4dE9uUGF0aChjdHgsIHBvaW50cywgdGV4dCwgaGFsbywgY29sbGlkZXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHJlbmRlckljb24pIHtcbiAgICAgICAgICAgIGN0eC5kcmF3SW1hZ2UoaW1nLFxuICAgICAgICAgICAgICAgIE1hdGguZmxvb3IocG9pbnRbMF0gLSB3IC8gMiksXG4gICAgICAgICAgICAgICAgTWF0aC5mbG9vcihwb2ludFsxXSAtIGggLyAyKSwgdywgaCk7XG5cbiAgICAgICAgICAgIGxldCBwYWRkaW5nMiA9IHBhcnNlRmxvYXQoc3R5bGVbJy14LWtvdC1taW4tZGlzdGFuY2UnXSkgfHwgMDtcbiAgICAgICAgICAgIGNvbGxpZGVzLmFkZFBvaW50V0gocG9pbnQsIHcsIGgsIHBhZGRpbmcyLCBmZWF0dXJlLmtvdGhpY0lkKTtcbiAgICAgICAgfVxuICAgIH1cbn07IiwibGV0IE1hcENTU0luc3RhbmNlID0gbnVsbDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTWFwQ1NTIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBpZiAoTWFwQ1NTSW5zdGFuY2UgPT0gbnVsbCkge1xuICAgICAgICAgICAgTWFwQ1NTSW5zdGFuY2UgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5fc3R5bGVzPSB7fTtcbiAgICAgICAgICAgIHRoaXMuX2F2YWlsYWJsZVN0eWxlcz0gW107XG4gICAgICAgICAgICB0aGlzLl9pbWFnZXM9IHt9O1xuICAgICAgICAgICAgdGhpcy5fbG9jYWxlcz0gW107XG4gICAgICAgICAgICB0aGlzLl9wcmVzZW5jZV90YWdzPSBbXTtcbiAgICAgICAgICAgIHRoaXMuX3ZhbHVlX3RhZ3M9IFtdO1xuICAgICAgICAgICAgdGhpcy5fY2FjaGU9IHt9O1xuICAgICAgICAgICAgdGhpcy5fZGVidWc9IHtoaXQ6IDAsIG1pc3M6IDB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIE1hcENTU0luc3RhbmNlXG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBzaGFyZWQoKSB7XG4gICAgICAgIHJldHVybiBuZXcgTWFwQ1NTKCk7XG4gICAgfVxuXG4gICAgZ2V0IGF2YWlsYWJsZVN0eWxlcygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2F2YWlsYWJsZVN0eWxlcztcbiAgICB9XG5cbiAgICBzdGF0aWMgb25FcnJvcigpIHtcbiAgICB9XG5cbiAgICBzdGF0aWMgb25JbWFnZXNMb2FkKCkge1xuICAgIH0vKipcbiAgICAgKiBJbmNhbGlkYXRlIHN0eWxlcyBjYWNoZVxuICAgICAqL1xuICAgIHN0YXRpYyBpbnZhbGlkYXRlQ2FjaGUoKSB7XG4gICAgICAgIHRoaXMuX2NhY2hlID0ge307XG4gICAgfVxuXG4gICAgc3RhdGljIGVfbWluKC8qLi4uKi8pIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWluLmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGVfbWF4KC8qLi4uKi8pIHtcbiAgICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIHN0YXRpYyBlX2FueSgvKi4uLiovKSB7XG4gICAgICAgIGxldCBpO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YoYXJndW1lbnRzW2ldKSAhPT0gJ3VuZGVmaW5lZCcgJiYgYXJndW1lbnRzW2ldICE9PSAnJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHN0YXRpYyBlX251bShhcmcpIHtcbiAgICAgICAgaWYgKCFpc05hTihwYXJzZUZsb2F0KGFyZykpKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChhcmcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBlX3N0cihhcmcpIHtcbiAgICAgICAgcmV0dXJuIGFyZztcbiAgICB9XG4gICAgc3RhdGljIGVfaW50KGFyZykge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoYXJnLCAxMCk7XG4gICAgfVxuICAgIHN0YXRpYyBlX3RhZyhvYmosIHRhZykge1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHRhZykgJiYgb2JqW3RhZ10gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0YWc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGVfcHJvcChvYmosIHRhZykge1xuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KHRhZykgJiYgb2JqW3RhZ10gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBvYmpbdGFnXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiAnJztcbiAgICAgICAgfVxuICAgIH1cbiAgICBzdGF0aWMgZV9zcXJ0KGFyZykge1xuICAgICAgICByZXR1cm4gTWF0aC5zcXJ0KGFyZyk7XG4gICAgfVxuICAgIHN0YXRpYyBlX2Jvb2xlYW4oYXJnLCBpZl9leHAsIGVsc2VfZXhwKSB7XG4gICAgICAgIGlmICh0eXBlb2YoaWZfZXhwKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGlmX2V4cCA9ICd0cnVlJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YoZWxzZV9leHApID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgZWxzZV9leHAgPSAnZmFsc2UnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFyZyA9PT0gJzAnIHx8IGFyZyA9PT0gJ2ZhbHNlJyB8fCBhcmcgPT09ICcnKSB7XG4gICAgICAgICAgICByZXR1cm4gZWxzZV9leHA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaWZfZXhwO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBlX21ldHJpYyhhcmcpIHtcbiAgICAgICAgaWYgKC9cXGRcXHMqbW0kLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHJldHVybiAxMDAwICogcGFyc2VJbnQoYXJnLCAxMCk7XG4gICAgICAgIH0gZWxzZSBpZiAoL1xcZFxccypjbSQvLnRlc3QoYXJnKSkge1xuICAgICAgICAgICAgcmV0dXJuIDEwMCAqIHBhcnNlSW50KGFyZywgMTApO1xuICAgICAgICB9IGVsc2UgaWYgKC9cXGRcXHMqZG0kLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHJldHVybiAxMCAqIHBhcnNlSW50KGFyZywgMTApO1xuICAgICAgICB9IGVsc2UgaWYgKC9cXGRcXHMqa20kLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjAwMSAqIHBhcnNlSW50KGFyZywgMTApO1xuICAgICAgICB9IGVsc2UgaWYgKC9cXGRcXHMqaW4kLy50ZXN0KGFyZykpIHtcbiAgICAgICAgICAgIHJldHVybiAwLjAyNTQgKiBwYXJzZUludChhcmcsIDEwKTtcbiAgICAgICAgfSBlbHNlIGlmICgvXFxkXFxzKmZ0JC8udGVzdChhcmcpKSB7XG4gICAgICAgICAgICByZXR1cm4gMC4zMDQ4ICogcGFyc2VJbnQoYXJnLCAxMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoYXJnLCAxMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljICBlX3ptZXRyaWMoYXJnKSB7XG4gICAgICAgIHJldHVybiBNYXBDU1Muc2hhcmVkLmVfbWV0cmljKGFyZyk7XG4gICAgfVxuICAgIHN0YXRpYyBlX2xvY2FsaXplKHRhZ3MsIHRleHQpIHtcbiAgICAgICAgbGV0IGxvY2FsZXMgPSBNYXBDU1Muc2hhcmVkLl9sb2NhbGVzLCBpLCB0YWc7XG5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxvY2FsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRhZyA9IHRleHQgKyAnOicgKyBsb2NhbGVzW2ldO1xuICAgICAgICAgICAgaWYgKHRhZ3NbdGFnXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0YWdzW3RhZ107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGFnc1t0ZXh0XTtcbiAgICB9XG5cbiAgICBzdGF0aWMgbG9hZFN0eWxlKHN0eWxlLCByZXN0eWxlLCBzcHJpdGVfaW1hZ2VzLCBleHRlcm5hbF9pbWFnZXMsIHByZXNlbmNlX3RhZ3MsIHZhbHVlX3RhZ3MpIHtcbiAgICAgICAgbGV0IGk7XG4gICAgICAgIHNwcml0ZV9pbWFnZXMgPSBzcHJpdGVfaW1hZ2VzIHx8IFtdO1xuICAgICAgICBleHRlcm5hbF9pbWFnZXMgPSBleHRlcm5hbF9pbWFnZXMgfHwgW107XG5cbiAgICAgICAgaWYgKHByZXNlbmNlX3RhZ3MpIHtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBwcmVzZW5jZV90YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKE1hcENTUy5zaGFyZWQuX3ByZXNlbmNlX3RhZ3MuaW5kZXhPZihwcmVzZW5jZV90YWdzW2ldKSA8IDApIHtcbiAgICAgICAgICAgICAgICAgICAgTWFwQ1NTLnNoYXJlZC5fcHJlc2VuY2VfdGFncy5wdXNoKHByZXNlbmNlX3RhZ3NbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZV90YWdzKSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdmFsdWVfdGFncy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmIChNYXBDU1Muc2hhcmVkLl92YWx1ZV90YWdzLmluZGV4T2YodmFsdWVfdGFnc1tpXSkgPCAwKSB7XG4gICAgICAgICAgICAgICAgICAgIE1hcENTUy5zaGFyZWQuX3ZhbHVlX3RhZ3MucHVzaCh2YWx1ZV90YWdzW2ldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBNYXBDU1Muc2hhcmVkLl9zdHlsZXNbc3R5bGVdID0ge1xuICAgICAgICAgICAgcmVzdHlsZTogcmVzdHlsZSxcbiAgICAgICAgICAgIGltYWdlczogc3ByaXRlX2ltYWdlcyxcbiAgICAgICAgICAgIGV4dGVybmFsX2ltYWdlczogZXh0ZXJuYWxfaW1hZ2VzLFxuICAgICAgICAgICAgdGV4dHVyZXM6IHt9LFxuICAgICAgICAgICAgc3ByaXRlX2xvYWRlZDogIXNwcml0ZV9pbWFnZXMsXG4gICAgICAgICAgICBleHRlcm5hbF9pbWFnZXNfbG9hZGVkOiAhZXh0ZXJuYWxfaW1hZ2VzLmxlbmd0aFxuICAgICAgICB9O1xuXG4gICAgICAgIE1hcENTUy5zaGFyZWQuX2F2YWlsYWJsZVN0eWxlcy5wdXNoKHN0eWxlKTtcbiAgICB9LyoqXG4gICAgICogQ2FsbCBNYXBDU1Muc2hhcmVkLm9uSW1hZ2VzTG9hZCBjYWxsYmFjayBpZiBhbGwgc3ByaXRlIGFuZCBleHRlcm5hbFxuICAgICAqIGltYWdlcyB3YXMgbG9hZGVkXG4gICAgICovXG4gICAgc3RhdGljIF9vbkltYWdlc0xvYWQoc3R5bGUpIHtcbiAgICAgICAgaWYgKE1hcENTUy5zaGFyZWQuX3N0eWxlc1tzdHlsZV0uZXh0ZXJuYWxfaW1hZ2VzX2xvYWRlZCAmJlxuICAgICAgICAgICAgICAgIE1hcENTUy5zaGFyZWQuX3N0eWxlc1tzdHlsZV0uc3ByaXRlX2xvYWRlZCkge1xuICAgICAgICAgICAgTWFwQ1NTLm9uSW1hZ2VzTG9hZCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHN0YXRpYyBwcmVsb2FkU3ByaXRlSW1hZ2Uoc3R5bGUsIHVybCkge1xuXHRcdFxuICAgICAgICBsZXQgaW1hZ2VzID0gTWFwQ1NTLnNoYXJlZC5fc3R5bGVzW3N0eWxlXS5faW1hZ2VzLFxuICAgICAgICAgICAgaW1nID0gbmV3IEltYWdlKCk7XG5cbiAgICAgICAgZGVsZXRlIE1hcENTUy5zaGFyZWQuX3N0eWxlc1tzdHlsZV0uX2ltYWdlcztcblxuICAgICAgICBpbWcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGV0IGltYWdlO1xuICAgICAgICAgICAgZm9yIChpbWFnZSBpbiBpbWFnZXMpIHtcbiAgICAgICAgICAgICAgICBpZiAoaW1hZ2VzLmhhc093blByb3BlcnR5KGltYWdlKSkge1xuICAgICAgICAgICAgICAgICAgICBpbWFnZXNbaW1hZ2VdLnNwcml0ZSA9IGltZztcbiAgICAgICAgICAgICAgICAgICAgTWFwQ1NTLnNoYXJlZC5faW1hZ2VzW2ltYWdlXSA9IGltYWdlc1tpbWFnZV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgTWFwQ1NTLnNoYXJlZC5fc3R5bGVzW3N0eWxlXS5zcHJpdGVfbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIE1hcENTUy5fb25JbWFnZXNMb2FkKHN0eWxlKTtcbiAgICAgICAgfTtcbiAgICAgICAgaW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgTWFwQ1NTLm9uRXJyb3IoZSk7XG4gICAgICAgIH07XG4gICAgICAgIGltZy5zcmMgPSB1cmw7XG4gICAgfVxuICAgIHN0YXRpYyBwcmVsb2FkRXh0ZXJuYWxJbWFnZXMoc3R5bGUsIHVybFByZWZpeCkge1xuICAgICAgICBsZXQgZXh0ZXJuYWxfaW1hZ2VzID0gTWFwQ1NTLnNoYXJlZC5fc3R5bGVzW3N0eWxlXS5leHRlcm5hbF9pbWFnZXM7XG4gICAgICAgIGRlbGV0ZSBNYXBDU1Muc2hhcmVkLl9zdHlsZXNbc3R5bGVdLmV4dGVybmFsX2ltYWdlcztcblxuICAgICAgICB1cmxQcmVmaXggPSB1cmxQcmVmaXggfHwgJyc7XG4gICAgICAgIGxldCBsZW4gPSBleHRlcm5hbF9pbWFnZXMubGVuZ3RoLCBsb2FkZWQgPSAwLCBpO1xuXG4gICAgICAgIGZ1bmN0aW9uIGxvYWRJbWFnZSh1cmwpIHtcbiAgICAgICAgICAgIGxldCBpbWcgPSBuZXcgSW1hZ2UoKTtcbiAgICAgICAgICAgIGltZy5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbG9hZGVkKys7XG4gICAgICAgICAgICAgICAgTWFwQ1NTLnNoYXJlZC5faW1hZ2VzW3VybF0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHNwcml0ZTogaW1nLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGltZy5oZWlnaHQsXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBpbWcud2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIG9mZnNldDogMFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZCA9PT0gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIE1hcENTUy5zaGFyZWQuX3N0eWxlc1tzdHlsZV0uZXh0ZXJuYWxfaW1hZ2VzX2xvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIE1hcENTUy5fb25JbWFnZXNMb2FkKHN0eWxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLm9uZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbG9hZGVkKys7XG4gICAgICAgICAgICAgICAgaWYgKGxvYWRlZCA9PT0gbGVuKSB7XG4gICAgICAgICAgICAgICAgICAgIE1hcENTUy5zaGFyZWQuX3N0eWxlc1tzdHlsZV0uZXh0ZXJuYWxfaW1hZ2VzX2xvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIE1hcENTUy5fb25JbWFnZXNMb2FkKHN0eWxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaW1nLnNyYyA9IHVybDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgbG9hZEltYWdlKHVybFByZWZpeCArIGV4dGVybmFsX2ltYWdlc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgc3RhdGljIGdldEltYWdlKHJlZikge1xuICAgICAgICBsZXQgaW1nID0gTWFwQ1NTLnNoYXJlZC5faW1hZ2VzW3JlZl07XG5cbiAgICAgICAgaWYgKGltZyAmJiBpbWcuc3ByaXRlKSB7XG4gICAgICAgICAgICBsZXQgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gICAgICAgICAgICBjYW52YXMud2lkdGggPSBpbWcud2lkdGg7XG4gICAgICAgICAgICBjYW52YXMuaGVpZ2h0ID0gaW1nLmhlaWdodDtcblxuICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoJzJkJykuZHJhd0ltYWdlKGltZy5zcHJpdGUsXG4gICAgICAgICAgICAgICAgICAgIDAsIGltZy5vZmZzZXQsIGltZy53aWR0aCwgaW1nLmhlaWdodCxcbiAgICAgICAgICAgICAgICAgICAgMCwgMCwgaW1nLndpZHRoLCBpbWcuaGVpZ2h0KTtcblxuICAgICAgICAgICAgaW1nID0gTWFwQ1NTLnNoYXJlZC5faW1hZ2VzW3JlZl0gPSBjYW52YXM7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaW1nO1xuICAgIH1cbiAgICBnZXRUYWdLZXlzKHRhZ3MsIHpvb20sIHR5cGUsIHNlbGVjdG9yKSB7XG4gICAgICAgIGxldCBrZXlzID0gW10sIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLl9wcmVzZW5jZV90YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGFncy5oYXNPd25Qcm9wZXJ0eSh0aGlzLl9wcmVzZW5jZV90YWdzW2ldKSkge1xuICAgICAgICAgICAgICAgIGtleXMucHVzaCh0aGlzLl9wcmVzZW5jZV90YWdzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLl92YWx1ZV90YWdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGFncy5oYXNPd25Qcm9wZXJ0eSh0aGlzLl92YWx1ZV90YWdzW2ldKSkge1xuICAgICAgICAgICAgICAgIGtleXMucHVzaCh0aGlzLl92YWx1ZV90YWdzW2ldICsgJzonICsgdGFnc1t0aGlzLl92YWx1ZV90YWdzW2ldXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gW3pvb20sIHR5cGUsIHNlbGVjdG9yLCBrZXlzLmpvaW4oJzonKV0uam9pbignOicpO1xuICAgIH1cbiAgICByZXN0eWxlKHN0eWxlTmFtZXMsIHRhZ3MsIHpvb20sIHR5cGUsIHNlbGVjdG9yKSB7XG4gICAgICAgIGxldCBpLCBrZXkgPSB0aGlzLmdldFRhZ0tleXModGFncywgem9vbSwgdHlwZSwgc2VsZWN0b3IpLCBhY3Rpb25zID0gdGhpcy5fY2FjaGVba2V5XSB8fCB7fTtcblxuICAgICAgICBpZiAoIXRoaXMuX2NhY2hlLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2RlYnVnLm1pc3MgKz0gMTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBzdHlsZU5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgYWN0aW9ucyA9IE1hcENTUy5zaGFyZWQuX3N0eWxlc1tzdHlsZU5hbWVzW2ldXS5yZXN0eWxlKGFjdGlvbnMsIHRhZ3MsIHpvb20sIHR5cGUsIHNlbGVjdG9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2NhY2hlW2tleV0gPSBhY3Rpb25zO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fZGVidWcuaGl0ICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYWN0aW9ucztcbiAgICB9XG59XG4iLCJpbXBvcnQgTWFwQ1NTIGZyb20gXCIuL21hcGNzc1wiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBvc21vc25pbWtpIHtcblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICB0aGlzLnNwcml0ZV9pbWFnZXMgPSB7fTtcbiAgICAgICAgdGhpcy5leHRlcm5hbF9pbWFnZXMgPSBbXTtcbiAgICAgICAgdGhpcy5wcmVzZW5jZV90YWdzID0gWydzaG9wJ107XG4gICAgICAgIHRoaXMudmFsdWVfdGFncyA9IFsnY29sb3InLCAnYW1lbml0eScsICdwaycsICdidWlsZGluZyAnLCAnd2FsbCcsICdzdXJmYWNlJywgJ21hcmtpbmcnLCAnc2VydmljZScsICdhZGRyOmhvdXNlbnVtYmVyJywgJ3BvcHVsYXRpb24nLCAnbGVpc3VyZScsICd3YXRlcndheScsICdhZXJvd2F5JywgJ2xhbmR1c2UnLCAnYmFycmllcicsICdjb2xvdXInLCAncmFpbHdheScsICdvbmV3YXknLCAncmVsaWdpb24nLCAndG91cmlzbScsICdhZG1pbl9sZXZlbCcsICd0cmFuc3BvcnQnLCAnbmFtZScsICdidWlsZGluZycsICdwbGFjZScsICdyZXNpZGVudGlhbCcsICdoaWdod2F5JywgJ2VsZScsICdsaXZpbmdfc3RyZWV0JywgJ25hdHVyYWwnLCAnYm91bmRhcnknLCAnY2FwaXRhbCddO1xuXG4gICAgICAgIE1hcENTUy5sb2FkU3R5bGUoJ3N0eWxlcy9jb250YWd0JywgdGhpcy5yZXN0eWxlLCB0aGlzLnNwcml0ZV9pbWFnZXMsIHRoaXMuZXh0ZXJuYWxfaW1hZ2VzLCB0aGlzLnByZXNlbmNlX3RhZ3MsIHRoaXMudmFsdWVfdGFncyk7XG4gICAgICAgIE1hcENTUy5wcmVsb2FkRXh0ZXJuYWxJbWFnZXMoJ3N0eWxlcy9jb250YWd0Jyk7XG4gICAgfVxuXG4gICAgcmVzdHlsZShzdHlsZSwgdGFncywgem9vbSwgdHlwZSwgc2VsZWN0b3IpIHtcbiAgICAgICAgdmFyIHNfZGVmYXVsdCA9IHt9LCBzX2NlbnRlcmxpbmUgPSB7fSwgc190aWNrcyA9IHt9LCBzX2xhYmVsID0ge307XG4gICAgICAgIFxuICAgICAgICBpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwiYmFja2dyb3VuZFwiKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjRkZGRkZGJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxO1xuXHRcdH1cblx0XHRcbiAgICAgICAgXG5cdFx0aWYgKHRhZ3NbXCJzdXJmYWNlXCJdID09PSBcImZsb29yXCIpIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNGNUY0RkYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDMxO1xuXHRcdH1cblx0XHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJzdGVwc1wiICYmIHNlbGVjdG9yID09PSBcImFyZWFcIikgXG5cdFx0e1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI0ZGQTM4NCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ29wYWNpdHknXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDMzO1xuXHRcdH1cblx0XHRcblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwiZWxldmF0b3JcIiApIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNDQ0EzODQnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzMztcblx0XHR9XG5cdFx0XG5cdFx0aWYgKHRhZ3NbXCJzdXJmYWNlXCJdID09PSBcImVsZXZhdG9yXCIgJiYgc2VsZWN0b3IgPT09IFwiYXJlYVwiKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjQ0NBMzg0JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnb3BhY2l0eSddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzM7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wiaGlnaHdheVwiXSA9PT0gXCJzdGVwc1wiKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjRkZBMzg0JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzMztcblx0XHR9XG5cdFx0XG5cdFx0XG5cdFx0aWYgKHRhZ3NbXCJoaWdod2F5XCJdID09PSBcImVsZXZhdG9yXCIpIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNDQ0EzODQnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDMzO1xuXHRcdH1cblx0XHRcblx0XHRcblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwiYmFsY29ueVwiICYmIHNlbGVjdG9yID09PSBcImFyZWFcIiApIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyM4NzU2NDYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDAuNjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzM7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJkb29yXCIgJiYgc2VsZWN0b3IgPT0gXCJsaW5lXCIpIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjREJEQkRCJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDM5O1xuXHRcdH1cblx0XHRcblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwic29saWRcIiAmJiBzZWxlY3RvciA9PT0gXCJhcmVhXCIgKSBcblx0XHR7XG5cdFx0XHRcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyMwQjA4MTEnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDAuOTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzA7XG5cdFx0fVxuXHRcdFxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJ0cmFuc3BhcmVudFwiICYmIHNlbGVjdG9yID09PSBcImFyZWFcIiApIFxuXHRcdHtcblx0XHRcdFxuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI0ZGRic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMC40O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzMDtcblx0XHR9XG5cdFx0XG5cdFx0XG5cdFx0aWYgKHRhZ3NbXCJzdXJmYWNlXCJdID09PSBcInBsYW50XCIgICYmIHNlbGVjdG9yID09PSBcImFyZWFcIiApIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyM4M0RGNjAnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDAuOTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzA7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJzYW5kXCIgICYmIHNlbGVjdG9yID09PSBcImFyZWFcIiApIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNGREQ0ODUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMwMDAwMDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAwLjg7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMC45O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMS41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZGFzaGVzJ10gPSBbOSwgOV07XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJjb25jcmV0ZVwiICAmJiBzZWxlY3RvciA9PT0gXCJhcmVhXCIgKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjREREREREJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAwLjk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDMwO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMyMjIyMjInO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMS41O1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAwLjY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Rhc2hlcyddID0gWzksIDNdO1xuXHRcdH1cdFxuXHRcdFxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PT0gXCJwYXZpbmdfc2xhYlwiICYmIHNlbGVjdG9yID09PSBcImFyZWFcIiApIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNFMEQwREInO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMyMjIyMjInO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDAuNjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzA7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Rhc2hlcyddID0gWzUsIDJdO1xuXHRcdH1cblx0XHRcblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwiZG9vclwiICAmJiBzZWxlY3RvciA9PT0gXCJhcmVhXCIgKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjNjA3Rjg0JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAwLjY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzAwMDAwMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDM5O1xuXHRcdH1cblx0XHRcblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT09IFwiZ3JlZW5cIiAgJiYgc2VsZWN0b3IgPT09IFwiYXJlYVwiICkgXG5cdFx0e1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnIzg4QzAzNyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMC4yO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzMDtcblx0XHR9XG5cdFx0aWYgKHRhZ3NbXCJzdXJmYWNlXCJdID09PSBcIndpbmRvd1wiICAmJiBzZWxlY3RvciA9PT0gXCJhcmVhXCIgKSBcblx0XHR7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjMTNDNUNGJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAwLjM7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzAwMDAwMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDM1O1xuXHRcdH1cblx0XHRpZiAodGFnc1tcInN1cmZhY2VcIl0gPT0gXCJzYW5pdGFyeVwiICAmJiBzZWxlY3RvciA9PSBcImFyZWFcIikgXG5cdFx0e1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI0VFQ0ZGQyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzY7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wic3VyZmFjZVwiXSA9PSBcImJldmVyYWdlc1wiICAmJiBzZWxlY3RvciA9PSBcImFyZWFcIikgXG5cdFx0e1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI0UzRUZFQSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMzY7XG5cdFx0fVxuXHRcdFxuXHRcdGlmKHRhZ3NbXCJzdXJmYWNlXCJdID09IFwicm9vbVwiICYmIHNlbGVjdG9yID09IFwiYXJlYVwiKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjRTlFOUU5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1vcGFjaXR5J10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzNjtcblx0XHR9XG5cdFx0XG5cdFx0aWYodGFnc1tcImhhbmRyYWlsXCJdID09PSBcInllc1wiKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzExMTExMSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDI3O1xuICAgICAgICAgICAgc19kZWZhdWx0WydkYXNoZXMnXSA9IFs1LCA1XTtcblx0XHR9XG5cdFx0XG5cdFx0aWYodHlwZSA9PT0gJ3dheScgJiYgdGFnc1tcIndhbGxcIl0gPT09IFwieWVzXCIgJiYgem9vbSA8IDEyICkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMwMDAwMDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMC41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAyNztcblx0XHR9XG5cdFx0XG5cdFx0aWYodGFnc1tcIndhbGxcIl0gPT09IFwieWVzXCIgJiYgem9vbSA8IDE2ICYmIHpvb20gPj0gMTIpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjMDAwMDAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDI3O1xuXHRcdH1cblx0XHRcblx0XHRpZih0YWdzW1wid2FsbFwiXSA9PT0gXCJ5ZXNcIiAgJiYgem9vbSA+PSAxNiApIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjMDAwMDAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMjc7XG5cdFx0fVxuXHRcdFxuXHRcdGlmKHRhZ3NbXCJ3YWxsXCJdID49IDE2ICkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMwMDAwMDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMS41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAyNztcblx0XHR9XG5cdFx0XG5cdFx0aWYodGFnc1tcIndhbGxcIl0gPT0gXCJ5ZXNcIiAmJiBzZWxlY3RvciA9PSBcImFyZWFcIikge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI0U5RTlFOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMjI7XG5cdFx0fVxuXHRcdFxuXHRcdGlmICh0YWdzW1wiYnVpbGRpbmdcIl0gPT09IFwieWVzXCIgJiYgc2VsZWN0b3IgPT0gXCJhcmVhXCIpIFxuXHRcdHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNERERBRDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLW9wYWNpdHknXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI0NDQzlDNCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDg7XG5cdFx0fVxuXHRcdFxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ25hdHVyYWwnXSA9PT0gJ2NvYXN0bGluZScpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2ZjZjhlNCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1sYXllciddID0gJ2JvdHRvbSc7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnZ2xhY2llcicpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2ZjZmVmZic7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xlaXN1cmUnXSA9PT0gJ3BhcmsnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNjNGU5YTQnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsZWlzdXJlJ10gPT09ICdnYXJkZW4nKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ29yY2hhcmQnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnc2NydWInKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNlNWY1ZGMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyduYXR1cmFsJ10gPT09ICdoZWF0aCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2VjZmZlNSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ2luZHVzdHJpYWwnKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ21pbGl0YXJ5JykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjZGRkOGRhJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snYW1lbml0eSddID09PSAncGFya2luZycpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2VjZWRmNCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDM7XG4gICAgICAgIH1cblxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnZm9yZXN0JykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyduYXR1cmFsJ10gPT09ICd3b29kJykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICdmb3Jlc3QnKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ3dvb2QnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNkNmY0YzYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICdnYXJhZ2VzJykgJiYgem9vbSA+PSAxMCkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNkZGQ4ZGEnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyduYXR1cmFsJ10gPT09ICdmb3Jlc3QnKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ25hdHVyYWwnXSA9PT0gJ3dvb2QnKSAmJiB6b29tID49IDEwKSB8fCAoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbGFuZHVzZSddID09PSAnZm9yZXN0JykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICd3b29kJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb2Zmc2V0J10gPSAwO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICcxMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNlcmlmIEl0YWxpYyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICdncmVlbic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtYWxsb3ctb3ZlcmxhcCddID0gJ2ZhbHNlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1taW4tZGlzdGFuY2UnXSA9ICcwICc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ2dyYXNzJykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyduYXR1cmFsJ10gPT09ICdncmFzcycpKSB8fCAoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnbWVhZG93JykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICdtZWFkb3cnKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xhbmR1c2UnXSA9PT0gJ3JlY3JlYXRpb25fZ3JvdW5kJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjZjRmZmU1JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gNDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnd2V0bGFuZCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSA0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICdmYXJtbGFuZCcpKSB8fCAoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbGFuZHVzZSddID09PSAnZmFybScpKSB8fCAoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbGFuZHVzZSddID09PSAnZmllbGQnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZmlsbC1jb2xvciddID0gJyNmZmY1YzQnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSA1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsYW5kdXNlJ10gPT09ICdjZW1ldGVyeScpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2U1ZjVkYyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2Flcm93YXknXSA9PT0gJ2Flcm9kcm9tZScpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMwMDhhYzYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMC44O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSA1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsZWlzdXJlJ10gPT09ICdzdGFkaXVtJykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydsZWlzdXJlJ10gPT09ICdwaXRjaCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnI2UzZGViMSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWyd3YXRlcndheSddID09PSAncml2ZXInKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjQzRENEY1JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuOTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gOTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ3dhdGVyd2F5J10gPT09ICdzdHJlYW0nKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjQzRENEY1JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gOTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ3dhdGVyd2F5J10gPT09ICdjYW5hbCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNhYmM0ZjUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMC42O1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSA5O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyd3YXRlcndheSddID09PSAncml2ZXJiYW5rJykpIHx8ICgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWyduYXR1cmFsJ10gPT09ICd3YXRlcicpKSB8fCAoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbGFuZHVzZSddID09PSAncmVzZXJ2b2lyJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtY29sb3InXSA9ICcjQzRENEY1JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjQzRENEY1JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gOTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbmF0dXJhbCddID09PSAnd2F0ZXInKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1vZmZzZXQnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzEwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2VyaWYgSXRhbGljJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyMyODVmZDEnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWFsbG93LW92ZXJsYXAnXSA9ICdmYWxzZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnY29uc3RydWN0aW9uJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtcG9zaXRpb24nXSA9ICdsaW5lJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM0MDQwNDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIEJvb2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAyO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZGFzaGVzJ10gPSBbOSwgOV07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdjb25zdHJ1Y3Rpb24nKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy13aWR0aCddID0gMC41O1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctY29sb3InXSA9ICcjOTk2NzAzJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDM7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDEwO1xuICAgICAgICAgICAgc19kZWZhdWx0WydkYXNoZXMnXSA9IFs5LCA5XTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ2Zvb3R3YXknKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdwYXRoJykpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnY3ljbGV3YXknKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdwZWRlc3RyaWFuJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtcG9zaXRpb24nXSA9ICdsaW5lJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM0MDQwNDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIEJvb2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnI2JmOTZjZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjI7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDEwO1xuICAgICAgICAgICAgc19kZWZhdWx0WydkYXNoZXMnXSA9IFsyLCAyXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3N0ZXBzJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtcG9zaXRpb24nXSA9ICdsaW5lJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM0MDQwNDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIEJvb2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAzO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNiZjk2Y2UnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZGFzaGVzJ10gPSBbMSwgMV07XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2xpbmVjYXAnXSA9ICdidXR0JztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3JvYWQnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICd0cmFjaycpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb29rJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMS41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdyb2FkJykpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAndHJhY2snKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDIuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLXdpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSA5O1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnc2VydmljZScpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEuMjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLXdpZHRoJ10gPSAwLjM7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3Jlc2lkZW50aWFsJykgJiYgem9vbSA9PT0gMTYpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAndW5jbGFzc2lmaWVkJykgJiYgem9vbSA9PT0gMTYpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnbGl2aW5nX3N0cmVldCcpICYmIHpvb20gPT09IDE2KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3NlcnZpY2UnICYmICh0YWdzWydsaXZpbmdfc3RyZWV0J10gPT09ICctMScgfHwgdGFnc1snbGl2aW5nX3N0cmVldCddID09PSAnZmFsc2UnIHx8IHRhZ3NbJ2xpdmluZ19zdHJlZXQnXSA9PT0gJ25vJykgJiYgdGFnc1snc2VydmljZSddICE9PSAncGFya2luZ19haXNsZScpICYmIHpvb20gPT09IDE2KSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb29rJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMy41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDEwO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdyZXNpZGVudGlhbCcpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3VuY2xhc3NpZmllZCcpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ2xpdmluZ19zdHJlZXQnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdzZXJ2aWNlJyAmJiAodGFnc1snbGl2aW5nX3N0cmVldCddID09PSAnLTEnIHx8IHRhZ3NbJ2xpdmluZ19zdHJlZXQnXSA9PT0gJ2ZhbHNlJyB8fCB0YWdzWydsaXZpbmdfc3RyZWV0J10gPT09ICdubycpICYmIHRhZ3NbJ3NlcnZpY2UnXSAhPT0gJ3BhcmtpbmdfYWlzbGUnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDQuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLXdpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnc2Vjb25kYXJ5JykgJiYgem9vbSA9PT0gMTYpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnc2Vjb25kYXJ5X2xpbmsnKSAmJiB6b29tID09PSAxNikgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICd0ZXJ0aWFyeScpICYmIHpvb20gPT09IDE2KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3RlcnRpYXJ5X2xpbmsnKSAmJiB6b29tID09PSAxNikpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9sZCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZjZmZkMSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy13aWR0aCddID0gMC41O1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctY29sb3InXSA9ICcjOTk2NzAzJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTE7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdzZWNvbmRhcnknKSAmJiB6b29tID09PSAxNykgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdzZWNvbmRhcnlfbGluaycpICYmIHpvb20gPT09IDE3KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3RlcnRpYXJ5JykgJiYgem9vbSA9PT0gMTcpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAndGVydGlhcnlfbGluaycpICYmIHpvb20gPT09IDE3KSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb2xkJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gODtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjZmNmZmQxJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLXdpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3NlY29uZGFyeScpICYmIHpvb20gPT09IDE4KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3NlY29uZGFyeV9saW5rJykgJiYgem9vbSA9PT0gMTgpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAndGVydGlhcnknKSAmJiB6b29tID09PSAxOCkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICd0ZXJ0aWFyeV9saW5rJykgJiYgem9vbSA9PT0gMTgpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtcG9zaXRpb24nXSA9ICdsaW5lJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM0MDQwNDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIEJvbGQnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSA5O1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmY2ZmZDEnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDExO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAncHJpbWFyeScpICYmIHpvb20gPT09IDE2KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3ByaW1hcnlfbGluaycpICYmIHpvb20gPT09IDE2KSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb2xkJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gOTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjZmNlYTk3JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLXdpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3ByaW1hcnknKSAmJiB6b29tID09PSAxNykgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdwcmltYXJ5X2xpbmsnKSAmJiB6b29tID09PSAxNykpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9sZCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEwO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmY2VhOTcnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDEyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAncHJpbWFyeScpICYmIHpvb20gPT09IDE4KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3ByaW1hcnlfbGluaycpICYmIHpvb20gPT09IDE4KSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb2xkJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMTE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZjZWE5Nyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy13aWR0aCddID0gMC41O1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctY29sb3InXSA9ICcjOTk2NzAzJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTI7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICd0cnVuaycpICYmIHpvb20gPT09IDE3KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3RydW5rX2xpbmsnKSAmJiB6b29tID09PSAxNykgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdtb3RvcndheScpICYmIHpvb20gPT09IDE3KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ21vdG9yd2F5X2xpbmsnKSAmJiB6b29tID09PSAxNykpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQwNDA0MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9sZCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEyO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyNmZmQ3ODAnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydjYXNpbmctd2lkdGgnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy1jb2xvciddID0gJyM5OTY3MDMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxMztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3RydW5rJykgJiYgem9vbSA9PT0gMTgpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAndHJ1bmtfbGluaycpICYmIHpvb20gPT09IDE4KSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ21vdG9yd2F5JykgJiYgem9vbSA9PT0gMTgpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAnbW90b3J3YXlfbGluaycpICYmIHpvb20gPT09IDE4KSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LXBvc2l0aW9uJ10gPSAnbGluZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNDA0MDQwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb2xkJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMTM7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZmZDc4MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Nhc2luZy13aWR0aCddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY2FzaW5nLWNvbG9yJ10gPSAnIzk5NjcwMyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDEzO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICd0cnVuaycpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ3RydW5rX2xpbmsnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdtb3RvcndheScpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gJ21vdG9yd2F5X2xpbmsnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydoaWdod2F5J10gPT09ICdwcmltYXJ5JykpIHx8ICgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snaGlnaHdheSddID09PSAncHJpbWFyeV9saW5rJykpKSB7XG4gICAgICAgICAgICBzX2NlbnRlcmxpbmVbJ3dpZHRoJ10gPSAwLjM7XG4gICAgICAgICAgICBzX2NlbnRlcmxpbmVbJ2NvbG9yJ10gPSAnI2ZhNjQ3OCc7XG4gICAgICAgICAgICBzX2NlbnRlcmxpbmVbJ3otaW5kZXgnXSA9IDE0O1xuICAgICAgICAgICAgc19jZW50ZXJsaW5lWycteC1tYXBuaWstbGF5ZXInXSA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgKHRhZ3NbJ29uZXdheSddID09PSAnMScgfHwgdGFnc1snb25ld2F5J10gPT09ICd0cnVlJyB8fCB0YWdzWydvbmV3YXknXSA9PT0gJ3llcycpKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnbGluZS1zdHlsZSddID0gJ2Fycm93cyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE1O1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbGF5ZXInXSA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdsaW5lJyAmJiB0YWdzWydyYWlsd2F5J10gPT09ICdyYWlsJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjQ7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzYwNjA2MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE1O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdsaW5lJyAmJiB0YWdzWydyYWlsd2F5J10gPT09ICdyYWlsJykpKSB7XG4gICAgICAgICAgICBzX3RpY2tzWyd3aWR0aCddID0gMTtcbiAgICAgICAgICAgIHNfdGlja3NbJ2NvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX3RpY2tzWydkYXNoZXMnXSA9IFs2LCA2XTtcbiAgICAgICAgICAgIHNfdGlja3NbJ3otaW5kZXgnXSA9IDE2O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1sncmFpbHdheSddID09PSAnc3Vid2F5JykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAzO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJyMwNzI4ODknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZGFzaGVzJ10gPSBbMywgM107XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ29wYWNpdHknXSA9IDAuMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnbGluZWNhcCddID0gJ2J1dHQnO1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbGF5ZXInXSA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snYmFycmllciddID09PSAnZmVuY2UnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICdibGFjayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE2O1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbGF5ZXInXSA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snYmFycmllciddID09PSAnd2FsbCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMC41O1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJ2JsYWNrJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1sYXllciddID0gJ3RvcCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydtYXJraW5nJ10gPT09ICdzcG9ydCcgJiYgKCF0YWdzLmhhc093blByb3BlcnR5KCdjb2xvdXInKSkgJiYgKCF0YWdzLmhhc093blByb3BlcnR5KCdjb2xvcicpKSkpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2EwYTBhMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE2O1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbGF5ZXInXSA9ICd0b3AnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snbWFya2luZyddID09PSAnc3BvcnQnICYmIHRhZ3NbJ2NvbG91ciddID09PSAnd2hpdGUnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydtYXJraW5nJ10gPT09ICdzcG9ydCcgJiYgdGFnc1snY29sb3InXSA9PT0gJ3doaXRlJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydjb2xvciddID0gJ3doaXRlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1sYXllciddID0gJ3RvcCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydtYXJraW5nJ10gPT09ICdzcG9ydCcgJiYgdGFnc1snY29sb3VyJ10gPT09ICdyZWQnKSkgfHwgKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydtYXJraW5nJ10gPT09ICdzcG9ydCcgJiYgdGFnc1snY29sb3InXSA9PT0gJ3JlZCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd3aWR0aCddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjYzAwMDAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1sYXllciddID0gJ3RvcCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydtYXJraW5nJ10gPT09ICdzcG9ydCcgJiYgdGFnc1snY29sb3VyJ10gPT09ICdibGFjaycpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ21hcmtpbmcnXSA9PT0gJ3Nwb3J0JyAmJiB0YWdzWydjb2xvciddID09PSAnYmxhY2snKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnYmxhY2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxNjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnLXgtbWFwbmlrLWxheWVyJ10gPSAndG9wJztcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ25vZGUnICYmIHRhZ3NbJ2FtZW5pdHknXSA9PT0gJ3BsYWNlX29mX3dvcnNoaXAnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM2MjNmMDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTZXJpZiBJdGFsaWMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb2Zmc2V0J10gPSAzO1xuICAgICAgICAgICAgc19kZWZhdWx0WydtYXgtd2lkdGgnXSA9IDcwO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydhbWVuaXR5J10gPT09ICdwbGFjZV9vZl93b3JzaGlwJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNjIzZjAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2VyaWYgSXRhbGljJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnbWF4LXdpZHRoJ10gPSA3MDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTY7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzExMTExMSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb3BhY2l0eSddID0gJzEnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydmaWxsLWNvbG9yJ10gPSAnIzc3Nzc3Nyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZpbGwtb3BhY2l0eSddID0gMC41O1xuICAgICAgICB9XG5cbiAgICAgXG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydib3VuZGFyeSddID09PSAnYWRtaW5pc3RyYXRpdmUnICYmIHRhZ3NbJ2FkbWluX2xldmVsJ10gPT09ICcyJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzIwMjAyMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Rhc2hlcyddID0gWzYsIDRdO1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAwLjc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE2O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydib3VuZGFyeSddID09PSAnYWRtaW5pc3RyYXRpdmUnICYmIHRhZ3NbJ2FkbWluX2xldmVsJ10gPT09ICczJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAxLjM7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnI2ZmOTljYyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ29wYWNpdHknXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTY7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2JvdW5kYXJ5J10gPT09ICdhZG1pbmlzdHJhdGl2ZScgJiYgdGFnc1snYWRtaW5fbGV2ZWwnXSA9PT0gJzYnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuNTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjMTAxMDEwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZGFzaGVzJ10gPSBbMSwgMl07XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ29wYWNpdHknXSA9IDAuNjtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTYuMTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydib3VuZGFyeSddID09PSAnYWRtaW5pc3RyYXRpdmUnICYmIHRhZ3NbJ2FkbWluX2xldmVsJ10gPT09ICc0JykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzAwMDAwMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2Rhc2hlcyddID0gWzEsIDJdO1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAwLjg7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE2LjM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnd2F5JyAmJiB0YWdzWydyYWlsd2F5J10gPT09ICd0cmFtJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3otaW5kZXgnXSA9IDE3O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ25vZGUnICYmIHRhZ3NbJ3JhaWx3YXknXSA9PT0gJ3N0YXRpb24nICYmIHRhZ3NbJ3RyYW5zcG9ydCddICE9PSAnc3Vid2F5JykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb2Zmc2V0J10gPSA3O1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBNb25vIEJvb2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzAwMGQ2Yyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWFsbG93LW92ZXJsYXAnXSA9ICdmYWxzZSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1taW4tZGlzdGFuY2UnXSA9ICcwJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICdub2RlJyAmJiB0YWdzWydyYWlsd2F5J10gPT09ICdzdWJ3YXlfZW50cmFuY2UnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1sncmFpbHdheSddID09PSAnc3Vid2F5X2VudHJhbmNlJyAmJiAodGFncy5oYXNPd25Qcm9wZXJ0eSgnbmFtZScpKSkpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb2Zmc2V0J10gPSAxMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDI7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjMTMwMGJiJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtYWxsb3ctb3ZlcmxhcCddID0gJ2ZhbHNlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnLXgtbWFwbmlrLW1pbi1kaXN0YW5jZSddID0gJzAnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ25vZGUnICYmIHRhZ3NbJ2Flcm93YXknXSA9PT0gJ2Flcm9kcm9tZScpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMTI7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIENvbmRlbnNlZCBCb2xkJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyMxZTdjYTUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1hbGxvdy1vdmVybGFwJ10gPSAnZmFsc2UnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAxNztcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ25vZGUnICYmIHRhZ3NbJ3BsYWNlJ10gPT09ICd0b3duJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzgwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb29rJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyMxMDEwMTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9wYWNpdHknXSA9ICcwLjInO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWFsbG93LW92ZXJsYXAnXSA9ICd0cnVlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMjA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1sncGxhY2UnXSA9PT0gJ2NpdHknKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnMTAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBCb29rJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyMxMDEwMTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9wYWNpdHknXSA9ICcwLjMnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWFsbG93LW92ZXJsYXAnXSA9ICd0cnVlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMjA7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1sncGxhY2UnXSA9PT0gJ3ZpbGxhZ2UnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1vZmZzZXQnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIEJvb2snO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzYwNjA2MCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWFsbG93LW92ZXJsYXAnXSA9ICdmYWxzZSc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1sncGxhY2UnXSA9PT0gJ2hhbWxldCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnOCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgQm9vayc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtY29sb3InXSA9ICcjNTA1MDUwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLWNvbG9yJ10gPSAnI2ZmZmZmZic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtYWxsb3ctb3ZlcmxhcCddID0gJ2ZhbHNlJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgdGFnc1snbGFuZHVzZSddID09PSAnbmF0dXJlX3Jlc2VydmUnKSkgfHwgKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmIHRhZ3NbJ2xlaXN1cmUnXSA9PT0gJ3BhcmsnKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ25hbWUnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1vZmZzZXQnXSA9IDE7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzEwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2VyaWYgSXRhbGljJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyMzYzgwMDAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1hbGxvdy1vdmVybGFwJ10gPSAnZmFsc2UnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ3dheScgJiYgdGFnc1snd2F0ZXJ3YXknXSA9PT0gJ3N0cmVhbScpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ3dhdGVyd2F5J10gPT09ICdyaXZlcicpKSB8fCAoKHR5cGUgPT09ICd3YXknICYmIHRhZ3NbJ3dhdGVyd2F5J10gPT09ICdjYW5hbCcpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LXNpemUnXSA9ICc5JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBPYmxpcXVlJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM1NDdiZDEnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2xpbmUnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgodHlwZSA9PT0gJ25vZGUnICYmIHRhZ3NbJ3BsYWNlJ10gPT09ICdvY2VhbicpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnMTEnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIE9ibGlxdWUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzIwMjAyMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAtMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnLXgtbWFwbmlrLW1pbi1kaXN0YW5jZSddID0gJzAnO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1sncGxhY2UnXSA9PT0gJ3NlYScpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnMTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wydmb250LWZhbWlseSddID0gJ0RlamFWdSBTYW5zIE9ibGlxdWUnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tcmFkaXVzJ10gPSAxO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWNvbG9yJ10gPSAnIzQ5NzZkMSc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1jb2xvciddID0gJyNmZmZmZmYnO1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbWluLWRpc3RhbmNlJ10gPSAnMCc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1snbmF0dXJhbCddID09PSAncGVhaycpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAnbmFtZScpO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LW9mZnNldCddID0gMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnNyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtZmFtaWx5J10gPSAnRGVqYVZ1IFNhbnMgTW9ubyBCb29rJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMDtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM2NjQyMjknO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnLXgtbWFwbmlrLW1pbi1kaXN0YW5jZSddID0gJzAnO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCgoc2VsZWN0b3IgPT09ICdhcmVhJyAmJiB0YWdzWydib3VuZGFyeSddID09PSAnYWRtaW5pc3RyYXRpdmUnICYmIHRhZ3NbJ2FkbWluX2xldmVsJ10gPT09ICc2JykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtb2Zmc2V0J10gPSAtMTA7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzEyJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBFeHRyYUxpZ2h0JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM3ODQ4YTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0LWhhbG8tY29sb3InXSA9ICcjZmZmZmZmJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHR5cGUgPT09ICdub2RlJyAmJiB0YWdzWydwbGFjZSddID09PSAnc3VidXJiJykpKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQnXSA9IE1hcENTUy5lX2xvY2FsaXplKHRhZ3MsICduYW1lJyk7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzEyJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1mYW1pbHknXSA9ICdEZWphVnUgU2FucyBFeHRyYUxpZ2h0JztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1jb2xvciddID0gJyM3ODQ4YTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd6LWluZGV4J10gPSAyMDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICgoKHNlbGVjdG9yID09PSAnYXJlYScgJiYgKHRhZ3MuaGFzT3duUHJvcGVydHkoJ2J1aWxkaW5nJykpKSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDAuMztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjY2NhMzUyJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnei1pbmRleCddID0gMTc7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKChzZWxlY3RvciA9PT0gJ2FyZWEnICYmICh0YWdzLmhhc093blByb3BlcnR5KCdidWlsZGluZycpKSkgJiYgem9vbSA+PSAxOSkpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dCddID0gTWFwQ1NTLmVfbG9jYWxpemUodGFncywgJ2FkZHI6aG91c2VudW1iZXInKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1oYWxvLXJhZGl1cyddID0gMTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsndGV4dC1wb3NpdGlvbiddID0gJ2NlbnRlcic7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2ZvbnQtc2l6ZSddID0gJzgnO1xuICAgICAgICAgICAgc19kZWZhdWx0WycteC1tYXBuaWstbWluLWRpc3RhbmNlJ10gPSAnMTAnO1xuICAgICAgICAgICAgc19kZWZhdWx0WydvcGFjaXR5J10gPSAwLjg7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoKCh0eXBlID09PSAnbm9kZScgJiYgdGFnc1snaGlnaHdheSddID09PSAnbWlsZXN0b25lJyAmJiAodGFncy5oYXNPd25Qcm9wZXJ0eSgncGsnKSkpKSkge1xuICAgICAgICAgICAgc19kZWZhdWx0Wyd0ZXh0J10gPSBNYXBDU1MuZV9sb2NhbGl6ZSh0YWdzLCAncGsnKTtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnZm9udC1zaXplJ10gPSAnNyc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3RleHQtaGFsby1yYWRpdXMnXSA9IDU7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJy14LW1hcG5pay1taW4tZGlzdGFuY2UnXSA9ICcwJztcbiAgICAgICAgfVxuICAgICAgIFxuICAgICAgICBpZih0eXBlID09PSAnd2F5JyAmJiBzZWxlY3RvciA9PT0gJ2xpbmUnICYmIHRhZ3NbJ2hpZ2h3YXknXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ2NvbG9yJ10gPSAnIzAwMDAwMCc7XG4gICAgICAgICAgICBzX2RlZmF1bHRbJ3dpZHRoJ10gPSAwLjU7XG5cdFx0fVxuXHRcdFxuXHRcdGlmKHR5cGUgPT09ICd3YXknICYmIHNlbGVjdG9yID09PSAnbGluZScgJiYgdGFnc1snaGlnaHdheSddID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjMDAwMDAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDE7XG5cdFx0fVxuXHRcdFxuXHRcdGlmKHR5cGUgPT09ICd3YXknICYmIHNlbGVjdG9yID09PSAnbGluZScgJiYgdGFnc1snaGlnaHdheSddID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnY29sb3InXSA9ICcjMDAwMDAwJztcbiAgICAgICAgICAgIHNfZGVmYXVsdFsnd2lkdGgnXSA9IDEuNTtcblx0XHR9XG5cdFx0XG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhzX2RlZmF1bHQpLmxlbmd0aCkge1xuICAgICAgICAgICAgc3R5bGVbJ2RlZmF1bHQnXSA9IHNfZGVmYXVsdDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoT2JqZWN0LmtleXMoc19jZW50ZXJsaW5lKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHN0eWxlWydjZW50ZXJsaW5lJ10gPSBzX2NlbnRlcmxpbmU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHNfdGlja3MpLmxlbmd0aCkge1xuICAgICAgICAgICAgc3R5bGVbJ3RpY2tzJ10gPSBzX3RpY2tzO1xuICAgICAgICB9XG4gICAgICAgIGlmIChPYmplY3Qua2V5cyhzX2xhYmVsKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHN0eWxlWydsYWJlbCddID0gc19sYWJlbDtcbiAgICAgICAgfVxuICAgICAgIFxuICAgICAgICByZXR1cm4gc3R5bGU7XG4gICAgfVxuXG59IiwiaW1wb3J0IE1hcENTUyBmcm9tIFwiLi9tYXBjc3NcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU3R5bGUge1xuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHRoaXMuX2RlZmF1bHRDYW52YXNTdHlsZXMgPSB7XG4gICAgICAgICAgICBzdHJva2VTdHlsZTogJ3JnYmEoMCwwLDAsMC41KScsXG4gICAgICAgICAgICBmaWxsU3R5bGU6XG4gICAgICAgICAgICAgICAgJ3JnYmEoMCwwLDAsMC41KScsXG4gICAgICAgICAgICBsaW5lV2lkdGg6XG4gICAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgIGxpbmVDYXA6XG4gICAgICAgICAgICAgICAgJ3JvdW5kJyxcbiAgICAgICAgICAgIGxpbmVKb2luOlxuICAgICAgICAgICAgICAgICdyb3VuZCcsXG4gICAgICAgICAgICB0ZXh0QWxpZ246XG4gICAgICAgICAgICAgICAgJ2NlbnRlcicsXG4gICAgICAgICAgICB0ZXh0QmFzZWxpbmU6XG4gICAgICAgICAgICAgICAgJ21pZGRsZSdcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgc3RhdGljIGdldCBkZWZhdWx0Q2FudmFzU3R5bGVzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVmYXVsdENhbnZhc1N0eWxlcztcbiAgICB9XG5cbiAgICBzdGF0aWMgcG9wdWxhdGVMYXllcnMoZmVhdHVyZXMsIHpvb20sIHN0eWxlcykge1xuICAgICAgICBsZXQgbGF5ZXJzID0ge30sXG4gICAgICAgICAgICBpLCBsZW4sIGZlYXR1cmUsIGxheWVySWQsIGxheWVyU3R5bGU7XG5cbiAgICAgICAgbGV0IHN0eWxlZEZlYXR1cmVzID0gU3R5bGUuc3R5bGVGZWF0dXJlcyhmZWF0dXJlcywgem9vbSwgc3R5bGVzKTtcblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBzdHlsZWRGZWF0dXJlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgZmVhdHVyZSA9IHN0eWxlZEZlYXR1cmVzW2ldO1xuICAgICAgICAgICAgbGF5ZXJTdHlsZSA9IGZlYXR1cmUuc3R5bGVbJy14LW1hcG5pay1sYXllciddO1xuICAgICAgICAgICAgbGF5ZXJJZCA9ICFsYXllclN0eWxlID8gZmVhdHVyZS5wcm9wZXJ0aWVzLmxheWVyIHx8IDEwMDAgOlxuICAgICAgICAgICAgICAgIGxheWVyU3R5bGUgPT09ICd0b3AnID8gMTAwMDAgOiBsYXllclN0eWxlO1xuXG4gICAgICAgICAgICBsYXllcnNbbGF5ZXJJZF0gPSBsYXllcnNbbGF5ZXJJZF0gfHwgW107XG4gICAgICAgICAgICBsYXllcnNbbGF5ZXJJZF0ucHVzaChmZWF0dXJlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsYXllcnM7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFN0eWxlKGZlYXR1cmUsIHpvb20sIHN0eWxlTmFtZXMpIHtcbiAgICAgICAgbGV0IHNoYXBlID0gZmVhdHVyZS50eXBlLFxuICAgICAgICAgICAgdHlwZSwgc2VsZWN0b3I7XG4gICAgICAgIGlmIChzaGFwZSA9PT0gJ0xpbmVTdHJpbmcnIHx8IHNoYXBlID09PSAnTXVsdGlMaW5lU3RyaW5nJykge1xuICAgICAgICAgICAgdHlwZSA9ICd3YXknO1xuICAgICAgICAgICAgc2VsZWN0b3IgPSAnbGluZSc7XG4gICAgICAgIH0gZWxzZSBpZiAoc2hhcGUgPT09ICdQb2x5Z29uJyB8fCBzaGFwZSA9PT0gJ011bHRpUG9seWdvbicpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnd2F5JztcbiAgICAgICAgICAgIHNlbGVjdG9yID0gJ2FyZWEnO1xuICAgICAgICB9IGVsc2UgaWYgKHNoYXBlID09PSAnUG9pbnQnIHx8IHNoYXBlID09PSAnTXVsdGlQb2ludCcpIHtcbiAgICAgICAgICAgIHR5cGUgPSAnbm9kZSc7XG4gICAgICAgICAgICBzZWxlY3RvciA9ICdub2RlJztcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBNYXBDU1Muc2hhcmVkLnJlc3R5bGUoc3R5bGVOYW1lcywgZmVhdHVyZS5wcm9wZXJ0aWVzLCB6b29tLCB0eXBlLCBzZWxlY3Rvcik7XG4gICAgfVxuXG4gICAgc3RhdGljIHN0eWxlRmVhdHVyZXMoZmVhdHVyZXMsIHpvb20sIHN0eWxlTmFtZXMpIHtcbiAgICAgICAgbGV0IHN0eWxlZEZlYXR1cmVzID0gW10sXG4gICAgICAgICAgICBpLCBqLCBsZW4sIGZlYXR1cmUsIHN0eWxlLCByZXN0eWxlZEZlYXR1cmUsIGs7XG5cbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gZmVhdHVyZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGZlYXR1cmUgPSBmZWF0dXJlc1tpXTtcbiAgICAgICAgICAgIHN0eWxlID0gU3R5bGUuZ2V0U3R5bGUoZmVhdHVyZSwgem9vbSwgc3R5bGVOYW1lcyk7XG4gICAgICAgICAgICBmb3IgKGogaW4gc3R5bGUpIHtcbiAgICAgICAgICAgICAgICBpZiAoaiA9PT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3R5bGVkRmVhdHVyZSA9IGZlYXR1cmU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzdHlsZWRGZWF0dXJlID0ge307XG4gICAgICAgICAgICAgICAgICAgIGZvciAoayBpbiBmZWF0dXJlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0eWxlZEZlYXR1cmVba10gPSBmZWF0dXJlW2tdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzdHlsZWRGZWF0dXJlLmtvdGhpY0lkID0gaSArIDE7XG4gICAgICAgICAgICAgICAgcmVzdHlsZWRGZWF0dXJlLnN0eWxlID0gc3R5bGVbal07XG4gICAgICAgICAgICAgICAgcmVzdHlsZWRGZWF0dXJlLnpJbmRleCA9IHN0eWxlW2pdWyd6LWluZGV4J10gfHwgMDtcbiAgICAgICAgICAgICAgICByZXN0eWxlZEZlYXR1cmUuc29ydEtleSA9IHJlc3R5bGVkRmVhdHVyZS56SW5kZXg7XG5cbiAgICAgICAgICAgICAgICBzdHlsZWRGZWF0dXJlcy5wdXNoKHJlc3R5bGVkRmVhdHVyZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuXG4gICAgICAgIHN0eWxlZEZlYXR1cmVzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBhLnpJbmRleCA8IGIuekluZGV4ID8gLTEgOlxuICAgICAgICAgICAgICAgIGEuekluZGV4ID4gYi56SW5kZXggPyAxIDogMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHN0eWxlZEZlYXR1cmVzO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRGb250U3RyaW5nKG5hbWUsIHNpemUsIHN0KSB7XG4gICAgICAgIG5hbWUgPSBuYW1lIHx8ICcnO1xuICAgICAgICBzaXplID0gc2l6ZSB8fCA5O1xuXG4gICAgICAgIGxldCBmYW1pbHkgPSBuYW1lID8gbmFtZSArICcsICcgOiAnJztcblxuICAgICAgICBuYW1lID0gbmFtZS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgIGxldCBzdHlsZXMgPSBbXTtcbiAgICAgICAgaWYgKHN0Wydmb250LXN0eWxlJ10gPT09ICdpdGFsaWMnIHx8IHN0Wydmb250LXN0eWxlJ10gPT09ICdvYmxpcXVlJykge1xuICAgICAgICAgICAgc3R5bGVzLnB1c2goc3RbJ2ZvbnQtc3R5bGUnXSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHN0Wydmb250LWxldGlhbnQnXSA9PT0gJ3NtYWxsLWNhcHMnKSB7XG4gICAgICAgICAgICBzdHlsZXMucHVzaChzdFsnZm9udC1sZXRpYW50J10pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzdFsnZm9udC13ZWlnaHQnXSA9PT0gJ2JvbGQnKSB7XG4gICAgICAgICAgICBzdHlsZXMucHVzaChzdFsnZm9udC13ZWlnaHQnXSk7XG4gICAgICAgIH1cblxuICAgICAgICBzdHlsZXMucHVzaChzaXplICsgJ3B4Jyk7XG5cbiAgICAgICAgaWYgKG5hbWUuaW5kZXhPZignc2VyaWYnKSAhPT0gLTEgJiYgbmFtZS5pbmRleE9mKCdzYW5zLXNlcmlmJykgPT09IC0xKSB7XG4gICAgICAgICAgICBmYW1pbHkgKz0gJ0dlb3JnaWEsIHNlcmlmJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGZhbWlseSArPSAnXCJIZWx2ZXRpY2EgTmV1ZVwiLCBBcmlhbCwgSGVsdmV0aWNhLCBzYW5zLXNlcmlmJztcbiAgICAgICAgfVxuICAgICAgICBzdHlsZXMucHVzaChmYW1pbHkpO1xuXG4gICAgICAgIHJldHVybiBzdHlsZXMuam9pbignICcpO1xuICAgIH1cblxuICAgIHN0YXRpYyBzZXRTdHlsZXMoY3R4LCBzdHlsZXMpIHtcbiAgICAgICAgbGV0IGk7XG4gICAgICAgIGZvciAoaSBpbiBzdHlsZXMpIHtcbiAgICAgICAgICAgIGlmIChzdHlsZXMuaGFzT3duUHJvcGVydHkoaSkpIHtcbiAgICAgICAgICAgICAgICBjdHhbaV0gPSBzdHlsZXNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59IiwiaW1wb3J0IHJidXNoIGZyb20gXCIuL3JidXNoXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIENvbGxpc2lvbkJ1ZmZlciB7XG4gICAgY29uc3RydWN0b3IoaGVpZ2h0LCB3aWR0aCkge1xuICAgICAgICB0aGlzLmJ1ZmZlciA9IG5ldyByYnVzaCgpO1xuICAgICAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgIH1cblxuICAgIGFkZFBvaW50V0gocG9pbnQsIHcsIGgsIGQsIGlkKSB7XG4gICAgICAgIHRoaXMuYnVmZmVyLmluc2VydChDb2xsaXNpb25CdWZmZXIuZ2V0Qm94RnJvbVBvaW50KHBvaW50LCB3LCBoLCBkLCBpZCkpO1xuICAgIH1cblxuICAgIGFkZFBvaW50cyhwYXJhbXMpIHtcbiAgICAgICAgbGV0IHBvaW50cyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMCwgbGVuID0gcGFyYW1zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBwb2ludHMucHVzaChDb2xsaXNpb25CdWZmZXIuZ2V0Qm94RnJvbVBvaW50LmFwcGx5KHRoaXMsIHBhcmFtc1tpXSkpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuYnVmZmVyLmxvYWQocG9pbnRzKTtcbiAgICB9XG5cbiAgICBjaGVja0JveChiLCBpZCkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gdGhpcy5idWZmZXIuc2VhcmNoKGIpLFxuICAgICAgICAgICAgaSwgbGVuO1xuXG4gICAgICAgIGlmIChiWzBdIDwgMCB8fCBiWzFdIDwgMCB8fCBiWzJdID4gdGhpcy53aWR0aCB8fCBiWzNdID4gdGhpcy5oZWlnaHQpIHsgcmV0dXJuIHRydWU7IH1cblxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSByZXN1bHQubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIC8vIGlmIGl0J3MgdGhlIHNhbWUgb2JqZWN0IChvbmx5IGRpZmZlcmVudCBzdHlsZXMpLCBkb24ndCBkZXRlY3QgY29sbGlzaW9uXG4gICAgICAgICAgICBpZiAoaWQgIT09IHJlc3VsdFtpXVs0XSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcdC8vdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGNoZWNrUG9pbnRXSChwb2ludCwgdywgaCwgaWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2hlY2tCb3goQ29sbGlzaW9uQnVmZmVyLmdldEJveEZyb21Qb2ludChwb2ludCwgdywgaCwgMCksIGlkKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0Qm94RnJvbVBvaW50KHBvaW50LCB3LCBoLCBkLCBpZCkge1xuICAgICAgICBsZXQgZHggPSB3IC8gMiArIGQsXG4gICAgICAgICAgICBkeSA9IGggLyAyICsgZDtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHBvaW50WzBdIC0gZHgsXG4gICAgICAgICAgICBwb2ludFsxXSAtIGR5LFxuICAgICAgICAgICAgcG9pbnRbMF0gKyBkeCxcbiAgICAgICAgICAgIHBvaW50WzFdICsgZHksXG4gICAgICAgICAgICBpZFxuICAgICAgICBdO1xuICAgIH1cbn1cbiIsIlxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR2VvbSB7XG5cbiAgICBzdGF0aWMgdHJhbnNmb3JtUG9pbnQgKHBvaW50LCB3cywgaHMpIHtcblx0XHRyZXR1cm4gW3dzICogcG9pbnRbMF0sIGhzICogcG9pbnRbMV1dO1xuICAgIH1cblxuICAgIHN0YXRpYyB0cmFuc2Zvcm1Qb2ludHMgKHBvaW50cywgd3MsIGhzKSB7XG4gICAgICAgIGxldCB0cmFuc2Zvcm1lZCA9IFtdLCBpLCBsZW47XG4gICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IHBvaW50cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKHBvaW50c1tpXSAhPT0gdW5kZWZpbmVkKVxuXHRcdFx0XHR0cmFuc2Zvcm1lZC5wdXNoKHRoaXMudHJhbnNmb3JtUG9pbnQocG9pbnRzW2ldLCB3cywgaHMpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJhbnNmb3JtZWQ7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldFJlcHJQb2ludCAoZmVhdHVyZSkge1xuICAgICAgICBsZXQgcG9pbnQsIGxlbjtcbiAgICAgICAgc3dpdGNoIChmZWF0dXJlLnR5cGUpIHtcbiAgICAgICAgY2FzZSAnUG9pbnQnOlxuICAgICAgICAgICAgcG9pbnQgPSBmZWF0dXJlLmNvb3JkaW5hdGVzO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1BvbHlnb24nOlxuICAgICAgICAgICAgcG9pbnQgPSBmZWF0dXJlLnJlcHJwb2ludDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdMaW5lU3RyaW5nJzpcbiAgICAgICAgICAgIGxlbiA9IEdlb20uZ2V0UG9seUxlbmd0aChmZWF0dXJlLmNvb3JkaW5hdGVzKTtcbiAgICAgICAgICAgIHBvaW50ID0gR2VvbS5nZXRBbmdsZUFuZENvb3Jkc0F0TGVuZ3RoKGZlYXR1cmUuY29vcmRpbmF0ZXMsIGxlbiAvIDIsIDApO1xuICAgICAgICAgICAgcG9pbnQgPSBbcG9pbnRbMV0sIHBvaW50WzJdXTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdHZW9tZXRyeUNvbGxlY3Rpb24nOlxuICAgICAgICAgICAgLy9UT0RPOiBEaXNhc3NlbWJsZSBnZW9tZXRyeSBjb2xsZWN0aW9uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIGNhc2UgJ011bHRpUG9pbnQnOlxuXHRcdFx0Y29uc29sZS5sb2coJ011bHRpUG9pbnQnKTtcbiAgICAgICAgICAgIC8vVE9ETzogRGlzYXNzZW1ibGUgbXVsdGkgcG9pbnRcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgY2FzZSAnTXVsdGlQb2x5Z29uJzpcbiAgICAgICAgICAgIHBvaW50ID0gZmVhdHVyZS5yZXBycG9pbnQ7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnTXVsdGlMaW5lU3RyaW5nJzpcblx0XHRcdGNvbnNvbGUubG9nKCdNdWx0aUxpbmVTdHJpbmcnKTtcbiAgICAgICAgICAgIC8vVE9ETzogRGlzYXNzZW1ibGUgZ2VvbWV0cnkgY29sbGVjdGlvblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBwb2ludDtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0UG9seUxlbmd0aCAocG9pbnRzKSB7XG4gICAgICAgIGxldCBwb2ludHNMZW4gPSBwb2ludHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGMsIHBjLCBpLFxuICAgICAgICAgICAgICAgIGR4LCBkeSxcbiAgICAgICAgICAgICAgICBsZW4gPSAwO1xuXG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBwb2ludHNMZW47IGkrKykge1xuICAgICAgICAgICAgYyA9IHBvaW50c1tpXTtcbiAgICAgICAgICAgIHBjID0gcG9pbnRzW2kgLSAxXTtcbiAgICAgICAgICAgIGR4ID0gcGNbMF0gLSBjWzBdO1xuICAgICAgICAgICAgZHkgPSBwY1sxXSAtIGNbMV07XG4gICAgICAgICAgICBsZW4gKz0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbGVuO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXRBbmdsZUFuZENvb3Jkc0F0TGVuZ3RoIChwb2ludHMsIGRpc3QsIHdpZHRoKSB7XG4gICAgICAgIGxldCBwb2ludHNMZW4gPSBwb2ludHMubGVuZ3RoLFxuICAgICAgICAgICAgZHgsIGR5LCB4LCB5LFxuICAgICAgICAgICAgaSwgYywgcGMsXG4gICAgICAgICAgICBsZW4gPSAwLFxuICAgICAgICAgICAgc2VnTGVuID0gMCxcbiAgICAgICAgICAgIGFuZ2xlLCBwYXJ0TGVuLCBzYW1lc2VnID0gdHJ1ZSxcbiAgICAgICAgICAgIGdvdHh5ID0gZmFsc2U7XG5cbiAgICAgICAgd2lkdGggPSB3aWR0aCB8fCAwOyAvLyBieSBkZWZhdWx0IHdlIHRoaW5rIHRoYXQgYSBsZXR0ZXIgaXMgMCBweCB3aWRlXG5cbiAgICAgICAgZm9yIChpID0gMTsgaSA8IHBvaW50c0xlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZ290eHkpIHtcbiAgICAgICAgICAgICAgICBzYW1lc2VnID0gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGMgPSBwb2ludHNbaV07XG4gICAgICAgICAgICBwYyA9IHBvaW50c1tpIC0gMV07XG5cbiAgICAgICAgICAgIGR4ID0gY1swXSAtIHBjWzBdO1xuICAgICAgICAgICAgZHkgPSBjWzFdIC0gcGNbMV07XG4gICAgICAgICAgICBzZWdMZW4gPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXG4gICAgICAgICAgICBpZiAoIWdvdHh5ICYmIGxlbiArIHNlZ0xlbiA+PSBkaXN0KSB7XG4gICAgICAgICAgICAgICAgcGFydExlbiA9IGRpc3QgLSBsZW47XG4gICAgICAgICAgICAgICAgeCA9IHBjWzBdICsgZHggKiBwYXJ0TGVuIC8gc2VnTGVuO1xuICAgICAgICAgICAgICAgIHkgPSBwY1sxXSArIGR5ICogcGFydExlbiAvIHNlZ0xlbjtcblxuICAgICAgICAgICAgICAgIGdvdHh5ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGdvdHh5ICYmIGxlbiArIHNlZ0xlbiA+PSBkaXN0ICsgd2lkdGgpIHtcbiAgICAgICAgICAgICAgICBwYXJ0TGVuID0gZGlzdCArIHdpZHRoIC0gbGVuO1xuICAgICAgICAgICAgICAgIGR4ID0gcGNbMF0gKyBkeCAqIHBhcnRMZW4gLyBzZWdMZW47XG4gICAgICAgICAgICAgICAgZHkgPSBwY1sxXSArIGR5ICogcGFydExlbiAvIHNlZ0xlbjtcbiAgICAgICAgICAgICAgICBhbmdsZSA9IE1hdGguYXRhbjIoZHkgLSB5LCBkeCAtIHgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHNhbWVzZWcpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFthbmdsZSwgeCwgeSwgc2VnTGVuIC0gcGFydExlbl07XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFthbmdsZSwgeCwgeSwgMF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZW4gKz0gc2VnTGVuO1xuICAgICAgICB9XG4gICAgfVxufVxuXG4iLCIvKlxuIChjKSAyMDEzLCBWbGFkaW1pciBBZ2Fmb25raW5cbiBSQnVzaCwgYSBKYXZhU2NyaXB0IGxpYnJhcnkgZm9yIGhpZ2gtcGVyZm9ybWFuY2UgMkQgc3BhdGlhbCBpbmRleGluZyBvZiBwb2ludHMgYW5kIHJlY3RhbmdsZXMuXG4gaHR0cHM6Ly9naXRodWIuY29tL21vdXJuZXIvcmJ1c2hcbiovXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHJidXNoIHtcblxuICAgIGNvbnN0cnVjdG9yKG1heEVudHJpZXMsIGZvcm1hdCkge1xuXG4gICAgICAgIC8vIGpzaGludCBuZXdjYXA6IGZhbHNlLCB2YWxpZHRoaXM6IHRydWVcbiAgICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIHJidXNoKSkgcmV0dXJuIG5ldyByYnVzaChtYXhFbnRyaWVzLCBmb3JtYXQpO1xuXG4gICAgICAgIC8vIG1heCBlbnRyaWVzIGluIGEgbm9kZSBpcyA5IGJ5IGRlZmF1bHQ7IG1pbiBub2RlIGZpbGwgaXMgNDAlIGZvciBiZXN0IHBlcmZvcm1hbmNlXG4gICAgICAgIHRoaXMuX21heEVudHJpZXMgPSBNYXRoLm1heCg0LCBtYXhFbnRyaWVzIHx8IDkpO1xuICAgICAgICB0aGlzLl9taW5FbnRyaWVzID0gTWF0aC5tYXgoMiwgTWF0aC5jZWlsKHRoaXMuX21heEVudHJpZXMgKiAwLjQpKTtcblxuICAgICAgICBpZiAoZm9ybWF0KSB7XG4gICAgICAgICAgICB0aGlzLl9pbml0Rm9ybWF0KGZvcm1hdCk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsZWFyKCk7XG4gICAgfVxuXG4gICAgYWxsKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fYWxsKHRoaXMuZGF0YSwgW10pO1xuICAgIH1cblxuICAgIHNlYXJjaChiYm94KSB7XG5cbiAgICAgICAgbGV0IG5vZGUgPSB0aGlzLmRhdGEsXG4gICAgICAgICAgICByZXN1bHQgPSBbXSxcbiAgICAgICAgICAgIHRvQkJveCA9IHRoaXMudG9CQm94O1xuXG4gICAgICAgIGlmICghdGhpcy5pbnRlcnNlY3RzKGJib3gsIG5vZGUuYmJveCkpIHJldHVybiByZXN1bHQ7XG5cbiAgICAgICAgbGV0IG5vZGVzVG9TZWFyY2ggPSBbXSxcbiAgICAgICAgICAgIGksIGxlbiwgY2hpbGQsIGNoaWxkQkJveDtcblxuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXG4gICAgICAgICAgICAgICAgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgICAgIGNoaWxkQkJveCA9IG5vZGUubGVhZiA/IHRvQkJveChjaGlsZCkgOiBjaGlsZC5iYm94O1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuaW50ZXJzZWN0cyhiYm94LCBjaGlsZEJCb3gpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmxlYWYpIHJlc3VsdC5wdXNoKGNoaWxkKTtcbiAgICAgICAgICAgICAgICAgICAgZWxzZSBpZiAoY29udGFpbnMoYmJveCwgY2hpbGRCQm94KSkgdGhpcy5fYWxsKGNoaWxkLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBlbHNlIG5vZGVzVG9TZWFyY2gucHVzaChjaGlsZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbm9kZSA9IG5vZGVzVG9TZWFyY2gucG9wKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGxvYWQoZGF0YSkge1xuICAgICAgICBpZiAoIShkYXRhICYmIGRhdGEubGVuZ3RoKSkgcmV0dXJuIHRoaXM7XG5cbiAgICAgICAgaWYgKGRhdGEubGVuZ3RoIDwgdGhpcy5fbWluRW50cmllcykge1xuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmluc2VydChkYXRhW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gcmVjdXJzaXZlbHkgYnVpbGQgdGhlIHRyZWUgd2l0aCB0aGUgZ2l2ZW4gZGF0YSBmcm9tIHN0cmF0Y2ggdXNpbmcgT01UIGFsZ29yaXRobVxuICAgICAgICBsZXQgbm9kZSA9IHRoaXMuX2J1aWxkKGRhdGEuc2xpY2UoKSwgMCwgZGF0YS5sZW5ndGggLSAxLCAwKTtcblxuICAgICAgICBpZiAoIXRoaXMuZGF0YS5jaGlsZHJlbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIC8vIHNhdmUgYXMgaXMgaWYgdHJlZSBpcyBlbXB0eVxuICAgICAgICAgICAgdGhpcy5kYXRhID0gbm9kZTtcblxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZGF0YS5oZWlnaHQgPT09IG5vZGUuaGVpZ2h0KSB7XG4gICAgICAgICAgICAvLyBzcGxpdCByb290IGlmIHRyZWVzIGhhdmUgdGhlIHNhbWUgaGVpZ2h0XG4gICAgICAgICAgICB0aGlzLl9zcGxpdFJvb3QodGhpcy5kYXRhLCBub2RlKTtcblxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHRoaXMuZGF0YS5oZWlnaHQgPCBub2RlLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIC8vIHN3YXAgdHJlZXMgaWYgaW5zZXJ0ZWQgb25lIGlzIGJpZ2dlclxuICAgICAgICAgICAgICAgIGxldCB0bXBOb2RlID0gdGhpcy5kYXRhO1xuICAgICAgICAgICAgICAgIHRoaXMuZGF0YSA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbm9kZSA9IHRtcE5vZGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGluc2VydCB0aGUgc21hbGwgdHJlZSBpbnRvIHRoZSBsYXJnZSB0cmVlIGF0IGFwcHJvcHJpYXRlIGxldmVsXG4gICAgICAgICAgICB0aGlzLl9pbnNlcnQobm9kZSwgdGhpcy5kYXRhLmhlaWdodCAtIG5vZGUuaGVpZ2h0IC0gMSwgdHJ1ZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBpbnNlcnQoaXRlbSkge1xuICAgICAgICBpZiAoaXRlbSkgdGhpcy5faW5zZXJ0KGl0ZW0sIHRoaXMuZGF0YS5oZWlnaHQgLSAxKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMuZGF0YSA9IHtcbiAgICAgICAgICAgIGNoaWxkcmVuOiBbXSxcbiAgICAgICAgICAgIGhlaWdodDogMSxcbiAgICAgICAgICAgIGJib3g6IHRoaXMuZW1wdHkoKSxcbiAgICAgICAgICAgIGxlYWY6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmVtb3ZlKGl0ZW0pIHtcbiAgICAgICAgaWYgKCFpdGVtKSByZXR1cm4gdGhpcztcblxuICAgICAgICBsZXQgbm9kZSA9IHRoaXMuZGF0YSxcbiAgICAgICAgICAgIGJib3ggPSB0aGlzLnRvQkJveChpdGVtKSxcbiAgICAgICAgICAgIHBhdGggPSBbXSxcbiAgICAgICAgICAgIGluZGV4ZXMgPSBbXSxcbiAgICAgICAgICAgIGksIHBhcmVudCwgaW5kZXgsIGdvaW5nVXA7XG5cbiAgICAgICAgLy8gZGVwdGgtZmlyc3QgaXRlcmF0aXZlIHRyZWUgdHJhdmVyc2FsXG4gICAgICAgIHdoaWxlIChub2RlIHx8IHBhdGgubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgIGlmICghbm9kZSkgeyAvLyBnbyB1cFxuICAgICAgICAgICAgICAgIG5vZGUgPSBwYXRoLnBvcCgpO1xuICAgICAgICAgICAgICAgIHBhcmVudCA9IHBhdGhbcGF0aC5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgICAgICBpID0gaW5kZXhlcy5wb3AoKTtcbiAgICAgICAgICAgICAgICBnb2luZ1VwID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKG5vZGUubGVhZikgeyAvLyBjaGVjayBjdXJyZW50IG5vZGVcbiAgICAgICAgICAgICAgICBpbmRleCA9IG5vZGUuY2hpbGRyZW4uaW5kZXhPZihpdGVtKTtcblxuICAgICAgICAgICAgICAgIGlmIChpbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaXRlbSBmb3VuZCwgcmVtb3ZlIHRoZSBpdGVtIGFuZCBjb25kZW5zZSB0cmVlIHVwd2FyZHNcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICBwYXRoLnB1c2gobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2NvbmRlbnNlKHBhdGgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghZ29pbmdVcCAmJiAhbm9kZS5sZWFmICYmIGNvbnRhaW5zKG5vZGUuYmJveCwgYmJveCkpIHsgLy8gZ28gZG93blxuICAgICAgICAgICAgICAgIHBhdGgucHVzaChub2RlKTtcbiAgICAgICAgICAgICAgICBpbmRleGVzLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgaSA9IDA7XG4gICAgICAgICAgICAgICAgcGFyZW50ID0gbm9kZTtcbiAgICAgICAgICAgICAgICBub2RlID0gbm9kZS5jaGlsZHJlblswXTtcblxuICAgICAgICAgICAgfSBlbHNlIGlmIChwYXJlbnQpIHsgLy8gZ28gcmlnaHRcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgbm9kZSA9IHBhcmVudC5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBnb2luZ1VwID0gZmFsc2U7XG5cbiAgICAgICAgICAgIH0gZWxzZSBub2RlID0gbnVsbDsgLy8gbm90aGluZyBmb3VuZFxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdG9CQm94KGl0ZW0pIHsgcmV0dXJuIGl0ZW07IH1cblxuICAgIGNvbXBhcmVNaW5YKGEsIGIpIHsgcmV0dXJuIGFbMF0gLSBiWzBdOyB9XG4gICAgY29tcGFyZU1pblkoYSwgYikgeyByZXR1cm4gYVsxXSAtIGJbMV07IH1cblxuICAgIHRvSlNPTigpIHsgcmV0dXJuIHRoaXMuZGF0YTsgfVxuXG4gICAgZnJvbUpTT04oZGF0YSkge1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBfYWxsKG5vZGUsIHJlc3VsdCkge1xuICAgICAgICBsZXQgbm9kZXNUb1NlYXJjaCA9IFtdO1xuICAgICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICAgICAgaWYgKG5vZGUubGVhZikgcmVzdWx0LnB1c2guYXBwbHkocmVzdWx0LCBub2RlLmNoaWxkcmVuKTtcbiAgICAgICAgICAgIGVsc2Ugbm9kZXNUb1NlYXJjaC5wdXNoLmFwcGx5KG5vZGVzVG9TZWFyY2gsIG5vZGUuY2hpbGRyZW4pO1xuXG4gICAgICAgICAgICBub2RlID0gbm9kZXNUb1NlYXJjaC5wb3AoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIF9idWlsZChpdGVtcywgbGVmdCwgcmlnaHQsIGhlaWdodCkge1xuXG4gICAgICAgIGxldCBOID0gcmlnaHQgLSBsZWZ0ICsgMSxcbiAgICAgICAgICAgIE0gPSB0aGlzLl9tYXhFbnRyaWVzLFxuICAgICAgICAgICAgbm9kZTtcblxuICAgICAgICBpZiAoTiA8PSBNKSB7XG4gICAgICAgICAgICAvLyByZWFjaGVkIGxlYWYgbGV2ZWw7IHJldHVybiBsZWFmXG4gICAgICAgICAgICBub2RlID0ge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBpdGVtcy5zbGljZShsZWZ0LCByaWdodCArIDEpLFxuICAgICAgICAgICAgICAgIGhlaWdodDogMSxcbiAgICAgICAgICAgICAgICBiYm94OiBudWxsLFxuICAgICAgICAgICAgICAgIGxlYWY6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmNhbGNCQm94KG5vZGUsIHRoaXMudG9CQm94KTtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFoZWlnaHQpIHtcbiAgICAgICAgICAgIC8vIHRhcmdldCBoZWlnaHQgb2YgdGhlIGJ1bGstbG9hZGVkIHRyZWVcbiAgICAgICAgICAgIGhlaWdodCA9IE1hdGguY2VpbChNYXRoLmxvZyhOKSAvIE1hdGgubG9nKE0pKTtcblxuICAgICAgICAgICAgLy8gdGFyZ2V0IG51bWJlciBvZiByb290IGVudHJpZXMgdG8gbWF4aW1pemUgc3RvcmFnZSB1dGlsaXphdGlvblxuICAgICAgICAgICAgTSA9IE1hdGguY2VpbChOIC8gTWF0aC5wb3coTSwgaGVpZ2h0IC0gMSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVE9ETyBlbGltaW5hdGUgcmVjdXJzaW9uP1xuXG4gICAgICAgIG5vZGUgPSB7XG4gICAgICAgICAgICBjaGlsZHJlbjogW10sXG4gICAgICAgICAgICBoZWlnaHQ6IGhlaWdodCxcbiAgICAgICAgICAgIGJib3g6IG51bGxcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBzcGxpdCB0aGUgaXRlbXMgaW50byBNIG1vc3RseSBzcXVhcmUgdGlsZXNcblxuICAgICAgICBsZXQgTjIgPSBNYXRoLmNlaWwoTiAvIE0pLFxuICAgICAgICAgICAgTjEgPSBOMiAqIE1hdGguY2VpbChNYXRoLnNxcnQoTSkpLFxuICAgICAgICAgICAgaSwgaiwgcmlnaHQyLCByaWdodDM7XG5cbiAgICAgICAgdGhpcy5tdWx0aVNlbGVjdChpdGVtcywgbGVmdCwgcmlnaHQsIE4xLCB0aGlzLmNvbXBhcmVNaW5YKTtcblxuICAgICAgICBmb3IgKGkgPSBsZWZ0OyBpIDw9IHJpZ2h0OyBpICs9IE4xKSB7XG5cbiAgICAgICAgICAgIHJpZ2h0MiA9IE1hdGgubWluKGkgKyBOMSAtIDEsIHJpZ2h0KTtcblxuICAgICAgICAgICAgdGhpcy5tdWx0aVNlbGVjdChpdGVtcywgaSwgcmlnaHQyLCBOMiwgdGhpcy5jb21wYXJlTWluWSk7XG5cbiAgICAgICAgICAgIGZvciAoaiA9IGk7IGogPD0gcmlnaHQyOyBqICs9IE4yKSB7XG5cbiAgICAgICAgICAgICAgICByaWdodDMgPSBNYXRoLm1pbihqICsgTjIgLSAxLCByaWdodDIpO1xuXG4gICAgICAgICAgICAgICAgLy8gcGFjayBlYWNoIGVudHJ5IHJlY3Vyc2l2ZWx5XG4gICAgICAgICAgICAgICAgbm9kZS5jaGlsZHJlbi5wdXNoKHRoaXMuX2J1aWxkKGl0ZW1zLCBqLCByaWdodDMsIGhlaWdodCAtIDEpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2FsY0JCb3gobm9kZSwgdGhpcy50b0JCb3gpO1xuXG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIF9jaG9vc2VTdWJ0cmVlKGJib3gsIG5vZGUsIGxldmVsLCBwYXRoKSB7XG5cbiAgICAgICAgbGV0IGksIGxlbiwgY2hpbGQsIHRhcmdldE5vZGUsIGFyZWEsIGVubGFyZ2VtZW50LCBtaW5BcmVhLCBtaW5FbmxhcmdlbWVudDtcblxuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgICAgcGF0aC5wdXNoKG5vZGUpO1xuXG4gICAgICAgICAgICBpZiAobm9kZS5sZWFmIHx8IHBhdGgubGVuZ3RoIC0gMSA9PT0gbGV2ZWwpIGJyZWFrO1xuXG4gICAgICAgICAgICBtaW5BcmVhID0gbWluRW5sYXJnZW1lbnQgPSBJbmZpbml0eTtcblxuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gbm9kZS5jaGlsZHJlbi5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIGNoaWxkID0gbm9kZS5jaGlsZHJlbltpXTtcbiAgICAgICAgICAgICAgICBhcmVhID0gdGhpcy5iYm94QXJlYShjaGlsZC5iYm94KTtcbiAgICAgICAgICAgICAgICBlbmxhcmdlbWVudCA9IHRoaXMuZW5sYXJnZWRBcmVhKGJib3gsIGNoaWxkLmJib3gpIC0gYXJlYTtcblxuICAgICAgICAgICAgICAgIC8vIGNob29zZSBlbnRyeSB3aXRoIHRoZSBsZWFzdCBhcmVhIGVubGFyZ2VtZW50XG4gICAgICAgICAgICAgICAgaWYgKGVubGFyZ2VtZW50IDwgbWluRW5sYXJnZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWluRW5sYXJnZW1lbnQgPSBlbmxhcmdlbWVudDtcbiAgICAgICAgICAgICAgICAgICAgbWluQXJlYSA9IGFyZWEgPCBtaW5BcmVhID8gYXJlYSA6IG1pbkFyZWE7XG4gICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUgPSBjaGlsZDtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZW5sYXJnZW1lbnQgPT09IG1pbkVubGFyZ2VtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBjaG9vc2Ugb25lIHdpdGggdGhlIHNtYWxsZXN0IGFyZWFcbiAgICAgICAgICAgICAgICAgICAgaWYgKGFyZWEgPCBtaW5BcmVhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtaW5BcmVhID0gYXJlYTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldE5vZGUgPSBjaGlsZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbm9kZSA9IHRhcmdldE5vZGU7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICBfaW5zZXJ0KGl0ZW0sIGxldmVsLCBpc05vZGUpIHtcblxuICAgICAgICBsZXQgdG9CQm94ID0gdGhpcy50b0JCb3gsXG4gICAgICAgICAgICBiYm94ID0gaXNOb2RlID8gaXRlbS5iYm94IDogdG9CQm94KGl0ZW0pLFxuICAgICAgICAgICAgaW5zZXJ0UGF0aCA9IFtdO1xuXG4gICAgICAgIC8vIGZpbmQgdGhlIGJlc3Qgbm9kZSBmb3IgYWNjb21tb2RhdGluZyB0aGUgaXRlbSwgc2F2aW5nIGFsbCBub2RlcyBhbG9uZyB0aGUgcGF0aCB0b29cbiAgICAgICAgbGV0IG5vZGUgPSB0aGlzLl9jaG9vc2VTdWJ0cmVlKGJib3gsIHRoaXMuZGF0YSwgbGV2ZWwsIGluc2VydFBhdGgpO1xuXG4gICAgICAgIC8vIHB1dCB0aGUgaXRlbSBpbnRvIHRoZSBub2RlXG4gICAgICAgIG5vZGUuY2hpbGRyZW4ucHVzaChpdGVtKTtcbiAgICAgICAgdGhpcy5leHRlbmQobm9kZS5iYm94LCBiYm94KTtcblxuICAgICAgICAvLyBzcGxpdCBvbiBub2RlIG92ZXJmbG93OyBwcm9wYWdhdGUgdXB3YXJkcyBpZiBuZWNlc3NhcnlcbiAgICAgICAgd2hpbGUgKGxldmVsID49IDApIHtcbiAgICAgICAgICAgIGlmIChpbnNlcnRQYXRoW2xldmVsXS5jaGlsZHJlbi5sZW5ndGggPiB0aGlzLl9tYXhFbnRyaWVzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fc3BsaXQoaW5zZXJ0UGF0aCwgbGV2ZWwpO1xuICAgICAgICAgICAgICAgIGxldmVsLS07XG4gICAgICAgICAgICB9IGVsc2UgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBhZGp1c3QgYmJveGVzIGFsb25nIHRoZSBpbnNlcnRpb24gcGF0aFxuICAgICAgICB0aGlzLl9hZGp1c3RQYXJlbnRCQm94ZXMoYmJveCwgaW5zZXJ0UGF0aCwgbGV2ZWwpO1xuICAgIH1cblxuICAgIC8vIHNwbGl0IG92ZXJmbG93ZWQgbm9kZSBpbnRvIHR3b1xuICAgIF9zcGxpdChpbnNlcnRQYXRoLCBsZXZlbCkge1xuXG4gICAgICAgIGxldCBub2RlID0gaW5zZXJ0UGF0aFtsZXZlbF0sXG4gICAgICAgICAgICBNID0gbm9kZS5jaGlsZHJlbi5sZW5ndGgsXG4gICAgICAgICAgICBtID0gdGhpcy5fbWluRW50cmllcztcblxuICAgICAgICB0aGlzLl9jaG9vc2VTcGxpdEF4aXMobm9kZSwgbSwgTSk7XG5cbiAgICAgICAgbGV0IG5ld05vZGUgPSB7XG4gICAgICAgICAgICBjaGlsZHJlbjogbm9kZS5jaGlsZHJlbi5zcGxpY2UodGhpcy5fY2hvb3NlU3BsaXRJbmRleChub2RlLCBtLCBNKSksXG4gICAgICAgICAgICBoZWlnaHQ6IG5vZGUuaGVpZ2h0XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKG5vZGUubGVhZikgbmV3Tm9kZS5sZWFmID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLmNhbGNCQm94KG5vZGUsIHRoaXMudG9CQm94KTtcbiAgICAgICAgdGhpcy5jYWxjQkJveChuZXdOb2RlLCB0aGlzLnRvQkJveCk7XG5cbiAgICAgICAgaWYgKGxldmVsKSBpbnNlcnRQYXRoW2xldmVsIC0gMV0uY2hpbGRyZW4ucHVzaChuZXdOb2RlKTtcbiAgICAgICAgZWxzZSB0aGlzLl9zcGxpdFJvb3Qobm9kZSwgbmV3Tm9kZSk7XG4gICAgfVxuXG4gICAgX3NwbGl0Um9vdChub2RlLCBuZXdOb2RlKSB7XG4gICAgICAgIC8vIHNwbGl0IHJvb3Qgbm9kZVxuICAgICAgICB0aGlzLmRhdGEgPSB7XG4gICAgICAgICAgICBjaGlsZHJlbjogW25vZGUsIG5ld05vZGVdLFxuICAgICAgICAgICAgaGVpZ2h0OiBub2RlLmhlaWdodCArIDFcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5jYWxjQkJveCh0aGlzLmRhdGEsIHRoaXMudG9CQm94KTtcbiAgICB9XG5cbiAgICBfY2hvb3NlU3BsaXRJbmRleChub2RlLCBtLCBNKSB7XG5cbiAgICAgICAgbGV0IGksIGJib3gxLCBiYm94Miwgb3ZlcmxhcCwgYXJlYSwgbWluT3ZlcmxhcCwgbWluQXJlYSwgaW5kZXg7XG5cbiAgICAgICAgbWluT3ZlcmxhcCA9IG1pbkFyZWEgPSBJbmZpbml0eTtcblxuICAgICAgICBmb3IgKGkgPSBtOyBpIDw9IE0gLSBtOyBpKyspIHtcbiAgICAgICAgICAgIGJib3gxID0gdGhpcy5kaXN0QkJveChub2RlLCAwLCBpLCB0aGlzLnRvQkJveCk7XG4gICAgICAgICAgICBiYm94MiA9IHRoaXMuZGlzdEJCb3gobm9kZSwgaSwgTSwgdGhpcy50b0JCb3gpO1xuXG4gICAgICAgICAgICBvdmVybGFwID0gdGhpcy5pbnRlcnNlY3Rpb25BcmVhKGJib3gxLCBiYm94Mik7XG4gICAgICAgICAgICBhcmVhID0gdGhpcy5iYm94QXJlYShiYm94MSkgKyB0aGlzLmJib3hBcmVhKGJib3gyKTtcblxuICAgICAgICAgICAgLy8gY2hvb3NlIGRpc3RyaWJ1dGlvbiB3aXRoIG1pbmltdW0gb3ZlcmxhcFxuICAgICAgICAgICAgaWYgKG92ZXJsYXAgPCBtaW5PdmVybGFwKSB7XG4gICAgICAgICAgICAgICAgbWluT3ZlcmxhcCA9IG92ZXJsYXA7XG4gICAgICAgICAgICAgICAgaW5kZXggPSBpO1xuXG4gICAgICAgICAgICAgICAgbWluQXJlYSA9IGFyZWEgPCBtaW5BcmVhID8gYXJlYSA6IG1pbkFyZWE7XG5cbiAgICAgICAgICAgIH0gZWxzZSBpZiAob3ZlcmxhcCA9PT0gbWluT3ZlcmxhcCkge1xuICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSBjaG9vc2UgZGlzdHJpYnV0aW9uIHdpdGggbWluaW11bSBhcmVhXG4gICAgICAgICAgICAgICAgaWYgKGFyZWEgPCBtaW5BcmVhKSB7XG4gICAgICAgICAgICAgICAgICAgIG1pbkFyZWEgPSBhcmVhO1xuICAgICAgICAgICAgICAgICAgICBpbmRleCA9IGk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGluZGV4O1xuICAgIH1cblxuICAgIC8vIHNvcnRzIG5vZGUgY2hpbGRyZW4gYnkgdGhlIGJlc3QgYXhpcyBmb3Igc3BsaXRcbiAgICBfY2hvb3NlU3BsaXRBeGlzKG5vZGUsIG0sIE0pIHtcblxuICAgICAgICBsZXQgY29tcGFyZU1pblggPSBub2RlLmxlYWYgPyB0aGlzLmNvbXBhcmVNaW5YIDogdGhpcy5jb21wYXJlTm9kZU1pblgsXG4gICAgICAgICAgICBjb21wYXJlTWluWSA9IG5vZGUubGVhZiA/IHRoaXMuY29tcGFyZU1pblkgOiB0aGlzLmNvbXBhcmVOb2RlTWluWSxcbiAgICAgICAgICAgIHhNYXJnaW4gPSB0aGlzLl9hbGxEaXN0TWFyZ2luKG5vZGUsIG0sIE0sIGNvbXBhcmVNaW5YKSxcbiAgICAgICAgICAgIHlNYXJnaW4gPSB0aGlzLl9hbGxEaXN0TWFyZ2luKG5vZGUsIG0sIE0sIGNvbXBhcmVNaW5ZKTtcblxuICAgICAgICAvLyBpZiB0b3RhbCBkaXN0cmlidXRpb25zIG1hcmdpbiB2YWx1ZSBpcyBtaW5pbWFsIGZvciB4LCBzb3J0IGJ5IG1pblgsXG4gICAgICAgIC8vIG90aGVyd2lzZSBpdCdzIGFscmVhZHkgc29ydGVkIGJ5IG1pbllcbiAgICAgICAgaWYgKHhNYXJnaW4gPCB5TWFyZ2luKSBub2RlLmNoaWxkcmVuLnNvcnQoY29tcGFyZU1pblgpO1xuICAgIH1cblxuICAgIC8vIHRvdGFsIG1hcmdpbiBvZiBhbGwgcG9zc2libGUgc3BsaXQgZGlzdHJpYnV0aW9ucyB3aGVyZSBlYWNoIG5vZGUgaXMgYXQgbGVhc3QgbSBmdWxsXG4gICAgX2FsbERpc3RNYXJnaW4obm9kZSwgbSwgTSwgY29tcGFyZSkge1xuXG4gICAgICAgIG5vZGUuY2hpbGRyZW4uc29ydChjb21wYXJlKTtcblxuICAgICAgICBsZXQgdG9CQm94ID0gdGhpcy50b0JCb3gsXG4gICAgICAgICAgICBsZWZ0QkJveCA9IHRoaXMuZGlzdEJCb3gobm9kZSwgMCwgbSwgdG9CQm94KSxcbiAgICAgICAgICAgIHJpZ2h0QkJveCA9IHRoaXMuZGlzdEJCb3gobm9kZSwgTSAtIG0sIE0sIHRvQkJveCksXG4gICAgICAgICAgICBtYXJnaW4gPSB0aGlzLmJib3hNYXJnaW4obGVmdEJCb3gpICsgdGhpcy5iYm94TWFyZ2luKHJpZ2h0QkJveCksXG4gICAgICAgICAgICBpLCBjaGlsZDtcblxuICAgICAgICBmb3IgKGkgPSBtOyBpIDwgTSAtIG07IGkrKykge1xuICAgICAgICAgICAgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgdGhpcy5leHRlbmQobGVmdEJCb3gsIG5vZGUubGVhZiA/IHRvQkJveChjaGlsZCkgOiBjaGlsZC5iYm94KTtcbiAgICAgICAgICAgIG1hcmdpbiArPSB0aGlzLmJib3hNYXJnaW4obGVmdEJCb3gpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yIChpID0gTSAtIG0gLSAxOyBpID49IG07IGktLSkge1xuICAgICAgICAgICAgY2hpbGQgPSBub2RlLmNoaWxkcmVuW2ldO1xuICAgICAgICAgICAgdGhpcy5leHRlbmQocmlnaHRCQm94LCBub2RlLmxlYWYgPyB0b0JCb3goY2hpbGQpIDogY2hpbGQuYmJveCk7XG4gICAgICAgICAgICBtYXJnaW4gKz0gdGhpcy5iYm94TWFyZ2luKHJpZ2h0QkJveCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbWFyZ2luO1xuICAgIH1cblxuICAgIF9hZGp1c3RQYXJlbnRCQm94ZXMoYmJveCwgcGF0aCwgbGV2ZWwpIHtcbiAgICAgICAgLy8gYWRqdXN0IGJib3hlcyBhbG9uZyB0aGUgZ2l2ZW4gdHJlZSBwYXRoXG4gICAgICAgIGZvciAobGV0IGkgPSBsZXZlbDsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHRoaXMuZXh0ZW5kKHBhdGhbaV0uYmJveCwgYmJveCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfY29uZGVuc2UocGF0aCkge1xuICAgICAgICAvLyBnbyB0aHJvdWdoIHRoZSBwYXRoLCByZW1vdmluZyBlbXB0eSBub2RlcyBhbmQgdXBkYXRpbmcgYmJveGVzXG4gICAgICAgIGZvciAobGV0IGkgPSBwYXRoLmxlbmd0aCAtIDEsIHNpYmxpbmdzOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgaWYgKHBhdGhbaV0uY2hpbGRyZW4ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzID0gcGF0aFtpIC0gMV0uY2hpbGRyZW47XG4gICAgICAgICAgICAgICAgICAgIHNpYmxpbmdzLnNwbGljZShzaWJsaW5ncy5pbmRleE9mKHBhdGhbaV0pLCAxKTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB0aGlzLmNsZWFyKCk7XG5cbiAgICAgICAgICAgIH0gZWxzZSB0aGlzLmNhbGNCQm94KHBhdGhbaV0sIHRoaXMudG9CQm94KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9pbml0Rm9ybWF0KGZvcm1hdCkge1xuICAgICAgICAvLyBkYXRhIGZvcm1hdCAobWluWCwgbWluWSwgbWF4WCwgbWF4WSBhY2Nlc3NvcnMpXG5cbiAgICAgICAgLy8gdXNlcyBldmFsLXR5cGUgY29tcGlsYXRpb24gaW5zdGVhZCBvZiBqdXN0IGFjY2VwdGluZyBhIHRvQkJveCBmdW5jdGlvblxuICAgICAgICAvLyBiZWNhdXNlIHRoZSBhbGdvcml0aG1zIGFyZSB2ZXJ5IHNlbnNpdGl2ZSB0byBzb3J0aW5nIGZ1bmN0aW9ucyBwZXJmb3JtYW5jZSxcbiAgICAgICAgLy8gc28gdGhleSBzaG91bGQgYmUgZGVhZCBzaW1wbGUgYW5kIHdpdGhvdXQgaW5uZXIgY2FsbHNcblxuICAgICAgICAvLyBqc2hpbnQgZXZpbDogdHJ1ZVxuXG4gICAgICAgIGxldCBjb21wYXJlQXJyID0gWydyZXR1cm4gYScsICcgLSBiJywgJzsnXTtcblxuICAgICAgICB0aGlzLmNvbXBhcmVNaW5YID0gbmV3IEZ1bmN0aW9uKCdhJywgJ2InLCBjb21wYXJlQXJyLmpvaW4oZm9ybWF0WzBdKSk7XG4gICAgICAgIHRoaXMuY29tcGFyZU1pblkgPSBuZXcgRnVuY3Rpb24oJ2EnLCAnYicsIGNvbXBhcmVBcnIuam9pbihmb3JtYXRbMV0pKTtcblxuICAgICAgICB0aGlzLnRvQkJveCA9IG5ldyBGdW5jdGlvbignYScsICdyZXR1cm4gW2EnICsgZm9ybWF0LmpvaW4oJywgYScpICsgJ107Jyk7XG4gICAgfVxuXG5cblxuLy8gY2FsY3VsYXRlIG5vZGUncyBiYm94IGZyb20gYmJveGVzIG9mIGl0cyBjaGlsZHJlblxuICAgIGNhbGNCQm94KG5vZGUsIHRvQkJveCkge1xuICAgICAgICBub2RlLmJib3ggPSB0aGlzLmRpc3RCQm94KG5vZGUsIDAsIG5vZGUuY2hpbGRyZW4ubGVuZ3RoLCB0b0JCb3gpO1xuICAgIH1cblxuLy8gbWluIGJvdW5kaW5nIHJlY3RhbmdsZSBvZiBub2RlIGNoaWxkcmVuIGZyb20gayB0byBwLTFcbiAgICBkaXN0QkJveChub2RlLCBrLCBwLCB0b0JCb3gpIHtcbiAgICAgICAgbGV0IGJib3ggPSB0aGlzLmVtcHR5KCk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IGssIGNoaWxkOyBpIDwgcDsgaSsrKSB7XG4gICAgICAgICAgICBjaGlsZCA9IG5vZGUuY2hpbGRyZW5baV07XG4gICAgICAgICAgICB0aGlzLmV4dGVuZChiYm94LCBub2RlLmxlYWYgPyB0b0JCb3goY2hpbGQpIDogY2hpbGQuYmJveCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYmJveDtcbiAgICB9XG5cbiAgICBlbXB0eSgpIHsgcmV0dXJuIFtJbmZpbml0eSwgSW5maW5pdHksIC1JbmZpbml0eSwgLUluZmluaXR5XTsgfVxuXG4gICAgZXh0ZW5kKGEsIGIpIHtcbiAgICAgICAgYVswXSA9IE1hdGgubWluKGFbMF0sIGJbMF0pO1xuICAgICAgICBhWzFdID0gTWF0aC5taW4oYVsxXSwgYlsxXSk7XG4gICAgICAgIGFbMl0gPSBNYXRoLm1heChhWzJdLCBiWzJdKTtcbiAgICAgICAgYVszXSA9IE1hdGgubWF4KGFbM10sIGJbM10pO1xuICAgICAgICByZXR1cm4gYTtcbiAgICB9XG5cbiAgICBjb21wYXJlTm9kZU1pblgoYSwgYikgeyByZXR1cm4gYS5iYm94WzBdIC0gYi5iYm94WzBdOyB9XG4gICAgY29tcGFyZU5vZGVNaW5ZKGEsIGIpIHsgcmV0dXJuIGEuYmJveFsxXSAtIGIuYmJveFsxXTsgfVxuXG4gICAgYmJveEFyZWEoYSkgICB7IHJldHVybiAoYVsyXSAtIGFbMF0pICogKGFbM10gLSBhWzFdKTsgfVxuICAgIGJib3hNYXJnaW4oYSkgeyByZXR1cm4gKGFbMl0gLSBhWzBdKSArIChhWzNdIC0gYVsxXSk7IH1cblxuICAgIGVubGFyZ2VkQXJlYShhLCBiKSB7XG4gICAgICAgIHJldHVybiAoTWF0aC5tYXgoYlsyXSwgYVsyXSkgLSBNYXRoLm1pbihiWzBdLCBhWzBdKSkgKlxuICAgICAgICAgICAgKE1hdGgubWF4KGJbM10sIGFbM10pIC0gTWF0aC5taW4oYlsxXSwgYVsxXSkpO1xuICAgIH1cblxuICAgIGludGVyc2VjdGlvbkFyZWEgKGEsIGIpIHtcbiAgICAgICAgbGV0IG1pblggPSBNYXRoLm1heChhWzBdLCBiWzBdKSxcbiAgICAgICAgICAgIG1pblkgPSBNYXRoLm1heChhWzFdLCBiWzFdKSxcbiAgICAgICAgICAgIG1heFggPSBNYXRoLm1pbihhWzJdLCBiWzJdKSxcbiAgICAgICAgICAgIG1heFkgPSBNYXRoLm1pbihhWzNdLCBiWzNdKTtcblxuICAgICAgICByZXR1cm4gTWF0aC5tYXgoMCwgbWF4WCAtIG1pblgpICpcbiAgICAgICAgICAgIE1hdGgubWF4KDAsIG1heFkgLSBtaW5ZKTtcbiAgICB9XG5cbiAgICBjb250YWlucyhhLCBiKSB7XG4gICAgICAgIHJldHVybiBhWzBdIDw9IGJbMF0gJiZcbiAgICAgICAgICAgIGFbMV0gPD0gYlsxXSAmJlxuICAgICAgICAgICAgYlsyXSA8PSBhWzJdICYmXG4gICAgICAgICAgICBiWzNdIDw9IGFbM107XG4gICAgfVxuXG4gICAgaW50ZXJzZWN0cyAoYSwgYikge1xuICAgICAgICByZXR1cm4gYlswXSA8PSBhWzJdICYmXG4gICAgICAgICAgICBiWzFdIDw9IGFbM10gJiZcbiAgICAgICAgICAgIGJbMl0gPj0gYVswXSAmJlxuICAgICAgICAgICAgYlszXSA+PSBhWzFdO1xuICAgIH1cblxuLy8gc29ydCBhbiBhcnJheSBzbyB0aGF0IGl0ZW1zIGNvbWUgaW4gZ3JvdXBzIG9mIG4gdW5zb3J0ZWQgaXRlbXMsIHdpdGggZ3JvdXBzIHNvcnRlZCBiZXR3ZWVuIGVhY2ggb3RoZXI7XG4vLyBjb21iaW5lcyBzZWxlY3Rpb24gYWxnb3JpdGhtIHdpdGggYmluYXJ5IGRpdmlkZSAmIGNvbnF1ZXIgYXBwcm9hY2hcblxuICAgIG11bHRpU2VsZWN0KGFyciwgbGVmdCwgcmlnaHQsIG4sIGNvbXBhcmUpIHtcbiAgICAgICAgbGV0IHN0YWNrID0gW2xlZnQsIHJpZ2h0XSxcbiAgICAgICAgICAgIG1pZDtcblxuICAgICAgICB3aGlsZSAoc3RhY2subGVuZ3RoKSB7XG4gICAgICAgICAgICByaWdodCA9IHN0YWNrLnBvcCgpO1xuICAgICAgICAgICAgbGVmdCA9IHN0YWNrLnBvcCgpO1xuXG4gICAgICAgICAgICBpZiAocmlnaHQgLSBsZWZ0IDw9IG4pIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBtaWQgPSBsZWZ0ICsgTWF0aC5jZWlsKChyaWdodCAtIGxlZnQpIC8gbiAvIDIpICogbjtcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0KGFyciwgbGVmdCwgcmlnaHQsIG1pZCwgY29tcGFyZSk7XG5cbiAgICAgICAgICAgIHN0YWNrLnB1c2gobGVmdCwgbWlkLCBtaWQsIHJpZ2h0KTtcbiAgICAgICAgfVxuICAgIH1cblxuLy8gc29ydCBhcnJheSBiZXR3ZWVuIGxlZnQgYW5kIHJpZ2h0IChpbmNsdXNpdmUpIHNvIHRoYXQgdGhlIHNtYWxsZXN0IGsgZWxlbWVudHMgY29tZSBmaXJzdCAodW5vcmRlcmVkKVxuICAgIHNlbGVjdChhcnIsIGxlZnQsIHJpZ2h0LCBrLCBjb21wYXJlKSB7XG4gICAgICAgIGxldCBuLCBpLCB6LCBzLCBzZCwgbmV3TGVmdCwgbmV3UmlnaHQsIHQsIGo7XG5cbiAgICAgICAgd2hpbGUgKHJpZ2h0ID4gbGVmdCkge1xuICAgICAgICAgICAgaWYgKHJpZ2h0IC0gbGVmdCA+IDYwMCkge1xuICAgICAgICAgICAgICAgIG4gPSByaWdodCAtIGxlZnQgKyAxO1xuICAgICAgICAgICAgICAgIGkgPSBrIC0gbGVmdCArIDE7XG4gICAgICAgICAgICAgICAgeiA9IE1hdGgubG9nKG4pO1xuICAgICAgICAgICAgICAgIHMgPSAwLjUgKiBNYXRoLmV4cCgyICogeiAvIDMpO1xuICAgICAgICAgICAgICAgIHNkID0gMC41ICogTWF0aC5zcXJ0KHogKiBzICogKG4gLSBzKSAvIG4pICogKGkgLSBuIC8gMiA8IDAgPyAtMSA6IDEpO1xuICAgICAgICAgICAgICAgIG5ld0xlZnQgPSBNYXRoLm1heChsZWZ0LCBNYXRoLmZsb29yKGsgLSBpICogcyAvIG4gKyBzZCkpO1xuICAgICAgICAgICAgICAgIG5ld1JpZ2h0ID0gTWF0aC5taW4ocmlnaHQsIE1hdGguZmxvb3IoayArIChuIC0gaSkgKiBzIC8gbiArIHNkKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QoYXJyLCBuZXdMZWZ0LCBuZXdSaWdodCwgaywgY29tcGFyZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHQgPSBhcnJba107XG4gICAgICAgICAgICBpID0gbGVmdDtcbiAgICAgICAgICAgIGogPSByaWdodDtcblxuICAgICAgICAgICAgdGhpcy5zd2FwKGFyciwgbGVmdCwgayk7XG4gICAgICAgICAgICBpZiAoY29tcGFyZShhcnJbcmlnaHRdLCB0KSA+IDApIHRoaXMuc3dhcChhcnIsIGxlZnQsIHJpZ2h0KTtcblxuICAgICAgICAgICAgd2hpbGUgKGkgPCBqKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zd2FwKGFyciwgaSwgaik7XG4gICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIGotLTtcbiAgICAgICAgICAgICAgICB3aGlsZSAoY29tcGFyZShhcnJbaV0sIHQpIDwgMCkgaSsrO1xuICAgICAgICAgICAgICAgIHdoaWxlIChjb21wYXJlKGFycltqXSwgdCkgPiAwKSBqLS07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjb21wYXJlKGFycltsZWZ0XSwgdCkgPT09IDApIHRoaXMuc3dhcChhcnIsIGxlZnQsIGopO1xuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgICAgIHRoaXMuc3dhcChhcnIsIGosIHJpZ2h0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGogPD0gaykgbGVmdCA9IGogKyAxO1xuICAgICAgICAgICAgaWYgKGsgPD0gaikgcmlnaHQgPSBqIC0gMTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHN3YXAoYXJyLCBpLCBqKSB7XG4gICAgICAgIGxldCB0bXAgPSBhcnJbaV07XG4gICAgICAgIGFycltpXSA9IGFycltqXTtcbiAgICAgICAgYXJyW2pdID0gdG1wO1xuICAgIH1cbn1cblxuIl19
