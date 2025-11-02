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

	private _pathRepo = new PathRepository();

	private _valueRepo : AtomValueRepository<T>;
	
	protected get accessRegister() { return this._accessRegister }

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
		const { ids: pathIds, info } = this._toSourcePathInfo( propertyPaths );
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
		const { value } = accessor;
		for( const k in value ) {
			value[ info[ k ] ] = value[ k ];
			delete value[ k ];
		}
		return value;
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

	protected _getAccessedPathGroupsBy( clientId : string ) {
		const observations : Array<Array<string>> = [];
		for( let accesorDescriptors = Object.keys( this._accessRegister ), d = accesorDescriptors.length; d--; ) {
			const descriptor = accesorDescriptors[ d ];
			if( !this._accessRegister[ descriptor ].hasClient( clientId ) ) { continue }
			const sourcePaths = descriptor.split( ':' );
			for( let sLen = sourcePaths.length, s = 0; s < sLen; s++ ) {
				sourcePaths[ s ] = this._pathRepo.getSourcePathAt( +sourcePaths[ s ] );
			}
			observations.push( sourcePaths );
		}
		return observations;
	}

	private _toSourcePathInfo( propertyPaths : Array<string> ) {
		const pathIds = new Sorted();
		const info = {} as {[pathId:number]:string};
		const pathRepo = this._pathRepo;
		for( let pLen = propertyPaths.length, p = 0; p < pLen; p++ ) {
			const path = propertyPaths[ p ];
			const pathId = pathRepo.getPathInfoAt( path ).sourcePathId
			info[ pathId ] = path;
			pathIds.push( pathId );
		}
		return { info, ids: [ ...pathIds ] }
	}
}

export default AccessorCache;
