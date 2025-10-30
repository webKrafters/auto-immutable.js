import {
	type AccessorPayload,
	type AccessorResponse,
	type ChangeInfo,
	type Value
} from '../..';

import { GLOBAL_SELECTOR } from '../../constants';

import Accessor from '../accessor';

import PathRepository from './repository/paths';
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

	private _accessRegister : { [ regKey : string ]: Accessor<T> } = {};

	/** A map of { source path id : Atom Value Node } */
	private _atomRegister : AccessorPayload<T> = {};

	private _pathRepo = new PathRepository()

	private _valueRepo : AtomValueRepository<T>;;

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
	 * If not found, creates a new entry for the client from source, and \
	 * returns it.
	 */
	get(
		clientId : string,
		...propertyPaths : Array<string>
	) : AccessorResponse<T> {
		if( !propertyPaths.length ) { propertyPaths = [ GLOBAL_SELECTOR ] }
		const pathIds = this._toSourcePathIds( propertyPaths );
		const regKey = pathIds.join( ':' );
		if( !( regKey in this._accessRegister ) ) {
			this._accessRegister[ regKey ] = new Accessor<T>(
				pathIds,
				this._atomRegister,
				this._pathRepo,
				this._valueRepo
			);
		}
		const accessor =  this._accessRegister[ regKey ];
		!accessor.hasClient( clientId ) &&
		accessor.addClient( clientId );
		return accessor.value;
	}

	/**
	 * Unlinks a consumer from the cache: performing synchronized value \
	 * cleanup
	 */
	unlinkClient( clientId : string ) {
		const register = this._accessRegister;
		for( const regKey in register ) {
			register[ regKey ].removeClient( clientId );
			if( register[ regKey ].numClients ) { continue }
			delete register[ regKey ];
		}
	}

	private _toSourcePathIds( propertyPaths : Array<string> ) {
		const pathIds = new Sorted();
		const pathRepo = this._pathRepo;
		for( let pLen = propertyPaths.length, p = 0; p < pLen; p++ ) {
			pathIds.push( pathRepo.getPathInfoAt( propertyPaths[ p ] ).sourcePathId );
		}
		return [ ...pathIds ];
	}
}

export default AccessorCache;
