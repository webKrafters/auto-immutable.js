import {
	beforeAll,
	describe,
	expect,
	test
} from '@jest/globals';

import { GLOBAL_SELECTOR } from '../../../../../constants';
import { set } from '../../../../../utils';
import PathRepository from '../../paths';
import Atom from '../../../../atom';
import AtomNode from '.';

import { isReadonly } from '../../../../../test-artifacts/utils';

type Data = ReturnType<typeof getChangeData>;

describe( 'AtomNode class', () => {
	describe( 'root node', () => {
		let rootNode : AtomNode<Data>;
		beforeAll(() => { rootNode = AtomNode.createRoot() });
		test( 'creates an atom node', () => expect( rootNode ).toBeInstanceOf( AtomNode ) );
		test( 'root node has a default global path  and key', () => {
			const globalPathTokens = [ GLOBAL_SELECTOR ];
			expect( rootNode.key ).toBe( globalPathTokens[ 0 ] );
			const pathRepo = new PathRepository();
			rootNode.insertAtomAt(
				pathRepo.getPathInfoAt( GLOBAL_SELECTOR ).sanitizedPathId,
				pathRepo,
				{} as Data
			);
			expect( rootNode.fullPath ).toEqual( globalPathTokens );
		} );
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
			let pathRepo : PathRepository;
			let root : AtomNode<{}>;
			beforeEach(() => {
				const info = createTestAtomArtifact( {} as Data );
				pathRepo = info.pathRepo;
				root = info.root;
			});
			test( 'can only be used on an active node', () => {
				expect( root.isActive ).toBe( false );
				expect(() => { root.value = {} }).toThrow(
					'applicable only to nodes containing atoms: assert via a `this.isActive` check.'
				);
				const { sanitizedPathId } = pathRepo.getPathInfoAt( GLOBAL_SELECTOR );
				root.insertAtomAt( sanitizedPathId, pathRepo, {} );
				expect( root.isActive ).toBe( true );
				expect(() => { root.value = {} }).not.toThrow();
			} );
			describe( 'functionality', () => {
				test( 'sets the value', () => {
					const { root } = createTestAtomArtifact({} as Data);
					const node = root.findActiveNodeAt([ 'q', 'r', 's', 't' ])!;
					const value = getChangeData().q.r.s.t;
					expect( Object.isFrozen( value ) ).toBe( false );
					expect( node.value ).toBeUndefined();
					node.value = value as Data;
					expect( node.value ).toEqual( value );
					expect( Object.isFrozen( node.value ) ).toBe( true );
				} );
				test( 'ensures that set value is readonly', () => {
					let { root } = createTestAtomArtifact({} as Data);
					let node = root.findActiveNodeAt([ 'q', 'r', 's', 't' ])!;
					let value = {
						c: { j: 'testing' },
						e: 33,
						i: [ 2, 5, 4, 2 ]
					} as unknown as typeof node.value;
					node.value = value;
					expect( isReadonly( node.value ) ).toBe( true );

					// ----- for updating existing data -----
					
					const { root: root1 } = createTestAtomArtifact( getChangeData() );
					root = root1
					node = root.findActiveNodeAt([ 'q', 'r', 's', 't' ])!;
					value = {
						c: { j: 'testing' },
						e: 33,
						i: [ 2, 5, 4, 2 ]
					} as unknown as typeof node.value;
					node.value = value;
					expect( isReadonly( node.value ) ).toBe( true );
				} );
				test( 'ensures that all atom values of atoms up the are readonly', () => {
					let { root } = createTestAtomArtifact({} as Data);
					let node = root.findActiveNodeAt([ 'a', 'b', 'c', 'd', 'e' ])!;
					let value = { message: 'this is the test....' } as unknown as typeof node.value;
					node.value = value;
					expect( Object.isFrozen( node.value ) ).toBe( true );
					expect( isReadonly( node.rootAtomNode.value ) ).toBe( true );

					// ----- for updating existing data -----
					
					const { root: root1 } = createTestAtomArtifact( getChangeData() );
					root = root1
					node = root.findActiveNodeAt([ 'a', 'b', 'c', 'd', 'e' ])!;
					value = { message: 'this is the test....' } as unknown as typeof node.value;
					node.value = value;
					expect( Object.isFrozen( node.value ) ).toBe( true );
					expect( isReadonly( node.rootAtomNode.value ) ).toBe( true );
				} );
				test( 'ensures that unaffected atoms retain their original value object references', () => {
					const createTestUpdatePayload = ( currentState : Data ) : Data => {
						let data = { ...currentState };
						data = set( data, [ 't', 'u', 'v', 'd' ], 82 ) as Data;
						data = set( data, [ 't', 'y', 'q' ], 99 ) as Data;
						return data;
					}

					let node_t : AtomNode<Data>;
					let node_tuvw : AtomNode<Data>;
					let node_tuz : AtomNode<Data>;
					let node_ty : AtomNode<Data>;

					let value_t : Data;
					let value_tuvw : Data;
					let value_tuz : Data;
					let value_ty : Data;

					{
						const { root } = createTestAtomArtifact( {} as Data );

						node_t = root.findActiveNodeAt([ 't' ])!;
						node_tuvw = root.findActiveNodeAt([ 't', 'u', 'v', 'w' ])!;
						node_tuz = root.findActiveNodeAt([ 't', 'u', 'z' ])!;
						node_ty = root.findActiveNodeAt([ 't', 'y' ])!;

						value_t = node_t.value;
						value_tuvw = node_tuvw.value;
						value_tuz = node_tuz.value;
						value_ty = node_ty.value;

						expect( value_t ).toBeUndefined();
						expect( value_tuvw ).toBeUndefined();
						expect( value_tuz ).toBeUndefined();
						expect( value_ty ).toBeUndefined();

						const newChanges = createTestUpdatePayload( {} as Data );
						node_t.value = newChanges.t as unknown as Data;

						expect( node_t.value ).not.toBe( value_t ); // affected by change
						expect( node_tuvw.value ).toBe( value_tuvw );
						expect( node_tuz.value ).toBe( value_tuz );
						expect( node_ty.value ).not.toBe( value_ty );  // affected by change

						expect( node_t.value ).toEqual( newChanges.t );
						expect( node_ty.value ).toEqual( newChanges.t.y );

						expect( isReadonly( node_t.value ) ).toBe( true );
						expect( isReadonly( node_tuvw.value ) ).toBe( true );
						expect( isReadonly( node_tuz.value ) ).toBe( true);
						expect( isReadonly( node_ty.value ) ).toBe( true );
					}

					// ----- for updating existing data -----
					
					{
						const data = getChangeData();
						const { root } = createTestAtomArtifact( data );

						node_t = root.findActiveNodeAt([ 't' ])!;
						node_tuvw = root.findActiveNodeAt([ 't', 'u', 'v', 'w' ])!;
						node_tuz = root.findActiveNodeAt([ 't', 'u', 'z' ])!;
						node_ty = root.findActiveNodeAt([ 't', 'y' ])!;

						value_t = node_t.value;
						value_tuvw = node_tuvw.value;
						value_tuz = node_tuz.value;
						value_ty = node_ty.value;

						expect( value_t ).toStrictEqual( data.t );
						expect( value_tuvw ).toStrictEqual( data.t.u.v.w );
						expect( value_tuz ).toStrictEqual( data.t.u.z );
						expect( value_ty ).toStrictEqual( data.t.y );

						const newChanges = createTestUpdatePayload( getChangeData() );
						node_t.value = newChanges.t as unknown as Data;

						expect( node_t.value ).not.toBe( value_t ); // affected by change
						expect( node_tuvw.value ).toBe( value_tuvw );
						expect( node_tuz.value ).toBe( value_tuz );
						expect( node_ty.value ).not.toBe( value_ty );  // affected by change

						expect( node_t.value ).toEqual( newChanges.t );
						expect( node_ty.value ).toEqual( newChanges.t.y );

						expect( isReadonly( node_t.value ) ).toBe( true );
						expect( isReadonly( node_tuvw.value ) ).toBe( true );
						expect( isReadonly( node_tuz.value ) ).toBe( true);
						expect( isReadonly( node_ty.value ) ).toBe( true );
					}
				} );
			} );
		} );
	} );
	describe( 'methods', () => {
		function getArtifact() {
			const a = {
				activeNode: null as unknown as AtomNode<{}>,
				activePathTokens: [ 'a', 'b', 'c', 'd', 'e', 'f' ],
				activePathTokensId : undefined as unknown as number,
				activePathRepo: null as unknown as PathRepository,
				activeRoot: null as unknown as AtomNode<{}>
			};
			beforeAll(() => {
				a.activeRoot = AtomNode.createRoot();
				a.activePathRepo = new PathRepository();
				const { sanitizedPathId } = a.activePathRepo.getPathInfoAt( a.activePathTokens.join( '.' ) );
				a.activePathTokensId = sanitizedPathId;
				a.activeRoot.insertAtomAt( a.activePathTokensId, a.activePathRepo, {} );
				a.activeNode = a.activeRoot.findActiveNodeAt( a.activePathTokens )!;
			});
			return a;
		}
		describe( 'addAccessor(...)', () => {
			const a = getArtifact();
			test( 'can only be used on an active node', () => {
				const rootNode = AtomNode.createRoot();
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
				expect( AtomNode.createRoot().findActiveNodeAt( a.activePathTokens ) ).toBeNull();
			} );
			test( 'returns null if path in the tree but has no atom', () => {
				expect( a.activeNode.findActiveNodeAt( a.activePathTokens.slice( 0, -1 ) ) ).toBeNull();
			} );
			test( 'returns node if path in the tree but has an atom', () => {
				expect( a.activeNode.findActiveNodeAt( a.activePathTokens ) ).toBeInstanceOf( AtomNode );
			} );
			test( 'returns rootNode if path in the tree but has an atom', () => {
				expect( a.activeRoot.isActive ).toBe( false );
				const { sanitizedPathId: globalPathId } = a.activePathRepo.getPathInfoAt( GLOBAL_SELECTOR );
				a.activeNode.insertAtomAt( globalPathId, a.activePathRepo, {});
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
				const { sanitizedPathId: nodePathTokensId } = a.activePathRepo.getPathInfoAt( nodePathTokens.join( '.' ) );
				expect( a.activeNode.findActiveNodeAt( nodePathTokens ) ).toBeNull();
				a.activeNode.insertAtomAt( nodePathTokensId, a.activePathRepo, {} );
				expect( a.activeNode.findActiveNodeAt( nodePathTokens ) ).toBeInstanceOf( AtomNode );
			} );
			describe( 'inserting atoms into connective nodes', () => {
				let _a = getArtifact();
				test( 'converts an inactive parent node into an active one', () => {
					const parentPathTokens = _a.activePathTokens.slice( 0, -1 );
					expect( _a.activeNode.isActive ).toBe( true );
					let parentNode = _a.activeNode.findActiveNodeAt( parentPathTokens );
					expect( parentNode ).toBeNull();
					const {
						sanitizedPathId: parentPathTokensId
					} = _a.activePathRepo.getPathInfoAt( parentPathTokens.join( '.' ) );
					_a.activeNode.insertAtomAt( parentPathTokensId, _a.activePathRepo, {} );
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
					const {
						sanitizedPathId: nodePathTokensId
					} = _a.activePathRepo.getPathInfoAt( nodePathTokens.join( '.' ) );
					_a.activeRoot.insertAtomAt( nodePathTokensId, _a.activePathRepo, {} );
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
					const {
						sanitizedPathId: pathTokensId
					} = _a.activePathRepo.getPathInfoAt( pathTokens.join( '.' ) );
					_a.activeNode.insertAtomAt( pathTokensId, _a.activePathRepo, {} );
					expect( _a.activeRoot.isActive ).toBe( true );
					expect( _a.activeRoot.findActiveNodeAt( pathTokens ) ).toBe( _a.activeRoot );
				} );
				describe( '', () => {
					let _a = getArtifact();
					test( 'converts between inactive node along a path between two active nodes', () => {
						let newAtomPath = _a.activePathTokens.slice( 0, 2 );
						expect( _a.activeNode.isRootAtom ).toBe( true );
						_a.activeRoot.insertAtomAt( // creating new atom root above _a.activeNode
							_a.activePathRepo.getPathInfoAt( newAtomPath.join( '.' ) ).sanitizedPathId,
							_a.activePathRepo,
							{}
						);
						expect( _a.activeNode.isRootAtom ).toBe( false );
						expect( _a.activeRoot.findActiveNodeAt( newAtomPath )?.isRootAtom ).toBe( true );
						// activate a connective node lying between the new root atom and _a.activeNode
						_a.activeRoot.insertAtomAt(
							_a.activePathRepo.getPathInfoAt( 
								_a.activePathTokens
									.slice( 0, 5 )
									.join( '.' )
								).sanitizedPathId,
							_a.activePathRepo,
							{}
						);
					} );
				} );
			} );
		} );
		describe( 'remove(...)', () => {
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
				const {
					sanitizedPathId: newPathTokensId
				} = a.activePathRepo.getPathInfoAt( newPathTokens.join( '.' ) );
				a.activeRoot.insertAtomAt( newPathTokensId, a.activePathRepo, {} );
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
				const {
					sanitizedPathId: newPathTokensId
				} = a.activePathRepo.getPathInfoAt( newPathTokens.join( '.' ) );
				splittingNode.insertAtomAt( newPathTokensId, a.activePathRepo, {} );
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
				const ancestorPathTokens = [ 'c', 'm', 'k', 'b' ];
				const leafPathTokens = [ ...ancestorPathTokens, 'n', 'm', 'k', 'j' ];
				expect( a.activeNode.findActiveNodeAt( leafPathTokens ) ).toBeNull();
				const {
					sanitizedPathId: leafPathTokensId
				} = a.activePathRepo.getPathInfoAt( leafPathTokens.join( '.' ) );
				a.activeNode.insertAtomAt( leafPathTokensId, a.activePathRepo, {} );
				const leafNode = a.activeNode.findActiveNodeAt( leafPathTokens )!;
				expect( leafNode ).toBeInstanceOf( AtomNode );
				expect( a.activeNode.findActiveNodeAt( ancestorPathTokens ) ).toBeNull();
				const {
					sanitizedPathId: ancestorPathTokensId
				} = a.activePathRepo.getPathInfoAt( ancestorPathTokens.join( '.' ) );
				a.activeNode.insertAtomAt( ancestorPathTokensId, a.activePathRepo, {} );
				const ancestorNode = a.activeNode.findActiveNodeAt( ancestorPathTokens )!;
				expect( ancestorNode ).toBeInstanceOf( AtomNode );
				//confirms that precedent node is an active ancestor node of removed node
				expect( ancestorNode.isLeaf ).toBe( false );
				expect( a.activeNode.findActiveNodeAt( leafPathTokens ) ).toBe( leafNode );
				leafNode.remove();
				expect( a.activeNode.findActiveNodeAt( leafPathTokens ) ).toBeNull();
				expect( ancestorNode.isLeaf ).toBe( true );
			} );
			test( 'converts an active ancestor node to an inactive connective node', () => {
				const ancestorPathTokens = [ 'c', 'm', 'k', 'b' ];
				const leafPathTokens = [ ...ancestorPathTokens, 'n', 'm', 'k', 'j' ];
				const {
					sanitizedPathId: ancestorPathTokensId
				} = a.activePathRepo.getPathInfoAt( ancestorPathTokens.join( '.' ) );
				a.activeNode.insertAtomAt( ancestorPathTokensId, a.activePathRepo, {} );
				const ancestorNode = a.activeNode.findActiveNodeAt( ancestorPathTokens )!;
				const {
					sanitizedPathId: leafPathTokensId
				} = a.activePathRepo.getPathInfoAt( leafPathTokens.join( '.' ) );
				a.activeNode.insertAtomAt( leafPathTokensId, a.activePathRepo, {} );
				let removedNode = a.activeRoot;
				for( let key of ancestorPathTokens ) {
					removedNode = removedNode.branches[ key ];
				}
				expect( removedNode ).toBe( ancestorNode );
				expect( removedNode.isActive ).toBe( true );
				removedNode.remove();
				removedNode = a.activeRoot;
				for( let key of ancestorPathTokens ) {
					removedNode = removedNode.branches[ key ];
				}
				expect( removedNode.isActive ).toBe( false );
			} );
			describe( '', () => {
				const a = getArtifact();
				test( 'simply converts a middle non-root/non-leaf atom node to an inactive connective node', () => {
					a.activeRoot.insertAtomAt(
						a.activePathRepo.getPathInfoAt([
							...a.activePathTokens, 'c', 'm', 'k', 'b'
						].join( '.' )).sanitizedPathId,
						a.activePathRepo,
						{}
					);
					a.activeRoot.insertAtomAt(
						a.activePathRepo.getPathInfoAt( GLOBAL_SELECTOR ).sanitizedPathId,
						a.activePathRepo,
						{}
					);
					expect( a.activeNode.isActive ).toBe( true );
					expect( a.activeNode.fullPath ).toEqual( a.activePathTokens );
					expect( a.activeNode.isLeaf ).toEqual( false );
					a.activeNode.remove();
					expect( a.activeRoot.findActiveNodeAt( a.activePathTokens ) ).toBeNull();
					let node = a.activeRoot;
					for( const key of a.activePathTokens ) { node = node.branches[ key ] }
					expect( node.isActive ).toBe( false );
				} );
			} );
			describe( '', () => {
				const a = getArtifact();
				test( 'adding and removing ancestor root atom node converts its nearest active descendans to root atom node', () => {
					expect( a.activeNode.isRootAtom ).toBe( true );
					// -- new superseding root atom node --
					const rootAtomPathTokens = [ 'a', 'b', 'c' ]
					let pathTokens = [ ...rootAtomPathTokens ];
					a.activeRoot.insertAtomAt(
						a.activePathRepo.getPathInfoAt( pathTokens.join( '.' ) ).sanitizedPathId,
						a.activePathRepo,
						{}
					);
					const newRootAtomNode = a.activeRoot.findActiveNodeAt( pathTokens )!;
					expect( newRootAtomNode.isRootAtom ).toBe( true );
					// -- converts old root atom node at ` a.activeNode` to new desc node 1 --
					expect( a.activeNode.isRootAtom ).toBe( false );
					// -- new desc node 2 --
					pathTokens = [ ...rootAtomPathTokens, 'c', 'm', 'k', 'b' ];
					a.activeRoot.insertAtomAt(
						a.activePathRepo.getPathInfoAt( pathTokens.join( '.' ) ).sanitizedPathId,
						a.activePathRepo,
						{}
					);
					const descAtomNode1 = a.activeRoot.findActiveNodeAt( pathTokens )!;
					expect( descAtomNode1.isRootAtom ).toBe( false );
					// -- new desc node 3 --
					pathTokens = [ ...rootAtomPathTokens, 'p', 'r', 's', 't' ];
					a.activeRoot.insertAtomAt(
						a.activePathRepo.getPathInfoAt( pathTokens.join( '.' ) ).sanitizedPathId,
						a.activePathRepo,
						{}
					);
					const descAtomNode2 = a.activeRoot.findActiveNodeAt( pathTokens )!;
					expect( descAtomNode2.isRootAtom ).toBe( false );
					// -- new desc node 4 --
					pathTokens = [ ...rootAtomPathTokens, 'n', 'm', 'k', 'j' ];
					a.activeRoot.insertAtomAt(
						a.activePathRepo.getPathInfoAt( pathTokens.join( '.' ) ).sanitizedPathId,
						a.activePathRepo,
						{}
					);
					const descAtomNode3 = a.activeRoot.findActiveNodeAt( pathTokens )!;
					expect( descAtomNode3.isRootAtom ).toBe( false );
					// add desc. to descAtomNode3
					pathTokens = [ ...pathTokens, 'w', 'x', 'y', 'z' ];
					a.activeRoot.insertAtomAt(
						a.activePathRepo.getPathInfoAt( pathTokens.join( '.' ) ).sanitizedPathId,
						a.activePathRepo,
						{}
					);// -- removing top shared root Atom converts immediate descendants to root atom nodes
					newRootAtomNode.remove();
					expect( a.activeNode.isRootAtom ).toBe( true ); // is now a root atom node
					expect( descAtomNode1.isRootAtom ).toBe( true ); // is now a root atom node
					expect( descAtomNode2.isRootAtom ).toBe( true ); // is now a root atom node
					expect( descAtomNode3.isRootAtom ).toBe( true ); // is now a root atom node

					expect( a.activeRoot.findActiveNodeAt( pathTokens )!.rootAtomNode ).toBe( descAtomNode3 );
				} );
			} );
		} );
		describe( 'removeAccessor(...)', () => {
			const a = getArtifact();
			test( 'can only be used on an active node', () => {
				const rootNode = AtomNode.createRoot();
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
			let valueSetterSpy : jest.SpyInstance<void, [any], any>;
			let testChanges : Data;
			let root : AtomNode<Data>;
			let pathRepo : PathRepository;
			beforeAll(() => {
				valueSetterSpy = jest
					.spyOn( AtomNode.prototype, 'value', 'set' )
					.mockImplementation();

			} );
			beforeEach(() => {
				valueSetterSpy.mockClear();
				const artifact = createTestAtomArtifact({} as Data);
				root = artifact.root;
				pathRepo = artifact.pathRepo;
				testChanges = getChangeData();
			} );
			afterAll(() => { valueSetterSpy.mockRestore() });
			test( 'sets atom at global selector when available', () => {
				expect( root.key ).toBe( GLOBAL_SELECTOR );
				expect( root.isActive ).toBe( false );
				root.insertAtomAt(
					pathRepo.getPathInfoAt( GLOBAL_SELECTOR ).sanitizedPathId,
					pathRepo,
					{} as Data
				);
				expect( root.isActive ).toBe( true )
				root.setValueAt([ GLOBAL_SELECTOR ], testChanges );
				// called 1x for the newly created super root atom at GLOBAL_SELECTOR
				expect( valueSetterSpy ).toHaveBeenCalledTimes( 1 );
				expect( valueSetterSpy ).toHaveBeenCalledWith( testChanges );
			} );
			test( 'embeds changes into active root node value object top-level property', () => {
				const data = { ...getChangeData(), x: 0 };
				root.insertAtomAt(
					pathRepo.getPathInfoAt( GLOBAL_SELECTOR ).sanitizedPathId,
					pathRepo,
					data
				);
				root.setValueAt([ 'x' ], 24 as unknown as Data );
				// called 1x for the newly created super root atom at GLOBAL_SELECTOR
				expect( valueSetterSpy ).toHaveBeenCalledTimes( 1 );
				expect( valueSetterSpy ).toHaveBeenCalledWith({ ...data, x: 24 });
				valueSetterSpy.mockClear();
				const y = { message: 'Testing new property' };
				root.setValueAt([ 'y' ], y as unknown as Data );
				// called 1x for the newly created super root atom at GLOBAL_SELECTOR
				expect( valueSetterSpy ).toHaveBeenCalledTimes( 1 );
				expect( valueSetterSpy ).toHaveBeenCalledWith({ ...data, x: 24, y });
			} );
			test( 'diseminates global selector change to individual section root atoms when global selector node has no atom', () => {
				expect( root.key ).toBe( GLOBAL_SELECTOR );
				expect( root.isActive ).toBe( false );
				root.setValueAt([ GLOBAL_SELECTOR ], testChanges );
				// called 6x for descendant root atoms at paths 'a.b', 'a.e.f.g.h', 'a.f.g.h', 'q.r.s.a', 'q.r.s.t' and 't'
				expect( valueSetterSpy ).toHaveBeenCalledTimes( 6 );
				expect( valueSetterSpy.mock.calls[ 0 ][ 0 ] ).toEqual( testChanges.t );
				expect( valueSetterSpy.mock.calls[ 1 ][ 0 ] ).toEqual( testChanges.q.r.s.t );
				expect( valueSetterSpy.mock.calls[ 2 ][ 0 ] ).toEqual( testChanges.q.r.s.a );
				expect( valueSetterSpy.mock.calls[ 3 ][ 0 ] ).toEqual( testChanges.a.f.g.h );
				expect( valueSetterSpy.mock.calls[ 4 ][ 0 ] ).toEqual( testChanges.a.e.f.g.h );
				expect( valueSetterSpy.mock.calls[ 5 ][ 0 ] ).toEqual( testChanges.a.b );
			} );
			test( 'does not apply changes not occurring along the paths containing atom value object(s)', () => {
				root.setValueAt( [ 'w', 'x', 'y', 'z' ], testChanges );
				expect( valueSetterSpy ).not.toHaveBeenCalled();
			} );
			test( 'applies changes on paths not matching any atom path to the closest atom bearing ancestor', () => {
				testChanges.a.b.c.d = {
					...testChanges.a.b.c.d,
					w: { x: { y: { z: {} } } }
				} as typeof testChanges.a.b.c.d;
				root.setValueAt( [ 'a', 'b', 'c', 'd' ], testChanges );
				// called 1x on the closest atom bearing ancestor (this for this change is located at path 'a.b.c')
				expect( valueSetterSpy ).toHaveBeenCalledTimes( 1 );
				expect( valueSetterSpy ).toHaveBeenCalledWith( testChanges.a.b.c );
			} );
			test( 'applies changes directly to atom bearing nodes with matching paths', () => {
				testChanges.a.b.c.d.e = {
					...testChanges.a.b.c.d.e,
					w: { x: { y: { z: {} } } }
				} as typeof testChanges.a.b.c.d.e;
				root.setValueAt(
					[ 'a', 'b', 'c', 'd', 'e' ],
					testChanges.a.b.c.d.e as unknown as Data
				);
				// called 1x directly on the atom bearing node (this for this change is located at path 'a.b.c.d.e')
				expect( valueSetterSpy ).toHaveBeenCalledTimes( 1 );
				expect( valueSetterSpy ).toHaveBeenCalledWith( testChanges.a.b.c.d.e );
			} );
			test( 'merges changes occurring in leaf atom node subpaths to that leaf node', () => {
				testChanges.a.f.g.h = {
					...testChanges.a.f.g.h,
					w: { x: { y: { z: {} } } }
				};
				root.setValueAt( [ 'a', 'f', 'g', 'h', 'w', 'x', 'y' ], testChanges );
				// called 1x on the closest leaf atom node (this for this change is located at path 'a.f.g.h')
				expect( valueSetterSpy ).toHaveBeenCalledTimes( 1 );
				expect( valueSetterSpy ).toHaveBeenCalledWith( testChanges.a.f.g.h );
			} );
			test( 'assigns to root atom nodes changes occurring at paths preceding above them', () => {
				testChanges.q.r = {
					...testChanges.q.r,
					w: { x: { y: { z: {} } } },
					s: {
						a: {},
						t: {},
						z: {}
					}
				} as typeof testChanges.q.r;
				root.setValueAt( [ 'q', 'r' ], testChanges.q.r as unknown as Data );
				// called 2x for root atoms occurring under the 'q.r' path; namely nodes at paths 'q.r.s.a' and 'q.r.s.t'
				expect( valueSetterSpy ).toHaveBeenCalledTimes( 2 );
				expect( valueSetterSpy.mock.calls[ 0 ][ 0 ] ).toEqual( testChanges.q.r.s.t );
				expect( valueSetterSpy.mock.calls[ 1 ][ 0 ] ).toEqual( testChanges.q.r.s.a );
			} );
		} );
	} );
});

