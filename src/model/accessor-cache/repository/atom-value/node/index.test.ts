import {
	beforeAll,
	describe,
	expect,
	test
} from '@jest/globals';

import createSourceData from '../../../../../test-artifacts/data/create-data-obj';
import PathRepository from '../../paths';
import AtomNode from '.';

type SourceData = ReturnType<typeof createSourceData>;

/* @debug */
// "(\w+)": --- $1:
// Any<(\w+)> --- expect.any( $1 ) //
// console.info( onChangeMock.mock.calls[ 0 ] );
describe( '1xxxx', () => {
// describe( 'AtomNode class', () => {
	let sourceData : SourceData;
	let rootNode : AtomNode<SourceData>;
	let pathRepo : PathRepository;
	beforeAll(() => {
		sourceData = createSourceData();
		pathRepo = new PathRepository();
		rootNode = AtomNode.createRoot();
	});
	test( 'creates an atom', () => expect( rootNode ).toBeInstanceOf( AtomNode ) );
	describe( 'value property', () => {
		test( 'is `undefined` by default', () => expect( rootNode.value ).toBeUndefined() );
		test( 'is readonly', () => expect( Object.isFrozen( rootNode.value ) ).toBe( true ) );
		test( 'sets value by its clone except functions', () => {
			const data = { testFlag: true } as unknown as SourceData;
			rootNode.value = data;
			expect( rootNode.value ).not.toBe( data );
			expect( rootNode.value ).toStrictEqual( data );
			const func = (() => {}) as unknown as SourceData;
			rootNode.value = func;
			expect( rootNode.value ).toBe( func );
		} );
		test( 'converts all assignments to readonly', () => {
			type Data = SourceData & { testFlag: boolean };
			const rootNode = AtomNode.createRoot() as AtomNode<Data>;
			rootNode.value = { testFlag: true } as Data;
			expect(() => {
				rootNode.setValueAt([ 'testFlag' ], false as unknown as Data );
			}).toThrow(
				"Cannot assign to read only property 'testFlag' of object '#<Object>'"
			);
			rootNode.value = ({ a: { b: { c: [ 1, 2, 3, { testFlag: true } ] } } }) as unknown as Data;
			expect(() => {
				rootNode.setValueAt(
					[ 'a', 'b', 'c', '1' ],
					expect.anything() as unknown as Readonly<Data>
				)
			}).toThrow(
				"Cannot assign to read only property '1' of object '[object Array]'"
			);
			expect(() => {
				rootNode.setValueAt(
					[ 'a', 'b', 'c', '3' ],
					expect.anything() as unknown as Readonly<Data>
				)
			}).toThrow(
				"Cannot assign to read only property '3' of object '[object Array]'"
			);
			expect(() => {
				rootNode.setValueAt(
					[ 'a', 'b' ],
					expect.anything() as unknown as Readonly<Data>
				)
			}).toThrow(
				"Cannot assign to read only property 'b' of object '#<Object>'"
			);
		} );
	});
	describe( 'connect(...)', () => {
		test( 'returns number of connections after connecting a new cache entry descriptor', () => {
			let numConnections = rootNode.addAccessor( 22 );
			expect( rootNode.addAccessor( 24 ) ).toBe( ++numConnections );
		} );
		test( 'ignores attempts to reconnect a connected cache entry descriptor', () => {
			let numConnections = rootNode.addAccessor( 20 );
			expect( rootNode.addAccessor( 28 ) ).toBe( ++numConnections );
			expect( rootNode.addAccessor( 20 ) ).toBe( numConnections ); // no increase in number of connections
		} );
	} );
	describe( 'disconnect(...)', () => {
		test( 'returns number of remaining connections after removing a connection', () => {
			let numConnections = rootNode.addAccessor( 22 );
			expect( rootNode.removeAccessor( 22 ) ).toBe( --numConnections );
		} );
		test( 'ignores attempts to disconnect a non-connected cache entry descriptor', () => {
			let numConnections = rootNode.addAccessor( 20 );
			expect( rootNode.addAccessor( 55 ) ).toBe( ++numConnections );
			expect( rootNode.removeAccessor( 20 ) ).toBe( --numConnections );
			expect( rootNode.removeAccessor( 20 ) ).toBe( numConnections ); // no decrease in number of connections
		} );
	} );
	describe( 'observer connection check', () => {
		test( 'can remove a connected cache entry descriptor', () => {
			const disconnectSpy = jest.spyOn( AtomNode.prototype, 'removeAccessor' );
			expect( disconnectSpy ).not.toHaveBeenCalled();
			rootNode.addAccessor( 22 );
			expect( disconnectSpy ).not.toHaveBeenCalled();
			rootNode.removeAccessor( 22 );
			expect( disconnectSpy ).toHaveBeenCalledWith( 22 );
			disconnectSpy.mockRestore();
		} );
		test( 'cannot remove a non-connected cache entry descriptor', () => {
			rootNode.addAccessor( 20 );
			const disconnectSpy = jest.spyOn( AtomNode.prototype, 'removeAccessor' );
			rootNode.removeAccessor( 20 );
			expect( disconnectSpy ).toHaveBeenCalledWith( 20 );
			disconnectSpy.mockClear();
			rootNode.removeAccessor( 20 );
			expect( disconnectSpy ).not.toHaveBeenCalled();
			disconnectSpy.mockRestore();
		} );
	} );
});

