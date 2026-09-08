const DEMO_LOGIN_EMAIL = "jafredjin@gmail.com";
const DEMO_LOGIN_PASSWORD = "Password1";
const DEMO_SESSION_PREFIX = "demo:";

export function isDemoLogin(email: string, password: string) {
  return (
    email.trim().toLowerCase() === DEMO_LOGIN_EMAIL.toLowerCase() &&
    password === DEMO_LOGIN_PASSWORD
  );
}

export function buildDemoSessionToken(email: string) {
  return `${DEMO_SESSION_PREFIX}${email.trim().toLowerCase()}`;
}

export function parseDemoSessionToken(token: string) {
  if (!token.startsWith(DEMO_SESSION_PREFIX)) {
    return null;
  }

  return token.slice(DEMO_SESSION_PREFIX.length) || null;
}

export { DEMO_LOGIN_EMAIL, DEMO_LOGIN_PASSWORD };