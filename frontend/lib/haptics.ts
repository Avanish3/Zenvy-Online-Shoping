export function triggerHaptic(pattern: number | number[] = 12) {
  if (typeof window === "undefined") {
    return;
  }

  const vibrator = navigator as Navigator & { vibrate?: (input: number | number[]) => boolean };
  vibrator.vibrate?.(pattern);
}
