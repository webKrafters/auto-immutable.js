import type { ChangeInfo, Value } from '../../../..';

import get from '@webkrafters/get-property';

import PathRepository from '../paths';

import AtomNode from './node';

class AtomValueRepository<T extends Value = Value> {
	private _data : AtomNode<T>;
	private _origin : T;
	private _pathRepo : PathRepository;

	get origin() { return this._origin }

	constructor(
		origin : T,
		pathRepo : PathRepository
	) {
		this._data = AtomNode.createRoot();
		this._origin = origin;
		this._pathRepo = pathRepo;
	}

	addDataForAtomAt( sanitizedPathId : number ) : void {
		this._data.insertAtomAt(
			sanitizedPathId,
			this._pathRepo,
			this._origin
		);
	}

	getAtomAt( sanitizedPathId : number ) : AtomNode<T> {
		return this._data.findActiveNodeAt(
			this._pathRepo.getPathTokensAt( sanitizedPathId )
		);
	}

	getValueAt( sanitizedPathId : number ) : Readonly<T> {
		return this.getAtomAt( sanitizedPathId ).value;
	}

	mergeChanges(
		changes : Readonly<ChangeInfo["changes"]>,
		paths : Readonly<ChangeInfo["paths"]>
	) {
		for( let p = paths.length; p--; ) {
			this._data.setValueAt( paths[ p ], get( changes, paths[ p ] )._value as Readonly<T> );
		}
	}
}

export default AtomValueRepository;
