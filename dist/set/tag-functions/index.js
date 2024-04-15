"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest(); }
function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }
function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }
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
exports.isClosedTag = exports.isArrayOnlyTag = exports.$splice = exports.$set = exports.$replace = exports.$push = exports.$move = exports.$delete = exports.$clear = void 0;
var isempty_1 = __importDefault(require("lodash/isempty"));
var isequal_1 = __importDefault(require("lodash/isequal"));
var isplainobject_1 = __importDefault(require("lodash/isplainobject"));
var constants_1 = require("../../constants");
var index_1 = require("../../utils/index");
/**
 * Sets a value slice to its empty value equivalent
 * Compatible with value slices of all types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $clear(value, 'name', {hasChanges: false}, {name: {'@@CLEAR': *}, ...}) // sets `value.name` = ''
 * $clear(value, 'nested', {hasChanges: false}, {nested: {'@@CLEAR': *},...}) // sets `value.nested` = {}
 * $clear(value.nested, 'name', {hasChanges: false}, {name: {'@@CLEAR': *}, ...}) // sets `value.nested.name` = ''
 * $clear(value.nested, 'items', {hasChanges: false}, {items: {'@@CLEAR': *}, ...}) // sets `value.nested.items` = []
 * $clear(value.nested, 'items', {hasChanges: false}, {items: ['a', {'@@CLEAR': *}, 'c', 'd', 'e', 'f'], ...}) // sets `value.nested.items[2]` = ''
 * $clear(value.nested, 'fn', {hasChanges: false}, {fn: {'@@CLEAR': *}, ...}) // sets `value.nested.fn` = null
 * $clear(value.nested.items, 4, {hasChanges: false}, {4: {'@@CLEAR': *}, ...}) // sets `value.nested.items[4]` = ''
 */
exports.$clear = function () {
  var defaultPredicate = function defaultPredicate() {
    return true;
  };
  var hasItems = function hasItems(value, valueKey) {
    return value[valueKey].length;
  };
  var setDefault = function setDefault(value, valueKey, stats, changes) {
    var predicate = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : defaultPredicate;
    var _value = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
    if (predicate(value, valueKey, stats)) {
      value[valueKey] = _value;
      stats.hasChanges = true;
    }
    finishTagRequest(changes, valueKey, constants_1.CLEAR_TAG);
  };
  var clear = function clear(value, valueKey, stats, changes) {
    if (!(valueKey in value)) {
      return finishTagRequest(changes, valueKey, constants_1.CLEAR_TAG);
    }
    var _value = value[valueKey];
    if (typeof _value === 'undefined' || _value === null) {
      return finishTagRequest(changes, valueKey, constants_1.CLEAR_TAG);
    }
    if ((0, isplainobject_1["default"])(_value)) {
      var hasChanges = false;
      for (var k in _value) {
        // remove properties singularly b/c where value === the setValue `value` argument, we may not change its reference
        delete value[valueKey][k];
        hasChanges = true;
      }
      stats.hasChanges = stats.hasChanges || hasChanges;
      return finishTagRequest(changes, valueKey, constants_1.CLEAR_TAG);
    }
    var type = _value.constructor.name;
    if (type === 'String') {
      return setDefault(value, valueKey, stats, changes, hasItems, '');
    }
    if (type === 'Array') {
      return setDefault(value, valueKey, stats, changes, hasItems, []);
    }
    setDefault(value, valueKey, stats, changes);
  };
  return clear;
}();
/**
 * Removes items from value slices.
 * Compatible with value slices of the Array and POJO property types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $delete(value, 'value', {hasChanges: false}, {value: {'@@DELETE': ['name', 'nested'], ...}, ...}) // removes the `name` and `nested` properties from `value`
 * $delete(value, 'nested', {hasChanges: false}, {nested: {'@@DELETE': ['fn', 'items', 'name'], ...}, ...}) // removes the 'fn', 'items' and 'name' properties from `value.nested`
 * $delete(value.nestetd, 'items', {hasChanges: false}, {items: {'@@DELETE': [0, 3], ...}, ...}) // removes indexes 0 and 3 `value.nested.items`
 */
