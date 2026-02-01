import pako from 'pako';
import { ReceiptJSON } from './receipt';

/**
 * Simple URL encoding for any string
 */
export function encodeForURL(data: string): string {
  const compressed = pako.deflate(data);
  const base64 = btoa(String.fromCharCode(...compressed));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode string from URL
 */
export function decodeFromURL(encoded: string): string {
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return pako.inflate(bytes, { to: 'string' });
}

/**
 * Compress and encode receipt JSON for URL sharing
 * Uses pako (gzip) + base64url encoding
 */
export function encodeReceiptForURL(receipt: ReceiptJSON): string {
  const jsonString = JSON.stringify(receipt);
  const compressed = pako.deflate(jsonString);
  const base64 = btoa(String.fromCharCode(...compressed));
  // Convert to base64url (URL-safe)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode receipt JSON from URL hash
 */
export function decodeReceiptFromURL(encoded: string): ReceiptJSON {
  // Convert from base64url to base64
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  const decompressed = pako.inflate(bytes, { to: 'string' });
  return JSON.parse(decompressed);
}

/**
 * Generate shareable link for a receipt
 */
export function generateShareLink(receipt: ReceiptJSON): string {
  const encoded = encodeReceiptForURL(receipt);
  const baseUrl = window.location.origin;
  return `${baseUrl}/verify#receipt=${encoded}`;
}

/**
 * Parse receipt from URL hash
 */
export function parseReceiptFromHash(): ReceiptJSON | null {
  const hash = window.location.hash;
  if (!hash.startsWith('#receipt=')) {
    return null;
  }
  
  try {
    const encoded = hash.slice('#receipt='.length);
    return decodeReceiptFromURL(encoded);
  } catch (error) {
    console.error('Failed to parse receipt from URL:', error);
    return null;
  }
}

/**
 * Download JSON file
 */
export function downloadJSON(data: object, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read JSON file
 */
export function readJSONFile<T>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        resolve(json);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}
