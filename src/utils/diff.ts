import { detectFormat } from './formatters';
import { textDiffLines } from './textDiff';

export type DiffLineType = 'same' | 'add' | 'del';

export interface DiffLine {
  type: DiffLineType;
  indent: number;
  text: string;
}

export interface DiffResult {
  success: boolean;
  lines: DiffLine[];
  changed: boolean;
  error?: string;
  leftError?: string;
  rightError?: string;
}

const deepEqual = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(
    (key) =>
      Object.prototype.hasOwnProperty.call(objB, key) && deepEqual(objA[key], objB[key]),
  );
};

const primitiveToString = (value: unknown): string => {
  if (value === null) return 'null';
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
};

const emitJsonSame = (
  value: unknown,
  indent: number,
  out: DiffLine[],
  type: DiffLineType,
  label: string,
) => {
  if (value !== null && typeof value === 'object') {
    const isArr = Array.isArray(value);
    out.push({ type, indent, text: `${label}${isArr ? '[' : '{'}` });
    if (isArr) {
      (value as unknown[]).forEach((item) => emitJsonSame(item, indent + 1, out, type, ''));
    } else {
      const obj = value as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        emitJsonSame(obj[key], indent + 1, out, type, `${JSON.stringify(key)}: `);
      }
    }
    out.push({ type, indent, text: isArr ? ']' : '}' });
  } else {
    out.push({ type, indent, text: `${label}${primitiveToString(value)}` });
  }
};

const jsonDiffLines = (
  a: unknown,
  b: unknown,
  indent: number,
  out: DiffLine[],
  label: string,
) => {
  if (deepEqual(a, b)) {
    emitJsonSame(a, indent, out, 'same', label);
    return;
  }

  const bothContainers =
    a !== null &&
    b !== null &&
    typeof a === 'object' &&
    typeof b === 'object' &&
    Array.isArray(a) === Array.isArray(b);

  if (!bothContainers) {
    if (a !== null && typeof a === 'object') emitJsonSame(a, indent, out, 'del', label);
    else out.push({ type: 'del', indent, text: `${label}${primitiveToString(a)}` });
    if (b !== null && typeof b === 'object') emitJsonSame(b, indent, out, 'add', label);
    else out.push({ type: 'add', indent, text: `${label}${primitiveToString(b)}` });
    return;
  }

  const isArr = Array.isArray(a);
  out.push({ type: 'same', indent, text: `${label}${isArr ? '[' : '{'}` });

  if (isArr) {
    const arrA = a as unknown[];
    const arrB = b as unknown[];
    const len = Math.max(arrA.length, arrB.length);
    for (let i = 0; i < len; i++) {
      if (i < arrA.length && i < arrB.length) {
        jsonDiffLines(arrA[i], arrB[i], indent + 1, out, '');
      } else if (i < arrA.length) {
        emitJsonSame(arrA[i], indent + 1, out, 'del', '');
      } else {
        emitJsonSame(arrB[i], indent + 1, out, 'add', '');
      }
    }
  } else {
    const objA = a as Record<string, unknown>;
    const objB = b as Record<string, unknown>;
    const keys = Array.from(
      new Set([...Object.keys(objA), ...Object.keys(objB)]),
    ).sort();
    for (const key of keys) {
      const inA = Object.prototype.hasOwnProperty.call(objA, key);
      const inB = Object.prototype.hasOwnProperty.call(objB, key);
      const keyLabel = `${JSON.stringify(key)}: `;
      if (inA && inB) {
        jsonDiffLines(objA[key], objB[key], indent + 1, out, keyLabel);
      } else if (inA) {
        emitJsonSame(objA[key], indent + 1, out, 'del', keyLabel);
      } else {
        emitJsonSame(objB[key], indent + 1, out, 'add', keyLabel);
      }
    }
  }

  out.push({ type: 'same', indent, text: isArr ? ']' : '}' });
};

interface XmlNode {
  tag: string;
  attrs: Record<string, string>;
  text: string;
  children: XmlNode[];
}

const escapeXmlText = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const escapeXmlAttribute = (value: string): string =>
  escapeXmlText(value).replace(/"/g, '&quot;');

const formatAttributes = (attrs: Record<string, string>): string =>
  Object.keys(attrs)
    .sort()
    .map((name) => ` ${name}="${escapeXmlAttribute(attrs[name])}"`)
    .join('');

const serializeXmlNode = (node: XmlNode): string =>
  JSON.stringify([
    node.tag,
    Object.keys(node.attrs)
      .sort()
      .map((name) => [name, node.attrs[name]]),
    node.text,
    node.children.map(serializeXmlNode),
  ]);

const elementToNode = (element: Element): XmlNode => {
  const attrs: Record<string, string> = {};
  for (const attr of Array.from(element.attributes)) {
    attrs[attr.name] = attr.value;
  }
  let text = '';
  const children: XmlNode[] = [];
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const value = child.nodeValue ?? '';
      if (value.trim()) {
        text = text ? `${text} ${value.trim()}` : value.trim();
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      children.push(elementToNode(child as Element));
    }
  }
  return { tag: element.tagName, attrs, text, children };
};

const parseXmlNode = (input: string): { node?: XmlNode; error?: string } => {
  const doc = new DOMParser().parseFromString(input, 'application/xml');
  if (doc.getElementsByTagName('parsererror').length > 0) {
    return { error: 'Invalid XML document' };
  }
  const root = doc.documentElement;
  if (!root) return { error: 'XML document has no root element' };
  return { node: elementToNode(root) };
};

