export interface VerifyData<T> {
    isEligible: boolean;
    typeName: string;
    value: T;
}
export type CloneableType = keyof typeof CloneableMap;
type ICloneableTags = {
    [K in CloneableType]: null;
};
export interface CloneableTags extends ICloneableTags {
}
export default verify;
export declare const CloneableMap: {
    Arguments: any;
    Array: any;
    ArrayBuffer: any;
    Boolean: any;
    DataView: any;
    Date: any;
    Error: any;
    Function: any;
    Float32Array: any;
    Float64Array: any;
    GeneratorFunction: any;
    Int8Array: any;
    Int16Array: any;
    Int32Array: any;
    Map: any;
    Number: any;
    Object: any;
    Promise: any;
    RegExp: any;
    Set: any;
    String: any;
    Symbol: any;
    Uint8Array: any;
    Uint8ClampedArray: any;
    Uint16Array: any;
    Uint32Array: any;
    WeakMap: any;
};
export declare const CLONEABLE_TAGS: Readonly<CloneableTags>;
declare function verify<T>(value: T): VerifyData<T>;
