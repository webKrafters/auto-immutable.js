import type { Closable, TagType } from './main';

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

import { Immutable, Tag } from './main';

export type GetElementType<T> = T extends Array<infer U> ? U : T;

import type AtomNode from './model/accessor-cache/repository/atom-value/node';

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

export type KeyType = number|string|symbol;

export type ScalarType = boolean|KeyType;

export type Cloneable<T extends object> = T & {
    clone?: ( ...args : Array<any> ) => T;
    cloneNode?: ( deep : true, ...args : Array<any> ) => T;
};

export interface ValueObject{[x: KeyType]: BaseType|Function|Value};
export type ValueObjectCloneable = Cloneable<ValueObject>;
export type Value = ValueObject|ValueObjectCloneable;

export class UpdateStats {
    private _idSet = new Set<string>();
    private _changePathMap : Array<Array<KeyType>> = []; // Map<String, Array<KeyType>> = new Map();
    private _currentPathToken : Array<KeyType> = [];
    get changedPathTable() { return this._changePathMap }
    get currentPathToken(){ return this._currentPathToken }
    get hasChanges(){ return this._changePathMap.length > 0 }
    addChangePath( changePath : Array<KeyType> ) {
        const id = changePath.join( '.' );
        if( this._idSet.has( id ) ) { return }
        this._idSet.add( id );
        this._changePathMap.push([ ...changePath ]);
    }
}

export type BaseType = Array<any>|ScalarType|Value|{}|object;

/** As in {"@@CLEAR":*} is a parameterless command. Parameters have not effect */
export type ClearCommand = Record<ClearTag, any>;

/** As in {"@@DELETE": [property keys to delete]} */
export type DeleteCommand = Record<DeleteTag, Array<KeyType>>;

/** As in {"@@MOVE": [-/+fromIndex, -/+toIndex, +numItems? ]}. numItems = 1 by default. */
export type MoveCommand = Record<MoveTag, [ number, number, number? ]>;

/** As in {"@@PUSH": [new items]} */
export type PushCommand<T, K extends keyof T> = Record<PushTag, Array<GetElementType<T[ K ]>>>;

/** As in {"@@REPLACE": Replacement value} */
export type ReplaceCommand<T, K extends keyof T> = Record<ReplaceTag, T|GetElementType<T[ K ]>>;

/** As in {"@@SET": Replacement value} */
export type SetCommand<T, K extends keyof T> = Record<SetTag, T|GetElementType<T[ K ]>|((value : T) => T)|((value : GetElementType<T[ K ]>) => GetElementType<T[ K ]>)>;

/** As in {"@@SPLICE": [-/+fromIndex, +deleteCount <n >= 0>, ...newItems? ]}. numItems = undefined by default. */
export type SpliceCommand<T, K extends keyof T> = Record<SpliceTag, [ number, number, ...Array<GetElementType<T[ K ]>> ]>;

export type TagCommand<
    T extends TagType,
    P extends (Value|Array<any>) = Value,
    K extends keyof P = keyof P
> = T extends ClearTag
    ? ClearCommand
    : T extends DeleteTag
    ? DeleteCommand
    : T extends MoveTag
    ? MoveCommand
    : T extends PushTag
    ? PushCommand<P,K>
    : T extends ReplaceTag
    ? ReplaceCommand<P,K>
    : T extends SetTag
    ? SetCommand<P,K>
    : T extends SpliceTag
    ? SpliceCommand<P,K>
    : never;

export interface AccessorPayload<T extends Value>{ [ sourcePathId: number ]: AtomNode<T> };

export interface AccessorResponse<T extends Value>{ [ sourcePath: string ]: Readonly<T> };

export type Changes<T extends Value> = UpdatePayload<T> | UpdatePayloadArray<T>;

export interface ChangeInfo {
	changes : {};
	paths : Array<Array<string>>;
};

export type Listener = (
    changes : Readonly<ChangeInfo["changes"]>,
    paths : Readonly<ChangeInfo["paths"]>
) => void;

export type UpdatePayloadCore<T extends (Array<any>|Value)> =
    | ClearTag
    | TagCommand<TagType, T>
    | Value
    | T extends {}
        ? T | Partial<{
            [K in keyof T]: T[K] extends (Array<any>|Value)
                ? UpdatePayload<T[K]>
                : UpdatePayload<Value>
        }>
        : T;
export type UpdatePayloadCoreCloneable<T extends (Array<any>|Value)> = Cloneable<UpdatePayloadCore<T>>
export type UpdatePayload<T extends (Array<any>|Value)> = UpdatePayloadCore<T> | UpdatePayloadCoreCloneable<T>;

export type UpdatePayloadArrayCore<T extends (Array<any>|Value)> = Array<UpdatePayload<T>>;
export type UpdatePayloadArrayCoreCloneable<T extends (Array<any>|Value)> = Cloneable<UpdatePayloadArrayCore<T>>;
export type UpdatePayloadArray<T extends (Array<any>|Value)> = UpdatePayloadArrayCore<T>|UpdatePayloadArrayCoreCloneable<T>;

export type { Connection } from './connection';

export type { Closable, TagType };

export { Immutable, Tag };

export {
    CLEAR_TAG,
    DELETE_TAG,
    GLOBAL_SELECTOR,
    MOVE_TAG,
    NULL_SELECTOR,
    PUSH_TAG,
    REPLACE_TAG,
    SET_TAG,
    SPLICE_TAG
};

export default Immutable;
