import {
	Tag,
	TagType,
	type AccessorPayload,
	type AccessorResponse,
	type Changes,
	type ChangeInfo,
	type UpdatePayload,
	type UpdatePayloadArray,
	type UpdatePayloadArrayCore,
	type UpdatePayloadArrayCoreCloneable,
	type UpdatePayloadCore,
	type UpdatePayloadCoreCloneable,
	type Value
} from '../..';

interface AtomChangeInfo {
	atomRepoNode : DescendantNode<Value>;
	incomingChangePath : Array<string>;
}

interface AtomDataEntryNode<T extends Value> {}

interface HeadNode<T extends Value> extends AtomDataEntryNode<T>{
	entries : {
		[ key : string ]: BaseEntryNode<T>
	};
}

interface BaseEntryNode<T extends Value> extends AtomDataEntryNode<T> {
	entries : {
		[ key : string ]: BaseDescendantNode<T>
	};
	head : HeadNode<T>;
}
interface EntryNode<T extends Value> extends BaseEntryNode<T>{
	fullPath? : Array<string>;
	pathToRootAtom? : Array<string>;
	value : T;
}
interface BaseDescendantNode<T extends Value> extends AtomDataEntryNode<T> {
	entries : {
		[ key : string ]: BaseDescendantNode<T>
	};
	head : BaseDescendantNode<T>;
}
interface LeafDescendantNode<T extends Value> extends BaseDescendantNode<T> {
	fullPath? : Array<string>;
	pathToRootAtom? : Array<string>;
	value : Readonly<T>;
}
interface DescendantNode<T extends Value> extends BaseDescendantNode<T> {
	entries : {
		[ key : string ]: BaseDescendantNode<T>
	};
	fullPath? : Array<string>;
	pathToRootAtom? : Array<string>;
	value? : Readonly<T>;
}

interface PropertyOriginInfo {
	exists: boolean,
	value: any;
};

export interface TokenSearchNode {
	children : Map<string, TokenSearchNode>;
	pathNum? : number;
	head : TokenSearchNode;
	isPath? : boolean;
	value : AtomChangeInfo;
};

import set from 'lodash.set';

import clonedeep from '@webkrafters/clone-total';
import get from '@webkrafters/get-property';

import { makeReadonly } from '../../utils';

import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';
import isPlainObject from 'lodash.isplainobject';

import getProperty from '@webkrafters/get-property';

import { GLOBAL_SELECTOR } from '../../constants';

import Atom from '../atom';
import Accessor from '../accessor';

class AccessorCache<T extends Value> {
	private _accessors : {[propertyPaths: string]: Accessor} = {};
	private _atoms : AccessorPayload = {};

	private _valueRepo : AtomValueRepository<T>;

	/** @param origin - Value object reference from which slices stored in this cache are to be curated */
	constructor( origin : T ) { this._valueRepo = new AtomValueRepository( origin ) }

	get origin() { return this._valueRepo.origin }

	/** atomizes value property changes */
	atomize(
		changes : Readonly<ChangeInfo["changes"]>,
		paths : Readonly<ChangeInfo["paths"]>
	) : void {

		if( !paths.length ) { return }
		this._valueRepo.mergeChanges( changes, paths );

		// -----



		const accessors = this._accessors;
		const atoms = this._atoms;
		const updatedPathMap = {};
		let tags : Array<TagType>;
		for( const path in atoms ) {
			const { exists, value: newAtomVal } = this.getOriginAt( path );
			if( path !== GLOBAL_SELECTOR && exists && (
				newAtomVal === null || newAtomVal === undefined
			) ) {
				if( !tags ) { tags = Object.values( Tag ) }
				/* istanbul ignore next */
				if( !Array.isArray( changes ) ) {
					if( !getProperty( changes, path ).trail.length
						&& !tags.some( tag => tag in changes )
					) { continue }
				} else {
					let found = false;
					for( let i = changes.length; i--; ) {
						if( getProperty( changes, `${ i }.${ path }` ).trail.length
							|| tags.some( tag => tag in changes[ i ] )
						) {
							found = true;
							break;
						}
					}
					if( !found ) { continue }
				}
			}
			if( isEqual( newAtomVal, atoms[ path ].value ) ) { continue }
			atoms[ path ].setValue( newAtomVal );
			updatedPathMap[ path ] = true;
		}
		if( !Object.keys( updatedPathMap ).length ) { return }
		for( const k in accessors ) { accessors[ k ].outdatedPaths.push( ...Object.keys( updatedPathMap ) ) }
	}

