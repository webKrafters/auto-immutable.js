import type {
	AccessorPayload,
	AccessorResponse,
	Value
} from '../..';
import AtomValueRepository from '../accessor-cache/repository/atom-value';

import PathRepository from '../accessor-cache/repository/paths';

class Accessor <T extends Value> {

	private static _NUM_INSTANCES = 0;

	private _atomRegistry : AccessorPayload<T>;
	private _clients = new Set<string>();
	private _id : number;
	private _pathRepo : PathRepository;
	private _sourcePathIds : Array<number>;
	private _valueRepo : AtomValueRepository<T>;

	constructor(
		sourcePathIds : Array<number>,
		atomRegistry : AccessorPayload<T>,
		pathRepo : PathRepository,
		valueRepo : AtomValueRepository<T>
	) {
		this._id = ++Accessor._NUM_INSTANCES;
		this._atomRegistry = atomRegistry;
		this._pathRepo = pathRepo;
		this._sourcePathIds = sourcePathIds;
		this._valueRepo = valueRepo;
	}

	get id() { return this._id }

	get numClients() { return this._clients.size }

	get sourcePathIds() { return this._sourcePathIds }

	get value() {
		const data : AccessorResponse<T> = {};
		const atom = this._atomRegistry;
		for( const pathId of this._sourcePathIds ) {
			data[ pathId ] = atom[ pathId ].value;
		}
		return data;
	}
	
	addClient( clientId : string ) {
		if( this._clients.has( clientId ) ) { return }
		const atoms = this._atomRegistry;
		const valueRepo = this._valueRepo;
		for( const pathId of this._sourcePathIds ) {
			if( !( pathId in atoms ) ) {
				const pathTokens = this._getTokenizedPath( pathId );
				valueRepo.addDataForAtomAt( pathTokens );
				atoms[ pathId ] = valueRepo.getAtomAt( pathTokens );
			}
			atoms[ pathId ].addAccessor( this._id );
		}
		this._clients.add( clientId );		
	}

	removeClient( clientId : string ) : boolean {
		const deleted = this._clients.delete( clientId );
		if( !deleted || this.numClients ) { return deleted }
		const atoms = this._atomRegistry;
		const pathRepo = this._pathRepo;
		for( const pathId of this._sourcePathIds ) {
			if( !( pathId in atoms ) || (
				atoms[ pathId ].removeAccessor( this._id ) > 0
			) ) {
				continue;
			}
			atoms[ pathId ].remove();
			delete atoms[ pathId ];
			pathRepo.removeSourceId( pathId );
		}
		return deleted;
	}

	private _getTokenizedPath( sourcePathId : number ) {
		return this._pathRepo.getPathTokensAt(
			this._pathRepo.getIdOfSanitizedPath(
				this._pathRepo.getSanitizedPathOf( sourcePathId )
			)
		);
	}
}

export default Accessor;
