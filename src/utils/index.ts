import type { CloneDeepWithCustomizer } from 'lodash';
import type { PropertyInfo } from '@webkrafters/get-property';

import clonedeepwith from 'lodash/cloneDeepWith';
import isPlainObject from 'lodash/isplainobject';

import checkEligibility from './clonedeep-eligibility-check';

import get from '@webkrafters/get-property';

export type Transform = <T>(property : PropertyInfo) => T;

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
		const pathTokens = path
			.replace( /\[([0-9]+)\]/g, '.$1' )
			.replace( /^\./, '' )
			.split( /\./ );
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
};

/**
 * Built on top of lodash.clonedeepwith.\
 * Instances of non-native classes not implementing either the `clone` or the `cloneNode
 * methods may not be cloneable. Such instances are retured uncloned.
 */
export const clonedeep = (() => {
	const defaultCustomizer : CloneDeepWithCustomizer<any> = v => {
		if( v === null ) { return }
		if( typeof v === 'object' ) {
			if( 'clone' in v && typeof v.clone === 'function' ) { return v.clone() }
			if( 'cloneNode' in v && typeof v.cloneNode === 'function' ) { return v.cloneNode( true ) }
		}
		if( !checkEligibility( v ).isEligible ) { return v }
	}
	const clone = <T, R = T>( value : T , customizer : CloneDeepWithCustomizer<T> = defaultCustomizer ) : R => clonedeepwith( value, customizer );
	const clonedeep = <T, R = T>(value: T) : R => clone( value );
	return clonedeep;
})();

export const getProperty = get;

/** Checks if value is either a plain object or an array */
export function isDataContainer( v ) : boolean { return isPlainObject( v ) || Array.isArray( v ) }

/**
 * Converts argument to readonly.
 *
 * Note: Mutates original argument.
 */
export function makeReadonly<T>( v : T ) : Readonly<T> {
	let frozen = true;
	if( isPlainObject( v ) ) {
		for( const k in v ) { makeReadonly( v[ k ] ) }
		frozen = Object.isFrozen( v );
	} else if( Array.isArray( v ) ) {
		const vLen = v.length;
		for( let i = 0; i < vLen; i++ ) { makeReadonly( v[ i ] ) }
		frozen = Object.isFrozen( v );
	}
	!frozen && Object.freeze( v );
	return v;
};

const defaultFormatValue = <T>({ value } : PropertyInfo) : T => value;

export const stringToDotPath = (() => {
	const BRACKET_OPEN = /\.?\[/g;
	const BRACKET_CLOSE = /^\.|\]/g;
	const fn = ( path : string ) : string => path
		.replace( BRACKET_OPEN, '.' )
		.replace( BRACKET_CLOSE, '' );
	return fn;
})();

/**
 * Pulls propertyPath values from state and
 * compiles them into a partial state object.
 */
export function mapPathsToObject<T>(
	source : T,
	propertyPaths : Array<string>,
	transform : Transform = defaultFormatValue
) : Partial<T> {
	const paths = [];
	for( const path of propertyPaths ) { paths.push( stringToDotPath( path ) ) }
	const dest = {};
	let object = dest;
	for( const path of arrangePropertyPaths( paths ) ) {
		const property = getProperty( source, path );
		if( !property.exists ) { continue }
		for(
			let tokens = path.split( '.' ), tLen = tokens.length, t = 0;
			t < tLen;
			t++
		) {
			const token = tokens[ t ];
			if( t + 1 === tLen ) {
				object[ token ] = transform( property );
				object = dest;
				break;
			}
			if( !( token in object ) ) { object[ token ] = {} }
			object = object[ token ];
		}
	}
	return dest;
}
