import {
	beforeAll,
	describe,
	expect,
    jest,
	test
} from '@jest/globals';

import AccessorCache from './model/accessor-cache';
import { Immutable } from './main';
import { deps, Connection } from './connection';

describe( 'Connection class', () => { 
    const setup = () => {
        const cache = new AccessorCache({});
        const imDeps = require( './main' ).deps;
        const  assignCacheOrig = imDeps.assignCache;
        imDeps.assignCache = () => cache;
        const expectedId = 'TEST ID';
        const key = new Immutable({});
        const map = new WeakMap();
        map.set( key, imDeps.assignCache() );
        const cn = new Connection( expectedId, { key, map } );
        const teardown = () => {
            imDeps.assignCache = assignCacheOrig;
        }
        return { cache, connection: cn, expectedId, key, map, teardown };
    };
    test( 'constructs an immutable connection instance', () => {
        const { connection, expectedId, teardown } = setup();
        expect( connection ).toBeInstanceOf( Connection );
        expect( connection.instanceId ).toBe( expectedId );
        expect( connection.disconnected ).toBe( false );
        teardown();
    } );
    describe( '', () => {
        let passedFoundTest : boolean;
        let passedNoneFoundTest : boolean;
        let passedUpdateCompleteNotifiedTest : boolean;
        let updateTest : {[x:string]:any} = {};
        beforeAll(() => {
            const { cache, connection, teardown } = setup();

            const propertyPaths = [ 'valid', 'b.message' ];
            
            let d = connection.get( ...propertyPaths );
            passedNoneFoundTest =
            Object.keys( d ).length === 2
                && d[ 'b.message' ] === undefined
                && d.valid === undefined;

            const protectedData = {
                a: 333,
                b: {
                    message: 'Doing consumer testing...'
                },
                valid: true
            };

            const prevCacheOrigin = { ...cache.origin };

            const setCallback = jest.fn();

            connection.set( protectedData, setCallback );

            updateTest.prevCacheOrigin = prevCacheOrigin;
            updateTest.cacheOrigin = cache.origin;
            updateTest.data = protectedData;
            
            const setCallbackCalls = setCallback.mock.calls;
            passedUpdateCompleteNotifiedTest =
                setCallbackCalls.length === 1 && 
                setCallbackCalls[ 0 ][ 0 ] === protectedData;

            const v = connection.get( ...propertyPaths );

            passedFoundTest =
                Object.keys( v ).length === 2
                && v[ 'b.message' ] === protectedData.b.message
                && v.valid === protectedData.valid;

           teardown();
        } );
        test(
            'gets from cache value(s) located at properyPath(s)',
            () => { expect( passedFoundTest ).toBe( true ) }
        );
        test(
            'defaults to `undefined` for property paths not found',
            () => { expect( passedNoneFoundTest ).toBe( true ) }
        );
        test( 'updates the cache data with new changes', () => {
            expect( updateTest.cacheOrigin ).not.toEqual( updateTest.prevCacheOrigin );
            expect( updateTest.cacheOrigin ).toEqual( updateTest.data );
        } );
        test(
            'calls any post update callback with the `changes` payload',
            () => { expect( passedUpdateCompleteNotifiedTest ).toBe( true ) }
        );
    } );
    describe( 'disconnection', () => {
        test(
            'discards internally held refs and sets `disconnected` flag',
            () => {
                const { cache, connection, teardown } = setup();

                const cacheGetSpy = jest
                    .spyOn( cache, 'get' )
                    .mockReturnValue({});
                const setSpy = jest
                    .spyOn( deps, 'setValue' )
                    .mockReturnValue( undefined );

                connection.get( expect.any( Array ) as unknown as string );
                expect( cacheGetSpy ).toHaveBeenCalledTimes( 1 );
                connection.set( {} );
                expect( setSpy ).toHaveBeenCalledTimes( 1 );

                cacheGetSpy.mockClear();                
                setSpy.mockClear();

                connection.disconnect();

                expect( connection.disconnected ).toBe( true );
                connection.get( expect.any( Array ) as unknown as string );
                expect( cacheGetSpy ).not.toHaveBeenCalled();
                connection.set( {} );
                expect( setSpy ).not.toHaveBeenCalled();

                jest.restoreAllMocks();
        
                teardown();
            }
        );
        test(
            'once disconnected ignores further disconnection requests',
            () => {
                const { cache, connection, teardown } = setup();

                const cacheUnlinkSpy = jest
                    .spyOn( cache, 'unlinkClient' )
                    .mockReturnValue( undefined );

                connection.disconnect();
                expect( cacheUnlinkSpy ).toHaveBeenCalledTimes( 1 );
                cacheUnlinkSpy.mockClear();
                connection.disconnect();
                expect( cacheUnlinkSpy ).not.toHaveBeenCalled();
                cacheUnlinkSpy.mockClear();
                connection.disconnect();
                expect( cacheUnlinkSpy ).not.toHaveBeenCalled();

                cacheUnlinkSpy.mockRestore();
        
                teardown();
            }
        );
    } );
} );
