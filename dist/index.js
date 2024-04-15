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
var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
var _Immutable_cache, _Immutable_numConnectionsCreated;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Immutable = exports.deps = void 0;
var accessor_cache_1 = __importDefault(require("./model/accessor-cache"));
var connection_1 = require("./connection");
exports.deps = {
  numCreated: 0
};
var Immutable = /*#__PURE__*/function () {
  function Immutable(initValue) {
    _classCallCheck(this, Immutable);
    _Immutable_cache.set(this, void 0);
    _Immutable_numConnectionsCreated.set(this, 0);
    __classPrivateFieldSet(this, _Immutable_cache, new accessor_cache_1["default"](initValue), "f");
    exports.deps.numCreated++;
  }
  return _createClass(Immutable, [{
    key: "connect",
    value: function connect() {
      var _a;
      return new connection_1.Connection("".concat(exports.deps.numCreated, ":").concat(__classPrivateFieldSet(this, _Immutable_numConnectionsCreated, (_a = __classPrivateFieldGet(this, _Immutable_numConnectionsCreated, "f"), ++_a), "f")), __classPrivateFieldGet(this, _Immutable_cache, "f"));
    }
  }]);
}();
exports.Immutable = Immutable;
_Immutable_cache = new WeakMap(), _Immutable_numConnectionsCreated = new WeakMap();