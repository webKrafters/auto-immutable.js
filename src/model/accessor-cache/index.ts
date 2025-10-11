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

import set from 'lodash.set';

import clonedeep from '@webkrafters/clone-total';
import get from '@webkrafters/get-property';

import { makeReadonly } from '../../utils';

interface PropertyOriginInfo {
	exists: boolean,
	value: any
};

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
	// private _origin : T;

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

// ----------------

interface NodeInfo {
	closestNode : DescendantNode<Value>;
	cPathTokens : Array<string>;
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
	propertyPathTokens? : Array<string>;
	value : T;
}
interface BaseDescendantNode<T extends Value> extends AtomDataEntryNode<T> {
	entries : {
		[ key : string ]: BaseDescendantNode<T>
	};
	head : BaseDescendantNode<T>;
}
interface LeafDescendantNode<T extends Value> extends BaseDescendantNode<T> {
	propertyPathTokens? : Array<string>;
	value : Readonly<T>;
}
interface DescendantNode<T extends Value> extends BaseDescendantNode<T> {
	entries : {
		[ key : string ]: BaseDescendantNode<T>
	};
	propertyPathTokens? : Array<string>;
	value? : Readonly<T>;
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
	private data : HeadNode<T> = { entries: {} };
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
		let rootPathTokens : typeof tokens = [];
		let counter = 0;
		let currNode = this.data;
		while( counter < tokens.length ) {
			const currKey = tokens[ counter ];
			if( !( currKey in currNode.entries ) ) {
				currNode.entries[ currKey ] = {
					entries: {},
					head: currNode
				};
			} else if( !rootPathTokens.length && 'value' in currNode ) {
				rootPathTokens = tokens.slice( 0, counter );
			}
			currNode = currNode.entries[ currKey ];
			counter++;
		}
		if( Object.keys( currNode.entries ).length ) {
			delete currNode.entries;
		}
		rootPathTokens.length
			? this.addDescendantAtomData( currNode as DescendantNode<T>, tokens, rootPathTokens )
			: this.addRootAtomData( currNode as DescendantNode<T>, tokens );
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
		let changedNodeInfoList : Array<NodeInfo> = [];
		/* locate all atom nodes affected by changes */
		for( const tokens of paths ) {
			const changedNodeInfo = createNodeInfo();
			const node = this.data as DescendantNode<Value>;
			while( 'entries' in node ) {
				for( const e in node.entries ) {
					const entryNode = node.entries[ e ] as DescendantNode<Value>;
					const entryPathTokens = entryNode.propertyPathTokens;
					if( isAPrefixOfB( entryPathTokens, tokens ) ) {
						changedNodeInfoList.push((
							function verifyAtomNode( _node, _changedPathTokens ) {
								for( const _e in _node.entries ) {
									const _entryNode = _node.entries[ e ] as DescendantNode<Value>;
									const _entryPathTokens = _entryNode.propertyPathTokens;
									if( isAPrefixOfB( _changedPathTokens, _entryPathTokens ) ) {
										if( _changedPathTokens.length === _entryPathTokens.length ) {
											return createNodeInfo( _entryNode, _changedPathTokens );
										}
									} else if( isAPrefixOfB( _entryPathTokens, _changedPathTokens ) ) {
										return verifyAtomNode( _entryNode, _changedPathTokens );
									}
								}
								return createNodeInfo( _node, _changedPathTokens );
							}
						)( entryNode, tokens ));
					} else if( isAPrefixOfB( tokens, entryPathTokens ) ) {
						changedNodeInfo.closestNode = entryNode;
						changedNodeInfo.cPathTokens = tokens;
						changedNodeInfoList.push({ ...changedNodeInfo });
						if( tokens.length === entryPathTokens.length ) {
							break;
						}
					}
				}
			}
		}

