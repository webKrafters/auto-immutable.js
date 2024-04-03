export interface VerifyData<T> {
	isEligible : boolean;
	typeName : string;
	value : T;
};

export type CloneableType = keyof typeof CloneableMap;

type ICloneableTags = {[K in CloneableType]: null};

export interface CloneableTags extends ICloneableTags {};

export default verify;

export const CloneableMap = {
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

export const CLONEABLE_TAGS = Object.freeze( CloneableMap as CloneableTags );

function verify<T>( value : T ) : VerifyData<T> {
	let typeName = value?.constructor.name;
	let isEligible;
	if( typeName !== undefined ) {
		isEligible = typeName in CLONEABLE_TAGS;
	} else {
		typeName = `${ value }`;
		isEligible = true;
	}
	return { isEligible, typeName, value };
}
