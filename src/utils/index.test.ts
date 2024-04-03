import '../test-artifacts/suppress-render-compat';

import * as utils from '.';
import createSourceData from '../test-artifacts/data/create-data-obj';

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
	describe( 'clonedeep(...)', () => {
		test( 'produces exact clone for commonly used types', () => {
			const value = createSourceData();
			const clone = utils.clonedeep( value );
			expect( clone ).not.toBe( value );
			expect( clone ).toStrictEqual( value );
		} );
		test( 'produces exact clone for recognized web api instances ', () => {
			const value = {
				birth: {
					date: new Date( '1952-09-05' ),
					place: { city: 'Prague' }
				},
				null: null,
				regexCount: /[1-9][0-9]*/g,
				undefined: undefined
			};
			const clone = utils.clonedeep( value );
			expect( clone.birth.date ).not.toBe( value.birth.date );
			expect( clone.birth.place ).not.toBe( value.birth.place );
			expect( clone.regexCount ).not.toBe( value.regexCount );
			expect( clone ).not.toBe( value );
			expect( clone ).toStrictEqual( value );
		} );
		test( 'will not clone but will return unrecognized instances not implementing either `clone` or `cloneNode` methods', () => {
			class Test {};
			const value = { testing: { test: new Test() } };
			const clone = utils.clonedeep( value );
			expect( clone.testing.test ).toBe( value.testing.test ); // not cloned: returned as is
			expect( clone ).not.toBe( value );
			expect( clone ).toStrictEqual( value );
		} );
		describe( 'cloning unrecognizable instance', () => {
			const runWith = ( value, cloneWatcher ) => {
				const clone = utils.clonedeep( value );
				expect( clone.testing.test ).not.toBe( value.testing.test );
				expect( cloneWatcher ).toHaveBeenCalled();
				expect( clone ).not.toBe( value );
				expect( clone ).toStrictEqual( value );
			};
			test( 'using its `clone` method', () => {
				const cloneWatcher = jest.fn();
				class Test {
					clone() {
						cloneWatcher();
						return new Test();
					}
				};
				runWith({ testing: { test: new Test() } }, cloneWatcher );
			} );
			test( 'using its `cloneNode` method', () => {
				const cloneWatcher = jest.fn();
				class Test {
					cloneNode() {
						cloneWatcher();
						return new Test();
					}
				};
				runWith({ testing: { test: new Test() } }, cloneWatcher );
			} );
		} );
	} );
	describe( 'getProperty(...)', () => {
		test( 'is a `webkrafters/get-property` default module reference', () => {
			expect( utils.getProperty ).toBe( require( '@webkrafters/get-property' ).default );
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
		beforeAll(() => utils.makeReadonly( TEST_DATA ));
		test( 'converts composite data to readonly', () => {
			// @ts-expect-error
			expect(() => { TEST_DATA.z = expect.anything() }).toThrow(
				'Cannot add property z, object is not extensible'
			);
			expect(() => { TEST_DATA.a = expect.anything() }).toThrow(
				"Cannot assign to read only property 'a' of object '#<Object>'"
			);
			expect(() => { TEST_DATA.a.b = expect.anything() }).toThrow(
				"Cannot assign to read only property 'b' of object '#<Object>'"
			);
			expect(() => { TEST_DATA.a.b.c[ 1 ] = expect.anything() }).toThrow(
				"Cannot assign to read only property '1' of object '[object Array]'"
			);
			expect(() => { TEST_DATA.a.b.c[ 3 ] = expect.anything() }).toThrow(
				"Cannot assign to read only property '3' of object '[object Array]'"
			);
			expect(() => { TEST_DATA.a.b.c.push( expect.anything() ) }).toThrow(
				'Cannot add property 4, object is not extensible'
			);
		} );
	} );
	describe( 'mapPathsToObject(...)', () => {
		let source, propertyPaths;
		beforeAll(() => {
			source = createSourceData();
			source.matrix = [
				[ 0, 3, 9 ],
				[ 4, 1, 1],
				[ 8, 7, 3]
			];
			propertyPaths = Object.freeze([
				'address',
				'friends[1]',
				'history.places.0.city',
				'matrix.0.1',
				'registered.timezone',
				'registered.time',
				'tags[4]',
				'matrix[2][2]',
				'matrix.0.2'
			]);
		});
		test( 'returns a subset of the source pbject matching arranged property paths', () => {
			expect( utils.mapPathsToObject( source, propertyPaths ) ).toEqual({
				address: source.address,
				friends: { 1: source.friends[ 1 ] },
				history: { places: { 0: { city: source.history.places[ 0 ].city } } },
				matrix: {
					0: { 1: source.matrix[ 0 ][ 1 ], 2: source.matrix[ 0 ][ 2 ] },
					2: { 2: source.matrix[ 2 ][ 2 ] }
				},
				registered: {
					time: source.registered.time,
					timezone: source.registered.timezone
				},
				tags: { 4: source.tags[ 4 ] }
			});
		} );
		test(
			'returns a subset of the source object following setstate `change` object rules for array/indexed-object mutations',
			() => expect( utils.mapPathsToObject( source, [ 'matrix.0.1', 'matrix.0.2' ] ) ).toEqual({
				matrix: {
					0: {
						1: source.matrix[ 0 ][ 1 ],
						2: source.matrix[ 0 ][ 2 ]
					}
				}
			})
		);
		test( 'returns a subset of the source object excluding non-existent property paths', () => {
			expect( utils.mapPathsToObject( source, [ 'matrix.0.1', 'matrix.0.44' ] ) ).toEqual({
				matrix: { 0: { 1: source.matrix[ 0 ][ 1 ] } }
			});
		});
		test( 'handles multi-dimensional arrays', () => {
			source = createSourceData();
			source.matrix = [
				[ [ 0, 3, 1 ], [ 4, 0, 3 ] ],
				[ [ 4, 1, 9 ], [ 7, 4, 9 ] ],
				[ [ 8, 7, 3 ], [ 0, 3, 1 ] ]
			];
			const matrix11 = { 1: source.matrix[ 1 ][ 1 ] };
			const matrix20 = { 0: source.matrix[ 2 ][ 0 ] };
			expect( utils.mapPathsToObject( source, [ 'matrix.1.1', 'matrix[2].0' ] ) )
				.toEqual({ matrix: { 1: matrix11, 2: matrix20 } });
			expect( utils.mapPathsToObject( source, [ 'matrix[2].0', 'matrix.1.1' ] ) )
				.toEqual({ matrix: { 1: matrix11, 2: matrix20 } });
			expect( utils.mapPathsToObject( source, [ 'matrix.1.1' ] ) ).toEqual({ matrix: { 1: matrix11 }	});
			expect( utils.mapPathsToObject( source, [ 'matrix[2].0' ] ) ).toEqual({	matrix: { 2: matrix20 }	});
		} );
	} );
} );
