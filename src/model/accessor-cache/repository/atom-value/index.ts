import {
	type ChangeInfo,
	type Value
} from '../../../..';

export interface PropertyOriginInfo {
	exists: boolean;
	value: any;
};

import set from 'lodash.set';

import cloneDeep from '@webkrafters/clone-total';
import get from '@webkrafters/get-property';

import { GLOBAL_SELECTOR } from '../../../../constants';

import { makeReadonly } from '../../../../utils';

import { isAPrefixOfB } from './util';

import PathRepository from '../paths';

import AtomNode from './node';

const tokenizeStringByDots = (() => {
	const pathSplitPtn = /\./g;
	function t( str : string ) : Array<string>;
	function t(
		/* already tokenized string */
		str : Array<string>
	) : Array<string>; 
	function t( str ) : Array<string> {
		if( Array.isArray( str ) ) { return str }
		return str.split( pathSplitPtn );
	}
	return t;
})();

class AtomValueRepository<T extends Value = Value> {
	private _data : AtomNode<T>;
	private _origin : T;
	private _pathRepo : PathRepository;
	constructor(
		origin : T,
		pathRepo : PathRepository
	) {
		this._data = AtomNode.createRoot();
		this._origin = origin;
		this._pathRepo = pathRepo;
	}
	get origin() { return this._origin }
	addDataForAtomAt( propertyPath : string ) : void;
	addDataForAtomAt(
		/* split property path string */
		propertyPath : Array<string>
	) : void; 
	addDataForAtomAt( propertyPath ) : void {
		this._data.insertAtomAt(
			tokenizeStringByDots( propertyPath ),
			this._pathRepo,
			this._origin
		);
	}

	getAtomAt( propertyPath : string ) : AtomNode<T>;
	getAtomAt(
		/* split property path string */
		propertyPath : Array<string>
	) : AtomNode<T>; 
	getAtomAt( propertyPath ) : AtomNode<T> {
		return this._data.findActiveNodeAt( propertyPath );
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
