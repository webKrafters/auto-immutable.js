import {
	type AccessorPayload,
	type AccessorResponse,
	type ChangeInfo,
	type Value
} from '../..';

import isEmpty from 'lodash.isempty';

import { DELIMITER, GLOBAL_SELECTOR } from '../../constants';

import Accessor from '../accessor';

import PathRepository, { PathIdInfo } from './repository/paths';
import AtomValueRepository from './repository/atom-value';

class Sorted extends Array<number> {
	push( item : number ) {
		if( !this.length || this.at( -1 ) < item ) {
			return super.push( item );
		}
		for( let tLen = this.length, t = 0; t < tLen; t++ ) {
			if( this[ t ] < item ) { continue }
			if( this[ t ] > item ) {
				this.splice( t - 1, 0, item );
				return tLen + 1;
			}
			return tLen;
		}
	}
}

class AccessorCache<T extends Value> {
	private _accessors : { [ cacheKey : string ]: Accessor<T> } = {};
	private _atoms : AccessorPayload<T> = {};

	private _valueRepo : AtomValueRepository<T>;

	private _pathRepo = new PathRepository();

	/** @param origin - Value object reference from which slices stored in this cache are to be curated */
	constructor( origin : T ) {
		this._valueRepo = new AtomValueRepository<T>(
			origin, this._pathRepo
		);
	}

	get origin() { return this._valueRepo.origin }

	/** atomizes value property changes */
	atomize(
		changes : Readonly<ChangeInfo["changes"]>,
		paths : Readonly<ChangeInfo["paths"]>
	) : void {
		paths.length && this._valueRepo.mergeChanges( changes, paths );
	}

	/**
	 * Gets value object slice from the cache matching the `propertyPaths`.\
	 * If not found, creates a new entry for the client from source, and returns it.
	 */
	get(
		clientId : string,
		...propertyPaths : Array<string>
	) : AccessorResponse<T> {
		if( isEmpty( propertyPaths ) ) { propertyPaths = [ GLOBAL_SELECTOR ] }
		const pathIds = new Sorted();
		for( let pLen = propertyPaths.length, p = 0; p < pLen; p++ ) {
			pathIds.push( this._pathRepo.getPathInfoAt( propertyPaths[ p ] ).sourcePathId );
		}
		const cacheKey = pathIds.join( DELIMITER );
		const accessor = cacheKey in this._accessors
			? this._accessors[ cacheKey ]
			: this.createAccessor( cacheKey, [ ...pathIds ] );
		!accessor.hasClient( clientId ) && accessor.addClient( clientId );
		return accessor.refreshValue( this._atoms );
	}

	/** Unlinks a consumer from the cache: performing synchronized value cleanup */
	unlinkClient( clientId : string ) {
		const accessors = this._accessors;
		const atoms = this._atoms;
		for( const cacheKey in accessors ) {
			const accessor = accessors[ cacheKey ];
			// istanbul ignore next
			if( !accessor.removeClient( clientId ) || accessor.numClients ) { continue }
			for( const pathId of accessor.sourcePathIds ) {
				if( pathId in atoms && atoms[ pathId ].atom.disconnect( accessor.id ) < 1 ) {
					atoms[ pathId ].remove();
					delete atoms[ pathId ];
				}
			}
			delete accessors[ cacheKey ];
		}
	}

	/** Add new cache entry */
	private createAccessor(
		cacheKey : string, sourcePathIds : Array<number>
	) : Accessor<T> {
		const atoms = this._atoms;
		const accessor = new Accessor<T>( sourcePathIds, this._pathRepo );
		this._accessors[ cacheKey ] = accessor;
		for( const pathId of accessor.sourcePathIds ) {
			if( pathId in atoms ) { continue }
			const path =  this._pathRepo.getSanitizedPathOf( pathId );
			this._valueRepo.addDataForAtomAt( path );
			this._atoms[ pathId ] = this._valueRepo.getAtomAt( path );
		}
		return this._accessors[ cacheKey ];
	}

	getOriginAt( propertyPath : string ) {
		return this._valueRepo.getOriginValueAt( propertyPath );
	}
}

export default AccessorCache;