		// ---- implement todos ---- //
		let hasClearedLeaves = false;
		let headInfoList : Array<NodeInfo> = [];
		while( changedNodeInfoList.length ) {
			for( const { cPathTokens, closestNode } of changedNodeInfoList ) {
				const changePathLen = cPathTokens.length;
				const nodePathLen = closestNode.propertyPathTokens.length;
				const prevValue = closestNode.value;
				/* CASE: changed path points to a subset of atom node. */
				// nodePath: a.b.c.d
				// changePath: a.b.c.d.e.0.w.e
				if( changePathLen > nodePathLen ) {
					set(
						closestNode.value,
						cPathTokens,
						get( changes, cPathTokens )._value
					);
				}
				/* CASE: changed path points to a subset of atom node. */
				// nodePath: a.b.c.d.e.0.w.e
				// changePath: a.b.c.d
				else if( nodePathLen > changePathLen ) {
					set(
						closestNode.value,
						closestNode.propertyPathTokens,
						get( changes, closestNode.propertyPathTokens )._value
					);
				}

				
				// 3. if `paths`.length < `nPaths`.length ( `paths` points to a superset of atom node)
				//		a. set `node`.value to `changes`.value at `paths`
				//		b.0. if( higher ancestor atoms ) set its affected value property to `changes`.value
				//		b.1. roll the last upper change into higher ancestors values -> { ... }
				//		c. set descendant atom values to properties in new `node`.value
				//		d. reconcile the ancestral branches up the tree
				// 		e. return untouched siblings across the tree
				// 		f. return untouched descendants below the atom

				/* CASE 3: */
				else if( /* ... */ ) {
					// ...
				}

				// 4. if `paths`.length === `nPaths`.length ( `paths` points to an exact atom node)
				//		a. set `node`.value to `changes`.value at `paths`
				//		b. roll into ancestors values -> { ... }
				//		c. set descendant atom values to properties in new `node`.value
				//		d. reconcile the ancestral branches up the tree
				// 		e. return untouched siblings across the tree
				// 		f. return untouched descendants below the atom

				
				if( closestNode.head && 'value' in closestNode.head ) {
					// roll into ancestors values -> { ... }
					const headValue = shallowCopy( closestNode.head.value );
					set( headValue, cPathTokens, closestNode.value );
					closestNode.head.value = headValue;
				}
				if( !hasClearedLeaves ) {
					// set descendant atoms values to properties in new `node`.value
					const descendantNodes : Array<DescendantNode<Value>> = [];
					const rootNode = this.data;
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
					} )( closestNode.value, prevValue, closestNode.propertyPathTokens );
					for( let dLen = descendantNodes.length, d = 0; d > dLen; d++ ) {
						descendantNodes[ d ].value = get(
							closestNode.value,
							descendantNodes[ d ].propertyPathTokens
						)._value;
					}
					hasClearedLeaves = true;
				}
				const pTokens = closestNode.propertyPathTokens.slice( 0, -1 );
				pTokens.length &&
				!searchNodeInfoListByPath( pTokens, headInfoList ) &&
				headInfoList.push( createNodeInfo( closestNode.head, pTokens ) );
			}
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
		let node = this.data as DescendantNode<T>;
		for( let tokens = tokenizeStringByDots( propertyPath ), tLen = tokens.length, t = 0; t < tLen; t++ ){
			node = node.entries?.[ tokens[ t ] ];
			/* if not found, abandon removal operation */
			if( !node ) { return }
		}
		// if there are descendants of this node simply excuse
		// this node and leave the descendants undisturbed.
		if( 'entries' in node ) {
			delete node.propertyPathTokens;
			delete node.value;
			return;
		}
		/* clean up all associated precendent atomless branches */
		const { propertyPathTokens } = node as DescendantNode<T>;
		while( propertyPathTokens.length ) {
			node = node.head;
			delete node.entries[ propertyPathTokens.pop() ];
			/* preempt cleanup if root reached or branch has other atom(s) */
			if( !( 'head' in node ) || (
				Object.keys( node.entries ).length
			) ) { return }
		}
	}

	private addRootAtomData(
		entryNode : DescendantNode<T>,
		entryPathTokens : Array<string>
	) {
		entryNode.value = clonedeep( getProperty( this.origin, entryPathTokens )?.value );
		entryNode.propertyPathTokens = entryPathTokens;
		carryoverDescendantValuesInto( entryNode );
		entryNode.value = makeReadonly( entryNode.value );
	}
	private addDescendantAtomData(
		entryNode : DescendantNode<T>,
		entryPathTokens : Array<string>,
		rootEntryPathTokens : Array<string>
	) {
		if( !isAPrefixOfB( rootEntryPathTokens, entryPathTokens ) ) {
			throw new Error( '`rootEntryPathTokens` argument must be of the same first N elements in the `entryPathTokens` argument.' );
		}
		this.addRootAtomData( entryNode, entryPathTokens );
		let currNode = entryNode;
		let nearestDescendant = currNode;
		let numTokensToCurrUpdate = entryPathTokens.length;
		const numTokensToRoot = rootEntryPathTokens.length;
		while( numTokensToCurrUpdate >= numTokensToRoot ) {
			const head : DescendantNode<T> = currNode.head;
			if( !( 'value' in head ) ) {
				currNode = head;
				numTokensToCurrUpdate--;
				continue;
			}
			if( isPlainObject( head.value ) ) {
				head.value = { ...head.value };
			} else if( Array.isArray( head.value ) ) {
				head.value = [ ...head.value ] as unknown as Readonly<T>;
			}
			set(
				head.value,
				nearestDescendant.propertyPathTokens,
				nearestDescendant.value
			);
			currNode = head;
			nearestDescendant = currNode;
			numTokensToCurrUpdate--;
		}
		currNode.value = makeReadonly( currNode.value );
	}	
}