var $delete = function $delete(value, valueKey, stats, changes) {
  var _value$valueKey;
  var deleteKeys = changes[valueKey][constants_1.DELETE_TAG];
  if (!Array.isArray(deleteKeys)) {
    throw new TypeError("Invalid entry found at ".concat(constants_1.DELETE_TAG, " change property: requires an array of value keys to delete."));
  }
  var finish = function finish() {
    return finishTagRequest(changes, valueKey, constants_1.DELETE_TAG);
  };
  var currValue;
  try {
    if (!deleteKeys.length) {
      throw new Error('Delete called with no identified items to delete.');
    }
    ;
    currValue = value[valueKey];
    if ((0, isempty_1["default"])(currValue)) {
      throw new Error('Delete called on empty value.');
    }
  } catch (e) {
    return finish();
  }
  deleteKeys = Array.from(new Set(deleteKeys));
  var hasChanges = false;
  if (!Array.isArray(currValue)) {
    var _iterator = _createForOfIteratorHelper(deleteKeys),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var k = _step.value;
        if (!(0, index_1.getProperty)(currValue, k).exists) {
          continue;
        }
        delete value[valueKey][k];
        hasChanges = true;
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    stats.hasChanges = stats.hasChanges || hasChanges;
    return finish();
  }
  var currLen = currValue.length;
  var deleteMap = {};
  var _iterator2 = _createForOfIteratorHelper(deleteKeys),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var key = _step2.value;
      var index = +key;
      if (index > currLen) {
        continue;
      }
      if (index < 0) {
        index = currLen + index;
        if (index < 0) {
          continue;
        }
      }
      deleteMap[index] = null;
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  var newValue = [];
  var numVisited = 0;
  for (var numDeleted = numVisited, deleteLen = deleteKeys.length; numVisited < currLen; numVisited++) {
    if (!(numVisited in deleteMap)) {
      newValue.push(currValue[numVisited]);
      continue;
    }
    if (++numDeleted === deleteLen) {
      numVisited++;
      break;
    }
  }
  if (numVisited < currLen) {
    newValue.push.apply(newValue, _toConsumableArray(currValue.slice(numVisited)));
  }
  if (currLen === newValue.length) {
    return finish();
  }
  value[valueKey].length = 0;
  (_value$valueKey = value[valueKey]).push.apply(_value$valueKey, newValue);
  stats.hasChanges = true;
  finish();
};
exports.$delete = $delete;
/**
 * Repositions a group contiguous value slice array items.
 * Compatible with value slices of the Array type.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $move(value.nested, 'items', {hasChanges: false}, {items: {'@@MOVE': [0, 3, 2], ...}, ...}) // moves `value.nested.items` 'a' and 'b' from indexes 0 and 1 to indexes 3 and 4.
 */
