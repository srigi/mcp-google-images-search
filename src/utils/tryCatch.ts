/* eslint-disable @typescript-eslint/no-explicit-any */
export type OperationSuccess<T> = readonly [error: null, data: T];
export type OperationFailure<E> = readonly [error: E];
export type OperationResult<T, E> = OperationSuccess<T> | OperationFailure<E>;

type Operation<T> = Promise<T> | (() => T) | (() => Promise<T>);

function isPromise<T = any>(value: unknown): value is Promise<T> {
  return !!value && (typeof value === 'object' || typeof value === 'function') && typeof (value as any).then === 'function';
}

function onSuccess<T>(value: T): OperationSuccess<T> {
  return [null, value];
}

function onFailure<E>(error: unknown): OperationFailure<E> {
  const errorParsed = error instanceof Error ? error : new Error(String(error));

  return [errorParsed as E];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function tryCatch<E extends Error, T>(operation: () => never): OperationResult<never, E>;
export function tryCatch<E extends Error, T>(operation: () => T): OperationResult<T, E>;
export function tryCatch<E extends Error, T>(operation: () => Promise<T>): Promise<OperationResult<T, E>>;
export function tryCatch<E extends Error, T>(operation: Promise<T>): Promise<OperationResult<T, E>>;
export function tryCatch<E extends Error, T>(operation: Operation<T>): OperationResult<T, E> | Promise<OperationResult<T, E>> {
  try {
    const result = typeof operation === 'function' ? operation() : operation;

    if (isPromise(result)) {
      return Promise.resolve(result)
        .then((data) => onSuccess(data))
        .catch((error) => onFailure(error));
    }

    return onSuccess(result);
  } catch (error) {
    return onFailure<E>(error);
  }
}
