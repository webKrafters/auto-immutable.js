import type {
    Changes,
    Listener,
    UpdatePayload,
    UpdatePayloadArray,
	UpdatePayloadArrayCore,
	UpdatePayloadArrayCoreCloneable,
	UpdatePayloadCore,
	UpdatePayloadCoreCloneable,
    Value,
    ValueObject,
    ValueObjectCloneable
} from './types';

import setValue from './set';

import { Immutable } from '.';

import AccessorCache from './model/accessor-cache';

export const deps = { noop: () => {}, setValue }

export interface Source<T extends Value> {
    key: Immutable<T>,
    map: WeakMap<Immutable<T>, AccessorCache<T>>
}

export class Connection<T extends Value> {

    #endSourceWatch : () => void;
    #id : string;
    #source : Source<T>

    constructor( id : string, source: Source<Value> );
    constructor( id : string, source: Source<ValueObject> );
    constructor( id : string, source: Source<ValueObjectCloneable> );
    constructor( id : string, source: Source<T> ){
        this.#id = id;
        this.#source = source;
        this.#endSourceWatch = this.#source.key.onClose(
            () => this.disconnect()
        );
    }

    get disconnected() {
        if( this.#source ) {
            if( this.#source?.map.get( this.#source.key ) instanceof AccessorCache ) {
                return false;
            }
            // addresses eventual gc collection of source immutable when not
            // properly disposed. (i.e. w/o calling Immutable.close(...) prior)
            // istanbul ignore next
            this.#source = undefined;
        }
        return true;
    }
    get instanceId() { return this.#id }

    @invoke
    disconnect() {
        this.#source.map
            .get( this.#source.key )
            .unlinkClient( this.#id );
        this.#endSourceWatch();
        this.#endSourceWatch = undefined;
        this.#source = undefined;
    }

    @invoke
    get( ...propertyPaths : Array<string> ) {
        return this.#source.map
            .get( this.#source.key )
            .get( this.#id, ...propertyPaths );
    }

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
            this.#source.map.get( this.#source.key ).origin,
            changes,
            changes => {
                // addresses eventual gc collection when not properly
                // disposed. (i.e. w/o calling this.disconnect(...) prior)
                // istanbul ignore next
                if( this.disconnected ) { return }
                this.#source.map
                    .get( this.#source.key )
                    .atomize( changes as Changes<T> );
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