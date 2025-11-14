import {
	beforeAll,
	describe,
	expect,
	test
} from '@jest/globals';

import get from '@webkrafters/get-property';

import AtomNode from './node';
import AtomValue from '.';
import PathRepository from '../paths';

import createSourceData from '../../../../test-artifacts/data/create-data-obj';

/* @debug */
// "(\w+)": --- $1:
// Any<(\w+)> --- expect.any( $1 ) //
// console.info( onChangeMock.mock.calls[ 0 ] );
describe( '1xxxx', () => {
// describe( 'AtomValue class', () => {
	let sourceData : {};
	let atomValue : AtomValue<{}>;
	let pathRepo : PathRepository;
	beforeAll(() => {
		sourceData = {};
		pathRepo = {} as PathRepository;
		atomValue = new AtomValue<{}>( sourceData, pathRepo );
	});
	test( 'creates an atom', () => expect( atomValue ).toBeInstanceOf( AtomValue ) );
	describe( 'properties', () => {
		describe( 'origin', () => {
			test( 'produces the underlying data source', () => {
				expect( atomValue.origin ).toBe( sourceData );
			} );
		} );
	} );
	describe( 'methods', () => {
		let tokenizedPath : Array<string>;
		beforeAll(() => { tokenizedPath = [ 'a', 'b', 'c' ] });
		describe( 'addDataForAtomAt(...)', () => {
			let insertAtomSpy : jest.SpyInstance<any, [Array<string>, PathRepository, {}], any>;
			beforeAll(() => {
				insertAtomSpy = jest.spyOn( AtomNode.prototype, 'insertAtomAt' ).mockImplementation();
			});
			beforeEach(() => { insertAtomSpy.mockClear() });
			afterAll(() => { insertAtomSpy.mockRestore() });
			test( 'will register atom using tokenized path', () => {
				atomValue.addDataForAtomAt( tokenizedPath );
				expect( insertAtomSpy ).toHaveBeenCalledWith(
					tokenizedPath, pathRepo, sourceData
				);
			} );
			test( 'will register atom using a dot separated path string', () => {
				atomValue.addDataForAtomAt( tokenizedPath.join( '.' ) );
				expect( insertAtomSpy ).toHaveBeenCalledWith(
					tokenizedPath, pathRepo, sourceData
				);
			} );
		} );
		describe( 'getAtomAt(...)', () => {
			let findActiveNodeSpy :  jest.SpyInstance<AtomNode<any>|null, [Array<string>], any>;
			beforeAll(() => {
				findActiveNodeSpy = jest.spyOn( AtomNode.prototype, 'findActiveNodeAt' ).mockImplementation();
			});
			beforeEach(() => { findActiveNodeSpy.mockClear() });
			afterAll(() => { findActiveNodeSpy.mockRestore() });
			test( 'searches for a node holding an atom using tokenized path', () => {
				atomValue.getAtomAt( tokenizedPath );
				expect( findActiveNodeSpy ).toHaveBeenCalledWith( tokenizedPath );
			} );
			test( 'searches for a node holding an atom using a dot separated path string', () => {
				atomValue.getAtomAt( tokenizedPath.join( '.' ) );
				expect( findActiveNodeSpy ).toHaveBeenCalledWith( tokenizedPath );
			} );
		} );
		describe( 'getValueAt(...)', () => {
			let valueGetterSpy : jest.SpyInstance<Readonly<any>, [], any>;
			let findActiveNodeSpy :  jest.SpyInstance<AtomNode<any>|null, [Array<string>], any>;
			beforeAll(() => {
				valueGetterSpy = jest
					.spyOn( AtomNode.prototype, 'value', 'get' )
					.mockReturnValue( expect.anything() );
				findActiveNodeSpy = jest
					.spyOn( AtomNode.prototype, 'findActiveNodeAt' )
					.mockReturnValue( AtomNode.createRoot() );
			});
			beforeEach(() => {
				valueGetterSpy.mockClear();
				findActiveNodeSpy.mockClear();
			});
			afterAll(() => {
				valueGetterSpy.mockRestore();
				findActiveNodeSpy.mockRestore();
			});
			test( 'searches and returns the value at node holding an atom using tokenized path', () => {
				atomValue.getValueAt( tokenizedPath );
				expect( findActiveNodeSpy ).toHaveBeenCalledWith( tokenizedPath );
				expect( valueGetterSpy ).toHaveBeenCalledTimes( 1 );
			} );
			test( 'searches and returns the value at node holding an atom using a dot separated path string', () => {
				atomValue.getValueAt( tokenizedPath.join( '.' ) );
				expect( findActiveNodeSpy ).toHaveBeenCalledWith( tokenizedPath );
				expect( valueGetterSpy ).toHaveBeenCalledTimes( 1 );
			} );
		} );
		describe( '1xxxxa', () => {
		// describe( 'mergeChanges(...)', () => {
			test( 'merges slices matching paths into atom values', () => {
				const setValueAtSpy = jest
					.spyOn( AtomNode.prototype, 'setValueAt' )
					.mockImplementation();
				const source = createSourceData();
				const paths = [
					[ 'isActive' ],
					[ 'friends', 0, 'name', 'first' ],
					[ 'tags', 4 ],
					[ 'registered', 'time', 'minutes' ]
				];
				new AtomValue( source, pathRepo ).mergeChanges(
					source, paths as Readonly<Array<Arsray<string>>>
				);
				expect( setValueAtSpy ).toHaveBeenCalledTimes( paths.length );
				for( let p = 0; p < paths.length; p++ ) {
					expect( setValueAtSpy.mock.calls[ p ] ).toEqual([
						paths[ p ],
						get( source, paths[ p ] )._value
					]);
				}
				setValueAtSpy.mockRestore();
			} );
		} );
	} );
} );
