import type {
	BaseType,
	GetElementType,
	KeyType,
	TagCommand,
	TagType,
	UpdateStats as Stats,
	Value
} from '../..'; 

type Predicate = (
	value : Value,
	valueKey : string,
	stats : Stats
) => boolean;

type IndexedChange<
	A extends Array<GetElementType<A>>,
	I extends keyof A = keyof A
> = A[ I ]|TagCommand<TagType, A, I>;

export type TaggedChanges<T extends Array<GetElementType<T>> | Value> = Partial<
	{[K in keyof T]: T[ K ]|TagCommand<TagType, T, K>} | (
		T extends Array<GetElementType<T>>
			? {[index : string]: IndexedChange<T>}
			: {[T in TagType]: TagCommand<T, Value, keyof Value>}
	)
>;

type TagFunction = <
	T extends Array<GetElementType<T>> | Value,
	K extends keyof T
>(
	value : T,
	valueKey : K,
	stats : Stats,
	changes? : TaggedChanges<T>
) => void;

import isEmpty from 'lodash.isempty';
import isEqual from 'lodash.isequal';

import {
	CLEAR_TAG,
	DELETE_TAG,
	MOVE_TAG,
	PUSH_TAG,
	REPLACE_TAG,
	SET_TAG,
	SPLICE_TAG
} from '../../constants';

import clonedeep from '@webkrafters/clone-total';
import getProperty from '@webkrafters/get-property';

import { isDataContainer, isPlainObject } from '../../utils';

/**
 * Sets a value slice to its empty value equivalent
 * Compatible with value slices of all types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $clear(value, 'name', new Stats(), {name: {'@@CLEAR': *}, ...}) // sets `value.name` = ''
 * $clear(value, 'nested', new Stats(), {nested: {'@@CLEAR': *},...}) // sets `value.nested` = {}
 * $clear(value.nested, 'name', new Stats(), {name: {'@@CLEAR': *}, ...}) // sets `value.nested.name` = ''
 * $clear(value.nested, 'items', new Stats(), {items: {'@@CLEAR': *}, ...}) // sets `value.nested.items` = []
 * $clear(value.nested, 'items', new Stats(), {items: ['a', {'@@CLEAR': *}, 'c', 'd', 'e', 'f'], ...}) // sets `value.nested.items[2]` = ''
 * $clear(value.nested, 'fn', new Stats(), {fn: {'@@CLEAR': *}, ...}) // sets `value.nested.fn` = null
 * $clear(value.nested.items, 4, new Stats(), {4: {'@@CLEAR': *}, ...}) // sets `value.nested.items[4]` = ''
 */
export const $clear = (() => {
	const defaultPredicate : Predicate = () => true;
	const hasItems = ( value, valueKey ) => value[ valueKey ].length;
	const setDefault = ( value, valueKey, stats, changes, predicate = defaultPredicate, _value = null ) => {
		if( predicate( value, valueKey, stats ) ) {
			value[ valueKey ] = _value;
			addToStatsTable([ valueKey ], stats );
		}
		finishTagRequest( changes, valueKey, CLEAR_TAG );
	};
	const clear : TagFunction = ( value, valueKey, stats, changes ) => {
		if( !( valueKey in value ) ) {
			return finishTagRequest( changes as Value, valueKey, CLEAR_TAG );
		}
		const _value = value[ valueKey ];
		if( typeof _value === 'undefined' || _value === null ) {
			return finishTagRequest( changes as Value, valueKey, CLEAR_TAG );
		}
		if( isPlainObject( _value ) ) {
			let changed = false;
			for( const k in _value ) { // remove properties singularly b/c where value === the setValue `value` argument, we may not change its reference
				delete value[ valueKey ][ k ];
				addToStatsTable([ valueKey, k ], stats );
				changed = true;
			}
			changed && addToStatsTable([ valueKey ], stats );
			return finishTagRequest( changes as Value, valueKey, CLEAR_TAG );
		}
		const type = _value.constructor.name;
		if( type === 'String' ) { return setDefault( value, valueKey, stats, changes, hasItems, '' ) }
		if( type === 'Array' ) { return setDefault( value, valueKey, stats, changes, hasItems, [] ) }
		setDefault( value, valueKey, stats, changes );
	};
	return clear;
})();

