"use strict";

var __importDefault = void 0 && (void 0).__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isReadonly = void 0;
var isplainobject_1 = __importDefault(require("lodash/isplainobject"));
var isReadonly = function isReadonly(v) {
  var isReadonly = true;
  var verify = function verify(value) {
    if ((0, isplainobject_1["default"])(value)) {
      if (!Object.isFrozen(value)) {
        isReadonly = false;
      } else {
        for (var k in value) {
          verify(value[k]);
        }
      }
    } else if (Array.isArray(value)) {
      if (!Object.isFrozen(value)) {
        isReadonly = false;
      } else {
        for (var i = 0, len = value.length; i < len; i++) {
          verify(value[i]);
        }
      }
    } else if (!Object.isFrozen(value)) {
      isReadonly = false;
    }
  };
  verify(v);
  return isReadonly;
};
exports.isReadonly = isReadonly;