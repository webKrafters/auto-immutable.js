import { type Value } from '../../../..';

export interface FullPathSource {
	dottedPathId: number;
	pathRepo: PathsRepo;
};

import set from 'lodash.set';

import get from '@webkrafters/get-property';
import cloneDeep from '@webkrafters/clone-total';

import { isAPrefixOfB } from './util';

import PathsRepo from '../paths';

import Atom from '../../../atom';

class ArrayUnique<T = any> extends Array<T> {
	push( ...nodes : Array<any> ) {
		let newLen = this.length;
		for( let nLen = nodes.length, n = 0; n < nLen; n++ ) {
			if( this.indexOf( nodes[ n ] ) !== -1 ) { continue }
			super.push( nodes[ n ] );
			newLen++;
		}
		return newLen;
	}
}

class AtomNode<T extends Value>{
	private _atom : Atom = null;
	private _branches : Record<string, AtomNode<T>> = {};
	private _fullPathId : number = null;
	private _fullPathRepo : PathsRepo = null; 
	private _head : AtomNode<T> = null;
	private _pathToRootAtom : Array<string> = [];
	private _rootAtomNode : AtomNode<T> = null;
	private _sectionData : Readonly<T> = null;
	/**
	 * @param head - parent node
	 * @param pathSource - produces the property path tokens pointed to within the immutable data store.
	 * @param rootAtomNode - a root atom node whose this node is a descendant. Leave this `undefined` or `null` if this is a root node
	 * @param origin - the immutable data store - Leave this `undefined` or `null` if this node is a descendant node
	 * @returns - `inactive node` when no propertyPaths supplied; add `rootAtomNode` or `origin` to obtain `descendantAtom` or `rootAtom` nodes respectively.
	 */
	constructor(
		head : AtomNode<T>,
		pathSource : FullPathSource = null,
		rootAtomNode : AtomNode<T> = null, 
		origin : T = null
	) {
		this._head = head;
		if( !pathSource ) { return }
		this._atom = new Atom();
		this._fullPathId = pathSource.dottedPathId;
		this._fullPathRepo = pathSource.pathRepo;
		if( !!rootAtomNode ) { // for not creating a root atom node
			this._rootAtomNode = rootAtomNode;
			this._pathToRootAtom = this.fullPath.slice( rootAtomNode.fullPath.length );
			return;
		}
		this._sectionData = cloneDeep( get( origin, this.fullPath )._value );
		for( let descNodes = this._findNearestDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._adjustToNewAtomNode( this );
		}
		this._rootAtomNode = this;
	}
	get atom() { return this._atom }
	get branches() { return this._branches }
	get fullPath() { return this._fullPathRepo.getPathTokensAt( this._fullPathId ) }
	get hasBranches() { return this.numBranches }
	get head() { return this._head }
	get isActive() { return !!this._atom }
	get numBranches() { return Object.keys( this._branches ).length }
	get pathToRootAtom() { return this._pathToRootAtom }
	get rootAtomNode() { return this._rootAtomNode }
	/** applicable only to nodes containing atoms: assert via a `this.isActive` check. */
	@activeNodesOnly
	get value() {
		return this !== this._rootAtomNode
			? get( this._rootAtomNode._sectionData, this._pathToRootAtom )._value as Readonly<T>
			: this._sectionData;
	}
	/**
	 * applicable only to nodes containing atoms: assert via a 
	 * `this.isActive` check.
	 * 
	 * This value change propagates through descendant atoms. To
	 * avoid redundant operations, it is advisable to call this
	 * once on any node within a rootAtomNode section.
	 * 
	 * @param v
	 */
	@activeNodesOnly
	set value( v : Readonly<T> ) {
		const previousRootAtomValue = shallowCopy( this._rootAtomNode.value ) as T;
		if( this === this._rootAtomNode ) {
			this._rootAtomNode.value = v;
		} else {
			makePathWriteable( this._rootAtomNode.value, this._pathToRootAtom, true );
			set( this._rootAtomNode.value, this._pathToRootAtom, v );
		}
		this._retainUnchangedDescendants( previousRootAtomValue );
	}

