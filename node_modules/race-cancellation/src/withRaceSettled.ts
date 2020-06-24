import newCancellableRace from "./cancellableRace";
import combineRaceCancellation from "./combineRaceCancellation";
import {
  CancellableTask,
  CancellationKind,
  OptionallyCancellableTask,
  RaceCancellation,
} from "./interfaces";

/**
 * Wrap a cancellable task combining its input `RaceCancellation` with a race against the task
 * being settled, so that if any cancellable sub-tasks are combined with `Promise.all`
 * or `Promise.race` they will be cancelled if their branch was short circuited by
 * another branch rejecting in a `Promise.all` or their branch lost to another branch in a
 * `Promise.race`.
 *
 * @param task a cancellable task
 * @returns an optionally cancellable task
 */
export default function withRaceSettled<Result>(
  task: CancellableTask<Result>
): OptionallyCancellableTask<Result> {
  const [raceWinner, cancelLosers] = newCancellableRace();

  return async (raceCancellation?: RaceCancellation) => {
    try {
      const combined = combineRaceCancellation(raceCancellation, raceWinner);
      return await task(combined);
    } finally {
      cancelLosers(
        "the task was short-circuited by another concurrent task winning a Promise.race or rejecting a Promise.all",
        CancellationKind.ShortCircuit
      );
    }
  };
}
