import {
	beforeAll,
	describe,
	expect,
	test
} from '@jest/globals';

import getProperty from '@webkrafters/get-property';

import Atom from '../../atom';

import Accessor from '..';

import createSourceData from '../../../test-artifacts/data/create-data-obj';
import { isReadonly } from '../../../test-artifacts/utils';

describe( 'Accessor class', () => {
	const source = createSourceData();
	const accessedPropertyPaths = Object.freeze([
		'address',
		'friends[1].id',
		'friends[1]',
		'friends[1].name.last',
		'history.places',
		'history.places[2].year',
		'history',
		'registered.time',
		'registered.time.hours',
		'tags[4]'
	]) as Array<string>;
	const accessor = new Accessor( accessedPropertyPaths );
	const SET_ERROR = propName => `Cannot set property ${ propName } of #<Accessor> which has only a getter`;
	test( 'creates an accessor', () => expect( accessor ).toBeInstanceOf( Accessor ) );
	describe( 'numClients property', () => {
		test( 'is 0 by default', () => expect( accessor.numClients ).toBe( 0 ) );
		test( 'is privately mutable only', () => expect(() => {
			// @ts-expect-error
			accessor.numClients = expect.any( Number );
		}).toThrow( SET_ERROR`numClients` ) );
	} );
	describe( 'id property', () => {
		test( 'holds an incremental unique integer value', () => {
			const testAccessor = new Accessor( accessedPropertyPaths );
			expect( testAccessor.id ).toBeGreaterThan( accessor.id );
		} );
		test( 'is privately mutable only', () => expect(() => {
			// @ts-expect-error
			accessor.id = expect.any( Number )
		}).toThrow( SET_ERROR`id` ) );
	} );
	describe( 'paths property', () => {
		test( 'is privately mutable only', () => expect(() => {
			// @ts-expect-error
			accessor.paths = expect.any( Array )
		}).toThrow( SET_ERROR`paths` ) );
		test( 'is a distinct value from the `accessedPropertyPaths`', () => {
			expect( accessor.paths ).not.toBe( accessedPropertyPaths );
		});
		test( 'preserves all propertyPaths options supplied', () => {
			expect( accessor.paths ).not.toBe( accessedPropertyPaths );
			expect( accessor.paths ).toStrictEqual( accessedPropertyPaths );
		} );
	} );
	describe( 'value property', () => {
		test( 'is empty object by default', () => expect( accessor.value ).toEqual({}) );
		test( 'contains only readonly value properties', () => {
			expect( Object.values( accessor.value ).every( isReadonly ) ).toBe( true )
		} );
		test( 'is privately mutable only', () => expect(() => {
			// @ts-expect-error
			accessor.value = expect.anything()
		}).toThrow( SET_ERROR`value` ) );
	} );
	describe( 'addClient(...)', () => {
		test( 'adds new client id to `clients`', () => {
			const numClients = accessor.numClients;
			const id = expect.any( String ) as unknown as string;
			accessor.addClient( id );
			expect( accessor.numClients ).toBe( numClients + 1 );
			accessor.removeClient( id );
		} );
		test( 'ignores requests to add existing clients', () => {
			const id = expect.any( String ) as unknown as string;
			accessor.addClient( id );
			const numClients = accessor.numClients;
			accessor.addClient( id );
			accessor.addClient( id );
			expect( accessor.numClients ).toBe( numClients );
			accessor.removeClient( id );
		} );
	} );
	describe( 'hasClient(...)', () => {
		test( 'returns `false` if client not found in `clients`', () => {
			const id = expect.any( String ) as unknown as string;
			accessor.removeClient( id );
			expect( accessor.hasClient( id ) ).toBe( false );
		} );
		test( 'returns `true` if client found in `clients`', () => {
			const id = expect.any( String ) as unknown as string;
			accessor.addClient( id );
			expect( accessor.hasClient( id ) ).toBe( true );
			accessor.removeClient( id );
		} );
	} );
	describe( 'removeClient(...)', () => {
		test( 'removes client id from `clients`', () => {
			const id = expect.any( String ) as unknown as string;
			accessor.addClient( id );
			const numClients = accessor.numClients;
			accessor.removeClient( id );
			expect( accessor.numClients ).toBe( numClients - 1 );
		} );
		test( 'ignores requests to remove non-existing clients', () => {
			const id = expect.any( String ) as unknown as string;
			accessor.addClient( id );
			accessor.removeClient( id );
			const numClients = accessor.numClients;
			accessor.removeClient( id );
			accessor.removeClient( id );
			expect( accessor.numClients ).toBe( numClients );
		} );
	} );
	describe( 'refreshValue(...)', () => {
		let accessor, accessedPropertyPaths;
		/** @type {(state?: {[x:string]:*}, paths?: string[]) => {[path: string]: Atom<string>}} */
		let createAccessorAtoms;
		let source, initVal, retVal, retValExpected, runTest;
		beforeAll(() => {
			source = createSourceData();
			retValExpected = {
				address: '760 Midwood Street, Harborton, Massachusetts, 7547',
				'friends[1].id': 1,
				'friends[1].name.last': 'Roberson',
				'history.places[2].year': '2017',
				'registered.time': {
					hours: 9,
					minutes: 55,
					seconds: 46
				},
				'tags[4]': 'ullamco'
			};
			accessedPropertyPaths = Object.keys( retValExpected );
			createAccessorAtoms = ( state = source, paths = accessedPropertyPaths ) => paths.reduce(( a, p ) => {
				a[ p ] = new Atom( getProperty( state, p ).value );
				return a;
			}, {});
			accessor = new Accessor( accessedPropertyPaths );
			initVal = accessor.value;
			retVal = accessor.refreshValue( createAccessorAtoms( source ) );
			runTest = createAccessor => {
				const source = createSourceData();
				const updates = {
					about: 'SOME TEST TEXT',
					address: 'SOME TEST TEXT',
					age: 52,
					balance: 268957
				};
				const updatedPaths = Object.keys( updates );
				const accessedPropertyPaths = [ 'id', ...updatedPaths, 'company', 'email', 'eyeColor', 'favoriteFruit', 'friends.name' ];
				const accessor = createAccessor( accessedPropertyPaths );
				const atomMap = createAccessorAtoms( source, accessedPropertyPaths );
				accessor.refreshValue( atomMap );
				updatedPaths.forEach( p => {
					source[ p ] = updates[ p ];
					atomMap[ p ].setValue( updates[ p ] );
				} );
				accessor.outdatedPaths = updatedPaths;
				expect( accessor.refreshValue( atomMap ) ).toEqual( expect.objectContaining( updates ) );
			};
		});
		test( "immediately constructs atoms' current values into an accessor value", () => {
			expect( initVal ).toEqual( retValExpected );
			expect( accessor.value ).toEqual( retValExpected );
			expect( retVal ).toBe( initVal );
		} );
		test( 'returns the latest constructed value', () => expect( retVal ).toEqual( retValExpected ) );
		test( 'ensures readonly property values', () => {
			expect( Object.values( accessor.value ).every( isReadonly ) ).toBe( true );
		} );
		describe( 'attempts to reference non-existent atoms', () => {
			test( 'are ignored', () => runTest( accessedPropertyPaths => new Accessor([ ...accessedPropertyPaths, 'UNKNOWN' ])) );
		} );
		describe( 'when updated paths < resident accessor paths while resident accessor paths > MODERATE_NUM_PATHS_THRESHOLD', () => {
			// @ts-expect-error
			test( 'optimizes refresh operation (coverage test)', () => runTest(( ...args ) => new Accessor( ...args )) )
		} );
	} );
} );
