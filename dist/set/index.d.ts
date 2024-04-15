import type { Changes, Listener, Value } from '../types';
export default setValue;
declare function setValue<T extends Value>(value: T, changes: Changes<T>, onValueChange?: Listener): void;
