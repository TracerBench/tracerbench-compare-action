import { Dispose, Executor } from "./interfaces";
import noop from "./noopRaceCancellation";

export default async function disposablePromise<Result>(
  executor: Executor<Result>,
  raceCancellation = noop
) {
  let dispose: Dispose | undefined;
  try {
    return await raceCancellation(
      () =>
        new Promise<Result>((resolve, reject) => {
          dispose = executor(resolve, reject);
        })
    );
  } finally {
    if (dispose !== undefined) {
      dispose();
    }
  }
}
