import crypto from "node:crypto";
import { expect, test } from "vitest";

import { TokenEncryptor } from "./encrypt";

// Key management
const masterKeys = {
  0: crypto.randomBytes(32), // Original key
  1: crypto.randomBytes(32), // New key after rotation
};

const encryptors = [
  new TokenEncryptor(masterKeys[0], 0),
  new TokenEncryptor(masterKeys[1], 1),
];

test("encryptToken", async () => {
  const token = "my-secret-token";
  const encrypted = await encryptors[1].encryptToken(token);
  console.log(encrypted, encrypted.length);
  const decrypted = await encryptors[1].decryptToken(encrypted);
  expect(decrypted).toBe(token);
});
