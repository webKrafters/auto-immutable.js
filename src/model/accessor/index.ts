import type {
	AccessorPayload,
	AccessorResponse
} from '../..';

import type Atom from '../atom';

const MODERATE_NUM_PATHS_THRESHOLD = 8;

class Accessor {

	private static _NUM_INSTANCES = 0;

	private _clients : Set<string>;
	private _id : number;
	private _paths : Array<string>;
	private _value : AccessorResponse;

	public outdatedPaths : Array<string>;

	constructor( accessedPropertyPaths : Array<string> ) {
		this._clients = new Set();
		this._id = ++Accessor._NUM_INSTANCES;
		this._paths = Array.from( new Set( accessedPropertyPaths ) );
		this.outdatedPaths = this._paths.slice();
		this._value = {};
	}

	get numClients() { return this._clients.size }

	get id() { return this._id }

	get paths() { return this._paths }

	get value() { return this._value }

	addClient( clientId : string ) { this._clients.add( clientId ) }

	hasClient( clientId : string ) : boolean { return this._clients.has( clientId ) }

	removeClient( clientId : string ) : boolean { return this._clients.delete( clientId ) }
	
	/** @param atoms - Curated slices of value object currently requested */
	refreshValue( atoms : AccessorPayload ) : AccessorResponse {
		// istanbul ignore next
		if( !this.outdatedPaths.length ) { return this._value }
		let refreshLen;
		const refreshPaths = {};
		BUILD_REFRESH_OBJ: {
			const pathSet = new Set( this.outdatedPaths );
			this.outdatedPaths = [];
			refreshLen = pathSet.size;
			for( const p of pathSet ) { refreshPaths[ p ] = true }
		}
		if( refreshLen >= this._paths.length ) {
			for( const p of this._paths ) {
				p in refreshPaths && this.setValueAt( p, atoms[ p ] );
			}
			return this._value;
		}
		if( this._paths.length > MODERATE_NUM_PATHS_THRESHOLD ) {
			const pathsObj = {};
			for( const p of this._paths ) { pathsObj[ p ] = true }
			for( const p in refreshPaths ) {
				p in pathsObj && this.setValueAt( p, atoms[ p ] );
			}
			return this._value;
		}
		// istanbul ignore next
		for( const p in refreshPaths ) {
			// istanbul ignore next
			this._paths.includes( p ) &&
			this.setValueAt( p, atoms[ p ] );
		}
		// istanbul ignore next
		return this._value;
	}

	private setValueAt<V>(
		propertyPath : string,
		atom : Atom<V>
	) {
		if( !atom ) { return }
		!atom.isConnected( this._id ) &&
		atom.connect( this._id );
		this._value[ propertyPath ] = atom.value;
	}
}

export default Accessor;
