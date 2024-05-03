type Fn = (...args: any[]) => any;
type Constants = typeof constants;
type TagKeys = {[K in keyof Constants]: K extends `${ string }_TAG` ? K : never}[ keyof Constants ];
type TagNameMap = {[K in TagKeys]: K extends `${ infer P }_TAG` ? P : never}
type TagTypeMap = {[K in TagKeys as TagNameMap[ K ]]: Constants[ K ] };
export type TagType = keyof {[K in keyof TagTypeMap as TagTypeMap[ K ]]: never };

import type { Value } from '.';

import * as _constants from './constants';

import { clonedeep } from './utils';

import AccessorCache from './model/accessor-cache';

import { Connection } from './connection';

export const constants = _constants;

export const Tag = {} as Readonly<TagTypeMap>;
for( let k in constants ) {
    if( !k.endsWith( '_TAG' ) ) { continue }
    // istanbul ignore next
    Tag[ k.slice( 0, -4 ) ] = constants[ k ];
};
Object.freeze( Tag );

export const deps = {
    assignCache: <T extends Value>( initValue : T ) => new AccessorCache( clonedeep( initValue ) ),
    numCreated: 0
};

export class Closable {
    
    #closed = false;
    #listeners = new Set<Fn>();

    get closed() { return this.#closed }

    @invoke
    close() {
        this.#listeners.forEach( f => f() )
        this.#closed = true;
    }

    @invoke
    onClose( fn : Fn ) {
        const _fn = () => {
            fn();
            this.#offClose( _fn );
        }
        this.#listeners.add( _fn );
        return () => this.#offClose( _fn );
    }

    @invoke
    #offClose( fn : Fn ) { this.#listeners.delete( fn ) }

}

export class Immutable<T extends Value = Value> extends Closable {
    
    static #cacheMap = new WeakMap<Immutable<Value>, AccessorCache<Value>>(); 
    
    #numConnectionsCreated = 0;
    
    constructor( initValue : T ) {
        super();
        Immutable.#cacheMap.set( this, deps.assignCache( initValue ) );
        deps.numCreated++;
    }

    close() {
        super.close();
        Immutable.#cacheMap.delete( this );
    }

    @invoke
    connect() {
        return new Connection(
            `${ deps.numCreated }:${ ++this.#numConnectionsCreated }`, {
                key: this,
                map: Immutable.#cacheMap
            }
        );
    }
}

function invoke<C>( method: Function, context: C ) {
    return function (
        this: Closable,
        ...args: Array<any>
    ) {
        if( this.closed ) { return }
        return method.apply( this, args ) };
}