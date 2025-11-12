import type { ChangeInfo } from '../..';

import type { PathIdInfo } from './repository/paths';

import {
	afterAll,
	beforeAll,
	describe,
	expect,
	jest,
	test
} from '@jest/globals';

import { GLOBAL_SELECTOR } from '../..';

import * as AccessorModule  from '../accessor';
import PathRepository from './repository/paths';
import AtomValueRepository from './repository/atom-value';

import AccessorCache from '.';

const Accessor = AccessorModule.default;

/* @debug */
// "(\w+)": --- $1:
// Any<(\w+)> --- expect.any( $1 ) //
// console.info( onChangeMock.mock.calls[ 0 ] );
describe( '1xxxxa', () => {
// describe( 'AccessorCache class', () => {

	describe( 'atomize(...)', () => {
		let cache : AccessorCache<{}>;
		let mergeChangesSpy : jest.SpiedFunction<(
			changes: Readonly<ChangeInfo[ "changes" ]>,
			paths: Readonly<ChangeInfo[ "paths" ]>
		) => void>;
		beforeAll(() => {
			cache = new AccessorCache({});
			mergeChangesSpy = jest.spyOn( AtomValueRepository.prototype, 'mergeChanges' );
		});
		beforeEach(() => { mergeChangesSpy.mockClear() });
		afterAll(() => { mergeChangesSpy.mockRestore() });
		test( 'is a noop if an empty second argument supplied', () => {
			cache.atomize({}, []);
			expect( mergeChangesSpy ).not.toHaveBeenCalled();
			cache.atomize({ one: 1, two: 2 }, []);
			expect( mergeChangesSpy ).not.toHaveBeenCalled();
		} );
		test( 'merges changes into atoms', () => {
			const changes = { composed: { one: 1 }, two: 2 };
			const changedPaths = [[ 'composed', 'one' ], [ 'two' ]];
			cache.atomize( changes, changedPaths );
			expect( mergeChangesSpy ).toHaveBeenCalledTimes( 1 );
			expect( mergeChangesSpy ).toHaveBeenCalledWith( changes, changedPaths );
		} );
	} );
	describe( 'get(...)', () => {
		let reachedFirstRun = false;
		let cache : AccessorCache<{}>;
		let addClientSpy : jest.SpiedFunction<(clientId: string) => void>;
		let getPathInfoAtSpy : jest.SpiedFunction<(path: string) => PathIdInfo>;
		// @ts-ignore
		let accessorSpy = jest.SpiedClass<typeof AccessorModule>;
		beforeAll(() => {
			addClientSpy = jest.spyOn( Accessor.prototype, 'addClient' );
			getPathInfoAtSpy = jest.spyOn( PathRepository.prototype, 'getPathInfoAt' );
			accessorSpy = jest
				.spyOn( AccessorModule, 'default' )
				.mockImplementation(( ...args ) => new Accessor( ...args ));
		});
		beforeEach(() => {
			if( !reachedFirstRun ) {
				reachedFirstRun = true;
			} else {
				addClientSpy.mockClear();
				getPathInfoAtSpy.mockClear();
				accessorSpy.mockClear();
			}
			cache = new AccessorCache({});
		});
		afterAll(() => {
			addClientSpy.mockRestore();
			getPathInfoAtSpy.mockRestore();
			accessorSpy.mockRestore();
		});
		test( `defaults to obtaining ${ GLOBAL_SELECTOR } data`, () => {
			cache.get( 'TEST_CLIENT_ID' );
			expect( getPathInfoAtSpy ).toHaveBeenCalledTimes( 2 );
			for( let
				pathInfoMock = getPathInfoAtSpy.mock,
				pLen = pathInfoMock.calls.length,
				p = 0;
				p < pLen;
				p++
			) {
				expect( pathInfoMock.calls[ p ] ).toEqual([ GLOBAL_SELECTOR ]);
				expect( pathInfoMock.results[ p ].value ).toEqual({
					sanitizedPathId: 1, sourcePathId: 1
				});
			}
		} );
		test( `shares same accessor between clients`, () => {
			// setting up original accessor data at ['a.v.c', 'a.c.e']
			const PATHS = [ 'a.v.c', 'a.c.e' ];
			cache.get( 'REQUEST_1', ...PATHS );
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_1' ]);
			// first two calls for adding two non-existent
			// atom paths for this accesor client.
			// last two calls for retrieving the newly added
			// atom paths for this accessor client.
			expect( getPathInfoAtSpy ).toHaveBeenCalledTimes( 4 );
			const pathInfoMock = getPathInfoAtSpy.mock;
			// adding first path to atom repo
			expect( pathInfoMock.calls[ 0 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( pathInfoMock.results[ 0 ].value ).toEqual({
				sanitizedPathId: 1, sourcePathId: 1
			});
			// adding second path to atom repo
			expect( pathInfoMock.calls[ 1 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( pathInfoMock.results[ 1 ].value ).toEqual({
				sanitizedPathId: 2, sourcePathId: 2
			});
			// retrieving first path from atom repo
			expect( pathInfoMock.calls[ 2 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( pathInfoMock.results[ 2 ].value ).toEqual({
				sanitizedPathId: 1, sourcePathId: 1
			});
			// retrieving second path from atom repo
			expect( pathInfoMock.calls[ 3 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( pathInfoMock.results[ 3 ].value ).toEqual({
				sanitizedPathId: 2, sourcePathId: 2
			});
			// clearing out test mocks
			addClientSpy.mockClear();
			getPathInfoAtSpy.mockClear();
			// reusing same accessor for a different request
			cache.get( 'REQUEST_2', PATHS[ 0 ], PATHS[ 1 ] );
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_2' ]);
			// first two calls for retrieving the previously added
			// two atom paths for this new accessor client
			expect( getPathInfoAtSpy ).toHaveBeenCalledTimes( 2 );
			// retrieving first path from atom repo
			expect( pathInfoMock.calls[ 0 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( pathInfoMock.results[ 0 ].value ).toEqual({
				sanitizedPathId: 1, sourcePathId: 1
			});
			// retrieving second path from atom repo
			expect( pathInfoMock.calls[ 1 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( pathInfoMock.results[ 1 ].value ).toEqual({
				sanitizedPathId: 2, sourcePathId: 2
			});
		} );
		test( `reordering access paths will not produce new aaccessor`, () => {
			// setting up original accessor data at ['a.v.c', 'a.c.e']
			const PATHS = [ 'a.v.c', 'a.c.e' ];
			cache.get( 'REQUEST_1', ...PATHS );
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_1' ]);
			// first two calls for adding two non-existent
			// atom paths for this accesor client.
			// last two calls for retrieving the newly added
			// atom paths for this accessor client.
			expect( getPathInfoAtSpy ).toHaveBeenCalledTimes( 4 );
			const pathInfoMock = getPathInfoAtSpy.mock;
			// adding first path to atom repo
			expect( pathInfoMock.calls[ 0 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( pathInfoMock.results[ 0 ].value ).toEqual({
				sanitizedPathId: 1, sourcePathId: 1
			});
			// adding second path to atom repo
			expect( pathInfoMock.calls[ 1 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( pathInfoMock.results[ 1 ].value ).toEqual({
				sanitizedPathId: 2, sourcePathId: 2
			});
			// retrieving first path from atom repo
			expect( pathInfoMock.calls[ 2 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( pathInfoMock.results[ 2 ].value ).toEqual({
				sanitizedPathId: 1, sourcePathId: 1
			});
			// retrieving second path from atom repo
			expect( pathInfoMock.calls[ 3 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( pathInfoMock.results[ 3 ].value ).toEqual({
				sanitizedPathId: 2, sourcePathId: 2
			});
			// clearing out test mocks
			addClientSpy.mockClear();
			getPathInfoAtSpy.mockClear();
			// reusing same accessor for a request contaning reordered access paths
			cache.get( 'REQUEST_2', PATHS[ 1 ], PATHS[ 0 ] );
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_2' ]);
			// first two calls for retrieving the previously added
			// two atom paths for this new accessor client
			expect( getPathInfoAtSpy ).toHaveBeenCalledTimes( 2 );
			// retrieving first path from atom repo
			expect( pathInfoMock.calls[ 0 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( pathInfoMock.results[ 0 ].value ).toEqual({
				sanitizedPathId: 1, sourcePathId: 1
			});
			// retrieving second path from atom repo
			expect( pathInfoMock.calls[ 1 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( pathInfoMock.results[ 1 ].value ).toEqual({
				sanitizedPathId: 2, sourcePathId: 2
			});
		} );
	} );
	describe( 'unlinkClient(...)', () => {
		class TestCache extends AccessorCache<{}> {
			get numberOfAccessors() {
				return Object.keys( this.accessRegister ).length;
			}
			public getAccessedPathGroupsBy( clientId : string ) {
				return this. _getAccessedPathGroupsBy( clientId );
			}
		}
		let reachedFirstRun = false;
		let cache : TestCache;
		let removeClientSpy : jest.SpiedFunction<(clientId: string) => void>;
		beforeAll(() => {
			removeClientSpy = jest.spyOn( Accessor.prototype, 'removeClient' );
		});
		beforeEach(() => {
			if( !reachedFirstRun ) {
				reachedFirstRun = true;
			} else {
				removeClientSpy.mockClear();
			}
			cache = new TestCache({});
		});
		afterAll(() => removeClientSpy.mockRestore() );
		test( '1xxxxc', () => {
		// test( `removes client from all existing accessors`, () => {
			const PATHS = [ 'a.v.c', 'a.c.e' ];
			cache.get( 'REQUEST_1', ...PATHS, 'j.b.e' );
			cache.get( 'REQUEST_2', ...PATHS );
			cache.get( 'REQUEST_1', ...PATHS );
			cache.unlinkClient( 'REQUEST_1' );
			expect( removeClientSpy ).toHaveBeenCalledTimes( 2 );
			expect( removeClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_1' ]);
			expect( removeClientSpy.mock.calls[ 1 ] ).toEqual([ 'REQUEST_1' ]);
			removeClientSpy.mockClear();
			cache.unlinkClient( 'REQUEST_1' );
			expect( removeClientSpy ).toHaveBeenCalledTimes( 1 );
			removeClientSpy.mockClear();
			cache.unlinkClient( 'REQUEST_2' );
			expect( removeClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( removeClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_2' ]);
		} );
		test( `discards an accessor withh last client removal`, () => {
			expect( cache.numberOfAccessors ).toBe( 0 );
			const PATHS = [ 'a.v.c', 'a.c.e' ];
			cache.get( 'REQUEST_1', ...PATHS, 'j.b.e' );
			cache.get( 'REQUEST_2', ...PATHS );
			cache.get( 'REQUEST_1', ...PATHS );
			expect( cache.numberOfAccessors ).toBe( 2 );
			expect( cache.getAccessedPathGroupsBy( 'REQUEST_1' ) ).toHaveLength( 2 );
			expect( cache.getAccessedPathGroupsBy( 'REQUEST_2' ) ).toHaveLength( 1 );
			// will remove accessor at [ ...PATHS, 'j.b.e' ] along with the client REQUEST_1
			cache.unlinkClient( 'REQUEST_1' );
			expect( cache.numberOfAccessors ).toBe( 1 );
			expect( cache.getAccessedPathGroupsBy( 'REQUEST_1' ) ).toHaveLength( 0 );
			expect( cache.getAccessedPathGroupsBy( 'REQUEST_2' ) ).toHaveLength( 1 );
			// will remove the remaining accessor at PATHS along with the last client REQUEST_2
			cache.unlinkClient( 'REQUEST_2' );
			expect( cache.numberOfAccessors ).toBe( 0 );
			expect( cache.getAccessedPathGroupsBy( 'REQUEST_1' ) ).toHaveLength( 0 );
			expect( cache.getAccessedPathGroupsBy( 'REQUEST_2' ) ).toHaveLength( 0 );
		} );
	} );
} );	
