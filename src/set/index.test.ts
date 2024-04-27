import type { Changes } from '../types';

import type { SourceData } from '../test-artifacts/data/create-data-obj';

import {
	CLEAR_TAG,
	DELETE_TAG,
	MOVE_TAG,
	PUSH_TAG,
	REPLACE_TAG,
	SET_TAG,
	SPLICE_TAG
} from '../constants';

import { clonedeep } from '../utils';

import setValue from '.';

import createSourceData from '../test-artifacts/data/create-data-obj';

type Value = Partial<SourceData>

describe( 'setValue(...)', () => {
	const value : Value = createSourceData();
	describe( 'basics', () => {
		let newAge, changes, onChangeMock, prevAge;
		beforeAll(() => {
			newAge = 56;
			changes = { age: newAge };
			onChangeMock = jest.fn();
			prevAge = value.age;
			setValue( value, changes, onChangeMock );
		});
		afterAll(() => { value.age = prevAge })
		test( 'updates value with new changes', () => expect( value.age ).toBe( newAge ) );
		test( 'notifies listeners of value changes', () => {
			expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
			expect( onChangeMock ).toHaveBeenCalledWith( changes );
		} );
	} );
	describe( 'attempt resulting in value change', () => {
		let onChangeMock, registered, changes;
		beforeAll(() => {
			onChangeMock = jest.fn();
			registered = clonedeep( value.registered );
			changes = {
				registered: {
					day: 30, // new value
					month: 2,
					time: {
						hours: 9,
						seconds: 46
					},
					year: 2020 // new value
				}
			};
			setValue( value, changes, onChangeMock );
		});
		afterAll(() => { value.registered = registered });
		test( 'updates only new incoming changes', () => {
			expect( value.registered?.time ).toStrictEqual( registered.time );
			[ 'day', 'year' ].forEach( k => {
				expect( value.registered?.[ k ] ).not.toEqual( registered[ k ] );
				const _changes = changes as ( typeof changes & { registered: {} } );
				expect( value.registered?.[ k ] ).toBe( _changes.registered[ k ] );
			} );
			const value2 = createSourceData();
			const registered2 = clonedeep<typeof value2["registered"]>( value2.registered );
			const changes2 = clonedeep( changes ) as Changes<typeof value2> & Pick<typeof value2, "registered">;
			changes2.registered.time.hours = 17; // also add new `hours` value update to `time` object
			setValue( value2, changes2 );
			expect( value2.registered.time ).not.toEqual( registered2.time );
			expect( value2.registered.time.hours ).not.toBe( registered2.time.hours );
			expect( value2.registered.time.minutes ).toBe( registered2.time.minutes );
			expect( value2.registered.time.seconds ).toBe( registered2.time.seconds );
		} )
		test( 'sends value change notifications', () => {
			expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
		} );
		test( 'communicates proposed changes as part of value change notification', () => {
			expect( onChangeMock ).toHaveBeenCalledWith( changes );
		} );
	} );
	describe( 'attempt resulting in no value change', () => {
		let onChangeMock, registered;
		beforeAll(() => {
			onChangeMock = jest.fn();
			registered = clonedeep( value.registered );
			setValue( value, {
				registered: {
					day: 18,
					month: 2,
					time: {
						hours: 9,
						seconds: 46
					},
					year: 2016
				}
			}, onChangeMock );
		});
		test( 'performs no updates', () => {
			expect( value.registered ).toStrictEqual( registered );
		} );
		test( 'sends no value change notifications', () => {
			expect( onChangeMock ).not.toHaveBeenCalled();
		} );
	} );
	test( 'sequentially processes array of update payloads', () => {
		const value : Value = createSourceData();
		setValue( value, [
			{ tags: { [ PUSH_TAG ]: [ '_88_' ] } },
			{ tags: { [ MOVE_TAG ]: [ 0, 2 ] } },
			{ tags: { [ DELETE_TAG ]: [ 2 ] } },
			{ tags: { [ SPLICE_TAG ]: [ 4, 1, '_90_' ] } },
			{ tags: { 2: 'jiveTest' } }
		] );
		expect( value.tags ).toStrictEqual([
			'nisi',
			'dolor',
			'jiveTest',
			'ullamco',
			'_90_',
			'proident',
			'_88_'
		]);
	} );
	describe( 'array value subtree', () => {
		test( 'is wholly replaced if new value is neither an array nor an indexed object', () => {
			const value = createSourceData() as typeof value & { friends : string };
			const friends = 'TEST FRIEND STUB';
			setValue( value, { friends } );
			expect( value.friends ).toBe( friends );
		} );
		describe( 'using indexed object to update array at specific indexes', () => {
			let changes, onChangeMock;
			let origFriendsSlice;
			beforeAll(() => {
				origFriendsSlice = clonedeep( value.friends );
				changes = {
					friends: {
						1: { name: { first: 'Virginia' } },
						'-1': {
							id: 5,
							name: { first: 'Kathy', last: 'Smith' }
						}
					}
				};
				onChangeMock = jest.fn();
				setValue( value, changes, onChangeMock );
			});
			afterAll(() => { value.friends = origFriendsSlice });
			test( 'maintains structural integrity of the subtree', () => {
				expect( Array.isArray( value.friends ) ).toBe( true );
			} );
			test( 'updates value with new changes', () => {
				expect( value.friends?.[ 0 ] ).toEqual( origFriendsSlice[ 0 ] ); // remains untouched
				expect( value.friends?.[ 1 ].name.first ).toBe( changes.friends[ 1 ].name.first );
				expect( value.friends?.[ 2 ] ).toEqual( changes.friends[ -1 ] );
			} );
			test( 'recognizes update by negative indexing', () => {
				expect( value.friends?.[ 2 ] ).toEqual( changes.friends[ -1 ] );
			} );
			test( 'notifies listeners of value changes', () => {
				expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
				expect( onChangeMock ).toHaveBeenCalledWith( changes );
			} );
		} );
		describe( 'using indexed object to create new array entry', () => {
			let newEntryIndex, changes, onChangeMock, origFriendsSlice;
			beforeAll(() => {
				origFriendsSlice = clonedeep( value.friends );
				newEntryIndex = origFriendsSlice.length + 2;
				changes = {
					friends: {
						[ newEntryIndex ]: {
							id: newEntryIndex,
							name: { first: 'Rudie', last: 'Carson' }
						}
					}
				};
				onChangeMock = jest.fn();
				setValue( value, changes, onChangeMock );
			});
			afterAll(() => { value.friends = origFriendsSlice });
			test( 'maintains structural integrity of the subtree', () => {
				expect( Array.isArray( value.friends ) ).toBe( true );
			} );
			test( 'leaves existing items untouched', () => {
				origFriendsSlice.forEach(( f, i ) => {
					expect( value.friends?.[ i ] ).toEqual( f );
				});
			} );
			test( 'creates `undefined` entries for any unoccupied indexes leading the new entry', () => {
				for( let i = origFriendsSlice.length; i < newEntryIndex; i++ ) {
					expect( value.friends?.[ i ] ).toBe( undefined );
				}
			} );
			test( 'places new entry at the referenced index', () => {
				expect( value.friends?.[ newEntryIndex ] ).toEqual( changes.friends[ newEntryIndex ] );
			} );
			test( 'notifies listeners of value changes', () => {
				expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
				expect( onChangeMock ).toHaveBeenCalledWith( changes );
			} );
		} );
		describe( 'using indexed object resulting in no new change', () => {
			let changes, onChangeMock, origPlacesSlice;
			beforeAll(() => {
				origPlacesSlice = clonedeep( value.history?.places );
				changes = {
					history: {
						places: {
							0: {
								city: 'Topeka',
								year: '1997 - 2002'
							}
						}
					}
				};
				onChangeMock = jest.fn();
				setValue( value, changes, onChangeMock );
			});
			afterAll(() => { value.history!.places = origPlacesSlice });
			test( 'maintains structural integrity of the subtree', () => {
				expect( Array.isArray( value.history?.places ) ).toBe( true );
			} );
			test( 'leaves items untouched', () => {
				expect( value.history?.places ).toHaveLength( origPlacesSlice.length );
				origPlacesSlice.forEach(( p, i ) => {
					expect( value.history?.places[ i ] ).toEqual( p );
				});
			} );
			test( 'does not notify listeners due to no value changes', () => {
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
		} );
		describe( 'existing and incoming arrays of equal lengths', () => {
			let onChangeMock, value;
			beforeAll(() => { onChangeMock = jest.fn() });
			beforeEach(() => { value = createSourceData() });
			afterEach(() => onChangeMock.mockClear());
			test( 'results in no change when equal', () => {
				const friends = value.friends;
				setValue( value, { friends }, onChangeMock );
				expect( value.friends ).toBe( friends );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
			test( 'results in no change when identical', () => {
				const friends = value.friends;
				const friendsUpdate = clonedeep( value.friends );
				setValue( value, { friends: friendsUpdate }, onChangeMock );
				expect( value.friends ).toBe( friends );
				expect( value.friends ).not.toBe( friendsUpdate );
				expect( value.friends ).toStrictEqual( friendsUpdate );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
			test( 'results in a merge of incoming into existing when non-identical', () => {
				const friends = clonedeep( value.friends ).reverse();
				setValue( value, { friends }, onChangeMock );
				expect( value.friends ).not.toBe( friends );
				expect( value.friends ).toStrictEqual( friends );
				expect( onChangeMock ).toHaveBeenCalled();
			} );
		} );
		describe( 'incoming array < existing array', () => {
			let changes, onChangeMock;
			let origFriendsSlice;
			beforeAll(() => {
				origFriendsSlice = clonedeep( value.friends );
				changes = { friends: [ origFriendsSlice[ 2 ] ] };
				onChangeMock = jest.fn();
				setValue( value, changes, onChangeMock );
			});
			afterAll(() => { value.friends = origFriendsSlice });
			test( 'truncates existing array to new array size', () => {
				expect( value.friends ).toHaveLength( changes.friends.length );
				expect( value.friends?.length ).toBeLessThan( origFriendsSlice.length );
			} );
			test( 'updates value with new changes', () => {
				expect( value.friends ).toEqual( changes.friends );
			} );
			test( 'notifies listeners of value changes', () => {
				expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
				expect( onChangeMock ).toHaveBeenCalledWith( changes );
			} );
		} );
		describe( 'incoming array is a subset of existing array', () => {
			let changes, onChangeMock;
			let origFriendsSlice;
			beforeAll(() => {
				origFriendsSlice = clonedeep( value.friends );
				changes = { friends: origFriendsSlice.slice( 0, 2 ) }; // takes 1st 2 entries and omits the last
				onChangeMock = jest.fn();
				setValue( value, changes, onChangeMock );
			});
			afterAll(() => { value.friends = origFriendsSlice });
			test( 'truncates existing array to new array size', () => {
				expect( value.friends ).toHaveLength( changes.friends.length );
				expect( value.friends?.length ).toBeLessThan( origFriendsSlice.length );
			} );
			test( 'updates value with new changes', () => {
				expect( value.friends ).toEqual( changes.friends );
			} );
			test( 'notifies listeners of the removed last entry', () => {
				expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
				expect( onChangeMock ).toHaveBeenCalledWith( changes );
			} );
		} );
		describe( 'incoming array > existing array', () => {
			describe( 'where incoming array is completely different from existing array', () => {
				let changes, onChangeMock;
				let origFriendsSlice;
				beforeAll(() => {
					origFriendsSlice = clonedeep( value.friends );
					changes = { friends: [] };
					for( let i = 7; --i; ) {
						changes.friends.push({
							id: expect.any( Number ),
							name: {
								first: expect.any( String ),
								last: expect.any( String )
							}
						});
					}
					onChangeMock = jest.fn();
					setValue( value, changes, onChangeMock );
				});
				afterAll(() => { value.friends = origFriendsSlice });
				test( 'increases existing array size to fit new array items', () => {
					expect( value.friends ).toHaveLength( changes.friends.length );
					expect( value.friends?.length ).toBeGreaterThan( origFriendsSlice.length );
				} );
				test( 'updates value with new changes', () => {
					expect( value.friends ).toEqual( changes.friends );
				} );
				test( 'notifies listeners of total value slice replacement', () => {
					const replacedFriendsSlice = {};
					changes.friends.forEach(( f, i ) => { replacedFriendsSlice[ i ] = f });
					expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
					expect( onChangeMock ).toHaveBeenCalledWith( changes );
				} );
			} );
			describe( 'where incoming array contains existing array entries at the matching indexes', () => {
				let changes, onChangeMock, lastNewValueEntry, origFriendsSlice, originalNewValueEntry0, originalNewValueEntry1;
				beforeAll(() => {
					origFriendsSlice = clonedeep( value.friends );
					originalNewValueEntry0 = {
						id: 15,
						name: {
							first: 'Sue',
							last: 'Jones'
						}
					};
					originalNewValueEntry1 = {
						id: expect.any( Number ),
						name: {
							first: expect.any( String ),
							last: expect.any( String )
						}
					};
					lastNewValueEntry = origFriendsSlice[ 0 ];
					changes = { friends: clonedeep( origFriendsSlice ) };
					changes.friends[ 0 ] = originalNewValueEntry0;
					changes.friends.push( originalNewValueEntry1 );
					changes.friends.push( lastNewValueEntry );
					onChangeMock = jest.fn();
					setValue( value, changes, onChangeMock );
				});
				afterAll(() => { value.friends = origFriendsSlice });
				test( 'increases existing array size to fit new array items', () => {
					expect( value.friends ).toHaveLength( changes.friends.length );
					expect( value.friends?.length ).toBeGreaterThan( origFriendsSlice.length );
				} );
				test( 'updates value with new changes', () => {
					expect( value.friends ).toEqual( changes.friends );
				} );
				test( 'maintains 2nd and 3rd elements from previous array', () => {
					expect( value.friends![ 0 ] ).not.toEqual( origFriendsSlice[ 0 ] );
					expect( value.friends![ 1 ] ).toEqual( origFriendsSlice[ 1 ] );
					expect( value.friends![ 2 ] ).toEqual( origFriendsSlice[ 2 ] );
				} );
				test( 'notifies listeners of updated array entries', () => {
					expect( onChangeMock ).toHaveBeenCalledTimes( 1 );
					expect( onChangeMock ).toHaveBeenCalledWith( changes );
				} );
			} );
		} );
	} );
	describe( 'summary setValue', () => {
		let value;
		beforeAll(() => { value = createSourceData() });
		describe( `by the '${ CLEAR_TAG }' tag property key`, () => {
			test( 'sets the entire value to its default value', () => {
				let value : Value = createSourceData();
				setValue( value, CLEAR_TAG  as Changes<Value> );
				expect( value ).toEqual({});
				value = createSourceData();
				setValue( value, { [ CLEAR_TAG ]: expect.anything() }  as Changes<Value> );
				expect( value ).toEqual({});
			} );
			test( 'sets value slices to default values', () => {
				const _value = {
					...createSourceData(),
					nullableDefaultTester: new Map(),
					strs: [ 'zero', 'one', 'two', 'three' ]
				};
				setValue(
					_value,
					{
						company: CLEAR_TAG,
						friends: { 1: CLEAR_TAG },
						history: { places: [ CLEAR_TAG, CLEAR_TAG ] },
						name: CLEAR_TAG,
						nullableDefaultTester: CLEAR_TAG,
						phone: CLEAR_TAG,
						strs: [ CLEAR_TAG ],
						tags: CLEAR_TAG
					} as unknown as Changes<typeof _value>
				);
				expect( _value ).toEqual({
					..._value,
					company: '',
					friends: [ _value.friends[ 0 ], {}, _value.friends[ 2 ] ],
					history: { places: [ {}, {} ] },
					name: {},
					nullableDefaultTester: null,
					phone: {},
					strs: [ '' ],
					tags: []
				});
			} );
			test( 'also sets host property to default when present as a key in that property', () => {
				const _value : Value = createSourceData();
				setValue( _value, {
					company: { [ CLEAR_TAG ]: expect.anything() },
					friends: { 1: { [ CLEAR_TAG ]: expect.anything() } },
					history: {
						places: {
							0: { [ CLEAR_TAG ]: expect.anything() },
							1: { [ CLEAR_TAG ]: expect.anything() }
						}
					},
					name: { [ CLEAR_TAG ]: expect.anything() },
					phone: { [ CLEAR_TAG ]: expect.anything(), ...value.phone },
					tags: { [ CLEAR_TAG ]: expect.anything() }
				} );
				expect( _value ).toEqual({
					...value,
					company: '',
					friends: [ value.friends[ 0 ], {}, value.friends[ 2 ] ],
					history: { places: [ {}, {}, value.history.places[ 2 ] ] },
					name: {},
					phone: {},
					tags: []
				});
			} );
			test( 'ignores non-existent properties', () => {
				const _value = createSourceData();
				const onChangeMock = jest.fn();
				setValue(
					_value,
					{ testing: CLEAR_TAG } as Changes<Value>,
					onChangeMock
				);
				expect( _value ).toEqual( value );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
			test( 'ignores undefined & properties already at their default values', () => {
				const onChangeMock = jest.fn();
				const _value = {
					...createSourceData(),
					friends: [],
					name: {},
					nilValuesTester: {
						_null: null,
						_undefined: undefined
					}
				};
				const _value2 = clonedeep( _value );
				setValue(
					_value,
					{
						friends: CLEAR_TAG,
						name: CLEAR_TAG,
						nilValuesTester: {
							_null: CLEAR_TAG,
							_undefined: CLEAR_TAG
						}
					} as unknown as Changes<typeof _value>,
					onChangeMock
				);
				expect( _value ).toStrictEqual( _value2 );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
		} );
		describe( `by the '${ DELETE_TAG }' tag property key`, () => {
			test( 'removes all listed top level properties', () => {
				const value = createSourceData();
				const removedKeys = [ '_id', 'address', 'friends', 'picture' ];
				setValue( value, { [ DELETE_TAG ]: removedKeys } as Changes<Value> );
				expect( removedKeys.every( k => !( k in value ) ) ).toBe( true );
			} );
			test( 'removes all listed properties', () => {
				const _value : Value = createSourceData();
				setValue( _value, {
					friends: { [ DELETE_TAG ]: [ 0, 2 ] },
					name: { [ DELETE_TAG ]: [ 'first', 'last' ] },
					phone: { [ DELETE_TAG ]: [ 'area', 'country', 'line' ] },
					tags: { [ DELETE_TAG ]: [ 0, 1, 2, 3, 6 ] }
				} );
				expect( _value ).toEqual({
					...value,
					friends: [ value.friends[ 1 ] ],
					name: {},
					phone: { local: value.phone.local },
					tags: [ value.tags[ 4 ], value.tags[ 5 ] ]
				});
			} );
			test( 'removes all listed properties from an element and replaces the array with the element', () => {
				const _value = createSourceData();
				setValue(
					_value,
					{
						friends: [
							{ [ DELETE_TAG ]: [ 'name' ] }
						],
						history: {
							places: [
								value.history.places[ 0 ],
								{ [ DELETE_TAG ]: [ 'country', 'year' ] }
							]
						}
					} as unknown as Changes<Value>
				);
				expect( _value ).toEqual({
					...value,
					friends: [{ id: value.friends[ 0 ].id }],
					history: {
						places: [ value.history.places[ 0 ], {
							city: value.history.places[ 1 ].city,
							state: value.history.places[ 1 ].state
						} ]
					}
				});
			} );
			test( `throws \`TypeError\` when \`${ DELETE_TAG }\` property value is not an array`, () => {
				expect(() => {
					const v : Value = createSourceData();
					setValue( v, {
						company: { [ DELETE_TAG ]: value.company },
						friends: { 1: { [ DELETE_TAG ]: value.friends } },
						name: { [ DELETE_TAG ]: value.name },
						phone: { [ DELETE_TAG ]: value.phone, ...value.phone },
						tags: { [ DELETE_TAG ]: value.tags }
					} )
				}).toThrow( TypeError );
			} );
			test( `ignores non-existent property keys in the \`${ DELETE_TAG }\` property value`, () => {
				const onChangeMock = jest.fn();
				const _value : Value = createSourceData();
				setValue( _value, {
					friends: { [ DELETE_TAG ]: [ -9, 55, 'test' ] },
					name: { [ DELETE_TAG ]: [ 'suffix' ] },
					phone: { [ DELETE_TAG ]: [ 'extension', 'isp' ] },
					tags: { [ DELETE_TAG ]: [ 101, 9, 30, 62 ] }
				}, onChangeMock );
				expect( _value ).toEqual( value );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
			test( `ignores \`${ DELETE_TAG }\` property with empty array value`, () => {
				const onChangeMock = jest.fn();
				const _value : Value = createSourceData()
				setValue( _value, {
					friends: { [ DELETE_TAG ]: [] },
					name: { [ DELETE_TAG ]: [] },
					phone: { [ DELETE_TAG ]: [] },
					tags: { [ DELETE_TAG ]: [] }
				}, onChangeMock );
				expect( _value ).toEqual( value );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
		} );
		describe( `by the '${ MOVE_TAG }' tag property key`, () => {
			let value;
			beforeAll(() => { value = createSourceData() });
			test( 'moves contiguous array items(s) from one index to another', () => {
				const _value : Value = createSourceData();
				setValue( _value, {
					friends: { [ MOVE_TAG ]: [ 2, 1 ] },
					tags: { [ MOVE_TAG ]: [ 3, 5, 3 ] }
				} );
				expect( _value ).toEqual({
					...value,
					friends: [ 0, 2, 1 ].map( i => value.friends[ i ] ),
					tags: [ 0, 1, 2, 6, 3, 4, 5 ].map( i => value.tags[ i ] )
				});
			} );
			test( 'only updates value slices of the array type', () => {
				const _value : Value = createSourceData();
				setValue( _value, {
					company: { [ MOVE_TAG ]: [ 0, 2 ] }, // non-array `company` value will be ignored
					friends: { [ MOVE_TAG ]: [ 0, 2 ] }
				} );
				expect( _value ).toEqual({ ...value, friends: [ 1, 2, 0 ].map( i => value.friends[ i ] ) });
			} );
			describe( 'non-optional argument type validation', () => {
				test( 'only accepts an array value consisting of at least two integers', () => expect(
					() => {
						const v : Value = createSourceData();
						setValue( v, { friends: { [ MOVE_TAG ]: [ 0, 1 ] } } );
					}
				).not.toThrow( TypeError ) );
				test.each([
					[ null ], [ undefined ], [ '' ], [ 'test' ], [ {} ], [ { test: expect.anything() } ],
					[ true ], [ [] ], [ [ 3 ] ], [ [ true, true ] ], [ [ 4, true ] ], [ [ 1.2, 0.5 ] ],
					[ { 0: 2, 1: 1 } ]
				])( 'throws `TypeError` for arguments fitting this description: %p', args => expect(
					() => setValue( value, { friends: { [ MOVE_TAG ]: args } } )
				).toThrow( TypeError ) );
			} );
			describe( 'optional third argumemt', () => {
				test( 'accepts a positive integer value for number of contiguous elements to move', () => {
					const _value : Value = createSourceData();
					setValue( _value, { friends: { [ MOVE_TAG ]: [ 0, 2, 2 ] } } );
					expect( _value ).toEqual({
						...value,
						friends: [ 2, 0, 1 ].map( i => value.friends[ i ] )
					});
				} );
				test.each([
					[ 'negative integers', -2 ], [ 'zero', 0 ], [ 'fractions', 0.5 ],
					[ 'non-integer values', true ], [ 'non-numeric values', '2' ]
				])( 'ignores %p', ( desc, numItems ) => {
					const _value : Value = createSourceData();
					const onChangeMock = jest.fn();
					setValue( _value, { friends: { [ MOVE_TAG ]: [ 0, 2, numItems ] } }, onChangeMock );
					expect( _value ).toEqual( value );
					expect( onChangeMock ).not.toHaveBeenCalled();
				} );
				test( 'moves contiguous elements from fromIndex to end of array when argument value exceeds array length', () => {
					const _value : Value = createSourceData();
					setValue( _value, { friends: { [ MOVE_TAG ]: [ 1, 0, 3 ] } } );
					expect( _value ).toEqual({
						...value,
						friends: [ 1, 2, 0 ].map( i => value.friends[ i ] )
					});
				} );
			} );
			describe( 'counting from end of value array', () => {
				let calcExpected;
				beforeAll(() => {
					value = createSourceData();
					calcExpected = indexes => ({
						...value,
						friends: indexes.map( i => value.friends[ i ] )
					});
				});
				test.each([
					[ -1, 0, [ 2, 0, 1 ] ],
					[ 2, -2, [ 0, 2, 1 ] ],
					[ -2, -1, [ 0, 2, 1 ] ]
				])( 'accepts negative index in args %d and %d', ( from, to, expectedIndexes ) => {
					const _value : Value = createSourceData();
					setValue( _value, { friends: { [ MOVE_TAG ]: [ from, to ] } } );
					expect( _value ).toEqual( calcExpected( expectedIndexes ) );
				} );
			} );
			describe( 'case for rnon-existent properties', () => {
				let _value, onChangeMock;
				beforeAll(() => {
					_value = createSourceData();
					onChangeMock = jest.fn();
					setValue(
						_value,
						{ testing: { [ MOVE_TAG ]: [ 1, 1 ] } } as Changes<Value>,
						onChangeMock
					);
				});
				test( 'creates new entries for non-existent properties', () => {
					expect( _value ).toEqual({ ...value, testing: [] });
				} );
				test( 'does trigger change notification - no move took place', () => {
					expect( onChangeMock ).not.toHaveBeenCalled();
				} );
			} );
			test( 'ignores move requests from same index to same index', () => {
				const _value : Value = createSourceData();
				const onChangeMock = jest.fn();
				setValue( _value, { tags: { [ MOVE_TAG ]: [ 1, 1 ] } }, onChangeMock );
				expect( _value ).toEqual( value );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
		} );
		describe( `by the '${ PUSH_TAG }' tag property key`, () => {
			let value, newItems;
			beforeAll(() => {
				newItems = [ expect.anything(), expect.anything() ];
				value = createSourceData();
			});
			test( 'appends values at the end of value array property', () => {
				const _value : Value = createSourceData();
				setValue( _value, {
					friends: { [ PUSH_TAG ]: newItems },
					tags: { [ PUSH_TAG ]: newItems }
				} );
				expect( _value ).toEqual({
					...value,
					friends: [ ...value.friends, ...newItems ],
					tags: [ ...value.tags, ...newItems ]
				});
			} );
			test( 'only updates value slices of the array type', () => {
				const _value : Value = createSourceData();
				setValue( _value, {
					company: { [ PUSH_TAG ]: newItems }, // non-array `company` value will be ignored
					friends: { [ PUSH_TAG ]: newItems }
				} );
				expect( _value ).toEqual({
					...value,
					friends: [
						...value.friends,
						...newItems
					]
				});
			} );
			describe( 'non-optional argument type validation', () => {
				test( 'only accepts an array value', () => expect(() => {
					const v : Value = createSourceData();
					setValue( v, { friends: { [ PUSH_TAG ]: [] } } )
				}).not.toThrow( TypeError ) );
				test.each([
					[ null ], [ undefined ], [ '' ], [ 'test' ], [ {} ],
					[ { test: expect.anything() } ], [ true ], [ { 0: 2, 1: 1 } ]
				])( 'throws `TypeError` for arguments fitting this description: %p', args => expect(
					() => setValue( value, { friends: { [ PUSH_TAG ]: args } } )
				).toThrow( TypeError ) );
			} );
			test( 'ignores empty array argument', () => {
				const _value : Value = createSourceData();
				const onChangeMock = jest.fn();
				setValue( _value, { tags: { [ PUSH_TAG ]: [] } }, onChangeMock );
				expect( _value ).toEqual( value );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
			test( 'creates new entries for non-existent properties', () => {
				const _value = createSourceData();
				const onChangeMock = jest.fn();
				setValue(
					_value,
					{ testing: { [ PUSH_TAG ]: newItems } } as Changes<Value>,
					onChangeMock
				);
				expect( _value ).toEqual({ ...value, testing: newItems });
				expect( onChangeMock ).toHaveBeenCalled();
			} );
		} );
		describe( `by the '${ REPLACE_TAG }' tag property key`, () => {
			test( 'adds new and replaces existing referenced top level properties', () => {
				const _value = createSourceData();
				const valueReplacement = {
					averageScore: 87, // new
					// existing
					isActive: expect.any( Boolean ),
					name: expect.any( Object ),
					registered: expect.any( Object ),
					// new
					test1: expect.anything(),
					test2: expect.anything(),
					test3: expect.anything(),
					test4: expect.anything(),
					zone: 33
				};
				setValue(
					_value,
					{ [ REPLACE_TAG ]: valueReplacement } as Changes<Value>
				);
				expect( _value ).toEqual( valueReplacement );
			});
			test( 'replaces properties with new value', () => {
				const _value : Value = createSourceData();
				const newValues = {
					company: 'TEST_COMPANY',
					friends: 'NEW TEST FRIENDS',
					name: { first: 'Priscilla', middle: 'Samantha', last: 'Williams' },
					phone: {},
					tags: []
				};
				setValue( _value, {
					company: { [ REPLACE_TAG ]: newValues.company },
					friends: { [ REPLACE_TAG ]: newValues.friends },
					name: { [ REPLACE_TAG ]: newValues.name },
					phone: { [ REPLACE_TAG ]: newValues.phone },
					tags: { [ REPLACE_TAG ]: newValues.tags }
				});
				expect( _value ).toEqual({ ...value, ...newValues });
			} );
			test( 'adds new values to property when specified', () => {
				const _value : Value = createSourceData();
				const newValues = {
					company: 'TEST_COMPANY',
					friends: 'NEW TEST FRIENDS',
					name: { first: 'Priscilla', middle: 'Samantha', last: 'Williams' },
					phone: { extension: 'x456' }, // ADDING `extension` to value.phone
					tags: []
				};
				setValue( _value, {
					company: { [ REPLACE_TAG ]: newValues.company },
					friends: { [ REPLACE_TAG ]: newValues.friends },
					name: { [ REPLACE_TAG ]: newValues.name },
					phone: { extension: { [ REPLACE_TAG ]: newValues.phone.extension } },
					tags: { [ REPLACE_TAG ]: newValues.tags }
				});
				const expected = { ...value, ...newValues };
				expected.phone = { ...value.phone, extension: newValues.phone.extension };
				expect( _value ).toEqual( expected );
			} );
			test( 'ignores attempts to replace with identical values', () => {
				const _value : Value = createSourceData();
				const onChangeMock = jest.fn();
				setValue( _value, {
					friends: { [ REPLACE_TAG ]: value.friends },
					tags: { [ REPLACE_TAG ]: value.tags }
				}, onChangeMock );
				expect( _value ).toEqual( value );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
			test( 'adds new properties for attmepts to replace non-existent properties', () => {
				const _value = createSourceData();
				const onChangeMock = jest.fn();
				setValue(
					_value,
					{ testing: { [ REPLACE_TAG ]: expect.anything() } } as Changes<Value>,
					onChangeMock
				);
				expect( _value ).toEqual({ ...value, testing: expect.anything() });
				expect( onChangeMock ).toHaveBeenCalled();
			} );
		} );
		describe( `by the '${ SET_TAG }' tag property key`, () => {
			let newPhone, newTag0;
			beforeAll(() => {
				newPhone = { area: '312', line: '1212', local: '644' };
				newTag0 = 'first item';
			});
			test( 'replaces value slice with new value', () => {
				const _value = createSourceData();
				setValue(
					_value,
					{
						phone: { [ SET_TAG ]: newPhone },
						tags: [ { [ SET_TAG ]: newTag0 }, ..._value.tags ]
					} as unknown as Changes<Value>
				);
				expect( _value ).toEqual({
					...value,
					phone: newPhone,
					tags: [ newTag0, ...value.tags ]
				});
			} );
			describe( 'concerning values data type', () => {
				test( 'allows replacing atomic value slice with composite values', () => {
					const _value = createSourceData();
					const newInfo = { value: false, reason: expect.anything() };
					setValue( _value, {	isActive: { [ SET_TAG ]: newInfo } } );
					expect( _value ).toEqual({ ...value, isActive: newInfo })
				} );
				test( 'allows replacing composite value slice with atomic values', () => {
					const _value : Value = createSourceData();
					const phoneNumber = 'TEST PHONE NUMBER';
					setValue( _value, {	phone: { [ SET_TAG ]: phoneNumber } } );
					expect( _value ).toEqual({ ...value, phone: phoneNumber })
				} );
			} );
			describe( 'using compute function', () => {
				let _value, phoneArg, newPropArg;
				beforeAll(() => {
					_value = createSourceData();
					setValue( _value, {
						phone: {
							[ SET_TAG ]: s => {
								phoneArg = s;
								return newPhone;
							}
						},
						newProp: {
							[ SET_TAG ]: s => {
								newPropArg = s;
								return s;
							}
						}
					} );
				});
				test( 'replaces value slice with the return value', () => {
					expect( _value ).toEqual({ ...value, newProp: newPropArg, phone: newPhone });
				} );
				test( 'supplies currently held value slice value as argument', () => {
					expect( newPropArg ).toBeUndefined();
					expect( phoneArg ).not.toBe( _value.phone );
					expect( phoneArg ).toStrictEqual( value.phone );
				} );
			} );
			describe( 'setting referenced top level properties', () => {
				let _value, valueReplacement;
				beforeAll(() => {
					valueReplacement = {
						averageScore: 87, // new
						// existing
						isActive: expect.any( Boolean ),
						name: expect.any( Object ),
						registered: expect.any( Object ),
						// new
						test1: expect.anything(),
						test2: expect.anything(),
						test3: expect.anything(),
						test4: expect.anything(),
						zone: 33
					};
				});
				test( 'accepts ready-to-set data', () => {
					_value = createSourceData();
					setValue( _value, { [ SET_TAG ]: valueReplacement } );
					expect( _value ).toEqual( valueReplacement );
				});
				describe( 'using compute function', () => {
					let arg;
					beforeAll(() => {
						_value = createSourceData();
						setValue( _value, {
							[ SET_TAG ]: s => {
								arg = s;
								return valueReplacement;
							}
						} );
					});
					test( 'accepts the function return value', () => {
						expect( _value ).toEqual( valueReplacement );
					} );
					test( 'supplies currently held value value as argument', () => {
						expect( arg ).not.toBe( _value );
						expect( arg ).toStrictEqual( value );
					} );
				} );
			});
			test( 'replaces properties with new value', () => {
				const _value : Value = createSourceData();
				const newValues = {
					company: 'TEST_COMPANY',
					friends: 'NEW TEST FRIENDS',
					name: { first: 'Priscilla', middle: 'Samantha', last: 'Williams' },
					phone: {},
					tags: []
				};
				setValue( _value, {
					company: { [ SET_TAG ]: newValues.company },
					friends: { [ SET_TAG ]: newValues.friends },
					name: { [ SET_TAG ]: newValues.name },
					phone: { [ SET_TAG ]: newValues.phone },
					tags: { [ SET_TAG ]: newValues.tags }
				});
				expect( _value ).toEqual({ ...value, ...newValues });
			} );
			test( 'adds new values to property when specified', () => {
				const _value : Value = createSourceData();
				const newValues = {
					company: 'TEST_COMPANY',
					friends: 'NEW TEST FRIENDS',
					name: { first: 'Priscilla', middle: 'Samantha', last: 'Williams' },
					phone: { extension: 'x456' }, // ADDING `extension` to value.phone
					tags: t => t.length > 3 ? t.slice( -2 ) : t
				};
				setValue( _value, {
					company: { [ SET_TAG ]: newValues.company },
					friends: { [ SET_TAG ]: newValues.friends },
					name: { [ SET_TAG ]: newValues.name },
					phone: { extension: { [ SET_TAG ]: newValues.phone.extension } },
					tags: { [ SET_TAG ]: newValues.tags }
				});
				const expected = { ...value, ...newValues, tags: value.tags.slice( -2 ) };
				expected.phone = { ...value.phone, extension: newValues.phone.extension };
				expect( _value ).toEqual( expected );
			} );
			test( 'ignores attempts to replace with identical values', () => {
				const _value : Value = createSourceData();
				const onChangeMock = jest.fn();
				setValue( _value, {
					friends: { [ SET_TAG ]: value.friends },
					tags: { [ SET_TAG ]: value.tags }
				}, onChangeMock );
				expect( _value ).toEqual( value );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
			test( 'adds new properties for attmepts to replace non-existent properties', () => {
				const _value = createSourceData();
				const onChangeMock = jest.fn();
				setValue(
					_value,
					{ testing: { [ SET_TAG ]: expect.anything() } } as Changes<Value>,
					onChangeMock
				);
				expect( _value ).toEqual({ ...value, testing: expect.anything() });
				expect( onChangeMock ).toHaveBeenCalled();
			} );
		} );
		describe( `by the '${ SPLICE_TAG }' tag property key`, () => {
			let value, newItems;
			/**
			 * "x" arrayIndex entry signifies when to insert new item values into expected array.
			 *
			 * @type {(field: string, indexPositions: Array<number|"x">, newItems: any) => Array}
			 */
			let computeExpectedArray;
			beforeAll(() => {
				newItems = [ expect.anything(), expect.anything() ];
				value = createSourceData();
				computeExpectedArray = ( field, indexPositions, newItems ) => indexPositions.reduce(( a, i ) => {
					i === 'x'
						? a.push( ...newItems )
						: a.push( value[ field ][ i ] );
					return a;
				}, []);
			});
			test( 'removes a specified number of elements from a specified value array index and inserts new items at that index', () => {
				const _value : Value = createSourceData();
				setValue( _value, {
					friends: { [ SPLICE_TAG ]: [ 2, 1, ...newItems ] },
					tags: { [ SPLICE_TAG ]: [ 3, 2, ...newItems ] }
				} );
				expect( _value ).toEqual({
					...value,
					friends: computeExpectedArray( 'friends', [ 0, 1, 'x' ], newItems ),
					tags: computeExpectedArray( 'tags', [ 0, 1, 2, 'x', 5, 6 ], newItems )
				});
			} );
			test( 'only updates value slices of the array type', () => {
				const _value : Value = createSourceData();
				setValue( _value, {
					company: { [ SPLICE_TAG ]: [ 0, 2 ] }, // non-array `company` value will be ignored
					friends: { [ SPLICE_TAG ]: [ 0, 2 ] }
				} );
				expect( _value ).toEqual({ ...value, friends: [ value.friends[ 2 ] ] });
			} );
			describe( 'non-optional argument type validation', () => {
				test( 'only accepts an array value consisting of at least two integers', () => expect(
					() => {
						const v : Value = createSourceData();
						setValue( v, { friends: { [ SPLICE_TAG ]: [ 0, 1 ] } } )
					}
				).not.toThrow( TypeError ) );
				test.each([
					[ null ], [ undefined ], [ '' ], [ 'test' ], [ {} ], [ { test: expect.anything() } ],
					[ true ], [ [] ], [ [ 3 ] ], [ [ true, true ] ], [ [ 4, true ] ], [ [ 1.2, 0.5 ] ],
					[ { 0: 2, 1: 1 } ]
				])( 'throws `TypeError` for arguments fitting this description: %p', args => expect(
					() => setValue( value, { friends: { [ SPLICE_TAG ]: args } } )
				).toThrow( TypeError ) );
			} );
			describe( 'additional optional ...newItems variadic argumemt(s)', () => {
				test( 'accepts one or more values to insert contiguously starting from the fromIndex position of the value array', () => {
					const _value : Value = createSourceData();
					setValue( _value, {
						friends: { [ SPLICE_TAG ]: [ 2, 1, ...newItems ] },
						tags: { [ SPLICE_TAG ]: [ 3, 2, ...newItems ] }
					} );
					expect( _value ).toEqual({
						...value,
						friends: computeExpectedArray( 'friends', [ 0, 1, 'x' ], newItems ),
						tags: computeExpectedArray( 'tags', [ 0, 1, 2, 'x', 5, 6 ], newItems )
					});
				} );
			} );
			test( 'trims off all leading elements identical to the value array at same index; adjusts fromIndex & deleteCount inserting new items', () => {
				const _value : Value = createSourceData();
				setValue( _value, {
					friends: { [ SPLICE_TAG ]: [ 0, 3, value.friends[ 0 ], ...newItems ] },
					tags: { [ SPLICE_TAG ]: [ 2, 4, value.tags[ 2 ], value.tags[ 3 ], ...newItems, value.tags[ 0 ] ] }
				});
				expect( _value ).toEqual({
					...value,
					friends: computeExpectedArray( 'friends', [ 0, 'x' ], newItems ),
					tags: computeExpectedArray( 'tags', [ 0, 1, 2, 3, 'x', 0, 6 ], newItems )
				});
			} );
			test( 'ignores a combination of argument #2 = 0 and no new items to insert', () => {
				const _value : Value = createSourceData();
				const onChangeMock = jest.fn();
				setValue( _value, { tags: { [ SPLICE_TAG ]: [ 3, 0 ] } }, onChangeMock );
				expect( _value ).toEqual( value );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
			test( 'auto-corrects negative argument #2 to 0', () => {
				const _value : Value = createSourceData();
				const onChangeMock = jest.fn();
				setValue( _value, { tags: { [ SPLICE_TAG ]: [ 3, -2 ] } }, onChangeMock );
				expect( _value ).toEqual( value );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
			describe( 'counting from end of value array', () => {
				test.each([
					[ -1, 0, '', [ 0, 1, 2 ] ],
					[ -1, 0, ' along with the optional new element to insert', [ 0, 1, 'x', 2 ] ],
					[ 2, -2, '', [ 0, 1, 2 ] ],
					[ 2, -2, ' along with the optional new element to insert', [ 0, 1, 'x', 2 ] ],
					[ -2, 1, '', [ 0, 2 ] ],
					[ -2, 1, ' along with the optional new element to insert', [ 0, 'x', 2 ] ]
				])( 'accepts negative index in args %d and %d%s', ( from, to, desc, expectedIndices ) => {
					const _value : Value = createSourceData();
					const args = [ from, to ];
					if( desc.length ) { args.push( ...newItems ) }
					setValue( _value, { friends: { [ SPLICE_TAG ]: args } } );
					expect( _value ).toEqual({
						...value,
						friends: computeExpectedArray( 'friends', expectedIndices, desc.length ? newItems : undefined )
					});
				} );
			} );
			test( 'ignores attempts to remove and re-insert identical values', () => {
				const _value : Value = createSourceData();
				const onChangeMock = jest.fn();
				setValue( _value, {
					friends: { [ SPLICE_TAG ]: [ 0, 1, value.friends[ 0 ] ] },
					tags: { [ SPLICE_TAG ]: [ 5, 1, value.tags[ 5 ] ] }
				}, onChangeMock );
				expect( _value ).toEqual( value );
				expect( onChangeMock ).not.toHaveBeenCalled();
			} );
			test( 'creates new entries for non-existent properties', () => {
				const _value = createSourceData();
				const onChangeMock = jest.fn();
				setValue(
					_value,
					{ testing: { [ SPLICE_TAG ]: [ 1, 1 ] } } as Changes<Value>,
					onChangeMock
				);
				expect( _value ).toEqual({ ...value, testing: [] });
				expect( onChangeMock ).toHaveBeenCalled();
			} );
		} );
		describe( 'on currently undefined value', () => {
			let getShallowUpdate, getUpdate, onChange, value;
			beforeAll(() => {
				getShallowUpdate = tag => ({ testing: tag });
				getUpdate = tag => ({ testing: { value: tag } });
				onChange = () => {};
				value = createSourceData();
			});

			afterEach(() => { delete value.testing });

			describe.each`
				tag											| desc										| expected
				${ CLEAR_TAG }								| ${ 'as a string tag' }					| ${ {} } 
				${ [ CLEAR_TAG ] }							| ${ 'in array payload' }					| ${ { value: [ undefined ] } }
				${ { 1: CLEAR_TAG } }						| ${ 'in indexed-object payload' }			| ${ { value: [ undefined, undefined ] } }	
				${ { places: [ CLEAR_TAG, CLEAR_TAG ] } }	| ${ 'in a nested payload' }				| ${ { value: { places: [ undefined, undefined ] } } }	
				${ { places: CLEAR_TAG } }					| ${ 'as a string in a nested payload' }	| ${ { value: {} } }
			`( `using '${ CLEAR_TAG }' tag property key $desc`, ({ tag, expected }) => {
				test( 'sets shallowly embedded tag', () => {
					setValue( value, getShallowUpdate( tag ), onChange );
					expect( value.testing ).toEqual( expected.value );
				} );
				test( 'sets deeply embedded tag', () => {
					setValue( value, getUpdate( tag ), onChange );
					expect( value.testing ).toEqual( expected );
				} );
				describe( 'from within an array slice ancestor context', () => {
					test( 'is supported', () => {
						expected = expected.value;
						setValue( value, getShallowUpdate([ tag ]) );
						expect( value.testing ).toEqual([ expected ]);
						delete value.testing;
						setValue( value, getShallowUpdate({ 2: tag }) );
						expect( value.testing ).toEqual([ undefined, undefined, expected ]);
						delete value.testing;
						setValue( value, getUpdate([ tag ]) );
						expect( value.testing ).toEqual({ value: [ expected ] });
						delete value.testing;
						setValue( value, getUpdate({ 2: tag }) );
						expect( value.testing ).toEqual({ value: [ undefined, undefined, expected ] });
						delete value.testing;
					} );
				} );
			} );
			describe( `using '${ DELETE_TAG }' tag property key`, () => {
				let tag;
				beforeAll(() => { tag = { [ DELETE_TAG ]: [ 'area', 'country', 'line' ] } });
				test( 'sets shallowly embedded tag', () => {
					setValue( value, getShallowUpdate( tag ), onChange );
					expect( value.testing ).toEqual( undefined );
				} );
				test( 'sets deeply embedded tag', () => {
					setValue( value, getUpdate( tag ), onChange );
					expect( value.testing ).toEqual({});
				} );
				describe( 'from within an array slice ancestor context', () => {
					test( 'is supported', () => {
						setValue( value, getShallowUpdate([ tag ]) );
						expect( value.testing ).toEqual([ undefined ]);
						delete value.testing;
						setValue( value, getShallowUpdate({ 2: tag }) );
						expect( value.testing ).toEqual([ undefined, undefined, undefined ]);
						delete value.testing;
						setValue( value, getUpdate([ tag ]) );
						expect( value.testing ).toEqual({ value: [ undefined ] });
						delete value.testing;
						setValue( value, getUpdate({ 2: tag }) );
						expect( value.testing ).toEqual({ value: [ undefined, undefined, undefined ] });
						delete value.testing;
					} );
				} );
			} );
			describe( `using '${ MOVE_TAG }' tag property key`, () => {
				let tag;
				beforeAll(() => { tag = { [ MOVE_TAG ]: [ 0, 2 ] } });
				test( 'sets shallowly embedded tag', () => {
					setValue( value, getShallowUpdate( tag ), onChange );
					expect( value.testing ).toEqual( [] );
				} );
				test( 'sets deeply embedded tag', () => {
					setValue( value, getUpdate( tag ), onChange );
					expect( value.testing ).toEqual({ value: [] });
				} );
				describe( 'from within an array slice ancestor context', () => {
					test( 'is supported', () => {
						setValue( value, getShallowUpdate([ tag ]) );
						expect( value.testing ).toEqual([[]]);
						delete value.testing;
						setValue( value, getShallowUpdate({ 2: tag }) );
						expect( value.testing ).toEqual([ undefined, undefined, [] ]);
						delete value.testing;
						setValue( value, getUpdate([ tag ]) );
						expect( value.testing ).toEqual({ value: [[]] });
						delete value.testing;
						setValue( value, getUpdate({ 2: tag }) );
						expect( value.testing ).toEqual({ value: [ undefined, undefined, [] ] });
						delete value.testing;
					} );
				} );
			} );
			describe( `using '${ PUSH_TAG }' tag property key`, () => {
				let tag, _value;
				beforeAll(() => {
					_value = [ { prop: expect.anything() }, expect.anything() ];
					tag = { [ PUSH_TAG ]: _value };
				});
				test( 'sets shallowly embedded tag', () => {
					setValue( value, getShallowUpdate( tag ), onChange );
					expect( value.testing ).toEqual( _value );
				} );
				test( 'sets deeply embedded tag', () => {
					setValue( value, getUpdate( tag ), onChange );
					expect( value.testing ).toEqual({ value: _value });
				} );
				describe( 'from within an array slice ancestor context', () => {
					test( 'is supported', () => {
						setValue( value, getShallowUpdate([ tag ]) );
						expect( value.testing ).toEqual([ _value ]);
						delete value.testing;
						setValue( value, getShallowUpdate({ 2: tag }) );
						expect( value.testing ).toEqual([ undefined, undefined, _value ]);
						delete value.testing;
						setValue( value, getUpdate([ tag ]) );
						expect( value.testing ).toEqual({ value: [ _value ] });
						delete value.testing;
						setValue( value, getUpdate({ 2: tag }) );
						expect( value.testing ).toEqual({ value: [ undefined, undefined, _value ] });
						delete value.testing;
					} );
				} );
			} );
			describe( `using '${ REPLACE_TAG }' tag property key`, () => {
				let tag, _value;
				beforeAll(() => {
					_value = 'REPLACEMENT STATE VALUE';
					tag = { [ REPLACE_TAG ]: _value };
				});
				test( 'sets shallowly embedded tag', () => {
					setValue( value, getShallowUpdate( tag ), onChange );
					expect( value.testing ).toEqual( _value );
				} );
				test( 'sets deeply embedded tag', () => {
					setValue( value, getUpdate( tag ), onChange );
					expect( value.testing ).toEqual({ value: _value });
				} );
				describe( 'from within an array slice ancestor context', () => {
					test( 'is supported', () => {
						setValue( value, getShallowUpdate([ tag ]) );
						expect( value.testing ).toEqual([ _value ]);
						delete value.testing;
						setValue( value, getShallowUpdate({ 2: tag }) );
						expect( value.testing ).toEqual([ undefined, undefined, _value ]);
						delete value.testing;
						setValue( value, getUpdate([ tag ]) );
						expect( value.testing ).toEqual({ value: [ _value ] });
						delete value.testing;
						setValue( value, getUpdate({ 2: tag }) );
						expect( value.testing ).toEqual({ value: [ undefined, undefined, _value ] });
						delete value.testing;
					} );
				} );
			} );
			describe( `using '${ SET_TAG }' tag property key`, () => {
				let tag, _value;
				beforeAll(() => {
					_value = 'STATE UPDATE VALUE';
					tag = { [ SET_TAG ]: _value }
				});
				test( 'sets shallowly embedded tag', () => {
					setValue( value, getShallowUpdate( tag ), onChange );
					expect( value.testing ).toEqual( _value );
				} );
				test( 'sets deeply embedded tag', () => {
					setValue( value, getUpdate( tag ), onChange );
					expect( value.testing ).toEqual({ value: _value });
				} );
				describe( 'from within an array slice ancestor context', () => {
					test( 'is supported', () => {
						setValue( value, getShallowUpdate([ tag ]) );
						expect( value.testing ).toEqual([ _value ]);
						delete value.testing;
						setValue( value, getShallowUpdate({ 2: tag }) );
						expect( value.testing ).toEqual([ undefined, undefined, _value ]);
						delete value.testing;
						setValue( value, getUpdate([ tag ]) );
						expect( value.testing ).toEqual({ value: [ _value ] });
						delete value.testing;
						setValue( value, getUpdate({ 2: tag }) );
						expect( value.testing ).toEqual({ value: [ undefined, undefined, _value ] });
						delete value.testing;
					} );
				} );
			} );
			describe( `using computed '${ SET_TAG }' tag property key`, () => {
				let expected, tag;
				beforeAll(() => {
					expected = 'COMPUTED STATE UPDATE VALUE';
					tag = { [ SET_TAG ]: prev => prev ?? expected };
				});
				test( 'sets shallowly embedded tag', () => {
					setValue( value, getShallowUpdate( tag ), onChange );
					expect( value.testing ).toEqual( expected );
				} );
				test( 'sets deeply embedded tag', () => {
					setValue( value, getUpdate( tag ), onChange );
					expect( value.testing ).toEqual({ value: expected });
				} );
				describe( 'from within an array slice ancestor context', () => {
					test( 'is supported', () => {
						setValue( value, getShallowUpdate([ tag ]) );
						expect( value.testing ).toEqual([ expected ]);
						delete value.testing;
						setValue( value, getShallowUpdate({ 2: tag }) );
						expect( value.testing ).toEqual([ undefined, undefined, expected ]);
						delete value.testing;
						setValue( value, getUpdate([ tag ]) );
						expect( value.testing ).toEqual({ value: [ expected ] });
						delete value.testing;
						setValue( value, getUpdate({ 2: tag }) );
						expect( value.testing ).toEqual({ value: [ undefined, undefined, expected ] });
						delete value.testing;
					} );
				} );
			} );
			describe( `using '${ SPLICE_TAG }' tag property key`, () => {
				let data, dataTag, tag;
				beforeAll(() => {
					data = { color: 'blue' };
					dataTag = { [ SPLICE_TAG ]: [ 1, 1, data ] };
					tag = { [ SPLICE_TAG ]: [ 1, 1 ] };
				});
				describe( 'to remove from undefined value', () => {
					test( 'shallowly creates empty array by default', () => {
						setValue( value, getShallowUpdate( tag ), onChange );
						expect( value.testing ).toEqual( [] );
					} );
					test( 'creates empty array by default', () => {
						setValue( value, getUpdate( tag ), onChange );
						expect( value.testing ).toEqual({ value: [] });
					} );
				} );
				describe( 'to remove from and insert into undefined value', () => {
					test( 'shallowly creates new array value slice and inserts new elements', () => {
						setValue( value, getShallowUpdate( dataTag ), onChange );
						expect( value.testing ).toEqual([ data ]);
					} );
					test( 'creates new array value slice and inserts new elements', () => {
						setValue( value, getUpdate( dataTag ), onChange );
						expect( value.testing ).toEqual({ value: [ data ] });
					} );
				} );
				describe( 'from within an array slice ancestor context', () => {
					test( 'is supported', () => {
						setValue( value, getShallowUpdate([ tag ]) );
						expect( value.testing ).toEqual([[]]);
						delete value.testing;
						setValue( value, getShallowUpdate({ 2: tag }) );
						expect( value.testing ).toEqual([ undefined, undefined, [] ]);
						delete value.testing;
						setValue( value, getUpdate([ tag ]) );
						expect( value.testing ).toEqual({ value: [[]] });
						delete value.testing;
						setValue( value, getUpdate({ 2: tag }) );
						expect( value.testing ).toEqual({ value: [ undefined, undefined, [] ] });
						delete value.testing;
						setValue( value, getShallowUpdate([ dataTag ]) );
						expect( value.testing ).toEqual([[ data ]]);
						delete value.testing;
						setValue( value, getShallowUpdate({ 2: dataTag }) );
						expect( value.testing ).toEqual([ undefined, undefined, [ data ] ]);
						delete value.testing;
						setValue( value, getUpdate([ dataTag ]) );
						expect( value.testing ).toEqual({ value: [[ data ]] });
						delete value.testing;
						setValue( value, getUpdate({ 2: dataTag }) );
						expect( value.testing ).toEqual({ value: [ undefined, undefined, [ data ] ] });
						delete value.testing;
					} );
				} );
			} );
		} );
	} );
	describe( 'utilizing all set tags in a single call', () => {
		test( 'testing', () => {
			const onChangeMock = jest.fn();
			const value = {
				...createSourceData(),
				faveColors: [ 'white', 'grey', 'green', 'blue', 'navy', 'midnight blue', 'indigo', 'sky blue' ],
				pets: [ 'Coco', 'Mimi', 'Kiki', 'Titi', 'Fifi', 'Lili' ]
			};
			const _value = clonedeep( value );
			const NEW_PUSH_TAG_VALUES = [ { prop: 55 }, 22 ];
			const NEW_REPLACE_TAG_VALUE = 'REPLACEMENT STATE VALUE';
			const NEW_SET_TAG_VALUE = 'STATE UPDATE VALUE';
			const NEW_SET_TAG_VALUE_COMPUTED = 'COMPUTED STATE UPDATE VALUE';
			const changes = {
				age: 97,
				faveColors: {
					[ MOVE_TAG ]: [ -5, 2, 4 ], // => ['white', 'grey', 'blue', 'navy', 'midnight blue', 'indigo', 'green', 'sky blue']
					[ SPLICE_TAG ]: [ 0, 2, 'red', 'orange', 'yellow' ], // ['red', 'orange', 'yellow', 'blue', 'navy', 'midnight blue', 'indigo', 'green', 'sky blue']
					[ PUSH_TAG ]: [ 'silver', 'gold', 'bronze' ] // [...,'silver', 'gold', 'bronze']
				},
				CLEAR_TAG_ON_NEW_PROPS_A: CLEAR_TAG,
				CLEAR_TAG_ON_NEW_PROPS_B: { value: CLEAR_TAG },
				CLEAR_TAG_ON_NEW_PROPS_C: { value: { places: CLEAR_TAG } },
				CLEAR_TAG_ON_NEW_PROPS_D: { value: { places: [ CLEAR_TAG, CLEAR_TAG ] } },
				DELETE_TAG_ON_NEW_PROPS_A: { [ DELETE_TAG ]: [ 'area', 'country', 'line' ] },
				DELETE_TAG_ON_NEW_PROPS_B: { value: { [ DELETE_TAG ]: [ 'area', 'country', 'line' ] } },
				DELETE_TAG_ON_NEW_PROPS_C: { value: { places: { [ DELETE_TAG ]: [ 'area', 'country', 'line' ] } } },
				MOVE_TAG_ON_NEW_PROPS_A: { [ MOVE_TAG ]: [ 0, 2 ] },
				MOVE_TAG_ON_NEW_PROPS_B: { value: { [ MOVE_TAG ]: [ 0, 2 ] } },
				MOVE_TAG_ON_NEW_PROPS_C: { value: { places: { [ MOVE_TAG ]: [ 0, 2 ] } } },
				PUSH_TAG_ON_NEW_PROPS_A: { [ PUSH_TAG ]: NEW_PUSH_TAG_VALUES },
				PUSH_TAG_ON_NEW_PROPS_B: { value: { [ PUSH_TAG ]: NEW_PUSH_TAG_VALUES } },
				PUSH_TAG_ON_NEW_PROPS_C: { value: { places: { [ PUSH_TAG ]: NEW_PUSH_TAG_VALUES } } },
				REPLACE_TAG_ON_NEW_PROPS_A: { [ REPLACE_TAG ]: NEW_REPLACE_TAG_VALUE },
				REPLACE_TAG_ON_NEW_PROPS_B: { value: { [ REPLACE_TAG ]: NEW_REPLACE_TAG_VALUE } },
				REPLACE_TAG_ON_NEW_PROPS_C: { value: { places: { [ REPLACE_TAG ]: NEW_REPLACE_TAG_VALUE } } },
				SET_TAG_ON_NEW_PROPS_A: { [ SET_TAG ]: NEW_SET_TAG_VALUE },
				SET_TAG_ON_NEW_PROPS_B: { value: { [ SET_TAG ]: NEW_SET_TAG_VALUE } },
				SET_TAG_ON_NEW_PROPS_C: { value: { places: { [ SET_TAG ]: NEW_SET_TAG_VALUE } } },
				SET_TAG_ON_NEW_PROPS_COMPUTED_A: { [ SET_TAG ]: prev => prev ?? NEW_SET_TAG_VALUE_COMPUTED },
				SET_TAG_ON_NEW_PROPS_COMPUTED_B: { value: { [ SET_TAG ]: prev => prev ?? NEW_SET_TAG_VALUE_COMPUTED } },
				SET_TAG_ON_NEW_PROPS_COMPUTED_C: { value: { places: { [ SET_TAG ]: prev => prev ?? NEW_SET_TAG_VALUE_COMPUTED } } },
				SPLICE_TAG_ON_NEW_PROPS_A: { [ SPLICE_TAG ]: [ 1, 1 ] },
				SPLICE_TAG_ON_NEW_PROPS_B: { value: { [ SPLICE_TAG ]: [ 1, 1 ] } },
				SPLICE_TAG_ON_NEW_PROPS_C: { value: { places: { [ SPLICE_TAG ]: [ 1, 1 ] } } },
				friends: {
					[ DELETE_TAG ]: [ 0, -2 ],
					1: { name: { first: 'Mary' } },
					2: CLEAR_TAG
				},
				history: {
					places: {
						[ DELETE_TAG ]: [ 0, 2 ],
						testing: expect.anything() // this will be ignored: `testing` is neither a tag command key nor a valid array index
					}
				},
				pets: [
					{ [ REPLACE_TAG ]: 'Titi' },
					'Deedee',
					{ [ CLEAR_TAG ]: expect.anything() },
					'Momo',
					{ [ SET_TAG ]: s => s },
					'Lala',
					'Lulu',
					'Chuchu'
				],
				tags: {
					'-1': { [ SET_TAG ]: 'new last item' },
					1: { [ REPLACE_TAG ]: 'new 2nd item' },
					4: { [ SET_TAG ]: s => `${ s }_${ s.length }` }
				}
			};
			setValue( _value, changes as unknown as Changes<Value>, onChangeMock );
			expect( _value ).toEqual({
				...value,
				age: 97,
				faveColors: ['red', 'orange', 'yellow', 'blue', 'navy', 'midnight blue', 'indigo', 'green', 'sky blue', 'silver', 'gold', 'bronze' ],
				friends: [ value.friends[ 2 ], { name: { first: 'Mary' } }, undefined ],
				history: { places: [ value.history.places[ 1 ] ] },
				pets: [ 'Titi', 'Deedee', '', 'Momo', value.pets[ 4 ], 'Lala', 'Lulu', 'Chuchu' ],
				tags: [ 'minim', 'new 2nd item', 'dolor', 'in', 'ullamco_7', 'laborum', 'new last item' ],
				CLEAR_TAG_ON_NEW_PROPS_B: {},
				CLEAR_TAG_ON_NEW_PROPS_C: { value: {} },
				CLEAR_TAG_ON_NEW_PROPS_D: { value: { places: [ undefined, undefined ] } },
				DELETE_TAG_ON_NEW_PROPS_B: {},
				DELETE_TAG_ON_NEW_PROPS_C: { value: {} },
				MOVE_TAG_ON_NEW_PROPS_A: [],
				MOVE_TAG_ON_NEW_PROPS_B: { value: [] },
				MOVE_TAG_ON_NEW_PROPS_C: { value: { places: [] } },
				PUSH_TAG_ON_NEW_PROPS_A: [ { prop: 55 }, 22 ],
				PUSH_TAG_ON_NEW_PROPS_B: { value: [ { prop: 55 }, 22 ] },
				PUSH_TAG_ON_NEW_PROPS_C: { value: { places: [ { prop: 55 }, 22 ] } },
				REPLACE_TAG_ON_NEW_PROPS_A: 'REPLACEMENT STATE VALUE',
				REPLACE_TAG_ON_NEW_PROPS_B: { value: 'REPLACEMENT STATE VALUE' },
				REPLACE_TAG_ON_NEW_PROPS_C: { value: { places: 'REPLACEMENT STATE VALUE' } },
				SET_TAG_ON_NEW_PROPS_A: 'STATE UPDATE VALUE',
				SET_TAG_ON_NEW_PROPS_B: { value: 'STATE UPDATE VALUE' },
				SET_TAG_ON_NEW_PROPS_C: { value: { places: 'STATE UPDATE VALUE' } },
				SET_TAG_ON_NEW_PROPS_COMPUTED_A: 'COMPUTED STATE UPDATE VALUE',
				SET_TAG_ON_NEW_PROPS_COMPUTED_B: { value: 'COMPUTED STATE UPDATE VALUE' },
				SET_TAG_ON_NEW_PROPS_COMPUTED_C: { value: { places: 'COMPUTED STATE UPDATE VALUE' } },
				SPLICE_TAG_ON_NEW_PROPS_A: [],
				SPLICE_TAG_ON_NEW_PROPS_B: { value: [] },
				SPLICE_TAG_ON_NEW_PROPS_C: { value: { places: [] } }
			});
			const arg = onChangeMock.mock.calls[ 0 ][ 0 ];
			expect( arg ).toBe( changes );
			expect( arg ).toEqual( changes );
			expect( arg ).toStrictEqual( changes );
		} );
		test( `allows '${ REPLACE_TAG } as an alias for '${ SET_TAG }' without the compute function`, () => {
			const value1 : Value = createSourceData();
			const value2 : Value = createSourceData();
			setValue( value1, { name: { [ REPLACE_TAG ]: { first: 'Jame', last: 'Doe' }, age: 24 } } );
			setValue( value2, { name: { [ SET_TAG ]: { first: 'Jame', last: 'Doe' }, age: 24 } } );
			expect( value1 ).toStrictEqual( value2 );
			expect( value ).not.toEqual( value1 );
		} );
		test( `does not allow '${ REPLACE_TAG } as an alias for '${ SET_TAG }' with the compute function`, () => {
			const value : Value = createSourceData();
			const value1 : Value = createSourceData();
			const value2 : Value = createSourceData();
			const newBalance = 'TEST_BALANCE';
			const computeNewBalance = s => newBalance;
			setValue( value1, { balance: { [ REPLACE_TAG ]: computeNewBalance } } );
			setValue( value2, { balance: { [ SET_TAG ]: computeNewBalance } } );
			expect( value1 ).toEqual({ ...value, balance: computeNewBalance });
			expect( value2 ).toEqual({ ...value, balance: newBalance });
		} );
	} );
} );
