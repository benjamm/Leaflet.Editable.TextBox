(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g=(g.L||(g.L = {}));g=(g.Editable||(g.Editable = {}));g.Textbox = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*eslint no-undef: "error"*/
/*eslint-env node*/

var L = require('leaflet');

require('leaflet-editable');
require('leaflet-path-transform/src/Matrix');
require('./src/Textbox');
require('./src/Util');
require('./src/Editable.Textbox');
require('./src/SVG');

module.exports = L.Editable.TextBoxEditor;

},{"./src/Editable.Textbox":3,"./src/SVG":4,"./src/Textbox":5,"./src/Util":6,"leaflet":undefined,"leaflet-editable":undefined,"leaflet-path-transform/src/Matrix":2}],2:[function(require,module,exports){
/**
 * @class  L.Matrix
 *
 * @param {Number} a
 * @param {Number} b
 * @param {Number} c
 * @param {Number} d
 * @param {Number} e
 * @param {Number} f
 */
L.Matrix = function(a, b, c, d, e, f) {

  /**
   * @type {Array.<Number>}
   */
  this._matrix = [a, b, c, d, e, f];
};


L.Matrix.prototype = {


  /**
   * @param  {L.Point} point
   * @return {L.Point}
   */
  transform: function(point) {
    return this._transform(point.clone());
  },


  /**
   * Destructive
   *
   * [ x ] = [ a  b  tx ] [ x ] = [ a * x + b * y + tx ]
   * [ y ] = [ c  d  ty ] [ y ] = [ c * x + d * y + ty ]
   *
   * @param  {L.Point} point
   * @return {L.Point}
   */
  _transform: function(point) {
    var matrix = this._matrix;
    var x = point.x, y = point.y;
    point.x = matrix[0] * x + matrix[1] * y + matrix[4];
    point.y = matrix[2] * x + matrix[3] * y + matrix[5];
    return point;
  },


  /**
   * @param  {L.Point} point
   * @return {L.Point}
   */
  untransform: function (point) {
    var matrix = this._matrix;
    return new L.Point(
      (point.x / matrix[0] - matrix[4]) / matrix[0],
      (point.y / matrix[2] - matrix[5]) / matrix[2]
    );
  },


  /**
   * @return {L.Matrix}
   */
  clone: function() {
    var matrix = this._matrix;
    return new L.Matrix(
      matrix[0], matrix[1], matrix[2],
      matrix[3], matrix[4], matrix[5]
    );
  },


  /**
   * @param {L.Point=|Number=} translate
   * @return {L.Matrix|L.Point}
   */
  translate: function(translate) {
    if (translate === undefined) {
      return new L.Point(this._matrix[4], this._matrix[5]);
    }

    var translateX, translateY;
    if (typeof translate === 'number') {
      translateX = translateY = translate;
    } else {
      translateX = translate.x;
      translateY = translate.y;
    }

    return this._add(1, 0, 0, 1, translateX, translateY);
  },


  /**
   * @param {L.Point=|Number=} scale
   * @return {L.Matrix|L.Point}
   */
  scale: function(scale, origin) {
    if (scale === undefined) {
      return new L.Point(this._matrix[0], this._matrix[3]);
    }

    var scaleX, scaleY;
    origin = origin || L.point(0, 0);
    if (typeof scale === 'number') {
      scaleX = scaleY = scale;
    } else {
      scaleX = scale.x;
      scaleY = scale.y;
    }

    return this
      ._add(scaleX, 0, 0, scaleY, origin.x, origin.y)
      ._add(1, 0, 0, 1, -origin.x, -origin.y);
  },


  /**
   * m00  m01  x - m00 * x - m01 * y
   * m10  m11  y - m10 * x - m11 * y
   * @param {Number}   angle
   * @param {L.Point=} origin
   * @return {L.Matrix}
   */
  rotate: function(angle, origin) {
    var cos = Math.cos(angle);
    var sin = Math.sin(angle);

    origin = origin || new L.Point(0, 0);

    return this
      ._add(cos, sin, -sin, cos, origin.x, origin.y)
      ._add(1, 0, 0, 1, -origin.x, -origin.y);
  },


  /**
   * Invert rotation
   * @return {L.Matrix}
   */
  flip: function() {
    this._matrix[1] *= -1;
    this._matrix[2] *= -1;
    return this;
  },


  /**
   * @param {Number|L.Matrix} a
   * @param {Number} b
   * @param {Number} c
   * @param {Number} d
   * @param {Number} e
   * @param {Number} f
   */
  _add: function(a, b, c, d, e, f) {
    var result = [[], [], []];
    var src = this._matrix;
    var m = [
      [src[0], src[2], src[4]],
      [src[1], src[3], src[5]],
      [     0,      0,     1]
    ];
    var other = [
      [a, c, e],
      [b, d, f],
      [0, 0, 1]
    ], val;


    if (a && a instanceof L.Matrix) {
      src = a._matrix;
      other = [
        [src[0], src[2], src[4]],
        [src[1], src[3], src[5]],
        [     0,      0,     1]];
    }

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        val = 0;
        for (var k = 0; k < 3; k++) {
          val += m[i][k] * other[k][j];
        }
        result[i][j] = val;
      }
    }

    this._matrix = [
      result[0][0], result[1][0], result[0][1],
      result[1][1], result[0][2], result[1][2]
    ];
    return this;
  }


};


