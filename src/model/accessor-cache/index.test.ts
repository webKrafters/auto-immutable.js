import type { AccessorResponse, ChangeInfo } from '../..';

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
import { isReadonly } from '../../test-artifacts/utils';

const Accessor = AccessorModule.default;


class TestCache extends AccessorCache<{}> {
	get numberOfAccessors() {
		return Object.keys( this.accessRegister ).length;
	}
	public getAccessedPathGroupsBy( clientId : string ) {
		return this. _getAccessedPathGroupsBy( clientId );
	}
}

describe( 'AccessorCache class', () => {
	describe( 'atomize(...)', () => {
		let cache : AccessorCache<{}>;
		let mergeChangesSpy : jest.SpiedFunction<(
			changes: ChangeInfo[ "changes" ],
			paths: ChangeInfo[ "paths" ]
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
			jest.useFakeTimers();
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
			jest.useRealTimers();
		});
		test( `defaults to obtaining ${ GLOBAL_SELECTOR } data`, () => {
			cache.get( 'TEST_CLIENT_ID' );
			expect( getPathInfoAtSpy ).toHaveBeenCalledTimes( 1 );
			expect( getPathInfoAtSpy.mock.calls[ 0 ] ).toEqual([ GLOBAL_SELECTOR ]);
			expect( getPathInfoAtSpy.mock.results[ 0 ].value ).toEqual({
				sanitizedPathId: 1, sourcePathId: 1
			});
		} );
		test( `shares same accessor between clients`, () => {
			// setting up original accessor data at ['a.v.c', 'a.c.e']
			const PATHS = [ 'a.v.c', 'a.c.e' ];
			cache.get( 'REQUEST_1', ...PATHS );
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_1' ]);
			expect( getPathInfoAtSpy ).toHaveBeenCalledTimes( 2 );
			expect( getPathInfoAtSpy.mock.calls[ 0 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( getPathInfoAtSpy.mock.results[ 0 ].value ).toEqual({
				sanitizedPathId: 1, sourcePathId: 1
			});
			expect( getPathInfoAtSpy.mock.calls[ 1 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( getPathInfoAtSpy.mock.results[ 1 ].value ).toEqual({
				sanitizedPathId: 2, sourcePathId: 2
			});
			// clearing out test mocks
			addClientSpy.mockClear();
			getPathInfoAtSpy.mockClear();
			
			// reusing same accessor for a different request

			cache.get( 'REQUEST_2', PATHS[ 0 ], PATHS[ 1 ] );
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_2' ]);
			expect( getPathInfoAtSpy ).toHaveBeenCalledTimes( 2 );
			// retrieving first path from atom repo
			expect( getPathInfoAtSpy.mock.calls[ 0 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( getPathInfoAtSpy.mock.results[ 0 ].value ).toEqual({
				sanitizedPathId: 1, sourcePathId: 1
			});
			// retrieving second path from atom repo
			expect( getPathInfoAtSpy.mock.calls[ 1 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( getPathInfoAtSpy.mock.results[ 1 ].value ).toEqual({
				sanitizedPathId: 2, sourcePathId: 2
			});
		} );
		test( `reordering access paths will not produce new aaccessor`, () => {
			// setting up original accessor data at ['a.v.c', 'a.c.e']
			const PATHS = [ 'a.v.c', 'a.c.e' ];
			cache.get( 'REQUEST_1', ...PATHS );
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_1' ]);
			expect( getPathInfoAtSpy ).toHaveBeenCalledTimes( 2 );
			// adding first path to atom repo
			expect( getPathInfoAtSpy.mock.calls[ 0 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( getPathInfoAtSpy.mock.results[ 0 ].value ).toEqual({
				sanitizedPathId: 1, sourcePathId: 1
			});
			// adding second path to atom repo
			expect( getPathInfoAtSpy.mock.calls[ 1 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( getPathInfoAtSpy.mock.results[ 1 ].value ).toEqual({
				sanitizedPathId: 2, sourcePathId: 2
			});
			// clearing out test mocks
			addClientSpy.mockClear();
			getPathInfoAtSpy.mockClear();

			// reusing same accessor for a request contaning reordered access paths
			
			cache.get( 'REQUEST_2', PATHS[ 1 ], PATHS[ 0 ] );
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_2' ]);
			expect( getPathInfoAtSpy ).toHaveBeenCalledTimes( 2 );
			// retrieving second path from atom repo
			expect( getPathInfoAtSpy.mock.calls[ 0 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( getPathInfoAtSpy.mock.results[ 0 ].value ).toEqual({
				sanitizedPathId: 2, sourcePathId: 2
			});
			// retrieving first path from atom repo
			expect( getPathInfoAtSpy.mock.calls[ 1 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( getPathInfoAtSpy.mock.results[ 1 ].value ).toEqual({
				sanitizedPathId: 1, sourcePathId: 1
			});
		} );
		describe( 'result traits', () => {
			// setting up original accessor data at ['a[2].v.c', 'a.c[22][3].e[0]']
			const PATHS = [ 'a[2].v.c', 'a.c[22][3].e[0]' ];
			let result : AccessorResponse<{}>;
			beforeAll(() => {
				jest.useFakeTimers();
				const cache = new AccessorCache({
					a: {
						2: { v: { c: { x: 88, y: 99, z: 110 } } },
						c: { 22: [ 1, 2, 3, { e: [ 92, 'testing' ] } ] }
					}
				});
				result = cache.get( 'REQUEST_1', ...PATHS );
				jest.useRealTimers();
			});
			test( `ensures that responses are mapped to client supplied paths`, () => {
				expect( result ).toEqual({
					'a[2].v.c': { x: 88, y: 99, z: 110 },
					'a.c[22][3].e[0]': 92
				});
			} );
			test( `returns only readonly properties`, () => {
				expect( Object.values( result ).every( isReadonly ) ).toBe( true );
			} );
		} );
	} );
	describe( 'unlinkClient(...)', () => {
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
		test( `removes client from all existing associated accessors`, () => {
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
			expect( removeClientSpy ).not.toHaveBeenCalled();
			removeClientSpy.mockClear();
			cache.unlinkClient( 'REQUEST_2' );
			expect( removeClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( removeClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_2' ]);
		} );
		test( `discards an accessor with last client removal`, () => {
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
	describe( 'accessor age management', () => {
		beforeEach(() => { jest.useFakeTimers() });
		afterEach(() => { jest.useRealTimers() });
		test( 'unaccessed accessors are purged at the end of a 30-min. cleanup cycle', () => {
			const removeClientSpy = jest.spyOn( Accessor.prototype, 'removeClient' );
			
			const accessedPathsA = [ 'a.b', 'c.c', 'z' ];
			const accessedPathsB = [ 'b', 'z[0]' ];
			const cache = new TestCache({});
			
			expect( cache.numberOfAccessors ).toBe( 0 );
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_1' ) ).toEqual([]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_2' ) ).toEqual([]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_3' ) ).toEqual([]);
			
			cache.get( 'CLIENT_1', ...accessedPathsA );
			cache.get( 'CLIENT_2', ...accessedPathsA );
			cache.get( 'CLIENT_3', ...accessedPathsA );
			
			expect( cache.numberOfAccessors ).toBe( 1 );
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_1' ) ).toEqual([ accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_2' ) ).toEqual([ accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_3' ) ).toEqual([ accessedPathsA ]);

			cache.get( 'CLIENT_1', ...accessedPathsB );
			cache.get( 'CLIENT_3', ...accessedPathsB );
			
			expect( cache.numberOfAccessors ).toBe( 2 );
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_1' ) ).toEqual([ accessedPathsB, accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_2' ) ).toEqual([ accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_3' ) ).toEqual([ accessedPathsB, accessedPathsA ]);

			jest.advanceTimersByTime( 1.2e6 ); // 20 minutes
			/* accessing the accessor for `accessedPathB` @ the 20th second */
			cache.get( 'CLIENT 1', ...accessedPathsB );
			expect( removeClientSpy ).not.toHaveBeenCalled();
			
			expect( cache.numberOfAccessors ).toBe( 2 );
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_1' ) ).toEqual([ accessedPathsB, accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_2' ) ).toEqual([ accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_3' ) ).toEqual([ accessedPathsB, accessedPathsA ]);

			jest.advanceTimersByTime( 6.1e5 ); // 10+ more minutes later
			/* disassociates all clients at the unused accessed path and discards the accessor */ 
			expect( removeClientSpy ).toHaveBeenCalledTimes( 3 );
			
			expect( cache.numberOfAccessors ).toBe( 1 );
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_1' ) ).toEqual([ accessedPathsB ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_2' ) ).toEqual([]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_3' ) ).toEqual([ accessedPathsB ]);

			removeClientSpy.mockRestore();
		} );
		test( 'will automatically create a new accessor for previously purged path if accessed', () => {
			const accessedPathsA = [ 'a.b', 'c.c', 'z' ];
			const accessedPathsB = [ 'b', 'z[0]' ];
			const cache = new TestCache({});
			cache.get( 'CLIENT_1', ...accessedPathsA );
			cache.get( 'CLIENT_2', ...accessedPathsA );
			cache.get( 'CLIENT_3', ...accessedPathsA );
			cache.get( 'CLIENT_1', ...accessedPathsB );
			cache.get( 'CLIENT_3', ...accessedPathsB );
			
			expect( cache.numberOfAccessors ).toBe( 2 );
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_1' ) ).toEqual([ accessedPathsB, accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_2' ) ).toEqual([ accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_3' ) ).toEqual([ accessedPathsB, accessedPathsA ]);

			jest.advanceTimersByTime( 1.2e6 ); // 20 minutes
			/* accessing the accessor for `accessedPathB` @ the 20th second */
			cache.get( 'CLIENT 1', ...accessedPathsA );

			jest.advanceTimersByTime( 6.1e5 ); // 10+ more minutes later
			
			expect( cache.numberOfAccessors ).toBe( 1 );
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_1' ) ).toEqual([ accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_2' ) ).toEqual([ accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_3' ) ).toEqual([ accessedPathsA ]);

			/* RE-INSTATING ACCESSOR AT `accessedPathB` */
			cache.get( 'CLIENT_2', ...accessedPathsB );
			
			expect( cache.numberOfAccessors ).toBe( 2 );
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_1' ) ).toEqual([ accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_2' ) ).toEqual([[ 'z[0]', 'b' ] /* weird rearrangement of `accessedPathsB` */, accessedPathsA ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_3' ) ).toEqual([ accessedPathsA ]);

			/* PURGE ALL ACCESSORS WHEN NONE BY THE END OF THE CLEANUP CYCLE (CYCLE: ~30 MINUTES) */
			jest.advanceTimersByTime( 3.6e6 ); // 30+ minutes

			expect( cache.numberOfAccessors ).toBe( 0 );
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_1' ) ).toEqual([]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_2' ) ).toEqual([]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_3' ) ).toEqual([]);

			/* RE-INSTATING ACCESSOR AT `accessedPathB` */
			cache.get( 'CLIENT_5', ...accessedPathsB );

			expect( cache.numberOfAccessors ).toBe( 1 );
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_1' ) ).toEqual([]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_2' ) ).toEqual([]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_3' ) ).toEqual([]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_5' ) ).toEqual([[ 'z[0]', 'b' ] /* weird rearrangement of `accessedPathsB` */ ]);
			
			/* RE-INSTATING ACCESSOR AT `accessedPathA` */
			cache.get( 'CLIENT_3', ...accessedPathsA );

			expect( cache.numberOfAccessors ).toBe( 2 );
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_1' ) ).toEqual([]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_2' ) ).toEqual([]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_3' ) ).toEqual([[ 'c.c','z', 'a.b' ] /* weird rearrangement of `accessedPathsA` */ ]);
			expect( cache.getAccessedPathGroupsBy( 'CLIENT_5' ) ).toEqual([[ 'z[0]', 'b' ] /* weird rearrangement of `accessedPathsB` */ ]);
		} );
	} );
} );	
