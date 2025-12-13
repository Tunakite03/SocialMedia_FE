import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
}

/**
 * Detects if the device supports touch events
 * @returns true if touch is supported, false otherwise
 */
export function isTouchDevice(): boolean {
   return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Detects if the current device is likely a mobile device based on screen size and touch capability
 * @returns true if mobile device, false otherwise
 */
export function isMobileDevice(): boolean {
   return isTouchDevice() && window.innerWidth <= 768;
}

/**
 * Formats a date to relative time (e.g., "2 hours ago")
 * @param date - The date to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: string | Date): string {
   return formatDistanceToNow(new Date(date), { addSuffix: true });
}
