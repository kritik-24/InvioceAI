
const createRateLimiter = ({
  windowMs,
  maxRequests,
  message,
}) => {
  const requests = new Map();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();

    for (const [
      key,
      entry,
    ] of requests.entries()) {
      if (
        now - entry.windowStart >=
        windowMs
      ) {
        requests.delete(key);
      }
    }
  }, Math.min(windowMs, 60 * 1000));

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    /*
     * Express's req.ip is preferred.
     *
     * Only trust X-Forwarded-For when the
     * application is configured behind a
     * trusted reverse proxy using Express's
     * trust proxy setting.
     */
    const ip =
      req.ip ||
      req.socket?.remoteAddress ||
      "unknown";

    const key = String(ip)
      .split(",")[0]
      .trim()
      .slice(0, 200);

    const now = Date.now();

    let entry = requests.get(key);

    if (
      !entry ||
      now - entry.windowStart >=
        windowMs
    ) {
      entry = {
        windowStart: now,
        count: 0,
      };

      requests.set(key, entry);
    }

    entry.count += 1;

    const remaining = Math.max(
      0,
      maxRequests - entry.count
    );

    const resetAt =
      entry.windowStart + windowMs;

    res.setHeader(
      "X-RateLimit-Limit",
      String(maxRequests)
    );

    res.setHeader(
      "X-RateLimit-Remaining",
      String(remaining)
    );

    res.setHeader(
      "X-RateLimit-Reset",
      String(
        Math.ceil(resetAt / 1000)
      )
    );

    if (
      entry.count >
      maxRequests
    ) {
      const retryAfter = Math.max(
        1,
        Math.ceil(
          (resetAt - now) / 1000
        )
      );

      res.setHeader(
        "Retry-After",
        String(retryAfter)
      );

      res.setHeader(
        "Cache-Control",
        "no-store"
      );

      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

// =====================================
// LOGIN
// =====================================

const loginRateLimiter =
  createRateLimiter({
    windowMs:
      15 * 60 * 1000,

    maxRequests: 10,

    message:
      "Too many login attempts. Please try again later.",
  });

// =====================================
// SIGNUP
// =====================================

const signupRateLimiter =
  createRateLimiter({
    windowMs:
      60 * 60 * 1000,

    maxRequests: 10,

    message:
      "Too many signup attempts. Please try again later.",
  });

// =====================================
// FORGOT PASSWORD
// =====================================

const forgotPasswordRateLimiter =
  createRateLimiter({
    windowMs:
      15 * 60 * 1000,

    maxRequests: 5,

    message:
      "Too many password reset requests. Please try again later.",
  });

// =====================================
// RESET PASSWORD
// =====================================

const resetPasswordRateLimiter =
  createRateLimiter({
    windowMs:
      15 * 60 * 1000,

    maxRequests: 10,

    message:
      "Too many password reset attempts. Please try again later.",
  });

module.exports = {
  loginRateLimiter,
  signupRateLimiter,
  forgotPasswordRateLimiter,
  resetPasswordRateLimiter,
};