var $move = function $move(value, valueKey, stats, changes) {
  var _value$valueKey2;
  var args = changes[valueKey][constants_1.MOVE_TAG];
  if (!Array.isArray(args) || args.length < 2 || !Number.isInteger(args[0]) || !Number.isInteger(args[1])) {
    throw new TypeError("Invalid entry found at ".concat(constants_1.MOVE_TAG, " change property: expecting an array of at least 2 integer values [fromIndex, toIndex, numItems]. numItems is optional. Use negative index to count from array end."));
  }
  var finish = function finish() {
    return finishTagRequest(changes, valueKey, constants_1.MOVE_TAG);
  };
  var _value = value[valueKey];
  if (!Array.isArray(_value)) {
    return finish();
  }
  var sLen = _value.length;
  if (!sLen) {
    return finish();
  }
  var _args = _slicedToArray(args, 3),
    from = _args[0],
    to = _args[1],
    _args$ = _args[2],
    numItems = _args$ === void 0 ? 1 : _args$;
  if (!Number.isInteger(numItems) || numItems < 1) {
    return finish();
  }
  if (from < 0) {
    from = sLen + from;
  }
  if (from < 0 || from >= sLen) {
    return finish();
  }
  if (to < 0) {
    to = sLen + to;
  }
  if (to < 0 || to >= sLen) {
    return finish();
  }
  if (from === to) {
    return finish();
  }
  var maxTransferLen = sLen - from;
  if (numItems > maxTransferLen) {
    numItems = maxTransferLen;
  }
  (_value$valueKey2 = value[valueKey]).splice.apply(_value$valueKey2, [to, 0].concat(_toConsumableArray(_value.splice(from, numItems))));
  stats.hasChanges = true;
  finish();
};
exports.$move = $move;
/**
 * Appends new items to value slice array.
 * Compatible with value slices of the Array type.
 * Analogy: Array.prototype.push
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $push(value.nested, 'items', {hasChanges: false}, {items: {'@@PUSH': ['x', 'y', 'z'], ...}, ...}) // sequentially appends 'x', 'y' and 'z' to `value.nested.items`.
 */
var $push = function $push(value, valueKey, stats, changes) {
  var _value$valueKey3;
  var args = changes[valueKey][constants_1.PUSH_TAG];
  if (!Array.isArray(args)) {
    throw new TypeError("Invalid entry found at ".concat(constants_1.PUSH_TAG, " change property: expecting an array of [].pudh(...) compliant argument values."));
  }
  if (!args.length || !Array.isArray(value[valueKey])) {
    return finishTagRequest(changes, valueKey, constants_1.PUSH_TAG);
  }
  (_value$valueKey3 = value[valueKey]).push.apply(_value$valueKey3, _toConsumableArray(args));
  stats.hasChanges = true;
  finishTagRequest(changes, valueKey, constants_1.PUSH_TAG);
};
exports.$push = $push;
/**
 * Replaces a value slice with a new value or the return value of a compute function.
 * Compatible with value slices of all types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $replace(value, 'name', {hasChanges: false}, {name: {'@@REPLACE': new value, ...}, ...}) // sets `value.name` = new value
 * $replace(value, 'nested', {hasChanges: false}, {nested: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested` = new value
 * $replace(value.nested, 'name', {hasChanges: false}, {name: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.name` = new value
 * $replace(value.nested, 'items', {hasChanges: false}, {items: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.items` = new value
 * $replace(value.nested, 'items', {hasChanges: false}, {items: ['a', {'@@REPLACE': new value, ...}, 'c', 'd', 'e', 'f'], ...}) // sets `value.nested.items[2]` = new value
 * $replace(value.nested, 'fn', {hasChanges: false}, {fn: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.fn` = new value
 * $replace(value.nested.items, 4, {hasChanges: false}, {4: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.items[4]` = new value
 */
var $replace = function $replace(value, valueKey, stats, changes) {
  applyReplaceCommand(constants_1.REPLACE_TAG, value, changes, valueKey, stats);
};
exports.$replace = $replace;
/**
 * Replaces a value slice with a new value or the return value of a compute function.
 * Compatible with value slices of all types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $set(value, 'name', {hasChanges: false}, {name: {'@@SET': new value OR currentName => new value, ...}, ...}) // sets `value.name` = new value
 * $set(value, 'nested', {hasChanges: false}, {nested: {'@@SET': new value OR currentNested => new value, ...}, ...}) // sets `value.nested` = new value
 * $set(value.nested, 'name', {hasChanges: false}, {name: {'@@SET': new value OR currentName => new value, ...}, ...}) // sets `value.nested.name` = new value
 * $set(value.nested, 'items', {hasChanges: false}, {items: {'@@SET': new value OR currentItems => new value, ...}, ...}) // sets `value.nested.items` = new value
 * $set(value.nested, 'items', {hasChanges: false}, {items: ['a', {'@@SET': new value OR current2nd => new value, ...}, 'c', 'd', 'e', 'f'], ...}) // sets `value.nested.items[2]` = new value
 * $set(value.nested, 'fn', {hasChanges: false}, {fn: {'@@SET': new value OR currentFn => new value, ...}, ...}) // sets `value.nested.fn` = new value
 * $set(value.nested.items, 4, {hasChanges: false}, {4: {'@@SET': new value OR current4th => new value, ...}, ...}) // sets `value.nested.items[4]` = new value
 */
