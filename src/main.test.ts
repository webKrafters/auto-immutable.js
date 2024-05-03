import { Connection } from './connection';
import { Closable, Immutable } from './main';

describe( 'Immutable class', () => {
    describe( 'identity', () => {
        let immutable : Immutable<{}>;
        beforeAll(() => { immutable = new Immutable({}) });
        test( 'is closable', () => {
            expect( immutable ).toBeInstanceOf( Closable );
        } );
        test( 'is shareable through cosumer connections', () => {
            expect( immutable.connect() ).toBeInstanceOf( Connection );
        } );
    } );
    test( 'An immutable instance can be updated by any of its connections', () => {
        const path = 'test.2';
        const value = {};

        const im0 = new Immutable( value );
        const im1 = new Immutable( value );

        const conn00 = im0.connect();
        const conn01 = im0.connect();
        const conn02 = im0.connect();

        const conn10 = im1.connect();
        const conn11 = im1.connect();

        const conn03 = im0.connect();

        expect( conn00.get( path )[ path ] ).toBeUndefined();
        expect( conn01.get( path )[ path ] ).toBeUndefined();
        expect( conn02.get( path )[ path ] ).toBeUndefined();
        expect( conn03.get( path )[ path ] ).toBeUndefined();

        expect( conn10.get( path )[ path ] ).toBeUndefined();
        expect( conn11.get( path )[ path ] ).toBeUndefined();

        conn01.set({ test: [ 43, 90, 78, 22 ] });
        
        expect( conn00.get( path )[ path ] ).toBe( 78 );
        expect( conn01.get( path )[ path ] ).toBe( 78 );
        expect( conn02.get( path )[ path ] ).toBe( 78 );
        expect( conn03.get( path )[ path ] ).toBe( 78 );

        expect( conn10.get( path )[ path ] ).toBeUndefined();
        expect( conn11.get( path )[ path ] ).toBeUndefined();

        conn11.set({ test: [ 'W', 'X', 'Y', 'Z' ] });

        expect( conn00.get( path )[ path ] ).toBe( 78 );
        expect( conn01.get( path )[ path ] ).toBe( 78 );
        expect( conn02.get( path )[ path ] ).toBe( 78 );
        expect( conn03.get( path )[ path ] ).toBe( 78 );

        expect( conn10.get( path )[ path ] ).toEqual( 'Y' );
        expect( conn11.get( path )[ path ] ).toEqual( 'Y' );
    } );
    test( 'can monitor its closing event', () => {
        const im = new Immutable({});
        const closeListener = jest.fn();
        im.onClose( closeListener );
        expect( closeListener ).not.toHaveBeenCalled();
        im.close();
        expect( closeListener ).toHaveBeenCalledTimes( 1 );
        expect( closeListener ).toHaveBeenCalledWith();
    } );
    test( 'can stop monitoring its closing event', () => {
        const im = new Immutable({});
        const closeListener = jest.fn();
        const stopWatching = im.onClose( closeListener );
        expect( closeListener ).not.toHaveBeenCalled();
        stopWatching();
        im.close();
        expect( closeListener ).not.toHaveBeenCalled();
    } );
    test( 'disconnects all of its currently held connections on close', () => {
        const NUM_CONNECTIONS = 4;
        const im = new Immutable({});
        const cnDisconnectSpy = jest.spyOn( Connection.prototype, 'disconnect' );
        for( let i = NUM_CONNECTIONS; i--; ) { im.connect() }
        expect( cnDisconnectSpy ).not.toHaveBeenCalled();
        im.close();
        expect( cnDisconnectSpy ).toHaveBeenCalledTimes( NUM_CONNECTIONS );
        cnDisconnectSpy.mockRestore();
    } );
    test( 'only holds active connections', () => {
        const NUM_CONNECTIONS = 7;
        const NUM_EXITS = 3;
        const im = new Immutable({});
        const cnDisconnectSpy = jest.spyOn( Connection.prototype, 'disconnect' );
        const connections : Array<Connection<{}>> = [];
        for( let i = NUM_CONNECTIONS; i--; ) { connections.push( im.connect() ) }
        expect( cnDisconnectSpy ).not.toHaveBeenCalled();
        for( let i = NUM_EXITS; i--; ) { connections[ i ].disconnect() };
        expect( cnDisconnectSpy ).toHaveBeenCalledTimes( NUM_EXITS );
        expect( im.closed ).toBe( false );
        cnDisconnectSpy.mockClear();
        im.close();
        expect( cnDisconnectSpy ).toHaveBeenCalledTimes( NUM_CONNECTIONS - NUM_EXITS );
        expect( im.closed ).toBe( true );
        cnDisconnectSpy.mockRestore();
    } );
    test( 'maintains and communicates status', () => {
        const im = new Immutable({});
        expect( im.closed ).toBe( false );
        expect( im.connect() ).toBeInstanceOf( Connection );
        expect( im.onClose( () => {} ) ).toEqual( expect.any( Function )  );
        im.close();
        expect( im.closed ).toBe( true );
        expect( im.connect() ).toBeUndefined();
        expect( im.onClose( () => {} ) ).toEqual( undefined );
    } );
} );
