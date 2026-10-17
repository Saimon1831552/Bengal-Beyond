const argon2 = require("argon2");
const bcrypt = require("bcryptjs");

const ARGON2_OPTIONS = { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 1 };
const DUMMY_ARGON2_HASH = "$argon2id$v=19$m=65536,p=1,t=3$5+0KduOIiGJJ99lvTSpqZA$Lbg5j8mhCpaY3A4AWhrVP6+7l35yaA9U/EjFQJZcegA";

function isLegacyPasswordHash(passwordHash) {
  return typeof passwordHash === "string" && /^\$2[aby]\$/.test(passwordHash);
}

function hashPassword(password) {
  return argon2.hash(password, ARGON2_OPTIONS);
}

async function verifyPassword(passwordHash, password) {
  if (typeof passwordHash === "string" && passwordHash.startsWith("$argon2")) {
    return argon2.verify(passwordHash, password);
  }
  if (isLegacyPasswordHash(passwordHash)) {
    return bcrypt.compare(password, passwordHash);
  }

  await argon2.verify(DUMMY_ARGON2_HASH, password);
  return false;
}

module.exports = { hashPassword, verifyPassword, isLegacyPasswordHash };
