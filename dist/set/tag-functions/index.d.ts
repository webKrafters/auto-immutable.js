import type { BaseType, Value, Tag as TagKey, TagCommand, UpdateStats as Stats } from '../../types';
type TaggedChanges<T extends Array<any> | Value, K extends keyof T, TAG extends TagKey> = Array<TagCommand<TAG, T> | BaseType> | Partial<T & {
    [P in K]: TagCommand<TAG, T> & Value;
}>;
type TagFunction = <T extends Array<any> | Value, K extends keyof T, TAG extends TagKey>(value: T, valueKey: K, stats: Stats, changes?: TaggedChanges<T, K, TAG>) => void;
/**
 * Sets a value slice to its empty value equivalent
 * Compatible with value slices of all types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $clear(value, 'name', {hasChanges: false}, {name: {'@@CLEAR': *}, ...}) // sets `value.name` = ''
 * $clear(value, 'nested', {hasChanges: false}, {nested: {'@@CLEAR': *},...}) // sets `value.nested` = {}
 * $clear(value.nested, 'name', {hasChanges: false}, {name: {'@@CLEAR': *}, ...}) // sets `value.nested.name` = ''
 * $clear(value.nested, 'items', {hasChanges: false}, {items: {'@@CLEAR': *}, ...}) // sets `value.nested.items` = []
 * $clear(value.nested, 'items', {hasChanges: false}, {items: ['a', {'@@CLEAR': *}, 'c', 'd', 'e', 'f'], ...}) // sets `value.nested.items[2]` = ''
 * $clear(value.nested, 'fn', {hasChanges: false}, {fn: {'@@CLEAR': *}, ...}) // sets `value.nested.fn` = null
 * $clear(value.nested.items, 4, {hasChanges: false}, {4: {'@@CLEAR': *}, ...}) // sets `value.nested.items[4]` = ''
 */
export declare const $clear: TagFunction;
/**
 * Removes items from value slices.
 * Compatible with value slices of the Array and POJO property types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $delete(value, 'value', {hasChanges: false}, {value: {'@@DELETE': ['name', 'nested'], ...}, ...}) // removes the `name` and `nested` properties from `value`
 * $delete(value, 'nested', {hasChanges: false}, {nested: {'@@DELETE': ['fn', 'items', 'name'], ...}, ...}) // removes the 'fn', 'items' and 'name' properties from `value.nested`
 * $delete(value.nestetd, 'items', {hasChanges: false}, {items: {'@@DELETE': [0, 3], ...}, ...}) // removes indexes 0 and 3 `value.nested.items`
 */
export declare const $delete: TagFunction;
/**
 * Repositions a group contiguous value slice array items.
 * Compatible with value slices of the Array type.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $move(value.nested, 'items', {hasChanges: false}, {items: {'@@MOVE': [0, 3, 2], ...}, ...}) // moves `value.nested.items` 'a' and 'b' from indexes 0 and 1 to indexes 3 and 4.
 */
export declare const $move: TagFunction;
/**
 * Appends new items to value slice array.
 * Compatible with value slices of the Array type.
 * Analogy: Array.prototype.push
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $push(value.nested, 'items', {hasChanges: false}, {items: {'@@PUSH': ['x', 'y', 'z'], ...}, ...}) // sequentially appends 'x', 'y' and 'z' to `value.nested.items`.
 */
export declare const $push: TagFunction;
/**
 * Replaces a value slice with a new value or the return value of a compute function.
 * Compatible with value slices of all types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $replace(value, 'name', {hasChanges: false}, {name: {'@@REPLACE': new value, ...}, ...}) // sets `value.name` = new value
 * $replace(value, 'nested', {hasChanges: false}, {nested: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested` = new value
 * $replace(value.nested, 'name', {hasChanges: false}, {name: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.name` = new value
 * $replace(value.nested, 'items', {hasChanges: false}, {items: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.items` = new value
 * $replace(value.nested, 'items', {hasChanges: false}, {items: ['a', {'@@REPLACE': new value, ...}, 'c', 'd', 'e', 'f'], ...}) // sets `value.nested.items[2]` = new value
 * $replace(value.nested, 'fn', {hasChanges: false}, {fn: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.fn` = new value
 * $replace(value.nested.items, 4, {hasChanges: false}, {4: {'@@REPLACE': new value, ...}, ...}) // sets `value.nested.items[4]` = new value
 */
export declare const $replace: TagFunction;
/**
 * Replaces a value slice with a new value or the return value of a compute function.
 * Compatible with value slices of all types.
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $set(value, 'name', {hasChanges: false}, {name: {'@@SET': new value OR currentName => new value, ...}, ...}) // sets `value.name` = new value
 * $set(value, 'nested', {hasChanges: false}, {nested: {'@@SET': new value OR currentNested => new value, ...}, ...}) // sets `value.nested` = new value
 * $set(value.nested, 'name', {hasChanges: false}, {name: {'@@SET': new value OR currentName => new value, ...}, ...}) // sets `value.nested.name` = new value
 * $set(value.nested, 'items', {hasChanges: false}, {items: {'@@SET': new value OR currentItems => new value, ...}, ...}) // sets `value.nested.items` = new value
 * $set(value.nested, 'items', {hasChanges: false}, {items: ['a', {'@@SET': new value OR current2nd => new value, ...}, 'c', 'd', 'e', 'f'], ...}) // sets `value.nested.items[2]` = new value
 * $set(value.nested, 'fn', {hasChanges: false}, {fn: {'@@SET': new value OR currentFn => new value, ...}, ...}) // sets `value.nested.fn` = new value
 * $set(value.nested.items, 4, {hasChanges: false}, {4: {'@@SET': new value OR current4th => new value, ...}, ...}) // sets `value.nested.items[4]` = new value
 */
export declare const $set: TagFunction;
/**
 * Perform array splice function on a value slice array.
 * Compatible with value slices of the Array type.
 * Analogy: Array.prototype.splice
 *
 * @example
 * // given the following value:
 * const value = {name: 'test', nested: {name: 'nested', items: ['a', 'b', 'c', 'd', 'e', 'f'], fn: () => {}}}
 * $splice(value.nested, 'items', {hasChanges: false}, {items: {'@@SPLICE': [3, 3, 'y', 'z'], ...}, ...}) // replaces 'd', 'e' and 'f' with 'y' and 'z' in `value.nested.items`.
 */
export declare const $splice: TagFunction;
declare const tagMap: {
    "@@CLEAR": TagFunction;
    "@@DELETE": TagFunction;
    "@@MOVE": TagFunction;
    "@@PUSH": TagFunction;
    "@@REPLACE": TagFunction;
    "@@SET": TagFunction;
    "@@SPLICE": TagFunction;
};
export default tagMap;
/**
 * Confirms tags whose tagResolver only operates on array values.\
 *
 * @example
 * // given the following value:
 * const value = {test: some value, testArr: [some value 1, ...], testObj: {testKey: some value, ...}, ...}
 * // we can call setValue with array only tags as follows
 * setValue(value, {testArr: {"@@PUSH": [1, 2, 3, ...], ...}, ...});
 */
export declare const isArrayOnlyTag: {
    (tag: BaseType): boolean;
    (tag: TagKey): boolean;
};
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
export declare const isClosedTag: {
    (tag: BaseType): boolean;
    (tag: TagKey): boolean;
};
