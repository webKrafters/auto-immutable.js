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

import * as tag from '.';

import createSourceData from '../test-artifacts/data/create-data-obj';

let state : SourceData;
let statsStub : {hasChanges: boolean};

beforeAll(() => {
	statsStub = { hasChanges: false };
	state = createSourceData();
});

describe( '$clear(...)', () => {
	let _state;
	beforeEach(() => { _state = createSourceData() });
	test.each([
		[ 'string', '', 'email' ],
		[ 'POJO', {}, 'name' ],
		[ 'array', [], 'tags' ]
	])( 'sets %s property value to %p', ( type, emptyValue, stateKey ) => {
		tag.$clear( _state, stateKey, statsStub, { [ stateKey ]: { [ CLEAR_TAG ]: expect.anything() } } );
		expect( _state ).toEqual({ ...state, [ stateKey ]: emptyValue });
	} );
	describe( 'indexing', () => {
		let expected;
		beforeAll(() => {
			expected = {
				...state,
				tags: [ state.tags[ 0 ], '', ...state.tags.slice( 2 ) ]
			};
		});
		test( 'sets string value at an index of array property to ""', () => {
			const tags : SourceData["tags"]|{} = clonedeep( state.tags );
			tags[ 1 ] = { [ CLEAR_TAG ]: expect.anything() };
			tag.$clear( _state.tags, 1, statsStub, tags );
			expect( _state ).toEqual( expected );
		} );
		test( 'sets string value at an index of array property to "" using the indexed object array update methtod', () => {
			tag.$clear( _state.tags, 1, statsStub, { 1: { [ CLEAR_TAG ]: expect.anything() } } );
			expect( _state ).toEqual( expected );
		} );
	} );
	test( 'sets function instance value to null', () => {
		const fn = () => {};
		_state.fn = fn;
		tag.$clear( _state, 'fn', statsStub, { fn: { [ CLEAR_TAG ]: expect.anything() } } );
		expect( _state ).toEqual({ ...state, fn: null });
	} );
	test( 'sets class instance value to null', () => {
		_state.instance = new ( class Test {} )();
		tag.$clear( _state, 'instance', statsStub, { instance: { [ CLEAR_TAG ]: expect.anything() } } );
		expect( _state ).toEqual({ ...state, instance: null });
	} );
	describe( 'at deeper level', () => {
		test.each([
			[ 'string', '', '', 'phone', 'country' ],
			[ 'POJO', {}, '', 'registered', 'time' ],
			[ 'array', [], '', 'history', 'places' ],
			[ 'array element POJO', {}, ' using the indexed object array update methtod', 'friends', 1 ]
		])( 'sets %s property value to %p%s', ( type, emptyValue, indexingDescAddendum, sliceKey, stateKey ) => {
			tag.$clear( _state[ sliceKey ], stateKey, statsStub, { [ stateKey ]: { [ CLEAR_TAG ]: expect.anything() } } );
			expect( _state ).toEqual({
				...state,
				[ sliceKey ]: (
					indexingDescAddendum.length
						? state[ sliceKey ].map( ( v, i ) => i === stateKey ? emptyValue : v )
						: { ...state[ sliceKey ], [ stateKey ]: emptyValue }
				)
			});
		} );
	} );
} );

