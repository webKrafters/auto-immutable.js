import type {
	AccessorPayload,
	AccessorResponse,
	Changes,
	UpdatePayload,
	UpdatePayloadArray,
	UpdatePayloadArrayCore,
	UpdatePayloadArrayCoreCloneable,
	UpdatePayloadCore,
	UpdatePayloadCoreCloneable,
	Value
} from '../../types';

interface PropertyOriginInfo {
	exists: boolean,
	value: any
};

import { isEmpty, isEqual } from 'lodash';

import { GLOBAL_SELECTOR } from '../../constants';

import { getProperty } from '../../utils';

import Atom from '../atom';
import Accessor from '../accessor';

class AccessorCache<T extends Value> {
	#accessors : {[propertyPaths: string]: Accessor};
	#atoms : AccessorPayload;
	#origin : T;

	/** @param origin - Value object reference from which slices stored in this cache are to be curated */
	constructor( origin : T ) {
		this.#accessors = {};
		this.#atoms = {};
		this.#origin = origin;
	}

	get origin() { return this.#origin }

	/** atomizes value property changes */
	atomize( originChanges : UpdatePayload<T> ) : void;
	atomize( originChanges : UpdatePayloadArray<T> ) : void;
	atomize( originChanges : UpdatePayloadArrayCore<T> ) : void;
	atomize( originChanges : UpdatePayloadArrayCoreCloneable<T> ) : void;
	atomize( originChanges : UpdatePayloadCore<T> ) : void;
	atomize( originChanges : UpdatePayloadCoreCloneable<T> ) : void;
	atomize( originChanges : Changes<T> ) : void;
	atomize( originChanges ) : void {
		const accessors = this.#accessors;
		const atoms = this.#atoms;
		const updatedPaths = [];
		for( const path in atoms ) {
			const { exists, value: newAtomVal } = this.#getOriginAt( path );
			if( path !== GLOBAL_SELECTOR && exists && (
				newAtomVal === null || newAtomVal === undefined
			) ) {
				/* istanbul ignore next */
				if( !Array.isArray( originChanges ) ) {
					if( !getProperty( originChanges, path ).trail.length ) { continue }
				} else {
					let found = false;
					for( let i = originChanges.length; i--; ) {
						if( getProperty( originChanges, `${ i }.${ path }` ).trail.length ) {
							found = true;
							break;
						}
					}
					if( !found ) { continue }
				}
			}
			if( isEqual( newAtomVal, atoms[ path ].value ) ) { continue }
			atoms[ path ].setValue( newAtomVal );
			updatedPaths.push( path );
		}
		if( !updatedPaths.length ) { return }
		for( const k in accessors ) { accessors[ k ].outdatedPaths.push( ...updatedPaths ) }
	}

	/**
	 * Gets value object slice from the cache matching the `propertyPaths`.\
	 * If not found, creates a new entry for the client from source, and returns it.
	 */
	get(
		clientId : string,
		...propertyPaths : Array<string>
	) : AccessorResponse {
		if( isEmpty( propertyPaths ) ) { propertyPaths = [ GLOBAL_SELECTOR ] }
		const cacheKey = JSON.stringify( propertyPaths );
		const accessor = cacheKey in this.#accessors
			? this.#accessors[ cacheKey ]
			: this.#createAccessor( cacheKey, propertyPaths );
		!accessor.hasClient( clientId ) && accessor.addClient( clientId );
		return accessor.refreshValue( this.#atoms );
	}

	/** Unlinks a consumer from the cache: performing synchronized value cleanup */
	unlinkClient( clientId : string ) {
		const accessors = this.#accessors;
		const atoms = this.#atoms;
		for( const k in accessors ) {
			const accessor = accessors[ k ];
			// istanbul ignore next
			if( !accessor.removeClient( clientId ) || accessor.numClients ) { continue }
			for( const p of accessor.paths ) {
				if( p in atoms && atoms[ p ].disconnect( accessor.id ) < 1 ) {
					delete atoms[ p ];
				}
			}
			delete accessors[ k ];
		}
	}

	/** Add new cache entry */
	#createAccessor(
		cacheKey : string,
		propertyPaths : Array<string>
	) : Accessor {
		const atoms = this.#atoms;
		const accessor = new Accessor( propertyPaths );
		this.#accessors[ cacheKey ] = accessor;
		for( const path of accessor.paths ) {
			if( !( path in atoms ) ) {
				atoms[ path ] = new Atom( this.#getOriginAt( path ).value );
			}
		}
		return this.#accessors[ cacheKey ];
	}

	#getOriginAt( propertyPath : string ) : PropertyOriginInfo {
		return propertyPath === GLOBAL_SELECTOR
			? { exists: true, value: this.#origin }
			: getProperty( this.#origin, propertyPath );
	}
}

export default AccessorCache;
