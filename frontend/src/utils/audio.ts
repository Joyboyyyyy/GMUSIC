/**
 * Audio wrapper for expo-av
 * Provides audio playback functionality on mobile platforms
 */
import { Audio, Video } from 'expo-av';

/**
 * Check if Audio is available on the current platform
 * @returns true if Audio is available
 */
export function isAudioAvailable(): boolean {
  return Audio !== null;
}

/**
 * Check if Video is available on the current platform
 * @returns true if Video is available
 */
export function isVideoAvailable(): boolean {
  return Video !== null;
}

/**
 * Get the Audio module (for advanced usage)
 * @returns Audio module
 */
export function getAudioModule(): any {
  return Audio;
}

/**
 * Get the Video module (for advanced usage)
 * @returns Video module
 */
export function getVideoModule(): any {
  return Video;
}

// Re-export Audio and Video for direct usage
export { Audio, Video };

