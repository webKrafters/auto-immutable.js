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
var _Accessor_instances, _a, _Accessor_NUM_INSTANCES, _Accessor_clients, _Accessor_id, _Accessor_paths, _Accessor_value, _Accessor_setValueAt;
Object.defineProperty(exports, "__esModule", {
  value: true
});
var MODERATE_NUM_PATHS_THRESHOLD = 8;
var Accessor = /*#__PURE__*/function () {
  function Accessor(accessedPropertyPaths) {
    _classCallCheck(this, Accessor);
    var _b, _c;
    _Accessor_instances.add(this);
    _Accessor_clients.set(this, void 0);
    _Accessor_id.set(this, void 0);
    _Accessor_paths.set(this, void 0);
    _Accessor_value.set(this, void 0);
    __classPrivateFieldSet(this, _Accessor_clients, new Set(), "f");
    __classPrivateFieldSet(this, _Accessor_id, __classPrivateFieldSet(_b = _a, _a, (_c = __classPrivateFieldGet(_b, _a, "f", _Accessor_NUM_INSTANCES), ++_c), "f", _Accessor_NUM_INSTANCES), "f");
    __classPrivateFieldSet(this, _Accessor_paths, Array.from(new Set(accessedPropertyPaths)), "f");
    this.outdatedPaths = __classPrivateFieldGet(this, _Accessor_paths, "f").slice();
    __classPrivateFieldSet(this, _Accessor_value, {}, "f");
  }
  return _createClass(Accessor, [{
    key: "numClients",
    get: function get() {
      return __classPrivateFieldGet(this, _Accessor_clients, "f").size;
    }
  }, {
    key: "id",
    get: function get() {
      return __classPrivateFieldGet(this, _Accessor_id, "f");
    }
  }, {
    key: "paths",
    get: function get() {
      return __classPrivateFieldGet(this, _Accessor_paths, "f");
    }
  }, {
    key: "value",
    get: function get() {
      return __classPrivateFieldGet(this, _Accessor_value, "f");
    }
  }, {
    key: "addClient",
    value: function addClient(clientId) {
      __classPrivateFieldGet(this, _Accessor_clients, "f").add(clientId);
    }
  }, {
    key: "hasClient",
    value: function hasClient(clientId) {
      return __classPrivateFieldGet(this, _Accessor_clients, "f").has(clientId);
    }
  }, {
    key: "removeClient",
    value: function removeClient(clientId) {
      return __classPrivateFieldGet(this, _Accessor_clients, "f")["delete"](clientId);
    }
    /** @param atoms - Curated slices of value object currently requested */
  }, {
    key: "refreshValue",
    value: function refreshValue(atoms) {
      // istanbul ignore next
      if (!this.outdatedPaths.length) {
        return __classPrivateFieldGet(this, _Accessor_value, "f");
      }
      var refreshLen;
      var refreshPaths = {};
      BUILD_REFRESH_OBJ: {
        var pathSet = new Set(this.outdatedPaths);
        this.outdatedPaths = [];
        refreshLen = pathSet.size;
        var _iterator = _createForOfIteratorHelper(pathSet),
          _step;
        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var p = _step.value;
            refreshPaths[p] = true;
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
      if (refreshLen >= __classPrivateFieldGet(this, _Accessor_paths, "f").length) {
        var _iterator2 = _createForOfIteratorHelper(__classPrivateFieldGet(this, _Accessor_paths, "f")),
          _step2;
        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var _p = _step2.value;
            _p in refreshPaths && __classPrivateFieldGet(this, _Accessor_instances, "m", _Accessor_setValueAt).call(this, _p, atoms[_p]);
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
        return __classPrivateFieldGet(this, _Accessor_value, "f");
      }
      if (__classPrivateFieldGet(this, _Accessor_paths, "f").length > MODERATE_NUM_PATHS_THRESHOLD) {
        var pathsObj = {};
        var _iterator3 = _createForOfIteratorHelper(__classPrivateFieldGet(this, _Accessor_paths, "f")),
          _step3;
        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var _p3 = _step3.value;
            pathsObj[_p3] = true;
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
        for (var _p2 in refreshPaths) {
          _p2 in pathsObj && __classPrivateFieldGet(this, _Accessor_instances, "m", _Accessor_setValueAt).call(this, _p2, atoms[_p2]);
        }
        return __classPrivateFieldGet(this, _Accessor_value, "f");
      }
      // istanbul ignore next
      for (var _p4 in refreshPaths) {
        // istanbul ignore next
        __classPrivateFieldGet(this, _Accessor_paths, "f").includes(_p4) && __classPrivateFieldGet(this, _Accessor_instances, "m", _Accessor_setValueAt).call(this, _p4, atoms[_p4]);
      }
      // istanbul ignore next
      return __classPrivateFieldGet(this, _Accessor_value, "f");
    }
  }]);
}();
_a = Accessor, _Accessor_clients = new WeakMap(), _Accessor_id = new WeakMap(), _Accessor_paths = new WeakMap(), _Accessor_value = new WeakMap(), _Accessor_instances = new WeakSet(), _Accessor_setValueAt = function _Accessor_setValueAt(propertyPath, atom) {
  if (!atom) {
    return;
  }
  !atom.isConnected(__classPrivateFieldGet(this, _Accessor_id, "f")) && atom.connect(__classPrivateFieldGet(this, _Accessor_id, "f"));
  __classPrivateFieldGet(this, _Accessor_value, "f")[propertyPath] = atom.value;
};
_Accessor_NUM_INSTANCES = {
  value: 0
};
exports["default"] = Accessor;