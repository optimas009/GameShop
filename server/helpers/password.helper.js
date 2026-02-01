function validatePassword(pw) {
  const password = String(pw || "");

  if (password.length < 6) return "Password must be at least 6 characters long";
  if (!/[A-Z]/.test(password)) return "Password must contain at least 1 uppercase letter";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least 1 special character";
  if (/(.)\1\1/.test(password)) {
    return "Password cannot contain 3 consecutive identical characters (e.g., aaa, 111)";
  }

  return null;
}

module.exports = { validatePassword };
