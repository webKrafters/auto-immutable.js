import {
	beforeAll,
	describe,
	expect,
	test
} from '@jest/globals';

import '../../../../test-artifacts/suppress-render-compat';

import PathRepository, { PathIdInfo } from '.';

/* @debug */
// "(\w+)": --- $1:
// Any<(\w+)> --- expect.any( $1 ) //
// console.info( onChangeMock.mock.calls[ 0 ] );
describe( '1xxxx', () => {
// describe( 'PathRepository class', () => {
	const SOURCE_PATH = 'a.c.e.a.r[9][0].s.g[33]';
	let pathRepo : PathRepository;
	let pathInfo : PathIdInfo;
	beforeAll(() => {
		pathRepo = new PathRepository();
		pathInfo = pathRepo.getPathInfoAt( SOURCE_PATH );
	});
	describe( 'getPathInfoAt(...)', () => {
		test( 'assigns an `id` to the raw path input', () => {
			expect( pathInfo.sourcePathId ).toEqual( expect.any( Number ) );
		} );
		test( 'creates an `id` to a sanitized version of the raw path input', () => {
			expect( pathInfo.sanitizedPathId ).toEqual( expect.any( Number ) );
		} );
		test( 'adds non-existent path to the repo and returns its descriptors', () => {
			expect( pathInfo.sanitizedPathId ).toEqual( expect.any( Number ) );
			expect( pathInfo.sourcePathId ).toEqual( expect.any( Number ) );
		} );
		test( 'returns existing path descriptors for existing path', () => {
			const pathInfo1 = pathRepo.getPathInfoAt( SOURCE_PATH );
			expect( pathInfo.sanitizedPathId ).toBe( pathInfo1.sanitizedPathId );
			expect( pathInfo.sourcePathId ).toBe( pathInfo1.sourcePathId );
		} );
		test( 'add new paths in addition to existing paths', () => {
			const pathInfo1 = pathRepo.getPathInfoAt( 'a.c.o.a.R[9][0].s' );
			expect( pathInfo1 ).toEqual( expect.objectContaining({
				sanitizedPathId: expect.any( Number ),
				sourcePathId: expect.any( Number )
			}) );
			expect( pathInfo.sanitizedPathId ).not.toBe( pathInfo1.sanitizedPathId );
			expect( pathInfo.sourcePathId ).not.toBe( pathInfo1.sourcePathId );
		} );
	} );
	describe( 'getSanitizedPathOf(...)', () => {
		test( 'produces the sanitized version of a raw path input at `id`', () => {
			expect( pathRepo.getSanitizedPathOf( pathInfo.sourcePathId ) )
				.toEqual( 'a.c.e.a.r.9.0.s.g.33' );
		} );
		test( 'cannot produce the sanitized version of a non-existing `id`', () => {
			expect( pathRepo.getSanitizedPathOf( 104 ) ).toBeUndefined();
		} );
	} );
	describe( 'getIdOfSanitizedPath(...)', () => {
		test( 'produces the `id` assigned to a sanitized path', () => {
			const sanitizedPath = pathRepo.getSanitizedPathOf( pathInfo.sourcePathId );
			expect( pathRepo.getIdOfSanitizedPath( sanitizedPath ) )
				.toBe( pathInfo.sanitizedPathId );
		} );
		test( 'cannot produce the `id` of an unassigned path', () => {
			expect( pathRepo.getIdOfSanitizedPath( 'a.c.e.r' ) ).toBeUndefined();
		} );
	} );
	describe( 'getPathTokensAt(...)', () => {
		test( 'produces a tokenized version of the sanitized path at `id`', () => {
			expect( pathRepo.getPathTokensAt( pathInfo.sanitizedPathId ) )
				.toStrictEqual([ 'a', 'c', 'e', 'a', 'r', '9', '0', 's', 'g', '33' ]);
		} );
		test( 'cannot produce a tokenized version of a non-existing sanitized path `id`', () => {
			expect( pathRepo.getPathTokensAt( 14 ) ).toBeUndefined();
		} );
	} );
	describe( 'getSourcePathAt(...)', () => {
		test( 'produces the inputed raw path at the source path `id`', () => {
			expect( pathRepo.getSourcePathAt( pathInfo.sourcePathId ) ).toEqual( SOURCE_PATH );
		} );
		test( 'cannot produce the raw path at a non-existent source path `id`', () => {
			expect( pathRepo.getSourcePathAt( 873 ) ).toBeUndefined();
		} );
	} );
	describe( 'removeSource(...)', () => {
		test( 'removes a source path with all of its generated components from the repository', () => {
			const source = 'q.v[2].c';
			const sanitized = 'q.v.2.c';
			const {
				sanitizedPathId,
				sourcePathId
			} = pathRepo.getPathInfoAt( source );
			expect( pathRepo.getSanitizedPathOf( sourcePathId ) ).toEqual( sanitized );
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toEqual( sanitizedPathId );
			expect( pathRepo.getPathTokensAt( sanitizedPathId ) ).toEqual([ 'q', 'v', '2', 'c' ]);
			expect( pathRepo.getSourcePathAt( sourcePathId ) ).toEqual( source );
			pathRepo.removeSource( source );
			expect( pathRepo.getSanitizedPathOf( sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toBeUndefined();
			expect( pathRepo.getPathTokensAt( sanitizedPathId ) ).toBeUndefined();
			expect( pathRepo.getSourcePathAt( sourcePathId ) ).toBeUndefined();
		} );
		test( 'removes a source path but retains generated components when still in use by other sources', () => {
			const source0 = 'q.v[2].c.0';
			const source1 = 'q.v[2].c[0]';
			const sanitized = 'q.v.2.c.0';
			const {
				sanitizedPathId,
				sourcePathId
			} = pathRepo.getPathInfoAt( source0 );
			expect( pathRepo.getSanitizedPathOf( sourcePathId ) ).toEqual( sanitized );
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toEqual( sanitizedPathId );
			expect( pathRepo.getPathTokensAt( sanitizedPathId ) ).toEqual([ 'q', 'v', '2', 'c', '0' ]);
			expect( pathRepo.getSourcePathAt( sourcePathId ) ).toEqual( source0 );
			const pInfo1 = pathRepo.getPathInfoAt( source1 );
			expect( pInfo1.sanitizedPathId ).toBe( sanitizedPathId );
			expect( pInfo1.sourcePathId ).not.toBe( sourcePathId );
			expect( pathRepo.getSanitizedPathOf( pInfo1.sourcePathId ) ).toEqual( sanitized );
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toEqual( sanitizedPathId );
			expect( pathRepo.getPathTokensAt( pInfo1.sanitizedPathId ) ).toEqual([ 'q', 'v', '2', 'c', '0' ]);
			expect( pathRepo.getSourcePathAt( pInfo1.sourcePathId ) ).toEqual( source1 );
			pathRepo.removeSource( source0 );
			expect( pathRepo.getSanitizedPathOf( sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getSanitizedPathOf( pInfo1.sourcePathId ) ).toEqual( sanitized );
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toEqual( sanitizedPathId );
			expect( pathRepo.getPathTokensAt( sanitizedPathId ) ).toEqual([ 'q', 'v', '2', 'c', '0' ]);
			expect( pathRepo.getSourcePathAt( sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getSourcePathAt( pInfo1.sourcePathId ) ).toEqual( source1 );
			pathRepo.removeSource( source1 );
			expect( pathRepo.getSanitizedPathOf( sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getSanitizedPathOf( pInfo1.sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toBeUndefined();
			expect( pathRepo.getPathTokensAt( sanitizedPathId ) ).toBeUndefined();
			expect( pathRepo.getSourcePathAt( sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getSourcePathAt( pInfo1.sourcePathId ) ).toBeUndefined();
		} );
	} );
	describe( 'removeSourceId(...)', () => {
		test( 'removes a source path by its `id` with all of its generated components from the repository', () => {
			const source = 'q.v[2].c';
			const sanitized = 'q.v.2.c';
			const {
				sanitizedPathId,
				sourcePathId
			} = pathRepo.getPathInfoAt( source );
			expect( pathRepo.getSanitizedPathOf( sourcePathId ) ).toEqual( sanitized );
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toEqual( sanitizedPathId );
			expect( pathRepo.getPathTokensAt( sanitizedPathId ) ).toEqual([ 'q', 'v', '2', 'c' ]);
			expect( pathRepo.getSourcePathAt( sourcePathId ) ).toEqual( source );
			pathRepo.removeSourceId( sourcePathId );
			expect( pathRepo.getSanitizedPathOf( sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toBeUndefined();
			expect( pathRepo.getPathTokensAt( sanitizedPathId ) ).toBeUndefined();
			expect( pathRepo.getSourcePathAt( sourcePathId ) ).toBeUndefined();
		} );
		test( 'removes a source path by its `id` but retains generated components when still in use by other sources', () => {
			const source0 = 'q.v[2].c.0';
			const source1 = 'q.v[2].c[0]';
			const sanitized = 'q.v.2.c.0';
			const {
				sanitizedPathId,
				sourcePathId
			} = pathRepo.getPathInfoAt( source0 );
			expect( pathRepo.getSanitizedPathOf( sourcePathId ) ).toEqual( sanitized );
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toEqual( sanitizedPathId );
			expect( pathRepo.getPathTokensAt( sanitizedPathId ) ).toEqual([ 'q', 'v', '2', 'c', '0' ]);
			expect( pathRepo.getSourcePathAt( sourcePathId ) ).toEqual( source0 );
			const pInfo1 = pathRepo.getPathInfoAt( source1 );
			expect( pInfo1.sanitizedPathId ).toBe( sanitizedPathId );
			expect( pInfo1.sourcePathId ).not.toBe( sourcePathId );
			expect( pathRepo.getSanitizedPathOf( pInfo1.sourcePathId ) ).toEqual( sanitized );
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toEqual( sanitizedPathId );
			expect( pathRepo.getPathTokensAt( pInfo1.sanitizedPathId ) ).toEqual([ 'q', 'v', '2', 'c', '0' ]);
			expect( pathRepo.getSourcePathAt( pInfo1.sourcePathId ) ).toEqual( source1 );
			pathRepo.removeSourceId( sourcePathId );
			expect( pathRepo.getSanitizedPathOf( sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getSanitizedPathOf( pInfo1.sourcePathId ) ).toEqual( sanitized );
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toEqual( sanitizedPathId );
			expect( pathRepo.getPathTokensAt( sanitizedPathId ) ).toEqual([ 'q', 'v', '2', 'c', '0' ]);
			expect( pathRepo.getSourcePathAt( sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getSourcePathAt( pInfo1.sourcePathId ) ).toEqual( source1 );
			pathRepo.removeSourceId( pInfo1.sourcePathId );
			expect( pathRepo.getSanitizedPathOf( sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getSanitizedPathOf( pInfo1.sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getIdOfSanitizedPath( sanitized ) ).toBeUndefined();
			expect( pathRepo.getPathTokensAt( sanitizedPathId ) ).toBeUndefined();
			expect( pathRepo.getSourcePathAt( sourcePathId ) ).toBeUndefined();
			expect( pathRepo.getSourcePathAt( pInfo1.sourcePathId ) ).toBeUndefined();
		} );
	} );
} );
