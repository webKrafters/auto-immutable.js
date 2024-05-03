interface Context {
    darkmode : DarkmodeProto; 
}

const noop = () => {};

type DkmObserver = ( setting : boolean ) => void;

class Observable {
    #observers = new Set<DkmObserver>();
    dispatch( setting : boolean ) { this.#observers.forEach( fn => fn( setting ) ) }
    unwatch ( fn : DkmObserver ) { this.#observers.add( fn ) }
    watch ( fn : DkmObserver ) { this.#observers.delete( fn ) };
}

class DarkmodeProto {
    static LS_KEY = '_dkm_';
    static SUPPORTED = false;
    get value () { return undefined }
    set value ( value : boolean ) {}
    unwatch ( fn : DkmObserver ) {}
    watch ( fn : DkmObserver ) {}
}

class Darkmode extends DarkmodeProto {
    static SUPPORTED = true;
    #observable = new Observable();
    #value : boolean;
    get value () { return this.#value }
    set value ( value : boolean ) {
        this.#value = value;
        this.#observable.dispatch( value );
    }
    unwatch = this.#observable.unwatch.bind( this.#observable )
    watch = this.#observable.watch.bind( this.#observable )
}

const context : Context = ( w => {
    const ctx : Context = { darkmode: null };
    ctx.darkmode.unwatch = ctx.darkmode.watch = noop;
    if( !w.localStorage ) {
        ctx.darkmode = new DarkmodeProto();
    } else {
        localStorage.getItem( Darkmode.LS_KEY )  === '1' &&
        document.querySelector( 'body' ).classList.add( 'dark' );
        ctx.darkmode = new Darkmode();
        ctx.darkmode.watch( setting => {
            const classList = document.querySelector( 'body' ).classList;
            if( setting ) {
                localStorage.setItem( Darkmode.LS_KEY, '1' );
                return classList.add( 'dark' );
            }
            localStorage.removeItem( Darkmode.LS_KEY ) ;
            classList.remove( 'dark' );
        } );
    }
    return ctx;
} )( window );