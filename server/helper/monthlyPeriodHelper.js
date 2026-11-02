function buildMonthlyPeriodKey(memberId, kegiatanId, year, month) {
  const normalizedMemberId = Number(memberId);
  const normalizedKegiatanId = Number(kegiatanId);
  const normalizedYear = Number(year);
  const normalizedMonth = Number(month);

  if (
    !Number.isInteger(normalizedMemberId) ||
    normalizedMemberId <= 0 ||
    !Number.isInteger(normalizedKegiatanId) ||
    normalizedKegiatanId <= 0 ||
    !Number.isInteger(normalizedYear) ||
    normalizedYear < 2000 ||
    !Number.isInteger(normalizedMonth) ||
    normalizedMonth < 1 ||
    normalizedMonth > 12
  ) {
    return null;
  }

  return `${normalizedMemberId}:${normalizedKegiatanId}:${normalizedYear}:${normalizedMonth}`;
}

module.exports = {
  buildMonthlyPeriodKey,
};
