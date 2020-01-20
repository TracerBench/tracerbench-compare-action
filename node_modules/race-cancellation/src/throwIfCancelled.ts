import { Cancellation, cancellationBrand } from "./interfaces";
import isCancellation from "./isCancellation";

/**
 * Throw if the `result` is a `Cancellation` otherwise return it.
 * @param result the result of a cancellable task.
 */
export default function throwIfCancelled<Result>(
  result: Result | Cancellation
): Result {
  if (isCancellation(result)) {
    const error = new Error(result.message) as Error & Cancellation;
    error.name = `${result.kind}Error`;
    error.kind = result.kind;
    error[cancellationBrand] = true;
    throw error;
  }
  return result;
}
