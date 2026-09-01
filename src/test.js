const { validateConfig } = require('./index');
const fs = require('fs');
const path = require('path');
const os = require('os');

function test(name, fn) {
  try {
    fn();
    console.log(`  PASS: ${name}`);
  } catch (e) {
    console.log(`  FAIL: ${name} - ${e.message}`);
    process.exitCode = 1;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-test-'));

console.log('config-validator tests\n');

test('validates correct env file', () => {
  const f = path.join(tmpDir, '.env');
  fs.writeFileSync(f, 'PORT=3000\nNODE_ENV=development\n');
  const result = validateConfig(f);
  assert(result.valid, 'Should be valid');
  assert(result.errors.length === 0, 'Should have no errors');
});

test('detects missing value', () => {
  const f = path.join(tmpDir, '.env2');
  fs.writeFileSync(f, 'PORT=3000\nAPI_KEY=\n');
  const result = validateConfig(f);
  assert(!result.valid, 'Should be invalid');
  assert(result.errors.length === 1, 'Should have 1 error');
});

test('ignores comments', () => {
  const f = path.join(tmpDir, '.env3');
  fs.writeFileSync(f, '# comment\nPORT=3000\n');
  const result = validateConfig(f);
  assert(result.valid, 'Should be valid');
});

test('handles values with equals sign', () => {
  const f = path.join(tmpDir, '.env4');
  fs.writeFileSync(f, 'URL=https://api.example.com?key=abc&v=2\n');
  const result = validateConfig(f);
  assert(result.valid, 'Should be valid');
});

test('strict mode detects duplicate keys', () => {
  const f = path.join(tmpDir, '.env5');
  fs.writeFileSync(f, 'PORT=3000\nPORT=8080\n');
  const result = validateConfig(f, { strict: true });
  assert(!result.valid, 'Should be invalid in strict mode');
  assert(result.errors.some(e => e.includes('Duplicate')), 'Should detect duplicate');
});

test('strict mode warns on non-uppercase keys', () => {
  const f = path.join(tmpDir, '.env6');
  fs.writeFileSync(f, 'port=3000\n');
  const result = validateConfig(f, { strict: true });
  assert(result.warnings.length > 0, 'Should have warnings');
  assert(result.warnings[0].includes('uppercase'), 'Should warn about case');
});

test('checks required keys', () => {
  const f = path.join(tmpDir, '.env7');
  fs.writeFileSync(f, 'PORT=3000\n');
  const result = validateConfig(f, { requiredKeys: ['PORT', 'DATABASE_URL'] });
  assert(!result.valid, 'Should be invalid');
  assert(result.errors.some(e => e.includes('DATABASE_URL')), 'Should report missing key');
});

test('returns discovered keys', () => {
  const f = path.join(tmpDir, '.env8');
  fs.writeFileSync(f, 'A=1\nB=2\nC=3\n');
  const result = validateConfig(f);
  assert(result.keys.length === 3, 'Should find 3 keys');
  assert(result.keys.includes('B'), 'Should include B');
});

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('\nDone.');
