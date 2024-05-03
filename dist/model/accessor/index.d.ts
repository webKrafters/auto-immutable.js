import type { AccessorPayload, AccessorResponse } from '../../types';
declare class Accessor {
    #private;
    outdatedPaths: Array<string>;
    constructor(accessedPropertyPaths: Array<string>);
    get numClients(): number;
    get id(): number;
    get paths(): string[];
    get value(): AccessorResponse;
    addClient(clientId: string): void;
    hasClient(clientId: string): boolean;
    removeClient(clientId: string): boolean;
    /** @param atoms - Curated slices of value object currently requested */
    refreshValue(atoms: AccessorPayload): AccessorResponse;
}
export default Accessor;
