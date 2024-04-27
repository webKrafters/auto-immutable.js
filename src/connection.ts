import type {
    Changes,
    Listener,
    UpdatePayload,
    UpdatePayloadArray,
    Value
} from './types';

import setValue from './set';

import AccessorCache from './model/accessor-cache';

export const deps = { noop: () => {}, setValue }

export class Connection<T extends Value> {
    #cache : AccessorCache<T>;
    #disconnected = false;
    #id : string;
    constructor(
        id : string,
        cache : AccessorCache<T>
    ) {
        this.#id = id;
        this.#cache = cache;
    }
    get disconnected() { return this.#disconnected }
    get instanceId() { return this.#id }
    @invoke
    disconnect() {
        this.#cache.unlinkClient( this.#id );
        this.#cache = undefined;
        this.#disconnected = true;
    }
    @invoke
    get( ...propertyPaths : Array<string> ) {
        return this.#cache.get( this.#id, ...propertyPaths );
    }
    @invoke
    set( changes : Changes<T>, onComplete: Listener = deps.noop ) : void {
        deps.setValue(
            this.#cache.origin,
            changes,
            changes => {
                this.#cache.atomize( changes as UpdatePayload<T> | UpdatePayloadArray<T> );
                onComplete( changes );
            }
        );
    }
}

function invoke<C>( method: Function, context: C ) {
    return function (
        this: Connection<Value>,
        ...args: Array<any>
    ) {
        if( this.disconnected ) { return }
        return method.apply( this, args ) };
}