	/**
	 * Gets value object slice from the cache matching the `propertyPaths`.\
	 * If not found, creates a new entry for the client from source, and returns it.
	 */
	get(
		clientId : string,
		...propertyPaths : Array<string>
	) : AccessorResponse {
		if( isEmpty( propertyPaths ) ) { propertyPaths = [ GLOBAL_SELECTOR ] }
		const cacheKey = JSON.stringify( propertyPaths );
		const accessor = cacheKey in this._accessors
			? this._accessors[ cacheKey ]
			: this.createAccessor( cacheKey, propertyPaths );
		!accessor.hasClient( clientId ) && accessor.addClient( clientId );
		return accessor.refreshValue( this._atoms );
	}

	/** Unlinks a consumer from the cache: performing synchronized value cleanup */
	unlinkClient( clientId : string ) {
		const accessors = this._accessors;
		const atoms = this._atoms;
		for( const k in accessors ) {
			const accessor = accessors[ k ];
			// istanbul ignore next
			if( !accessor.removeClient( clientId ) || accessor.numClients ) { continue }
			for( const p of accessor.paths ) {
				if( p in atoms && atoms[ p ].disconnect( accessor.id ) < 1 ) {
					delete atoms[ p ];
				}
			}
			delete accessors[ k ];
		}
	}

	/** Add new cache entry */
	private createAccessor(
		cacheKey : string,
		propertyPaths : Array<string>
	) : Accessor {
		const atoms = this._atoms;
		const accessor = new Accessor( propertyPaths );
		this._accessors[ cacheKey ] = accessor;
		for( const path of accessor.paths ) {
			if( !( path in atoms ) ) {
				atoms[ path ] = new Atom( this.getOriginAt( path ).value );
				
			}
		}
		return this._accessors[ cacheKey ];
	}

	private getOriginAt( propertyPath : string ) {
		return this._valueRepo.getOriginValueAt( propertyPath );
	}
}

export default AccessorCache;

export class AtomChangeInfoSet {
	private _collections = new Map<number, AtomChangeInfo>();
	private _data = new Map<string, TokenSearchNode>();
	private _currIdNum = -1;
	get size() { return this._collections.size }
	clear() {
		this._collections.clear();
		this._currIdNum = -1;
		this._data.clear();
	}
	add( nodeInfo : AtomChangeInfo ) {
		let data = this._data;
		let node : TokenSearchNode = null;
		for( let tokens = nodeInfo.incomingChangePath, tLen = tokens.length, t = 0; t < tLen; t++ ) {
			const token = tokens[ t ];
			!data.has( token ) && data.set( token, {
				children: new Map<string, TokenSearchNode>(),
				head: node,
				value: nodeInfo
			} );
			node = data.get( token );
			data = node.children;
		}
		if( node.isPath ) { return }
		node.isPath = true;
		node.pathNum = ++this._currIdNum;
		this._collections.set( node.pathNum, nodeInfo );
	}
	list() { return [ ...this._collections.values() ] }
}

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

