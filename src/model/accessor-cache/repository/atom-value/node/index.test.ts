import {
	beforeAll,
	describe,
	expect,
	test
} from '@jest/globals';

import createSourceData from '../../../../../test-artifacts/data/create-data-obj';

import PathRepository from '../../paths';
import Atom from '../../../../atom';
import AtomNode from '.';
import { GLOBAL_SELECTOR } from '../../../../../constants';

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
	test( 'creates an atom node', () => expect( rootNode ).toBeInstanceOf( AtomNode ) );
	test( 'root node has a default global path  and key', () => {
		const globalPathTokens = [ GLOBAL_SELECTOR ];
		expect( rootNode.key ).toBe( globalPathTokens[ 0 ] );
		expect( rootNode.fullPath ).toEqual( globalPathTokens );
 	} );
	describe( 'properties', () => {
		describe( 'branches', () => {
			test( '', () => {

			} );
		} );
		describe( 'fullPath', () => {
			test( '', () => {

			} );
		} );
		describe( 'isActive', () => {
			test( '', () => {

			} );
		} );
		describe( 'isLeaf', () => {
			test( '', () => {

			} );
		} );
		describe( 'isRoot', () => {
			test( '', () => {

			} );
		} );
		describe( 'isRootAtom', () => {
			test( '', () => {

			} );
		} );
		describe( 'key', () => {
			test( '', () => {

			} );
		} );
		describe( 'rootAtomNode', () => {
			test( '', () => {

			} );
		} );
		describe( 'value', () => {
			test( '', () => {

			} );
		} );
	} );
	describe( 'methods', () => {
		function getArtifact() {
			const a = {
				activeNode: null as unknown as AtomNode<{}>,
				activePathTokens: [ 'a', 'b', 'c', 'd', 'e', 'f' ],
				activePathRepo: null as unknown as PathRepository,
				activeRoot: null as unknown as AtomNode<{}>
			};
			beforeAll(() => {
				a.activeRoot = AtomNode.createRoot();
				a.activePathRepo = new PathRepository();
				a.activePathRepo.getPathInfoAt( a.activePathTokens.join( '.' ) );
				a.activeRoot.insertAtomAt( a.activePathTokens, a.activePathRepo, {} );
				a.activeNode = a.activeRoot.findActiveNodeAt( a.activePathTokens )!;
			});
			return a;
		}
		describe( 'addAccessor(...)', () => {
			const a = getArtifact();
			test( 'can only be used on an active node', () => {
				expect( rootNode.isActive ).toBe( false );
				expect(() => { rootNode.addAccessor( 1 ) }).toThrow(
					'applicable only to nodes containing atoms: assert via a `this.isActive` check.'
				);
				expect( a.activeNode.isActive ).toBe( true );
				expect(() => { a.activeNode.addAccessor( 1 ) }).not.toThrow();
			} );
			test( 'returns number of connections after connecting a new cache entry descriptor', () => {
				let numConnections = a.activeNode.addAccessor( 22 );
				expect( a.activeNode.addAccessor( 24 ) ).toBe( ++numConnections );
			} );
			test( 'ignores attempts to reconnect a connected cache entry descriptor', () => {
				let numConnections = a.activeNode.addAccessor( 20 );
				expect( a.activeNode.addAccessor( 28 ) ).toBe( ++numConnections );
				expect( a.activeNode.addAccessor( 20 ) ).toBe( numConnections ); // no increase in number of connections
			} );
		} );
		describe( 'findActiveNodeAt(...)', () => {
			const a = getArtifact();
			test( 'returns null if path not found in the tree', () => {
				expect( rootNode.findActiveNodeAt( a.activePathTokens ) ).toBeNull();
			} );
			test( 'returns null if path in the tree but has no atom', () => {
				expect( a.activeNode.findActiveNodeAt( a.activePathTokens.slice( 0, -1 ) ) ).toBeNull();
			} );
			test( 'returns node if path in the tree but has an atom', () => {
				expect( a.activeNode.findActiveNodeAt( a.activePathTokens ) ).toBeInstanceOf( AtomNode );
			} );
			test( 'returns rootNode if path in the tree but has an atom', () => {
				expect( a.activeRoot.isActive ).toBe( false );
				a.activeNode.insertAtomAt([ GLOBAL_SELECTOR ], a.activePathRepo, {});
				expect( a.activeRoot.isActive ).toBe( true );
				const rootAtom = a.activeRoot.findActiveNodeAt([ GLOBAL_SELECTOR ]);
				expect( rootAtom ).toBeInstanceOf( AtomNode );
				expect( rootAtom ).toBe( a.activeRoot );
			} );
		} );
		describe( '1xxxxa', () => {
		// describe( 'insertAtomAt(...)', () => {
			const a = getArtifact();
			test( 'inserts at the leaf node', () => {
				expect( a.activeNode.isLeaf ).toBe( true );
			} );
			test( 'automatically inserts inactive nodes to connect active ones', () => {
				let node = a.activeRoot;
				a.activeNode.fullPath.forEach(( key, index, { length } ) => {
					node = node.branches[ key ];
					expect( node.isActive ).toBe( index === ( length - 1 ) );
				} );
			} );
			describe( 'inserting atoms into connective nodes', () => {
				let _a = getArtifact();
				test( 'converts an inactive parent node into an active one', () => {
					const parentPath = _a.activePathTokens.slice( 0, -1 );
					expect( _a.activeNode.isActive ).toBe( true );
					let parentNode = _a.activeNode.findActiveNodeAt( parentPath );
					expect( parentNode ).toBeNull();
					_a.activePathRepo.getPathInfoAt( parentPath.join( '.' ) );
					_a.activeNode.insertAtomAt( parentPath, _a.activePathRepo, {} );
					parentNode = _a.activeNode.findActiveNodeAt( parentPath )!;
					expect( parentNode.isActive ).toBe( true );
					expect( parentNode.branches[ _a.activeNode.key ] ).toBe( _a.activeNode );
				} );
				test( 'converts any inactive node into an active node', () => {
					const nodePathLen = 2;
					const nodePath = _a.activePathTokens.slice( 0, nodePathLen );
					// confirm that node at this path is an isolated connective ancestor node.
					{
						let node = _a.activeRoot;
						nodePath.forEach( key => {
							node = node.branches[ key ];
							expect( node.isActive ).toBe( false );
						} );
						node = node.branches[ _a.activePathTokens[ nodePathLen ] ];
						expect( node.isActive ).toBe( false );
						node = node.branches[ _a.activePathTokens[ nodePathLen + 1 ] ];
						expect( node.isActive ).toBe( false );
					}
					// add the atom to the 3rd connective node
					_a.activePathRepo.getPathInfoAt( nodePath.join( '.' ) );
					_a.activeRoot.insertAtomAt( nodePath, _a.activePathRepo, {} );
					// confirm that node at this path is now an isolated but active ancestor node.
					{
						let node = _a.activeRoot;
						nodePath.forEach(( key, index, { length } ) => {
							node = node.branches[ key ];
							expect( node.isActive ).toBe( index === ( length - 1 ) );
						} );
						node = node.branches[ _a.activePathTokens[ nodePathLen ] ];
						expect( node.isActive ).toBe( false );
						node = node.branches[ _a.activePathTokens[ nodePathLen + 1 ] ];
						expect( node.isActive ).toBe( false );
					}
				} );
				test( 'converts an inactive root node into an active one', () => {
					const pathTokens = [ GLOBAL_SELECTOR ];
					expect( _a.activeRoot.key ).toBe( pathTokens[ 0 ] );
					expect( _a.activeRoot.isActive ).toBe( false );
					expect( _a.activeRoot.findActiveNodeAt( pathTokens ) ).toBeNull();
					_a.activePathRepo.getPathInfoAt( pathTokens.join( '.' ) );
					_a.activeNode.insertAtomAt( pathTokens, _a.activePathRepo, {} );
					expect( _a.activeRoot.isActive ).toBe( true );
					expect( _a.activeRoot.findActiveNodeAt( pathTokens ) ).toBe( _a.activeRoot );
				} );
			} );
		} );
		describe( 'remove(...)', () => {
			test( '', () => {

			} );
		} );
		describe( 'removeAccessor(...)', () => {
			const a = getArtifact();
			test( 'can only be used on an active node', () => {
				expect( rootNode.isActive ).toBe( false );
				expect(() => { rootNode.removeAccessor( 1 ) }).toThrow(
					'applicable only to nodes containing atoms: assert via a `this.isActive` check.'
				);
				expect( a.activeNode.isActive ).toBe( true );
				expect(() => { a.activeNode.removeAccessor( 1 ) }).not.toThrow();
			} );
			test( 'returns number of remaining connections after removing a connection', () => {
				let numConnections = a.activeNode.addAccessor( 22 );
				expect( a.activeNode.removeAccessor( 22 ) ).toBe( --numConnections );
			} );
			test( 'ignores attempts to disconnect a non-connected cache entry descriptor', () => {
				let numConnections = a.activeNode.addAccessor( 20 );
				expect( a.activeNode.addAccessor( 55 ) ).toBe( ++numConnections );
				expect( a.activeNode.removeAccessor( 20 ) ).toBe( --numConnections );
				expect( a.activeNode.removeAccessor( 20 ) ).toBe( numConnections ); // no decrease in number of connections
			} );
			describe( 'observer connection check', () => {
				test( 'can remove a connected cache entry descriptor', () => {
					const disconnectSpy = jest.spyOn( Atom.prototype, 'disconnect' );
					expect( disconnectSpy ).not.toHaveBeenCalled();
					a.activeNode.addAccessor( 22 );
					expect( disconnectSpy ).not.toHaveBeenCalled();
					a.activeNode.removeAccessor( 22 );
					expect( disconnectSpy ).toHaveBeenCalledWith( 22 );
					disconnectSpy.mockRestore();
				} );
			} );
		} );
		describe( 'setValueAt(...)', () => {
			test( '', () => {

			} );
		} );
	} );
});

