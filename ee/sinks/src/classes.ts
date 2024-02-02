export class WithExponentialBackoff {
  /**
   * Calculates the next timeout value for exponential backoff.
   * @param waitFor The current timeout value.
   * @returns The next timeout value.
   */
  public getNextExponentialBackoff(waitFor: number): number {
    // Double the wait time until it reaches 60 seconds
    return waitFor * 2 > 60000 ? 60000 : waitFor * 2;
  }
}
