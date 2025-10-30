import { type ChangeInfo } from '../..';

import {
	afterAll,
	beforeAll,
	describe,
	expect,
	jest,
	test
} from '@jest/globals';

import { GLOBAL_SELECTOR } from '../..';

import { PathIdInfo } from './repository/paths';

import Accessor from '../accessor';

import PathRepository from './repository/paths';
import AtomValueRepository from './repository/atom-value';

import AccessorCache from '.';

describe( 'AccessorCache class', () => {

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
		const PATHS = [ 'a.v.c', 'a.c.e', GLOBAL_SELECTOR ];
		const PATH_ID_MAP = {
			[ PATHS[ 0 ] ]: 1,
			[ PATHS[ 1 ] ]: 2,
			[ PATHS[ 2 ] ]: 3
		};
		let cache : AccessorCache<{}>;
		let getPathInfoSpy : jest.SpiedFunction<(path: string) => PathIdInfo>;
		let addClientSpy : jest.SpiedFunction<(clientId: string) => void>;
		beforeAll(() => {
			addClientSpy = jest.spyOn( Accessor.prototype, 'addClient' );
			getPathInfoSpy = jest
				.spyOn( PathRepository.prototype, 'getPathInfoAt' )
				.mockImplementation(( path : string ) => ({
					sanitizedPathId: PATH_ID_MAP[ path ] - 2,
					sourcePathId: PATH_ID_MAP[ path ]
				}) );
		});
		beforeEach(() => {
			getPathInfoSpy.mockClear();
			addClientSpy.mockClear();
			cache = new AccessorCache({});
		});
		test( `defaults to obtaining ${ GLOBAL_SELECTOR } data`, () => {
			cache.get( 'TEST_CLIENT_ID' );
			expect( getPathInfoSpy ).toHaveBeenCalledTimes( 1 );
			expect( getPathInfoSpy ).toHaveBeenCalledWith( GLOBAL_SELECTOR );
		} );
		test( `shares same accessor between clients`, () => {
			/* setting up original accessor data at ['a.v.c', 'a.c.e'] */
			cache.get( 'REQUEST_1', PATHS[ 0 ], PATHS[ 1 ] );
			expect( getPathInfoSpy ).toHaveBeenCalledTimes( 2 );
			expect( getPathInfoSpy.mock.calls[ 0 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( getPathInfoSpy.mock.calls[ 1 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_1' ]);
			/* clearing out test mocks */
			addClientSpy.mockClear();
			getPathInfoSpy.mockClear();
			/* reusing same accessor for a different request */
			cache.get( 'REQUEST_2', PATHS[ 0 ], PATHS[ 1 ] );
			expect( getPathInfoSpy ).not.toHaveBeenCalled();
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_2' ]);
		} );
		test( `reordering access paths will not produce new aaccessor`, () => {
			/* setting up original accessor data at ['a.v.c', 'a.c.e'] */
			cache.get( 'REQUEST_1', PATHS[ 0 ], PATHS[ 1 ] );
			expect( getPathInfoSpy ).toHaveBeenCalledTimes( 2 );
			expect( getPathInfoSpy.mock.calls[ 0 ] ).toEqual([ PATHS[ 0 ] ]);
			expect( getPathInfoSpy.mock.calls[ 1 ] ).toEqual([ PATHS[ 1 ] ]);
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_1' ]);
			/* clearing out test mocks */
			addClientSpy.mockClear();
			getPathInfoSpy.mockClear();
			/* reusing same accessor for a request contaning reordered access paths */
			cache.get( 'REQUEST_2', PATHS[ 1 ], PATHS[ 0 ] );
			expect( getPathInfoSpy ).not.toHaveBeenCalled();
			expect( addClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( addClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_2' ]);
		} );
	} );
	describe( 'unlinkClient(...)', () => {
		const PATHS = [ 'a.v.c', 'a.c.e', GLOBAL_SELECTOR ];
		const PATH_ID_MAP = {
			[ PATHS[ 0 ] ]: 1,
			[ PATHS[ 1 ] ]: 2,
			[ PATHS[ 2 ] ]: 3
		};
		let cache : AccessorCache<{}>;
		let addClientSpy : jest.SpiedFunction<(clientId: string) => void>;
		let getPathInfoSpy : jest.SpiedFunction<(path: string) => PathIdInfo>;
		let removeClientSpy : jest.SpiedFunction<(clientId: string) => void>;
		beforeAll(() => {
			addClientSpy = jest.spyOn( Accessor.prototype, 'addClient' );
			getPathInfoSpy = jest
				.spyOn( PathRepository.prototype, 'getPathInfoAt' )
				.mockImplementation(( path : string ) => ({
					sanitizedPathId: PATH_ID_MAP[ path ] - 2,
					sourcePathId: PATH_ID_MAP[ path ]
				}) );
			removeClientSpy = jest.spyOn( Accessor.prototype, 'removeClient' );
		});
		beforeEach(() => {
			addClientSpy.mockClear();
			getPathInfoSpy.mockClear();
			removeClientSpy.mockClear();
			cache = new AccessorCache({});
		});
		test( `removes client from all accessors where registered`, () => {
			cache.get( 'REQUEST_1', PATHS[ 0 ], PATHS[ 1 ], 'j.b.e' );
			cache.get( 'REQUEST_2', PATHS[ 0 ], PATHS[ 1 ] );
			cache.get( 'REQUEST_1', PATHS[ 0 ], PATHS[ 1 ] );
			cache.unlinkClient( 'REQUEST_1' );
			expect( removeClientSpy ).toHaveBeenCalledTimes( 2 );
			expect( removeClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_1' ]);
			expect( removeClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_1' ]);
			removeClientSpy.mockClear();
			cache.unlinkClient( 'REQUEST_1' );
			expect( removeClientSpy ).not.toHaveBeenCalled();
			removeClientSpy.mockClear();
			cache.unlinkClient( 'REQUEST_2' );
			expect( removeClientSpy ).toHaveBeenCalledTimes( 1 );
			expect( removeClientSpy.mock.calls[ 0 ] ).toEqual([ 'REQUEST_2' ]);
			removeClientSpy.mockClear();
			cache.unlinkClient( 'REQUEST_2' );
			expect( removeClientSpy ).not.toHaveBeenCalled();
			cache.unlinkClient( 'REQUEST_1' );
			expect( removeClientSpy ).not.toHaveBeenCalled();
		} );
	} );
} );	
