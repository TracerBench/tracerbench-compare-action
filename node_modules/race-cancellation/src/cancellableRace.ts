import { Cancel, RaceCancellation } from "./interfaces";
import { Cancellation } from "./interfaces";
import newCancellation from "./newCancellation";
import newRaceCancellation from "./newRaceCancellation";
import oneshot from "./oneshot";

/**
 * Returns a tuple of a `RaceCancellation` with a cancel function that cancels it.
 */
export default function cancellableRace(): [RaceCancellation, Cancel] {
  const [cancellation, cancel] = oneshot<Cancellation>();
  const raceCancellation = newRaceCancellation(cancellation);
  return [
    raceCancellation,
    (message?: string, name?: string) => cancel(newCancellation(name, message)),
  ];
}
