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
export default function binsearch(values, value, comparator) {
  if (comparator) {
    return _comparator(values, value, comparator);
  }
  return _base(values, value);
}

function _base(values, value) {
  for (var min = 0, max = values.length - 1; min <= max; ) {
    var mid = min + max >> 1, midValue = values[mid];
    if (midValue > value) {
      max = mid - 1;
    } else if (midValue < value) {
      min = mid + 1;
    } else {
      return mid;
    }
  }
  return ~min;
}

function _comparator(values, value, comparator) {
  for (var min = 0, max = values.length - 1; min <= max; ) {
    var mid = min + max >> 1, midValue = values[mid];
    var res = comparator(midValue, value);
    if (res > 0) {
      max = mid - 1;
    } else if (res < 0) {
      min = mid + 1;
    } else {
      return mid;
    }
  }
  return ~min;
}
