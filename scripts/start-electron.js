const { spawn, execSync } = require('child_process');
const electronPath = require('electron');
const path = require('path');

// Build main process TypeScript before launching
console.log('[electron-starter] building main process...');
try {
  execSync('npm run build', {
    cwd: path.join(__dirname, '..', 'main'),
    stdio: 'inherit',
  });
  console.log('[electron-starter] main build done');
} catch (err) {
  console.error('[electron-starter] main build failed:', err.message);
  process.exit(1);
}

// Give the Vite dev server a moment to fully initialize
setTimeout(() => {
  console.log('[electron-starter] launching electron...');
  const proc = spawn(String(electronPath), ['.'], {
    stdio: 'inherit',
  });
  proc.on('error', (err) => console.error('[electron-starter] spawn error:', err));
  proc.on('close', (code) => process.exit(code ?? 0));
}, 2000);
