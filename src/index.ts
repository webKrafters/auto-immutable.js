type Constants = typeof constants;
type TagKeys = {[K in keyof Constants]: K extends `${ string }_TAG` ? K : never}[ keyof Constants ];
type TagNameMap = {[K in TagKeys]: K extends `${ infer P }_TAG` ? P : never}
type TagType = {[K in TagKeys as TagNameMap[ K ]]: Constants[ K ] };

import type { Value } from './types';

import * as _constants from './constants';

import AccessorCache from './model/accessor-cache';

import { Connection } from './connection';

import { clonedeep } from './utils';

export const constants = _constants;

export const Tag = {} as Readonly<TagType>;
for( let k in constants ) {
    if( !k.endsWith( '-TAG' ) ) { continue }
    // istanbul ignore next
    Tag[ k.slice( 0, -4 ) ] = constants[ k ];
};
Object.freeze( Tag );

export const deps = { numCreated: 0 };

export class Immutable<T extends Value = Value> {
    #cache : AccessorCache<T>;
    #numConnectionsCreated = 0;
    constructor( initValue : T ) {
        this.#cache = new AccessorCache<T>( clonedeep( initValue ) );
        deps.numCreated++;
    }
    connect() {
        return new Connection<T>(
            `${ deps.numCreated }:${ ++this.#numConnectionsCreated }`,
            this.#cache
        );
    }
}