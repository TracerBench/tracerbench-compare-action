import {
  CancellableTask,
  CancellationKind,
  NewTimeout,
  OptionallyCancellableTask,
} from "./interfaces";
import sleep from "./sleep";
import withRaceCancellationTask from "./withRaceCancellationTask";

/**
 * Wrap a cancellable task with a timeout.
 *
 * ```js
 * async function fetchWithTimeout(url, timeoutMs, raceCancellation) {
 *   return await withRaceTimeout(raceTimeout => {
 *      return await cancellableFetch(url, raceTimeout));
 *   }, timeoutMs)(raceCancellation);
 * }
 * ```
 *
 * @param task a cancellable task
 * @param milliseconds timeout in miliseconds
 * @param message optional cancellation message
 * @param newTimeout optional implementation of timeout creation for testing
 */
export default function withRaceTimeout<Result>(
  task: CancellableTask<Result>,
  milliseconds: number,
  message?: string,
  newTimeout?: NewTimeout
): OptionallyCancellableTask<Result> {
  return withRaceCancellationTask(
    task,
    raceCancellation => sleep(milliseconds, raceCancellation, newTimeout),
    message || `task took longer than ${milliseconds}ms`,
    CancellationKind.Timeout
  );
}
