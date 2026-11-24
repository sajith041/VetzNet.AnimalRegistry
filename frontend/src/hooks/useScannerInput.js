import { useEffect, useRef, useState } from 'react';

/**
 * Captures rapid keystrokes from a Bluetooth/USB scanner.
 * Scanners "type" the chip number very fast (typically < 30ms per char)
 * and end with Enter.
 *
 * @param {Function} onScan - called with the scanned string
 * @param {Object} options
 * @param {boolean} options.enabled - turn the listener on/off
 * @param {number} options.minLength - minimum chars for valid scan
 * @param {number} options.maxDelayMs - max ms between chars to count as "scan" mode
 */
export default function useScannerInput(onScan, options = {}) {
  const {
    enabled = true,
    minLength = 9,
    maxDelayMs = 50,
  } = options;

  const bufferRef = useRef('');
  const lastKeyTimeRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e) {
      const now = Date.now();
      const elapsed = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If too much time passed since last key, reset buffer (human typing)
      if (elapsed > maxDelayMs) {
        bufferRef.current = '';
      }

      // Enter key = end of scan
      if (e.key === 'Enter') {
        const code = bufferRef.current.trim();
        if (code.length >= minLength) {
          e.preventDefault();
          onScan(code);
        }
        bufferRef.current = '';
        return;
      }

      // Only capture single printable characters
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, minLength, maxDelayMs, onScan]);
}