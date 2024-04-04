import { Immutable } from "./immutable";
import { deps, ImmutableFactory } from ".";

describe( 'ImmutableFactory class', () => {
    test( 'creates an Immutable instance factory', () => {
        expect( new ImmutableFactory({}).getInstance() ).toBeInstanceOf( Immutable );
    } );
    test( '', () => {
        deps.setValue = jest.fn();
        const value = {};
        const changes = {};
        const im = new ImmutableFactory( value ).getInstance();
        im.set( changes );
        expect( deps.setValue ).toHaveBeenCalledTimes( 1 );
        expect( deps.setValue ).toHaveBeenCalledWith( value, changes, expect.any( Function ) );
        ( deps.setValue as jest.Mock ).mockRestore();
    } );
} );