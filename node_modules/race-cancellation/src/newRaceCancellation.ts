import { Cancellation, RaceCancellation, Task } from "./interfaces";
import { hasCompleted, Oneshot } from "./internal";
import isCancellation from "./isCancellation";
import newCancellation from "./newCancellation";
import { intoOneshot } from "./oneshot";

/**
 * Create a race cancellation function.
 *
 * @param cancellation lazily builds the cancellation promise chain.
 * @param newCancellation a function that creates the cancellation result.
 */
export default function newRaceCancellation(
  cancellation: () => PromiseLike<unknown>,
  cancellationMessage?: string,
  cancellationKind?: string
): RaceCancellation {
  const cancellationOneshot = intoOneshot(cancellation);
  const intoCancellation = newIntoCancellation(
    cancellationMessage,
    cancellationKind
  );
  return task => raceCancellation(cancellationOneshot, task, intoCancellation);
}

function raceCancellation<Result>(
  cancellation: Oneshot<unknown>,
  task: Task<Result> | PromiseLike<Result>,
  intoCancellation: IntoCancellation
): Promise<Result | Cancellation> {
  return typeof task === "function"
    ? cancellation[hasCompleted]
      ? cancellation().then(intoCancellation)
      : Promise.race([task(), cancellation().then(intoCancellation)])
    : Promise.race([task, cancellation().then(intoCancellation)]);
}

function newIntoCancellation(
  cancellationMessage?: string,
  cancellationKind?: string
): IntoCancellation {
  return function intoCancellation(result: unknown) {
    if (isCancellation(result)) {
      return result;
    }
    return newCancellation(cancellationKind, cancellationMessage);
  };
}

type IntoCancellation = (result: unknown) => Cancellation;
