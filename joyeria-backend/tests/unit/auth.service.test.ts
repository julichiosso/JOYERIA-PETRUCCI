import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';

vi.mock('../../src/modules/auth/auth.repository.js', () => ({
  authRepository: {
    findUserByEmail: vi.fn(),
    createRefreshToken: vi.fn(),
    findRefreshTokenByHash: vi.fn(),
    revokeRefreshToken: vi.fn(),
    revokeAllUserTokens: vi.fn(),
  },
}));

vi.mock('../../src/config/env.js', () => ({
  env: {
    JWT_SECRET: 'test_secret_de_al_menos_16_caracteres',
    JWT_REFRESH_SECRET: 'test_refresh_secret_de_16_chars',
    NODE_ENV: 'test',
    PORT: 3000,
    DATABASE_URL: 'postgresql://fake',
    DIRECT_URL: 'postgresql://fake',
  },
}));

import {
  authService,
  InvalidCredentialsError,
  InvalidRefreshTokenError,
} from '../../src/modules/auth/auth.service.js';
import { authRepository } from '../../src/modules/auth/auth.repository.js';

describe('authService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve tokens y user cuando las credenciales son correctas', async () => {
    const hashedPassword = await bcrypt.hash('miPassword123', 12);

    vi.mocked(authRepository.findUserByEmail).mockResolvedValue({
      id: 'user_1',
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin Test',
      role: 'ADMIN',
      tenantId: 'default',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await authService.login({
      email: 'admin@test.com',
      password: 'miPassword123',
    });

    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
    expect(result.user.email).toBe('admin@test.com');
    expect(authRepository.createRefreshToken).toHaveBeenCalledOnce();
  });

  it('lanza InvalidCredentialsError si el email no existe', async () => {
    vi.mocked(authRepository.findUserByEmail).mockResolvedValue(null);

    await expect(
      authService.login({ email: 'noexiste@test.com', password: 'cualquiera' })
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('lanza InvalidCredentialsError si la contraseña es incorrecta', async () => {
    const hashedPassword = await bcrypt.hash('passwordCorrecta', 12);

    vi.mocked(authRepository.findUserByEmail).mockResolvedValue({
      id: 'user_1',
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin Test',
      role: 'ADMIN',
      tenantId: 'default',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    await expect(
      authService.login({ email: 'admin@test.com', password: 'passwordIncorrecta' })
    ).rejects.toThrow(InvalidCredentialsError);

    expect(authRepository.createRefreshToken).not.toHaveBeenCalled();
  });
});

describe('authService.refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve nuevos tokens y rota el refresh token usado', async () => {
    const mockUser = {
      id: 'user_1',
      email: 'admin@test.com',
      password: 'hashed_no_importa',
      name: 'Admin Test',
      role: 'ADMIN',
      tenantId: 'default',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue({
      id: 'token_1',
      tokenHash: 'hash_falso',
      userId: 'user_1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: null,
      createdAt: new Date(),
      user: mockUser,
    } as any);

    const result = await authService.refresh('refresh_token_valido_de_mentira');

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(authRepository.revokeRefreshToken).toHaveBeenCalledOnce();
    expect(authRepository.createRefreshToken).toHaveBeenCalledOnce();
  });

  it('lanza InvalidRefreshTokenError si el token no existe', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue(null);

    await expect(authService.refresh('token_inexistente')).rejects.toThrow(
      InvalidRefreshTokenError
    );
  });

  it('lanza InvalidRefreshTokenError si el token ya fue revocado', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue({
      id: 'token_1',
      tokenHash: 'hash_falso',
      userId: 'user_1',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: new Date(),
      createdAt: new Date(),
      user: {} as any,
    } as any);

    await expect(authService.refresh('token_ya_usado')).rejects.toThrow(
      InvalidRefreshTokenError
    );
  });

  it('lanza InvalidRefreshTokenError si el token está expirado', async () => {
    vi.mocked(authRepository.findRefreshTokenByHash).mockResolvedValue({
      id: 'token_1',
      tokenHash: 'hash_falso',
      userId: 'user_1',
      expiresAt: new Date(Date.now() - 1000 * 60),
      revokedAt: null,
      createdAt: new Date(),
      user: {} as any,
    } as any);

    await expect(authService.refresh('token_vencido')).rejects.toThrow(
      InvalidRefreshTokenError
    );
  });
});

describe('authService.logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('revoca el refresh token', async () => {
    await authService.logout('cualquier_refresh_token');

    expect(authRepository.revokeRefreshToken).toHaveBeenCalledOnce();
  });
});