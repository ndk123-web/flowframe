function readString(
  sourceCode: string,
  position: number,
): { value: string; nextPosition: number } {
  const quote = sourceCode[position];
  let value = '';
  let i = position + 1;
  const size = sourceCode.length;

  while (i < size && sourceCode[i] !== quote) {
    value += sourceCode[i];
    i++;
  }

  if (i < size && sourceCode[i] === quote) {
    i++; // consume the closing quote
  } else {
    throw new Error('Unterminated string literal');
  }

  return {
    value,
    nextPosition: i,
  };
}

export { readString };