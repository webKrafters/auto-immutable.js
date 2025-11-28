import {
	describe,
	expect,
	test
} from '@jest/globals';

import Atom from '.';

describe( 'Atom class', () => {
	describe( 'connect(...)', () => {
		test( 'adds new connections and returns number of connections remaining', () => {
			const atom = new Atom();
			expect( atom.connect( 32 ) ).toBe( 1 );
			expect( atom.connect( 36 ) ).toBe( 2 );
			expect( atom.connect( 40 ) ).toBe( 3 );
		} );
		test( 'ignores attempts to add existing connections', () => {
			const atom = new Atom();
			expect( atom.connect( 32 ) ).toBe( 1 );
			expect( atom.connect( 36 ) ).toBe( 2 );
			expect( atom.connect( 40 ) ).toBe( 3 );
			expect( atom.connect( 36 ) ).toBe( 3 ); // => no increment for attempt to re-add 36
			expect( atom.connect( 30 ) ).toBe( 4 );
			expect( atom.connect( 32 ) ).toBe( 4 ); // => no increment for attempt to re-add 32 
		} );
	} );
	describe( 'disconnect(...)', () => {
		test( 'removes existing connections and returns number of connections remaining', () => {
			const atom = new Atom();
			expect( atom.connect( 32 ) ).toBe( 1 );
			expect( atom.connect( 36 ) ).toBe( 2 );
			expect( atom.connect( 40 ) ).toBe( 3 );
			expect( atom.disconnect( 36 ) ).toBe( 2 );
			expect( atom.disconnect( 32 ) ).toBe( 1 );
			expect( atom.disconnect( 40 ) ).toBe( 0 );
		} );
		test( 'ignores attempts to remove non-existing connections', () => {
			const atom = new Atom();
			expect( atom.connect( 32 ) ).toBe( 1 );
			expect( atom.connect( 36 ) ).toBe( 2 );
			expect( atom.connect( 40 ) ).toBe( 3 );
			expect( atom.disconnect( 55 ) ).toBe( 3 ); // => no decrement for attempt to remove 55
			expect( atom.disconnect( 36 ) ).toBe( 2 );
			expect( atom.disconnect( 40 ) ).toBe( 1 );
			expect( atom.disconnect( 36 ) ).toBe( 1 ); // => no decrement for attempt to remove 36 again 
		} );
	} );
} );
