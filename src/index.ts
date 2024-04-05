import type { Value } from './types';

import AccessorCache from './model/accessor-cache';

import { Connection } from './connection';

export const deps = { numCreated: 0 };

export class Immutable<T extends Value = Value> {
    #cache : AccessorCache<T>;
    #numConnectionsCreated = 0;
    constructor( initValue : T ) {
        this.#cache = new AccessorCache<T>( initValue );
        deps.numCreated++;
    }
    connect() {
        return new Connection<T>(
            `${ deps.numCreated }:${ ++this.#numConnectionsCreated }`,
            this.#cache
        );
    }
}