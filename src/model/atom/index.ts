import { clonedeep, makeReadonly } from '../../utils';

const isFunction = (() => {
	const toString = Function.prototype.toString;
	const is = ( v ) : boolean => {
		try { return toString.call( v ) } catch( e ) { return false }
	};
	return is;
})();

/**
 * An atom represents an entry for each individual property\
 * path of the value still in use by client components
 */
class Atom<T = unknown> {
	#connections : Set<number>;
	#value : Readonly<T>;

	constructor( value? : T );
	constructor( value? : Readonly<T> );
	constructor( value = undefined ) {
		this.#connections = new Set();
		this.setValue( value );
	}

	get value() { return this.#value }

	/** @returns {number} Number of connections remaining */
	connect( accessorId : number ) : number {
		this.#connections.add( accessorId );
		return this.#connections.size;
	}

	/** @returns {number} Number of connections remaining */
	disconnect( accessorId : number ) : number {
		this.#connections.delete( accessorId );
		return this.#connections.size;
	}

	isConnected( accessorId : number ) : boolean {
		return this.#connections.has( accessorId );
	}

	setValue( newValue : Readonly<T> ) : void;
	setValue( newValue : T ) : void;
	setValue( newValue ) : void {
		this.#value = !isFunction( newValue )
			? makeReadonly( clonedeep( newValue ) )
			: newValue;
	}
}

export default Atom;
