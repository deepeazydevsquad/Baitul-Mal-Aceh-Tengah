const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: false,
};
const mockAccount = {
  id: 8,
  update: jest.fn(),
};
const mockUser = {
  findOne: jest.fn(),
};
const mockMember = {
  findOne: jest.fn(),
};
const mockSession = {
  update: jest.fn(),
};
const mockSequelize = {
  transaction: jest.fn(),
  close: jest.fn(),
};

jest.mock("../models", () => ({
  sequelize: mockSequelize,
  User: mockUser,
  Member: mockMember,
  Auth_session: mockSession,
}));
jest.mock("bcryptjs", () => ({
  hash: jest.fn(async () => "$2b$12$synthetic-reset-hash"),
}));

const {
  resetAccountPassword,
} = require("../scripts/reset-account-password");

describe("account password reset", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.finished = false;
    mockTransaction.commit.mockResolvedValue(undefined);
    mockTransaction.rollback.mockResolvedValue(undefined);
    mockSequelize.transaction.mockResolvedValue(mockTransaction);
    mockAccount.update.mockResolvedValue(undefined);
    mockSession.update.mockResolvedValue([1]);
    mockUser.findOne.mockResolvedValue(mockAccount);
    mockMember.findOne.mockResolvedValue(mockAccount);
  });

  test("updates the account and revokes all target sessions", async () => {
    const result = await resetAccountPassword({
      principal: "administrator",
      username: "synthetic-admin",
      password: "Synthetic-Secure-Password-42",
    });

    expect(result).toEqual({
      id: 8,
      username: "synthetic-admin",
      principal: "administrator",
    });
    expect(mockAccount.update).toHaveBeenCalledWith(
      expect.objectContaining({
        password: "$2b$12$synthetic-reset-hash",
      }),
      { transaction: mockTransaction }
    );
    expect(mockSession.update).toHaveBeenCalledWith(
      { revoked_at: expect.any(Date) },
      expect.objectContaining({
        where: {
          principal_type: "administrator",
          principal_id: 8,
          revoked_at: null,
        },
        transaction: mockTransaction,
      })
    );
    expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
  });

  test("rolls back when the account is missing", async () => {
    mockUser.findOne.mockResolvedValue(null);

    await expect(
      resetAccountPassword({
        principal: "administrator",
        username: "missing",
        password: "Synthetic-Secure-Password-42",
      })
    ).rejects.toThrow(/tidak ditemukan/i);

    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
    expect(mockAccount.update).not.toHaveBeenCalled();
  });

  test.each([
    "pendek",
    "password1234",
  ])("rejects a weak reset password before opening a transaction", async (password) => {
    await expect(
      resetAccountPassword({
        principal: "administrator",
        username: "synthetic-admin",
        password,
      })
    ).rejects.toThrow(/minimal|umum/i);

    expect(mockSequelize.transaction).not.toHaveBeenCalled();
    expect(mockAccount.update).not.toHaveBeenCalled();
  });
});
