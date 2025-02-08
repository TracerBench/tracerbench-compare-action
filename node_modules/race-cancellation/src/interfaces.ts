/**
 * A symbol that brands a Cancellation.
 *
 * This symbol is a runtime registered symbol so that if multiple
 * versions of the module are loaded it interops.
 *
 * So that for an unknown x
 * `typeof x === "object" && x !== null && Symbol.for("isCancellation") in x`
 */
export const cancellationBrand = Symbol.for("isCancellation");

export const enum CancellationKind {
  /**
   * General cancellation request.
   */
  Cancellation = "Cancellation",

  /**
   * The task timed out.
   */
  Timeout = "Timeout",

  /**
   * A concurrent branch was the winner in a `Promise.race`
   * or failed in a `Promise.all`
   */
  ShortCircuit = "ShortCircuit",
}

export interface Cancellation<Kind extends string = string> {
  [cancellationBrand]: true;
  kind: Kind;
  message: string;
}

export type Complete<Result> = (result: Result) => void;

export type RaceCancellation = <Result>(
  task: Task<Result> | PromiseLike<Result>
) => Promise<Result | Cancellation>;

export type NewCancellation = () => Cancellation;

export type Task<Result> = () => PromiseLike<Result>;

export type CancellableTask<Result> = (
  raceCancellation: RaceCancellation
) => Promise<Result | Cancellation>;

export type OptionallyCancellableTask<Result> = (
  raceCancellation?: RaceCancellation
) => Promise<Result | Cancellation>;

export type Cancel = (message?: string, kind?: string) => void;

export type CancellableRace = [RaceCancellation, Cancel];

export type Executor<Result> = (
  resolve: (value?: Result | PromiseLike<Result>) => void,
  reject: (reason?: any) => void
) => Dispose;

export type Dispose = () => void;

export type NewTimeout = (callback: () => void, ms: number) => Dispose;

export type NewTimeoutCancellation = () => Cancellation<
  CancellationKind.Timeout
>;
