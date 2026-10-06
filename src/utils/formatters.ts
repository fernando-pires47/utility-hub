import xmlFormatter from 'xml-formatter';

export type FormatType = 'json' | 'xml';

export interface FormatResult {
  success: boolean;
  formatted?: string;
  error?: string;
}

export const formatJSON = (input: string): FormatResult => {
  try {
    // First try to parse the JSON to validate it
    const parsed = JSON.parse(input.trim());
    // Then stringify with proper indentation
    const formatted = JSON.stringify(parsed, null, 2);
    return { success: true, formatted };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON format' 
    };
  }
};

export const formatXML = (input: string): FormatResult => {
  try {
    const formatted = xmlFormatter(input.trim(), {
      indentation: '  ',
      filter: (node) => node.type !== 'Comment',
      collapseContent: true,
      lineSeparator: '\n'
    });
    return { success: true, formatted };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Invalid XML format' 
    };
  }
};

export const formatContent = (input: string, type: FormatType): FormatResult => {
  if (!input.trim()) {
    return { success: false, error: 'Please enter some content to format' };
  }

  switch (type) {
    case 'json':
      return formatJSON(input);
    case 'xml':
      return formatXML(input);
    default:
      return { success: false, error: 'Unsupported format type' };
  }
};

export const detectFormat = (text: string): FormatType | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.startsWith('<')) return 'xml';
  return null;
};

export const formatPasted = (text: string): FormatResult | null => {
  const format = detectFormat(text);
  if (!format) return null;
  return formatContent(text, format);
};