function carryoverDescendantValuesInto<T extends Value>( node : DescendantNode<T> ) {
	const nearestDescendants = findNearestDescendantsFrom( node );
	if( !nearestDescendants.length ) {
		delete node.entries;
	} else {
		for( let n = nearestDescendants.length; n--; ) {
			set(
				node.value,
				nearestDescendants[ n ].propertyPathTokens,
				nearestDescendants[ n ].value
			);
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

function createNodeInfo(
	node: DescendantNode<Value> = null,
	referencedChangePathTokens: Array<string> = []
) : NodeInfo{
	return {
		closestNode: node,
		cPathTokens: referencedChangePathTokens
	};
}

function findClosestNodeTo<T extends Value>(
	propertyPathTokens : Array<string>,
	rootNode : DescendantNode<T>
) : AtomDataEntryNode<T> {
	let closest : AtomDataEntryNode<T> = rootNode;
	for( const key of propertyPathTokens ) {
		if( !( 'propertyPathTokens' in rootNode ) ) {
			rootNode = rootNode[ key ];
			continue;
		}
		if( isAPrefixOfB( rootNode.propertyPathTokens, propertyPathTokens ) ) {
			closest = rootNode;
			if( rootNode.propertyPathTokens.length === propertyPathTokens.length ) {
				return rootNode;
			}
			rootNode = rootNode[ key ];
			continue;
		} else if( isAPrefixOfB( propertyPathTokens, rootNode.propertyPathTokens ) ) {
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
	nodeInfoList : Array<NodeInfo>
) {
	const pLen = path.length;
	for( let n = nodeInfoList.length; n--; ) {
		const nodeInfo = nodeInfoList[ n ];
		if( nodeInfo[ n ].length !== pLen ) { continue }
		let found = true;
		for( let p = 0; p < pLen; p++ ) {
			if( nodeInfo.cPathTokens[ p ] !== path[ p ] ) {
				found = false; 
				break;
			}
		}
		if( found ) { return nodeInfo }
	}
}

function shallowCopy<T>( data : T ) : T {
	return isPlainObject( data )
		? { ...data }
		: Array.isArray( data )
		? [ ...data ] as T
		: data;
}
