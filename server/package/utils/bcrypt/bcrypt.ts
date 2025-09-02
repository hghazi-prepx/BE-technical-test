import { hash, compare } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const salt = 10;
  const hashedPassword = await hash(password, salt);
  return hashedPassword;
}

export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  const res = await compare(password, hashedPassword);
  return res;
}
