# array-binsearch

A library for performing a binary search on an array with insertion support.

Supports typescript usage and rollup.

## Example

### Basic

```
var binsearch = require("./index").default;
var sortedSet = [2, 4, 6, 8, 9, 11];

function add(set, val) {
  var i = binsearch(set, val);
  if (i < 0) {
    i = ~i;
    set.splice(i, 0, val);
  }
}

add(sortedSet, 4);
add(sortedSet, 3);
add(sortedSet, 8);
add(sortedSet, 20);
add(sortedSet, -1);

console.log(sortedSet);

// => [ -1, 2, 3, 4, 6, 8, 9, 11, 20 ]

```

### With Comparator

```
var binsearch = require("./index").default;
var sortedSet = [2, 4, 6, 8, 9, 11];
function comparator(a, b) {
  return a - b;
}

function add(set, val) {
  var i = binsearch(set, val);
  if (i < 0) {
    i = ~i;
    set.splice(i, 0, val);
  }
}

add(sortedSet, 4);
add(sortedSet, 3);
add(sortedSet, 8);
add(sortedSet, 20);
add(sortedSet, -1);

console.log(sortedSet);

// => [ -1, 2, 3, 4, 6, 8, 9, 11, 20 ]

```
