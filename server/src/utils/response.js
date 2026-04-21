export function ok(data = {}, message) {
  return { success: true, ...(message ? { message } : {}), data };
}

export function fail(error, status = 400, extras = {}) {
  const err = new Error(error);
  err.status = status;
  Object.assign(err, extras);
  return err;
}
