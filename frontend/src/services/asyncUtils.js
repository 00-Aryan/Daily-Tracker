export function isAbortError(error) {
  return error?.code === 'ERR_CANCELED' || error?.name === 'AbortError';
}

export function is404(error) {
  return error?.response?.status === 404;
}

export function getSettledData(result, fallback = null) {
  if (result.status === 'fulfilled') {
    return result.value?.data ?? fallback;
  }
  // Treat 404 as valid empty state — return empty array fallback
  if (result.status === 'rejected' && is404(result.reason)) {
    return Array.isArray(fallback) ? [] : fallback;
  }
  return fallback;
}

export function hasSettledFailure(results) {
  return results.some(
    (result) =>
      result.status === 'rejected' &&
      !isAbortError(result.reason) &&
      !is404(result.reason),
  );
}