L.matrix = function(a, b, c, d, e, f) {
  return new L.Matrix(a, b, c, d, e, f);
};

},{}],3:[function(require,module,exports){
/**
 * TextBox
 *
 * @author rumax
 * @license MIT
 */

/* eslint-disable no-console */

L.Editable.TextBoxEditor = L.Editable.RectangleEditor.extend({

  options: {
    textareaPadding: 1
  },

  /**
   * @param  {L.Map}     map
   * @param  {L.Textbox} feature
   * @param  {Object=}   options
   */
  initialize: function(map, feature, options) {

    /**
     * @type {HTMLTextAreaElement}
     */
    this._textArea = null;

    /**
     * @type {String}
     */
    this._text     = null;

    L.Editable.RectangleEditor.prototype.initialize.call(this, map, feature, options);
  },


  updateStyle: function() {
    if (null !== this._textArea) {
      var style   = this._textArea.style;
      var options = this.feature.options;

      style.fontSize   = options.fontSize + 'px';
      style.color      = options.fontColor;
      style.fontFamily = options.fontFamily;
    }
  },


  enable: function() {
    L.Editable.RectangleEditor.prototype.enable.call(this);
    this.map
        .on('dragend', this._focus, this)
        .on('zoomanim', this._animateZoom, this)
        .on('zoomend', this._updateTextAreaBounds, this);

    if (null === this._textArea) {
      this._textArea = L.DomUtil.create('textarea',
        'leaflet-zoom-animated leaflet-textbox');
      var style = this._textArea.style;
      style.resize          = 'none';
      style.border          = 'none';
      style.padding         = this.options.textareaPadding + 'px';
      style.backgroundColor = 'transparent';

      this.updateStyle();
      this.map.getPane('markerPane').appendChild(this._textArea);

      this._text = this.feature._text;
      if (this._text) {
        this._textArea.innerHTML = this._text;
      }

      this._updateTextAreaBounds();
    }

    if (this.feature._textNode) {
      this.feature._textNode.parentNode.removeChild(this.feature._textNode);
      this.feature._textNode = null;
    }

    return this;
  },


  setText: function(text) {
    this._text = text;

    if (null !== this._textArea) {
      this._textArea.value = text;
    }
  },


  getText: function() {
    this._text = this._textArea.value;
    return this._text;
  },


  disable: function() {
    if (this._enabled) {
      this.map
        .off('dragend',  this._focus, this)
        .off('zoomanim', this._animateZoom, this)
        .off('zoomend',  this._updateTextAreaBounds, this);

      if (null !== this.textArea) {
        this.getText();
        this._textArea.parentNode.removeChild(this._textArea);
        this._textArea = null;
      }
      this.feature._text = this._text;
      this.feature._renderText();
    }

    L.Editable.RectangleEditor.prototype.disable.call(this);

    return this;
  },


  updateBounds: function (bounds) {
    L.Editable.RectangleEditor.prototype.updateBounds.call(this, bounds);
    return this._updateTextAreaBounds();
  },


  _focus: function() {
    if (null !== this._textArea) {
      L.Util.requestAnimFrame(function() {
        this._textArea.focus();
      }, this);
    }
  },


  /**
   * Animated resize
   * @param  {Event} evt
   */
  _animateZoom: function(evt) {
    var bounds = this.feature._bounds;
    var scale  = this.feature._getScale(evt.zoom);
    var offset = this.map._latLngToNewLayerPoint(
      bounds.getNorthWest(), evt.zoom, evt.center);

    L.DomUtil.setTransform(this._textArea, offset, scale.toFixed(3));
  },


  /**
   * Resize, reposition on zoom end or resize
   */
  _updateTextAreaBounds: function() {
    var scale, latlngs, pos, size;
    var feature  = this.feature;
    var bounds   = feature._bounds;
    var textArea = this._textArea;
    var map      = this.map;

    if (null !== textArea) {
      if (null !== bounds) {
        scale = feature._getScale(map.getZoom());
        latlngs = feature._boundsToLatLngs(bounds);
        pos = map.latLngToLayerPoint(latlngs[1]);
        size = map.latLngToLayerPoint(latlngs[3]).subtract(pos);
        L.DomUtil
           .setSize(textArea, size.divideBy(scale).round())
           .setTransform(textArea, pos, scale.toFixed(3));

        textArea.style.display  = '';
        textArea.style.position = 'absolute';
        textArea.setAttribute('spellcheck', false);

        this._focus();
      } else {
        textArea.style.display = 'none';
      }
    }

    return this;
  }

});


L.TextBox.include({

  enableEdit: function(map) {
    if (!this.editor) {
      this.createEditor(map);
    }
    return L.Rectangle.prototype.enableEdit.call(this, map);
  },


  disableEdit: function() {
    if (this.editor) {
      this._text = this.editor.getText();
    }

    L.Rectangle.prototype.disableEdit.call(this);

    return this;
  },


  getEditorClass: function() {
    return L.Editable.TextBoxEditor;
  }

});


/**
 * @param  {Array.<LatLng>=} latlng
 * @param  {Object=} options
 * @return {L.TextBox}
 */
L.Editable.prototype.startTextBox = function(latlng, options) {
  return this.startRectangle(null, L.extend({
    rectangleClass: L.TextBox
  }, options));
};

},{}],4:[function(require,module,exports){
/**
 * SVG tools
 *
 * @author rumax
 * @license MIT
 * @preserve
 */

var DEFAULT_SIZE = 12;
var LINE_FACTOR  = 1.12;

/**
 * @param  {SVGElement} svg
 * @return {Object}
 */
L.SVG.calcFontSize = L.SVG.calcFontSize || function(svg) {
  var size    = DEFAULT_SIZE;
  var sizeMin = Number.MAX_VALUE;
  var sizeMax = Number.MIN_VALUE;
  var texts   = svg.querySelectorAll('text');
  var textSize;

  if (0 < texts.length) {
    size = 0;
    for (var ind = texts.length - 1; 0 <= ind; --ind) {
      textSize = parseFloat(texts[ind].getAttribute('font-size'));
      size += textSize;
      if (sizeMin > textSize) {
        sizeMin = textSize;
      }

      if (sizeMax < textSize) {
        sizeMax = textSize;
      }
    }

    return {
      size: Math.round(size / texts.length + 0.5),
      min: Math.round(sizeMin + 0.5),
      max: Number.MIN_VALUE === sizeMax ? size : Math.round(sizeMax + 0.5)
    };
  }

  return {
    size: size,
    min: size,
    max: size
  };
};


L.SVG.include({

  renderText: function(layer) {
    var textElement = layer._textNode;
    var text  = layer._text;

    if (textElement) {
      textElement.parentNode.removeChild(textElement);
    }
    textElement = layer._textNode = L.SVG.create('text');
    layer.updateStyle();
    this._rootGroup.appendChild(textElement);

    if (text) {
      var scale = layer._getScale(this._map.getZoom());
      var pos   = layer._rings[0][1];
      var size  = layer._rings[0][3].subtract(pos).divideBy(scale);

      var chars = text.split('');
      var line = chars.shift();
      var char = chars.shift();
      var lineInd = 1;
      var maxWidth = size.x - layer.options.padding;
      var tspan = this._textMakeNextLine(textElement, line, {
        x: layer.options.padding
      });
      var lineHeight = textElement.getBBox().height;
      tspan.setAttribute('dy', lineHeight);

      while (char) {
        if (' ' === char) {
          line += char;
        } else if ('\n' === char) {
          line = '';
          tspan = this._textMakeNextLine(textElement, line, {
            x: layer.options.padding,
            dy: LINE_FACTOR * lineHeight
          });
        } else if ('\t' !== char) { //skip tabs
          var prevLine = line;
          line += char;
          tspan.firstChild.nodeValue = line;
          var lineLength = layer.options.padding +
            tspan.getComputedTextLength();

          if (lineLength > maxWidth && 1 <= line.length) {
            ++lineInd;
            tspan.firstChild.nodeValue = prevLine.replace(/\s*$/gm, '');
            prevLine = '';
            line = char;
            tspan = this._textMakeNextLine(textElement, line, {
              x: layer.options.padding,
              dy: LINE_FACTOR * lineHeight
            });
          }
        }
        char = chars.shift();
      }
    } else if (null !== textElement) {
      textElement.parentNode.removeChild(textElement);
      textElement = null;
    }

    return textElement;
  },


  _textMakeNextLine: function(container, text, attrs) {
    var tspan = L.SVG.create('tspan');
    var key;

    for (key in attrs || {}) {
      if (attrs.hasOwnProperty(key)) {
        tspan.setAttribute(key, attrs[key]);
      }
    }
    tspan.appendChild(document.createTextNode(text || ''));
    container.appendChild(tspan);

    return tspan;
  }
});

},{}],5:[function(require,module,exports){

L.TextBox = L.Rectangle.extend({

  options: {
    padding: 2,
    fontSize: 12,
    fillOpacity: 0.5,
    fillColor: '#ffffff',
    weight: 1,
    fontColor: '',
    fontFamily: '',
    ratio: 1,
    text: 'Please, add text'

    //TODO: wrapBy: 'letter', 'char', 'nowrap', etc.
  },


  initialize: function(bounds, options) {
    L.Rectangle.prototype.initialize.call(this, bounds, options);

    this._text = this.options.text;
    this._textNode = null;
  },


  /**
   * @param {Object} style
   */
  setStyle: function(style) {
    L.setOptions(this, style);

    if (this.editor && this.editor._enabled) {
      this.editor.updateStyle();
    } else {
      this._renderText();
    }
  },


  updateStyle: function() {
    var textNode = this._textNode;
    var options = this.options;
    if (null !== textNode) {
      textNode.setAttribute('font-family', options.fontFamily);
      textNode.setAttribute('font-size', options.fontSize + 'px');
      textNode.setAttribute('fill', options.fontColor);
    }
  },


  _renderText: function() {
    this._textNode = this._renderer.renderText(this);
    this._path.parentNode
        .insertBefore(this._textNode, this._path.nextSibling);
    this.updateStyle();
    this._updatePosition();
  },


  _updatePosition: function() {
    if (null !== this._textNode && 0 !== this._rings.length) {
      var pos = this._rings[0][1];
      var textMatrix = new L.Matrix(1, 0, 0, 1, 0, 0)
        .translate(pos)
        .scale(this._getScale(this._map.getZoom()));
      this._textNode.setAttribute('transform',
        'matrix(' + textMatrix._matrix.join(' ') + ')');
    }
  },


  _getScale: function(zoom) {
    return (this._map ?
      Math.pow(2, zoom) * this.options.ratio : 1);
  },


  _updatePath: function() {
    L.Rectangle.prototype._updatePath.call(this);
    this._updatePosition();
  }

});

},{}],6:[function(require,module,exports){
/**
 * @param  {Element} element
 * @param  {L.Point} size
 * @return {Object} self
 */
L.DomUtil.setSize =  L.DomUtil.setSize || function(element, size) {
  element.style.width = size.x  + 'px';
  element.style.height = size.y + 'px';
  return this;
};

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9sZWFmbGV0LXBhdGgtdHJhbnNmb3JtL3NyYy9NYXRyaXguanMiLCJzcmMvRWRpdGFibGUuVGV4dGJveC5qcyIsInNyYy9TVkcuanMiLCJzcmMvVGV4dGJveC5qcyIsInNyYy9VdGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKmVzbGludCBuby11bmRlZjogXCJlcnJvclwiKi9cbi8qZXNsaW50LWVudiBub2RlKi9cblxudmFyIEwgPSByZXF1aXJlKCdsZWFmbGV0Jyk7XG5cbnJlcXVpcmUoJ2xlYWZsZXQtZWRpdGFibGUnKTtcbnJlcXVpcmUoJ2xlYWZsZXQtcGF0aC10cmFuc2Zvcm0vc3JjL01hdHJpeCcpO1xucmVxdWlyZSgnLi9zcmMvVGV4dGJveCcpO1xucmVxdWlyZSgnLi9zcmMvVXRpbCcpO1xucmVxdWlyZSgnLi9zcmMvRWRpdGFibGUuVGV4dGJveCcpO1xucmVxdWlyZSgnLi9zcmMvU1ZHJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gTC5FZGl0YWJsZS5UZXh0Qm94RWRpdG9yO1xuIiwiLyoqXG4gKiBAY2xhc3MgIEwuTWF0cml4XG4gKlxuICogQHBhcmFtIHtOdW1iZXJ9IGFcbiAqIEBwYXJhbSB7TnVtYmVyfSBiXG4gKiBAcGFyYW0ge051bWJlcn0gY1xuICogQHBhcmFtIHtOdW1iZXJ9IGRcbiAqIEBwYXJhbSB7TnVtYmVyfSBlXG4gKiBAcGFyYW0ge051bWJlcn0gZlxuICovXG5MLk1hdHJpeCA9IGZ1bmN0aW9uKGEsIGIsIGMsIGQsIGUsIGYpIHtcblxuICAvKipcbiAgICogQHR5cGUge0FycmF5LjxOdW1iZXI+fVxuICAgKi9cbiAgdGhpcy5fbWF0cml4ID0gW2EsIGIsIGMsIGQsIGUsIGZdO1xufTtcblxuXG5MLk1hdHJpeC5wcm90b3R5cGUgPSB7XG5cblxuICAvKipcbiAgICogQHBhcmFtICB7TC5Qb2ludH0gcG9pbnRcbiAgICogQHJldHVybiB7TC5Qb2ludH1cbiAgICovXG4gIHRyYW5zZm9ybTogZnVuY3Rpb24ocG9pbnQpIHtcbiAgICByZXR1cm4gdGhpcy5fdHJhbnNmb3JtKHBvaW50LmNsb25lKCkpO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIERlc3RydWN0aXZlXG4gICAqXG4gICAqIFsgeCBdID0gWyBhICBiICB0eCBdIFsgeCBdID0gWyBhICogeCArIGIgKiB5ICsgdHggXVxuICAgKiBbIHkgXSA9IFsgYyAgZCAgdHkgXSBbIHkgXSA9IFsgYyAqIHggKyBkICogeSArIHR5IF1cbiAgICpcbiAgICogQHBhcmFtICB7TC5Qb2ludH0gcG9pbnRcbiAgICogQHJldHVybiB7TC5Qb2ludH1cbiAgICovXG4gIF90cmFuc2Zvcm06IGZ1bmN0aW9uKHBvaW50KSB7XG4gICAgdmFyIG1hdHJpeCA9IHRoaXMuX21hdHJpeDtcbiAgICB2YXIgeCA9IHBvaW50LngsIHkgPSBwb2ludC55O1xuICAgIHBvaW50LnggPSBtYXRyaXhbMF0gKiB4ICsgbWF0cml4WzFdICogeSArIG1hdHJpeFs0XTtcbiAgICBwb2ludC55ID0gbWF0cml4WzJdICogeCArIG1hdHJpeFszXSAqIHkgKyBtYXRyaXhbNV07XG4gICAgcmV0dXJuIHBvaW50O1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0wuUG9pbnR9IHBvaW50XG4gICAqIEByZXR1cm4ge0wuUG9pbnR9XG4gICAqL1xuICB1bnRyYW5zZm9ybTogZnVuY3Rpb24gKHBvaW50KSB7XG4gICAgdmFyIG1hdHJpeCA9IHRoaXMuX21hdHJpeDtcbiAgICByZXR1cm4gbmV3IEwuUG9pbnQoXG4gICAgICAocG9pbnQueCAvIG1hdHJpeFswXSAtIG1hdHJpeFs0XSkgLyBtYXRyaXhbMF0sXG4gICAgICAocG9pbnQueSAvIG1hdHJpeFsyXSAtIG1hdHJpeFs1XSkgLyBtYXRyaXhbMl1cbiAgICApO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEByZXR1cm4ge0wuTWF0cml4fVxuICAgKi9cbiAgY2xvbmU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBtYXRyaXggPSB0aGlzLl9tYXRyaXg7XG4gICAgcmV0dXJuIG5ldyBMLk1hdHJpeChcbiAgICAgIG1hdHJpeFswXSwgbWF0cml4WzFdLCBtYXRyaXhbMl0sXG4gICAgICBtYXRyaXhbM10sIG1hdHJpeFs0XSwgbWF0cml4WzVdXG4gICAgKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0wuUG9pbnQ9fE51bWJlcj19IHRyYW5zbGF0ZVxuICAgKiBAcmV0dXJuIHtMLk1hdHJpeHxMLlBvaW50fVxuICAgKi9cbiAgdHJhbnNsYXRlOiBmdW5jdGlvbih0cmFuc2xhdGUpIHtcbiAgICBpZiAodHJhbnNsYXRlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBuZXcgTC5Qb2ludCh0aGlzLl9tYXRyaXhbNF0sIHRoaXMuX21hdHJpeFs1XSk7XG4gICAgfVxuXG4gICAgdmFyIHRyYW5zbGF0ZVgsIHRyYW5zbGF0ZVk7XG4gICAgaWYgKHR5cGVvZiB0cmFuc2xhdGUgPT09ICdudW1iZXInKSB7XG4gICAgICB0cmFuc2xhdGVYID0gdHJhbnNsYXRlWSA9IHRyYW5zbGF0ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJhbnNsYXRlWCA9IHRyYW5zbGF0ZS54O1xuICAgICAgdHJhbnNsYXRlWSA9IHRyYW5zbGF0ZS55O1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLl9hZGQoMSwgMCwgMCwgMSwgdHJhbnNsYXRlWCwgdHJhbnNsYXRlWSk7XG4gIH0sXG5cblxuICAvKipcbiAgICogQHBhcmFtIHtMLlBvaW50PXxOdW1iZXI9fSBzY2FsZVxuICAgKiBAcmV0dXJuIHtMLk1hdHJpeHxMLlBvaW50fVxuICAgKi9cbiAgc2NhbGU6IGZ1bmN0aW9uKHNjYWxlLCBvcmlnaW4pIHtcbiAgICBpZiAoc2NhbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG5ldyBMLlBvaW50KHRoaXMuX21hdHJpeFswXSwgdGhpcy5fbWF0cml4WzNdKTtcbiAgICB9XG5cbiAgICB2YXIgc2NhbGVYLCBzY2FsZVk7XG4gICAgb3JpZ2luID0gb3JpZ2luIHx8IEwucG9pbnQoMCwgMCk7XG4gICAgaWYgKHR5cGVvZiBzY2FsZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHNjYWxlWCA9IHNjYWxlWSA9IHNjYWxlO1xuICAgIH0gZWxzZSB7XG4gICAgICBzY2FsZVggPSBzY2FsZS54O1xuICAgICAgc2NhbGVZID0gc2NhbGUueTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICAgICAgLl9hZGQoc2NhbGVYLCAwLCAwLCBzY2FsZVksIG9yaWdpbi54LCBvcmlnaW4ueSlcbiAgICAgIC5fYWRkKDEsIDAsIDAsIDEsIC1vcmlnaW4ueCwgLW9yaWdpbi55KTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBtMDAgIG0wMSAgeCAtIG0wMCAqIHggLSBtMDEgKiB5XG4gICAqIG0xMCAgbTExICB5IC0gbTEwICogeCAtIG0xMSAqIHlcbiAgICogQHBhcmFtIHtOdW1iZXJ9ICAgYW5nbGVcbiAgICogQHBhcmFtIHtMLlBvaW50PX0gb3JpZ2luXG4gICAqIEByZXR1cm4ge0wuTWF0cml4fVxuICAgKi9cbiAgcm90YXRlOiBmdW5jdGlvbihhbmdsZSwgb3JpZ2luKSB7XG4gICAgdmFyIGNvcyA9IE1hdGguY29zKGFuZ2xlKTtcbiAgICB2YXIgc2luID0gTWF0aC5zaW4oYW5nbGUpO1xuXG4gICAgb3JpZ2luID0gb3JpZ2luIHx8IG5ldyBMLlBvaW50KDAsIDApO1xuXG4gICAgcmV0dXJuIHRoaXNcbiAgICAgIC5fYWRkKGNvcywgc2luLCAtc2luLCBjb3MsIG9yaWdpbi54LCBvcmlnaW4ueSlcbiAgICAgIC5fYWRkKDEsIDAsIDAsIDEsIC1vcmlnaW4ueCwgLW9yaWdpbi55KTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBJbnZlcnQgcm90YXRpb25cbiAgICogQHJldHVybiB7TC5NYXRyaXh9XG4gICAqL1xuICBmbGlwOiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9tYXRyaXhbMV0gKj0gLTE7XG4gICAgdGhpcy5fbWF0cml4WzJdICo9IC0xO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7TnVtYmVyfEwuTWF0cml4fSBhXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBiXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBjXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBkXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBlXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBmXG4gICAqL1xuICBfYWRkOiBmdW5jdGlvbihhLCBiLCBjLCBkLCBlLCBmKSB7XG4gICAgdmFyIHJlc3VsdCA9IFtbXSwgW10sIFtdXTtcbiAgICB2YXIgc3JjID0gdGhpcy5fbWF0cml4O1xuICAgIHZhciBtID0gW1xuICAgICAgW3NyY1swXSwgc3JjWzJdLCBzcmNbNF1dLFxuICAgICAgW3NyY1sxXSwgc3JjWzNdLCBzcmNbNV1dLFxuICAgICAgWyAgICAgMCwgICAgICAwLCAgICAgMV1cbiAgICBdO1xuICAgIHZhciBvdGhlciA9IFtcbiAgICAgIFthLCBjLCBlXSxcbiAgICAgIFtiLCBkLCBmXSxcbiAgICAgIFswLCAwLCAxXVxuICAgIF0sIHZhbDtcblxuXG4gICAgaWYgKGEgJiYgYSBpbnN0YW5jZW9mIEwuTWF0cml4KSB7XG4gICAgICBzcmMgPSBhLl9tYXRyaXg7XG4gICAgICBvdGhlciA9IFtcbiAgICAgICAgW3NyY1swXSwgc3JjWzJdLCBzcmNbNF1dLFxuICAgICAgICBbc3JjWzFdLCBzcmNbM10sIHNyY1s1XV0sXG4gICAgICAgIFsgICAgIDAsICAgICAgMCwgICAgIDFdXTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IDM7IGkrKykge1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCAzOyBqKyspIHtcbiAgICAgICAgdmFsID0gMDtcbiAgICAgICAgZm9yICh2YXIgayA9IDA7IGsgPCAzOyBrKyspIHtcbiAgICAgICAgICB2YWwgKz0gbVtpXVtrXSAqIG90aGVyW2tdW2pdO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdFtpXVtqXSA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLl9tYXRyaXggPSBbXG4gICAgICByZXN1bHRbMF1bMF0sIHJlc3VsdFsxXVswXSwgcmVzdWx0WzBdWzFdLFxuICAgICAgcmVzdWx0WzFdWzFdLCByZXN1bHRbMF1bMl0sIHJlc3VsdFsxXVsyXVxuICAgIF07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuXG59O1xuXG5cbkwubWF0cml4ID0gZnVuY3Rpb24oYSwgYiwgYywgZCwgZSwgZikge1xuICByZXR1cm4gbmV3IEwuTWF0cml4KGEsIGIsIGMsIGQsIGUsIGYpO1xufTtcbiIsIi8qKlxuICogVGV4dEJveFxuICpcbiAqIEBhdXRob3IgcnVtYXhcbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbi8qIGVzbGludC1kaXNhYmxlIG5vLWNvbnNvbGUgKi9cblxuTC5FZGl0YWJsZS5UZXh0Qm94RWRpdG9yID0gTC5FZGl0YWJsZS5SZWN0YW5nbGVFZGl0b3IuZXh0ZW5kKHtcblxuICBvcHRpb25zOiB7XG4gICAgdGV4dGFyZWFQYWRkaW5nOiAxXG4gIH0sXG5cbiAgLyoqXG4gICAqIEBwYXJhbSAge0wuTWFwfSAgICAgbWFwXG4gICAqIEBwYXJhbSAge0wuVGV4dGJveH0gZmVhdHVyZVxuICAgKiBAcGFyYW0gIHtPYmplY3Q9fSAgIG9wdGlvbnNcbiAgICovXG4gIGluaXRpYWxpemU6IGZ1bmN0aW9uKG1hcCwgZmVhdHVyZSwgb3B0aW9ucykge1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge0hUTUxUZXh0QXJlYUVsZW1lbnR9XG4gICAgICovXG4gICAgdGhpcy5fdGV4dEFyZWEgPSBudWxsO1xuXG4gICAgLyoqXG4gICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgKi9cbiAgICB0aGlzLl90ZXh0ICAgICA9IG51bGw7XG5cbiAgICBMLkVkaXRhYmxlLlJlY3RhbmdsZUVkaXRvci5wcm90b3R5cGUuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsIG1hcCwgZmVhdHVyZSwgb3B0aW9ucyk7XG4gIH0sXG5cblxuICB1cGRhdGVTdHlsZTogZnVuY3Rpb24oKSB7XG4gICAgaWYgKG51bGwgIT09IHRoaXMuX3RleHRBcmVhKSB7XG4gICAgICB2YXIgc3R5bGUgICA9IHRoaXMuX3RleHRBcmVhLnN0eWxlO1xuICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLmZlYXR1cmUub3B0aW9ucztcblxuICAgICAgc3R5bGUuZm9udFNpemUgICA9IG9wdGlvbnMuZm9udFNpemUgKyAncHgnO1xuICAgICAgc3R5bGUuY29sb3IgICAgICA9IG9wdGlvbnMuZm9udENvbG9yO1xuICAgICAgc3R5bGUuZm9udEZhbWlseSA9IG9wdGlvbnMuZm9udEZhbWlseTtcbiAgICB9XG4gIH0sXG5cblxuICBlbmFibGU6IGZ1bmN0aW9uKCkge1xuICAgIEwuRWRpdGFibGUuUmVjdGFuZ2xlRWRpdG9yLnByb3RvdHlwZS5lbmFibGUuY2FsbCh0aGlzKTtcbiAgICB0aGlzLm1hcFxuICAgICAgICAub24oJ2RyYWdlbmQnLCB0aGlzLl9mb2N1cywgdGhpcylcbiAgICAgICAgLm9uKCd6b29tYW5pbScsIHRoaXMuX2FuaW1hdGVab29tLCB0aGlzKVxuICAgICAgICAub24oJ3pvb21lbmQnLCB0aGlzLl91cGRhdGVUZXh0QXJlYUJvdW5kcywgdGhpcyk7XG5cbiAgICBpZiAobnVsbCA9PT0gdGhpcy5fdGV4dEFyZWEpIHtcbiAgICAgIHRoaXMuX3RleHRBcmVhID0gTC5Eb21VdGlsLmNyZWF0ZSgndGV4dGFyZWEnLFxuICAgICAgICAnbGVhZmxldC16b29tLWFuaW1hdGVkIGxlYWZsZXQtdGV4dGJveCcpO1xuICAgICAgdmFyIHN0eWxlID0gdGhpcy5fdGV4dEFyZWEuc3R5bGU7XG4gICAgICBzdHlsZS5yZXNpemUgICAgICAgICAgPSAnbm9uZSc7XG4gICAgICBzdHlsZS5ib3JkZXIgICAgICAgICAgPSAnbm9uZSc7XG4gICAgICBzdHlsZS5wYWRkaW5nICAgICAgICAgPSB0aGlzLm9wdGlvbnMudGV4dGFyZWFQYWRkaW5nICsgJ3B4JztcbiAgICAgIHN0eWxlLmJhY2tncm91bmRDb2xvciA9ICd0cmFuc3BhcmVudCc7XG5cbiAgICAgIHRoaXMudXBkYXRlU3R5bGUoKTtcbiAgICAgIHRoaXMubWFwLmdldFBhbmUoJ21hcmtlclBhbmUnKS5hcHBlbmRDaGlsZCh0aGlzLl90ZXh0QXJlYSk7XG5cbiAgICAgIHRoaXMuX3RleHQgPSB0aGlzLmZlYXR1cmUuX3RleHQ7XG4gICAgICBpZiAodGhpcy5fdGV4dCkge1xuICAgICAgICB0aGlzLl90ZXh0QXJlYS5pbm5lckhUTUwgPSB0aGlzLl90ZXh0O1xuICAgICAgfVxuXG4gICAgICB0aGlzLl91cGRhdGVUZXh0QXJlYUJvdW5kcygpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmZlYXR1cmUuX3RleHROb2RlKSB7XG4gICAgICB0aGlzLmZlYXR1cmUuX3RleHROb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5mZWF0dXJlLl90ZXh0Tm9kZSk7XG4gICAgICB0aGlzLmZlYXR1cmUuX3RleHROb2RlID0gbnVsbDtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuXG4gIHNldFRleHQ6IGZ1bmN0aW9uKHRleHQpIHtcbiAgICB0aGlzLl90ZXh0ID0gdGV4dDtcblxuICAgIGlmIChudWxsICE9PSB0aGlzLl90ZXh0QXJlYSkge1xuICAgICAgdGhpcy5fdGV4dEFyZWEudmFsdWUgPSB0ZXh0O1xuICAgIH1cbiAgfSxcblxuXG4gIGdldFRleHQ6IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX3RleHQgPSB0aGlzLl90ZXh0QXJlYS52YWx1ZTtcbiAgICByZXR1cm4gdGhpcy5fdGV4dDtcbiAgfSxcblxuXG4gIGRpc2FibGU6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9lbmFibGVkKSB7XG4gICAgICB0aGlzLm1hcFxuICAgICAgICAub2ZmKCdkcmFnZW5kJywgIHRoaXMuX2ZvY3VzLCB0aGlzKVxuICAgICAgICAub2ZmKCd6b29tYW5pbScsIHRoaXMuX2FuaW1hdGVab29tLCB0aGlzKVxuICAgICAgICAub2ZmKCd6b29tZW5kJywgIHRoaXMuX3VwZGF0ZVRleHRBcmVhQm91bmRzLCB0aGlzKTtcblxuICAgICAgaWYgKG51bGwgIT09IHRoaXMudGV4dEFyZWEpIHtcbiAgICAgICAgdGhpcy5nZXRUZXh0KCk7XG4gICAgICAgIHRoaXMuX3RleHRBcmVhLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5fdGV4dEFyZWEpO1xuICAgICAgICB0aGlzLl90ZXh0QXJlYSA9IG51bGw7XG4gICAgICB9XG4gICAgICB0aGlzLmZlYXR1cmUuX3RleHQgPSB0aGlzLl90ZXh0O1xuICAgICAgdGhpcy5mZWF0dXJlLl9yZW5kZXJUZXh0KCk7XG4gICAgfVxuXG4gICAgTC5FZGl0YWJsZS5SZWN0YW5nbGVFZGl0b3IucHJvdG90eXBlLmRpc2FibGUuY2FsbCh0aGlzKTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG5cbiAgdXBkYXRlQm91bmRzOiBmdW5jdGlvbiAoYm91bmRzKSB7XG4gICAgTC5FZGl0YWJsZS5SZWN0YW5nbGVFZGl0b3IucHJvdG90eXBlLnVwZGF0ZUJvdW5kcy5jYWxsKHRoaXMsIGJvdW5kcyk7XG4gICAgcmV0dXJuIHRoaXMuX3VwZGF0ZVRleHRBcmVhQm91bmRzKCk7XG4gIH0sXG5cblxuICBfZm9jdXM6IGZ1bmN0aW9uKCkge1xuICAgIGlmIChudWxsICE9PSB0aGlzLl90ZXh0QXJlYSkge1xuICAgICAgTC5VdGlsLnJlcXVlc3RBbmltRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuX3RleHRBcmVhLmZvY3VzKCk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG4gIH0sXG5cblxuICAvKipcbiAgICogQW5pbWF0ZWQgcmVzaXplXG4gICAqIEBwYXJhbSAge0V2ZW50fSBldnRcbiAgICovXG4gIF9hbmltYXRlWm9vbTogZnVuY3Rpb24oZXZ0KSB7XG4gICAgdmFyIGJvdW5kcyA9IHRoaXMuZmVhdHVyZS5fYm91bmRzO1xuICAgIHZhciBzY2FsZSAgPSB0aGlzLmZlYXR1cmUuX2dldFNjYWxlKGV2dC56b29tKTtcbiAgICB2YXIgb2Zmc2V0ID0gdGhpcy5tYXAuX2xhdExuZ1RvTmV3TGF5ZXJQb2ludChcbiAgICAgIGJvdW5kcy5nZXROb3J0aFdlc3QoKSwgZXZ0Lnpvb20sIGV2dC5jZW50ZXIpO1xuXG4gICAgTC5Eb21VdGlsLnNldFRyYW5zZm9ybSh0aGlzLl90ZXh0QXJlYSwgb2Zmc2V0LCBzY2FsZS50b0ZpeGVkKDMpKTtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBSZXNpemUsIHJlcG9zaXRpb24gb24gem9vbSBlbmQgb3IgcmVzaXplXG4gICAqL1xuICBfdXBkYXRlVGV4dEFyZWFCb3VuZHM6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzY2FsZSwgbGF0bG5ncywgcG9zLCBzaXplO1xuICAgIHZhciBmZWF0dXJlICA9IHRoaXMuZmVhdHVyZTtcbiAgICB2YXIgYm91bmRzICAgPSBmZWF0dXJlLl9ib3VuZHM7XG4gICAgdmFyIHRleHRBcmVhID0gdGhpcy5fdGV4dEFyZWE7XG4gICAgdmFyIG1hcCAgICAgID0gdGhpcy5tYXA7XG5cbiAgICBpZiAobnVsbCAhPT0gdGV4dEFyZWEpIHtcbiAgICAgIGlmIChudWxsICE9PSBib3VuZHMpIHtcbiAgICAgICAgc2NhbGUgPSBmZWF0dXJlLl9nZXRTY2FsZShtYXAuZ2V0Wm9vbSgpKTtcbiAgICAgICAgbGF0bG5ncyA9IGZlYXR1cmUuX2JvdW5kc1RvTGF0TG5ncyhib3VuZHMpO1xuICAgICAgICBwb3MgPSBtYXAubGF0TG5nVG9MYXllclBvaW50KGxhdGxuZ3NbMV0pO1xuICAgICAgICBzaXplID0gbWFwLmxhdExuZ1RvTGF5ZXJQb2ludChsYXRsbmdzWzNdKS5zdWJ0cmFjdChwb3MpO1xuICAgICAgICBMLkRvbVV0aWxcbiAgICAgICAgICAgLnNldFNpemUodGV4dEFyZWEsIHNpemUuZGl2aWRlQnkoc2NhbGUpLnJvdW5kKCkpXG4gICAgICAgICAgIC5zZXRUcmFuc2Zvcm0odGV4dEFyZWEsIHBvcywgc2NhbGUudG9GaXhlZCgzKSk7XG5cbiAgICAgICAgdGV4dEFyZWEuc3R5bGUuZGlzcGxheSAgPSAnJztcbiAgICAgICAgdGV4dEFyZWEuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xuICAgICAgICB0ZXh0QXJlYS5zZXRBdHRyaWJ1dGUoJ3NwZWxsY2hlY2snLCBmYWxzZSk7XG5cbiAgICAgICAgdGhpcy5fZm9jdXMoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRleHRBcmVhLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxufSk7XG5cblxuTC5UZXh0Qm94LmluY2x1ZGUoe1xuXG4gIGVuYWJsZUVkaXQ6IGZ1bmN0aW9uKG1hcCkge1xuICAgIGlmICghdGhpcy5lZGl0b3IpIHtcbiAgICAgIHRoaXMuY3JlYXRlRWRpdG9yKG1hcCk7XG4gICAgfVxuICAgIHJldHVybiBMLlJlY3RhbmdsZS5wcm90b3R5cGUuZW5hYmxlRWRpdC5jYWxsKHRoaXMsIG1hcCk7XG4gIH0sXG5cblxuICBkaXNhYmxlRWRpdDogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuZWRpdG9yKSB7XG4gICAgICB0aGlzLl90ZXh0ID0gdGhpcy5lZGl0b3IuZ2V0VGV4dCgpO1xuICAgIH1cblxuICAgIEwuUmVjdGFuZ2xlLnByb3RvdHlwZS5kaXNhYmxlRWRpdC5jYWxsKHRoaXMpO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cblxuICBnZXRFZGl0b3JDbGFzczogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEwuRWRpdGFibGUuVGV4dEJveEVkaXRvcjtcbiAgfVxuXG59KTtcblxuXG4vKipcbiAqIEBwYXJhbSAge0FycmF5LjxMYXRMbmc+PX0gbGF0bG5nXG4gKiBAcGFyYW0gIHtPYmplY3Q9fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtMLlRleHRCb3h9XG4gKi9cbkwuRWRpdGFibGUucHJvdG90eXBlLnN0YXJ0VGV4dEJveCA9IGZ1bmN0aW9uKGxhdGxuZywgb3B0aW9ucykge1xuICByZXR1cm4gdGhpcy5zdGFydFJlY3RhbmdsZShudWxsLCBMLmV4dGVuZCh7XG4gICAgcmVjdGFuZ2xlQ2xhc3M6IEwuVGV4dEJveFxuICB9LCBvcHRpb25zKSk7XG59O1xuIiwiLyoqXG4gKiBTVkcgdG9vbHNcbiAqXG4gKiBAYXV0aG9yIHJ1bWF4XG4gKiBAbGljZW5zZSBNSVRcbiAqIEBwcmVzZXJ2ZVxuICovXG5cbnZhciBERUZBVUxUX1NJWkUgPSAxMjtcbnZhciBMSU5FX0ZBQ1RPUiAgPSAxLjEyO1xuXG4vKipcbiAqIEBwYXJhbSAge1NWR0VsZW1lbnR9IHN2Z1xuICogQHJldHVybiB7T2JqZWN0fVxuICovXG5MLlNWRy5jYWxjRm9udFNpemUgPSBMLlNWRy5jYWxjRm9udFNpemUgfHwgZnVuY3Rpb24oc3ZnKSB7XG4gIHZhciBzaXplICAgID0gREVGQVVMVF9TSVpFO1xuICB2YXIgc2l6ZU1pbiA9IE51bWJlci5NQVhfVkFMVUU7XG4gIHZhciBzaXplTWF4ID0gTnVtYmVyLk1JTl9WQUxVRTtcbiAgdmFyIHRleHRzICAgPSBzdmcucXVlcnlTZWxlY3RvckFsbCgndGV4dCcpO1xuICB2YXIgdGV4dFNpemU7XG5cbiAgaWYgKDAgPCB0ZXh0cy5sZW5ndGgpIHtcbiAgICBzaXplID0gMDtcbiAgICBmb3IgKHZhciBpbmQgPSB0ZXh0cy5sZW5ndGggLSAxOyAwIDw9IGluZDsgLS1pbmQpIHtcbiAgICAgIHRleHRTaXplID0gcGFyc2VGbG9hdCh0ZXh0c1tpbmRdLmdldEF0dHJpYnV0ZSgnZm9udC1zaXplJykpO1xuICAgICAgc2l6ZSArPSB0ZXh0U2l6ZTtcbiAgICAgIGlmIChzaXplTWluID4gdGV4dFNpemUpIHtcbiAgICAgICAgc2l6ZU1pbiA9IHRleHRTaXplO1xuICAgICAgfVxuXG4gICAgICBpZiAoc2l6ZU1heCA8IHRleHRTaXplKSB7XG4gICAgICAgIHNpemVNYXggPSB0ZXh0U2l6ZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2l6ZTogTWF0aC5yb3VuZChzaXplIC8gdGV4dHMubGVuZ3RoICsgMC41KSxcbiAgICAgIG1pbjogTWF0aC5yb3VuZChzaXplTWluICsgMC41KSxcbiAgICAgIG1heDogTnVtYmVyLk1JTl9WQUxVRSA9PT0gc2l6ZU1heCA/IHNpemUgOiBNYXRoLnJvdW5kKHNpemVNYXggKyAwLjUpXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgc2l6ZTogc2l6ZSxcbiAgICBtaW46IHNpemUsXG4gICAgbWF4OiBzaXplXG4gIH07XG59O1xuXG5cbkwuU1ZHLmluY2x1ZGUoe1xuXG4gIHJlbmRlclRleHQ6IGZ1bmN0aW9uKGxheWVyKSB7XG4gICAgdmFyIHRleHRFbGVtZW50ID0gbGF5ZXIuX3RleHROb2RlO1xuICAgIHZhciB0ZXh0ICA9IGxheWVyLl90ZXh0O1xuXG4gICAgaWYgKHRleHRFbGVtZW50KSB7XG4gICAgICB0ZXh0RWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHRleHRFbGVtZW50KTtcbiAgICB9XG4gICAgdGV4dEVsZW1lbnQgPSBsYXllci5fdGV4dE5vZGUgPSBMLlNWRy5jcmVhdGUoJ3RleHQnKTtcbiAgICBsYXllci51cGRhdGVTdHlsZSgpO1xuICAgIHRoaXMuX3Jvb3RHcm91cC5hcHBlbmRDaGlsZCh0ZXh0RWxlbWVudCk7XG5cbiAgICBpZiAodGV4dCkge1xuICAgICAgdmFyIHNjYWxlID0gbGF5ZXIuX2dldFNjYWxlKHRoaXMuX21hcC5nZXRab29tKCkpO1xuICAgICAgdmFyIHBvcyAgID0gbGF5ZXIuX3JpbmdzWzBdWzFdO1xuICAgICAgdmFyIHNpemUgID0gbGF5ZXIuX3JpbmdzWzBdWzNdLnN1YnRyYWN0KHBvcykuZGl2aWRlQnkoc2NhbGUpO1xuXG4gICAgICB2YXIgY2hhcnMgPSB0ZXh0LnNwbGl0KCcnKTtcbiAgICAgIHZhciBsaW5lID0gY2hhcnMuc2hpZnQoKTtcbiAgICAgIHZhciBjaGFyID0gY2hhcnMuc2hpZnQoKTtcbiAgICAgIHZhciBsaW5lSW5kID0gMTtcbiAgICAgIHZhciBtYXhXaWR0aCA9IHNpemUueCAtIGxheWVyLm9wdGlvbnMucGFkZGluZztcbiAgICAgIHZhciB0c3BhbiA9IHRoaXMuX3RleHRNYWtlTmV4dExpbmUodGV4dEVsZW1lbnQsIGxpbmUsIHtcbiAgICAgICAgeDogbGF5ZXIub3B0aW9ucy5wYWRkaW5nXG4gICAgICB9KTtcbiAgICAgIHZhciBsaW5lSGVpZ2h0ID0gdGV4dEVsZW1lbnQuZ2V0QkJveCgpLmhlaWdodDtcbiAgICAgIHRzcGFuLnNldEF0dHJpYnV0ZSgnZHknLCBsaW5lSGVpZ2h0KTtcblxuICAgICAgd2hpbGUgKGNoYXIpIHtcbiAgICAgICAgaWYgKCcgJyA9PT0gY2hhcikge1xuICAgICAgICAgIGxpbmUgKz0gY2hhcjtcbiAgICAgICAgfSBlbHNlIGlmICgnXFxuJyA9PT0gY2hhcikge1xuICAgICAgICAgIGxpbmUgPSAnJztcbiAgICAgICAgICB0c3BhbiA9IHRoaXMuX3RleHRNYWtlTmV4dExpbmUodGV4dEVsZW1lbnQsIGxpbmUsIHtcbiAgICAgICAgICAgIHg6IGxheWVyLm9wdGlvbnMucGFkZGluZyxcbiAgICAgICAgICAgIGR5OiBMSU5FX0ZBQ1RPUiAqIGxpbmVIZWlnaHRcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIGlmICgnXFx0JyAhPT0gY2hhcikgeyAvL3NraXAgdGFic1xuICAgICAgICAgIHZhciBwcmV2TGluZSA9IGxpbmU7XG4gICAgICAgICAgbGluZSArPSBjaGFyO1xuICAgICAgICAgIHRzcGFuLmZpcnN0Q2hpbGQubm9kZVZhbHVlID0gbGluZTtcbiAgICAgICAgICB2YXIgbGluZUxlbmd0aCA9IGxheWVyLm9wdGlvbnMucGFkZGluZyArXG4gICAgICAgICAgICB0c3Bhbi5nZXRDb21wdXRlZFRleHRMZW5ndGgoKTtcblxuICAgICAgICAgIGlmIChsaW5lTGVuZ3RoID4gbWF4V2lkdGggJiYgMSA8PSBsaW5lLmxlbmd0aCkge1xuICAgICAgICAgICAgKytsaW5lSW5kO1xuICAgICAgICAgICAgdHNwYW4uZmlyc3RDaGlsZC5ub2RlVmFsdWUgPSBwcmV2TGluZS5yZXBsYWNlKC9cXHMqJC9nbSwgJycpO1xuICAgICAgICAgICAgcHJldkxpbmUgPSAnJztcbiAgICAgICAgICAgIGxpbmUgPSBjaGFyO1xuICAgICAgICAgICAgdHNwYW4gPSB0aGlzLl90ZXh0TWFrZU5leHRMaW5lKHRleHRFbGVtZW50LCBsaW5lLCB7XG4gICAgICAgICAgICAgIHg6IGxheWVyLm9wdGlvbnMucGFkZGluZyxcbiAgICAgICAgICAgICAgZHk6IExJTkVfRkFDVE9SICogbGluZUhlaWdodFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNoYXIgPSBjaGFycy5zaGlmdCgpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAobnVsbCAhPT0gdGV4dEVsZW1lbnQpIHtcbiAgICAgIHRleHRFbGVtZW50LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGV4dEVsZW1lbnQpO1xuICAgICAgdGV4dEVsZW1lbnQgPSBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB0ZXh0RWxlbWVudDtcbiAgfSxcblxuXG4gIF90ZXh0TWFrZU5leHRMaW5lOiBmdW5jdGlvbihjb250YWluZXIsIHRleHQsIGF0dHJzKSB7XG4gICAgdmFyIHRzcGFuID0gTC5TVkcuY3JlYXRlKCd0c3BhbicpO1xuICAgIHZhciBrZXk7XG5cbiAgICBmb3IgKGtleSBpbiBhdHRycyB8fCB7fSkge1xuICAgICAgaWYgKGF0dHJzLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgdHNwYW4uc2V0QXR0cmlidXRlKGtleSwgYXR0cnNba2V5XSk7XG4gICAgICB9XG4gICAgfVxuICAgIHRzcGFuLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQgfHwgJycpKTtcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQodHNwYW4pO1xuXG4gICAgcmV0dXJuIHRzcGFuO1xuICB9XG59KTtcbiIsIlxuTC5UZXh0Qm94ID0gTC5SZWN0YW5nbGUuZXh0ZW5kKHtcblxuICBvcHRpb25zOiB7XG4gICAgcGFkZGluZzogMixcbiAgICBmb250U2l6ZTogMTIsXG4gICAgZmlsbE9wYWNpdHk6IDAuNSxcbiAgICBmaWxsQ29sb3I6ICcjZmZmZmZmJyxcbiAgICB3ZWlnaHQ6IDEsXG4gICAgZm9udENvbG9yOiAnJyxcbiAgICBmb250RmFtaWx5OiAnJyxcbiAgICByYXRpbzogMSxcbiAgICB0ZXh0OiAnUGxlYXNlLCBhZGQgdGV4dCdcblxuICAgIC8vVE9ETzogd3JhcEJ5OiAnbGV0dGVyJywgJ2NoYXInLCAnbm93cmFwJywgZXRjLlxuICB9LFxuXG5cbiAgaW5pdGlhbGl6ZTogZnVuY3Rpb24oYm91bmRzLCBvcHRpb25zKSB7XG4gICAgTC5SZWN0YW5nbGUucHJvdG90eXBlLmluaXRpYWxpemUuY2FsbCh0aGlzLCBib3VuZHMsIG9wdGlvbnMpO1xuXG4gICAgdGhpcy5fdGV4dCA9IHRoaXMub3B0aW9ucy50ZXh0O1xuICAgIHRoaXMuX3RleHROb2RlID0gbnVsbDtcbiAgfSxcblxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge09iamVjdH0gc3R5bGVcbiAgICovXG4gIHNldFN0eWxlOiBmdW5jdGlvbihzdHlsZSkge1xuICAgIEwuc2V0T3B0aW9ucyh0aGlzLCBzdHlsZSk7XG5cbiAgICBpZiAodGhpcy5lZGl0b3IgJiYgdGhpcy5lZGl0b3IuX2VuYWJsZWQpIHtcbiAgICAgIHRoaXMuZWRpdG9yLnVwZGF0ZVN0eWxlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlbmRlclRleHQoKTtcbiAgICB9XG4gIH0sXG5cblxuICB1cGRhdGVTdHlsZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHRleHROb2RlID0gdGhpcy5fdGV4dE5vZGU7XG4gICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgaWYgKG51bGwgIT09IHRleHROb2RlKSB7XG4gICAgICB0ZXh0Tm9kZS5zZXRBdHRyaWJ1dGUoJ2ZvbnQtZmFtaWx5Jywgb3B0aW9ucy5mb250RmFtaWx5KTtcbiAgICAgIHRleHROb2RlLnNldEF0dHJpYnV0ZSgnZm9udC1zaXplJywgb3B0aW9ucy5mb250U2l6ZSArICdweCcpO1xuICAgICAgdGV4dE5vZGUuc2V0QXR0cmlidXRlKCdmaWxsJywgb3B0aW9ucy5mb250Q29sb3IpO1xuICAgIH1cbiAgfSxcblxuXG4gIF9yZW5kZXJUZXh0OiBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl90ZXh0Tm9kZSA9IHRoaXMuX3JlbmRlcmVyLnJlbmRlclRleHQodGhpcyk7XG4gICAgdGhpcy5fcGF0aC5wYXJlbnROb2RlXG4gICAgICAgIC5pbnNlcnRCZWZvcmUodGhpcy5fdGV4dE5vZGUsIHRoaXMuX3BhdGgubmV4dFNpYmxpbmcpO1xuICAgIHRoaXMudXBkYXRlU3R5bGUoKTtcbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvbigpO1xuICB9LFxuXG5cbiAgX3VwZGF0ZVBvc2l0aW9uOiBmdW5jdGlvbigpIHtcbiAgICBpZiAobnVsbCAhPT0gdGhpcy5fdGV4dE5vZGUgJiYgMCAhPT0gdGhpcy5fcmluZ3MubGVuZ3RoKSB7XG4gICAgICB2YXIgcG9zID0gdGhpcy5fcmluZ3NbMF1bMV07XG4gICAgICB2YXIgdGV4dE1hdHJpeCA9IG5ldyBMLk1hdHJpeCgxLCAwLCAwLCAxLCAwLCAwKVxuICAgICAgICAudHJhbnNsYXRlKHBvcylcbiAgICAgICAgLnNjYWxlKHRoaXMuX2dldFNjYWxlKHRoaXMuX21hcC5nZXRab29tKCkpKTtcbiAgICAgIHRoaXMuX3RleHROb2RlLnNldEF0dHJpYnV0ZSgndHJhbnNmb3JtJyxcbiAgICAgICAgJ21hdHJpeCgnICsgdGV4dE1hdHJpeC5fbWF0cml4LmpvaW4oJyAnKSArICcpJyk7XG4gICAgfVxuICB9LFxuXG5cbiAgX2dldFNjYWxlOiBmdW5jdGlvbih6b29tKSB7XG4gICAgcmV0dXJuICh0aGlzLl9tYXAgP1xuICAgICAgTWF0aC5wb3coMiwgem9vbSkgKiB0aGlzLm9wdGlvbnMucmF0aW8gOiAxKTtcbiAgfSxcblxuXG4gIF91cGRhdGVQYXRoOiBmdW5jdGlvbigpIHtcbiAgICBMLlJlY3RhbmdsZS5wcm90b3R5cGUuX3VwZGF0ZVBhdGguY2FsbCh0aGlzKTtcbiAgICB0aGlzLl91cGRhdGVQb3NpdGlvbigpO1xuICB9XG5cbn0pO1xuIiwiLyoqXG4gKiBAcGFyYW0gIHtFbGVtZW50fSBlbGVtZW50XG4gKiBAcGFyYW0gIHtMLlBvaW50fSBzaXplXG4gKiBAcmV0dXJuIHtPYmplY3R9IHNlbGZcbiAqL1xuTC5Eb21VdGlsLnNldFNpemUgPSAgTC5Eb21VdGlsLnNldFNpemUgfHwgZnVuY3Rpb24oZWxlbWVudCwgc2l6ZSkge1xuICBlbGVtZW50LnN0eWxlLndpZHRoID0gc2l6ZS54ICArICdweCc7XG4gIGVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gc2l6ZS55ICsgJ3B4JztcbiAgcmV0dXJuIHRoaXM7XG59O1xuIl19
