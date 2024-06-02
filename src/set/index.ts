import type {
	Changes,
	Listener,
	KeyType,
	TagType,
	UpdateStats as Stats,
	Value
} from '..';

import isEqual from 'lodash.isequal';
import isPlainObject from 'lodash.isplainobject';

import clonedeep from '@webkrafters/clone-total';

import { isDataContainer } from '../utils';

import tagFunctions, {
	isArrayOnlyTag,
	isClosedTag
} from './tag-functions';

export default setValue;

/** Mutates its arguments */
const setAtomic = (() => {
	const toStringProto = Object.prototype.toString;
	function getCompositeDesc( value : Array<any> ) : 'ARRAY';
	function getCompositeDesc( value : Value ) : 'OBJECT';
	function getCompositeDesc( value ) : any {
		return Array.isArray( value )
			? 'ARRAY'
			: isPlainObject( value )
			? 'OBJECT'
			: undefined;
	}
	function finalizeAtomicSet( value : Value, changes : Value, valueKey : KeyType, compositeChangeDesc? : 'OBJECT' ) : void;
	function finalizeAtomicSet( value : Value, changes : Value, valueKey : TagType, compositeChangeDesc? : 'OBJECT' ) : void;
	function finalizeAtomicSet( value : Array<any>, changes : Value, valueKey : number, compositeChangeDesc? : 'ARRAY' ) : void;
	function finalizeAtomicSet( value : Array<any>, changes : Value, valueKey : string /* numeric */, compositeChangeDesc? : 'ARRAY' ) : void;
	function finalizeAtomicSet( value, changes, valueKey, compositeChangeDesc = undefined ) : void {
		const change = changes[ valueKey ];
		/* istanbul ignore else */
		if( !compositeChangeDesc ) {
			/* istanbul ignore else */
			if( !isClosedTag( change ) ) {
				value[ valueKey ] = change;
				return;
			}
		} else if( compositeChangeDesc === 'ARRAY' ) {
			value[ valueKey ] = [];
		} else if( compositeChangeDesc === 'OBJECT' ) {
			if( isIndexBasedObj( change ) ) {
				value[ valueKey ] = [];
			} else {
				const newValue = {};
				for( const k in change ) {
					const childChange = change[ k ];
					if( toStringProto.call( childChange ) === '[object String]' ) {
						newValue[ k ] = childChange;
						continue;
					}
					if( !( Object.keys( childChange ?? {} ).length ) ) {
						newValue[ k ] = childChange;
					} else if( isArrayTaggedPayload( childChange ) ) {
						newValue[ k ] = [];
					}
				}
				value[ valueKey ] = newValue;
			}
		}
		return setAtomic( value, changes, valueKey );
	};
	function setAtomic( value : Value, changes : Value, valueKey : KeyType, stats? : Stats ) : void;
	function setAtomic( value : Value, changes : Value, valueKey : TagType, stats? : Stats ) : void;
	function setAtomic( value : Array<any>, changes : Value, valueKey : number, stats? : Stats ) : void;
	function setAtomic( value : Array<any>, changes : Value, valueKey : string /* numeric */, stats? : Stats ) : void;
	function setAtomic( value, changes, valueKey, stats = { hasChanges: false } ) : void {
		if( isEqual( value[ valueKey ], changes[ valueKey ] ) ) { return }
		const tagsResolved = resolveTags( value, changes, valueKey, stats );
		const compositeChangeDesc = getCompositeDesc( changes[ valueKey ] );
		if( Array.isArray( value[ valueKey ] ) ) {
			if( compositeChangeDesc === 'ARRAY' ) {
				return setArray( value, changes, valueKey, stats );
			}
			if( compositeChangeDesc === 'OBJECT' && isIndexBasedObj( changes[ valueKey ] ) ) {
				return setArrayIndex( value, changes, valueKey, stats );
			}
		}
		if( ( compositeChangeDesc as string ) === 'OBJECT' && isPlainObject( value[ valueKey ] ) ) {
			return setPlainObject( value, changes, valueKey, stats )
		}
		if( tagsResolved.length || !( valueKey in changes ) ) { return };
		stats.hasChanges = true;
		finalizeAtomicSet( value, changes, valueKey, compositeChangeDesc );
	};
	return setAtomic;
})();

function isArrayTaggedPayload( payload : {} ) : boolean {
	for( const k in payload ) {
		if( !isArrayOnlyTag( k ) ) { return false }
	}
	return true;
};

function isIndexBasedObj( obj : {} ) : boolean {
	for( const k in obj ) {
		if( !( k in tagFunctions || Number.isInteger( +k ) ) ) {
			return false;
		}
	}
	return true;
}

