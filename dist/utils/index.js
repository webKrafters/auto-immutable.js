"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mapPathsToObject = exports.stringToDotPath = exports.makeReadonly = exports.isDataContainer = exports.getProperty = exports.clonedeep = exports.arrangePropertyPaths = void 0;
var cloneDeepWith_1 = __importDefault(require("lodash/cloneDeepWith"));
var isplainobject_1 = __importDefault(require("lodash/isplainobject"));
var clonedeep_eligibility_check_1 = __importDefault(require("./clonedeep-eligibility-check"));
var get_property_1 = __importDefault(require("@webkrafters/get-property"));
/**
 * Curates the most inclusive propertyPaths from a list of property paths.
 * @example
 * arrangePropertyPaths(["a.b.c.d", "a.b", "a.b.z[4].w", "s.t"]) => ["a.b", "s.t"].
 * "a.b" is inclusive of "a.b.c.d": "a.b.c.d" is a subset of "a.b." but not vice versa.
 * "a.b" is inclusive of "a.b.z[4].w": "a.b.z[4].w" is a subset of "a.b." but not vice versa.
 */
function arrangePropertyPaths(propertyPaths) {
  var superPathTokensMap = {};
  var _iterator = _createForOfIteratorHelper(propertyPaths),
    _step;
  try {
    var _loop = function _loop() {
      var path = _step.value;
      var pathTokens = path.replace(/\[([0-9]+)\]/g, '.$1').replace(/^\./, '').split(/\./);
      L2: {
        var replacedSuperPaths = [];
        var _loop2 = function _loop2() {
            var superPathTokens = superPathTokensMap[superPath];
            // self/subset check
            if (superPathTokens.length <= pathTokens.length) {
              if (superPathTokens.every(function (p, i) {
                return p === pathTokens[i];
              })) {
                return 0; // break L2
              }
              return 1; // continue
            }
            // superset check
            pathTokens.every(function (p, i) {
              return p === superPathTokens[i];
            }) && replacedSuperPaths.push(superPath);
          },
          _ret;
        for (var superPath in superPathTokensMap) {
          _ret = _loop2();
          if (_ret === 0) break L2;
          if (_ret === 1) continue;
        }
        superPathTokensMap[path] = pathTokens;
        for (var _i = 0, _replacedSuperPaths = replacedSuperPaths; _i < _replacedSuperPaths.length; _i++) {
          var _path = _replacedSuperPaths[_i];
          delete superPathTokensMap[_path];
        }
      }
    };
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      _loop();
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return Object.keys(superPathTokensMap);
}
exports.arrangePropertyPaths = arrangePropertyPaths;
;
/**
 * Built on top of lodash.clonedeepwith.\
 * Instances of non-native classes not implementing either the `clone` or the `cloneNode
 * methods may not be cloneable. Such instances are retured uncloned.
 */
exports.clonedeep = function () {
  var defaultCustomizer = function defaultCustomizer(v) {
    if (v === null) {
      return;
    }
    if (_typeof(v) === 'object') {
      if ('clone' in v && typeof v.clone === 'function') {
        return v.clone();
      }
      if ('cloneNode' in v && typeof v.cloneNode === 'function') {
        return v.cloneNode(true);
      }
    }
    if (!(0, clonedeep_eligibility_check_1["default"])(v).isEligible) {
      return v;
    }
  };
  var clone = function clone(value) {
    var customizer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultCustomizer;
    return (0, cloneDeepWith_1["default"])(value, customizer);
  };
  var clonedeep = function clonedeep(value) {
    return clone(value);
  };
  return clonedeep;
}();
exports.getProperty = get_property_1["default"];
/** Checks if value is either a plain object or an array */
function isDataContainer(v) {
  return (0, isplainobject_1["default"])(v) || Array.isArray(v);
}
exports.isDataContainer = isDataContainer;
/**
 * Converts argument to readonly.
 *
 * Note: Mutates original argument.
 */
function makeReadonly(v) {
  var frozen = true;
  if ((0, isplainobject_1["default"])(v)) {
    for (var k in v) {
      makeReadonly(v[k]);
    }
    frozen = Object.isFrozen(v);
  } else if (Array.isArray(v)) {
    var vLen = v.length;
    for (var i = 0; i < vLen; i++) {
      makeReadonly(v[i]);
    }
    frozen = Object.isFrozen(v);
  }
  !frozen && Object.freeze(v);
  return v;
}
exports.makeReadonly = makeReadonly;
;
var defaultFormatValue = function defaultFormatValue(_ref) {
  var value = _ref.value;
  return value;
};
exports.stringToDotPath = function () {
  var BRACKET_OPEN = /\.?\[/g;
  var BRACKET_CLOSE = /^\.|\]/g;
  var fn = function fn(path) {
    return path.replace(BRACKET_OPEN, '.').replace(BRACKET_CLOSE, '');
  };
  return fn;
}();
/**
 * Pulls propertyPath values from state and
 * compiles them into a partial state object.
 */
function mapPathsToObject(source, propertyPaths) {
  var transform = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : defaultFormatValue;
  var paths = [];
  var _iterator2 = _createForOfIteratorHelper(propertyPaths),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var path = _step2.value;
      paths.push((0, exports.stringToDotPath)(path));
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  var dest = {};
  var object = dest;
  var _iterator3 = _createForOfIteratorHelper(arrangePropertyPaths(paths)),
    _step3;
  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
      var _path2 = _step3.value;
      var property = (0, exports.getProperty)(source, _path2);
      if (!property.exists) {
        continue;
      }
      for (var tokens = _path2.split('.'), tLen = tokens.length, t = 0; t < tLen; t++) {
        var token = tokens[t];
        if (t + 1 === tLen) {
          object[token] = transform(property);
          object = dest;
          break;
        }
        if (!(token in object)) {
          object[token] = {};
        }
        object = object[token];
      }
    }
  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }
  return dest;
}
exports.mapPathsToObject = mapPathsToObject;