import {
	type ChangeInfo,
	type Value
} from '../../../..';

export interface PropertyOriginInfo {
	exists: boolean;
	value: any;
};

import get from '@webkrafters/get-property';

import { GLOBAL_SELECTOR } from '../../../../constants';

import { isAPrefixOfB } from './util';

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
	constructor( origin : T ) { this._origin = origin }
	get origin() { return this._origin }
	addDataForAtomAt( propertyPath : string ) : void;
	addDataForAtomAt(
		/* split property path string */
		propertyPath : Array<string>
	) : void; 
	addDataForAtomAt( propertyPath ) : void {
		const tokens = tokenizeStringByDots( propertyPath );
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
		node.branches[ tokens.at( -1 ) ] = new AtomNode<T>(
			node, propertyPath, undefined, this._origin
		);
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
			: get( this._origin, tokens )._value;
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
			rootAtomNode.setValueAt( fullPath, get( changes, fullPath )._value );
		}
	}
	
	removeAtomDataAt( propertyPath : string ) : void;
	removeAtomDataAt(
		/* split property path string */
		propertyPath : Array<string>
	) : void;
	removeAtomDataAt( propertyPath ) : void {
		const tokens = tokenizeStringByDots( propertyPath );
		let node = this._data;
		for( let tLen = tokens.length - 1, t = 0; t < tLen; t++ ) {
			const key = tokens[ t ];
			if( !( key in node.branches[ key ] ) ) { return }
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
}

export default AtomValueRepository;
