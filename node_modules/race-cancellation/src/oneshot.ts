import { Complete } from "./interfaces";
import { hasCompleted, Oneshot, thunkBrand } from "./internal";
import once from "./once";

/**
 * Creates a tuple of a function to lazily build a promise of a one time event
 * and a method to complete the promise.
 */
export default function oneshot<Result>(): [
  () => Promise<Result>,
  Complete<Result>
] {
  let result: Result | undefined;
  let onResolve: Complete<Result> | undefined;

  const thunk = once(() =>
    thunk[hasCompleted]
      ? Promise.resolve(result as Result)
      : new Promise(resolve => {
          onResolve = resolve;
        })
  ) as Oneshot<Result>;
  thunk[thunkBrand] = true;
  thunk[hasCompleted] = false;

  const complete: Complete<Result> = value => {
    if (thunk[hasCompleted]) {
      return;
    }
    thunk[hasCompleted] = true;
    result = value;
    if (onResolve !== undefined) {
      onResolve(value);
    }
  };

  return [thunk, complete];
}

function isOneshot<Result>(
  task: () => PromiseLike<Result>
): task is Oneshot<Result> {
  return thunkBrand in task && hasCompleted in task;
}

export function intoOneshot<Result>(
  task: () => PromiseLike<Result>
): Oneshot<Result> {
  if (isOneshot(task)) {
    return task;
  }
  const thunk = once(async () => {
    try {
      return await task();
    } finally {
      thunk[hasCompleted] = true;
    }
  }) as Oneshot<Result>;
  thunk[hasCompleted] = false;
  return thunk;
}