	/** applicable only to nodes containing atoms: assert via a `this.isActive` check. */
	@activeNodesOnly
	addAtomNodeAt( fullPath : Array<string>, origin : T ) {
		if( isAPrefixOfB( this.fullPath, fullPath ) ) {
			return this._addDescendantAtomNodeAt( fullPath );
		}
		if( isAPrefixOfB( fullPath, this.fullPath ) ) {
			return this._addRootAtomNodeAt( fullPath, origin );
		}
		throw new Error( '`fullPath` argument must either be a prefix or suffix of the `fullPath` of this node.' );
	}

	/** applicable only to nodes containing atoms: assert via a `this.isActive` check. */
	@activeNodesOnly
	findActiveNodeAt( fullPath : Array<string> ) {
		const node = this._findNodeAt( fullPath );
		return node?.isActive ? node : null;
	}

	/**
	 * applicable only to nodes containing atoms: assert via a
	 * `this.isActive` check.
	 * 
	 * @param fullPath - must be a prefix of this node's fullPath.
	 */
	@activeNodesOnly
	removeAtomNodeAt( fullPath : Array<string> ) {
		const nodeAtFullPath = this._findNodeAt( fullPath );
		if( !nodeAtFullPath ) {
			throw new Error( '`fullPath` argument must either be a prefix or suffix of the `fullPath` of this node.' );
		}
		if( !nodeAtFullPath.isActive ) { return }
		nodeAtFullPath.remove();
	}

	/** applicable only to nodes containing atoms: assert via a `this.isActive` check. */
	@activeNodesOnly
	remove() {
		const key = this.fullPath.at( -1 );
		let head = this._head;
		if( !this.hasBranches )	{
			// handling leaf removal - discard all dangling leaf nodes.
			let node = head;
			delete node._branches[ key ];
			if( node.hasBranches ) { return }
			node = node._head;
			while( node.numBranches === 1 ) {
				node._branches = {};
				if( node.isActive ) { return }
				node = node._head;
			}
			return;
		}
		head._branches[ key ] = new AtomNode( head );
		head._branches[ key ]._branches = this._branches;
		if( this === this._rootAtomNode ) {
			for( let descNodes = head._branches[ key ]._findNearestDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
				descNodes[ d ]._convertToRootAtomNode();
			}
		}
	}
	
	/**
	 * applicable only to nodes containing atoms: assert via a
	 * `this.isActive` check.
	 * 
	 * This value change propagates through descendant atoms. To avoid redundant
	 * operations, it is advisable to call this once on any node within a
	 * rootAtomNode section.
	 * @param fullPath - a path in node to set: must be a suffix of `this.fullPath`
	 * @param value
	 */
	@activeNodesOnly
	setValueAt( fullPath : Array<string>, value : Readonly<T> ) {
		if( !isAPrefixOfB( this.fullPath, fullPath ) ) {
			throw new Error( `Cannot use \`node.setValueAt(...)\` where \`fullPath: ${ fullPath }\` is a prefix of \`node.fullPath: ${ this.fullPath }\`.` );
		}
		const pathToRootAtom = fullPath.slice( this.rootAtomNode.fullPath.length );
		let prevValue = this._rootAtomNode.value;
		makePathWriteable( this._rootAtomNode.value, pathToRootAtom, true );
		set( this._rootAtomNode.value, pathToRootAtom, value );
		let closestChangedAtom : AtomNode<T> = this;
		for( const key of fullPath.slice( this.fullPath.length ) ) {
			if( !closestChangedAtom.branches?.[ key ]?.isActive ) { continue }
			closestChangedAtom = closestChangedAtom.branches[ key ];
		}
		this._retainUnchangedDescendants( prevValue );
	}

	private _addDescendantAtomNodeAt( fullPath : Array<string> ) {
		let node = this.rootAtomNode;
		for( let pathToRootAtom = fullPath.slice( this.fullPath.length ), ancestorLen =  pathToRootAtom.length - 1, p = 0; p < ancestorLen; p++ ) {
			const key = pathToRootAtom[ p ];
			if( !( key in node._branches ) ) {
				node.branches[ key ] = new AtomNode<T>( node );
			}
			node = node._branches[ key ];
		}
		const key = fullPath.at( -1 );
		if( key in node.branches ) { return }
		node.branches[ key ] = new AtomNode<T>( node, { 
			dottedPathId: this._fullPathRepo.getPathInfoAt( fullPath.join( '.' ) ).sanitizedPathId,
			pathRepo: this._fullPathRepo
		}, this._rootAtomNode );
	}

