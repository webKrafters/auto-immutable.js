"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CLONEABLE_TAGS = exports.CloneableMap = void 0;
;
;
exports["default"] = verify;
exports.CloneableMap = {
  Arguments: null,
  Array: null,
  ArrayBuffer: null,
  Boolean: null,
  DataView: null,
  Date: null,
  Error: null,
  Function: null,
  Float32Array: null,
  Float64Array: null,
  GeneratorFunction: null,
  Int8Array: null,
  Int16Array: null,
  Int32Array: null,
  Map: null,
  Number: null,
  Object: null,
  Promise: null,
  RegExp: null,
  Set: null,
  String: null,
  Symbol: null,
  Uint8Array: null,
  Uint8ClampedArray: null,
  Uint16Array: null,
  Uint32Array: null,
  WeakMap: null
};
exports.CLONEABLE_TAGS = Object.freeze(exports.CloneableMap);
function verify(value) {
  var typeName = value === null || value === void 0 ? void 0 : value.constructor.name;
  var isEligible;
  if (typeName !== undefined) {
    isEligible = typeName in exports.CLONEABLE_TAGS;
  } else {
    typeName = "".concat(value);
    isEligible = true;
  }
  return {
    isEligible: isEligible,
    typeName: typeName,
    value: value
  };
}