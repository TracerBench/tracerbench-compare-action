import { NewTimeout } from "./interfaces";

export type TimeoutID = unknown;

declare const setTimeout: (
  callback: () => void,
  miliseconds: number
) => TimeoutID;
declare const clearTimeout: (id: TimeoutID) => void;

/**
 * Default CreateTimeout implementation using setTimeout/clearTimeout, allows
 */
const newTimeoutDefault: NewTimeout = (() => {
  /* istanbul ignore if */
  if (typeof setTimeout !== "function") {
    // setTimeout is not actually part of the script host definition
    // but the expectation is that if you are running on a host that
    // doesn't have setTimeout defined is that you do not rely on the
    // default
    return undefined as never;
  }

  function newTimeout(callback: () => void, miliseconds: number) {
    const id = setTimeout(callback, miliseconds);
    return () => clearTimeout(id);
  }

  return newTimeout;
})();

export default newTimeoutDefault;
