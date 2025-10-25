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
} from '.';

import setValue from './set';

import { Immutable } from './main';

import AccessorCache from './model/accessor-cache';

export const deps = { noop: () => {}, setValue }

export interface Source<T extends Value> {
    key: Immutable<T>,
    map: WeakMap<Immutable<T>, AccessorCache<T>>
}

export class Connection<T extends Value> {

    private _endSourceWatch : () => void;
    private _id : string;
    private _source : Source<T>

    constructor( id : string, source: Source<Value> );
    constructor( id : string, source: Source<ValueObject> );
    constructor( id : string, source: Source<ValueObjectCloneable> );
    constructor( id : string, source: Source<T> ){
        this._id = id;
        this._source = source;
        this._endSourceWatch = this._source.key.onClose(
            () => this.disconnect()
        );
    }

    get disconnected() {
        if( !this._source ) { return true }
        if( this._source?.map.get( this._source.key ) instanceof AccessorCache ) {
            return false;
        }
        // addresses eventual gc collection of source immutable when not
        // properly disposed. (i.e. w/o calling Immutable.close(...) prior)
        // istanbul ignore next
        this._source = undefined;
        return true;
    }
    
    get instanceId() { return this._id }

    @invoke
    disconnect() {
        this._source.map
            .get( this._source.key )
            .unlinkClient( this._id );
        this._endSourceWatch();
        this._endSourceWatch = undefined;
        this._source = undefined;
    }

    @invoke
    get( ...propertyPaths : Array<string> ) {
        return this._source.map
            .get( this._source.key )
            .get( this._id, ...propertyPaths );
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
            this._source.map.get( this._source.key ).origin,
            changes,
            ( changes, paths ) => {
                // addresses eventual gc collection when not properly
                // disposed. (i.e. w/o calling this.disconnect(...) prior)
                // istanbul ignore next
                if( this.disconnected ) { return }
                this._source.map
                    .get( this._source.key )
                    .atomize( changes, paths );
                onComplete( changes, paths );
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
