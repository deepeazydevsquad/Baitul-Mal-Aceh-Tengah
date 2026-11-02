const mockAxios = {
  post: jest.fn(),
};
const mockModelR = {
  wapisender_api_device_key: jest.fn(),
};
const mockModelCudMethods = {
  createOtp: jest.fn(),
  response: jest.fn(),
  markFailed: jest.fn(),
};

class MockModelCud {
  constructor() {
    Object.assign(this, mockModelCudMethods);
  }
}

class MockOtpRateLimitError extends Error {}
MockModelCud.OtpRateLimitError = MockOtpRateLimitError;

jest.mock("axios", () => mockAxios);
jest.mock("../modules/otps/models/model_r", () =>
  jest.fn(() => mockModelR)
);
jest.mock("../modules/otps/models/model_cud", () => MockModelCud);
jest.mock("../helper/handleError", () => ({
  handleValidationErrors: jest.fn(async () => true),
}));

const controller = require("../modules/otps/controllers/index");

describe("OTP delivery response", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockModelR.wapisender_api_device_key.mockResolvedValue({
      api_key: "synthetic-api-key",
      device_key: "synthetic-device-key",
    });
    mockModelCudMethods.createOtp.mockResolvedValue();
    mockModelCudMethods.response.mockResolvedValue(true);
    mockAxios.post.mockResolvedValue({ data: { status: "ok" } });
  });

  test("never includes the OTP in the successful response or logs", async () => {
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.sendOtp(
      {
        ip: "127.0.0.1",
        body: { whatsappNumber: "+62 812-3456-7890" },
      },
      response
    );

    expect(response.status).toHaveBeenCalledWith(200);
    const payload = response.json.mock.calls[0][0];
    expect(payload).not.toHaveProperty("otp");
    expect(JSON.stringify(payload)).not.toMatch(/\d{6}/);
    expect(mockModelCudMethods.createOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        whatsapp_number: "081234567890",
        purpose: "registration",
        otp_code: expect.stringMatching(/^\d{6}$/),
      })
    );
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