	private _addRootAtomNodeAt( fullPath : Array<string>, origin : T ) {
		let node = this._findNodeAt( fullPath );
		const key = fullPath.at( -1 );
		node._head._branches[ key ] = new AtomNode<T>(
			node._head, {
				dottedPathId: this._fullPathRepo.getPathInfoAt( fullPath.join( '.' ) ).sanitizedPathId,
				pathRepo: this._fullPathRepo
			}, undefined, origin 
		);
		node._head._branches[ key ]._branches = node._branches;
		node = node._head._branches[ key ];
		for( let descNodes = this._findNearestDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._adjustToNewAtomNode( node );
		}
	}

	private _adjustToNewAtomNode( rootAtomNode : AtomNode<T> ) {
		this._rootAtomNode = rootAtomNode;
		this._pathToRootAtom = this.fullPath.slice( rootAtomNode.fullPath.length );
		if( !this._sectionData ) { return }
		makePathWriteable( rootAtomNode._sectionData, this._pathToRootAtom, true );
		set( rootAtomNode._sectionData, this._pathToRootAtom, this._sectionData );
		this._sectionData = null;
	}

	private _convertToRootAtomNode() {
		this._rootAtomNode = this;
		this._pathToRootAtom = [];
		for( let descNodes = this._findNearestDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._adjustToNewAtomNode( this );
		}	
	}

	private _curateUnchangedAtoms( previouRootAtomValue : T ){
		const rootAtomNode = this._rootAtomNode;
		const nextRootAtomValue = rootAtomNode._sectionData;
		const curatedNodes = new ArrayUnique<AtomNode<T>>();
		( function areEqual( pVal : T, nVal : Readonly<T>, path : Array<string> ) {
			const nLen = Object.keys( nVal ?? 0 ).length;
			const pLen = Object.keys( pVal ?? 0 ).length;
			if( !pLen || !nLen ) {
				if( pVal !== nVal ) { return false }
				curatedNodes.push( rootAtomNode._findClosestNodeTo( path ) );
				return true;
			}
			let equal = true;
			for( let k in nVal ) {
				if( !areEqual(
					pVal[ k ] as unknown as T,
					nVal[ k ] as Readonly<T>,
					[ ...path, k ]
				) ) { equal = false }
			}
			if( !equal || nLen !== pLen ) { return false }
			curatedNodes.push( rootAtomNode._findClosestNodeTo( path ) );
			return true;
		} )( previouRootAtomValue, nextRootAtomValue, [] );
		return curatedNodes;
	}

	/** produces the closest `atomNode` ancestor to the `propertyPath` tokens provided. */
	private _findClosestNodeTo( fullPath : Array<string> ) : AtomNode<T> {
		let rootAtomNode = this._rootAtomNode;
		let closest = rootAtomNode;
		for( const key of fullPath ) {
			if( !rootAtomNode.isActive ) {
				rootAtomNode = rootAtomNode._branches[ key ];
				continue;
			}
			const rootAtomFullPath = rootAtomNode.fullPath;
			if( isAPrefixOfB( rootAtomFullPath, fullPath ) ) {
				closest = rootAtomNode;
				if( rootAtomFullPath.length === fullPath.length ) {
					return rootAtomNode;
				}
				rootAtomNode = rootAtomNode._branches[ key ];
				continue;
			} else if( isAPrefixOfB( fullPath, rootAtomFullPath ) ) {
				return closest;
			}
			if( !rootAtomNode.hasBranches ) { return null }
			rootAtomNode = rootAtomNode._branches[ key ];
		}
		return null;
	}

	private _findDescendantAt( fullPath : Array<string> ) {
		let node : AtomNode<T> = this;
		for( let relPath = fullPath.slice( this.fullPath.length ), rLen = relPath.length, r = 0; r < rLen; r++ ) {
			node = node.branches[ relPath[ r ] ];
			if( !node ) { return null }
		}
		if( node === this ) { return null }
		return node;
	}

