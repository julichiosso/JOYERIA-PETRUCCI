import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { authRepository } from './auth.repository.js';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../../shared/errors/index.js';
import type { LoginInput, AuthTokens, JwtPayload, AuthenticatedUser } from './auth.types.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const BCRYPT_ROUNDS = 12;

class InvalidCredentialsError extends UnauthorizedError {
  constructor(message = 'Credenciales inválidas') {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}

class InvalidRefreshTokenError extends UnauthorizedError {
  constructor(message = 'Refresh token inválido o expirado') {
    super(message);
    this.name = 'InvalidRefreshTokenError';
  }
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshTokenValue(): string {
  return crypto.randomBytes(64).toString('hex');
}

export const authService = {
  async login(input: LoginInput): Promise<{ tokens: AuthTokens; user: AuthenticatedUser }> {
    const user = await authRepository.findUserByEmail(input.email);

    if (!user) {
      // Comparamos igual contra un hash dummy para evitar timing attacks
      // (que alguien deduzca si el email existe midiendo cuánto tarda la respuesta)
      await bcrypt.compare(input.password, '$2b$12$invalidsaltinvalidsaltinvalidsa');
      throw new InvalidCredentialsError();
    }

    const passwordMatches = await bcrypt.compare(input.password, user.password);
    if (!passwordMatches) {
      throw new InvalidCredentialsError();
    }

    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);

    const refreshTokenValue = generateRefreshTokenValue();
    const refreshTokenHash = hashToken(refreshTokenValue);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt,
    });

    return {
      tokens: { accessToken, refreshToken: refreshTokenValue },
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  },

  async refresh(refreshTokenValue: string): Promise<AuthTokens> {
    const tokenHash = hashToken(refreshTokenValue);
    const storedToken = await authRepository.findRefreshTokenByHash(tokenHash);

    if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
      throw new InvalidRefreshTokenError();
    }

    // Rotación: revocamos el token usado y emitimos uno nuevo.
    // Esto detecta reuso de tokens robados (si alguien lo usa dos veces, el segundo uso ya está revocado).
    await authRepository.revokeRefreshToken(tokenHash);

    const { user } = storedToken;
    const payload: JwtPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);

    const newRefreshTokenValue = generateRefreshTokenValue();
    const newRefreshTokenHash = hashToken(newRefreshTokenValue);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: newRefreshTokenHash,
      expiresAt,
    });

    return { accessToken, refreshToken: newRefreshTokenValue };
  },

  async logout(refreshTokenValue: string): Promise<void> {
    const tokenHash = hashToken(refreshTokenValue);
    await authRepository.revokeRefreshToken(tokenHash);
  },

  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
  },

  verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  },
};

export { InvalidCredentialsError, InvalidRefreshTokenError };