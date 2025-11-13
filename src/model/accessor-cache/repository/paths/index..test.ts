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
	describe( '1xxxxs', () => {
	// describe( 'removeSource(...)', () => {
		test( '', () => {

		} );
	} );
	describe( 'removeSourceId(...)', () => {
		test( '', () => {

		} );
	} );
} );
