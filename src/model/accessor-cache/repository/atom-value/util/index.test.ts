import {
	describe,
	expect,
	test
} from '@jest/globals';

import '../../../../../test-artifacts/suppress-render-compat';

import { isAPrefixOfB } from './util';

/* @debug */
// "(\w+)": --- $1:
// Any<(\w+)> --- expect.any( $1 ) //
// console.info( onChangeMock.mock.calls[ 0 ] );
describe( '1xxxx', () => {
// describe( 'AtomValue util module', () => {
	test( 'rejects different series of equal lengths', () => {
		expect( isAPrefixOfB(
			[ 'a', 'b', 'c' ],
			[ 'a', 'c', 'v' ]
		) ).toBe( false );
	} );
	test( 'accepts two equal series', () => {
		expect( isAPrefixOfB(
			[ 'a', 'b', 'c' ],
			[ 'a', 'b', 'c' ]
		) ).toBe( true );
		expect( isAPrefixOfB(
			[],
			[]
		) ).toBe( true );
	} );
	test( 'accepts series A containing the first N shorter subsequence of series B', () => {
		expect( isAPrefixOfB(
			[],
			[ 'a', 'b', 'c', 'd', 'e','f' ]
		) ).toBe( true );
		expect( isAPrefixOfB(
			[ 'a', 'b', 'c' ],
			[ 'a', 'b', 'c', 'd', 'e','f' ]
		) ).toBe( true );
	} );
	test( 'rejects series A containing non first N shorter subsequence of series B', () => {
		expect( isAPrefixOfB(
			[ 'c', 'd', 'e' ],
			[ 'a', 'b', 'c', 'd', 'e','f' ]
		) ).toBe( false );
		expect( isAPrefixOfB(
			[ 'a', 'y', 'c' ],
			[ 'a', 'b', 'c', 'd', 'e','f' ]
		) ).toBe( false );
	} );
	test( 'rejects series A containing the entire series B and more', () => {
		expect( isAPrefixOfB(
			[ 'a', 'b', 'c', 'd', 'e','f' ],
			[]
		) ).toBe( false );
		expect( isAPrefixOfB(
			[ 'a', 'b', 'c', 'd', 'e','f' ],
			[ 'a', 'b', 'c' ]
		) ).toBe( false );
	} );
} );
