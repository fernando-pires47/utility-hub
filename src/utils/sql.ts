import { format, type SqlLanguage } from 'sql-formatter';

export const sqlDialects = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'transactsql', label: 'SQL Server' },
  { value: 'plsql', label: 'Oracle PL/SQL' },
] as const satisfies ReadonlyArray<{ value: SqlLanguage; label: string }>;

export type SqlDialect = typeof sqlDialects[number]['value'];

export function formatSQL(input: string, dialect: SqlDialect = 'sql') {
  if (!input.trim()) return { success: false as const, error: 'Please enter some SQL to format.' };
  try {
    return { success: true as const, formatted: format(input, { language: dialect, tabWidth: 2, keywordCase: 'upper' }) };
  } catch (error) {
    return { success: false as const, error: error instanceof Error ? error.message : 'Unable to format SQL.' };
  }
}
