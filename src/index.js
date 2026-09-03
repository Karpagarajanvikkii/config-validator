const fs = require('fs');
const path = require('path');

function validateConfig(configPath) {
  const content = fs.readFileSync(configPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const errors = [];

  for (const rawLine of lines) {
    // Support the common `export KEY=value` convention used in sourceable .env files
    const line = rawLine.startsWith('export ') ? rawLine.slice('export '.length) : rawLine;
    const [key, ...rest] = line.split('=');
    if (!key || rest.length === 0) {
      errors.push(`Invalid format: ${line}`);
      continue;
    }
    const value = rest.join('=').trim();
    if (!value) {
      errors.push(`Empty value for key: ${key.trim()}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

function findConfigFiles(dir) {
  const patterns = ['.env', '.env.local', '.env.development', '.env.production'];
  return patterns
    .map(p => path.join(dir, p))
    .filter(p => fs.existsSync(p));
}

if (require.main === module) {
  const dir = process.argv[2] || process.cwd();
  const files = findConfigFiles(dir);

  if (files.length === 0) {
    console.log('No config files found.');
    process.exit(0);
  }

  let hasErrors = false;
  for (const file of files) {
    const result = validateConfig(file);
    console.log(`${path.basename(file)}: ${result.valid ? 'OK' : 'ERRORS'}`);
    result.errors.forEach(e => console.log(`  - ${e}`));
    if (!result.valid) hasErrors = true;
  }

  process.exit(hasErrors ? 1 : 0);
}

module.exports = { validateConfig, findConfigFiles };
