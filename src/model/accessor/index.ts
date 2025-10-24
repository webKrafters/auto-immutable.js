import type {
	AccessorPayload,
	AccessorResponse,
	Value
} from '../..';

import { DELIMITER } from '../../constants';

import type AtomNode from '../accessor-cache/repository/atom-value/node';
import PathRepository from '../accessor-cache/repository/paths';

class Accessor <T extends Value> {

	private static _NUM_INSTANCES = 0;

	private _clients = new Set<string>();
	private _id : number;
	private _pathRepo : PathRepository;
	private _sourcePathIds : Array<number>;
	private _value : AccessorResponse<T> = {};

	constructor(
		sourcePathIds : Array<number>,
		pathRepo : PathRepository
	) {
		this._id = ++Accessor._NUM_INSTANCES;
		this._sourcePathIds = sourcePathIds;
		this._pathRepo = pathRepo;
	}

	get numClients() { return this._clients.size }

	get id() { return this._id }

	get sourcePathIds() { return this._sourcePathIds }

	get value() { return this._value }

	addClient( clientId : string ) { this._clients.add( clientId ) }

	hasClient( clientId : string ) : boolean { return this._clients.has( clientId ) }

	removeClient( clientId : string ) : boolean { return this._clients.delete( clientId ) }
	
	/** @param changedAtomNodes - Curated slices of value object currently requested */
	refreshValue( changedAtomNodes : AccessorPayload<T> ) : AccessorResponse<T> {
		const { length : sLen, ...sourcePathIds } = this._sourcePathIds;
		const maxVisits = Math.max(
			Object.keys( changedAtomNodes ).length,
			sLen
		);
		for( let numVisists = 0, s = 0; s < sLen; s++ ){
			const pathId = sourcePathIds[ s ];
			if( !( pathId in changedAtomNodes ) ) { continue }
			this.setValueAt(
				this._pathRepo.getSanitizedPathOf( pathId ),
				changedAtomNodes[ pathId ]
			);
			if( ++numVisists === maxVisits ) { break }
		}
		return this._value;
	}

	private setValueAt(
		propertyPath : string,
		atomNode : AtomNode<T>
	) {
		if( !atomNode.isActive ) { return }
		const { atom } = atomNode;
		!atom.isConnected( this._id ) &&
		atom.connect( this._id );
		this._value[ propertyPath ] = atomNode.value;
	}
}

export default Accessor;
