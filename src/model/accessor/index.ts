import type {
	AccessorPayload,
	AccessorResponse,
	Value
} from '../../types';

import type Atom from '../atom';

const MODERATE_NUM_PATHS_THRESHOLD = 8;

class Accessor {

	static #NUM_INSTANCES = 0;

	#clients : Set<string>;
	#id : number;
	#paths : Array<string>;
	#value : AccessorResponse;

	public outdatedPaths : Array<string>;

	constructor( accessedPropertyPaths : Array<string> ) {
		this.#clients = new Set();
		this.#id = ++Accessor.#NUM_INSTANCES;
		this.#paths = Array.from( new Set( accessedPropertyPaths ) );
		this.outdatedPaths = this.#paths.slice();
		this.#value = {};
	}

	get numClients() { return this.#clients.size }

	get id() { return this.#id }

	get paths() { return this.#paths }

	get value() { return this.#value }

	#setValueAt<V>( propertyPath : string, atom : Atom<V> ) {
		if( !atom ) { return }
		!atom.isConnected( this.#id ) &&
		atom.connect( this.#id );
		this.#value[ propertyPath ] = atom.value;
	}

	addClient( clientId : string ) { this.#clients.add( clientId ) }

	hasClient( clientId : string ) : boolean { return this.#clients.has( clientId ) }

	removeClient( clientId : string ) : boolean { return this.#clients.delete( clientId ) }
	
	/** @param atoms - Curated slices of value object currently requested */
	refreshValue( atoms : AccessorPayload ) : AccessorResponse {
		// istanbul ignore next
		if( !this.outdatedPaths.length ) { return this.#value }
		let refreshLen;
		const refreshPaths = {};
		BUILD_REFRESH_OBJ: {
			const pathSet = new Set( this.outdatedPaths );
			this.outdatedPaths = [];
			refreshLen = pathSet.size;
			for( const p of pathSet ) { refreshPaths[ p ] = true }
		}
		if( refreshLen >= this.#paths.length ) {
			for( const p of this.#paths ) {
				p in refreshPaths && this.#setValueAt( p, atoms[ p ] );
			}
			return this.#value;
		}
		if( this.#paths.length > MODERATE_NUM_PATHS_THRESHOLD ) {
			const pathsObj = {};
			for( const p of this.#paths ) { pathsObj[ p ] = true }
			for( const p in refreshPaths ) {
				p in pathsObj && this.#setValueAt( p, atoms[ p ] );
			}
			return this.#value;
		}
		// istanbul ignore next
		for( const p in refreshPaths ) {
			// istanbul ignore next
			this.#paths.includes( p ) &&
			this.#setValueAt( p, atoms[ p ] );
		}
		// istanbul ignore next
		return this.#value;
	}
}

export default Accessor;
