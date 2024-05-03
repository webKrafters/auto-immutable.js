import type { PropertyInfo } from '@webkrafters/get-property';
import get from '@webkrafters/get-property';
export type Transform = <T>(property: PropertyInfo) => T;
/**
 * Curates the most inclusive propertyPaths from a list of property paths.
 * @example
 * arrangePropertyPaths(["a.b.c.d", "a.b", "a.b.z[4].w", "s.t"]) => ["a.b", "s.t"].
 * "a.b" is inclusive of "a.b.c.d": "a.b.c.d" is a subset of "a.b." but not vice versa.
 * "a.b" is inclusive of "a.b.z[4].w": "a.b.z[4].w" is a subset of "a.b." but not vice versa.
 */
export declare function arrangePropertyPaths(propertyPaths: Array<string>): Array<string>;
/**
 * Built on top of lodash.clonedeepwith.\
 * Instances of non-native classes not implementing either the `clone` or the `cloneNode
 * methods may not be cloneable. Such instances are retured uncloned.
 */
export declare const clonedeep: <T, R = T>(value: T) => R;
export declare const getProperty: typeof get;
/** Checks if value is either a plain object or an array */
export declare function isDataContainer(v: any): boolean;
/**
 * Converts argument to readonly.
 *
 * Note: Mutates original argument.
 */
export declare function makeReadonly<T>(v: T): Readonly<T>;
export declare const stringToDotPath: (path: string) => string;
/**
 * Pulls propertyPath values from state and
 * compiles them into a partial state object.
 */
export declare function mapPathsToObject<T>(source: T, propertyPaths: Array<string>, transform?: Transform): Partial<T>;
