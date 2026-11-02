const mockSequelize = {
  query: jest.fn(),
};

jest.mock("../models", () => ({
  sequelize: mockSequelize,
  Sequelize: {
    QueryTypes: {
      INSERT: "INSERT",
      SELECT: "SELECT",
      DELETE: "DELETE",
    },
  },
}));

const {
  createPersistentRateLimiter,
} = require("../helper/rateLimitHelper");

describe("persistent rate limiting", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("enforces limits using shared database state", async () => {
    mockSequelize.query
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([
        {
          attempt_count: 2,
          reset_at: new Date(Date.now() + 60_000),
        },
      ]);
    const middleware = createPersistentRateLimiter({
      windowMs: 60_000,
      max: 1,
      keyGenerator: () => "synthetic-key",
      useMemoryInTest: false,
    });
    const response = {
      set: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await middleware({}, response, next);

    expect(mockSequelize.query).toHaveBeenCalledTimes(2);
    expect(response.status).toHaveBeenCalledWith(429);
    expect(next).not.toHaveBeenCalled();
  });
});
