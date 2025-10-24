/**
 * An atom represents an entry for each individual property\
 * path of the value still in use by client components
 */
class Atom {

	private _connections : Set<number>;

	constuctor() { this._connections = new Set() }

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
}

export default Atom;
