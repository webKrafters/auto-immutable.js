import type { AccessorResponse, Changes, Value } from '../../types';
declare class AccessorCache<T extends Value> {
    #private;
    /** @param origin - Value object reference from which slices stored in this cache are to be curated */
    constructor(origin: T);
    get origin(): T;
    /** atomizes value property changes */
    atomize(originChanges: Changes<T>): void;
    /**
     * Gets value object slice from the cache matching the `propertyPaths`.\
     * If not found, creates a new entry for the client from source, and returns it.
     */
    get(clientId: string, ...propertyPaths: Array<string>): AccessorResponse;
    /** Unlinks a consumer from the cache: performing synchronized value cleanup */
    unlinkClient(clientId: string): void;
}
export default AccessorCache;