exports.$set = function () {
  var toString = Object.prototype.toString;
  var set = function set(value, valueKey, stats, changes) {
    var _changes = changes;
    if (toString.call(_changes[valueKey][constants_1.SET_TAG]) === '[object Function]') {
      _changes[valueKey][constants_1.SET_TAG] = (0, index_1.clonedeep)(_changes[valueKey][constants_1.SET_TAG]((0, index_1.clonedeep)(value[valueKey])));
    }
    applyReplaceCommand(constants_1.SET_TAG, value, _changes, valueKey, stats);
  };
  return set;
}();
/**
 * Perform array splice function on a value slice array.
 * Compatible with value slices of the Array type.
 * Analogy: Array.prototype.splice
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $splice(value.nested, 'items', {hasChanges: false}, {items: {'@@SPLICE': [3, 3, 'y', 'z'], ...}, ...}) // replaces 'd', 'e' and 'f' with 'y' and 'z' in `value.nested.items`.
 */
var $splice = function $splice(value, valueKey, stats, changes) {
  var args = changes[valueKey][constants_1.SPLICE_TAG];
  if (!Array.isArray(args) || args.length < 2 || !Number.isInteger(args[0]) || !Number.isInteger(args[1])) {
    throw new TypeError("Invalid entry found at ".concat(constants_1.SPLICE_TAG, " change property: expecting an array of [].splice(...) compliant argument values."));
  }
  var _args2 = _toArray(args),
    start = _args2[0],
    deleteCount = _args2[1],
    items = _args2.slice(2);
  var iLen = items.length;
  var _value = value[valueKey];
  if (!Array.isArray(_value) || deleteCount < 1 && !iLen) {
    return finishTagRequest(changes, valueKey, constants_1.SPLICE_TAG);
  }
  if (deleteCount > 0) {
    var sLen = _value.length;
    start = start < 0 ? Math.abs(start) > sLen ? 0 : sLen + start : start > sLen ? sLen : start;
    var maxCount = sLen - start;
    if (maxCount > iLen) {
      maxCount = iLen;
    }
    if (maxCount > deleteCount) {
      maxCount = deleteCount;
    }
    var numLeftTrimmed = 0;
    for (; numLeftTrimmed < maxCount; numLeftTrimmed++) {
      if (!(0, isequal_1["default"])(_value[start + numLeftTrimmed], items[numLeftTrimmed])) {
        break;
      }
    }
    start += numLeftTrimmed;
    items.splice(0, numLeftTrimmed);
    iLen = items.length;
    deleteCount -= numLeftTrimmed;
  }
  if (deleteCount > 0 || iLen) {
    var _value$valueKey4;
    (_value$valueKey4 = value[valueKey]).splice.apply(_value$valueKey4, [start, deleteCount].concat(_toConsumableArray(items)));
    stats.hasChanges = true;
  }
  finishTagRequest(changes, valueKey, constants_1.SPLICE_TAG);
};
exports.$splice = $splice;
var tagMap = _defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty(_defineProperty({}, constants_1.CLEAR_TAG, exports.$clear), constants_1.DELETE_TAG, exports.$delete), constants_1.MOVE_TAG, exports.$move), constants_1.PUSH_TAG, exports.$push), constants_1.REPLACE_TAG, exports.$replace), constants_1.SET_TAG, exports.$set), constants_1.SPLICE_TAG, exports.$splice);
exports["default"] = tagMap;
function containsTag(tagsMap, tag) {
  return tag in tagsMap && !Array.isArray(tag);
}
/**
 * Confirms tags whose tagResolver only operates on array values.\
 *
 * @example
 * // given the following value:
 * const value = {test: some value, testArr: [some value 1, ...], testObj: {testKey: some value, ...}, ...}
 * // we can call setValue with array only tags as follows
 * setValue(value, {testArr: {"@@PUSH": [1, 2, 3, ...], ...}, ...});
 */
