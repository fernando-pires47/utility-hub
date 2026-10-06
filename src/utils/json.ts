import JSON5 from 'json5';
import type { FormatResult } from './formatters';

export interface JSONValidationResult {
  valid: boolean;
  error?: string;
}

export const validateJSON = (input: string): JSONValidationResult => {
  if (!input.trim()) {
    return { valid: false, error: 'Please enter some JSON to validate.' };
  }

  try {
    JSON.parse(input);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON syntax.',
    };
  }
};

export const restructureJSON = (input: string): FormatResult => {
  if (!input.trim()) {
    return { success: false, error: 'Please enter some content to restructure.' };
  }

  try {
    const parsed: unknown = JSON5.parse(input);
    const formatted = JSON.stringify(parsed, (_key, value: unknown) => {
      // JSON.stringify silently replaces these values with null. Reject them
      // instead so that restructuring never hides unsupported numeric values.
      if (typeof value === 'number' && !Number.isFinite(value)) {
        throw new Error('NaN and Infinity cannot be represented in JSON.');
      }
      return value;
    }, 2);
    return { success: true, formatted };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unable to restructure JSON.',
    };
  }
};
