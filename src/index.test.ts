import { Connection } from './connection';
import { Immutable } from '.';

describe( 'Immutable class', () => {
    test( 'creates an shareable Immutable instance', () => {
        expect( new Immutable( {} ).connect() )
            .toBeInstanceOf( Connection );
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
} );
