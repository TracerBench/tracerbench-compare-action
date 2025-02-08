export const thunkBrand = Symbol("thunkResult");
export const hasCompleted = Symbol("hasCompleted");

export interface Thunk<T> {
  [thunkBrand]: true;
  (): T;
}

export interface Oneshot<Result> extends Thunk<Promise<Result>> {
  [hasCompleted]: boolean;
}