describe( '$delete(...)', () => {
	let _state;
	beforeEach(() => { _state = createSourceData() })
	test( 'removes all listed properties residing at the provided stateKey = \'state\'', () => {
		const newState = { state: _state };
		const removedKeys = [ '_id', 'address', 'friends', 'picture' ];
		tag.$delete( newState, 'state', statsStub, { state: { [ DELETE_TAG ]: removedKeys } } )
		expect( removedKeys.every( k => !( k in newState.state ) ) ).toBe( true );
	} );
	test( 'ignores invocations on an empty state slice', () => {
		const stats = { hasChanges: false };
		_state.name = {};
		tag.$delete( _state, 'name', statsStub, { name: { [ DELETE_TAG ]: [ 'suffix' ] } } );
		expect( _state ).toEqual({ ...state, name: {} });
		expect( stats.hasChanges ).toBe( false );
	} );
	test( 'ignores invocations on non-existent state slices', () => {
		const stats = { hasChanges: false };
		tag.$delete( _state, 'test', statsStub, { test: { [ DELETE_TAG ]: [ 'suffix' ] } } );
		expect( _state ).toEqual( state );
		expect( stats.hasChanges ).toBe( false );
	} );
	test( 'ignores listed properties not present in state slice', () => {
		const stats = { hasChanges: false };
		tag.$delete( _state, 'name', statsStub, { name: { [ DELETE_TAG ]: [ 'suffix' ] } } );
		expect( _state ).toEqual( state );
		expect( stats.hasChanges ).toBe( false );
	} );
	test( 'ignores empty argument array', () => {
		const stats = { hasChanges: false };
		tag.$delete( _state, 'name', statsStub, {
			name: { [ DELETE_TAG ]: [] }
		} );
		expect( _state ).toEqual( state );
		expect( stats.hasChanges ).toBe( false );
	} );
	test( 'throws `TypeError` with non-array argument', () => {
		expect(() => tag.$delete(
			createSourceData(),
			'company', statsStub,
			// @ts-expect-error
			{ company: { [ DELETE_TAG ]: expect.anything() } }
		) ).toThrow( TypeError );
	} );
	describe( 'indexing', () => {
		let expected;
		beforeAll(() => { expected = { ...state, tags: [ 4, 5 ].map( i => state.tags[ i ] ) } })
		test( 'removes all listed array indexes residing at the provided array state property named \'tags\'', () => {
			tag.$delete( _state, 'tags', statsStub, { tags: { [ DELETE_TAG ]: [ 0, 1, 2, 3, 6 ] } } )
			expect( _state ).toEqual( expected );
		} );
		test( 'removes identified items counting backwards', () => {
			tag.$delete( _state, 'tags', statsStub, { tags: { [ DELETE_TAG ]: [ -1, -4, -5, -6, -7 ] } } )
			expect( _state ).toEqual( expected );
		} );
		test( 'ignores invocations on empty array state slice', () => {
			const stats = { hasChanges: false };
			_state.tags = [];
			tag.$delete( _state, 'tags', statsStub, { tags: { [ DELETE_TAG ]: [ 0, 1, 2, 3, 6 ] } } );
			expect( _state ).toEqual({ ...state, tags: [] });
			expect( stats.hasChanges ).toBe( false );
		} );
		test( 'ignores indexes not present in state slice array', () => {
			const stats = { hasChanges: false };
			tag.$delete( _state, 'tags', statsStub, { tags: { [ DELETE_TAG ]: [ 101, 9, 30, 62 ] } } );
			expect( _state ).toEqual( state );
			expect( stats.hasChanges ).toBe( false );
		} );
		describe( 'contents at specific index', () => {
			let expected;
			beforeAll(() => {
				expected = { ...state, friends: [ { id: state.friends[ 0 ].id }, ...state.friends.slice( 1 ) ] };
			});
			test( 'removes properties at \'friends[0]\'', () => {
				tag.$delete( _state.friends, 0, statsStub, [{ [ DELETE_TAG ]: [ 'name' ] }] );
				expect( _state ).toEqual( expected );
			} );
			test( 'removes properties at \'friends[0]\' using indexed object update', () => {
				tag.$delete( _state.friends, 0, statsStub, { 0: { [ DELETE_TAG ]: [ 'name' ] } } )
				expect( _state ).toEqual( expected );
			} );
		} );
	} );
} );

