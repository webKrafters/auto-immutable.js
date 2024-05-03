import type { Changes, Listener, Value } from './types';
import setValue from './set';
import AccessorCache from './model/accessor-cache';
export declare const deps: {
    noop: () => void;
    setValue: typeof setValue;
};
export declare class Connection<T extends Value> {
    #private;
    constructor(id: string, cache: AccessorCache<T>);
    get disconnected(): boolean;
    get instanceId(): string;
    disconnect(): void;
    get(...propertyPaths: Array<string>): import("./types").AccessorResponse;
    set(changes: Changes<T>, onComplete?: Listener): void;
}
