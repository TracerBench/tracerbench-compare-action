import {
  Cancellation,
  cancellationBrand,
  CancellationKind,
} from "./interfaces";

/**
 * Creates a new `Cancellation`.
 *
 * @param name
 * @param message the cancellation error message, defaults to "cancelled"
 */
export default function newCancellation(
  kind: undefined,
  message?: string
): Cancellation<CancellationKind.Cancellation>;

/**
 * Creates a new `Cancellation`.
 *
 * @param name the cancellation name
 * @param message the cancellation error message, defaults to "the task was cancelled"
 */
export default function newCancellation<Kind extends string>(
  kind: Kind,
  message?: string
): Cancellation<Kind>;

/**
 * Creates a new `Cancellation`.
 *
 * @param kind optional kind, defaults to `CancellationKind.Cancellation`
 * @param message the cancellation error message, defaults to "the task was cancelled"
 */
export default function newCancellation<Kind extends string>(
  kind?: Kind,
  message?: string
): Cancellation<Kind | CancellationKind.Cancellation>;

export default function newCancellation(
  kind = CancellationKind.Cancellation,
  message = "the task was cancelled"
): Cancellation {
  return {
    [cancellationBrand]: true,
    kind,
    message,
  };
}
