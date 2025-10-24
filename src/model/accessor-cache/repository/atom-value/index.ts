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
	private _data = new AtomNode<T>( null );
	private _origin : T;
	private _pathRepo : PathRepository;
	constructor(
		origin : T,
		pathRepo : PathRepository
	) {
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
		const tokens = tokenizeStringByDots( propertyPath );
		if( tokens[ 0 ] === GLOBAL_SELECTOR ) { return this._addDataForGlobalSelectorAtom() }
		let node = this._data;
		for( let tLen = tokens.length - 1, t = 0; t < tLen; t++ ) {
			const key = tokens[ t ];
			if( key in node.branches ) {
				node = node.branches[ key ]
				if( !node.isActive ) { continue }
				return node.addAtomNodeAt( tokens, this._origin );
			}
			node.branches[ key ] = new AtomNode<T>( node );
			node = node.branches[ key ];
		}
		node.branches[ tokens.at( -1 ) ] = new AtomNode<T>( node, {
			dottedPathId: this._pathRepo.getPathInfoAt( propertyPath.join( '.' ) ).sanitizedPathId,
			pathRepo: this._pathRepo
		}, undefined, this._origin );
	}

	getAtomAt( propertyPath : string ) : AtomNode<T>;
	getAtomAt(
		/* split property path string */
		propertyPath : Array<string>
	) : AtomNode<T>; 
	getAtomAt( propertyPath ) : AtomNode<T> {
		const tokens = tokenizeStringByDots( propertyPath );
		const tLen = tokens.length;
		let t = 0;
		let node = this._data;
		while( t < tLen ) {
			const k = tokens[ t ];
			if( !( k in node.branches ) ) { return null }
			node = node.branches[ k ];
			t++;
			if( node.isActive ) { break }
		}
		return t < tLen
			? node.findActiveNodeAt( tokens )
			: node.isActive
			? node
			: null;
	}
	
	getOriginValueAt( propertyPath : string ) : PropertyOriginInfo;
	getOriginValueAt(
		/* split property path string */
		propertyPath : Array<string>
	) : PropertyOriginInfo;
	getOriginValueAt( propertyPath ) : PropertyOriginInfo {
		const tokens = tokenizeStringByDots( propertyPath );
		return tokens[ 0 ] === GLOBAL_SELECTOR
			? { exists: true, value: this._origin }
			: get( this._origin, tokens );
	}

	mergeChanges(
		changes : Readonly<ChangeInfo["changes"]>,
		paths : Readonly<ChangeInfo["paths"]>
	) {
		const rootAtomChangeMap = new Map<AtomNode<T>, Array<string>>();
		for( let p = paths.length; p--; ) {
			const tokens = paths[ p ];
			let node = this._data;
			let isApplicable = true;
			for( let tLen = tokens.length, t = 0; t < tLen; t++ ) {
				node  = node.branches[ tokens[ t ] ];
				if( !node ) {
					isApplicable = false;
					break;
				}
				if( node.isActive ) {
					const exPath = rootAtomChangeMap.get( node );
					if( !exPath ) {
						rootAtomChangeMap.set( node, tokens );
						break;
					}
					isAPrefixOfB( tokens, exPath ) &&
					tokens.length !== exPath.length	&&
					rootAtomChangeMap.set( node, tokens );
					break;
				}
			}
			if( !isApplicable ) { continue }
			( function tryDescActiveNodeAt<T extends Value>( _node : AtomNode<T> ) {
				for( let b in node.branches ) {
					const _node = node.branches[ b ];
					_node.isActive
						? rootAtomChangeMap.set( _node, _node.fullPath )
						: tryDescActiveNodeAt( _node );
				}
			} )( node );
		}
		for( const [ rootAtomNode, fullPath ] of rootAtomChangeMap ) {
			rootAtomNode.setValueAt( fullPath, get( changes, fullPath )._value as Readonly<T> );
		}
		if( !( GLOBAL_SELECTOR in this._data.branches ) ) { return }
		this._data.branches[ GLOBAL_SELECTOR ].value = this._computeGlobalSelectorAtomValue();
	}
	
	removeAtomDataAt( propertyPath : string ) : void;
	removeAtomDataAt(
		/* split property path string */
		propertyPath : Array<string>
	) : void;
	removeAtomDataAt( propertyPath ) : void {
		const tokens = tokenizeStringByDots( propertyPath );
		if( tokens[ 0 ] === GLOBAL_SELECTOR ) {
			delete this._data.branches[ GLOBAL_SELECTOR ];
			return;
		}
		let node = this._data;
		for( let tLen = tokens.length - 1, t = 0; t < tLen; t++ ) {
			const key = tokens[ t ];
			if( !( key in node.branches ) ) { return }
			node = node.branches[ key ];
			if( node.isActive ) { return node.removeAtomNodeAt( tokens ) }
		}
		( function tryDescActiveNodeAt<T extends Value>( _node : AtomNode<T> ) {
			if( _node.isActive ) {
				return _node.removeAtomNodeAt( tokens )
			}
			for( let b in node.branches ) {
				tryDescActiveNodeAt( node.branches[ b ] )
			}
		} )( node );
	}

	private _addDataForGlobalSelectorAtom() {
		if( GLOBAL_SELECTOR in this._data.branches ) { return }
		this._data.branches[ GLOBAL_SELECTOR ] = new AtomNode<T>( this._data, {
			dottedPathId: this._pathRepo.getPathInfoAt( GLOBAL_SELECTOR ).sanitizedPathId,
			pathRepo: this._pathRepo
		}, undefined, this._computeGlobalSelectorAtomValue() );
	}

	private _computeGlobalSelectorAtomValue() {
		const value = cloneDeep( this._origin );
		for( let relatedAtomNodes = this._findGlobalSelectorRelativeRootAtoms(), r = relatedAtomNodes.length; r--; ) {
			set( value, relatedAtomNodes[ r ].fullPath, relatedAtomNodes[ r ].value )
		}
		return makeReadonly( value );
	}

	private _findGlobalSelectorRelativeRootAtoms() {
		let branches = { ...this._data.branches };
		delete branches[ GLOBAL_SELECTOR ];
		const rootAtomNodes : Array<AtomNode<T>> = [];
		for( const b in branches ) {
			rootAtomNodes.push( ...this._findAllRootAtomNodes( branches[ b ] ) );
		}
		return rootAtomNodes;
	}

	private _findAllRootAtomNodes( node : AtomNode<T> ) {
		if( node.rootAtomNode ) { return [ node.rootAtomNode ] }
		const rootAtomNodes : Array<AtomNode<T>> = [];
		( function harvestRootAtomsIn( _branches ) {
			for( const b in _branches ) {
				const branch = _branches[ b ];
				if( branch.isActive ) {
					rootAtomNodes.push( branch );
					continue;
				}
				harvestRootAtomsIn( branch.branches );
			}
		} )( node.branches );
		return rootAtomNodes;
	}

}

export default AtomValueRepository;
