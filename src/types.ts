import {
    CLEAR_TAG,
    DELETE_TAG,
    GLOBAL_SELECTOR,
    MOVE_TAG,
    NULL_SELECTOR,
    PUSH_TAG,
    REPLACE_TAG,
    SET_TAG,
    SPLICE_TAG
} from './constants';

/** @see {@link https://www.npmjs.com/package/@webkrafters/react-observable-context?activeTab=readme#clear-tag-usage} */
export type ClearTag = typeof CLEAR_TAG;

/** @see {@link https://www.npmjs.com/package/@webkrafters/react-observable-context?activeTab=readme#delete-tag-usage} */
export type DeleteTag = typeof DELETE_TAG;

export type GlobalSelector = typeof GLOBAL_SELECTOR;

/** @see {@link https://www.npmjs.com/package/@webkrafters/react-observable-context?activeTab=readme#move-tag-usage} */
export type MoveTag = typeof MOVE_TAG;

export type NullSelector = typeof NULL_SELECTOR;

/** @see {@link https://www.npmjs.com/package/@webkrafters/react-observable-context?activeTab=readme#push-tag-usage} */
export type PushTag = typeof PUSH_TAG;

/** @see {@link https://www.npmjs.com/package/@webkrafters/react-observable-context?activeTab=readme#replace-tag-usage} */
export type ReplaceTag = typeof REPLACE_TAG;

/** @see {@link https://www.npmjs.com/package/@webkrafters/react-observable-context?activeTab=readme#set-tag-usage} */
export type SetTag = typeof SET_TAG;

/** @see {@link https://www.npmjs.com/package/@webkrafters/react-observable-context?activeTab=readme#splice-tag-usage} */
export type SpliceTag = typeof SPLICE_TAG;

export type KeyType = number | string | symbol;

export type ScalarType = boolean | KeyType;

export interface Cloneable {
    clone?: ( ...args : Array<any> ) => any;
    cloneNode?: ( ...args : Array<any> ) => any
}

export interface Value extends Cloneable {
    [x: KeyType]: ScalarType | Value | Function | {}
}

export interface UpdateStats { hasChanges: boolean };

export type BaseType = Array<any> | ScalarType | Value;

/** As in {"@@CLEAR":*} is a parameterless command. Parameters have not effect */
export type ClearCommand = {[CLEAR_TAG]: any};

/** As in {"@@DELETE": [property keys to delete]} */
export type DeleteCommand<T> = {[DELETE_TAG]: Array<keyof T>}

/** As in {"@@MOVE": [-/+fromIndex, -/+toIndex, +numItems? ]}. numItems = 1 by default. */
export type MoveCommand = {[MOVE_TAG]: [number, number, number?]}

/** As in {"@@PUSH": [new items]} */
export type PushCommand = {[PUSH_TAG]: Array<any>}

/** As in {"@@REPLACE": Replacement value} */
export type ReplaceCommand = {[REPLACE_TAG]: BaseType}

/** As in {"@@SET": Replacement value} */
export type SetCommand = {[SET_TAG]: BaseType | (<V>(currentValue: V) => any)}

/** As in {"@@SPLICE": [-/+fromIndex, +deleteCount, ...newItems? ]}. numItems = undefined by default. */
export type SpliceCommand = {[SPLICE_TAG]: [number, number, ...Array<any>]}

export type Tag = ClearTag | DeleteTag | MoveTag | PushTag | ReplaceTag | SetTag | SpliceTag;

export type TagCommand<T extends Tag, P extends Value = Value> =
	T extends ClearTag ? ClearCommand :
	T extends DeleteTag ? DeleteCommand<P> :
	T extends MoveTag ? MoveCommand :
	T extends PushTag ? PushCommand :
	T extends ReplaceTag ? ReplaceCommand :
	T extends SetTag ? SetCommand :
	T extends SpliceTag ? SpliceCommand : never;

export interface AccessorPayload {[ propertyPath: string ]: Atom};

export interface AccessorResponse {[ propertyPaths: string ]: Readonly<any>};

export type Changes<T extends Value> = UpdatePayload<T> | UpdatePayloadArray<T>;

export type Listener = <T extends Value>(changes : Changes<T>) => void;

export type UpdatePayload<T> = T | ClearTag | ClearCommand | DeleteCommand<T> | MoveCommand | PushCommand | ReplaceCommand | SetCommand | SpliceCommand | Value | Partial<{[K in keyof T]: UpdatePayload<T[K]>}>

export type UpdatePayloadArray<T> = Array<UpdatePayload<T>>;

import Atom from './model/atom';

export { Connection } from './connection';

export { Immutable } from '.';