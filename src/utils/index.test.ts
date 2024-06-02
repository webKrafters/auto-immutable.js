import {
	beforeAll,
	describe,
	expect,
	test
} from '@jest/globals';

import '../test-artifacts/suppress-render-compat';

import * as utils from '.';

describe( 'utils module', () => {
	describe( 'arrangePropertyPaths(...)', () => {
		describe( 'subset propertyPaths', () => {
			let actual, expected;
			beforeAll(() => {
				expected = [
					'address',
					'matrix.0.1',
					'friends[1]',
					'registered.time',
					'matrix[2][2]',
					'tags[4]',
					'history'
				];
				actual = utils.arrangePropertyPaths([
					'address',
					'friends[1].id', // subset
					'registered.time.hours', // subset
					'matrix.0.1',
					'friends[1]',
					'history.places', // subset
					'registered.time',
					'matrix[2][2]',
					'friends[1].name.last', // subset
					'history.places[2].year', // subset
					'tags[4]',
					'history'
				]);
			});
			test( 'are removed', () => {
				expect( actual ).toEqual( expected );
			} );
			test( 'maintains inclusion order', () => {
				expect( actual ).toStrictEqual( expected );
			} );
		} );
		test( 'removes duplicate propertyPaths', () => {
			const expected = [
				'friends[1]',
				'address',
				'matrix.0.1',
				'history',
				'registered.time',
				'matrix[2][2]',
				'tags[4]'
			];
			const actual = utils.arrangePropertyPaths([
				'friends[1]',
				'friends[1]',
				'address',
				'matrix.0.1',
				'history.places[2].year', // subset
				'friends[1]',
				'history',
				'registered.time',
				'address',
				'matrix[2][2]',
				'history',
				'tags[4]'
			]);
			expect( actual ).toEqual( expected );
			expect( actual ).toStrictEqual( expected );
		} );
		describe( 'no duplicates/no subsets found', () => {
			test( 'returns identical propertyPaths list', () => {
				const expected = [
					'address',
					'friends[1]',
					'history',
					'registered.time',
					'tags[4]'
				];
				const actual = utils.arrangePropertyPaths( expected );
				expect( actual ).not.toBe( expected );
				expect( actual ).toEqual( expected );
				expect( actual ).toStrictEqual( expected );
			} );
		} );
	} );
	describe( 'isDataContainer(...)', () => {
		test( 'is true for arrays', () => {
			expect( utils.isDataContainer( [] ) ).toBe( true );
			expect( utils.isDataContainer( new Array() ) ).toBe( true ); // eslint-disable-line no-array-constructor
		} );
		test( 'is true for plain objects', () => {
			expect( utils.isDataContainer({}) ).toBe( true );
			expect( utils.isDataContainer( new Object() ) ).toBe( true ); // eslint-disable-line no-new-object
		} );
		test( 'is false for non-arrays and non plain objects', () => {
			class Test { method() {} }
			expect( utils.isDataContainer( new Date() ) ).toBe( false );
			expect( utils.isDataContainer( new Set() ) ).toBe( false );
			expect( utils.isDataContainer( new String() ) ).toBe( false ); // eslint-disable-line no-new-wrappers
			expect( utils.isDataContainer( new Test() ) ).toBe( false );
			expect( utils.isDataContainer( true ) ).toBe( false );
			expect( utils.isDataContainer( 1 ) ).toBe( false );
			expect( utils.isDataContainer( 'test' ) ).toBe( false );
			expect( utils.isDataContainer( 1.5 ) ).toBe( false );
		} );
	} );
	describe( 'makeReadonly(...)', () => {
		const TEST_DATA = { a: { b: { c: [ 1, 2, 3, { testFlag: true } ] } } };
		beforeAll(() => { utils.makeReadonly( TEST_DATA ) });
		test( 'converts composite data to readonly', () => {
			// @ts-expect-error
			expect(() => { TEST_DATA.z = expect.anything() }).toThrow(
				'Cannot add property z, object is not extensible'
			);
			expect(() => { TEST_DATA.a = expect.anything() as any }).toThrow(
				"Cannot assign to read only property 'a' of object '#<Object>'"
			);
			expect(() => { TEST_DATA.a.b = expect.anything() as any }).toThrow(
				"Cannot assign to read only property 'b' of object '#<Object>'"
			);
			expect(() => { TEST_DATA.a.b.c[ 1 ] = expect.anything() as any }).toThrow(
				"Cannot assign to read only property '1' of object '[object Array]'"
			);
			expect(() => { TEST_DATA.a.b.c[ 3 ] = expect.anything() as any }).toThrow(
				"Cannot assign to read only property '3' of object '[object Array]'"
			);
			expect(() => { TEST_DATA.a.b.c.push( expect.anything() as any ) }).toThrow(
				'Cannot add property 4, object is not extensible'
			);
		} );
	} );
} );
