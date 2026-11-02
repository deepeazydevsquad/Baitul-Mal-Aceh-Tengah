class AuthorizationError extends Error {
  constructor(message = "Operasi tidak diizinkan.", code = "PERMISSION_DENIED") {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = 403;
    this.code = code;
  }
}

module.exports = { AuthorizationError };
