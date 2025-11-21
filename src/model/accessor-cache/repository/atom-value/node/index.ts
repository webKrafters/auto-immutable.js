import type { KeyType, Value } from '../../../../..';

export interface FullPathSource {
	dottedPathId: number;
	pathRepo: PathsRepo;
};

import get from '@webkrafters/get-property';
import cloneDeep from '@webkrafters/clone-total';

import { GLOBAL_SELECTOR } from '../../../../..';

import {
	isAPrefixOfB,
	isPlainObject,
	set,
	shallowCopy
} from '../../../../../utils';

import PathsRepo from '../../paths';

import Atom from '../../../../atom';

class AtomNode<T extends Value>{

	static createRoot<T extends Value>() { return new AtomNode<T>( GLOBAL_SELECTOR, null ) }

	private _atom : Atom;
	private _branches : Record<KeyType, AtomNode<T>> = {};
	private _fullPathId : number;
	private _fullPathRepo : PathsRepo; 
	private _head : AtomNode<T>;
	private _key : KeyType;
	private _pathToRootAtom : Array<string> = [];
	private _rootAtomNode : AtomNode<T>;
	private _sectionData : Readonly<T>;
	/**
	 * @param {AtomNode<T>} key - property name
	 * @param {AtomNode<T>} head - parent node
	 * @param {FullPathSource} [pathSource] - produces the property path tokens pointed to within the immutable data store.
	 * @param {AtomNode<T>} [rootAtomNode] - a root atom node whose this node is a descendant. Leave this `undefined` or `null` if this is a root node
	 * @param {T} [origin] - the immutable data store - Leave this `undefined` or `null` if this node is a descendant node
	 * @returns - `inactive node` when no propertyPaths supplied; add `rootAtomNode` or `origin` to obtain `descendantAtom` or `rootAtom` nodes respectively.
	 * @template {Value} T
	 */
	private constructor (
		key : KeyType,
		head : AtomNode<T>,
		pathSource : FullPathSource = null,
		rootAtomNode : AtomNode<T> = null, 
		origin : T = null
	) {
		this._head = head;
		this._key = key;
		pathSource && this._activateNodeWith(
			pathSource, origin, rootAtomNode
		);
	}

