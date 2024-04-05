import AccessorCache from "./model/accessor-cache";
import { deps, Connection } from "./connection";

describe( 'Connection class', () => {
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
    test( 'constructs an immutable connection instance', () => {
        const expectedId = expect.any( String );
        const cn = new Connection(
            expectedId,
            expect.any( AccessorCache )
        );
        expect( cn.instanceId ).toBe( expectedId );
        expect( cn.disconnected ).toBe( false );
    } );
    test(
        'gets from cache value(s) located at properyPath(s)',
        () => {
            const expectedId = expect.any( String );
            const cn = new Connection(
                expectedId,
                new AccessorCache({})
            );
            const popertyPaths = [ '1', '2', '3', '4' ];
            cn.get( ...popertyPaths );
            expect( iCacheGetSpy ).toHaveBeenCalledTimes( 1 );
            expect( iCacheGetSpy ).toHaveBeenCalledWith( expectedId, ...popertyPaths );
        }
    );
    test(
        'updates the cache data with new changes',
        () => {
            const expectedId = expect.any( 'TEST_ID' );
            const expectedSourceData = expect.any( Object );
            const origSetter = deps.setValue;
            deps.setValue = jest.fn();
            const updateCompleteListener = expect.any( Function );
            const changes = expect.any( Object );
            const cn = new Connection(
                expectedId,
                new AccessorCache( expectedSourceData )
            );
            cn.set( changes, updateCompleteListener );
            expect( deps.setValue ).toHaveBeenCalledTimes( 1 );
            expect( deps.setValue ).toHaveBeenCalledWith(
                expectedSourceData,
                changes,
                updateCompleteListener
            );
            deps.setValue = origSetter;
        }
    );
    describe( 'disconnection', () => {
        test(
            'discards internally held refs and sets `disconnected` flag',
            () => {
                const origSetter = deps.setValue;
                deps.setValue = jest.fn();
                const cn = new Connection(
                    expect.any( String ),
                    new AccessorCache( expect.any( Object ) )
                )
                cn.disconnect();
                expect( cn.disconnected ).toBe( true );
                cn.get( expect.any( Array ) );
                expect( iCacheGetSpy ).not.toHaveBeenCalled();
                cn.set( {}, jest.fn() );
                expect( deps.setValue ).not.toHaveBeenCalled();
                deps.setValue = origSetter;
            }
        );
        test(
            'once disconnected ignores further disconnection requests',
            () => {
                const cn = new Connection(
                    expect.any( String ),
                    new AccessorCache( expect.any( String ) )
                )
                cn.disconnect();
                expect( iCacheUnlinkSpy ).toHaveBeenCalledTimes( 1 );
                iCacheUnlinkSpy.mockClear();
                cn.disconnect();
                expect( iCacheUnlinkSpy ).not.toHaveBeenCalled();
                iCacheUnlinkSpy.mockClear();
                cn.disconnect();
                expect( iCacheUnlinkSpy ).not.toHaveBeenCalled();
            }
        );
    } );
} );