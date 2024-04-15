import type { Value } from './types';
import { Connection } from './connection';
export declare const deps: {
    numCreated: number;
};
export declare class Immutable<T extends Value = Value> {
    #private;
    constructor(initValue: T);
    connect(): Connection<T>;
}