describe( '$move(...)', () => {
	let _state, statsStub;
	beforeAll(() => { statsStub = { hasChanges: false } });
	beforeEach(() => {
		_state = createSourceData();
		statsStub.hasChanges = false;
	});
	test( 'moves x=3 items from index 2 to index 4 of the array state slice residing at stateKey = \'tags\'', () => {
		tag.$move( _state, 'tags', statsStub, { tags: { [ MOVE_TAG ]: [ 2, 4, 3 ] } } )
		expect( _state ).toEqual({ ...state, tags: [ 0, 1, 5, 6, 2, 3, 4 ].map( i => state.tags[ i ] ) });
		expect( statsStub.hasChanges ).toBe( true );
	} );
	test( 'moves only one item by default', () => {
		tag.$move( _state, 'tags', statsStub, { tags: { [ MOVE_TAG ]: [ 2, 4 ] } } )
		expect( _state ).toEqual({ ...state, tags: [ 0, 1, 3, 4, 2, 5, 6 ].map( i => state.tags[ i ] ) });
		expect( statsStub.hasChanges ).toBe( true );
	} );
	test( 'moves by counting when backward negative indexes supplied', () => {
		tag.$move( _state, 'tags', statsStub, { tags: { [ MOVE_TAG ]: [ -5, -3 ] } } )
		expect( _state ).toEqual({ ...state, tags: [ 0, 1, 3, 4, 2, 5, 6 ].map( i => state.tags[ i ] ) });
		expect( statsStub.hasChanges ).toBe( true );
	} );
	test( 'ignores the request where the updated state slice array is empty', () => {
		const testTags = [];
		_state.tags = testTags;
		tag.$move( _state, 'tags', statsStub, { tags: { [ MOVE_TAG ]: [ -5, -3 ] } } )
		expect( _state.tags ).toHaveLength( 0 );
		expect( _state.tags ).toBe( testTags );
		expect( statsStub.hasChanges ).toBe( false );
	} );
	test( 'ignores the request where the updated state slice is not an array', () => {
		const testTags = 'TEST_TAGS';
		_state.tags = testTags;
		tag.$move( _state, 'tags', statsStub, { tags: { [ MOVE_TAG ]: [ -5, -3 ] } } )
		expect( _state.tags ).toBe( testTags );
		expect( statsStub.hasChanges ).toBe( false );
	} );
	test( 'ignores the request where number of items to move < 1', () => {
		tag.$move( _state, 'tags', statsStub, { tags: { [ MOVE_TAG ]: [ -5, -3, 0 ] } } );
		expect( _state ).toStrictEqual( state );
		expect( statsStub.hasChanges ).toBe( false );
		tag.$move( _state, 'tags', statsStub, { tags: { [ MOVE_TAG ]: [ -5, -3, -3 ] } } );
		expect( _state ).toStrictEqual( state );
		expect( statsStub.hasChanges ).toBe( false );
	} );
	test( 'ignores the request where number of items to move is non-integer', () => {
		tag.$move( _state, 'tags', statsStub, { tags: { [ MOVE_TAG ]: [ -5, -3, 1.434 ] } } );
		expect( _state ).toStrictEqual( state );
		expect( statsStub.hasChanges ).toBe( false );
		tag.$move( _state, 'tags', statsStub, {
			tags: {
				[ MOVE_TAG ]: [ -5, -3, expect.any( String ) ]
			}
		} );
		expect( _state ).toStrictEqual( state );
		expect( statsStub.hasChanges ).toBe( false );
	} );
	test( 'ignores the request where any of the indexes supplied is out of the bounds', () => {
		[[ 15, 10 ], [ 15, 2 ], [ 2, 10 ], [ -15, -10 ], [ -15, 2 ], [ 2, -10 ], [ -15, -2 ], [ -2, -10 ]]
			.forEach( moveArgs => {
				tag.$move( _state, 'tags', statsStub, { tags: { [ MOVE_TAG ]: moveArgs } } );
				expect( _state ).toStrictEqual( state );
				expect( statsStub.hasChanges ).toBe( false );
			} );
	} );
	test( 'ignores the request where both move index value point at the same element', () => {
		tag.$move( _state, 'tags', statsStub, { tags: { [ MOVE_TAG ]: [ -3, 4 ] } } );
		expect( _state ).toStrictEqual( state );
		expect( statsStub.hasChanges ).toBe( false );
	} );
	test( 'ignores the request where the state slice is not an array', () => {
		const testTags = 'TEST_TAGS';
		_state.tags = testTags;
		tag.$move( _state, 'tags', statsStub, { tags: { [ MOVE_TAG ]: [ -5, -3 ] } } );
		expect( _state.tags ).toBe( testTags );
		expect( statsStub.hasChanges ).toBe( false );
	} );
	describe( 'mandatory argument validation', () => {
		test.each([
			[ 'non-array argument', expect.anything() ],
			[ 'argument array length < 2', [ 1 ] ],
			[ 'non-integer first value in argument array argument', [ true, 3 ] ],
			[ 'non-integer second value in argument array argument', [ 1, '3' ] ]
		])( 'throws TypeError on encountering %s', ( description, testValue ) => {
			expect(() => tag.$move( _state.friends, 0, statsStub, {
				0: { [ MOVE_TAG ]: testValue }
			} )).toThrow( TypeError );
			expect( statsStub.hasChanges ).toBe( false );
		} );
	} );
} );

