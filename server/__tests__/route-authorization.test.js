const express = require("express");
const request = require("supertest");

jest.mock("../middleware/authenticateToken", () => ({
  authenticateTokenAdministrator: (req, res, next) => {
    if (req.testPrincipal?.principalType !== "administrator") {
      return res.status(401).json({ code: "ADMINISTRATOR_REQUIRED" });
    }
    req.user = req.testPrincipal;
    return next();
  },
  authenticateTokenMember: (req, res, next) => {
    if (req.testPrincipal?.principalType !== "member") {
      return res.status(401).json({ code: "MEMBER_REQUIRED" });
    }
    req.user = req.testPrincipal;
    return next();
  },
}));

const {
  protectConfiguredRoutes,
} = require("../middleware/routeAuthorization");

const restrictedAdministrator = {
  id: 10,
  principalType: "administrator",
  grup_id: 2,
  group_access: JSON.stringify([]),
};

const permittedAdministrator = {
  ...restrictedAdministrator,
  group_access: JSON.stringify([
    {
      id: 6,
      Submenus: [{ id: 16 }],
    },
  ]),
};

function buildApp() {
  const app = express();
  const handlers = {
    group: jest.fn((req, res) => res.status(200).json({ ok: true })),
    validation: jest.fn((req, res) => res.status(200).json({ ok: true })),
    member: jest.fn((req, res) =>
      res.status(200).json({ member_id: req.body.member_id })
    ),
    public: jest.fn((req, res) => res.status(200).json({ ok: true })),
    unmapped: jest.fn((req, res) => res.status(200).json({ ok: true })),
  };

  app.set("trust proxy", false);
  app.use(express.json());
  app.use((req, res, next) => {
    const principal = req.get("x-test-principal");
    if (principal) req.testPrincipal = JSON.parse(principal);
    next();
  });
  protectConfiguredRoutes(app);

  app.post("/grup_akses/edit", handlers.group);
  app.post(
    "/validasi_permohonan_bantuan/approve_permohonan",
    handlers.validation
  );
  app.post("/zakat_member/demo", handlers.member);
  app.post("/survey_lapangan/submit", handlers.public);
  app.post("/unmapped-sensitive-operation", handlers.unmapped);

  return { app, handlers };
}

function withPrincipal(principal) {
  return { "x-test-principal": JSON.stringify(principal) };
}

describe("runtime route authorization", () => {
  test.each([
    "/grup_akses/edit",
    "/GRUP_AKSES/edit",
    "/Grup_Akses/Edit",
    "/grup_akses/edit/",
  ])("denies an administrator without permission on %s", async (path) => {
    const { app, handlers } = buildApp();
    const response = await request(app)
      .post(path)
      .set(withPrincipal(restrictedAdministrator))
      .send({ id: 1, name: "Fixture", group_access: "[]" });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("PERMISSION_DENIED");
    expect(handlers.group).not.toHaveBeenCalled();
  });

  test.each([
    "/validasi_permohonan_bantuan/approve_permohonan",
    "/VALIDASI_PERMOHONAN_BANTUAN/APPROVE_PERMOHONAN",
    "/Validasi_Permohonan_Bantuan/Approve_Permohonan",
  ])("does not reach another protected handler on %s", async (path) => {
    const { app, handlers } = buildApp();
    const response = await request(app)
      .post(path)
      .set(withPrincipal(restrictedAdministrator))
      .send({ id: 1 });

    expect(response.status).toBe(403);
    expect(handlers.validation).not.toHaveBeenCalled();
  });

  test("allows a permitted administrator on the official route", async () => {
    const { app, handlers } = buildApp();
    const response = await request(app)
      .post("/grup_akses/edit")
      .set(withPrincipal(permittedAdministrator))
      .send({ id: 1, name: "Fixture", group_access: "[]" });

    expect(response.status).toBe(200);
    expect(handlers.group).toHaveBeenCalledTimes(1);
  });

  test("denies anonymous and member principals before admin handlers", async () => {
    const { app, handlers } = buildApp();
    const anonymous = await request(app)
      .post("/GRUP_AKSES/edit")
      .send({ id: 1 });
    const member = await request(app)
      .post("/grup_akses/edit")
      .set(
        withPrincipal({
          id: 11,
          principalType: "member",
        })
      )
      .send({ id: 1 });

    expect(anonymous.status).toBe(401);
    expect(member.status).toBe(401);
    expect(handlers.group).not.toHaveBeenCalled();
  });

  test.each([
    "/zakat_member/demo",
    "/ZAKAT_MEMBER/demo",
    "/Zakat_Member/Demo",
  ])("keeps member ownership scope on %s", async (path) => {
    const { app, handlers } = buildApp();
    const response = await request(app)
      .post(path)
      .set(
        withPrincipal({
          id: 11,
          principalType: "member",
        })
      )
      .send({ member_id: 12 });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("MEMBER_SCOPE_VIOLATION");
    expect(handlers.member).not.toHaveBeenCalled();
  });

  test("replaces a matching member body ID with the authenticated ID", async () => {
    const { app } = buildApp();
    const response = await request(app)
      .post("/ZAKAT_MEMBER/demo")
      .set(
        withPrincipal({
          id: 11,
          principalType: "member",
        })
      )
      .send({ member_id: "11" });

    expect(response.status).toBe(200);
    expect(response.body.member_id).toBe(11);
  });

  test("keeps explicit public capabilities available without a token", async () => {
    const { app, handlers } = buildApp();
    const normal = await request(app)
      .post("/survey_lapangan/submit")
      .send({ access_code: "synthetic" });
    const mixedCase = await request(app)
      .post("/SURVEY_LAPANGAN/SUBMIT/")
      .send({ access_code: "synthetic" });

    expect(normal.status).toBe(200);
    expect(mixedCase.status).toBe(200);
    expect(handlers.public).toHaveBeenCalledTimes(2);
  });

  test("stops an unmapped protected route before its handler", async () => {
    const { app, handlers } = buildApp();
    const response = await request(app)
      .post("/unmapped-sensitive-operation")
      .set(withPrincipal(permittedAdministrator))
      .send({ id: 1 });

    expect(response.status).toBe(404);
    expect(response.body.code).toBe("NOT_FOUND");
    expect(handlers.unmapped).not.toHaveBeenCalled();
  });
});