const emitXmlSame = (
  node: XmlNode,
  indent: number,
  out: DiffLine[],
  type: DiffLineType,
) => {
  const attrs = formatAttributes(node.attrs);
  const selfClosing = node.children.length === 0 && node.text === '';
  out.push({ type, indent, text: `<${node.tag}${attrs}${selfClosing ? ' />' : '>'}` });
  if (selfClosing) return;
  if (node.text) {
    out.push({ type, indent: indent + 1, text: escapeXmlText(node.text) });
  }
  node.children.forEach((child) => emitXmlSame(child, indent + 1, out, type));
  out.push({ type, indent, text: `</${node.tag}>` });
};

const xmlDiffLines = (a: XmlNode, b: XmlNode, indent: number, out: DiffLine[]) => {
  if (serializeXmlNode(a) === serializeXmlNode(b)) {
    emitXmlSame(a, indent, out, 'same');
    return;
  }
  if (a.tag !== b.tag) {
    emitXmlSame(a, indent, out, 'del');
    emitXmlSame(b, indent, out, 'add');
    return;
  }

  const attrNames = Array.from(
    new Set([...Object.keys(a.attrs), ...Object.keys(b.attrs)]),
  ).sort();
  const attrsDiffer = attrNames.some(
    (name) => (a.attrs[name] ?? null) !== (b.attrs[name] ?? null),
  );
  if (!attrsDiffer) {
    out.push({ type: 'same', indent, text: `<${a.tag}${formatAttributes(a.attrs)}>` });
  } else {
    out.push({ type: 'del', indent, text: `<${a.tag}${formatAttributes(a.attrs)}>` });
    out.push({ type: 'add', indent, text: `<${b.tag}${formatAttributes(b.attrs)}>` });
  }

  if ((a.text || null) !== (b.text || null)) {
    if (a.text) out.push({ type: 'del', indent: indent + 1, text: escapeXmlText(a.text) });
    if (b.text) out.push({ type: 'add', indent: indent + 1, text: escapeXmlText(b.text) });
  } else if (a.text) {
    out.push({ type: 'same', indent: indent + 1, text: escapeXmlText(a.text) });
  }

  const usedB = new Set<number>();
  const pairs = new Map<number, number>();
  a.children.forEach((childA, indexA) => {
    const indexB = b.children.findIndex(
      (childB, i) => !usedB.has(i) && childB.tag === childA.tag,
    );
    if (indexB === -1) return;
    pairs.set(indexA, indexB);
    usedB.add(indexB);
  });
  const onlyB = b.children
    .map((_, index) => index)
    .filter((index) => !usedB.has(index));

  a.children.forEach((childA, indexA) => {
    const indexB = pairs.get(indexA);
    if (indexB === undefined) {
      emitXmlSame(childA, indent + 1, out, 'del');
    } else {
      xmlDiffLines(childA, b.children[indexB], indent + 1, out);
    }
  });
  onlyB.forEach((index) => emitXmlSame(b.children[index], indent + 1, out, 'add'));
};

export const diffContent = (left: string, right: string): DiffResult => {
  const leftTrimmed = left.trim();
  const rightTrimmed = right.trim();

  if (!left && !right) {
    return { success: true, lines: [], changed: false };
  }
  if (!left || !right) {
    return { success: true, lines: [], changed: false, error: 'Paste content on both sides to compare.' };
  }

  const leftFormat = detectFormat(leftTrimmed);
  const rightFormat = detectFormat(rightTrimmed);

  if (!leftFormat && !rightFormat) {
    const lines = textDiffLines(left, right);
    return { success: true, lines, changed: lines.some((line) => line.type !== 'same') };
  }

  if (!leftFormat || !rightFormat || leftFormat !== rightFormat) {
    return {
      success: false,
      lines: [],
      changed: false,
      error: `Left side is ${leftFormat?.toUpperCase() ?? 'plain text'} but right side is ${rightFormat?.toUpperCase() ?? 'plain text'}. Compare the same format on both sides.`,
    };
  }

  if (leftFormat === 'json') {
    let parsedLeft: unknown;
    let parsedRight: unknown;
    try {
      parsedLeft = JSON.parse(leftTrimmed);
    } catch (error) {
      return {
        success: false,
        lines: [],
        changed: false,
        error: 'Fix the left side to compare.',
        leftError: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }
    try {
      parsedRight = JSON.parse(rightTrimmed);
    } catch (error) {
      return {
        success: false,
        lines: [],
        changed: false,
        error: 'Fix the right side to compare.',
        rightError: error instanceof Error ? error.message : 'Invalid JSON',
      };
    }
    const lines: DiffLine[] = [];
    jsonDiffLines(parsedLeft, parsedRight, 0, lines, '');
    return { success: true, lines, changed: lines.some((line) => line.type !== 'same') };
  }

  const parsedLeftXml = parseXmlNode(leftTrimmed);
  if (parsedLeftXml.error) {
    return {
      success: false,
      lines: [],
      changed: false,
      error: 'Fix the left side to compare.',
      leftError: parsedLeftXml.error,
    };
  }
  const parsedRightXml = parseXmlNode(rightTrimmed);
  if (parsedRightXml.error) {
    return {
      success: false,
      lines: [],
      changed: false,
      error: 'Fix the right side to compare.',
      rightError: parsedRightXml.error,
    };
  }

  const lines: DiffLine[] = [];
  xmlDiffLines(parsedLeftXml.node!, parsedRightXml.node!, 0, lines);
  return { success: true, lines, changed: lines.some((line) => line.type !== 'same') };
};
