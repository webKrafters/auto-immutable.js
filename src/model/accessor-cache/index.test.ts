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
				const cache = new AccessorCache({
					a: {
						2: { v: { c: { x: 88, y: 99, z: 110 } } },
						c: { 22: [ 1, 2, 3, { e: [ 92, 'testing' ] } ] }
					}
				});
				result = cache.get( 'REQUEST_1', ...PATHS );
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
		test( `removes client from all existing accessors`, () => {
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
