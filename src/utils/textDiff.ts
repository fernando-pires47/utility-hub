export interface TextDiffLine {
  type: 'same' | 'add' | 'del';
  indent: number;
  text: string;
}

export function textDiffLines(left: string, right: string): TextDiffLine[] {
  const leftLines = left.split('\n');
  const rightLines = right.split('\n');
  if (left === right) return leftLines.map((text) => ({ type: 'same', indent: 0, text }));

  // Bound the memory used by the longest common subsequence matrix.
  if (leftLines.length * rightLines.length > 1_000_000) {
    return [
      ...leftLines.map((text) => ({ type: 'del' as const, indent: 0, text })),
      ...rightLines.map((text) => ({ type: 'add' as const, indent: 0, text })),
    ];
  }

  const lcs = Array.from({ length: leftLines.length + 1 }, () => new Uint32Array(rightLines.length + 1));
  for (let i = leftLines.length - 1; i >= 0; i--) {
    for (let j = rightLines.length - 1; j >= 0; j--) {
      lcs[i][j] = leftLines[i] === rightLines[j]
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const lines: TextDiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < leftLines.length && j < rightLines.length) {
    if (leftLines[i] === rightLines[j]) {
      lines.push({ type: 'same', indent: 0, text: leftLines[i] });
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      lines.push({ type: 'del', indent: 0, text: leftLines[i++] });
    } else {
      lines.push({ type: 'add', indent: 0, text: rightLines[j++] });
    }
  }
  while (i < leftLines.length) lines.push({ type: 'del', indent: 0, text: leftLines[i++] });
  while (j < rightLines.length) lines.push({ type: 'add', indent: 0, text: rightLines[j++] });
  return lines;
}

export function editorDiffLines(left: string, right: string) {
  const lines = textDiffLines(left, right);
  return {
    left: lines.filter((line) => line.type !== 'add'),
    right: lines.filter((line) => line.type !== 'del'),
  };
}
