export interface SoundEntry {
  key: string;
  label: string;
}

export const NOTIFICATION_SOUNDS: SoundEntry[] = [
  { key: 'toXo_default',               label: 'Default' },
  { key: 'toXo_bright_minimal_stereo', label: 'Bright Minimal' },
  { key: 'toXo_deep_luxe_stereo',      label: 'Deep Luxe' },
  { key: 'toXo_double_check_stereo',   label: 'Double Check' },
  { key: 'toXo_ultra_soft_stereo',     label: 'Ultra Soft' },
  { key: 'toXo_warm_tap_chime_stereo', label: 'Warm Tap Chime' },
];

let _current: HTMLAudioElement | null = null;

export function playNotificationSound(key: string): void {
  try {
    if (_current) {
      _current.pause();
      _current.src = '';
      _current = null;
    }
    const audio = new Audio(`./sounds/${key}.wav`);
    audio.volume = 1.0;
    audio.play().catch(() => {});
    _current = audio;
  } catch {
    // ignore
  }
}
