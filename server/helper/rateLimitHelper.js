const attempts = new Map();
let persistentRequestCount = 0;

function pruneExpired(now) {
  for (const [key, entry] of attempts.entries()) {
    if (entry.resetAt <= now) attempts.delete(key);
  }
}

function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 10,
  maxEntries = 10_000,
  keyGenerator = (req) => req.ip,
  message = "Terlalu banyak percobaan. Silakan coba lagi nanti.",
} = {}) {
  return (req, res, next) => {
    const now = Date.now();
    pruneExpired(now);

    const key = String(keyGenerator(req) || "unknown");
    const current = attempts.get(key);
    const entry =
      current && current.resetAt > now
        ? current
        : { count: 0, resetAt: now + windowMs };

    entry.count += 1;
    if (!current && attempts.size >= maxEntries) {
      const oldestKey = attempts.keys().next().value;
      if (oldestKey !== undefined) attempts.delete(oldestKey);
    }
    attempts.set(key, entry);

    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: true,
        error_msg: message,
        code: "RATE_LIMITED",
      });
    }

    return next();
  };
}

function clearRateLimits() {
  attempts.clear();
}

function createPersistentRateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 10,
  keyGenerator = (req) => req.ip,
  message = "Terlalu banyak percobaan. Silakan coba lagi nanti.",
  useMemoryInTest = true,
} = {}) {
  if (useMemoryInTest && process.env.NODE_ENV === "test") {
    return createRateLimiter({ windowMs, max, keyGenerator, message });
  }
  return async (req, res, next) => {
    try {
      const crypto = require("crypto");
      const { sequelize, Sequelize } = require("../models");
      const now = new Date();
      const resetAt = new Date(now.getTime() + windowMs);
      const key = String(keyGenerator(req) || "unknown");
      const keyHash = crypto
        .createHash("sha256")
        .update(key)
        .digest("hex");

      await sequelize.query(
        `INSERT INTO login_rate_limits
          (key_hash, attempt_count, reset_at, created_at, updated_at)
         VALUES (:keyHash, 1, :resetAt, :now, :now)
         ON DUPLICATE KEY UPDATE
           attempt_count = IF(reset_at <= :now, 1, attempt_count + 1),
           reset_at = IF(reset_at <= :now, :resetAt, reset_at),
           updated_at = :now`,
        {
          replacements: { keyHash, resetAt, now },
          type: Sequelize.QueryTypes.INSERT,
        }
      );
      const rows = await sequelize.query(
        `SELECT attempt_count, reset_at
         FROM login_rate_limits
         WHERE key_hash = :keyHash
         LIMIT 1`,
        {
          replacements: { keyHash },
          type: Sequelize.QueryTypes.SELECT,
        }
      );
      const entry = rows[0];
      if (!entry) throw new Error("Rate limit state tidak tersedia.");

      persistentRequestCount += 1;
      if (persistentRequestCount % 100 === 0) {
        await sequelize.query(
          `DELETE FROM login_rate_limits
           WHERE reset_at < DATE_SUB(:now, INTERVAL 1 DAY)`,
          {
            replacements: { now },
            type: Sequelize.QueryTypes.DELETE,
          }
        );
      }

      if (Number(entry.attempt_count) > max) {
        const retryAfter = Math.max(
          1,
          Math.ceil((new Date(entry.reset_at).getTime() - now.getTime()) / 1000)
        );
        res.set("Retry-After", String(retryAfter));
        return res.status(429).json({
          error: true,
          error_msg: message,
          code: "RATE_LIMITED",
        });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = {
  createRateLimiter,
  createPersistentRateLimiter,
  clearRateLimits,
};
