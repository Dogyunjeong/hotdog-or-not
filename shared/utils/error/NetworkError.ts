/**
 * The request never got a response (offline, DNS, connection reset).
 * Thrown by the shared HTTP helpers so callers can tell "no connection" apart from bugs.
 */
class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Network request failed', { cause });
    this.name = 'NetworkError';
  }
}

export default NetworkError;
