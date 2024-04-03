import verify from './clonedeep-eligibility-check';

describe( 'verify(...)', () => {
	test( 'is positive for values with known types', () => {
		const value = 8;
		expect( verify( value ) ).toEqual({
			isEligible: true,
			typeName: 'Number',
			value
		});
	} );
	test( 'is positive for null', () => {
		const value = null;
		expect( verify( value ) ).toEqual({
			isEligible: true,
			typeName: 'null',
			value
		});
	} );
	test( 'is positive for undefined', () => {
		const value = undefined;
		expect( verify( value ) ).toEqual({
			isEligible: true,
			typeName: 'undefined',
			value
		});
	} );
	test( 'is negative for values with unknown types', () => {
		class Test {}
		const value = new Test();
		expect( verify( value ) ).toEqual({
			isEligible: false,
			typeName: 'Test',
			value
		});
	} );
} );
