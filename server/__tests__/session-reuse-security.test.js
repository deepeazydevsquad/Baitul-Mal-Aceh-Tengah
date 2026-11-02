process.env.ADMINISTRATOR_SECRET_KEY =
  "reuse-admin-access-secret-000000000001";
process.env.ADMINISTRATOR_REFRESH_SECRET_KEY =
  "reuse-admin-refresh-secret-00000000002";
process.env.MEMBERSHIP_SECRET_KEY =
  "reuse-member-access-secret-00000000003";
process.env.MEMBERSHIP_REFRESH_SECRET_KEY =
  "reuse-member-refresh-secret-00000000004";
process.env.OTP_HASH_SECRET =
  "reuse-otp-hash-secret-000000000000005";

const jwt = require("jsonwebtoken");
const mockAuthSession = {
  findOne: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
  create: jest.fn(),
};
const mockUser = {
  findByPk: jest.fn(),
};
const mockMember = {
  findByPk: jest.fn(),
};

jest.mock("../models", () => ({
  Auth_session: mockAuthSession,
  User: mockUser,
  Member: mockMember,
  Op: {},
}));

const {
  verifyAndRotateRefreshToken,
} = require("../helper/tokenHelper");

describe("refresh token reuse detection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthSession.update.mockResolvedValue([1]);
    mockUser.findByPk.mockResolvedValue({ id: 8 });
  });

  test("revokes the session family when an old refresh token is replayed", async () => {
    const token = jwt.sign(
      {
        sub: "8",
        principal_type: "administrator",
        token_type: "refresh",
        sid: "synthetic-session",
        jti: "used-jti",
      },
      process.env.ADMINISTRATOR_REFRESH_SECRET_KEY,
      {
        algorithm: "HS256",
        issuer: "baitulmal-api",
        audience: "baitulmal-administrator",
        expiresIn: "1h",
      }
    );
    mockAuthSession.findOne.mockResolvedValue({
      id: 44,
      refresh_jti: "current-jti",
      expires_at: new Date(Date.now() + 60_000),
    });

    await expect(
      verifyAndRotateRefreshToken(token, "administrator")
    ).rejects.toMatchObject({ code: "REFRESH_TOKEN_REUSED" });

    expect(mockAuthSession.update).toHaveBeenCalledWith(
      { revoked_at: expect.any(Date) },
      { where: { id: 44, revoked_at: null } }
    );
  });
});
