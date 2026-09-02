const fs = require('fs');
const path = require('path');

function validateConfig(configPath, options = {}) {
  const { strict = false, requiredKeys = [] } = options;
  const content = fs.readFileSync(configPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  const errors = [];
  const warnings = [];
  const seen = new Set();

  for (const line of lines) {
    const [key, ...rest] = line.split('=');
    if (!key || rest.length === 0) {
      errors.push(`Invalid format: ${line}`);
      continue;
    }

    const trimmedKey = key.trim();
    const value = rest.join('=').trim();

    if (seen.has(trimmedKey)) {
      if (strict) {
        errors.push(`Duplicate key: ${trimmedKey}`);
      } else {
        warnings.push(`Duplicate key: ${trimmedKey}`);
      }
    }
    seen.add(trimmedKey);

    if (!value) {
      errors.push(`Empty value for key: ${trimmedKey}`);
    }

    if (strict && trimmedKey !== trimmedKey.toUpperCase()) {
      warnings.push(`Key not uppercase: ${trimmedKey}`);
    }

    if (strict && /\s/.test(key) && !key.startsWith('"')) {
      errors.push(`Key contains whitespace: "${key}"`);
    }
  }

  for (const req of requiredKeys) {
    if (!seen.has(req)) {
      errors.push(`Missing required key: ${req}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    keys: [...seen],
  };
}

function findConfigFiles(dir) {
  const patterns = ['.env', '.env.local', '.env.development', '.env.production'];
  return patterns
    .map(p => path.join(dir, p))
    .filter(p => fs.existsSync(p));
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const dir = args.find(a => !a.startsWith('--')) || process.cwd();
  const files = findConfigFiles(dir);

  if (files.length === 0) {
    console.log('No config files found.');
    process.exit(0);
  }

  let hasErrors = false;
  for (const file of files) {
    const result = validateConfig(file, { strict });
    console.log(`${path.basename(file)}: ${result.valid ? 'OK' : 'ERRORS'}`);
    result.errors.forEach(e => console.log(`  - ${e}`));
    if (strict) {
      result.warnings.forEach(w => console.log(`  ~ ${w}`));
    }
    if (!result.valid) hasErrors = true;
  }

  process.exit(hasErrors ? 1 : 0);
}

module.exports = { validateConfig, findConfigFiles };
