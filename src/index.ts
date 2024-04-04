import type { Changes, Listener, Value } from './types';

type Updater = typeof setValue;

import setValue from './set';

import AccessorCache from './model/accessor-cache';

import { Immutable } from './immutable';

export const deps = { setValue };

export class ImmutableFactory<T extends Value = Value> {
    #cache : AccessorCache<T>;
    #lastCount = -1;
    #updater : Updater;
    constructor( initValue : T ) {
        this.#cache = new AccessorCache<T>( initValue );
        this.#updater = <T>(
            value : T,
            changes : Changes<T>,
            onComplete?: Listener
        ) => deps.setValue( value, changes, changes => {
            // istanbul ignore next
            this.#cache.atomize( changes );
            // istanbul ignore next
            onComplete?.( changes );
        } );
    }
    getInstance() {
        return new Immutable<T>(
            `${ ++this.#lastCount }`,
            this.#cache,
            this.#updater
        );
    }
}