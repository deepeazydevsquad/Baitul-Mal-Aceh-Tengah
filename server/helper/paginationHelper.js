const MAX_PAGE_SIZE = 100;

function clampPagination(values) {
  if (!values || typeof values !== "object") return values;

  for (const key of ["perpage", "pageSize"]) {
    if (values[key] === undefined) continue;
    const parsed = Number.parseInt(values[key], 10);
    values[key] = String(
      Number.isFinite(parsed)
        ? Math.min(MAX_PAGE_SIZE, Math.max(1, parsed))
        : 10
    );
  }

  for (const key of ["page", "pageNumber"]) {
    if (values[key] === undefined) continue;
    const parsed = Number.parseInt(values[key], 10);
    values[key] = String(
      Number.isFinite(parsed) ? Math.max(1, parsed) : 1
    );
  }
  return values;
}

function clampPaginationMiddleware(req, res, next) {
  clampPagination(req.body);
  clampPagination(req.query);
  return next();
}

module.exports = {
  MAX_PAGE_SIZE,
  clampPagination,
  clampPaginationMiddleware,
};