describe( '$push(...)', () => {
	let _state, statsStub;
	beforeAll(() => { statsStub = { hasChanges: false } });
	beforeEach(() => {
		_state = createSourceData();
		statsStub.hasChanges = false;
	});
	test( 'appends new items to the array state slice residing at stateKey = \'tags\'', () => {
		tag.$push( _state, 'tags', statsStub, { tags: { [ PUSH_TAG ]: [ 2, 4, 3 ] } } );
		expect( _state ).toEqual({ ...state, tags: [ ...state.tags, 2, 4, 3 ] });
		expect( statsStub.hasChanges ).toBe( true );
	} );
	test( 'throws TypeError at non-array argument', () => {
		expect(() => tag.$push( _state, 'tags', statsStub, {
			tags: { [ PUSH_TAG ]: expect.anything() }
		} )).toThrow( TypeError );
		expect( statsStub.hasChanges ).toBe( false );
	} );
	test( 'ignores the request where array argument is empty', () => {
		tag.$push( _state, 'tags', statsStub, { tags: { [ PUSH_TAG ]: [] } } );
		expect( _state ).toStrictEqual( state );
		expect( statsStub.hasChanges ).toBe( false );
	} );
	test( 'ignores the request where the state slice is not an array', () => {
		const testTags = 'TEST_TAGS';
		_state.tags = testTags;
		tag.$push( _state, 'tags', statsStub, { tags: { [ PUSH_TAG ]: [ 2, 4, 3 ] } } );
		expect( _state.tags ).toBe( testTags );
		expect( statsStub.hasChanges ).toBe( false );
	} );
} );

describe( '$replace(...)', () => {
	let newValue, _state1, _state2;
	beforeAll(() => { newValue = 'TEST_VALUE' });
	beforeEach(() => {
		_state1 = createSourceData();
		_state2 = createSourceData();
	});
	describe( 'is an alias to the $set(with non-compute-function value) ', () => {
		test( 'replaces state property with new value', () => {
			tag.$replace( _state1, 'history', statsStub, { history: { [ REPLACE_TAG ]: newValue } } );
			tag.$set( _state2, 'history', statsStub, { history: { [ SET_TAG ]: newValue } } );
			expect( _state1 ).toEqual( _state2 );
		} );
		test( 'replaces array element via indexed object update', () => {
			tag.$replace( _state1.history, 'places', statsStub, { places: { 1: { [ REPLACE_TAG ]: newValue } } } );
			tag.$set( _state2.history, 'places', statsStub, { places: { 1: { [ SET_TAG ]: newValue } } } );
			expect( _state1 ).toEqual( _state2 );
		} );
	} );
} );

