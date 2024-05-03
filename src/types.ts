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

/** @see {@link https://auto-immutable.js.org/api/set/method/tags/clear-usage} */
export type ClearTag = typeof CLEAR_TAG;

/** @see {@link https://auto-immutable.js.org/api/set/method/tags/delete-usage} */
export type DeleteTag = typeof DELETE_TAG;

export type GlobalSelector = typeof GLOBAL_SELECTOR;

/** @see {@link https://auto-immutable.js.org/api/set/method/tags/move-usage} */
export type MoveTag = typeof MOVE_TAG;

export type NullSelector = typeof NULL_SELECTOR;

/** @see {@link https://auto-immutable.js.org/api/set/method/tags/push-usage} */
export type PushTag = typeof PUSH_TAG;

/** @see {@link https://auto-immutable.js.org/api/set/method/tags/replace-usage} */
export type ReplaceTag = typeof REPLACE_TAG;

/** @see {@link https://auto-immutable.js.org/api/set/method/tags/set-usage} */
export type SetTag = typeof SET_TAG;

/** @see {@link https://auto-immutable.js.org/api/set/method/tags/splice-usage} */
export type SpliceTag = typeof SPLICE_TAG;

export type KeyType = number | string | symbol;

export type ScalarType = boolean | KeyType;

export type Cloneable<T extends object> = T & {
    clone?: ( ...args : Array<any> ) => T;
    cloneNode?: ( deep : true, ...args : Array<any> ) => T;
};

export type ValueObject = {[x: KeyType]: BaseType | Function};
export type ValueObjectCloneable = Cloneable<ValueObject>;
export type Value = ValueObject | ValueObjectCloneable;

export interface UpdateStats { hasChanges: boolean };

export type BaseType = Array<any> | ScalarType | Value | {} | object;

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

/** As in {"@@SPLICE": [-/+fromIndex, +deleteCount <n >= 0>, ...newItems? ]}. numItems = undefined by default. */
export type SpliceCommand = {[SPLICE_TAG]: [number, number, ...Array<any>]}

export type Tag = ClearTag | DeleteTag | MoveTag | PushTag | ReplaceTag | SetTag | SpliceTag;

export type TagCommand<T extends Tag, P extends Value|Array<any> = Value> =
	T extends ClearTag ? ClearCommand :
	T extends DeleteTag ? DeleteCommand<P> :
	T extends MoveTag ? MoveCommand :
	T extends PushTag ? PushCommand :
	T extends ReplaceTag ? ReplaceCommand :
	T extends SetTag ? SetCommand :
	T extends SpliceTag ? SpliceCommand : never;

export interface AccessorPayload {[ propertyPath: string ]: Atom};

export interface AccessorResponse {[ propertyPath: string ]: Atom["value"]}; // [Readonly<any>};

export type Changes<T extends Value> = UpdatePayload<T> | UpdatePayloadArray<T>;

export type Listener = <T extends Value>(changes : Changes<T>) => void;

export type UpdatePayloadCore<T extends Array<any> | Value> =
    | ClearTag
    | TagCommand<Tag, T>
    | Value
    | T extends {}
        ? T | Partial<{
            [K in keyof T]: T[K] extends Array<any>|Value
                ? UpdatePayload<T[K]>
                : UpdatePayload<Value>
        }>
        : T;
export type UpdatePayloadCoreCloneable<T extends Array<any> | Value> = Cloneable<UpdatePayloadCore<T>>
export type UpdatePayload<T extends Array<any> | Value> = UpdatePayloadCore<T> | UpdatePayloadCoreCloneable<T>;

export type UpdatePayloadArrayCore<T extends Array<any>|Value> = Array<UpdatePayload<T>>;
export type UpdatePayloadArrayCoreCloneable<T extends Array<any>|Value> = Cloneable<UpdatePayloadArrayCore<T>>;
export type UpdatePayloadArray<T extends Array<any> | Value> = UpdatePayloadArrayCore<T>|UpdatePayloadArrayCoreCloneable<T>;

import Atom from './model/atom';

export { Connection } from './connection';

export {
    Closable,
    Immutable} from '.';