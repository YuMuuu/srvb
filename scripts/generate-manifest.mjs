import {Buffer} from 'node:buffer';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {build} from 'esbuild';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const parametersEntry = path.join(rootDir, 'src', 'shared', 'parameters.ts');
const manifestPath = path.join(rootDir, 'public', 'manifest.json');

const result = await build({
  entryPoints: [parametersEntry],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  logLevel: 'silent',
});

const bundledSource = result.outputFiles[0]?.text;

if (!bundledSource) {
  throw new Error('Failed to bundle shared parameter definitions');
}

const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundledSource).toString('base64')}`;
const {pluginManifest} = await import(moduleUrl);

await writeFile(manifestPath, `${JSON.stringify(pluginManifest, null, 2)}\n`);
