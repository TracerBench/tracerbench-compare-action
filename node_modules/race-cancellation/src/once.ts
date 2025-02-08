import { Thunk, thunkBrand } from "./internal";
export default function once<Result>(force: () => Result): Thunk<Result> {
  let unforced = true;
  let result: Result;
  const thunk = (() => {
    if (unforced) {
      result = force();
      unforced = false;
    }
    return result;
  }) as Thunk<Result>;
  thunk[thunkBrand] = true;
  return thunk;
}
