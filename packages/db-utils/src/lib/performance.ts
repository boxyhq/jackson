/**
 * To calculate the function speed
 *
 * @param {(...args: any[]) => T} func
 * @param {any[]} args
 * @returns
 */
export function calculateFunctionSpeed<T>(
  func: (...args: any[]) => T,
  ...args: any[]
): [number, T] {
  const startTime = performance.now();
  const res = func(...args);
  const endTime = performance.now();
  const executionTime = endTime - startTime;

  return [executionTime, res];
}
