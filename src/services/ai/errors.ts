export type ButterflyAiErrorCode =
  | 'invalid-settings'
  | 'missing-image'
  | 'timeout'
  | 'aborted'
  | 'network'
  | 'http-error'
  | 'parse-error';

export class ButterflyAiError extends Error {
  readonly code: ButterflyAiErrorCode;
  readonly status?: number;
  readonly retriable: boolean;
  readonly causeValue?: unknown;

  constructor(
    code: ButterflyAiErrorCode,
    message: string,
    options: { status?: number; retriable?: boolean; cause?: unknown } = {},
  ) {
    super(message);
    this.name = 'ButterflyAiError';
    this.code = code;
    this.status = options.status;
    this.retriable = options.retriable ?? false;
    this.causeValue = options.cause;
  }
}

export function isButterflyAiError(value: unknown): value is ButterflyAiError {
  return value instanceof Error && value.name === 'ButterflyAiError' && 'code' in value;
}