class AtomValueRepository<T extends Value> {
	private _data : HeadNode<T> = { entries: {} };
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
		let rootAtomNode : DescendantNode<T>;
		let counter = 0;
		let currNode = this._data as DescendantNode<T>;
		while( counter < tokens.length ) {
			const currKey = tokens[ counter ];
			if( !( currKey in currNode.entries ) ) {
				currNode.entries[ currKey ] = {
					entries: {},
					head: currNode
				};
			} else if( !rootAtomNode && 'value' in currNode ) {
				rootAtomNode = currNode as DescendantNode<T>;
			}
			currNode = currNode.entries[ currKey ];
			counter++;
		}
		currNode.fullPath = tokens;
		if( !Object.keys( currNode.entries ).length ) {
			delete currNode.entries;
		}
		rootAtomNode
			? this.addDescendantAtomData( currNode as DescendantNode<T>, rootAtomNode )
			: this.addRootAtomData( currNode as DescendantNode<T> );
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
			: getProperty( this._origin, tokens );
	}

	mergeChanges(
		changes : Readonly<ChangeInfo["changes"]>,
		paths : Readonly<ChangeInfo["paths"]>
	) {
		let changedNodeInfoSet = new AtomChangeInfoSet();
		// let changedNodeInfoList : Array<AtomChangeInfo> = [];
		/* locate all atom nodes affected by changes */
		for( const tokens of paths ) {
			const changedNodeInfo = createAtomChangeInfo();
			const node = this._data as DescendantNode<Value>;
			while( 'entries' in node ) {
				for( const e in node.entries ) {
					const entryNode = node.entries[ e ] as DescendantNode<Value>;
					const entryPathTokens = entryNode.fullPath;
					if( isAPrefixOfB( entryPathTokens, tokens ) ) {
						changedNodeInfoSet.add((
							function verifyAtomNode( _node, _changedPathTokens ) {
								for( const _e in _node.entries ) {
									const _entryNode = _node.entries[ e ] as DescendantNode<Value>;
									const _entryPathTokens = _entryNode.fullPath;
									if( isAPrefixOfB( _changedPathTokens, _entryPathTokens ) ) {
										if( _changedPathTokens.length === _entryPathTokens.length ) {
											return createAtomChangeInfo( _entryNode, _changedPathTokens );
										}
									} else if( isAPrefixOfB( _entryPathTokens, _changedPathTokens ) ) {
										return verifyAtomNode( _entryNode, _changedPathTokens );
									}
								}
								return createAtomChangeInfo( _node, _changedPathTokens );
							}
						)( entryNode, tokens ));
					} else if( isAPrefixOfB( tokens, entryPathTokens ) ) {
						changedNodeInfo.atomRepoNode = entryNode;
						changedNodeInfo.incomingChangePath = tokens;
						changedNodeInfoSet.add({ ...changedNodeInfo });
						if( tokens.length === entryPathTokens.length ) {
							break;
						}
					}
				}
			}
		}


		const changedNodeInfoList = changedNodeInfoSet.list();

		for( let cLen = changedNodeInfoList.length, c = 0; c < cLen; c++ ) {
			const { incomingChangePath, atomRepoNode } = changedNodeInfoList[ c ]
			const rootAtomNode = this.findRootAtomNodeFor( atomRepoNode as DescendantNode<T> );
			makePathWriteable( rootAtomNode.value, atomRepoNode.fullPath );
			const nodePath = atomRepoNode.fullPath;
			if( incomingChangePath.length > nodePath.length ) {
				/* CASE: changed path points to a subset of an atom node. */
				// nodePath: a.b.c.d
				// changePath: a.b.c.d.e.0.w.e
				let atomValue = get( atomRepoNode.value, nodePath.slice( rootAtomNode.fullPath.length ) );
				for( let i = nodePath.length; i < incomingChangePath.length; i++ ) {
					// @ts-expect-error
					atomValue = shallowCopy( atomValue );
					if( atomValue === undefined ) { break }
					atomValue = atomValue[ incomingChangePath[ i ] ];
				}
				set(
					atomRepoNode.value,
					incomingChangePath,
					get( changes, incomingChangePath )._value
				);
			} else {
				/* CASE: changed path points to a superset of an atom node. */
				// nodePath: a.b.c.d.e.0.w.e
				// changePath: a.b.c.d[.e.0.w.e]
				set(
					atomRepoNode.value,
					atomRepoNode.fullPath,
					get( changes, atomRepoNode.fullPath )._value
				);
			}
		}

		// --- move salvageables from below linie into above --- //

		for( const {
			incomingChangePath,
			atomRepoNode
		} of changedNodeInfoList ) {

		}

		let hasClearedLeaves = false;
		let headInfoSet = new AtomChangeInfoSet();
		while( changedNodeInfoSet.size ) {
			for( const {
				incomingChangePath,
				atomRepoNode
			} of changedNodeInfoSet.list() ) {
				const changePathLen = incomingChangePath.length;
				const nodePathLen = atomRepoNode.fullPath.length;
				const prevValue = atomRepoNode.value;
				if( changePathLen > nodePathLen ) {
					/* CASE: changed path points to a subset of an atom node. */
					// nodePath: a.b.c.d
					// changePath: a.b.c.d.e.0.w.e
					set(
						atomRepoNode.value,
						incomingChangePath,
						get( changes, incomingChangePath )._value
					);
				} else {
					/* CASE: changed path points to a superset of an atom node. */
					// nodePath: a.b.c.d.e.0.w.e
					// changePath: a.b.c.d[.e.0.w.e]
					set(
						atomRepoNode.value,
						atomRepoNode.fullPath,
						get( changes, atomRepoNode.fullPath )._value
					);
				}
				if( atomRepoNode.head && 'value' in atomRepoNode.head ) {
					// roll into ancestors values -> { ... }
					const headValue = shallowCopy( atomRepoNode.head.value );
					set( headValue, incomingChangePath, atomRepoNode.value );
					atomRepoNode.head.value = headValue;
				}
				if( !hasClearedLeaves ) {
					// set descendant atoms values to properties in new `node`.value
					const descendantNodes : Array<DescendantNode<Value>> = [];
					const rootNode = this._data;
					( function identifyAffectedDescNodes( data, oldData, currPath ) {
						if( !Object.keys( oldData ).length || (
							Array.isArray( oldData ) && !oldData.length
						) ) {
							data !== oldData && collectDistinctClosestNodes( rootNode, currPath, descendantNodes );
							return;
						}
						if( Array.isArray( oldData ) ) {
							for( let iLen = oldData.length, i = 0; i < iLen; i++ ) {
								const thisCurrPath = [ ...currPath, `${ i }` ];
								identifyAffectedDescNodes( data?.[ i ] as Readonly<T>, oldData[ i ] as Readonly<T>, thisCurrPath );
								data?.[ i ] !== oldData[ i ] && collectDistinctClosestNodes( rootNode, thisCurrPath, descendantNodes );
							}
							return;
						}
						for( const k in oldData ) {
							const thisCurrPath = [ ...currPath, k ];
							identifyAffectedDescNodes( data?.[ k ] as Readonly<T>, oldData[ k ] as Readonly<T>, thisCurrPath );
							data?.[ k ] !== oldData[ k ] && collectDistinctClosestNodes( rootNode, thisCurrPath, descendantNodes );
						}
					} )( atomRepoNode.value, prevValue, atomRepoNode.fullPath );
					for( let dLen = descendantNodes.length, d = 0; d > dLen; d++ ) {
						descendantNodes[ d ].value = get(
							atomRepoNode.value,
							descendantNodes[ d ].fullPath
						)._value;
					}
					hasClearedLeaves = true;
				}
				headInfoSet.add( createAtomChangeInfo(
					atomRepoNode.head,
					atomRepoNode.fullPath.slice( 0, -1 )
				) );
			}
			changedNodeInfoSet = headInfoSet;
			headInfoSet = new AtomChangeInfoSet();
		}

		// @todo : continue here...
		// 1. traverse changeInfoList:
		// 2. if `paths`.length > `nPaths`.length ( `paths` points to a subset of atom node)
		//		a. set `node`.value to `changes`.value at `paths`
		//		b. roll into ancestors values -> { ... }
		//		c. set descendant atom values to properties in new `node`.value
		//		d. reconcile the ancestral branches up the tree
		// 		e. return untouched siblings across the tree
		// 		f. return untouched descendants below the atom
		// 3. if `paths`.length < `nPaths`.length ( `paths` points to a superset of atom node)
		//		a. set `node`.value to `changes`.value at `paths`
		//		b.0. if( higher ancestor atoms ) set its affected value property to `changes`.value
		//		b.1. roll the last upper change into higher ancestors values -> { ... }
		//		c. set descendant atom values to properties in new `node`.value
		//		d. reconcile the ancestral branches up the tree
		// 		e. return untouched siblings across the tree
		// 		f. return untouched descendants below the atom
		// 4. if `paths`.length === `nPaths`.length ( `paths` points to an exact atom node)
		//		a. set `node`.value to `changes`.value at `paths`
		//		b. roll into ancestors values -> { ... }
		//		c. set descendant atom values to properties in new `node`.value
		//		d. reconcile the ancestral branches up the tree
		// 		e. return untouched siblings across the tree
		// 		f. return untouched descendants below the atom



	}
	
	removeAtomDataAt( propertyPath : string ) : void;
	removeAtomDataAt(
		/* split property path string */
		propertyPath : Array<string>
	) : void; 
	removeAtomDataAt( propertyPath ) : void {
		let node = this.atomNodeAt( propertyPath );
		if( !node ) { return }
		// if there are descendants of this node simply excuse
		// this node and leave the descendants undisturbed.
		if( 'entries' in node ) {
			delete node.fullPath;
			delete node.pathToRootAtom;
			delete node.value;
			const rootAtomNode = this.findRootAtomNodeFor( node );
			if( !rootAtomNode ) { return }
			// @todo : recalculate `pathToRootAtom` fields for all descendant atoms.
			return;
		}
		/* if leaf, clean up all associated precendent atomless branches */
		const pathToRootAtom = ( node as DescendantNode<T> ).pathToRootAtom.slice();
		while( pathToRootAtom.length ) {
			node = node.head;
			const key = pathToRootAtom.pop();
			if( Object.keys( node.entries ).length > 1 ) {
				delete node.entries[ key ];
			} else {
				delete node.entries;
			}
		}

	}

	private addRootAtomData( entryNode : DescendantNode<T> ) {
		entryNode.value = clonedeep( getProperty( this.origin, entryNode.fullPath )?._value );
		carryoverDescendantValuesInto( entryNode );
		entryNode.value = makeReadonly( entryNode.value );
	}
	private addDescendantAtomData(
		entryNode : DescendantNode<T>,
		rootAtomNode : DescendantNode<T>
	) {
		entryNode.pathToRootAtom = entryNode.fullPath.slice( rootAtomNode.fullPath.length );
		entryNode.value = get( rootAtomNode.value, entryNode.pathToRootAtom )._value;
	}
	private findRootAtomNodeFor( node : DescendantNode<T> ) : DescendantNode<T> {
		node = node.head;
		if( node ) {
			const head = node.head;
			if( !head ) { return node }
			node = head;
		}
		return node;
	}

	private atomNodeAt( propertyPath : string ) : DescendantNode<T>;
	private atomNodeAt(
		/* split property path string */
		propertyPath : Array<string>
	) : DescendantNode<T>; 
	private atomNodeAt( propertyPath ) : DescendantNode<T> {
		let node = this._data as DescendantNode<T>;
		for( let tokens = tokenizeStringByDots( propertyPath ), tLen = tokens.length, t = 0; t < tLen; t++ ){
			node = node.entries?.[ tokens[ t ] ];
			/* if not found, abandon removal operation */
			if( !node ) { return }
		}
		return node;
	}
}

