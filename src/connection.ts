import type {
    Changes,
    Listener,
    UpdatePayload,
    UpdatePayloadArray,
	UpdatePayloadArrayCore,
	UpdatePayloadArrayCoreCloneable,
	UpdatePayloadCore,
	UpdatePayloadCoreCloneable,
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
    get( ...propertyPaths : Array<string> ) { return this.#cache.get( this.#id, ...propertyPaths ) }

    set( changes : UpdatePayload<T>, onComplete? : Listener ) : void;
	set( changes : UpdatePayloadArray<T>, onComplete? : Listener ) : void;
	set( changes : UpdatePayloadArrayCore<T>, onComplete? : Listener ) : void;
	set( changes : UpdatePayloadArrayCoreCloneable<T>, onComplete? : Listener ) : void;
	set( changes : UpdatePayloadCore<T>, onComplete? : Listener ) : void;
	set( changes : UpdatePayloadCoreCloneable<T>, onComplete? : Listener ) : void;
	set( changes : Changes<T>, onComplete? : Listener ) : void;
    @invoke
    set( changes : any, onComplete: Listener = deps.noop ) : void {
        deps.setValue(
            this.#cache.origin,
            changes,
            changes => {
                this.#cache.atomize( changes as Changes<T> );
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