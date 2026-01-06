import {
	beforeAll,
	describe,
	expect,
    jest,
	test
} from '@jest/globals';

import isEqual from 'lodash.isequal';

import { GLOBAL_SELECTOR, type Value } from './';

import AccessorCache from './model/accessor-cache';
import { Immutable } from './main';
import { deps, Connection } from './connection';
import clonedeep from '@webkrafters/clone-total';

import createSourceData from './test-artifacts/data/create-data-obj';

type Data = Value & {
    a : number,
    b: { message: string },
    valid: boolean
};

describe( 'Connection class', () => { 
    function setup<T extends {}>( originData : T = {} as T ) {
        const cache = new AccessorCache<T>( originData );
        const imDeps = require( './main' ).deps;
        const  assignCacheOrig = imDeps.assignCache;
        imDeps.assignCache = () => cache;
        const expectedId = 'TEST ID';
        const key = new Immutable<T>( originData );
        const map = new WeakMap();
        map.set( key, imDeps.assignCache() );
        const cn = new Connection<T>( expectedId, { key, map } );
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
        let protectedData : Data;
        beforeAll(() => {
            const { cache, connection, teardown } = setup();

            const propertyPaths = [ 'valid', 'b.message' ];
            
            let d = connection.get( ...propertyPaths );
            passedNoneFoundTest =
                Object.keys( d ).length === 2
                    && d[ 'b.message' ] === undefined
                    && d.valid === undefined;

            protectedData = {
                a: 333,
                b: {
                    message: 'Doing consumer testing...'
                },
                valid: true
            };

            const prevCacheOrigin = { ...cache.origin };

            const setCallback = jest.fn();

            connection.set( clonedeep( protectedData ), setCallback );

            updateTest.prevCacheOrigin = prevCacheOrigin;
            updateTest.cacheOrigin = cache.origin;
            updateTest.data = protectedData;
            {
                const setCallbackCalls = setCallback.mock.calls;
                passedUpdateCompleteNotifiedTest =
                    setCallbackCalls.length === 1 && 
                    isEqual( setCallbackCalls[ 0 ][ 0 ], protectedData ) &&
                    isEqual(
                        setCallbackCalls[ 0 ][ 1 ],
                        [ [ 'a' ], [ 'b' ], [ 'valid' ] ]
                    );
            }

            const v = connection.get( ...propertyPaths );

            passedFoundTest =
                Object.keys( v ).length === 2
                && v[ 'b.message' ] as unknown as string === protectedData.b.message
                && v.valid as unknown as boolean === protectedData.valid;

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
        test( 'GLOBAL_SELECTOR returns a copy of the entire immutable object', () => {
            const { connection } = setup();
            const changes = clonedeep( protectedData );
            connection.set( changes );
            const gsData = connection.get(
                GLOBAL_SELECTOR, 'a', 'valid'
            )[ GLOBAL_SELECTOR ];
            expect( gsData ).toStrictEqual( changes );
            expect( gsData ).not.toBe( changes );
        } );
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
    test( 'runs full fetch on complex paths', () => {
        const source = createSourceData();
        type Data = typeof source;
        const { connection } = setup( source );
        const sMap = [
            'friends[1].name',
            'history.places[2].city',
            'history.places[2].country',
            'history.places[2].year',
            'isActive',
            'tags[5]',
            'tags[6]',
            '@@GLOBAL'
        ];
        expect( connection.get( ...sMap ) ).toEqual({
            'friends[1].name':  source.friends[ 1 ].name,
            'history.places[2].city': source.history.places[ 2 ].city,
            'history.places[2].country': source.history.places[ 2 ].country,
            'history.places[2].year': source.history.places[ 2 ].year,
            isActive: source.isActive,
            'tags[5]': source.tags[ 5 ],
            'tags[6]': source.tags[ 6 ],
            '@@GLOBAL': source
        });
        connection.set({
            isActive: true,
            friends: { 1: { name: { last: 'NEW LNAME' } } },
            history: {
                places: {
                    2: {
                        city: 'Marakesh',
                        country: 'Morocco'
                    }
                }
            } 
        } as unknown as Data );
        const updatedDataEquiv = createSourceData();
        updatedDataEquiv.friends[ 1 ].name.last = 'NEW LNAME';
        updatedDataEquiv.history.places[ 2 ].city = 'Marakesh';
        updatedDataEquiv.history.places[ 2 ].country = 'Morocco';
        updatedDataEquiv.isActive = true;
        expect( connection.get( ...sMap ) ).toEqual({
            'friends[1].name': updatedDataEquiv.friends[ 1 ].name,
            'history.places[2].city': updatedDataEquiv.history.places[ 2 ].city,
            'history.places[2].country': updatedDataEquiv.history.places[ 2 ].country,
            'history.places[2].year': source.history.places[ 2 ].year,
            isActive: updatedDataEquiv.isActive,
            'tags[5]': source.tags[ 5 ],
            'tags[6]': source.tags[ 6 ],
            '@@GLOBAL': updatedDataEquiv
        });
        connection.disconnect();
    } );
    test( 'handles atoms sharing', () => {
        const source = createSourceData();
        const { connection } = setup( source );
        connection.get(
            'history.places[2].city',
            'history.places[2].country',
            'history.places[2].year',
            'isActive',
            'tags[5]',
            'tags[6]',
            '@@GLOBAL'
        );
        const data2 = connection.get(
            'friends[1].name.last',
            'history.places[2].country',
            'history.places[2].year',
            'company',
            'tags[5]',
        );
        expect( data2 ).toEqual({
            'friends[1].name.last': source.friends[ 1 ].name.last,
            'history.places[2].country': source.history.places[ 2 ].country,
            'history.places[2].year': source.history.places[ 2 ].year,
            company: source.company,
            'tags[5]': source.tags[ 5 ],
        });
        connection.disconnect();
    } );
} );
