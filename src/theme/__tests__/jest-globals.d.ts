declare const describe: (name: string, fn: () => void | Promise<void>) => void;
declare const it: (name: string, fn: () => void | Promise<void>) => void;
declare const expect: {
  (value: unknown): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toContain(expected: unknown): void;
    toBeTruthy(): void;
    toHaveBeenCalledTimes(expected: number): void;
  };
};

declare const jest: {
  fn: <T extends (...args: unknown[]) => unknown = (...args: unknown[]) => unknown>() => T;
};
