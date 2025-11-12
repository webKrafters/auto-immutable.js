import { GLOBAL_SELECTOR, type Value } from '../../../..';

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

class AtomNode<T extends Value>{

	static createRoot<T extends Value>() { return new AtomNode<T>( null ) }

	private _atom : Atom = null;
	private _branches : Record<string, AtomNode<T>> = {};
	private _fullPathId : number = null;
	private _fullPathRepo : PathsRepo = null; 
	private _head : AtomNode<T> = null;
	private _pathToRootAtom : Array<string> = [];
	private _rootAtomNode : AtomNode<T> = null;
	private _sectionData : Readonly<T> = null;
	/**
	 * @param {AtomNode<T>} head - parent node
	 * @param {FullPathSource} [pathSource] - produces the property path tokens pointed to within the immutable data store.
	 * @param {AtomNode<T>} [rootAtomNode] - a root atom node whose this node is a descendant. Leave this `undefined` or `null` if this is a root node
	 * @param {T} [origin] - the immutable data store - Leave this `undefined` or `null` if this node is a descendant node
	 * @returns - `inactive node` when no propertyPaths supplied; add `rootAtomNode` or `origin` to obtain `descendantAtom` or `rootAtom` nodes respectively.
	 * @template {Value} T
	 */
	private constructor (
		head : AtomNode<T>,
		pathSource : FullPathSource = null,
		rootAtomNode : AtomNode<T> = null, 
		origin : T = null
	) {
		this._head = head;
		pathSource && this._activateNodeWith(
			pathSource, origin, rootAtomNode
		);
	}

	get branches() { return this._branches }
	get fullPath() { return this._fullPathRepo.getPathTokensAt( this._fullPathId ) }
	get isActive() { return !!this._atom }
	get isLeaf() { return !Object.keys( this._branches ).length }
	get isRoot() { return !this._head }
	get isRootAtom() { return  this === this._rootAtomNode }
	get rootAtomNode() { return this._rootAtomNode }
	/** applicable only to nodes containing atoms: assert via a `this.isActive` check. */
	@activeNodesOnly
	get value() {
		return !this.isRootAtom
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
		if( this.isRootAtom ) {
			this._rootAtomNode.value = v;
		} else {
			makePathWriteable( this._rootAtomNode.value, this._pathToRootAtom, true );
			set( this._rootAtomNode.value, this._pathToRootAtom, v );
		}
		this._retainUnchangedDescendants( previousRootAtomValue );
	}

	/**
	 * applicable only to nodes containing atoms: assert via a `this.isActive` check.
	 * @returns {number} Number of accessors remaining 
	 */
	@activeNodesOnly
	addAccessor( accessorId : number ) { return this._atom.connect( accessorId ) }

	/** applicable only to nodes containing atoms: assert via a `this.isActive` check. */
	findActiveNodeAt( fullPath : Array<string> ) {
		const node = this._findNodeAt( fullPath );
		return node?.isActive ? node : null;
	}

	insertAtomAt(
		fullPath : Array<string>,
		pathRepo : PathsRepo,
		origin : T
	) {
		let node = this._findRoot();
		if( fullPath[ 0 ] === GLOBAL_SELECTOR ) {
			return node._activateNodeWith({
				dottedPathId: this._fullPathRepo.getPathInfoAt( GLOBAL_SELECTOR ).sanitizedPathId,
				pathRepo
			}, origin );
		}
		for( let tLen = fullPath.length - 1, t = 0; t < tLen; t++ ) {
			const key = fullPath[ t ];
			if( key in node.branches ) {
				node = node.branches[ key ];
				if( !node.isActive ) { continue }
				return node._addAtomNodeAt( fullPath, origin );
			}
			node.branches[ key ] = new AtomNode<T>( node );
			node = node.branches[ key ];
		}
		node.branches[ fullPath.at( -1 ) ] = new AtomNode<T>( node, {
			dottedPathId: pathRepo.getPathInfoAt( fullPath.join( '.' ) ).sanitizedPathId,
			pathRepo
		}, undefined, origin );
	}

	/**
	 * applicable only to nodes containing atoms: assert via a `this.isActive` check.
	 * @returns {number} Number of accessors remaining 
	 */
	@activeNodesOnly
	removeAccessor( accessorId : number ) { return this._atom.disconnect( accessorId ) }

	/** applicable only to nodes containing atoms: assert via a `this.isActive` check. */
	@activeNodesOnly
	remove() {
		if( this.isLeaf ) { return this._destroy() }
		const key = this.fullPath.at( -1 );
		let head = this._head;
		head._branches[ key ] = new AtomNode( head );
		head._branches[ key ]._branches = this._branches;
		if( !this.isRootAtom ) { return }
		for( let descNodes = head._branches[ key ]._findNearestActiveDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._convertToRootAtomNode();
		}
	}
	
