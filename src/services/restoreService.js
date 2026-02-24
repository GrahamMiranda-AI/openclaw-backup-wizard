import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { TMP_RESTORE_DIR, OPENCLAW_DIR, WORKSPACE_DIR, WORKSPACE_FILES } from '../config.js';
import { copyRecursive, removePath } from '../utils/fs.js';

export async function restoreBackup(backupPath) {
  // Clear temp restore dir
  await removePath(TMP_RESTORE_DIR);
  await fs.promises.mkdir(TMP_RESTORE_DIR, { recursive: true });

  // Extract
  await fs.createReadStream(backupPath)
    .pipe(unzipper.Extract({ path: TMP_RESTORE_DIR }))
    .promise();

  const srcOpenclaw = path.join(TMP_RESTORE_DIR, 'openclaw_state');
  const srcWorkspace = path.join(TMP_RESTORE_DIR, 'workspace_files');

  // Restore OpenClaw state
  if (fs.existsSync(srcOpenclaw)) {
    await copyRecursive(srcOpenclaw, OPENCLAW_DIR);
  }

  // Restore Workspace files
  if (fs.existsSync(srcWorkspace)) {
    for (const rel of WORKSPACE_FILES) {
      const src = path.join(srcWorkspace, rel);
      if (fs.existsSync(src)) {
        await copyRecursive(src, path.join(WORKSPACE_DIR, rel));
      }
    }
  }

  // Cleanup
  await removePath(TMP_RESTORE_DIR);
}