	/**
	 * produces the first occupied child or descendant
	 * nodes containing `atomNode`s across breadth-wise.
	 * @example
	 * considering the following root node, an array of 
	 * the asteriked nodes will be returned.
	 * ...............1
	 * ...............|    
	 * .....---------------------
	 * .....|         |         |
	 * .....0         0         1*              
	 * ..../ \       / \       / \
	 * ...0   1*    0   1*    1   0
	 * ............/               \
	 * ...........1*                1
	 */
	private _findNearestDescendants() {
		const nearestDescendants : Array<AtomNode<T>> = [];
		( function searchDescendants( _node : AtomNode<T> ) {
			for( const b in _node.branches ) {
				_node.branches[ b ].isActive
					? nearestDescendants.push( _node.branches[ b ] )
					: searchDescendants( _node.branches[ b ] );
			}
		} )( this );
		return nearestDescendants;
	}

	private _findNodeAt( fullPath : Array<string> ) {
		const thisFullPath = this.fullPath;
		const diffLen = thisFullPath.length - fullPath.length;
		if( diffLen < 0 ) {
			if( !isAPrefixOfB( thisFullPath, fullPath ) ) { return null }
			return this._findDescendantAt( fullPath );
		}
		if( !isAPrefixOfB( fullPath, thisFullPath ) ) { return null }
		if( !diffLen ) { return this }
		let node : AtomNode<T> = this;
		for( let p = diffLen; p--; ) { node = node._head }
		return node;
	}

	private _retainUnchangedDescendants( previouRootAtomValue : T ) {
		const taskArgs : Array<[ AtomNode<T>, Array<string> ]> = [];
		for( let unchangedNodes = this._curateUnchangedAtoms( previouRootAtomValue ), uLen = unchangedNodes.length, u = 0; u < uLen; u++ ) {
			const { pathToRootAtom, rootAtomNode } = unchangedNodes[ u ];
			makePathWriteable( rootAtomNode._sectionData, pathToRootAtom, true );
			set(
				rootAtomNode._sectionData,
				pathToRootAtom,
				get( previouRootAtomValue, pathToRootAtom )._value
			);
			taskArgs.push([ rootAtomNode, pathToRootAtom ]);
		}
		while( taskArgs.length ) {
			const args = taskArgs.pop();
			makePathReadonly( args[ 0 ]._sectionData, args[ 1 ] );
		}
	}
}

export default AtomNode;

function activeNodesOnly<C>( method: Function, context: C ) {
    return function ( this: AtomNode<any>, ...args: Array<any> ) {
        if( !this.isActive ) {
			throw new Error(
				'applicable only to nodes containing atoms: assert via a `this.isActive` check.'
			);
		}
        return method.apply( this, args );
    };
}

/** makes path in `source` readonly */
function makePathReadonly<T extends Value>(
	source : T,
	path : Array<string>,
	endAtClosestReadonlyAncestor = false
 ) {
	let { _value : data, exists } = get( source, path );
	if( !exists ) { return }
	for( let p = path.length; p--; ) {
		data = data[ path[ p ] ];
		if( !Object.isFrozen( data ) ) {
			Object.freeze( data );
			continue;
		}
		if( endAtClosestReadonlyAncestor ) { return }
	}
}

function makePathWriteable<T extends Value>(
	source : T,
	path : Array<string>,
	startAtClosestWriteableAncestor = false
 ) {
	let { _value : target, exists } = get( source, path );
	if( !exists ) { return }
	if( Object.isFrozen( source ) ) {
		source = shallowCopy( source ) as T
	}
	let p = -1;
	while( source !== target ) {
		const key = path[ ++p ];
		if( Object.isFrozen( source[ key ] ) ) {
			source[ key ] = shallowCopy( source[ key ] );
		} else if( startAtClosestWriteableAncestor ) { return }
		source = source[ key ] as T;
	} 
}

function shallowCopy( data : unknown ) : unknown {
	if( Array.isArray( data ) ) {
		return [ ...data ];
	}
	try {
		return { ...data as {} };
	} catch( e ) {
		return data;
	}
}
