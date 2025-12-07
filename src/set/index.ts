import {
	UpdateStats as Stats,
	type Changes,
	type ChangeInfo,
	type KeyType,
	type TagType,
	type Value
} from '..';

type ChangeHandler = (
    changes : ChangeInfo["changes"],
    paths : ChangeInfo["paths"]
) => void;

import isEqual from 'lodash.isequal';

import clonedeep from '@webkrafters/clone-total';
import getProperty from '@webkrafters/get-property';

import {
	arrangePropertyPaths,
	isDataContainer,
	isPlainObject,
	set as setProperty
} from '../utils';

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
	/**
	 * settles those changes that do snot
	 * map directly unto existing value 
	 * properties.
	 */
	function finalizeAtomicSet( value : Value, changes : Value, valueKey : KeyType, stats : Stats, compositeChangeDesc? : 'OBJECT' ) : void;
	function finalizeAtomicSet( value : Value, changes : Value, valueKey : TagType, stats : Stats, compositeChangeDesc? : 'OBJECT' ) : void;
	function finalizeAtomicSet( value : Array<any>, changes : Value, valueKey : number, stats : Stats, compositeChangeDesc? : 'ARRAY' ) : void;
	function finalizeAtomicSet( value : Array<any>, changes : Value, valueKey : string /* numeric */, stats : Stats, compositeChangeDesc? : 'ARRAY' ) : void;
	function finalizeAtomicSet( value, changes, valueKey, stats : Stats, compositeChangeDesc = undefined ) : void {
		const change = changes[ valueKey ];
		/* istanbul ignore else */
		if( !compositeChangeDesc ) {
			/* istanbul ignore else */
			if( !isClosedTag( change ) ) {
				value[ valueKey ] = change;
				stats.addChangePath([
					...stats.currentPathToken,
					valueKey
				]);
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
		stats.addChangePath([ ...stats.currentPathToken, valueKey ]);
		return setAtomic( value, changes, valueKey, stats );
	};
	function setAtomic( value : Value, changes : Value, valueKey : KeyType, stats : Stats ) : void;
	function setAtomic( value : Value, changes : Value, valueKey : TagType, stats : Stats ) : void;
	function setAtomic( value : Array<any>, changes : Value, valueKey : number, stats : Stats ) : void;
	function setAtomic( value : Array<any>, changes : Value, valueKey : string /* numeric */, stats : Stats ) : void;
	function setAtomic( value, changes, valueKey, stats : Stats ) : void {
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
			return setPlainObject( value, changes, valueKey, stats );
		}
		if( tagsResolved.length || !( valueKey in changes ) ) {
			return;
		};
		finalizeAtomicSet( value, changes, valueKey, stats, compositeChangeDesc );
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
		changes[ valueKey ] = { [ changes[ valueKey ] as string ]: null };
	}
	if( !isDataContainer( changes[ valueKey ] ) ) { return resolvedTags }
	if( !( valueKey in value ) && isArrayTaggedPayload( changes[ valueKey ] ) ) {
		value[ valueKey ] = [];
	}
	for( const k in changes[ valueKey ] as any ) {
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
	stats.currentPathToken.push( rootKey );
	const nsLength = changes[ rootKey ].length;
	if( value[ rootKey ].length !== nsLength ) {
		value[ rootKey ].length = nsLength;
		stats.addChangePath( stats.currentPathToken );
	}
	for( let i = 0; i < nsLength; i++ ) {
		setAtomic( value[ rootKey ], changes[ rootKey ], i, stats );
	}
	stats.currentPathToken.pop();
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
	stats.currentPathToken.push( rootKey );
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
		stats.addChangePath( stats.currentPathToken );
	}
	for( const i of incomingIndexes ) {
		setAtomic( value[ rootKey ], changes[ rootKey ], i, stats );
	}
	stats.currentPathToken.pop();
}

/** Mutates its arguments */
function setPlainObject( value : {}, changes : {}, rootKey : string, stats : Stats ) : void;
function setPlainObject( value : {}, changes : {}, rootKey : symbol, stats : Stats ) : void;
function setPlainObject( value, changes, rootKey, stats ) : void {
	stats.currentPathToken.push( rootKey );
	set( value[ rootKey ], changes[ rootKey ], stats );
	stats.currentPathToken.pop();
}

function setValue<T extends Value>(
	value : T,
	changes : Array<Changes<T>>,
	onValueChange? : ChangeHandler
) : void;
function setValue<T extends Value>(
	value : T,
	changes : Changes<T>,
	onValueChange? : ChangeHandler
) : void;
function setValue<T extends Value>(
	value, changes, onValueChange?
) : void {
	const stats = new Stats();
	if( !Array.isArray( changes ) ) {
		set( { value }, { value: clonedeep( changes ) }, stats );
	} else {
		for( const _cGroup of changes ) {
			set( { value }, { value: clonedeep( _cGroup ) }, stats );
		}
	}
	if( onValueChange && stats.hasChanges ) {
		const { changes, paths } = distillChanges( value, stats.changedPathTable );
		onValueChange( changes, paths );
	}
}

function distillChanges<T extends object>(
	source : T,
	changedPaths : Array<Array<KeyType>>
) : ChangeInfo {
	let propertyPathMap : {[x:string]: Array<KeyType>} = {};
	for( let path of changedPaths ) {
		path = path.slice( 1 );
		propertyPathMap[ path.join( '.' ) ] = path;
	}
	let changes = {};
	const paths : Array<Array<string>> = [];
	for( const path of arrangePropertyPaths(
		Object.keys( propertyPathMap )
	) ) {
		let pathTokens = propertyPathMap[ path ];
		paths.push( pathTokens as string[] );
		changes = setProperty( changes, pathTokens, clonedeep( getProperty( source, pathTokens )._value ) );
	}
	return { changes, paths };
}
