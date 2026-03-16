import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "bun:test";

import { acquireNonceLock } from "./nonce-lock";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const tempDir = tempDirs.pop();
    if (tempDir) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

function createLockPath(): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "dotix-nonce-lock-"));
  tempDirs.push(tempDir);
  return path.join(tempDir, ".nonce.lock");
}

describe("acquireNonceLock", () => {
  it("prevents concurrent lock acquisition", () => {
    const lockPath = createLockPath();
    const lock = acquireNonceLock(lockPath);

    expect(() => acquireNonceLock(lockPath)).toThrow(`Nonce lock already held: ${lockPath}`);

    lock.release();
  });

  it("allows reacquiring the lock after release", () => {
    const lockPath = createLockPath();
    const firstLock = acquireNonceLock(lockPath);
    firstLock.release();

    const secondLock = acquireNonceLock(lockPath);
    secondLock.release();

    expect(fs.existsSync(lockPath)).toBe(false);
  });
});
