/**
 * Helpers for generating unique, valid test data.
 *
 * DemoQA rejects duplicate usernames and weak passwords, so we generate a
 * unique username per run and a password that satisfies the site's policy.
 */

export interface UserCredentials {
  userName: string;
  password: string;
}

/** A password that meets DemoQA rules: upper, lower, number, special, 8+ chars. */
export const VALID_PASSWORD = 'Str0ng_Pass!';

/** A password that FAILS DemoQA rules (used for negative tests). */
export const WEAK_PASSWORD = 'weak';

/** Generates a unique username, e.g. "qa_user_1723459200000_482". */
export function generateUserName(prefix = 'qa_user'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}_${timestamp}_${random}`;
}

/** Returns a fresh, unique, valid set of credentials for a test run. */
export function generateValidUser(): UserCredentials {
  return {
    userName: generateUserName(),
    password: VALID_PASSWORD,
  };
}
