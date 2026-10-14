const fs = require('node:fs');
const path = require('node:path');
const { build, Platform, Arch } = require('electron-builder');

async function createInstaller() {
  const root = path.resolve(__dirname, '..');
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const application = path.join(root, 'release', 'package');
  fs.mkdirSync(application, { recursive: true });
  for (const item of ['dist', 'electron', 'LICENSE']) {
    fs.cpSync(path.join(root, item), path.join(application, item), { recursive: true });
  }
  const dependencies = {};
  for (const name of ['fflate', 'node-unrar-js']) {
    dependencies[name] = manifest.dependencies[name];
    fs.cpSync(path.join(root, 'node_modules', name), path.join(application, 'node_modules', name), {
      recursive: true,
    });
  }
  fs.writeFileSync(path.join(application, 'package.json'), JSON.stringify({
    name: manifest.name,
    version: manifest.version,
    description: manifest.description,
    main: manifest.main,
    type: manifest.type,
    author: manifest.author,
    license: manifest.license,
    dependencies,
  }, null, 2));
  await build({
    projectDir: root,
    targets: Platform.WINDOWS.createTarget(['nsis'], Arch.x64),
    config: {
      appId: 'com.clearleaf.reader',
      productName: 'Clearleaf 澄页',
      executableName: 'Clearleaf 澄页',
      directories: { app: application, output: path.join(root, 'release') },
      electronVersion: manifest.devDependencies.electron,
      electronDist: path.dirname(require('electron')),
      npmRebuild: false,
      asar: true,
      files: ['dist/**/*', 'electron/**/*', 'package.json', 'LICENSE'],
      artifactName: 'Clearleaf-Setup-${version}-${arch}.${ext}',
      win: { icon: path.join(root, 'public', 'app-icon.png') },
      nsis: {
        guid: '68800a7f-6b66-5d5e-993b-b6802d27eff2',
        oneClick: false,
        perMachine: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: '澄页 Clearleaf',
        deleteAppDataOnUninstall: false,
        runAfterFinish: false,
      },
      publish: null,
    },
  });
}
createInstaller().catch(error => { console.error(error); process.exitCode = 1; });
