import type { Changes, Listener, Value } from './types';

type Updater = typeof setValue;

import setValue from './set';

import AccessorCache from './model/accessor-cache';

export class Immutable<T extends Value > {
    static #lastCount = -1;
    #cache : AccessorCache<T>;
    #id : string;
    #update : Updater;
    constructor(
        cache : AccessorCache<T>,
        updater : Updater
    ) {
        this.#cache = cache;
        this.#id = `${ ++Immutable.#lastCount }`;
        this.#update = updater;
    }
    get instanceId() { return this.#id }
    destroy() { this.#cache.unlinkClient( this.#id ) }
    get( ...propertyPaths : Array<string> ) {
        this.#cache.get( this.#id, ...propertyPaths );
    }
    set( value : T, changes : Changes<T>, onComplete?: Listener ) {
        this.#update( value, changes, onComplete );
    }
}

export class ImmutableFactory<T extends Value = Value> {
    #cache : AccessorCache<T>;
    #updater : Updater;
    constructor( initValue : T ) {
        this.#cache = new AccessorCache<T>( initValue );
        this.#updater = <T>(
            value : T,
            changes : Changes<T>,
            onComplete?: Listener
        ) => setValue( value, changes, changes => {
            this.#cache.atomize( changes );
            onComplete?.( changes );
        } );
    }
    getInstance() { return new Immutable<T>( this.#cache, this.#updater ) }
}