	get branches() { return this._branches }
	get fullPath() {
		if( this._key === GLOBAL_SELECTOR ) { return [ this._key ] }
		return this._fullPathRepo.getPathTokensAt( this._fullPathId );
	}
	get isActive() { return !!this._atom }
	get isLeaf() { return !Object.keys( this._branches ).length }
	get isRoot() { return !this._head }
	get isRootAtom() { return  this === this._rootAtomNode }
	get key() { return this._key }
	get rootAtomNode() { return this._rootAtomNode }
	/** applicable only to nodes containing atoms: assert via a `this.isActive` check. */
	@activeNodesOnly
	get value() {
		if( this.isRootAtom ) { return this._sectionData }
		return get(
			this._rootAtomNode._sectionData,
			this._pathToRootAtom
		)._value as Readonly<T>
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
		const previousRootAtomValue = shallowCopy( this._rootAtomNode.value );
		if( this.isRootAtom ) {
			this._sectionData = Object.freeze( v );
		} else {
			this._rootAtomNode._sectionData = set(
				this._rootAtomNode._sectionData,
				this._pathToRootAtom,
				v
			) as Readonly<T>;
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
		sanitizedPathId : number,
		pathRepo : PathsRepo,
		origin : T
	) {
		const fullPath = pathRepo.getPathTokensAt( sanitizedPathId );
		let node = this._findRoot();
		if( fullPath[ 0 ] === GLOBAL_SELECTOR ) {
			return node._activateNodeWith({
				dottedPathId: sanitizedPathId,
				pathRepo
			}, origin );
		}
		let key : KeyType;
		for( let tLen = fullPath.length - 1, t = 0; t < tLen; t++ ) {
			key = fullPath[ t ];
			if( key in node._branches ) {
				node = node._branches[ key ];
				if( !node.isActive ) { continue }
				return node._addAtomNodeAt( sanitizedPathId, origin );
			}
			node._branches[ key ] = new AtomNode<T>( key, node );
			node = node._branches[ key ];
		}
		key = fullPath.at( -1 );
		const pathSource = { dottedPathId: sanitizedPathId, pathRepo };
		if( key in node._branches ) {
			return node._branches[ key ]._activateNodeWith( pathSource, origin );
		}
		node._branches[ key ] = new AtomNode<T>( key, node, pathSource, undefined, origin );
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
		head._branches[ key ] = new AtomNode( key, head );
		head._branches[ key ]._branches = this._branches;
		if( !this.isRootAtom ) { return }
		for( let descNodes = head._branches[ key ]._findNearestActiveDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._convertToRootAtomNode();
		}
	}
	
	/**
	 * This method allow user, from any node, to call set the value of an atom bearing node residing at or near the fullPath.\
	 * Not to be confused with the value setter property which must be called on an atom bearing node to assign it a new value.
	 * 
	 * @param {Array<string>} fullPath - the complete path tokens corresponding to the property location in the overall data object
	 * @param {Readonly<T>} value - a change object of type Partial<typeof overall data object>
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
		if( !activeNode ) {
			if( node.isRoot ) { return }
			for( let dNodes = node._findNearestActiveDescendants(), d = dNodes.length; d--; ) {
				if( !dNodes[ d ].isRootAtom ) { continue }
				dNodes[ d ].value = get( value, dNodes[ d ].fullPath )._value as Readonly<T>;
			}
			return;
		}
		const nodePathLen = activeNode.fullPath.length;
		if( fullPath.length <= nodePathLen ) {
			activeNode.value = get( value, fullPath )._value as Readonly<T>;
			return;
		}

		// @debug
		console.info( 'are we here ???? new value  >> ', get( value, fullPath )._value );
			
		activeNode.value = set(
			activeNode.value,
			fullPath.slice( nodePathLen ),
			get( value, fullPath )._value
		) as Readonly<T>;
	}

	/** applicable only to nodes containing atoms: assert via a `this.isActive` check. */
	@activeNodesOnly
	private _addAtomNodeAt( sanitizedPathId : number, origin : T ) {
		const fullPath = this._fullPathRepo.getPathTokensAt( sanitizedPathId );
		if( isAPrefixOfB( this.fullPath, fullPath ) ) {
			return this._addActiveDescendantNodeAt( sanitizedPathId );
		}
		if( isAPrefixOfB( fullPath, this.fullPath ) ) {
			return this._addAncestorAtomNodeAt( sanitizedPathId, origin );
		}
		throw new Error( `\`fullPath\` argument must either be \`["${ GLOBAL_SELECTOR }"]\` a prefix or suffix of the \`fullPath\` of this node.` );
	}

	/**
	 * applicable only to nodes containing atoms: assert
	 * via a `this.isActive` check.
	 * 
	 * @param {number} sanitizedPathId - must be an id to a path in pathRepo which is prefix of and shorter than `this.fullPath`
	 */
	@activeNodesOnly
	private _addAncestorAtomNodeAt( sanitizedPathId : number, origin : T ) : void {
		if( !this.isRootAtom ) {
			return this.rootAtomNode._addAncestorAtomNodeAt( sanitizedPathId, origin );
		}
		const fullPath = this._fullPathRepo.getPathTokensAt( sanitizedPathId );
		let isNewRootAtom = isAPrefixOfB( fullPath, this.fullPath );
		if( isNewRootAtom && fullPath.length === this.fullPath.length ) { return }
		const pathInfo = {
			dottedPathId: sanitizedPathId,
			pathRepo: this._fullPathRepo
		};
		let node = this._findNodeAt( fullPath );
		const key = fullPath.at( -1 );
		if( !isNewRootAtom ) {
			node._head._branches[ key ] = new AtomNode<T>(
				key, node._head, pathInfo, this.rootAtomNode
			);
			node._head._branches[ key ]._branches = node._branches;
			return;
		}
		node._head._branches[ key ] = new AtomNode<T>(
			key, node._head, pathInfo, undefined, origin
		);
		node._head._branches[ key ]._branches = node._branches;
		node = node._head._branches[ key ];
		for( let descNodes = this._findNearestActiveDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._adjustToNewAtomNode( node );
		}
	}

	/**
	 * applicable only to nodes containing atoms: assert
	 * via a `this.isActive` check.
	 * 
	 * @param {number} sanitizedPathId - must be an id to path with is suffix of and longer than `this.fullPath`
	 */
	@activeNodesOnly
	private _addActiveDescendantNodeAt( sanitizedPathId :number ) {
		const fullPath = this._fullPathRepo.getPathTokensAt( sanitizedPathId );
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
				node._branches[ key ] = new AtomNode<T>( key, node );
			}
			node = node._branches[ key ];
		}
		const key = fullPath.at( -1 );
		if( !( key in node._branches ) ) {
			node._branches[ key ] = new AtomNode<T>( key, node, { 
				dottedPathId: sanitizedPathId,
				pathRepo: this._fullPathRepo
			}, this._rootAtomNode );
			return;
		}
		!node._branches[ key ].isActive &&
		node._branches[ key ]._activateNodeWith({ 
			dottedPathId: sanitizedPathId,
			pathRepo: this._fullPathRepo
		}, undefined, this._rootAtomNode );
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
	private _activateNodeWith(
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
		rootAtomNode._sectionData = set(
			rootAtomNode._sectionData,
			this._pathToRootAtom,
			this._sectionData
		) as Readonly<T>;
		this._sectionData = null;
	}

