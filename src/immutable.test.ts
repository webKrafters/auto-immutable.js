import AccessorCache from "./model/accessor-cache";
import { Immutable } from "./immutable";

describe( 'Immutable class', () => {
    let iCacheGetSpy, iCacheUnlinkSpy;
    beforeAll(() => {
        iCacheGetSpy = jest
            .spyOn( AccessorCache.prototype, 'get' )
            .mockReturnValue({});
        iCacheUnlinkSpy = jest
            .spyOn( AccessorCache.prototype, 'unlinkClient' )
            .mockReturnValue( undefined );
    });
    beforeEach(() => {
        iCacheGetSpy.mockClear();
        iCacheUnlinkSpy.mockClear();
    });
    afterAll(() => {
        iCacheGetSpy.mockRestore();
        iCacheUnlinkSpy.mockRestore();
    });
    test( 'constructs an immutable instance', () => {
        const expectedId = expect.any( String );
        const im = new Immutable(
            expectedId,
            expect.any( AccessorCache ),
            expect.any( Function )
        );
        expect( im.instanceId ).toBe( expectedId );
        expect( im.disposed ).toBe( false );
    } );
    test(
        'gets from cache value(s) located at properyPath(s)',
        () => {
            const expectedId = expect.any( String );
            const im =new Immutable(
                expectedId,
                new AccessorCache({}),
                expect.any( Function )
            );
            const popertyPaths = [ '1', '2', '3', '4' ];
            im.get( ...popertyPaths );
            expect( iCacheGetSpy ).toHaveBeenCalledTimes( 1 );
            expect( iCacheGetSpy ).toHaveBeenCalledWith(
                expectedId, ...popertyPaths
            )
        }
    );
    test(
        'updates the cache data with new changes',
        () => {
            const expectedId = expect.any( 'TEST_ID' );
            const expectedSourceData = expect.any( Object );
            const updater = jest.fn();
            const updateCompleteListener = expect.any( Function );
            const changes = expect.any( Object );
            const im = new Immutable(
                expectedId,
                new AccessorCache( expectedSourceData ),
                updater
            );
            im.set( changes, updateCompleteListener );
            expect( updater ).toHaveBeenCalledTimes( 1 );
            expect( updater ).toHaveBeenCalledWith(
                expectedSourceData,
                changes,
                updateCompleteListener
            );
        }
    );
    describe( 'disposal', () => {
        test(
            'discards internally held refs and sets `disposed` flag',
            () => {
                const updateFn = jest.fn();
                const im = new Immutable(
                    expect.any( String ),
                    new AccessorCache( expect.any( Object ) ),
                    updateFn
                )
                im.dispose();
                expect( im.disposed ).toBe( true );
                im.get( expect.any( Array ) );
                expect( iCacheGetSpy ).not.toHaveBeenCalled();
                im.set( {}, jest.fn() );
                expect( updateFn ).not.toHaveBeenCalled();
            }
        );
        test(
            'once disposed ignores further disposal request',
            () => {
                const im = new Immutable(
                    expect.any( String ),
                    new AccessorCache( expect.any( String ) ),
                    expect.any( Function )
                )
                im.dispose();
                expect( iCacheUnlinkSpy ).toHaveBeenCalledTimes( 1 );
                iCacheUnlinkSpy.mockClear();
                im.dispose();
                expect( iCacheUnlinkSpy ).not.toHaveBeenCalled();
                iCacheUnlinkSpy.mockClear();
                im.dispose();
                expect( iCacheUnlinkSpy ).not.toHaveBeenCalled();
            }
        );
    } );
} );