/**
 * Removes items from value slices.
 * Compatible with value slices of the Array and POJO property types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $delete(value, 'value', new Stats(), {value: {'@@DELETE': ['name', 'nested'], ...}, ...}) // removes the `name` and `nested` properties from `value`
 * $delete(value, 'nested', new Stats(), {nested: {'@@DELETE': ['fn', 'items', 'name'], ...}, ...}) // removes the 'fn', 'items' and 'name' properties from `value.nested`
 * $delete(value.nestetd, 'items', new Stats(), {items: {'@@DELETE': [0, 3], ...}, ...}) // removes indexes 0 and 3 `value.nested.items`
 */
export const $delete : TagFunction = ( value, valueKey, stats, changes ) => {
	let deleteKeys = ( changes as Value )[ valueKey ][ DELETE_TAG ];
	if( !Array.isArray( deleteKeys ) ) {
		throw new TypeError( `Invalid entry found at ${ DELETE_TAG } change property: requires an array of value keys to delete.` );
	}
	const finish = () => finishTagRequest( changes as Value, valueKey, DELETE_TAG );
	let currValue;
	try{
		if( !deleteKeys.length ) { throw new Error( 'Delete called with no identified items to delete.' ) };
		currValue = value[ valueKey ];
		if( isEmpty( currValue ) ) { throw new Error( 'Delete called on empty value.' ) }
	} catch( e ) { return finish() }
	deleteKeys = Array.from( new Set( deleteKeys ) );
	let changed = false;
	if( !Array.isArray( currValue ) ) {
		for( const k of deleteKeys ) {
			if( !getProperty( currValue, k ).exists ) { continue }
			delete value[ valueKey ][ k ];
			addToStatsTable([ valueKey, k ], stats );
			changed = true;
		}
		changed && addToStatsTable([ valueKey ], stats );
		return finish();
	}
	const currLen = currValue.length;
	const deleteMap = {};
	for( const key of deleteKeys ) {
		let index = +key;
		if( index > currLen ) { continue }
		if( index < 0 ) {
			index = currLen + index;
			if( index < 0 ) { continue }
		}
		deleteMap[ index ] = null;
	}
	const newValue = [];
	let numVisited = 0;
	for( let numDeleted = numVisited, deleteLen = deleteKeys.length; numVisited < currLen; numVisited++ ) {
		if( !( numVisited in deleteMap ) ) {
			newValue.push( currValue[ numVisited ] );
			continue;
		}
		if( ++numDeleted === deleteLen ) {
			numVisited++;
			break;
		}
	}
	if( numVisited < currLen ) {
		newValue.push( ...currValue.slice( numVisited ) );
	}
	if( currLen === newValue.length ) { return finish() }
	( value[ valueKey ] as Array<any> ).length = 0;
	( value[ valueKey ] as Array<any> ).push( ...newValue );
	addToStatsTable([ valueKey ], stats );
	finish();
};

/**
 * Repositions a group contiguous value slice array items.
 * Compatible with value slices of the Array type.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $move(value.nested, 'items', new Stats(), {items: {'@@MOVE': [0, 3, 2], ...}, ...}) // moves `value.nested.items` 'a' and 'b' from indexes 0 and 1 to indexes 3 and 4.
 */
