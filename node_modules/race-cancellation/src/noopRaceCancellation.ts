import { RaceCancellation, Task } from "./interfaces";

/**
 * Allows an async function to add raceCancellation as an optional param
 * in a backwards compatible way by using this as the default.
 */
const noopRaceCancellation: RaceCancellation = <Result>(
  task: Task<Result> | PromiseLike<Result>
): Promise<Result> =>
  typeof task === "function"
    ? Promise.resolve().then(task)
    : Promise.resolve(task);

export default noopRaceCancellation;
