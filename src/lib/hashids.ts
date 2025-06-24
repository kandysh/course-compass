
import Hashids from 'hashids';

const salt = process.env.HASHIDS_SALT || 'default-salt-please-change';
const minLength = parseInt(process.env.HASHIDS_MIN_LENGTH || '8', 10);

if (process.env.HASHIDS_SALT === 'your-super-secret-salt-please-change-me' || process.env.HASHIDS_SALT === 'default-salt-please-change') {
  console.warn(
    "WARNING: Default Hashids salt is being used. " +
    "Please set a unique, secret HASHIDS_SALT in your .env file for production."
  );
}

const hashids = new Hashids(salt, minLength);

export function encodeId(id: number): string {
  return hashids.encode(id);
}

export function decodeId(hash: string): number | null {
  const decoded = hashids.decode(hash);
  if (Array.isArray(decoded) && decoded.length > 0 && typeof decoded[0] === 'number') {
    return decoded[0];
  }
  if (Array.isArray(decoded) && decoded.length > 0 && typeof decoded[0] === 'bigint') {
    return Number(decoded[0]);
   }
  return null;
}
