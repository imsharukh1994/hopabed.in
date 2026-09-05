import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createAccessToken, requireAuth, type AuthenticatedRequest } from './auth.js';

function responseMock() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
}

describe('authentication middleware', () => {
  it('accepts a valid access token and attaches auth context', () => {
    const request = {
      header: (name: string) => (name === 'authorization' ? `Bearer ${createAccessToken('user-1', 'guest')}` : undefined),
    } as AuthenticatedRequest;
    const response = responseMock();
    let called = false;

    requireAuth(request, response as never, () => {
      called = true;
    });

    assert.equal(called, true);
    assert.deepEqual(request.auth, { userId: 'user-1', role: 'guest' });
  });

  it('rejects a missing access token', () => {
    const request = { header: () => undefined } as unknown as AuthenticatedRequest;
    const response = responseMock();

    requireAuth(request, response as never, () => undefined);

    assert.equal(response.statusCode, 401);
    assert.equal((response.body as { error: { code: string } }).error.code, 'UNAUTHORIZED');
  });

  it('rejects a malformed access token', () => {
    const request = { header: () => 'Bearer invalid-token' } as unknown as AuthenticatedRequest;
    const response = responseMock();

    requireAuth(request, response as never, () => undefined);

    assert.equal(response.statusCode, 401);
    assert.equal((response.body as { error: { code: string } }).error.code, 'INVALID_TOKEN');
  });
});