	private _convertToRootAtomNode() {
		this._rootAtomNode = this;
		this._pathToRootAtom = [];
		for( let descNodes = this._findNearestActiveDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._adjustToNewAtomNode( this );
		}	
	}

	private _curateUnchangedAtoms( previousRootAtomValue : T ){
		const rootAtomNode = this._rootAtomNode;
		const nextRootAtomValue = rootAtomNode._sectionData;
		const curatedNodes = new Set<AtomNode<T>>();
		let atomNode : AtomNode<T>;

		// @debug
		// console.info( 'previous Root Atom Value >>>>> ', previousRootAtomValue );
		// console.info( 'next Root Atom Value >>>>> ', nextRootAtomValue );
		// console.info();
			

		( function areEqual( pVal : T, nVal : Readonly<T>, path : Array<string> ) {


			
					

			// @debug
			console.info( 'in here with .....', pVal, ' .... ', nVal );


			const nLen = Object.keys( nVal ?? 0 ).length;
			const pLen = Object.keys( pVal ?? 0 ).length;
			if( !pLen || !nLen ) {
				if( !pLen && !nLen && (
					pVal === nVal ||
					( isPlainObject( pVal ) && isPlainObject( nVal ) ) || 
					( Array.isArray( pVal ) && Array.isArray( nVal ) ) 
				) ) {
					atomNode = rootAtomNode._findNodeAt( path );
					atomNode && curatedNodes.add(
						!atomNode.isActive
							? atomNode._findClosestActiveAncestor()
							: atomNode
					);
					return true;
				}

				// @debug
				console.info( 'returning here .....', pVal, ' .... ', nVal );

				return false;
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
			atomNode = rootAtomNode._findNodeAt( path );
			atomNode && curatedNodes.add(
				!atomNode.isActive
					? atomNode._findClosestActiveAncestor()
					: atomNode
			);
			return true;
		} )( previousRootAtomValue, nextRootAtomValue, [] );

		// @debug
		console.info( 'found curated nodes >>>>> ', curatedNodes );
		console.info( '.'.repeat( 33 ) );
		console.info();

		return curatedNodes;
	}

	/** handling removal of node. - discarding all dangling leaf nodes leading up to it. */
	private _destroy() {
		if( this.isRoot ) { return }
		let head = this._head;
		delete head._branches[ this._key ];
		!head.isActive && head.isLeaf && head._destroy();
	}

	/** produces the closest `atomNode` ancestor to this node. */
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
			node = node._branches[ key ];
		}
		return node;
	}

	private _findRoot() {
		let head = this as AtomNode<T>;
		while( !head.isRoot ) { head = head._head }
		return head;
	}

	private _retainUnchangedDescendants( previousRootAtomValue : T ) {
		for( const { _pathToRootAtom, rootAtomNode } of this._curateUnchangedAtoms( previousRootAtomValue ) ) {
			
			// @debug
			// makePathWriteable({ value: rootAtomNode._sectionData, path: _pathToRootAtom });
			console.info( 'we are here with path to root atom >>>>> ', _pathToRootAtom );
			const a = get( this._rootAtomNode._sectionData, _pathToRootAtom )._value;
			const b = get( previousRootAtomValue, _pathToRootAtom )._value;
			console.info( 'has equal values >>>>>> ', a === b, ' ---- ', a, ' ---- ', b );

			rootAtomNode._sectionData = set(
				rootAtomNode._sectionData,
				_pathToRootAtom,
				get( previousRootAtomValue, _pathToRootAtom )._value
			) as Readonly<T>;
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
