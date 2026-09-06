import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const specYamlPath = resolve(root, '../data-layer/openapi/openapi.yaml');
const publicDir = resolve(root, 'public');
const publicSpecPath = resolve(publicDir, 'openapi.yaml');

mkdirSync(publicDir, { recursive: true });

if (existsSync(specYamlPath)) {
  copyFileSync(specYamlPath, publicSpecPath);
  console.log(`copied embedded OpenAPI spec to ${publicSpecPath}`);
} else if (existsSync(publicSpecPath)) {
  console.log(`using committed OpenAPI spec at ${publicSpecPath}`);
} else {
  console.error(`OpenAPI spec not found at ${specYamlPath} or ${publicSpecPath}`);
  process.exit(1);
}
