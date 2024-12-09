import crypto from "node:crypto";

export class TokenEncryptor {
  constructor(
    private masterKey: Buffer,
    private version: number,
  ) {
    this.masterKey = masterKey;
    this.version = version;
  }

  generateSalt() {
    return crypto.randomBytes(16);
  }

  deriveKey(salt: crypto.BinaryLike): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        this.masterKey,
        salt,
        100000,
        32,
        "sha256",
        (err, derivedKey) => {
          if (err) {
            reject(err);
          } else {
            resolve(derivedKey);
          }
        },
      );
    });
  }

  async encryptToken(token: string) {
    const salt = this.generateSalt();
    const key = await this.deriveKey(salt);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");

    return `${this.version}.${salt.toString("hex")}.${iv.toString(
      "hex",
    )}.${encrypted}`;
  }

  async decryptToken(encrypted: string) {
    const [_version, _salt, _iv, _encryptedToken] = encrypted.split(".");
    const salt = Buffer.from(_salt, "hex");
    const key = await this.deriveKey(salt);
    const iv = Buffer.from(_iv, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(_encryptedToken, "hex", "utf8");

    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

const MasterKeys = {
  0: Buffer.from(
    process.env.MASTER_KEY_V0! ??
      "dcde025d4ab87b75fc2080ffafaf752af66204be9b944f84f449d93553000afa", // for test
  ),
};

const encryptors = {
  0: new TokenEncryptor(MasterKeys[0], 0),
};

export function encryptToken(token: string, version = 0) {
  // @ts-ignore Use latest version by default
  return encryptors[version].encryptToken(token);
}

export function decryptToken(encryptedData: string) {
  const [version] = encryptedData.split(".");
  //@ts-ignore
  return encryptors[version].decryptToken(encryptedData);
}
