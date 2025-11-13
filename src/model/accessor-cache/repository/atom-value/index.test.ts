import {
	beforeAll,
	describe,
	expect,
	test
} from '@jest/globals';

import createSourceData from '../../../../test-artifacts/data/create-data-obj';
import PathRepository from '../paths';
import AtomValue from '.';

type SourceData = ReturnType<typeof createSourceData>;

/* @debug */
// "(\w+)": --- $1:
// Any<(\w+)> --- expect.any( $1 ) //
// console.info( onChangeMock.mock.calls[ 0 ] );
describe( '1xxxx', () => {
// describe( 'AtomValue class', () => {
	let sourceData : SourceData;
	let atomValue : AtomValue<SourceData>;
	let pathRepo : PathRepository;
	beforeAll(() => {
		sourceData = createSourceData();
		pathRepo = new PathRepository();
		atomValue = new AtomValue<SourceData>( sourceData, pathRepo );
	});
	test( 'creates an atom', () => expect( atomValue ).toBeInstanceOf( AtomValue ) );
	describe( 'properties', () => {
		describe( 'origin', () => {

		} );
	} );
	describe( 'methods', () => {
		describe( 'addDataForAtomAt(...)', () => {
			test
		} );
		describe( 'getAtomAt(...)', () => {

		} );
		describe( 'mergeChanges(...)', () => {

		} );
	} );
});