/** Mutates its arguments */
function resolveTags(
	value : Value,
	changes : Changes<Value>,
	valueKey : KeyType,
	stats : Stats
) : Array<TagType> {
	const resolvedTags : Array<TagType> = [];
	if( isClosedTag( changes[ valueKey ] ) ) {
		changes[ valueKey ] = { [ changes[ valueKey ] ]: null };
	}
	if( !isDataContainer( changes[ valueKey ] ) ) { return resolvedTags }
	if( !( valueKey in value ) && isArrayTaggedPayload( changes[ valueKey ] ) ) {
		value[ valueKey ] = [];
	}
	for( const k in changes[ valueKey ] ) {
		if( !( valueKey in ( changes as object ) ) ) { break }
		if( isClosedTag( changes[ valueKey ][ k ] ) ) {
			changes[ valueKey ][ k ] = {
				[ changes[ valueKey ][ k ] ]: null
			};
		}
		if( k in tagFunctions ) {
			let v = value;
			/* istanbul ignore else */
			if( Array.isArray( value ) ) {
				v = [ ...value ] as unknown as Value;
			} else if( isPlainObject( value ) ) {
				v = { ...value };
			}
			tagFunctions[ k ]( v, valueKey, stats, changes );
			value[ valueKey ] = v[ valueKey ];
			resolvedTags.push( k as TagType );
		}
	}
	return resolvedTags;
}

/** Mutates its arguments */
function set( value : {}, changes : {}, stats : Stats ) : void;
function set( value : {}, changes : {}, stats : Stats ) : void;
function set( value, changes, stats ) : void {
	for( const k in changes ) {
		setAtomic( value, changes, k, stats );
	}
}

/** Mutates its arguments */
function setArray<K extends string | symbol>(
	value : Partial<{[P in K]: Array<any>}>,
	changes : Partial<{[P in K] : Array<any> }>,
	rootKey : K,
	stats : Stats
) : void;
function setArray<K extends string>(
	value : Array<Array<any>>,
	changes : Partial<{[P in K] : Array<any> }>,
	rootKey : K,
	stats : Stats
) : void;
function setArray( value, changes, rootKey, stats : Stats ) : void {
	const nsLength = changes[ rootKey ].length;
	if( value[ rootKey ].length !== nsLength ) {
		value[ rootKey ].length = nsLength;
		stats.hasChanges = true;
	}
	for( let i = 0; i < nsLength; i++ ) {
		setAtomic( value[ rootKey ], changes[ rootKey ], i, stats );
	}
}

/** Mutates its arguments */
function setArrayIndex<K extends string | symbol>(
	value : Partial<{[P in K]: Array<any>}>,
	changes : Partial<{[P in K] : {[x: number | string /* numeric */] : any} }>,
	rootKey : K,
	stats : Stats
) : void;
function setArrayIndex<K extends number | string /* numeric */ >(
	value : Array<Array<any>>,
	changes : Partial<{[P in K] : {[x: number | string /* numeric */] : any} }>,
	rootKey : K,
	stats : Stats
) : void;
function setArrayIndex( value, changes, rootKey, stats : Stats ) : void {
	const incomingIndexes = [];
	for( const k in changes[ rootKey ] ) {
		let index = +k;
		if( index < 0 ) {
			index = value[ rootKey ].length + index;
			changes[ rootKey ][ index ] = changes[ rootKey ][ k ];
			delete changes[ rootKey ][ k ];
		}
		index >= 0 && incomingIndexes.push( index );
	}
	const maxIncomingIndex = Math.max( ...incomingIndexes );
	/* capture all newly created value array indexes into `changed` list */
	if( maxIncomingIndex >= value[ rootKey ].length ) { 
		value[ rootKey ].length = maxIncomingIndex + 1;
		stats.hasChanges = true;
	}
	for( const i of incomingIndexes ) {
		setAtomic( value[ rootKey ], changes[ rootKey ], i, stats );
	}
}

/** Mutates its arguments */
function setPlainObject( value : {}, changes : {}, rootKey : string, stats : Stats ) : void;
function setPlainObject( value : {}, changes : {}, rootKey : symbol, stats : Stats ) : void;
function setPlainObject( value, changes, rootKey, stats ) : void {
	set( value[ rootKey ], changes[ rootKey ], stats );
}

function setValue<T extends Value>(
	value : T,
	changes : Changes<T>,
	onValueChange? : Listener
) {
	const stats = { hasChanges: false };
	if( !Array.isArray( changes ) ) {
		set( { value }, { value: clonedeep( changes ) }, stats );
	} else {
		for( const _cGroup of changes ) {
			set( { value }, { value: clonedeep( _cGroup ) }, stats );
		}
	}
	stats.hasChanges && onValueChange?.( changes );
}