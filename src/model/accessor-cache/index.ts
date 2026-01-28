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
import TimedMap from '@webkrafters/timed-map';

class Sorted extends Array<number> {
	push( item : number ) {
		if( !this.length || this.at( -1 ) <= item ) {
			return super.push( item );
		}
		for( let tLen = this.length, t = 0; t < tLen; t++ ) {
			if( this[ t ] > item ) {
				this.splice( t - 1, 0, item );
				break;
			}
		}
		return this.length;
	}
}

class AccessorCache<T extends Value> {

	private _accessorAgeTable : TimedMap<null>;

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
		this._accessorAgeTable = new TimedMap<null>( 1.8e6 );
		this._manageAccessorSenescence();
	}

	get origin() { return this._valueRepo.origin }

	/** atomizes value property changes */
	atomize(
		changes : ChangeInfo["changes"],
		paths : ChangeInfo["paths"]
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
		if( regKey in this._accessRegister ) {
			/* dummy call to restart accessor TTL */
			this._accessorAgeTable.get( regKey );
		} else {
			this._accessRegister[ regKey ] = new Accessor<T>(
				pathIds,
				this._atomRegister,
				this._pathRepo,
				this._valueRepo
			);
			this._accessorAgeTable.put( regKey, null );
		}
		const accessor =  this._accessRegister[ regKey ];
		!accessor.hasClient( clientId ) &&
		accessor.addClient( clientId );
		const { value } = accessor;
		const res = {} as typeof accessor.value;
		for( const k in value ) { res[ info[ k ] ] = value[ k ] }
		return res;
	}

	/**
	 * Unlinks a consumer from the cache: performing synchronized value \
	 * cleanup
	 */
	unlinkClient( clientId : string ) {
		const register = this._accessRegister;
		for( const regKey in register ) {
			const v = register[ regKey ];
			if( !v.hasClient( clientId ) ) { continue }
			v.removeClient( clientId );
			if( v.numClients ) { continue }
			this._accessorAgeTable.remove( regKey );
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

	private _manageAccessorSenescence() {
		this._accessorAgeTable.on( 'PRUNED', data => {
			const register = this._accessRegister;
			for( const entry of data.data.removed ) {
				const key = entry.key as string;
				const accessor = register[ key ];
				for( let cIds = accessor.clients, c = cIds.length; c--; ) {
					accessor.removeClient( cIds[ c ] );
				}
				delete register[ key ];
			}
		} );
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
