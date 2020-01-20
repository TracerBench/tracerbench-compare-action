/**
 * This callback type is called `requestCallback` and is displayed as a global symbol.
 *
 * @callback comparator
 * @param {any} a
 * @param {any} b
 * @return {number} 0 for equal, positive for greater than, negative for less than
 */

/**
 * Perform a binary search on a sorted array of values.
 * @param {any[]}   values - an array of sorted values to search
 * @param {any}     value - a value to search for
 * @param {comparator} [comparator] - an optional comparator
 * @return {number} if positive the index of the value else
 *                  the bitwise negation of the insertion index
 *                  that would maintain sort order.
 */
export default function binsearch<T>(values: T[], value: T, comparator?: (a: T, b: T) => number): number;
