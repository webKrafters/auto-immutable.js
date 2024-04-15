"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var __classPrivateFieldSet = void 0 && (void 0).__classPrivateFieldSet || function (receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
};
var __classPrivateFieldGet = void 0 && (void 0).__classPrivateFieldGet || function (receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
var _AccessorCache_instances, _AccessorCache_accessors, _AccessorCache_atoms, _AccessorCache_origin, _AccessorCache_createAccessor, _AccessorCache_getOriginAt;
Object.defineProperty(exports, "__esModule", {
  value: true
});
;
var isempty_1 = __importDefault(require("lodash/isempty"));
var isequal_1 = __importDefault(require("lodash/isequal"));
var constants_1 = require("../../constants");
var utils_1 = require("../../utils");
var atom_1 = __importDefault(require("../atom"));
var accessor_1 = __importDefault(require("../accessor"));
var AccessorCache = /*#__PURE__*/function () {
  /** @param origin - Value object reference from which slices stored in this cache are to be curated */
  function AccessorCache(origin) {
    _classCallCheck(this, AccessorCache);
    _AccessorCache_instances.add(this);
    _AccessorCache_accessors.set(this, void 0);
    _AccessorCache_atoms.set(this, void 0);
    _AccessorCache_origin.set(this, void 0);
    __classPrivateFieldSet(this, _AccessorCache_accessors, {}, "f");
    __classPrivateFieldSet(this, _AccessorCache_atoms, {}, "f");
    // @debug
    // this.#origin = clonedeep( origin );
    __classPrivateFieldSet(this, _AccessorCache_origin, origin, "f");
  }
  return _createClass(AccessorCache, [{
    key: "origin",
    get: function get() {
      return __classPrivateFieldGet(this, _AccessorCache_origin, "f");
    }
    /** atomizes value property changes */
  }, {
    key: "atomize",
    value: function atomize(originChanges) {
      var accessors = __classPrivateFieldGet(this, _AccessorCache_accessors, "f");
      var atoms = __classPrivateFieldGet(this, _AccessorCache_atoms, "f");
      var updatedPaths = [];
      for (var path in atoms) {
        var _classPrivateFieldGe = __classPrivateFieldGet(this, _AccessorCache_instances, "m", _AccessorCache_getOriginAt).call(this, path),
          exists = _classPrivateFieldGe.exists,
          newAtomVal = _classPrivateFieldGe.value;
        if (path !== constants_1.GLOBAL_SELECTOR && exists && (newAtomVal === null || newAtomVal === undefined)) {
          /* istanbul ignore next */
          if (!Array.isArray(originChanges)) {
            if (!(0, utils_1.getProperty)(originChanges, path).trail.length) {
              continue;
            }
          } else {
            var found = false;
            for (var i = originChanges.length; i--;) {
              if ((0, utils_1.getProperty)(originChanges, "".concat(i, ".").concat(path)).trail.length) {
                found = true;
                break;
              }
            }
            if (!found) {
              continue;
            }
          }
        }
        if ((0, isequal_1["default"])(newAtomVal, atoms[path].value)) {
          continue;
        }
        atoms[path].setValue(newAtomVal);
        updatedPaths.push(path);
      }
      if (!updatedPaths.length) {
        return;
      }
      for (var k in accessors) {
        var _accessors$k$outdated;
        (_accessors$k$outdated = accessors[k].outdatedPaths).push.apply(_accessors$k$outdated, updatedPaths);
      }
    }
    /**
     * Gets value object slice from the cache matching the `propertyPaths`.\
     * If not found, creates a new entry for the client from source, and returns it.
     */
  }, {
    key: "get",
    value: function get(clientId) {
      for (var _len = arguments.length, propertyPaths = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        propertyPaths[_key - 1] = arguments[_key];
      }
      if ((0, isempty_1["default"])(propertyPaths)) {
        propertyPaths = [constants_1.GLOBAL_SELECTOR];
      }
      var cacheKey = JSON.stringify(propertyPaths);
      var accessor = cacheKey in __classPrivateFieldGet(this, _AccessorCache_accessors, "f") ? __classPrivateFieldGet(this, _AccessorCache_accessors, "f")[cacheKey] : __classPrivateFieldGet(this, _AccessorCache_instances, "m", _AccessorCache_createAccessor).call(this, cacheKey, propertyPaths);
      !accessor.hasClient(clientId) && accessor.addClient(clientId);
      return accessor.refreshValue(__classPrivateFieldGet(this, _AccessorCache_atoms, "f"));
    }
    /** Unlinks a consumer from the cache: performing synchronized value cleanup */
  }, {
    key: "unlinkClient",
    value: function unlinkClient(clientId) {
      var accessors = __classPrivateFieldGet(this, _AccessorCache_accessors, "f");
      var atoms = __classPrivateFieldGet(this, _AccessorCache_atoms, "f");
      for (var k in accessors) {
        var accessor = accessors[k];
        // istanbul ignore next
        if (!accessor.removeClient(clientId) || accessor.numClients) {
          continue;
        }
        var _iterator = _createForOfIteratorHelper(accessor.paths),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var p = _step.value;
            if (p in atoms && atoms[p].disconnect(accessor.id) < 1) {
              delete atoms[p];
            }
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
        delete accessors[k];
      }
    }
  }]);
}();
_AccessorCache_accessors = new WeakMap(), _AccessorCache_atoms = new WeakMap(), _AccessorCache_origin = new WeakMap(), _AccessorCache_instances = new WeakSet(), _AccessorCache_createAccessor = function _AccessorCache_createAccessor(cacheKey, propertyPaths) {
  var atoms = __classPrivateFieldGet(this, _AccessorCache_atoms, "f");
  var accessor = new accessor_1["default"](propertyPaths);
  __classPrivateFieldGet(this, _AccessorCache_accessors, "f")[cacheKey] = accessor;
  var _iterator2 = _createForOfIteratorHelper(accessor.paths),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var path = _step2.value;
      if (!(path in atoms)) {
        atoms[path] = new atom_1["default"](__classPrivateFieldGet(this, _AccessorCache_instances, "m", _AccessorCache_getOriginAt).call(this, path).value);
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  return __classPrivateFieldGet(this, _AccessorCache_accessors, "f")[cacheKey];
}, _AccessorCache_getOriginAt = function _AccessorCache_getOriginAt(propertyPath) {
  return propertyPath === constants_1.GLOBAL_SELECTOR ? {
    exists: true,
    value: __classPrivateFieldGet(this, _AccessorCache_origin, "f")
  } : (0, utils_1.getProperty)(__classPrivateFieldGet(this, _AccessorCache_origin, "f"), propertyPath);
};
exports["default"] = AccessorCache;