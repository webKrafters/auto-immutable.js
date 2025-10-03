import {
	Tag,
	TagType,
	type AccessorPayload,
	type AccessorResponse,
	type Changes,
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

import { makeReadonly } from '../../utils';

interface PropertyOriginInfo {
	exists: boolean,
	value: any
};

import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';

import getProperty from '@webkrafters/get-property';

import { GLOBAL_SELECTOR } from '../../constants';

import Atom from '../atom';
import Accessor from '../accessor';
import { clone, isPlainObject } from 'lodash';

class AccessorCache<T extends Value> {
	private _accessors : {[propertyPaths: string]: Accessor} = {};
	private _atoms : AccessorPayload = {};
	private _origin : T;

	/** @param origin - Value object reference from which slices stored in this cache are to be curated */
	constructor( origin : T ) { this._origin = origin }

	get origin() { return this._origin }

	/** atomizes value property changes */
	atomize( originChanges : UpdatePayload<T> ) : void;
	atomize( originChanges : UpdatePayloadArray<T> ) : void;
	atomize( originChanges : UpdatePayloadArrayCore<T> ) : void;
	atomize( originChanges : UpdatePayloadArrayCoreCloneable<T> ) : void;
	atomize( originChanges : UpdatePayloadCore<T> ) : void;
	atomize( originChanges : UpdatePayloadCoreCloneable<T> ) : void;
	atomize( originChanges : Changes<T> ) : void;
	atomize( originChanges ) : void {
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
				if( !Array.isArray( originChanges ) ) {
					if( !getProperty( originChanges, path ).trail.length
						&& !tags.some( tag => tag in originChanges )
					) { continue }
				} else {
					let found = false;
					for( let i = originChanges.length; i--; ) {
						if( getProperty( originChanges, `${ i }.${ path }` ).trail.length
							|| tags.some( tag => tag in originChanges[ i ] )
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

	private getOriginAt( propertyPath : string ) : PropertyOriginInfo {
		return propertyPath === GLOBAL_SELECTOR
			? { exists: true, value: this._origin }
			: getProperty( this._origin, propertyPath );
	}
}

export default AccessorCache;

// ----------------

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

class DataTrie<T extends Value> {
	private data : HeadNode<T> = { entries: {} };
	private origin : T;
	constructor( origin : T ) { this.origin = origin }
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

function findNearestDescendantsFrom<T extends Value>( node : DescendantNode<T> ) {
	const nearestDescendants : Array<DescendantNode<T>> = [];
	for( let numEntries = Object.keys( node.entries ).length, e = 0; e < numEntries; e++ ) {
		if( 'value' in node.entries[ e ] ) {
			nearestDescendants.push( node.entries[ e ]);
			continue;
		}
		nearestDescendants.push( ...findNearestDescendantsFrom( node.entries[ e ] ) );
	}
	return nearestDescendants;
}

function isAPrefixOfB<T>(
	{ length: aLen, ...a } : Array<T>,
	b : Array<T>
) {
	if( aLen >= b.length ) { return false }
	for( let i = 0; i < aLen; i++ ) {
		if( a[ i ] !== b[ i ] ) { return false }
	}
	return true;
}
