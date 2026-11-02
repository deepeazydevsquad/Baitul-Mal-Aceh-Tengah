const {
  validatePassword,
} = require("../helper/passwordPolicyHelper");

describe("password policy", () => {
  test("rejects short and commonly guessed passwords", () => {
    expect(() => validatePassword("short")).toThrow(/minimal/i);
    expect(() => validatePassword("password123")).toThrow(/umum/i);
  });

  test("accepts a sufficiently long synthetic password", () => {
    expect(
      validatePassword("Synthetic-Secure-Passphrase-42")
    ).toBe(true);
  });
});
