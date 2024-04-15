"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
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
var _Atom_connections, _Atom_value;
Object.defineProperty(exports, "__esModule", {
  value: true
});
var utils_1 = require("../../utils");
var isFunction = function () {
  var toString = Function.prototype.toString;
  var is = function is(v) {
    try {
      return toString.call(v);
    } catch (e) {
      return false;
    }
  };
  return is;
}();
/**
 * An atom represents an entry for each individual property\
 * path of the value still in use by client components
 */
var Atom = /*#__PURE__*/function () {
  /** @param {T|Readonly<T>} [value] */
  function Atom() {
    var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
    _classCallCheck(this, Atom);
    /** @type {Set<number>} */
    _Atom_connections.set(this, void 0);
    /** @type {Readonly<T>} */
    _Atom_value.set(this, void 0);
    __classPrivateFieldSet(this, _Atom_connections, new Set(), "f");
    this.setValue(value);
  }
  return _createClass(Atom, [{
    key: "value",
    get: function get() {
      return __classPrivateFieldGet(this, _Atom_value, "f");
    }
    /**
     * @param {number} accessorId
     * @returns {number} Number of connections remaining
     */
  }, {
    key: "connect",
    value: function connect(accessorId) {
      __classPrivateFieldGet(this, _Atom_connections, "f").add(accessorId);
      return __classPrivateFieldGet(this, _Atom_connections, "f").size;
    }
    /**
     * @param {number} accessorId
     * @returns {number} Number of connections remaining
     */
  }, {
    key: "disconnect",
    value: function disconnect(accessorId) {
      __classPrivateFieldGet(this, _Atom_connections, "f")["delete"](accessorId);
      return __classPrivateFieldGet(this, _Atom_connections, "f").size;
    }
    /** @param {number} accessorId */
  }, {
    key: "isConnected",
    value: function isConnected(accessorId) {
      return __classPrivateFieldGet(this, _Atom_connections, "f").has(accessorId);
    }
    /** @param {T|Readonly<T>} newValue */
  }, {
    key: "setValue",
    value: function setValue(newValue) {
      __classPrivateFieldSet(this, _Atom_value, !isFunction(newValue) ? (0, utils_1.makeReadonly)((0, utils_1.clonedeep)(newValue)) : newValue, "f");
    }
  }]);
}();
_Atom_connections = new WeakMap(), _Atom_value = new WeakMap();
exports["default"] = Atom;