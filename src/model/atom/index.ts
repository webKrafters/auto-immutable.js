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
class Atom<T = any> {
	/** @type {Set<number>} */
	#connections;
	/** @type {Readonly<T>} */
	#value;

	/** @param {T|Readonly<T>} [value] */
	constructor( value = undefined ) {
		this.#connections = new Set();
		this.setValue( value );
	}

	get value() { return this.#value }

	/**
	 * @param {number} accessorId
	 * @returns {number} Number of connections remaining
	 */
	connect( accessorId ) {
		this.#connections.add( accessorId );
		return this.#connections.size;
	}

	/**
	 * @param {number} accessorId
	 * @returns {number} Number of connections remaining
	 */
	disconnect( accessorId ) {
		this.#connections.delete( accessorId );
		return this.#connections.size;
	}

	/** @param {number} accessorId */
	isConnected( accessorId ) { return this.#connections.has( accessorId ) }

	/** @param {T|Readonly<T>} newValue */
	setValue( newValue ) {
		this.#value = !isFunction( newValue )
			? makeReadonly( clonedeep( newValue ) )
			: newValue;
	}
}

export default Atom;
