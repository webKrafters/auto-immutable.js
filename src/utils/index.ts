import type { GetElementType, KeyType } from '..';

import dotize from '@webkrafters/path-dotize';

import _isPlainObject from 'lodash.isplainobject';

const numberPtn = /^(?:0|(?:[1-9][0-9]*))$/;

const { toString } = Object.prototype;

export const isPlainObject = _isPlainObject;

/**
 * Curates the most inclusive propertyPaths from a list of property paths.
 * @example
 * arrangePropertyPaths(["a.b.c.d", "a.b", "a.b.z[4].w", "s.t"]) => ["a.b", "s.t"].
 * "a.b" is inclusive of "a.b.c.d": "a.b.c.d" is a subset of "a.b." but not vice versa.
 * "a.b" is inclusive of "a.b.z[4].w": "a.b.z[4].w" is a subset of "a.b." but not vice versa.
 */
export function arrangePropertyPaths( propertyPaths : Array<string> ) : Array<string> {
	const superPathTokensMap : {[propertyPath: string]: Array<string>} = {};
	for( const path of propertyPaths ) {
		const pathTokens = dotize( path ).split( /\./ );
		L2: {
			const replacedSuperPaths = [];
			for( const superPath in superPathTokensMap ) {
				const superPathTokens = superPathTokensMap[ superPath ];
				// self/subset check
				if( superPathTokens.length <= pathTokens.length ) {
					if( superPathTokens.every(( p, i ) => p === pathTokens[ i ]) ) {
						break L2;
					}
					continue;
				}
				// superset check
				pathTokens.every(( p, i ) => p === superPathTokens[ i ]) &&
				replacedSuperPaths.push( superPath );
			}
			superPathTokensMap[ path ] = pathTokens;
			for( const path of replacedSuperPaths ) {
				delete superPathTokensMap[ path ];
			}
		}
	}
	return Object.keys( superPathTokensMap );
}

export function isAPrefixOfB<T>(
	{ length: aLen, ...a } : Array<T>,
	b : Array<T>
) {
	if( aLen > b.length ) { return false }
	for( let i = 0; i < aLen; i++ ) {
		if( a[ i ] !== b[ i ] ) { return false }
	}
	return true;
}

/** Checks if value is either a plain object or an array */
export function isDataContainer( v ) { return isPlainObject( v ) || Array.isArray( v ) }

export function isString( v ) { return toString.call( v ) === '[object String]' }

/**
 * Converts argument to readonly.
 *
 * Note: Mutates original argument.
 */
export function makeReadonly<T>( v : T ) : Readonly<T> {
	try {
		for( const k in v ) { makeReadonly( v[ k ] ) }
	} catch( e ) {
	} finally {
		Object.freeze( v );
		return v;
	}
}

/**
 * this set function writes to both writeable and readonly properties.
 * 
 * ATTENTION: When passing primitives to `obj` parameter, this cannot be overwritten.
 * It is better to use the newly returned `obj` value instead.
 */
export function set(
	obj: unknown,
	path: Array<KeyType>|undefined|null,
	value: unknown
) : unknown {
	if( !path?.length ) {
		obj = value;
		return  obj;
	}
	if( typeof obj !== 'object' ) { obj = createDefaultContainerFor( path[ 0 ] ) }
	obj = ( function resolveDefault( v, pTokens, pIndex = 0 ) {
		if( pIndex === pTokens.length ) {
			v = value as {};
			return v;
		}
		let isNewEntry = false;
		if( typeof v !== 'object' ) {
			v = createDefaultContainerFor( pTokens[ pIndex ] );
			isNewEntry = true;
		}
		if( !Object.isFrozen( v ) ) {
			if( !isNewEntry ) { v = normalize( v, pTokens[ pIndex ] ) }
			v[ pTokens[ pIndex ] ] = resolveDefault( v[ pTokens[ pIndex ] ], pTokens, pIndex + 1 );
			return v;
		}
		v = shallowCopy( v );
		if( !isNewEntry ) { v = normalize( v, pTokens[ pIndex ] ) }
		v[ pTokens[ pIndex ] ] = resolveDefault( v[ pTokens[ pIndex ] ], pTokens, pIndex + 1 );
		Object.freeze( v );
		return v;
	} )( obj, path );
	return obj;
}

export function shallowCopy<T>( data : Readonly<T> ) : T;
export function shallowCopy<T>( data : T ) : T;
export function shallowCopy<T>( data ) : T {
	if( Array.isArray( data ) ) { return [ ...data ] as T }
	if( isPlainObject( data ) ) { return { ...data } as T }
	return data;
}

function createDefaultContainerFor( key : KeyType ) { return isAlphaNumeric( key ) ? [] : {} }

function normalize<T>( value : T, key : KeyType ) : T|Record<keyof T, unknown> {
	// istanbul ignore next
	return !Array.isArray( value ) || isAlphaNumeric( key ) ? value : { ...value };
};

function isAlphaNumeric( value : unknown ) { return numberPtn.test( value.toString() ) }
