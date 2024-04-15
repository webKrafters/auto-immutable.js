"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var __createBinding = void 0 && (void 0).__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
    desc = {
      enumerable: true,
      get: function get() {
        return m[k];
      }
    };
  }
  Object.defineProperty(o, k2, desc);
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __setModuleDefault = void 0 && (void 0).__setModuleDefault || (Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
});
var __importStar = void 0 && (void 0).__importStar || function (mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
};
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
var isequal_1 = __importDefault(require("lodash/isequal"));
var isplainobject_1 = __importDefault(require("lodash/isplainobject"));
var utils_1 = require("../utils");
var tag_functions_1 = __importStar(require("./tag-functions"));
exports["default"] = setValue;
/** Mutates its arguments */
var setAtomic = function () {
  var toStringProto = Object.prototype.toString;
  function getCompositeDesc(value) {
    return Array.isArray(value) ? 'ARRAY' : (0, isplainobject_1["default"])(value) ? 'OBJECT' : undefined;
  }
  function finalizeAtomicSet(value, changes, valueKey) {
    var compositeChangeDesc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : undefined;
    var change = changes[valueKey];
    /* istanbul ignore else */
    if (!compositeChangeDesc) {
      /* istanbul ignore else */
      if (!(0, tag_functions_1.isClosedTag)(change)) {
        value[valueKey] = change;
        return;
      }
    } else if (compositeChangeDesc === 'ARRAY') {
      value[valueKey] = [];
    } else if (compositeChangeDesc === 'OBJECT') {
      if (isIndexBasedObj(change)) {
        value[valueKey] = [];
      } else {
        var newValue = {};
        for (var k in change) {
          var childChange = change[k];
          if (toStringProto.call(childChange) === '[object String]') {
            newValue[k] = childChange;
            continue;
          }
          if (!Object.keys(childChange !== null && childChange !== void 0 ? childChange : {}).length) {
            newValue[k] = childChange;
          } else if (isArrayTaggedPayload(childChange)) {
            newValue[k] = [];
          }
        }
        value[valueKey] = newValue;
      }
    }
    return setAtomic(value, changes, valueKey);
  }
  ;
  function setAtomic(value, changes, valueKey) {
    var stats = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {
      hasChanges: false
    };
    if ((0, isequal_1["default"])(value[valueKey], changes[valueKey])) {
      return;
    }
    var tagsResolved = resolveTags(value, changes, valueKey, stats);
    var compositeChangeDesc = getCompositeDesc(changes[valueKey]);
    if (Array.isArray(value[valueKey])) {
      if (compositeChangeDesc === 'ARRAY') {
        return setArray(value, changes, valueKey, stats);
      }
      if (compositeChangeDesc === 'OBJECT' && isIndexBasedObj(changes[valueKey])) {
        return setArrayIndex(value, changes, valueKey, stats);
      }
    }
    if (compositeChangeDesc === 'OBJECT' && (0, isplainobject_1["default"])(value[valueKey])) {
      return setPlainObject(value, changes, valueKey, stats);
    }
    if (tagsResolved.length || !(valueKey in changes)) {
      return;
    }
    ;
    stats.hasChanges = true;
    finalizeAtomicSet(value, changes, valueKey, compositeChangeDesc);
  }
  ;
  return setAtomic;
}();
function isArrayTaggedPayload(payload) {
  for (var k in payload) {
    if (!(0, tag_functions_1.isArrayOnlyTag)(k)) {
      return false;
    }
  }
  return true;
}
;
function isIndexBasedObj(obj) {
  for (var k in obj) {
    if (!(k in tag_functions_1["default"] || Number.isInteger(+k))) {
      return false;
    }
  }
  return true;
}
/** Mutates its arguments */
function resolveTags(value, changes, valueKey, stats) {
  var resolvedTags = [];
  if ((0, tag_functions_1.isClosedTag)(changes[valueKey])) {
    changes[valueKey] = _defineProperty({}, changes[valueKey], null);
  }
  if (!(0, utils_1.isDataContainer)(changes[valueKey])) {
    return resolvedTags;
  }
  if (!(valueKey in value) && isArrayTaggedPayload(changes[valueKey])) {
    value[valueKey] = [];
  }
  for (var k in changes[valueKey]) {
    if (!(valueKey in changes)) {
      break;
    }
    if ((0, tag_functions_1.isClosedTag)(changes[valueKey][k])) {
      changes[valueKey][k] = _defineProperty({}, changes[valueKey][k], null);
    }
    if (k in tag_functions_1["default"]) {
      var v = value;
      /* istanbul ignore else */
      if (Array.isArray(value)) {
        v = _toConsumableArray(value);
      } else if ((0, isplainobject_1["default"])(value)) {
        v = _objectSpread({}, value);
      }
      tag_functions_1["default"][k](v, valueKey, stats, changes);
      value[valueKey] = v[valueKey];
      resolvedTags.push(k);
    }
  }
  return resolvedTags;
}
function set(value, changes, stats) {
  for (var k in changes) {
    setAtomic(value, changes, k, stats);
  }
}
function setArray(value, changes, rootKey, stats) {
  var nsLength = changes[rootKey].length;
  if (value[rootKey].length !== nsLength) {
    value[rootKey].length = nsLength;
    stats.hasChanges = true;
  }
  for (var i = 0; i < nsLength; i++) {
    setAtomic(value[rootKey], changes[rootKey], i, stats);
  }
}
function setArrayIndex(value, changes, rootKey, stats) {
  var incomingIndexes = [];
  for (var k in changes[rootKey]) {
    var index = +k;
    if (index < 0) {
      index = value[rootKey].length + index;
      changes[rootKey][index] = changes[rootKey][k];
      delete changes[rootKey][k];
    }
    index >= 0 && incomingIndexes.push(index);
  }
  var maxIncomingIndex = Math.max.apply(Math, incomingIndexes);
  /* capture all newly created value array indexes into `changed` list */
  if (maxIncomingIndex >= value[rootKey].length) {
    value[rootKey].length = maxIncomingIndex + 1;
    stats.hasChanges = true;
  }
  for (var _i = 0, _incomingIndexes = incomingIndexes; _i < _incomingIndexes.length; _i++) {
    var i = _incomingIndexes[_i];
    setAtomic(value[rootKey], changes[rootKey], i, stats);
  }
}
function setPlainObject(value, changes, rootKey, stats) {
  set(value[rootKey], changes[rootKey], stats);
}
function setValue(value, changes, onValueChange) {
  var stats = {
    hasChanges: false
  };
  if (!Array.isArray(changes)) {
    set({
      value: value
    }, {
      value: (0, utils_1.clonedeep)(changes)
    }, stats);
  } else {
    var _iterator = _createForOfIteratorHelper(changes),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var _cGroup = _step.value;
        set({
          value: value
        }, {
          value: (0, utils_1.clonedeep)(_cGroup)
        }, stats);
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
  stats.hasChanges && (onValueChange === null || onValueChange === void 0 ? void 0 : onValueChange(changes));
}