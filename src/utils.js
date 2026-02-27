const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const archiver = require('archiver');
const unzipper = require('unzipper');

const {
  APP_NAME,
  OPENCLAW_DIR,
  WORKSPACE_FILES,
  WORKSPACE_DIR,
  BACKUP_DIR,
  TMP_RESTORE_DIR
} = require('./config');

async function copyRecursive(src, dst, options = {}) {
  await fsp.mkdir(path.dirname(dst), { recursive: true });
  await fsp.cp(src, dst, { recursive: true, force: true, ...options });
}

async function createBackupZip(outFile) {
  const manifest = {
    createdAt: new Date().toISOString(),
    app: APP_NAME,
    format: 'openclaw-backup-wizard-v1',
    includes: {
      openclawState: OPENCLAW_DIR,
      workspace: WORKSPACE_FILES
    }
  };

  const openclawIgnores = [
    // Huge/transient runtime data (not configuration)
    'browser/**',
    'logs/**',
    'media/**',
    'delivery-queue/**',
    'subagents/**',
    'agents/**',
    'cron/runs/**',
    'backups/**',

    // Workspace clone data is backed up separately via WORKSPACE_FILES
    'workspace/**',
    'workspace-gateway-*/**'
  ];

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outFile);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);

    archive.pipe(output);

    if (fs.existsSync(OPENCLAW_DIR)) {
      archive.glob('**/*', {
        cwd: OPENCLAW_DIR,
        dot: true,
        ignore: openclawIgnores
      }, {
        prefix: 'openclaw_state/'
      });
    }

    for (const rel of WORKSPACE_FILES) {
      const src = path.join(WORKSPACE_DIR, rel);
      if (!fs.existsSync(src)) continue;

      const stats = fs.statSync(src);
      const dst = path.posix.join('workspace_files', rel.replace(/\\/g, '/'));
      if (stats.isDirectory()) {
        archive.directory(src, dst);
      } else {
        archive.file(src, { name: dst });
      }
    }

    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' });
    archive.finalize();
  });
}

async function removePath(target) {
  if (fs.existsSync(target)) {
    await fsp.rm(target, { recursive: true, force: true });
  }
}

async function restoreBackup(zipPath) {
  // Create a pre-restore backup first
  const preRestoreFile = path.join(BACKUP_DIR, `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`);
  await createBackupZip(preRestoreFile);

  await removePath(TMP_RESTORE_DIR);
  await fsp.mkdir(TMP_RESTORE_DIR, { recursive: true });

  await fs.createReadStream(zipPath)
    .pipe(unzipper.Extract({ path: TMP_RESTORE_DIR }))
    .promise();

  const srcOpenclaw = path.join(TMP_RESTORE_DIR, 'openclaw_state');
  const srcWorkspace = path.join(TMP_RESTORE_DIR, 'workspace_files');

  if (fs.existsSync(srcOpenclaw)) {
    await copyRecursive(srcOpenclaw, OPENCLAW_DIR);
  }

  if (fs.existsSync(srcWorkspace)) {
    for (const rel of WORKSPACE_FILES) {
      const src = path.join(srcWorkspace, rel);
      if (fs.existsSync(src)) {
        await copyRecursive(src, path.join(WORKSPACE_DIR, rel));
      }
    }
  }

  await removePath(TMP_RESTORE_DIR);
  return preRestoreFile;
}

module.exports = {
  copyRecursive,
  createBackupZip,
  removePath,
  restoreBackup
};
