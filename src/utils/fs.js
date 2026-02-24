import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';

export async function copyRecursive(src, dst, options = {}) {
  await fsp.mkdir(path.dirname(dst), { recursive: true });
  await fsp.cp(src, dst, { recursive: true, force: true, ...options });
}

export async function removePath(target) {
  if (fs.existsSync(target)) {
    await fsp.rm(target, { recursive: true, force: true });
  }
}

export { fs, fsp };
