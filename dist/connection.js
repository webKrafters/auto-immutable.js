"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
var __runInitializers = void 0 && (void 0).__runInitializers || function (thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
    value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};
var __esDecorate = void 0 && (void 0).__esDecorate || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) {
    if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
    return f;
  }
  var kind = contextIn.kind,
    key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _,
    done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
    var context = {};
    for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
    for (var p in contextIn.access) context.access[p] = contextIn.access[p];
    context.addInitializer = function (f) {
      if (done) throw new TypeError("Cannot add initializers after decoration has completed");
      extraInitializers.push(accept(f || null));
    };
    var result = (0, decorators[i])(kind === "accessor" ? {
      get: descriptor.get,
      set: descriptor.set
    } : descriptor[key], context);
    if (kind === "accessor") {
      if (result === void 0) continue;
      if (result === null || _typeof(result) !== "object") throw new TypeError("Object expected");
      if (_ = accept(result.get)) descriptor.get = _;
      if (_ = accept(result.set)) descriptor.set = _;
      if (_ = accept(result.init)) initializers.unshift(_);
    } else if (_ = accept(result)) {
      if (kind === "field") initializers.unshift(_);else descriptor[key] = _;
    }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};
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
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Connection = exports.deps = void 0;
var set_1 = __importDefault(require("./set"));
exports.deps = {
  noop: function noop() {},
  setValue: set_1["default"]
};
var Connection = function () {
  var _a, _Connection_cache, _Connection_disconnected, _Connection_id;
  var _instanceExtraInitializers = [];
  var _disconnect_decorators;
  var _get_decorators;
  var _set_decorators;
  return _a = /*#__PURE__*/function () {
    function Connection(id, cache) {
      _classCallCheck(this, Connection);
      _Connection_cache.set(this, __runInitializers(this, _instanceExtraInitializers));
      _Connection_disconnected.set(this, false);
      _Connection_id.set(this, void 0);
      __classPrivateFieldSet(this, _Connection_id, id, "f");
      __classPrivateFieldSet(this, _Connection_cache, cache, "f");
    }
    return _createClass(Connection, [{
      key: "disconnected",
      get: function get() {
        return __classPrivateFieldGet(this, _Connection_disconnected, "f");
      }
    }, {
      key: "instanceId",
      get: function get() {
        return __classPrivateFieldGet(this, _Connection_id, "f");
      }
    }, {
      key: "disconnect",
      value: function disconnect() {
        __classPrivateFieldGet(this, _Connection_cache, "f").unlinkClient(__classPrivateFieldGet(this, _Connection_id, "f"));
        __classPrivateFieldSet(this, _Connection_cache, undefined, "f");
        __classPrivateFieldSet(this, _Connection_disconnected, true, "f");
      }
    }, {
      key: "get",
      value: function get() {
        var _classPrivateFieldGe;
        for (var _len = arguments.length, propertyPaths = new Array(_len), _key = 0; _key < _len; _key++) {
          propertyPaths[_key] = arguments[_key];
        }
        return (_classPrivateFieldGe = __classPrivateFieldGet(this, _Connection_cache, "f")).get.apply(_classPrivateFieldGe, [__classPrivateFieldGet(this, _Connection_id, "f")].concat(propertyPaths));
      }
    }, {
      key: "set",
      value: function set(changes) {
        var _this = this;
        var onComplete = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : exports.deps.noop;
        exports.deps.setValue(__classPrivateFieldGet(this, _Connection_cache, "f").origin, changes, function (changes) {
          __classPrivateFieldGet(_this, _Connection_cache, "f").atomize(changes);
          onComplete(changes);
        });
      }
    }]);
  }(), _Connection_cache = new WeakMap(), _Connection_disconnected = new WeakMap(), _Connection_id = new WeakMap(), function () {
    var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
    _disconnect_decorators = [invoke];
    _get_decorators = [invoke];
    _set_decorators = [invoke];
    __esDecorate(_a, null, _disconnect_decorators, {
      kind: "method",
      name: "disconnect",
      "static": false,
      "private": false,
      access: {
        has: function has(obj) {
          return "disconnect" in obj;
        },
        get: function get(obj) {
          return obj.disconnect;
        }
      },
      metadata: _metadata
    }, null, _instanceExtraInitializers);
    __esDecorate(_a, null, _get_decorators, {
      kind: "method",
      name: "get",
      "static": false,
      "private": false,
      access: {
        has: function has(obj) {
          return "get" in obj;
        },
        get: function get(obj) {
          return obj.get;
        }
      },
      metadata: _metadata
    }, null, _instanceExtraInitializers);
    __esDecorate(_a, null, _set_decorators, {
      kind: "method",
      name: "set",
      "static": false,
      "private": false,
      access: {
        has: function has(obj) {
          return "set" in obj;
        },
        get: function get(obj) {
          return obj.set;
        }
      },
      metadata: _metadata
    }, null, _instanceExtraInitializers);
    if (_metadata) Object.defineProperty(_a, Symbol.metadata, {
      enumerable: true,
      configurable: true,
      writable: true,
      value: _metadata
    });
  }(), _a;
}();
exports.Connection = Connection;
function invoke(method, context) {
  return function () {
    if (this.disconnected) {
      return;
    }
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }
    return method.apply(this, args);
  };
}