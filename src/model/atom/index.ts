import clonedeep from '@webkrafters/clone-total';

import { makeReadonly } from '../../utils';

const isFunction = (() => {
	const toString = Function.prototype.toString;
	const is = ( v : unknown ) : boolean => {
		try { return toString.call( v ) } catch( e ) { return false }
	};
	return is;
})();

/**
 * An atom represents an entry for each individual property\
 * path of the value still in use by client components
 */
class Atom<T = unknown> {
	private _connections : Set<number>;
	private _value : Readonly<T>;

	constructor( value? : T );
	constructor( value? : Readonly<T> );
	constructor( value = undefined ) {
		this._connections = new Set();
		this.setValue( value );
	}

	get value() { return this._value }

	/** @returns {number} Number of connections remaining */
	connect( accessorId : number ) : number {
		this._connections.add( accessorId );
		return this._connections.size;
	}

	/** @returns {number} Number of connections remaining */
	disconnect( accessorId : number ) : number {
		this._connections.delete( accessorId );
		return this._connections.size;
	}

	isConnected( accessorId : number ) : boolean {
		return this._connections.has( accessorId );
	}

	setValue( newValue : Readonly<T> ) : void;
	setValue( newValue : T ) : void;
	setValue( newValue ) : void {
		this._value = !isFunction( newValue )
			? makeReadonly( clonedeep( newValue ) )
			: newValue;
	}
}

export default Atom;
