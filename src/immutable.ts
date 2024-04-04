import type { Changes, Listener, Value } from './types';

type Updater = typeof setValue;

import setValue from './set';

import AccessorCache from './model/accessor-cache';

export class Immutable<T extends Value > {
    #cache : AccessorCache<T>;
    #disposed = false;
    #id : string;
    #update : Updater;
    constructor(
        id : string,
        cache : AccessorCache<T>,
        updater : Updater
    ) {
        this.#cache = cache;
        this.#id = id;
        this.#update = updater;
    }
    get disposed() { return this.#disposed }
    get instanceId() { return this.#id }
    dispose() {
        if( this.#disposed ) { return }
        this.#cache.unlinkClient( this.#id );
        this.#cache = undefined;
        this.#update = undefined;
        this.#disposed = true;
    }
    get( ...propertyPaths : Array<string> ) {
        this.#cache?.get( this.#id, ...propertyPaths );
    }
    set( changes : Changes<T>, onComplete?: Listener ) {
        this.#update?.( this.#cache.origin, changes, onComplete );
    }
}