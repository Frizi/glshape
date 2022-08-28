export function assert(
  condition: boolean,
  message?: string
): asserts condition {
  if (!condition) {
    throw new Error(
      message ? "Assertion failed: " + message : "Assertion failed"
    );
  }
}

export function assertNever(_x: never): never {
  throw new Error("Unreachable");
}
