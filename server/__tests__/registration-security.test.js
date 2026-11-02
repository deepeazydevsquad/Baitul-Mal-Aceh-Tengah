const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: false,
};
const mockOtp = {
  findOne: jest.fn(),
};
const mockMember = {
  findOne: jest.fn(),
};
const mockRequest = {
  findOne: jest.fn(),
  create: jest.fn(),
};

jest.mock("../models", () => ({
  Otp: mockOtp,
  Member: mockMember,
  Request_member: mockRequest,
  sequelize: {
    transaction: jest.fn(async () => mockTransaction),
  },
  Sequelize: {
    Transaction: {
      ISOLATION_LEVELS: { SERIALIZABLE: "SERIALIZABLE" },
    },
  },
  Op: {},
}));
jest.mock("../helper/otpHelper", () => ({
  normalizeWhatsAppNumber: () => "081234567890",
  verifyOtpCode: jest.fn(() => true),
  OTP_MAX_ATTEMPTS: 5,
}));
jest.mock("bcryptjs", () => ({
  hash: jest.fn(async () => "$2b$12$synthetic-registration-hash"),
}));

const RegisterModel = require("../modules/register/models/model_cud");

function registrationBody(extra = {}) {
  return {
    whatsapp_number: "081234567890",
    otp: "123456",
    username: "synthetic-user",
    password: "Synthetic-Secure-Password-42",
    desa_id: 1,
    tipe: "perorangan",
    fullname: "Synthetic User",
    ...extra,
  };
}

function validOtpRecord() {
  return {
    attempts: 0,
    otp_salt: "synthetic-salt",
    otp: "synthetic-verifier",
    update: jest.fn().mockResolvedValue(undefined),
  };
}

describe("registration username privacy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.finished = false;
    mockTransaction.commit.mockResolvedValue(undefined);
    mockTransaction.rollback.mockResolvedValue(undefined);
  });

  test("does not query usernames before an OTP record is valid", async () => {
    mockOtp.findOne.mockResolvedValue(null);
    const model = new RegisterModel({ body: registrationBody() });

    await model.register();

    expect(mockOtp.findOne).toHaveBeenCalledTimes(1);
    expect(mockMember.findOne).not.toHaveBeenCalled();
    expect(mockRequest.findOne).not.toHaveBeenCalled();
    expect(model.state).toBe(false);
  });

  test("returns a generic error and consumes OTP on username conflict", async () => {
    const otpRecord = validOtpRecord();
    mockOtp.findOne.mockResolvedValue(otpRecord);
    mockMember.findOne.mockResolvedValue({ id: 99 });
    mockRequest.findOne.mockResolvedValue(null);
    const model = new RegisterModel({ body: registrationBody() });

    await model.register();

    expect(model.state).toBe(false);
    expect(model.message).toBe("Registrasi tidak dapat diproses.");
    expect(otpRecord.update).toHaveBeenCalledWith(
      { status: "digunakan" },
      { transaction: mockTransaction }
    );
    expect(mockTransaction.commit).toHaveBeenCalledTimes(1);
    expect(mockRequest.create).not.toHaveBeenCalled();
  });

  test("returns the same generic error on a normalized NIK conflict", async () => {
    const otpRecord = validOtpRecord();
    mockOtp.findOne.mockResolvedValue(otpRecord);
    mockMember.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 99 });
    mockRequest.findOne.mockResolvedValue(null);
    const model = new RegisterModel({
      body: registrationBody({
        nomor_ktp: "1175-4272-3771-2001",
      }),
    });

    await model.register();

    expect(model.state).toBe(false);
    expect(model.message).toBe("Registrasi tidak dapat diproses.");
    expect(mockMember.findOne).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { nomor_ktp: "1175427237712001" },
      })
    );
    expect(mockRequest.create).not.toHaveBeenCalled();
  });

  test("does not enforce individual NIK uniqueness for an instansi", async () => {
    mockOtp.findOne.mockResolvedValue(validOtpRecord());
    mockMember.findOne.mockResolvedValue(null);
    mockRequest.findOne.mockResolvedValue(null);
    mockRequest.create.mockResolvedValue({ id: 5 });
    const model = new RegisterModel({
      body: registrationBody({
        tipe: "instansi",
        nomor_ktp: "not-an-individual-nik",
      }),
    });

    await model.register();

    expect(model.state).toBe(true);
    expect(mockMember.findOne).toHaveBeenCalledTimes(1);
    expect(mockRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({ nomor_ktp: null }),
      expect.any(Object)
    );
  });
});
