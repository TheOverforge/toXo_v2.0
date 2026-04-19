import { exec } from 'child_process';
import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';

const EXE = 'toxo-acrylic-v3.exe';
const CSC = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe';

// Retry loop inside the exe: calls SetWindowCompositionAttribute every 200 ms for
// 5 iterations (= 0, 200, 400, 600, 800 ms).  One of those will land after
// Chromium's GPU DirectComposition init is complete and the effect will stick.
// No cloak/uncloak — those had no effect on visible windows and caused DWM flashes.
const CS_SRC = [
  'using System;using System.Runtime.InteropServices;using System.Threading;',
  'class A{',
  '  [StructLayout(LayoutKind.Sequential)]struct AP{public int s,f;public uint c,a;}',
  '  [StructLayout(LayoutKind.Sequential)]struct WD{public int a;public IntPtr p,n;}',
  '  [DllImport("user32.dll")]static extern int SetWindowCompositionAttribute(IntPtr h,ref WD w);',
  '  static void Apply(IntPtr h){',
  '    var ap=new AP{s=4};',
  '    var ptr=Marshal.AllocHGlobal(Marshal.SizeOf(ap));',
  '    Marshal.StructureToPtr(ap,ptr,false);',
  '    var wd=new WD{a=19,p=ptr,n=(IntPtr)Marshal.SizeOf(ap)};',
  '    SetWindowCompositionAttribute(h,ref wd);',
  '    Marshal.FreeHGlobal(ptr);',
  '  }',
  '  static void Main(string[]v){',
  '    if(v.Length==0)return;',
  '    var h=new IntPtr(long.Parse(v[0]));',
  '    for(int i=0;i<5;i++){Apply(h);if(i<4)Thread.Sleep(200);}',
  '  }',
  '}',
].join('\n');

let _exePath: string | null = null;
let _compilePromise: Promise<void> | null = null;

/** Call once at app startup to kick off background compilation. */
export function prepareAcrylicHelper(): void {
  if (process.platform !== 'win32') return;
  if (!fs.existsSync(CSC)) { console.warn('[acrylic] csc.exe not found'); return; }

  const exePath = path.join(app.getPath('userData'), EXE);
  if (fs.existsSync(exePath)) { _exePath = exePath; return; }

  const csPath = exePath.replace('.exe', '.cs');
  fs.writeFileSync(csPath, CS_SRC, 'utf8');

  _compilePromise = new Promise(resolve => {
    exec(`"${CSC}" /nologo /optimize+ /out:"${exePath}" "${csPath}"`, err => {
      if (err) console.error('[acrylic] compile failed:', err.message);
      else if (fs.existsSync(exePath)) {
        _exePath = exePath;
        console.log('[acrylic] compiled →', exePath);
      }
      try { fs.unlinkSync(csPath); } catch { /* ignore */ }
      resolve();
    });
  });
}

/** Fire-and-forget: spawns the exe in the background, returns immediately. */
export function applyAcrylic(win: BrowserWindow): void {
  if (process.platform !== 'win32') return;

  const run = () => {
    if (!_exePath || win.isDestroyed()) return;
    // BigUInt64 to correctly read the HWND on 64-bit Windows
    const hwnd = win.getNativeWindowHandle().readBigUInt64LE(0);
    exec(`"${_exePath}" ${hwnd}`, err => {
      if (err) console.error('[acrylic] exe error:', err.message);
    });
  };

  // If first launch: wait for csc.exe compilation, then run
  if (_compilePromise) _compilePromise.then(run);
  else run();
}