describe( '$set(...)', () => {
	let newValue, _state;
	beforeAll(() => { newValue = 'TEST_VALUE' });
	beforeEach(() => { _state = createSourceData() });
	test( 'sets state property with new value', () => {
		tag.$set( _state, 'history', statsStub, { history: { [ SET_TAG ]: newValue } } );
		expect( _state ).toEqual({ ...state, history: newValue })
	} );
	describe( 'at an index', () => {
		let expected;
		beforeAll(() => {
			expected = {
				...state,
				history: {
					...state.history,
					places: [
						state.history.places[ 0 ],
						newValue,
						state.history.places[ 2 ]
					]
				}
			};
		});
		test( 'sets array element', () => {
			tag.$set( _state.history.places, 1, statsStub, [ state.history.places[ 0 ], { [ SET_TAG ]: newValue } ] );
			expect( _state ).toEqual( expected );
		} );
		test( 'sets array element via indexed object update', () => {
			tag.$set( _state.history.places, 1, statsStub, { 1: { [ SET_TAG ]: newValue } } );
			expect( _state ).toEqual( expected );
		} );
		test( 'ignores state slice updates with identical values', () => {
			tag.$set( _state, 'company', statsStub, { company: { [ SET_TAG ]: state.company } } );
			expect( _state ).toEqual( state );
			tag.$set( _state, 'friends', statsStub, { friends: { [ SET_TAG ]: state.friends } } );
			expect( _state ).toEqual( state );
		} );
	} );
	describe( 'with computed values', () => {
		let computeFn, newState, prevHistory;
		beforeAll(() => {
			newState = _state;
			prevHistory = newState.history;
			computeFn = jest.fn().mockReturnValue( newValue );
			tag.$set( newState, 'history', statsStub, { history: { [ SET_TAG ]: computeFn } } );
		});
		test( 'calls compute function with a copy of the current state slice value', () => {
			const prevHistoryArg = computeFn.mock.calls[ 0 ][ 0 ];
			expect( prevHistoryArg ).not.toBe( prevHistory );
			expect( prevHistoryArg ).toStrictEqual( prevHistory );
			expect( prevHistoryArg ).toEqual( prevHistory );
		} );
		test( 'sets top level state properties with compute function return value', () => {
			expect( newState ).toEqual({ ...state, history: newValue })
		} );
	} );
} );

