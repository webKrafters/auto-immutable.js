import {
	beforeAll,
	describe,
	expect,
    jest,
	test
} from '@jest/globals';

import isEqual from 'lodash.isequal';

import { DELETE_TAG, GLOBAL_SELECTOR, MOVE_TAG, type Value } from './';

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
            jest.useFakeTimers();
            
            const { cache, connection, teardown } = setup();

            const propertyPaths = [ 'valid', 'b.message' ];
            
            let d = connection.get( ...propertyPaths );
            jest.runAllTimers();

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
            jest.runAllTimers();

            passedFoundTest =
                Object.keys( v ).length === 2
                && v[ 'b.message' ] as unknown as string === protectedData.b.message
                && v.valid as unknown as boolean === protectedData.valid;

            jest.useRealTimers();

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
            jest.useFakeTimers();
            const { connection } = setup();
            const changes = clonedeep( protectedData );
            connection.set( changes );
            const gsData = connection.get(
                GLOBAL_SELECTOR, 'a', 'valid'
            )[ GLOBAL_SELECTOR ];
            jest.runAllTimers();
            expect( gsData ).toStrictEqual( changes );
            expect( gsData ).not.toBe( changes );
            jest.useRealTimers();
        } );
        test( 'fetches the GLOBAL_SELECTOR path by default', () => {
            jest.useFakeTimers();
            expect( setup( clonedeep( protectedData ) ).connection.get() ).toEqual({[ GLOBAL_SELECTOR ]: protectedData });
            jest.runAllTimers();
            jest.useRealTimers();
        } );
        test( 'in isolation, maintains communication with the context', () => {
            jest.useFakeTimers();
            const a = setup();
            expect( a.connection.get() ).toEqual({
                [ GLOBAL_SELECTOR ]: {}
            });
            jest.runAllTimers();
            a.connection.set({ b: 22 });
            expect( a.connection.get( 'a' ) ).toEqual({ a: undefined });
			jest.runAllTimers();
            expect( a.connection.get( 'a', 'b' ) ).toEqual({
                b: 22,
                a: undefined
            });
            jest.runAllTimers();
            expect( a.connection.get() ).toEqual({
                [ GLOBAL_SELECTOR ]: { b: 22 }
            });
            jest.runAllTimers();
            a.connection.set({ a: 1024 });
            expect( a.connection.get( 'a' ) ).toEqual({ a: 1024 });
			jest.runAllTimers();
            expect( a.connection.get( 'b', 'a' ) ).toEqual({
                b: 22,
                a: 1024
            });
            jest.runAllTimers();
            expect( a.connection.get() ).toEqual({
                [ GLOBAL_SELECTOR ]: {
                    a: 1024,
					b: 22
                }
            });
            jest.runAllTimers();
            jest.useRealTimers();
        } );
    } );
    describe( 'disconnection', () => {
        test(
            'discards internally held refs and sets `disconnected` flag',
            () => {
                jest.useFakeTimers();

                const { cache, connection, teardown } = setup();

                const cacheGetSpy = jest
                    .spyOn( cache, 'get' )
                    .mockReturnValue({});
                const setSpy = jest
                    .spyOn( deps, 'setValue' )
                    .mockReturnValue( undefined );

                connection.get( expect.any( Array ) as unknown as string );
                jest.runAllTimers();
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

                jest.useRealTimers();

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
        jest.useFakeTimers();
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
        jest.runAllTimers();
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
        jest.runAllTimers();
        jest.useRealTimers();
        connection.disconnect();
    } );
    test( 'handles deep value computed update requests', () => {
        jest.useFakeTimers();
         
        const source = createSourceData();
        type Data = typeof source;
        const { connection } = setup( source );

        expect( connection.get() ).toEqual({[ GLOBAL_SELECTOR ]: source });
        jest.runAllTimers();
        
        connection.set({
            friends: { [ MOVE_TAG ]: [ -1, 1 ] },
            isActive: true,
            history: {
                places: {
                    '2': {
                        city: 'Marakesh',
                        country: 'Morocco'
                    } as unknown as Data["history"]["places"][0]
                } as unknown as Data["history"]["places"]
            },
            tags: { [ DELETE_TAG ]: [ 3, 5 ] }
        } as unknown as Data );
        const defaultState = createSourceData();
        const expectedValue = { ...defaultState };
        expectedValue.friends = [ 0, 2, 1 ].map( i => defaultState.friends[ i ] );
        expectedValue.history.places[ 2 ].city = 'Marakesh';
        expectedValue.history.places[ 2 ].country = 'Morocco';
        expectedValue.isActive = true;
        expectedValue.tags = [ 0, 1, 2, 4, 6 ].map( i => defaultState.tags[ i ] );

        expect( connection.get() ).toEqual({[ GLOBAL_SELECTOR ]: expectedValue });
        jest.runAllTimers();

        connection.disconnect();

        jest.useRealTimers();
						
    } );
    test( 'handles atoms sharing', () => {
        jest.useFakeTimers();
        const source = createSourceData();
        const { connection } = setup( source );
        const data1 = connection.get(
            'history.places[2].city',
            'history.places[2].country',
            'history.places[2].year',
            'isActive',
            'tags[5]',
            'tags[6]',
            '@@GLOBAL'
        );
        jest.runAllTimers();
        const data2 = connection.get(
            'friends[1].name.last',
            'history.places[2].country',
            'history.places[2].year',
            'company',
            'tags[5]',
        );
        jest.runAllTimers();
        expect( data1 ).toEqual({
            'history.places[2].city': source.history.places[ 2 ].city,
            'history.places[2].country': source.history.places[ 2 ].country,
            'history.places[2].year': source.history.places[ 2 ].year,
            'isActive': source.isActive,
            'tags[5]': source.tags[ 5 ],
            'tags[6]': source.tags[ 6 ],
            '@@GLOBAL': source
        });
        expect( data2 ).toEqual({
            'friends[1].name.last': source.friends[ 1 ].name.last,
            'history.places[2].country': source.history.places[ 2 ].country,
            'history.places[2].year': source.history.places[ 2 ].year,
            company: source.company,
            'tags[5]': source.tags[ 5 ],
        });
        connection.disconnect();
        jest.useRealTimers();
    } );
} );
