const crypto = require('crypto');

class CryptoUtils {
  static generateRSAKeyPair() {
    console.log('[CRYPTO] Generating RSA 2048-bit key pair');
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  static encryptFileAES256(fileBuffer) {
    console.log('[CRYPTO] Encrypting file with AES-256-CBC');
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    let encrypted = cipher.update(fileBuffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    const result = Buffer.concat([iv, encrypted]);

    return {
      encryptedData: result.toString('base64'),
      aesKey: aesKey.toString('base64'),
    };
  }

  static decryptFileAES256(encryptedBase64, aesKeyBase64) {
    console.log('[CRYPTO] Decrypting file with AES-256-CBC');
    const encryptedBuffer = Buffer.from(encryptedBase64, 'base64');
    const aesKey = Buffer.from(aesKeyBase64, 'base64');

    const iv = encryptedBuffer.slice(0, 16);
    const encrypted = encryptedBuffer.slice(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
  }

  static encryptAESKeyWithPublicKey(aesKeyBase64, publicKeyPem) {
    console.log('[CRYPTO] Encrypting AES key with RSA public key');
    const aesKey = Buffer.from(aesKeyBase64, 'base64');

    const encrypted = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      aesKey
    );

    return encrypted.toString('base64');
  }

  static decryptAESKeyWithPrivateKey(encryptedAESKeyBase64, privateKeyPem) {
    console.log('[CRYPTO] Decrypting AES key with RSA private key');
    const encryptedBuffer = Buffer.from(encryptedAESKeyBase64, 'base64');

    const decrypted = crypto.privateDecrypt(
      {
        key: privateKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      encryptedBuffer
    );

    return decrypted.toString('base64');
  }

  static computeSHA256Hash(fileBuffer) {
    console.log('[CRYPTO] Computing SHA-256 hash');
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  static signDataWithPrivateKey(data, privateKeyPem) {
    console.log('[CRYPTO] Signing data with RSA private key');
    const sign = crypto.createSign('sha256');
    sign.update(data);
    const signature = sign.sign(privateKeyPem, 'base64');
    return signature;
  }

  static verifySignatureWithPublicKey(data, signatureBase64, publicKeyPem) {
    console.log('[CRYPTO] Verifying signature with RSA public key');
    const verify = crypto.createVerify('sha256');
    verify.update(data);
    return verify.verify(publicKeyPem, signatureBase64, 'base64');
  }
}

module.exports = CryptoUtils;
