const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const service = require("./auth.service");

const COOKIE_NAME = "bb_refresh";
function cookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}
function readCookie(req, name) {
  const header = req.headers.cookie || "";
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index > -1 && part.slice(0, index).trim() === name) {
      try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return null; }
    }
  }
  return null;
}
function setRefreshCookie(res, token) {
  res.cookie(COOKIE_NAME, token, cookieOptions());
}
function clearRefreshCookie(res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions(), maxAge: undefined });
}

const register = asyncHandler(async (req, res) => {
  const session = await service.register(req.validated.body, req);
  setRefreshCookie(res, session.refreshToken);
  return sendSuccess(res, { accessToken: session.accessToken, user: session.user }, { status: 201 });
});
const login = asyncHandler(async (req, res) => {
  const session = await service.login(req.validated.body, req);
  setRefreshCookie(res, session.refreshToken);
  return sendSuccess(res, { accessToken: session.accessToken, user: session.user });
});
const refresh = asyncHandler(async (req, res) => {
  const session = await service.refresh(readCookie(req, COOKIE_NAME), req);
  setRefreshCookie(res, session.refreshToken);
  return sendSuccess(res, { accessToken: session.accessToken, user: session.user });
});
const logout = asyncHandler(async (req, res) => {
  await service.logout(readCookie(req, COOKIE_NAME), req);
  clearRefreshCookie(res);
  return sendSuccess(res, { loggedOut: true });
});

module.exports = { register, login, refresh, logout };