export const $move : TagFunction = ( value, valueKey, stats, changes ) => {
	const args = ( changes as Value )[ valueKey ][ MOVE_TAG ];
	if( !Array.isArray( args ) || args.length < 2 || !Number.isInteger( args[ 0 ] ) || !Number.isInteger( args[ 1 ] ) ) {
		throw new TypeError( `Invalid entry found at ${ MOVE_TAG } change property: expecting an array of at least 2 integer values [fromIndex, toIndex, numItems]. numItems is optional. Use negative index to count from array end.` );
	}
	const finish = () => finishTagRequest( changes as Value, valueKey, MOVE_TAG );
	const _value = value[ valueKey ];
	if( !Array.isArray( _value ) ) { return finish() }
	const sLen = _value.length;
	if( !sLen ) { return finish() }
	let [ from, to, numItems = 1 ] = args;
	if( !Number.isInteger( numItems ) || numItems < 1 ) { return finish() }
	if( from < 0 ) { from = sLen + from }
	if( from < 0 || from >= sLen ) { return finish() }
	if( to < 0 ) { to = sLen + to }
	if( to < 0 || to >= sLen ) { return finish() }
	if( from === to ) { return finish() }
	const maxTransferLen = sLen - from;
	if( numItems > maxTransferLen ) { numItems = maxTransferLen }
	( value[ valueKey ] as Array<any> ).splice( to, 0, ..._value.splice( from, numItems ) );
	addToStatsTable([ valueKey ], stats );
	finish();
};

/**
 * Appends new items to value slice array.
 * Compatible with value slices of the Array type.
 * Analogy: Array.prototype.push
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $push(value.nested, 'items', new Stats(), {items: {'@@PUSH': ['x', 'y', 'z'], ...}, ...}) // sequentially appends 'x', 'y' and 'z' to `value.nested.items`.
 */
export const $push : TagFunction = ( value, valueKey, stats, changes ) => { // preforms array.push on the value[valueKey] array
	const args = ( changes as Value )[ valueKey ][ PUSH_TAG ];
	if( !Array.isArray( args ) ) {
		throw new TypeError( `Invalid entry found at ${ PUSH_TAG } change property: expecting an array of [].pudh(...) compliant argument values.` );
	}
	if( !args.length || !Array.isArray( value[ valueKey ] ) ) {
		return finishTagRequest( changes as Value, valueKey, PUSH_TAG );
	}
	( value[ valueKey ] as Array<any> ).push( ...args );
	addToStatsTable([ valueKey ], stats );
	finishTagRequest( changes as Value, valueKey, PUSH_TAG );
};

/**
 * Replaces a value slice with a new value or the return value of a compute function.
 * Compatible with value slices of all types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $replace(value, 'name', new Stats(), {name: {'@@REPLACE': new value, ...}, ...}) // sets `value.name` = new value
 * $replace(value, 'nested', new Stats(), {nested: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested` = new value
 * $replace(value.nested, 'name', new Stats(), {name: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.name` = new value
 * $replace(value.nested, 'items', new Stats(), {items: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.items` = new value
 * $replace(value.nested, 'items', new Stats(), {items: ['a', {'@@REPLACE': new value, ...}, 'c', 'd', 'e', 'f'], ...}) // sets `value.nested.items[2]` = new value
 * $replace(value.nested, 'fn', new Stats(), {fn: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.fn` = new value
 * $replace(value.nested.items, 4, new Stats(), {4: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.items[4]` = new value
 */
export const $replace : TagFunction = ( value, valueKey, stats, changes ) => {
	applyReplaceCommand( REPLACE_TAG, value as Value, changes, valueKey, stats );
};

/**
 * Replaces a value slice with a new value or the return value of a compute function.
 * Compatible with value slices of all types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $set(value, 'name', new Stats(), {name: {'@@SET': new value OR currentName => new value, ...}, ...}) // sets `value.name` = new value
 * $set(value, 'nested', new Stats(), {nested: {'@@SET': new value OR currentNested => new value, ...}, ...}) // sets `value.nested` = new value
 * $set(value.nested, 'name', new Stats(), {name: {'@@SET': new value OR currentName => new value, ...}, ...}) // sets `value.nested.name` = new value
 * $set(value.nested, 'items', new Stats(), {items: {'@@SET': new value OR currentItems => new value, ...}, ...}) // sets `value.nested.items` = new value
 * $set(value.nested, 'items', new Stats(), {items: ['a', {'@@SET': new value OR current2nd => new value, ...}, 'c', 'd', 'e', 'f'], ...}) // sets `value.nested.items[2]` = new value
 * $set(value.nested, 'fn', new Stats(), {fn: {'@@SET': new value OR currentFn => new value, ...}, ...}) // sets `value.nested.fn` = new value
 * $set(value.nested.items, 4, new Stats(), {4: {'@@SET': new value OR current4th => new value, ...}, ...}) // sets `value.nested.items[4]` = new value
 */