	/**
	 * This value change propagates through descendant atoms. To avoid redundant
	 * operations, it is advisable to call this once on any node within a
	 * rootAtomNode section.
	 * 
	 * @param {Array<string>} fullPath - a path in node to set: must be a suffix of and longer than `this.fullPath`
	 * @param value
	 */
	setValueAt( fullPath : Array<string>, value : Readonly<T> ) {
		let node = this._findRoot();
		if( fullPath[ 0 ] === GLOBAL_SELECTOR ) {
			if( node.isActive ) {
				node.value = value;
				return;
			}
			for( let dNodes = node._findNearestActiveDescendants(), d = dNodes.length; d--; ) {
				dNodes[ d ].value = get( value, dNodes[ d ].fullPath )._value as Readonly<T>;
			}
			return;
		}
		let activeNode : AtomNode<T> = node.isActive ? node : null;
		for( let fLen = fullPath.length, f = 0; f < fLen; f++ ) {
			const key = fullPath[ f ];
			if( !( key in node._branches ) ) { break }
			node = node._branches[ key ];
			if( node.isActive ) { activeNode = node }
		}
		if( !activeNode ) { return }
		const nodePathLen = activeNode.fullPath.length;
		if( fullPath.length === nodePathLen ) {
			activeNode.value = value;
			return;
		}
		if( fullPath.length < nodePathLen ) {
			activeNode.value = get( value, activeNode.fullPath )._value as Readonly<T>;
			return;
		}
		const _newValue = shallowCopy( activeNode.value ) as T;
		const relPath = fullPath.slice( nodePathLen );
		makePathWriteable( _newValue, relPath );
		set( _newValue, relPath, get( value, fullPath )._value );
		activeNode.value = _newValue;
	}

	/** applicable only to nodes containing atoms: assert via a `this.isActive` check. */
	@activeNodesOnly
	private _addAtomNodeAt( fullPath : Array<string>, origin : T ) {
		if( isAPrefixOfB( this.fullPath, fullPath ) ) {
			return this._addActiveDescendantNodeAt( fullPath );
		}
		if( isAPrefixOfB( fullPath, this.fullPath ) ) {
			return this._addAncestorAtomNodeAt( fullPath, origin );
		}
		throw new Error( `\`fullPath\` argument must either be \`["${ GLOBAL_SELECTOR }"]\` a prefix or suffix of the \`fullPath\` of this node.` );
	}

	/**
	 * applicable only to nodes containing atoms: assert
	 * via a `this.isActive` check.
	 * 
	 * @param {Array<string>} fullPath - must be a prefix of and shorter than `this.fullPath`
	 */
	@activeNodesOnly
	private _addAncestorAtomNodeAt( fullPath : Array<string>, origin : T ) {
		if( this.isRootAtom ) {
			/* ------- */
			let isNewRootAtom = isAPrefixOfB( fullPath, this.fullPath );
			if( isNewRootAtom && fullPath.length === this.fullPath.length ) { return }
			let node = this._findNodeAt( fullPath );
			const key = fullPath.at( -1 );
			if( !isNewRootAtom ) {
				node._head._branches[ key ] = new AtomNode<T>( node._head, {
					dottedPathId: this._fullPathRepo.getPathInfoAt( fullPath.join( '.' ) ).sanitizedPathId,
					pathRepo: this._fullPathRepo
				}, this.rootAtomNode );
				node._head._branches[ key ]._branches = node._branches;
				return;
			}
			node._head._branches[ key ] = new AtomNode<T>( node._head, {
				dottedPathId: this._fullPathRepo.getPathInfoAt( fullPath.join( '.' ) ).sanitizedPathId,
				pathRepo: this._fullPathRepo
			}, undefined, origin );
			node._head._branches[ key ]._branches = node._branches;
			node = node._head._branches[ key ];
			for( let descNodes = this._findNearestActiveDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
				descNodes[ d ]._adjustToNewAtomNode( node );
			}
			/* ------- */
			return;
		}
		return this.rootAtomNode._addAncestorAtomNodeAt( fullPath, origin );
	}

