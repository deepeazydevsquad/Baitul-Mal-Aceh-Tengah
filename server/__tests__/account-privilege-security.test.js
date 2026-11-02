const mockTransaction = {
  LOCK: { UPDATE: "UPDATE" },
  commit: jest.fn(),
  rollback: jest.fn(),
  finished: false,
};
const mockUser = {
  findByPk: jest.fn(),
  findOne: jest.fn(),
  findAll: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
};
const mockGroup = {
  findByPk: jest.fn(),
  findAll: jest.fn(),
  findAndCountAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  destroy: jest.fn(),
};
const mockMember = {
  findOne: jest.fn(),
  create: jest.fn(),
};
const mockRequestMember = {
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

jest.mock("../models", () => ({
  sequelize: {
    transaction: jest.fn(async () => mockTransaction),
  },
  User: mockUser,
  Grup: mockGroup,
  Member: mockMember,
  Request_member: mockRequestMember,
  Op: {},
}));
jest.mock("../helper/writeLogHelper", () => ({
  writeLog: jest.fn(),
}));
jest.mock("../helper/tokenHelper", () => ({
  revokeAllSessions: jest.fn(),
}));

const UserModel = require("../modules/daftar_pengguna/models/model_cud");
const UserReadModel = require("../modules/daftar_pengguna/models/model_r");
const GroupModel = require("../modules/daftar_grup_akses/models/model_cud");
const GroupReadModel = require("../modules/daftar_grup_akses/models/model_r");
const RequestModel = require(
  "../modules/request_keanggotaan/models/model_cud"
);
const registerValidation = require("../validation/register");
const administratorValidation = require("../validation/administrator");

const actor = {
  id: 10,
  grup_id: 2,
  principalType: "administrator",
  group_access: JSON.stringify([
    { id: 6, Submenus: [{ id: 17 }, { id: 16 }] },
  ]),
};

describe("delegated administrator privilege boundaries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTransaction.finished = false;
    mockTransaction.commit.mockResolvedValue(undefined);
    mockTransaction.rollback.mockResolvedValue(undefined);
  });

  test("does not allow resetting a peer or higher-privilege account", async () => {
    const target = {
      id: 22,
      grup_id: 3,
      update: jest.fn(),
    };
    const targetGroup = {
      id: 3,
      group_access: JSON.stringify([
        { id: 2, Submenus: [{ id: 3 }] },
        { id: 6, Submenus: [{ id: 17 }, { id: 16 }] },
      ]),
    };
    mockUser.findByPk.mockImplementation(async (id) =>
      Number(id) === 10
        ? { id: 10, grup_id: 2 }
        : target
    );
    mockGroup.findAll.mockResolvedValue([
      { id: 2, group_access: actor.group_access },
      targetGroup,
    ]);

    const model = new UserModel({
      user: actor,
      body: {
        id: 22,
        name: "Target",
        jabatan: "Target",
        grup_id: 3,
        username: "target",
        password: "attacker-chosen-password",
      },
    });

    await expect(model.update()).rejects.toMatchObject({
      code: "PRIVILEGE_HIERARCHY_VIOLATION",
      statusCode: 403,
    });
    expect(mockGroup.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ lock: "UPDATE" })
    );
    expect(target.update).not.toHaveBeenCalled();
  });

  test("does not allow deleting a higher-privilege account", async () => {
    const target = {
      id: 22,
      grup_id: 3,
      destroy: jest.fn(),
    };
    mockUser.findByPk.mockImplementation(async (id) =>
      Number(id) === 10
        ? { id: 10, grup_id: 2 }
        : target
    );
    mockGroup.findAll.mockResolvedValue([
      { id: 2, group_access: actor.group_access },
      {
        id: 3,
        group_access: JSON.stringify([
          { id: 2, Submenus: [{ id: 3 }] },
          { id: 6, Submenus: [{ id: 16 }, { id: 17 }] },
        ]),
      },
    ]);

    const model = new UserModel({
      user: actor,
      body: { id: 22 },
    });

    await expect(model.delete()).rejects.toMatchObject({
      code: "PRIVILEGE_HIERARCHY_VIOLATION",
      statusCode: 403,
    });
    expect(target.destroy).not.toHaveBeenCalled();
  });

  test("does not allow the last superadmin to demote themselves", async () => {
    const target = {
      id: 10,
      grup_id: 1,
      update: jest.fn(),
    };
    mockUser.findAll.mockResolvedValue([target]);
    mockUser.findByPk.mockResolvedValue(target);
    mockGroup.findAll.mockResolvedValue([
      {
        id: 1,
        group_access: "[]",
      },
      {
        id: 2,
        group_access: actor.group_access,
      },
    ]);
    const superActor = {
      id: 10,
      grup_id: 1,
      principalType: "administrator",
      group_access: "[]",
    };
    const model = new UserModel({
      user: superActor,
      body: {
        id: 10,
        name: "Super Admin",
        jabatan: "Super Admin",
        grup_id: 2,
        username: "admin",
      },
    });

    await expect(model.update()).rejects.toMatchObject({
      code: "LAST_SUPERADMIN_PROTECTED",
      statusCode: 403,
    });
    expect(target.update).not.toHaveBeenCalled();
  });

  test("does not allow a group manager to edit their own group access", async () => {
    mockGroup.findByPk.mockResolvedValue({
      id: 2,
      group_access: actor.group_access,
    });
    const model = new GroupModel({
      user: actor,
      body: {
        id: 2,
        name: "Delegated",
        group_access: JSON.stringify([
          { id: 2, Submenus: [{ id: 3 }] },
          { id: 6, Submenus: [{ id: 16 }, { id: 17 }] },
        ]),
      },
    });

    await expect(model.edit()).rejects.toMatchObject({
      code: "SELF_PRIVILEGE_CHANGE",
      statusCode: 403,
    });
    expect(mockGroup.update).not.toHaveBeenCalled();
  });

  test("does not allow deleting the privileged group", async () => {
    const model = new GroupModel({
      user: actor,
      body: { id: 1 },
    });

    await expect(model.delete()).rejects.toMatchObject({
      code: "PROTECTED_GROUP",
      statusCode: 403,
    });
    expect(mockGroup.destroy).not.toHaveBeenCalled();
  });

  test("does not approve the same membership request twice", async () => {
    mockRequestMember.findOne.mockResolvedValue({
      id: 7,
      status: "verified",
    });
    const model = new RequestModel({
      body: { id: 7, action: "approve" },
      user: actor,
    });

    await model.approve_request();

    expect(model.state).toBe(false);
    expect(model.statusCode).toBe(409);
    expect(mockMember.create).not.toHaveBeenCalled();
  });

  test("does not approve a request whose normalized NIK already exists", async () => {
    mockRequestMember.findOne.mockResolvedValue({
      id: 8,
      status: "process",
      tipe: "perorangan",
      nomor_ktp: "1175-4272-3771-2001",
      username: "synthetic-new-member",
    });
    mockMember.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 99 });
    const model = new RequestModel({
      body: { id: 8, action: "approve" },
      user: actor,
    });

    await model.approve_request();
    const committed = await model.response();

    expect(committed).toBe(false);
    expect(model.statusCode).toBe(409);
    expect(model.errorCode).toBe("NIK_CONFLICT");
    expect(mockMember.findOne).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { nomor_ktp: "1175427237712001" },
      })
    );
    expect(mockMember.create).not.toHaveBeenCalled();
    expect(mockTransaction.rollback).toHaveBeenCalledTimes(1);
  });

  test("does not expose a higher-privilege group through group detail", () => {
    const model = new GroupReadModel({ user: actor });
    expect(
      model.canReadGroup({
        id: 3,
        group_access: JSON.stringify([
          { id: 6, Submenus: [{ id: 16 }, { id: 17 }] },
        ]),
      })
    ).toBe(false);
  });

  test("does not expose a higher-privilege user through user detail", async () => {
    mockUser.findOne.mockResolvedValue({
      toJSON: () => ({
        id: 22,
        grup_id: 3,
        name: "Higher Admin",
        username: "higher",
      }),
    });
    mockGroup.findByPk.mockResolvedValue({
      id: 3,
      group_access: JSON.stringify([
        { id: 6, Submenus: [{ id: 16 }, { id: 17 }] },
      ]),
    });
    const model = new UserReadModel({
      user: actor,
      body: { id: 22 },
    });

    await expect(model.detail_pengguna()).rejects.toMatchObject({
      code: "PRIVILEGE_HIERARCHY_VIOLATION",
      statusCode: 403,
    });
  });

  test("registration validation only checks username format", () => {
    expect(() =>
      registerValidation.check_username("../invalid-user")
    ).toThrow(/hanya boleh/i);
    expect(mockMember.findOne).not.toHaveBeenCalled();
    expect(mockRequestMember.findOne).not.toHaveBeenCalled();
  });

  test("does not let a self-profile request forge a target user id", async () => {
    mockUser.findByPk.mockResolvedValue({
      id: 10,
      username: "current-admin",
    });
    mockUser.findOne.mockResolvedValue({
      id: 22,
      username: "victim-admin",
    });

    await expect(
      administratorValidation.check_username("victim-admin", {
        req: {
          user: { id: 10, principalType: "administrator" },
          path: "/auth/administrator/edit_profile",
          body: { id: 22 },
        },
      })
    ).rejects.toThrow(/sudah digunakan/i);
  });
});