export const $set = (() => {
	const toString = Object.prototype.toString;
	const set : TagFunction = ( value, valueKey, stats, changes ) => {
		const _changes = changes as Value;
		if( toString.call( _changes[ valueKey ][ SET_TAG ] ) === '[object Function]' ) {
			_changes[ valueKey ][ SET_TAG ] = clonedeep( _changes[ valueKey ][ SET_TAG ]( clonedeep( value[ valueKey ] ) ) );
		}
		applyReplaceCommand( SET_TAG, value as Value, _changes, valueKey, stats );
	};
	return set;
})();

/**
 * Perform array splice function on a value slice array.
 * Compatible with value slices of the Array type.
 * Analogy: Array.prototype.splice
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $splice(value.nested, 'items', new Stats(), {items: {'@@SPLICE': [3, 3, 'y', 'z'], ...}, ...}) // replaces 'd', 'e' and 'f' with 'y' and 'z' in `value.nested.items`.
 */
export const $splice : TagFunction = ( value, valueKey, stats, changes ) => {
	const args = ( changes as Value )[ valueKey ][ SPLICE_TAG ];
	if( !Array.isArray( args ) || args.length < 2 || !Number.isInteger( args[ 0 ] ) || !Number.isInteger( args[ 1 ] ) ) {
		throw new TypeError( `Invalid entry found at ${ SPLICE_TAG } change property: expecting an array of [].splice(...) compliant argument values.` );
	}
	let [ start, deleteCount, ...items ] = args;
	let iLen = items.length;
	const _value = value[ valueKey ];
	if( !Array.isArray( _value ) || ( deleteCount < 1 && !iLen ) ) {
		return finishTagRequest( changes as Value, valueKey, SPLICE_TAG );
	}
	if( deleteCount > 0 ) {
		const sLen = _value.length;
		start = start < 0
			? Math.abs( start ) > sLen ? 0 : sLen + start
			: start > sLen ? sLen : start;
		let maxCount = sLen - start;
		if( maxCount > iLen ) { maxCount = iLen }
		if( maxCount > deleteCount ) { maxCount = deleteCount }
		let numLeftTrimmed = 0;
		for( ; numLeftTrimmed < maxCount; numLeftTrimmed++ ) {
			if( !isEqual( _value[ start + numLeftTrimmed ], items[ numLeftTrimmed ] ) ) { break }
		}
		start += numLeftTrimmed;
		items.splice( 0, numLeftTrimmed );
		iLen = items.length;
		deleteCount -= numLeftTrimmed;
	}
	if( deleteCount > 0 || iLen ) {
		( value[ valueKey ] as Array<any> ).splice( start, deleteCount, ...items );
		addToStatsTable([ valueKey ], stats );
	}
	finishTagRequest( changes as Value, valueKey, SPLICE_TAG );
};

const tagMap = {
	[ CLEAR_TAG ]: $clear,
	[ DELETE_TAG ]: $delete,
	[ MOVE_TAG ]: $move,
	[ PUSH_TAG ]: $push,
	[ REPLACE_TAG ]: $replace,
	[ SET_TAG ]: $set,
	[ SPLICE_TAG ]: $splice
};

export default tagMap;

function containsTag (
	tagsMap : Partial<{[K in TagType]: any}>,
	tag : any
) : boolean {
	return tag in tagsMap && !Array.isArray( tag )
}

/**
 * Confirms tags whose tagResolver only operates on array values.\
 *
 * @example
 * // given the following value:
 * const value = {test: some value, testArr: [some value 1, ...], testObj: {testKey: some value, ...}, ...}
 * // we can call setValue with array only tags as follows
 * setValue(value, {testArr: {"@@PUSH": [1, 2, 3, ...], ...}, ...});
 */
export const isArrayOnlyTag = (() => {
	const ARRAY_TAGS = {
		[ MOVE_TAG ]: null,
		[ PUSH_TAG ]: null,
		[ SPLICE_TAG ]: null
	};
	function fn( tag : BaseType ) : boolean;
	function fn( tag : TagType ) : boolean;
	function fn( tag ) : boolean {
		return containsTag( ARRAY_TAGS, tag );
	}
	return fn;
})();