	/**
	 * applicable only to nodes containing atoms: assert
	 * via a `this.isActive` check.
	 * 
	 * @param {Array<string>} fullPath - must be a suffix of and longer than `this.fullPath`
	 */
	@activeNodesOnly
	private _addActiveDescendantNodeAt( fullPath : Array<string> ) {
		let node = this.rootAtomNode;
		for(
			let pathToRootAtom = fullPath.slice( this.fullPath.length ),
				ancestorLen =  pathToRootAtom.length - 1,
				p = 0;
			p < ancestorLen;
			p++
		) {
			const key = pathToRootAtom[ p ];
			if( !( key in node._branches ) ) {
				node._branches[ key ] = new AtomNode<T>( node );
			}
			node = node._branches[ key ];
		}
		const key = fullPath.at( -1 );
		if( key in node._branches ) {
			!node._branches[ key ].isActive &&
			node._branches[ key ]._activateNodeWith({ 
				dottedPathId: this._fullPathRepo.getPathInfoAt( fullPath.join( '.' ) ).sanitizedPathId,
				pathRepo: this._fullPathRepo
			}, undefined, this._rootAtomNode );
			return;
		}
		node._branches[ key ] = new AtomNode<T>( node, { 
			dottedPathId: this._fullPathRepo.getPathInfoAt( fullPath.join( '.' ) ).sanitizedPathId,
			pathRepo: this._fullPathRepo
		}, this._rootAtomNode );
	}
	
	/**
	 * Activates existing inactive nodes. Inactive nodes are
	 * simply connective nodes linking active atom nodes.
	 * 
	 * @param {FullPathSource} pathSource
	 * @param {T} origin - not needed if creating active descendant atom node.
	 * @param {AtomNode<T>} [rootAtomNode] - leave empty if creating active descendant atom node.
	 * @template T
	 */
	_activateNodeWith(
		{ dottedPathId, pathRepo } : FullPathSource,
		origin : T,
		rootAtomNode : AtomNode<T> = null
	) {
		this._atom = new Atom();
		this._fullPathRepo = pathRepo;
		this._fullPathId = dottedPathId;
		if( !!rootAtomNode ) { // for creating an active descedant atom node
			this._rootAtomNode = rootAtomNode;
			this._pathToRootAtom = this.fullPath.slice( rootAtomNode.fullPath.length );
			return;
		}
		this._sectionData = cloneDeep( get( origin, this.fullPath )._value );
		for( let descNodes = this._findNearestActiveDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._adjustToNewAtomNode( this );
		}
		this._rootAtomNode = this;
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
		for( let descNodes = this._findNearestActiveDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._adjustToNewAtomNode( this );
		}	
	}

	private _curateUnchangedAtoms( previouRootAtomValue : T ){
		const rootAtomNode = this._rootAtomNode;
		const nextRootAtomValue = rootAtomNode._sectionData;
		const curatedNodes = new Set<AtomNode<T>>();
		( function areEqual( pVal : T, nVal : Readonly<T>, path : Array<string> ) {
			const nLen = Object.keys( nVal ?? 0 ).length;
			const pLen = Object.keys( pVal ?? 0 ).length;
			if( !pLen || !nLen ) {
				if( pVal !== nVal ) { return false }
				curatedNodes.add( rootAtomNode._findNodeAt( path )._findClosestActiveAncestor() );
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
			curatedNodes.add( rootAtomNode._findNodeAt( path )._findClosestActiveAncestor() );
			return true;
		} )( previouRootAtomValue, nextRootAtomValue, [] );
		return curatedNodes;
	}

	/** handling removal of node. - discarding all dangling leaf nodes leading up to it. */
	_destroy() {
		if( this.isRoot ) { return }
		let head = this._head;
		delete head._branches[ this.fullPath.at( -1 ) ];
		!head.isActive && head.isLeaf && head._destroy();
	}

	/** produces the closest `atomNode` ancestor to the `propertyPath` tokens provided. */
	private _findClosestActiveAncestor() : AtomNode<T> {
		if( this.isRoot ){ return null }
		let node : AtomNode<T> = this;
		do{
			node = node._head;
			if( node.isActive ) { return node }
		} while( !node.isRoot )	;
		return null;
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
	private _findNearestActiveDescendants() {
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
		let node = this._findRoot();
		if( fullPath[ 0 ] === GLOBAL_SELECTOR ) { return node }
		for( let fLen = fullPath.length, f = 0; f < fLen; f++ ) {
			const key = fullPath[ f ];
			if( !( key in node._branches ) ) { return null }
			node = node.branches[ key ];
		}
		return node;
	}

	private _findRoot() {
		let head = this as AtomNode<T>;
		if( !head.isRoot ) { head = head._head }
		return head;
	}

	private _retainUnchangedDescendants( previouRootAtomValue : T ) {
		const taskArgs : Array<[ AtomNode<T>, Array<string> ]> = [];
		for( const { _pathToRootAtom, rootAtomNode } of this._curateUnchangedAtoms( previouRootAtomValue ) ) {
			makePathWriteable( rootAtomNode._sectionData, _pathToRootAtom, true );
			set(
				rootAtomNode._sectionData,
				_pathToRootAtom,
				get( previouRootAtomValue, _pathToRootAtom )._value
			);
			taskArgs.push([ rootAtomNode, _pathToRootAtom ]);
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