describe( '$splice(...)', () => {
	let _state, statsStub;
	beforeAll(() => { statsStub = { hasChanges: false } });
	beforeEach(() => {
		_state = createSourceData();
		statsStub.hasChanges = false;
	});
	test( 'replaces 3 items starting from index 3 with new items \'y\' and  \'z\'', () => {
		tag.$splice( _state, 'tags', statsStub, { tags: { [ SPLICE_TAG ]: [ 3, 3, 'y', 'z' ] } } )
		expect( _state ).toEqual({
			...state,
			tags: [ 0, 1, 2, 'y', 'z', 6 ].map(
				i => !Number.isInteger( i ) ? i : state.tags[ i ]
			)
		});
		expect( statsStub.hasChanges ).toBe( true );
	} );
	test( 'removes 3 items starting from index -5 counting backwards', () => {
		tag.$splice( _state, 'tags', statsStub, { tags: { [ SPLICE_TAG ]: [ -5, 3 ] } } )
		expect( _state ).toEqual({ ...state, tags: [ 0, 1, 5, 6 ].map( i => state.tags[ i ] ) });
		expect( statsStub.hasChanges ).toBe( true );
	} );
	test( 'ignores the request where the updated state slice is not an array', () => {
		const testTags = 'TEST_TAGS';
		_state.tags = testTags;
		tag.$splice( _state, 'tags', statsStub, { tags: { [ SPLICE_TAG ]: [ -5, 3 ] } } );
		expect( _state.tags ).toBe( testTags );
		expect( statsStub.hasChanges ).toBe( false );
	} );
	test( 'ignores the request where deleteCount < 1 with no new items to insert', () => {
		const testTags = [];
		_state.tags = testTags;
		tag.$splice( _state, 'tags', statsStub, { tags: { [ SPLICE_TAG ]: [ -5, 0 ] } } );
		expect( _state.tags ).toHaveLength( 0 );
		expect( _state.tags ).toBe( testTags );
		expect( statsStub.hasChanges ).toBe( false );
	} );
	test( 'ignores requests where new items match delete candidates', () => {
		tag.$splice( _state, 'tags', statsStub, {
			tags: {
				[ SPLICE_TAG ]: [ 1, 3, ..._state.tags.slice( 1, 4 ) ]
			}
		} );
		expect( _state ).toStrictEqual( state );
		expect( statsStub.hasChanges ).toBe( false );
	} );
	test( 'skips first N contiguous delete candidates matching first N new items', () => {
		const newItems = [ 'new item #1', 'new item #2' ];
		tag.$splice( _state, 'tags', statsStub, {
			tags: {
				[ SPLICE_TAG ]: [ 1, 3, ...[ 1, 2 ].map( i => _state.tags[ i ] ), ...newItems ]
			}
		} );
		expect( _state ).toEqual({
			...state,
			tags: [
				...[ 0, 1, 2 ].map( i => state.tags[ i ] ),
				...newItems,
				...state.tags.slice( 4 )
			]
		});
		expect( statsStub.hasChanges ).toBe( true );
	} );
	describe( 'start value', () => {
		let newItem;
		beforeAll(() => { newItem = 'new item' });
		test( 'becomes array length when start index argument > array length', () => {
			tag.$splice( _state, 'tags', statsStub, { tags: { [ SPLICE_TAG ]: [ 100, 1, newItem ] } } );
			expect( _state.tags ).toStrictEqual([ ...state.tags, newItem ]);
		} );
		test( 'becomes 0 when negative start index argument resolves to be out of bounds', () => {
			tag.$splice( _state, 'tags', statsStub, { tags: { [ SPLICE_TAG ]: [ -100, 1, newItem ] } } );
			expect( _state.tags ).toStrictEqual([ newItem, ...state.tags.slice( 1 ) ]);
		} );
	} );
	describe( 'mandatory argument validation', () => {
		test.each([
			[ 'non-array argument', expect.anything() ],
			[ 'argument array length < 2', [ 1 ] ],
			[ 'non-integer first value in argument array argument', [ true, 3 ] ],
			[ 'non-integer second value in argument array argument', [ 1, '3' ] ]
		])( 'throws TypeError on encountering %s', ( description, testValue ) => {
			expect(() => tag.$splice( _state.friends, 0, statsStub, {
				0: { [ SPLICE_TAG ]: testValue }
			} )).toThrow( TypeError );
			expect( statsStub.hasChanges ).toBe( false );
		} );
	} );
} );

describe( 'isArrayOnlyTag(...)', () => {
	test( 'returns true if argument found in ARRAY_TAG map', () => {
		expect( tag.isArrayOnlyTag( PUSH_TAG ) ).toBe( true );
	} );
	test( 'returns false if argument not found in ARRAY_TAG map', () => {
		expect( tag.isArrayOnlyTag( expect.anything() ) ).toBe( false );
	} );
} );

describe( 'isClosedTag(...)', () => {
	test( 'returns true if argument found in NO_PARAM_TAG map', () => {
		expect( tag.isClosedTag( CLEAR_TAG ) ).toBe( true );
	} );
	test( 'returns false if argument not found in NO_PARAM_TAG map', () => {
		expect( tag.isClosedTag( expect.anything() ) ).toBe( false );
	} );
} );