/**
 * Confirms tags whose tagResolver accepts no inputs.\
 * Such tags are normally supplied as string values.\
 * When supplied as an object property, the key is extracted: value is discarded.
 *
 * @example
 * // given the following value:
 * const value = {test: some value, testArr: [some value 1, ...], testObj: {testKey: some value, ...}, ...}
 * // we can call setValue with closed tags
 * // either as string values:
 * setValue(value, {test: "@@CLEAR", testArr: ["@@CLEAR", ...], testObj: {testKey: "@@CLEAR", ...}, ...});
 * // or as object properties:
 * setValue(value, {test: {@@CLEAR: some value}, testArr: [{@@CLEAR: some value}, ...], testObj: {testKey: {@@CLEAR: some value}, ...}, ...});
 */
export const isClosedTag = (() => {
	const NO_PARAM_TAGS = { [ CLEAR_TAG ]: null };
	function fn( tag : BaseType ) : boolean;
	function fn( tag : TagType ) : boolean;
	function fn( tag : any ) : boolean {
		return containsTag( NO_PARAM_TAGS, tag );
	}
	return fn;
})();

function applyReplaceCommand<T extends Value, TAG extends TagType>( tag : TAG, value : T, changes : {[K in keyof T]?: {[TT in TAG]: any}}, valueKey : keyof T, stats : Stats ) : void;
function applyReplaceCommand<T extends Value, TAG extends TagType>( tag : TAG, value : T, changes : {[x:string]: any}, valueKey : keyof T, stats : Stats ) : void;
function applyReplaceCommand<T extends Value, TAG extends TagType>( tag : any, value : any, changes : any, valueKey : any, stats : any ) : void {
		const replacement = changes[ valueKey ][ tag ];
	if( !( isDataContainer( value[ valueKey ] ) &&
			isDataContainer( replacement )
	) ) {
		if( value[ valueKey ] !== replacement ) {
			value[ valueKey ] = replacement;
			addToStatsTable([ valueKey ], stats );
		}
		return finishTagRequest( changes, valueKey, tag );
	}
	if( isEqual( value[ valueKey ], replacement ) ) {
		return finishTagRequest( changes, valueKey, tag );
	}
	if(
		Array.isArray( replacement ) &&
		Array.isArray( value[ valueKey ] ) &&
		value[ valueKey ].length !== replacement.length
	) {
		value[ valueKey ] = [ ...value[ valueKey ] ];
		value[ valueKey ].length = replacement.length;
	}
	for( const k in value[ valueKey ] ) {
		if( k in replacement ) {
			value[ valueKey ][ k ] = replacement[ k ];
		} else {
			delete value[ valueKey ][ k ];
		}
	}
	for( const k in replacement ) {
		value[ valueKey ][ k ] = replacement[ k ];
	}
	addToStatsTable([ valueKey ], stats );
	finishTagRequest( changes, valueKey, tag );
}

const finishTagRequest = (() => {
	const end = ( changes, key ) => { delete changes[ key ] };
	function runCloser( changes : Value, key : keyof Value, tag : TagType ) : void;
	function runCloser( changes : Value, key : string, tag : TagType ) : void;
	function runCloser( changes : Value, key : symbol, tag : TagType ) : void;
	function runCloser( changes, key, tag ) : void {
		if( isClosedTag( tag ) ) { return end( changes, key ) }
		let keyCount = 0;
		for( const k in changes[ key ] ) { // eslint-disable-line no-unused-vars
			if( ++keyCount === 2 ) { return end( changes[ key ], tag ) }
		}
		keyCount = 0;
		for( const k in changes ) { // eslint-disable-line no-unused-vars
			if( ++keyCount === 2 ) { return end( changes[ key ], tag ) }
		}
		end( changes, key );
	};
	return runCloser;
})();

function addToStatsTable( valuePathTokens : Array<KeyType>, stats : Stats ) {
	stats.addChangePath([ ...stats.currentPathToken, ...valuePathTokens ]);
}
	
