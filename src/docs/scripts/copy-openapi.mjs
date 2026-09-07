import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const specYamlPath = resolve(root, '../data-layer/openapi/openapi.yaml');
const publicDir = resolve(root, 'public');
const publicYamlPath = resolve(publicDir, 'openapi.yaml');
const publicJsonPath = resolve(publicDir, 'openapi.json');

mkdirSync(publicDir, { recursive: true });

if (existsSync(specYamlPath)) {
  copyFileSync(specYamlPath, publicYamlPath);
  const spec = parse(readFileSync(specYamlPath, 'utf8'));
  writeFileSync(publicJsonPath, JSON.stringify(spec));
  console.log(`copied embedded OpenAPI spec to ${publicYamlPath} and ${publicJsonPath}`);
} else if (existsSync(publicJsonPath)) {
  console.log(`using committed OpenAPI spec at ${publicJsonPath}`);
} else if (existsSync(publicYamlPath)) {
  const spec = parse(readFileSync(publicYamlPath, 'utf8'));
  writeFileSync(publicJsonPath, JSON.stringify(spec));
  console.log(`generated ${publicJsonPath} from committed yaml`);
} else {
  console.error(`OpenAPI spec not found at ${specYamlPath} or ${publicJsonPath}`);
  process.exit(1);
}
