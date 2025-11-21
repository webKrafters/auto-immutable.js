import {
	beforeAll,
	describe,
	expect,
	test
} from '@jest/globals';

import '../test-artifacts/suppress-render-compat';

import * as utils from '.';

/* @debug */
// "(\w+)": --- $1:
// Any<(\w+)> --- expect.any( $1 ) //
// console.info( onChangeMock.mock.calls[ 0 ] );
describe( '1xxxx', () => {
// describe( 'utils module', () => {
	describe( 'arrangePropertyPaths(...)', () => {
		describe( 'subset propertyPaths', () => {
			let actual : Array<string>;
			let expected : Array<string>;
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
	describe( 'isAPrefixOfB(...)', () => {
		test( 'rejects different series of equal lengths', () => {
			expect( utils.isAPrefixOfB(
				[ 'a', 'b', 'c' ],
				[ 'a', 'c', 'v' ]
			) ).toBe( false );
		} );
		test( 'accepts two equal series', () => {
			expect( utils.isAPrefixOfB(
				[ 'a', 'b', 'c' ],
				[ 'a', 'b', 'c' ]
			) ).toBe( true );
			expect( utils.isAPrefixOfB(
				[],
				[]
			) ).toBe( true );
		} );
		test( 'accepts series A containing the first N shorter subsequence of series B', () => {
			expect( utils.isAPrefixOfB(
				[],
				[ 'a', 'b', 'c', 'd', 'e','f' ]
			) ).toBe( true );
			expect( utils.isAPrefixOfB(
				[ 'a', 'b', 'c' ],
				[ 'a', 'b', 'c', 'd', 'e','f' ]
			) ).toBe( true );
		} );
		test( 'rejects series A containing non first N shorter subsequence of series B', () => {
			expect( utils.isAPrefixOfB(
				[ 'c', 'd', 'e' ],
				[ 'a', 'b', 'c', 'd', 'e','f' ]
			) ).toBe( false );
			expect( utils.isAPrefixOfB(
				[ 'a', 'y', 'c' ],
				[ 'a', 'b', 'c', 'd', 'e','f' ]
			) ).toBe( false );
		} );
		test( 'rejects series A containing the entire series B and more', () => {
			expect( utils.isAPrefixOfB(
				[ 'a', 'b', 'c', 'd', 'e','f' ],
				[]
			) ).toBe( false );
			expect( utils.isAPrefixOfB(
				[ 'a', 'b', 'c', 'd', 'e','f' ],
				[ 'a', 'b', 'c' ]
			) ).toBe( false );
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
	describe( 'set(...)', () => {
		test( 'mutates object', () => {
			const obj = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] } };
			const expected = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, { y: 1024, z: 2048 } ] } };
			expect( obj ).not.toEqual( expected );
			utils.set( obj, [ 'b', 'b', '1' ], { y: 1024, z: 2048 } );
			expect( obj ).toStrictEqual( expected );
		} );
		test( 'returns the mutated object', () => {
			const obj = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] } };
			const expected = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, { y: 1024, z: 2048 } ] } };
			expect( obj ).not.toEqual( expected );
			const newObj = utils.set( obj, [ 'b', 'b', '1' ], { y: 1024, z: 2048 } );
			expect( newObj ).toStrictEqual( obj );
			expect( obj ).toStrictEqual( expected );
		} );
		test( 'sets at primitive leaf', () => {
			const obj = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] } };
			const expected = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, { y: 1024, z: 2048 } ] } };
			utils.set( obj, [ 'b', 'b', '1' ], { y: 1024, z: 2048 } );
			expect( obj ).toStrictEqual( expected );
		} );
		test( 'extends object to add new property', () => {
			const obj = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] } };
			const expected = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4, x: { q: { a: 512 } } }, 55 ] } };
			utils.set( obj, [ 'b', 'b', 0, 'x', 'q', 'a' ], 512 );
			expect( obj ).toStrictEqual( expected );
		} );
		test( 'curtails object to a new property', () => {
			const obj = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] } };
			const expected = { a: 33, b: 256 };
			utils.set( obj, [ 'b' ], 256 );
			expect( obj ).toStrictEqual( expected );
		} );
		test( 'creates a new path', () => {
			const obj = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] } };
			const expected = {
				a: 33,
				b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] },
				d: { e: [] as Array<Record<string, unknown>> }
			};
			expected.d.e[ 22 ] = { e: 4096 };
			utils.set( obj, [ 'd', 'e', 22, 'e' ], 4096 );
			expect( obj ).toStrictEqual( expected );
		} );
		test( 'preserves readonly directive', () => {
			const obj = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] } };
			Object.freeze( obj.b.b ); // freezing property
			expect( Object.isFrozen( obj.b.b ) ).toBe( true ); // identify frozen property
			const expected = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4, x: { q: { a: 512 } } }, 55 ] } };
			utils.set( obj, [ 'b', 'b', 0, 'x', 'q', 'a' ], 512 );
			expect( obj ).toStrictEqual( expected );
			expect( Object.isFrozen( obj.b.b ) ).toBe( true );  // property remains frozen after rewrite.
		} );
		test( 'empty path leads the return of new replacement of object, leaving `obj` untouched', () => {
			let obj = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] } };
			const change = { j: 512 };
			let t = utils.set( obj, [], change );
			expect( obj ).not.toBe( change );
			expect( t ).toBe( change );
			// ------ //
			obj = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] } };
			t = utils.set( obj, null, change );
			expect( obj ).not.toBe( change );
			expect( t ).toBe( change );
			// ------ //
			obj = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] } };
			t = utils.set( obj, undefined, change );
			expect( obj ).not.toBe( change );
			expect( t ).toBe( change );
		} );
		describe( 'dealing with scalar values', () => {
			test( 'will replace with new value at the path', () => {
				const obj = 5;
				const expected = { b: { b: [{ x: { q: { a: 512 } } }] } };
				const t = utils.set( obj, [ 'b', 'b', 0, 'x', 'q', 'a' ], 512 );
				expect( t ).toStrictEqual( expected );
			} );
			test( 'cannot override scalar variable', () => {
				const obj = 5;
				const expected = { b: { b: [{ x: { q: { a: 512 } } }] } };
				const t = utils.set( obj, [ 'b', 'b', 0, 'x', 'q', 'a' ], 512 );
				expect( obj ).toBe( 5 );
				expect( t ).not.toBe( 5 );
				expect( t ).toStrictEqual( expected );
			} );
			test( 'cannot override `obj` with scalar value', () => {
				let obj = { a: 33, b: { a: 'T', b: [{ a: 22, b: 4 }, 55 ] } };
				const t = utils.set( obj, [], 512 );
				expect( obj ).not.toBe( 512 );
				expect( t ).toBe( 512 );
			} )
		} );
	} );
	describe( 'shallowCopy(...)', () => {
		test( 'makes a shallow copy of both plain objects', () => {
			const data = { a: '22', b: 54, c: { ca: 'tte', cb: 50, cc: 66 } } as Record<string, any>;
			const copy = utils.shallowCopy( data );
			expect( data ).not.toBe( copy );
			expect( data ).toStrictEqual( copy );
			for( const k in data ) {
				expect( data[ k ] ).toBe( copy[ k ] );
				expect( data[ k ] ).toStrictEqual( copy[ k ] );
			};
		} );
		test( 'makes a shallow copy of arrays', () => {
			const data = [ 22, 54, { ca: 'tte', cb: 50, cc: 66 } ];
			const copy = utils.shallowCopy( data );
			expect( data ).not.toBe( copy );
			expect( data ).toStrictEqual( copy );
			for( const k in data ) {
				expect( data[ k ] ).toBe( copy[ k ] );
				expect( data[ k ] ).toStrictEqual( copy[ k ] );
			};
		} );
		test( 'will not make shallow copy of non arrays and non plain objects', () => {
			let data = 'My alternate test';
			let copy = utils.shallowCopy( data );
			expect( data ).toBe( copy );
			/* ------- */
			data = new ( class{} )() as any;
			copy = utils.shallowCopy( data );
			expect( data ).toBe( copy );
		} );
	} );
} );
