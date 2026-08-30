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

test('detects malformed line without equals', () => {
  const f = path.join(tmpDir, '.env5');
  fs.writeFileSync(f, 'PORT=3000\nBADLINE\n');
  const result = validateConfig(f);
  assert(!result.valid, 'Should be invalid');
  assert(result.errors.some(e => e.includes('Invalid format')), 'Should report format error');
});

test('handles empty file', () => {
  const f = path.join(tmpDir, '.env6');
  fs.writeFileSync(f, '');
  const result = validateConfig(f);
  assert(result.valid, 'Empty file should be valid');
  assert(result.errors.length === 0, 'Should have no errors');
});

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('\nDone.');