function carryoverDescendantValuesInto<T extends Value>( node : DescendantNode<T> ) {
	const nearestDescendants = findNearestDescendantsFrom( node );
	if( !nearestDescendants.length ) {
		delete node.entries;
	} else {
		const relPathStartIndex = node.fullPath.length;
		for( let n = nearestDescendants.length; n--; ) {
			const nDesc = nearestDescendants[ n ];
			nDesc.pathToRootAtom = nDesc.fullPath.slice( relPathStartIndex );
			set( node.value, nDesc.pathToRootAtom, nDesc.value );
		}
	}
}

function collectDistinctClosestNodes<T extends Value>(
	rootNode : AtomDataEntryNode<T>,
	currentPath : Array<string>,
	distinctNodes : Array<AtomDataEntryNode<T>> // output: a runninig over collected distinct closes nodes
) {
	const atomNode = findClosestNodeTo( currentPath, rootNode as DescendantNode<T> );
	!containsNode(
		distinctNodes as Array<DescendantNode<Value>>,
		atomNode as DescendantNode<Value>
	) &&
	distinctNodes.push( atomNode );
}

function containsNode<T extends Value>(
	hayStack : Array<DescendantNode<T>>,
	needle : DescendantNode<T>
) {
	for( const node of hayStack ) {
		if( node === needle ) { return true }
	}
	return false;
}

