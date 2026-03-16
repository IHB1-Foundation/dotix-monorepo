import fs from "node:fs";
import path from "node:path";

const DEFAULT_NONCE_LOCK_PATH = path.join(process.cwd(), "agent", ".nonce.lock");

export type NonceLock = {
  release: () => void;
};

export function acquireNonceLock(lockPath = DEFAULT_NONCE_LOCK_PATH): NonceLock {
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });

  let fd: number;
  try {
    fd = fs.openSync(lockPath, "wx");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new Error(`Nonce lock already held: ${lockPath}`);
    }

    throw error;
  }

  fs.writeFileSync(
    fd,
    `${JSON.stringify({ pid: process.pid, createdAt: new Date().toISOString() })}\n`,
    "utf8"
  );

  let released = false;

  return {
    release: () => {
      if (released) {
        return;
      }

      released = true;
      fs.closeSync(fd);
      fs.rmSync(lockPath, { force: true });
    },
  };
}
