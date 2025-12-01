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
	isString,
	makeReadonly,
	set,
	shallowCopy
} from '../../../../../utils';

import PathsRepo from '../../paths';

import Atom from '../../../../atom';

const N_EXIST = Symbol( 'DOES NOT EXIST' );

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
		pathSource && this._activateWith(
			pathSource, origin, rootAtomNode
		);
	}

	get branches() { return this._branches }
	@activeNodesOnly
	get fullPath() {
		if( this._key === GLOBAL_SELECTOR ) { return [ this._key ] }
		return this._fullPathRepo.getPathTokensAt( this._fullPathId );
	}
	get isActive() { return !!this._atom }
	get isLeaf() { return !Object.keys( this._branches ).length }
	get isRoot() { return !this._head }
	@activeNodesOnly
	get isRootAtom() { return  this === this._rootAtomNode }
	get key() { return this._key }
	@activeNodesOnly
	get rootAtomNode() { return this._rootAtomNode }
	/** applicable only to nodes containing atoms: assert via a `this.isActive` check. */
	@activeNodesOnly
	get value() : Readonly<T> {
		return this.isRootAtom
			? this._sectionData
			: get(
				this._rootAtomNode._sectionData,
				this._pathToRootAtom
			)._value as Readonly<T>;
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
	set value( v : T ) {
		const previousRootAtomValue = shallowCopy( this._rootAtomNode.value );
		let isInit = false;
		if( this.isRootAtom ) {
			this._sectionData = v;
			isInit = true;
		} else {
			let sData = this._rootAtomNode._sectionData;
			isInit = typeof sData === 'undefined' || sData === null;
			this._rootAtomNode._sectionData = set(
				this._rootAtomNode._sectionData,
				this._pathToRootAtom,
				v
			) as Readonly<T>;
		}
		this._retainUnchangedDescendants( previousRootAtomValue as T );
		if( isInit ) {
			makeReadonly( this._rootAtomNode._sectionData );
			return;
		}
		let data = this._rootAtomNode._sectionData as T;
		for( let keys = this._pathToRootAtom, kLen = keys.length, k = 0; k < kLen; k++ ) {
			const key = keys[ k ];
			if( !Object.isFrozen( data[ key ] ) ) {
				Object.freeze( data[ key ] );
			}
			data = data[ key ] as T;
		}
		makeReadonly( data[ this._pathToRootAtom.at( -1 ) ] );
		this._rootAtomNode._sectionData = data;
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
			return node._activateWith({
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
				return node._addActiveDescendantNodeAt( sanitizedPathId );
			}
			node._branches[ key ] = new AtomNode<T>( key, node );
			node = node._branches[ key ];
		}
		key = fullPath.at( -1 );
		const pathSource = { dottedPathId: sanitizedPathId, pathRepo };
		if( key in node._branches ) {
			return node._branches[ key ]._activateWith( pathSource, origin );
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
		this.isLeaf ? this._destroy() : this._deactivate();
	}
	
	/**
	 * This method allow user, from any node, to call set the value of an atom bearing node residing at or near the fullPath.\
	 * Not to be confused with the value setter property which must be called on an atom bearing node to assign it a new value.
	 * 
	 * @param {Array<string>} fullPath - the complete path tokens corresponding to the property location in the overall data object
	 * @param {T} value - a change object residing at this path of type Partial<typeof overall data object>
	 */
	setValueAt( fullPath : Array<string>, value : T ) {
		let node = this._findRoot();
		if( fullPath[ 0 ] === GLOBAL_SELECTOR ) {
			if( node.isActive ) {
				node.value = value;
				return;
			}
			for( let dNodes = node._findNearestActiveDescendants(), d = dNodes.length; d--; ) {
				dNodes[ d ].value = get( value, dNodes[ d ].fullPath )._value as T;
			}
			return;
		}
		const fullPathLen = fullPath.length;
		// istanbul ignore next
		let activeNode : AtomNode<T> = node.isActive ? node : null;
		for( let f = 0; f < fullPathLen; f++ ) {
			const key = fullPath[ f ];
			if( !( key in node._branches ) ) { break }
			node = node._branches[ key ];
			if( node.isActive ) { activeNode = node }
		}
		if( !activeNode ) {
			if( node.isRoot ) { return }
			for( let dNodes = node._findNearestActiveDescendants(), d = dNodes.length; d--; ) {
				// istanbul ignore next
				if( !dNodes[ d ].isRootAtom ) { continue }
				dNodes[ d ].value = get( value, dNodes[ d ].fullPath.slice( fullPathLen ) )._value as T;
			}
			return;
		}
		const nodePathLen = activeNode.fullPath.length;
		if( fullPathLen === nodePathLen ) {
			activeNode.value = value;
			return;
		}
		activeNode.value = set(
			activeNode.value,
			fullPath.slice( nodePathLen ),
			get( value, fullPath )._value
		) as T;
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
	private _activateWith(
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
		this._sectionData = cloneDeep( this.isRoot ? origin : get( origin, this.fullPath )._value );
		for( let descNodes = this._findNearestActiveDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._adjustToNewAtomNode( this );
		}
		this._rootAtomNode = this;
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
		node._branches[ key ]._activateWith({ 
			dottedPathId: sanitizedPathId,
			pathRepo: this._fullPathRepo
		}, undefined, this._rootAtomNode );
	}

	private _adjustToNewAtomNode( newRootAtomNode : AtomNode<T> ) {
		this._rootAtomNode = newRootAtomNode;
		this._pathToRootAtom = this.fullPath.slice( newRootAtomNode.fullPath.length );
		if( this.isLeaf ) { return }
		for( let descNodes = this._findNearestActiveDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._adjustToNewAtomNode( this.rootAtomNode );
		}
	}

	private _convertToRootAtomNodeFrom( oldRootAtomNode : AtomNode<T>  ) {
		this._sectionData = get( oldRootAtomNode._sectionData, this._pathToRootAtom )._value as T;
		this._rootAtomNode = this;
		this._pathToRootAtom = [];
		if( this.isLeaf ) { return }
		for( let descNodes = this._findNearestActiveDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
			descNodes[ d ]._adjustToNewAtomNode( this );
		}	
	}

	private _deactivate() {
		if( this.isRootAtom ) {
			for( let descNodes = this._findNearestActiveDescendants(), dLen = descNodes.length, d = 0; d < dLen; d++ ) {
				descNodes[ d ]._convertToRootAtomNodeFrom( this );
			}
		}
		this._atom = undefined;
		this._fullPathId = undefined;
		this._fullPathRepo = undefined;
		this._pathToRootAtom = [];
		this._rootAtomNode = undefined;
		this._sectionData = undefined;
	}

	/** handling removal of node. - discarding all dangling leaf nodes leading up to it. */
	private _destroy() {
		// istanbul ignore next
		if( this.isRoot ) { return }
		let head = this._head;
		delete head._branches[ this._key ];
		!head.isActive && head.isLeaf && head._destroy();
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
		const atomNode = this;
		const _sectionData = !atomNode.isRootAtom
			? atomNode._rootAtomNode._sectionData
			: atomNode._sectionData;
		( function foundAndRestoredUnhanged<T>(
			propValue : T,
			prevValue : T,
			propPath : Array<string>
		) {
			if( isString( propValue ) ) { return propValue === prevValue }
			// istanbul ignore next
			const keys = Object.keys( propValue ?? 0 );
			const len = keys.length;
			const pLen = Object.keys( prevValue ?? 0 ).length;
			// istanbul ignore if
			if( !len ) {
				return pLen
					? false
					: ( isPlainObject( prevValue ) && isPlainObject( propValue ) ) ||
						( Array.isArray( prevValue ) && Array.isArray( propValue ) ) ||
						prevValue === propValue;
			}
			let allEqual = len === pLen;
			for( const k of keys ) {
				const path = [ ...propPath, k ];
				const prevVal = prevValue?.[ k ] ?? N_EXIST;
				let _eq = foundAndRestoredUnhanged( propValue[ k ], prevVal, path );
				if( !_eq ) {
					allEqual = false;
				} else {
					set( _sectionData, path, prevVal );
				}
			}
			return  allEqual;
		} )(
			atomNode.value,
			previousRootAtomValue,
			atomNode._pathToRootAtom
		);
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