function createAtomChangeInfo(
	node: DescendantNode<Value> = null,
	referencedChangePathTokens: Array<string> = []
) : AtomChangeInfo{
	return {
		atomRepoNode: node,
		incomingChangePath: referencedChangePathTokens
	};
}

function findClosestNodeTo<T extends Value>(
	propertyPathTokens : Array<string>,
	rootNode : DescendantNode<T>
) : AtomDataEntryNode<T> {
	let closest : AtomDataEntryNode<T> = rootNode;
	for( const key of propertyPathTokens ) {
		if( !( 'fullPath' in rootNode ) ) {
			rootNode = rootNode[ key ];
			continue;
		}
		if( isAPrefixOfB( rootNode.fullPath, propertyPathTokens ) ) {
			closest = rootNode;
			if( rootNode.fullPath.length === propertyPathTokens.length ) {
				return rootNode;
			}
			rootNode = rootNode[ key ];
			continue;
		} else if( isAPrefixOfB( propertyPathTokens, rootNode.fullPath ) ) {
			return closest;
		}
		if( 'entries' in rootNode ) { return null }
		rootNode = rootNode[ key ];
	}
	return null;
}

function findNearestDescendantsFrom<T extends Value>( rootNode : DescendantNode<T> ) {
	const nearestDescendants : Array<DescendantNode<T>> = [];
	for( let numEntries = Object.keys( rootNode.entries ).length, e = 0; e < numEntries; e++ ) {
		if( 'value' in rootNode.entries[ e ] ) {
			nearestDescendants.push( rootNode.entries[ e ]);
			continue;
		}
		nearestDescendants.push( ...findNearestDescendantsFrom( rootNode.entries[ e ] ) );
	}
	return nearestDescendants;
}

