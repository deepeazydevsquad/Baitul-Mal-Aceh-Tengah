const mockRemoveUploadedDocuments = jest.fn();
const mockModelCud = jest.fn();

jest.mock(
  "../modules/permohonan_bantuan_member/models/model_cud",
  () => mockModelCud
);
jest.mock(
  "../modules/permohonan_bantuan_member/models/model_r",
  () => jest.fn()
);
jest.mock("../validation/permohonan_member", () => ({
  removeUploadedDocuments: mockRemoveUploadedDocuments,
}));
jest.mock("../helper/handleError", () => ({
  handleValidationErrors: jest.fn(async () => true),
  handleServerError: jest.fn(),
}));

const controllers = require(
  "../modules/permohonan_bantuan_member/controllers/index"
);

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
}

describe("member assistance application upload reconciliation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does not delete uploads when the commit outcome is unknown", async () => {
    mockModelCud.mockImplementation(() => ({
      add: jest.fn(async () => undefined),
      response: jest.fn(async () => false),
      isUploadCleanupSafe: jest.fn(() => false),
      transactionOutcome: "commit_unknown",
      statusCode: 503,
      message:
        "Status penyimpanan belum dapat dipastikan. Periksa riwayat permohonan sebelum mengulang.",
    }));
    const response = createResponse();

    await controllers.add({}, response);

    expect(mockRemoveUploadedDocuments).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: true,
        code: "COMMIT_OUTCOME_UNKNOWN",
      })
    );
  });

  test("deletes uploads only after a confirmed rollback", async () => {
    mockModelCud.mockImplementation(() => ({
      add: jest.fn(async () => undefined),
      response: jest.fn(async () => false),
      isUploadCleanupSafe: jest.fn(() => true),
      transactionOutcome: "rolled_back",
      statusCode: 409,
      message: "Member sudah mempunyai permohonan",
    }));
    const response = createResponse();

    await controllers.add({}, response);

    expect(mockRemoveUploadedDocuments).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      error: true,
      error_msg: "Member sudah mempunyai permohonan",
    });
  });
});
