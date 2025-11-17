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
		describe( 'insertAtomAt(...)', () => {
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
			test( 'bifurcate an atom node path', () => {
				// bifurcating active path tokens:
				// a > b > c > d > e > f
				// at node #4, creating:
				//			   d > e > f
				// a > b > c > |
				//			   i > j > k
				const nodePathTokens = [ ...a.activePathTokens.slice( 0, 3 ), 'i', 'j', 'k' ];
				a.activePathRepo.getPathInfoAt( nodePathTokens.join( '.' ) );
				expect( a.activeNode.findActiveNodeAt( nodePathTokens ) ).toBeNull();
				a.activeNode.insertAtomAt( nodePathTokens, a.activePathRepo, {} );
				expect( a.activeNode.findActiveNodeAt( nodePathTokens ) ).toBeInstanceOf( AtomNode );
			} );
			describe( 'inserting atoms into connective nodes', () => {
				let _a = getArtifact();
				test( 'converts an inactive parent node into an active one', () => {
					const parentPathTokens = _a.activePathTokens.slice( 0, -1 );
					expect( _a.activeNode.isActive ).toBe( true );
					let parentNode = _a.activeNode.findActiveNodeAt( parentPathTokens );
					expect( parentNode ).toBeNull();
					_a.activePathRepo.getPathInfoAt( parentPathTokens.join( '.' ) );
					_a.activeNode.insertAtomAt( parentPathTokens, _a.activePathRepo, {} );
					parentNode = _a.activeNode.findActiveNodeAt( parentPathTokens )!;
					expect( parentNode.isActive ).toBe( true );
					expect( parentNode.branches[ _a.activeNode.key ] ).toBe( _a.activeNode );
				} );
				test( 'converts any inactive node into an active node', () => {
					const nodePathLen = 2;
					const nodePathTokens = _a.activePathTokens.slice( 0, nodePathLen );
					// confirm that node at this path is an isolated connective ancestor node.
					{
						let node = _a.activeRoot;
						nodePathTokens.forEach( key => {
							node = node.branches[ key ];
							expect( node.isActive ).toBe( false );
						} );
						node = node.branches[ _a.activePathTokens[ nodePathLen ] ];
						expect( node.isActive ).toBe( false );
						node = node.branches[ _a.activePathTokens[ nodePathLen + 1 ] ];
						expect( node.isActive ).toBe( false );
					}
					// add the atom to the 3rd connective node
					_a.activePathRepo.getPathInfoAt( nodePathTokens.join( '.' ) );
					_a.activeRoot.insertAtomAt( nodePathTokens, _a.activePathRepo, {} );
					// confirm that node at this path is now an isolated but active ancestor node.
					{
						let node = _a.activeRoot;
						nodePathTokens.forEach(( key, index, { length } ) => {
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
		describe( '1xxxxa', () => {
		// describe( 'remove(...)', () => {
			const a = getArtifact();
			test( 'can only be used on an active node', () => {
				expect( a.activeRoot.isActive ).toBe( false );
				expect(() => { a.activeRoot.remove() }).toThrow(
					'applicable only to nodes containing atoms: assert via a `this.isActive` check.'
				);
			} );
			test( 'removes this node along with all connective nodes laading up to it', () => {
				const newPathTokens = [ 'c', 'm', 'k', 'b', 'n', 'm', 'k', 'j' ];
				expect( Object.keys( a.activeRoot.branches ) ).toHaveLength( 1 );
				expect( newPathTokens[ 0 ] in a.activeRoot.branches ).toBe( false );
				expect( a.activeRoot.findActiveNodeAt( newPathTokens ) ).toBeNull();
				a.activePathRepo.getPathInfoAt( newPathTokens.join( '.' ) );
				a.activeRoot.insertAtomAt( newPathTokens, a.activePathRepo, {} );
				expect( Object.keys( a.activeRoot.branches ) ).toHaveLength( 2 );
				expect( newPathTokens[ 0 ] in a.activeRoot.branches ).toBe( true );
				const newNode = a.activeRoot.findActiveNodeAt( newPathTokens )!;
				expect( newNode.isActive ).toBe( true );
				expect( newNode.isLeaf ).toBe( true );
				// confirm all inactive leading nodes
				{
					let count = -1;
					let node = a.activeRoot.branches[ newPathTokens[ ++count ] ];
					do {
						expect( node.isActive ).toBe( false );
						node = node.branches[ newPathTokens[ ++count ] ];
					} while( node !== newNode )
				}
				newNode.remove();
				expect( Object.keys( a.activeRoot.branches ) ).toHaveLength( 1 );
				expect( newPathTokens[ 0 ] in a.activeRoot.branches ).toBe( false );
				expect( a.activeRoot.findActiveNodeAt( newPathTokens ) ).toBeNull();
			} );
			test( 'does not remove any shared connective nodes laading up to removed node', () => {
				const sharedLen = 4;
				const newPathTokens = [ ...a.activePathTokens.slice( 0, sharedLen ), 'c', 'm', 'k' ];
				let splittingNode = a.activeRoot;
				for( let p = 0; p < sharedLen; p++ ) {
					splittingNode = splittingNode.branches[ newPathTokens[ p ] ];
 				}
				expect( splittingNode.isActive ).toBe( false );
				expect( Object.keys( splittingNode.branches ) ).toHaveLength( 1 );
				expect( splittingNode.findActiveNodeAt( a.activePathTokens ) ).toBe( a.activeNode );
				expect( splittingNode.findActiveNodeAt( newPathTokens ) ).toBeNull();
				a.activePathRepo.getPathInfoAt( newPathTokens.join( '.' ) );
				splittingNode.insertAtomAt( newPathTokens, a.activePathRepo, {} );
				expect( splittingNode.isActive ).toBe( false );
				expect( Object.keys( splittingNode.branches ) ).toHaveLength( 2 );
				expect( splittingNode.findActiveNodeAt( a.activePathTokens ) ).toBe( a.activeNode );
				const newNode = splittingNode.findActiveNodeAt( newPathTokens )!;
				expect( newNode ).toBeInstanceOf( AtomNode );
				newNode.remove();
				expect( Object.keys( splittingNode.branches ) ).toHaveLength( 1 );
				expect( splittingNode.isActive ).toBe( false );
				expect( splittingNode.findActiveNodeAt( a.activePathTokens ) ).toBe( a.activeNode );
				expect( splittingNode.findActiveNodeAt( newPathTokens ) ).toBeNull();
			} );
			test( 'does not remove any active ancestor node found in removed node path', () => {
				const ancestorPathTokkns = [ 'c', 'm', 'k', 'b' ];
				const leafPathTokens = [ ...ancestorPathTokkns, 'n', 'm', 'k', 'j' ];
				expect( a.activeNode.findActiveNodeAt( leafPathTokens ) ).toBeNull();
				a.activePathRepo.getPathInfoAt( leafPathTokens.join( '.' ) );
				a.activeNode.insertAtomAt( leafPathTokens, a.activePathRepo, {} );
				const leafNode = a.activeNode.findActiveNodeAt( leafPathTokens )!;
				expect( leafNode ).toBeInstanceOf( AtomNode );
				expect( a.activeNode.findActiveNodeAt( ancestorPathTokkns ) ).toBeNull();
				a.activePathRepo.getPathInfoAt( ancestorPathTokkns.join( '.' ) );
				a.activeNode.insertAtomAt( ancestorPathTokkns, a.activePathRepo, {} );
				const ancestorNode = a.activeNode.findActiveNodeAt( ancestorPathTokkns )!;
				expect( ancestorNode ).toBeInstanceOf( AtomNode );
				//confirms that precedent node is an active ancestor node of removed node
				expect( ancestorNode.isLeaf ).toBe( false );
				expect( a.activeNode.findActiveNodeAt( leafPathTokens ) ).toBe( leafNode );
				leafNode.remove();
				expect( a.activeNode.findActiveNodeAt( leafPathTokens ) ).toBeNull();
				expect( ancestorNode.isLeaf ).toBe( true );
			} );
			test( 'removing an active ancestor converts it to an inactive connective node', () => {
				const ancestorPathTokkns = [ 'c', 'm', 'k', 'b' ];
				const leafPathTokens = [ ...ancestorPathTokkns, 'n', 'm', 'k', 'j' ];
				a.activePathRepo.getPathInfoAt( ancestorPathTokkns.join( '.' ) );
				a.activeNode.insertAtomAt( ancestorPathTokkns, a.activePathRepo, {} );
				const ancestorNode = a.activeNode.findActiveNodeAt( ancestorPathTokkns )!;
				a.activePathRepo.getPathInfoAt( leafPathTokens.join( '.' ) );
				a.activeNode.insertAtomAt( leafPathTokens, a.activePathRepo, {} );
				let removedNode = a.activeRoot;
				for( let key of ancestorPathTokkns ) {
					removedNode = removedNode.branches[ key ];
				}
				expect( removedNode ).toBe( ancestorNode );
				expect( removedNode.isActive ).toBe( true );
				removedNode.remove();
				removedNode = a.activeRoot;
				for( let key of ancestorPathTokkns ) {
					removedNode = removedNode.branches[ key ];
				}
				expect( removedNode.isActive ).toBe( false );
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