function isAPrefixOfB<T>(
	{ length: aLen, ...a } : Array<T>,
	b : Array<T>
) {
	if( aLen > b.length ) { return false }
	for( let i = 0; i < aLen; i++ ) {
		if( a[ i ] !== b[ i ] ) { return false }
	}
	return true;
}

function searchNodeInfoListByPath(
	path : Array<string>,
	nodeInfoList : Array<AtomChangeInfo>
) {
	const pLen = path.length;
	for( let n = nodeInfoList.length; n--; ) {
		const nodeInfo = nodeInfoList[ n ];
		if( nodeInfo[ n ].length !== pLen ) { continue }
		let found = true;
		for( let p = 0; p < pLen; p++ ) {
			if( nodeInfo.incomingChangePath[ p ] !== path[ p ] ) {
				found = false; 
				break;
			}
		}
		if( found ) { return nodeInfo }
	}
}

/** makes path in `source` readonly */
function makePathReadonly<T extends Value>(
	source : T, path : Array<string>
 ) {
	let { _value : data, exists } = get( source, path );
	if( exists ) { return }
	for( let p = path.length; p--; ) {
		data = data[ path[ p ] ];
		!Object.isFrozen( data ) &&
		Object.freeze( data );
	}
}

function makePathWriteable<T extends Value>(
	source : T, path : Array<string>
 ) {
	let { _value : target, exists } = get( source, path );
	if( exists ) { return }
	if( Object.isFrozen( source ) ) {
		source = shallowCopy( source ) as T
	}
	let p = -1;
	while( source !== target ) {
		const key = path[ ++p ];
		if( Object.isFrozen( source[ key ] ) ) {
			source[ key ] = shallowCopy( source[ key ] );
		}
		source = source[ key ] as T;
	} 
}

function shallowCopy( data : unknown ) : unknown {
	return isPlainObject( data )
		? { ...data as {} }
		: Array.isArray( data )
		? [ ...data ]
		: data;
}
