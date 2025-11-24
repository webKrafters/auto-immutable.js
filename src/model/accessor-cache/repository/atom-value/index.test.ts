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
		pathRepo = { getPathTokensAt: jest.fn(() => 1) } as unknown as PathRepository;
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
			let insertAtomSpy : jest.SpyInstance<any, [number, PathRepository, {}], any>;
			beforeAll(() => {
				insertAtomSpy = jest.spyOn( AtomNode.prototype, 'insertAtomAt' ).mockImplementation();
			});
			beforeEach(() => { insertAtomSpy.mockClear() });
			afterAll(() => { insertAtomSpy.mockRestore() });
			test( 'registers atom at node referenced by tokenized path `id`', () => {
				atomValue.addDataForAtomAt( 1 );
				expect( insertAtomSpy ).toHaveBeenCalledWith( 1, pathRepo, sourceData );
			} );
		} );
		describe( 'getAtomAt(...)', () => {
			let findActiveNodeSpy :  jest.SpyInstance<AtomNode<any>|null, [Array<string>], any>;
			beforeAll(() => {
				findActiveNodeSpy = jest.spyOn( AtomNode.prototype, 'findActiveNodeAt' ).mockImplementation();
			});
			beforeEach(() => { findActiveNodeSpy.mockClear() });
			afterAll(() => { findActiveNodeSpy.mockRestore() });
			test( 'searches for a node holding an atom at tokenized path id', () => {
				atomValue.getAtomAt( 1 );
				expect( findActiveNodeSpy ).toHaveBeenCalledWith( 1 );
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
			test( 'searches and returns the value at node holding an atom at tokenized path `id`', () => {
				atomValue.getValueAt( 1 );
				expect( findActiveNodeSpy ).toHaveBeenCalledWith( 1 );
				expect( valueGetterSpy ).toHaveBeenCalledTimes( 1 );
			} );
		} );
		describe( 'mergeChanges(...)', () => {
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
					source, paths as Array<Array<string>>
				);
				expect( setValueAtSpy ).toHaveBeenCalledTimes( paths.length );
				const eMap = paths.reduce(( r, p ) => {
					r[ p.join( '.' ) ] = get( source, p )._value;
					return r;
			 	}, {} as Record<string, unknown>);
				for( const [ path, value ] of setValueAtSpy.mock.calls ) {
					const dotPath = path.join( '.' );
					expect( dotPath in eMap ).toBe( true );
					expect( value ).toEqual( eMap[ dotPath ] );
				}
				setValueAtSpy.mockRestore();
			} );
		} );
	} );
} );
