/**
 * An atom represents an entry for each individual property\
 * path of the value still in use by client components
 */
declare class Atom<T = any> {
    #private;
    /** @param {T|Readonly<T>} [value] */
    constructor(value?: any);
    get value(): any;
    /**
     * @param {number} accessorId
     * @returns {number} Number of connections remaining
     */
    connect(accessorId: any): any;
    /**
     * @param {number} accessorId
     * @returns {number} Number of connections remaining
     */
    disconnect(accessorId: any): any;
    /** @param {number} accessorId */
    isConnected(accessorId: any): any;
    /** @param {T|Readonly<T>} newValue */
    setValue(newValue: any): void;
}
export default Atom;
