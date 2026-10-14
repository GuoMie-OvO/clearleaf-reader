const fs = require('node:fs');
const path = require('node:path');
const asar = require('@electron/asar');
async function pack() {
  const root = path.resolve(__dirname, '..');
  const release = path.join(root, 'release');
  const stage = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'clearleaf-pack-'));
  try {
    for (const item of ['dist', 'electron', 'package.json', 'LICENSE'])
      fs.cpSync(path.join(root, item), path.join(stage, item), { recursive: true });
    for (const dependency of ['fflate', 'node-unrar-js'])
      fs.cpSync(
        path.join(root, 'node_modules', dependency),
        path.join(stage, 'node_modules', dependency),
        { recursive: true },
      );
    fs.mkdirSync(release, { recursive: true });
    await asar.createPackage(stage, path.join(release, 'app.asar'));
    console.log('Packaged release/app.asar');
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
}
pack().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
