let _timer: ReturnType<typeof setTimeout> | null = null;

export function startInactivityTimer(onLock: () => void, ms: number): void {
  clearInactivityTimer();
  _timer = setTimeout(onLock, ms);
}

export function resetInactivityTimer(onLock: () => void, ms: number): void {
  startInactivityTimer(onLock, ms);
}

export function clearInactivityTimer(): void {
  if (_timer !== null) {
    clearTimeout(_timer);
    _timer = null;
  }
}
