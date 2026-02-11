// Authentication and cryptography utilities
import crypto from 'crypto';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateRSAKeyPair = () => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  return { publicKey, privateKey };
};

export const encryptAES = (data: Buffer, key: Buffer): Buffer => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
};

export const decryptAES = (encryptedData: Buffer, key: Buffer): Buffer => {
  const iv = encryptedData.slice(0, 16);
  const encrypted = encryptedData.slice(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

export const encryptRSA = (data: Buffer, publicKey: string): Buffer => {
  return crypto.publicEncrypt(publicKey, data);
};

export const decryptRSA = (encryptedData: Buffer, privateKey: string): Buffer => {
  return crypto.privateDecrypt(privateKey, encryptedData);
};

export const hashFile = (data: Buffer): string => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const signData = (data: Buffer, privateKey: string): string => {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'hex');
};

export const verifySignature = (data: Buffer, signature: string, publicKey: string): boolean => {
  const verify = crypto.createVerify('SHA256');
  verify.update(data);
  return verify.verify(publicKey, signature, 'hex');
};

export const generateAESKey = (): Buffer => {
  return crypto.randomBytes(32);
};