function createTestAtomArtifact( originData : Data ) {
	const root = AtomNode.createRoot<Data>();
	const pathRepo = new PathRepository();
	[
		pathRepo.getPathInfoAt( 'a.b' ).sanitizedPathId,
		pathRepo.getPathInfoAt( 'a.b.c' ).sanitizedPathId,
		pathRepo.getPathInfoAt( 'a.b.c.d.e' ).sanitizedPathId,
		pathRepo.getPathInfoAt( 'a.e.f.g.h' ).sanitizedPathId,
		pathRepo.getPathInfoAt( 'a.f.g.h' ).sanitizedPathId,
		pathRepo.getPathInfoAt( 'q.r.s.a' ).sanitizedPathId,
		pathRepo.getPathInfoAt( 'q.r.s.t' ).sanitizedPathId,
		pathRepo.getPathInfoAt( 't' ).sanitizedPathId,
		pathRepo.getPathInfoAt( 't.u.v.w' ).sanitizedPathId,
		pathRepo.getPathInfoAt( 't.u.z' ).sanitizedPathId,
		pathRepo.getPathInfoAt( 't.y' ).sanitizedPathId
	].forEach( id => root.insertAtomAt( id, pathRepo, originData ) );
	return { pathRepo, root }
}

function getChangeData()  {
	return {
		a: {
			b: { c: { d: { e: {} } } },
			e: { f: { g: { h: {} } } },
			f: { g: { h: {} } }
		},
		q: { r: { s: {
			a: {},
			t: {}
		} } },
		t: {
			u: {
				v: { w: {} },
				z: {}
			},
			y: {}
		}
	};
}

