import {
	afterAll,
	beforeAll,
	describe,
	expect,
	jest,
	test
} from '@jest/globals';

import { GLOBAL_SELECTOR } from '../../..';

import Accessor from '../';
import * as PathRepositoryModule from '../../accessor-cache/repository/paths';
import AtomNode from '../../accessor-cache/repository/atom-value/node';
import AtomValueRepository from '../../accessor-cache/repository/atom-value';

const PathRepository = PathRepositoryModule.default;

function getFakeAtomNodeFactory() {
	let atomClientCountMap : {[atomId:string]: number} = {};
	return ( atomId : string ) => ({
		addAccessor( id : string ){
			if( atomId in atomClientCountMap ) {
				++atomClientCountMap[ atomId ];
			} else {
				atomClientCountMap[ atomId ] = 1;
			}
			return atomClientCountMap[ atomId ]
		},
		remove(){},
		removeAccessor( id : string ){
			return --atomClientCountMap[ atomId ];
		}
	} as unknown as AtomNode<{}> );
};

describe( 'Accessor class', () => {
	let sourceIds = [ 1, 2, 3, 4 ];
	describe( 'properties', () => {
		let accessor : Accessor<{}>;
		beforeEach(() =>  {
			const pathRepo = new PathRepository();
			accessor = new Accessor(
				sourceIds,
				{
					1: {} as AtomNode<{}>,
					2: {} as AtomNode<{}>,
					3: {} as AtomNode<{}>,
					4: {} as AtomNode<{}>
				},
				pathRepo,
				new AtomValueRepository( {}, pathRepo )
			);
		} );
		describe( 'id', () => {
			test( 'will produce the internal for this accessor', () => {
				expect( accessor.id ).toEqual( expect.any( Number ) );
			} );
		} );
		describe( 'numClients', () => {
			test( 'produces the number clients using this accessor', () => {
				const createAtomNode = getFakeAtomNodeFactory();
				const pathRepo = new PathRepository();
				const accessor = new Accessor(
					sourceIds,
					{
						1: createAtomNode( '1' ),
						2: createAtomNode( '2' ),
						3: createAtomNode( '3' ),
						4: createAtomNode( '4' )
					},
					pathRepo,
					new AtomValueRepository( {}, pathRepo )
				);
				expect( accessor.numClients ).toEqual( 0 );
				accessor.addClient( 'TEST_1' );
				expect( accessor.numClients ).toEqual( 1 );
				accessor.addClient( 'TEST_2' );
				expect( accessor.numClients ).toEqual( 2 );
				accessor.addClient( 'TEST_3' );
				expect( accessor.numClients ).toEqual( 3 );
				accessor.removeClient( 'TEST_2' );
				expect( accessor.numClients ).toEqual( 2 );
			} );
		} );
		describe( 'sourcePathIds', () => {
			test( 'proudces a sourcePathId-to-atomValue object', () => {
				expect( accessor.sourcePathIds ).toEqual( sourceIds );
			} );
		} );
		describe( 'value', () => {
			test( 'proudces a sourcePathId-to-atomValue object', () => {
				expect( accessor.value ).toEqual({
					1: undefined,
					2: undefined,
					3: undefined,
					4: undefined
				});
			} );
		} );
	} );
	describe( 'addClient(...)', () => {
		test( "registers client's id", () => {
			const createAtomNode = getFakeAtomNodeFactory();
			const pathRepo = new PathRepository();
			const accessor = new Accessor(
				sourceIds,
				{
					1: createAtomNode( '1' ),
					2: createAtomNode( '2' ),
					3: createAtomNode( '3' ),
					4: createAtomNode( '4' )
				},
				pathRepo,
				new AtomValueRepository( {}, pathRepo )
			);
			expect( accessor.numClients ).toEqual( 0 );
			accessor.addClient( 'TEST_1' );
			expect( accessor.numClients ).toEqual( 1 );
		} );
	} );

	describe( 'hasClient(...)', () => {
		test( "checks client's id is already registered to this accessor", () => {
			const createAtomNode = getFakeAtomNodeFactory();
			const pathRepo = new PathRepository();
			const accessor = new Accessor(
				sourceIds,
				{
					1: createAtomNode( '1' ),
					2: createAtomNode( '2' ),
					3: createAtomNode( '3' ),
					4: createAtomNode( '4' )
				},
				pathRepo,
				new AtomValueRepository( {}, pathRepo )
			);
			expect( accessor.hasClient( 'TEST_1' ) ).toBe( false );
			accessor.addClient( 'TEST_1' );
			expect( accessor.hasClient( 'TEST_1' ) ).toBe( true );
			accessor.removeClient( 'TEST_1' );
			expect( accessor.hasClient( 'TEST_1' ) ).toBe( false );
		} );
	} );

	describe( 'removeClient(...)', () => {
		test( "unregisteres client's id from this accessor", () => {
			const createAtomNode = getFakeAtomNodeFactory();
			const pathRepo = new PathRepository();
			const accessor = new Accessor(
				sourceIds,
				{
					1: createAtomNode( '1' ),
					2: createAtomNode( '2' ),
					3: createAtomNode( '3' ),
					4: createAtomNode( '4' )
				},
				pathRepo,
				new AtomValueRepository( {}, pathRepo )
			);
			accessor.addClient( 'TEST_1' );
			accessor.addClient( 'TEST_2' );
			accessor.removeClient( 'TEST_1' );
		} );
		test( "initiates atom removal if outgoing accessor is the last remaininig", () => {
			const createAtomNode = getFakeAtomNodeFactory();
			const removeAtomMock = jest.fn();
			const getPathTokensAtSpy = jest.spyOn( PathRepository.prototype, 'getPathTokensAt' ).mockImplementation(( id : number ) => [] );
			const getIdOfSanitizedPathSpy = jest.spyOn( PathRepository.prototype, 'getIdOfSanitizedPath' ).mockImplementation(( path : string ) => 0 );
			const getSanitizedPathOfSpy = jest.spyOn( PathRepository.prototype, 'getSanitizedPathOf' ).mockImplementation(( id : number ) => '' );
			const pathRepo = new PathRepository();
			const accessor1 = new Accessor(
				sourceIds,
				{
					1: { ...createAtomNode( '1' ), remove: removeAtomMock } as unknown as AtomNode<{}>,
					2: { ...createAtomNode( '2' ), remove: removeAtomMock } as unknown as AtomNode<{}>,
					3: { ...createAtomNode( '3' ), remove: removeAtomMock } as unknown as AtomNode<{}>,
					4: { ...createAtomNode( '4' ), remove: removeAtomMock } as unknown as AtomNode<{}>
				},
				pathRepo,
				new AtomValueRepository( {}, pathRepo )
			);
			accessor1.addClient( 'TEST_1' );
			const accessor2 = new Accessor(
				[ 1, 4 ],
				{	
					1: { ...createAtomNode( '1' ), remove: removeAtomMock } as unknown as AtomNode<{}>,
					4: { ...createAtomNode( '4' ), remove: removeAtomMock } as unknown as AtomNode<{}>
				},
				pathRepo,
				new AtomValueRepository( {}, pathRepo )
			);
			accessor2.addClient( 'TEST_1' );
			accessor1.addClient( 'TEST_2' );

			expect( removeAtomMock ).not.toHaveBeenCalled();
			accessor1.removeClient( 'TEST_1' );
			expect( removeAtomMock ).toHaveBeenCalledTimes( 0 );
			accessor1.removeClient( 'TEST_2' );
			expect( removeAtomMock ).toHaveBeenCalledTimes( 2 );
			removeAtomMock.mockClear();
			accessor2.removeClient( 'TEST_1' );
			expect( removeAtomMock ).toHaveBeenCalledTimes( 2 );

			getPathTokensAtSpy.mockRestore();
			getIdOfSanitizedPathSpy.mockRestore();
			getSanitizedPathOfSpy.mockRestore();
		} );
	} );
} );