exports.isArrayOnlyTag = function () {
  var ARRAY_TAGS = _defineProperty(_defineProperty(_defineProperty({}, constants_1.MOVE_TAG, null), constants_1.PUSH_TAG, null), constants_1.SPLICE_TAG, null);
  function fn(tag) {
    return containsTag(ARRAY_TAGS, tag);
  }
  return fn;
}();
/**
 * Confirms tags whose tagResolver accepts no inputs.\
 * Such tags are normally supplied as string values.\
 * When supplied as an object property, the key is extracted: value is discarded.
 *
 * @example
 * // given the following value:
 * const value = {test: some value, testArr: [some value 1, ...], testObj: {testKey: some value, ...}, ...}
 * // we can call setValue with closed tags
 * // either as string values:
 * setValue(value, {test: "@@CLEAR", testArr: ["@@CLEAR", ...], testObj: {testKey: "@@CLEAR", ...}, ...});
 * // or as object properties:
 * setValue(value, {test: {@@CLEAR: some value}, testArr: [{@@CLEAR: some value}, ...], testObj: {testKey: {@@CLEAR: some value}, ...}, ...});
 */
exports.isClosedTag = function () {
  var NO_PARAM_TAGS = _defineProperty({}, constants_1.CLEAR_TAG, null);
  function fn(tag) {
    return containsTag(NO_PARAM_TAGS, tag);
  }
  return fn;
}();
function applyReplaceCommand(tag, value, changes, valueKey, stats) {
  var replacement = changes[valueKey][tag];
  if (!((0, index_1.isDataContainer)(value[valueKey]) && (0, index_1.isDataContainer)(replacement))) {
    if (value[valueKey] !== replacement) {
      value[valueKey] = replacement;
      stats.hasChanges = true;
    }
    return finishTagRequest(changes, valueKey, tag);
  }
  if ((0, isequal_1["default"])(value[valueKey], replacement)) {
    return finishTagRequest(changes, valueKey, tag);
  }
  if (Array.isArray(replacement) && Array.isArray(value[valueKey]) && value[valueKey].length !== replacement.length) {
    value[valueKey] = _toConsumableArray(value[valueKey]);
    value[valueKey].length = replacement.length;
  }
  for (var k in value[valueKey]) {
    if (k in replacement) {
      value[valueKey][k] = replacement[k];
    } else {
      delete value[valueKey][k];
    }
  }
  for (var _k in replacement) {
    value[valueKey][_k] = replacement[_k];
  }
  stats.hasChanges = true;
  finishTagRequest(changes, valueKey, tag);
}
var finishTagRequest = function () {
  var end = function end(changes, key) {
    delete changes[key];
  };
  function runCloser(changes, key, tag) {
    if ((0, exports.isClosedTag)(tag)) {
      return end(changes, key);
    }
    var keyCount = 0;
    for (var k in changes[key]) {
      // eslint-disable-line no-unused-vars
      if (++keyCount === 2) {
        return end(changes[key], tag);
      }
    }
    keyCount = 0;
    for (var _k2 in changes) {
      // eslint-disable-line no-unused-vars
      if (++keyCount === 2) {
        return end(changes[key], tag);
      }
    }
    end(changes, key);
  }
  ;
  return runCloser;
}();