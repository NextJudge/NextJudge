import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const specYamlPath = resolve(root, '../data-layer/openapi/openapi.yaml');
const publicDir = resolve(root, 'public');

mkdirSync(publicDir, { recursive: true });
copyFileSync(specYamlPath, resolve(publicDir, 'openapi.yaml'));
console.log(`copied embedded OpenAPI spec to ${resolve(publicDir, 'openapi.yaml')}`);
