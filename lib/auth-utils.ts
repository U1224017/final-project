// lib/auth-utils.ts
import bcrypt from 'bcryptjs';

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    // 使用 bcrypt.compare 比較明文密碼和雜湊過的密碼
    return await bcrypt.compare(password, hashedPassword);
}