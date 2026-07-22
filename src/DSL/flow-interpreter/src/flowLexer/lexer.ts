import { getKeywods } from '../shared/keywords';
import type { LexerTokens } from '../types/tokens';
import { readString } from './readString';

function lexerFlow(sourceCode: string): LexerTokens[] {
  sourceCode = sourceCode.trim();

  console.log('Source Code: \n', sourceCode);

  const size = sourceCode.length;
  let position = 0;
  let word = '';

  const KEYWORDS: Record<string, string> = getKeywods();
  let tokens: LexerTokens[] = [];

  // for flush the word
  const flush = () => {
    if (word.length !== 0) {
      // for checking the keywords vs identifiers vs booleans vs numbers
      let tokenType = KEYWORDS[word];
      let tokenVal: any = word;
      if (tokenType) {
        // Keyword found
      } else if (word === 'true' || word === 'false') {
        tokenType = 'BOOL';
        tokenVal = word === 'true';
      } else if (/^\d+(\.\d+)?$/.test(word)) {
        tokenType = 'NUMBER';
        tokenVal = Number(word);
      } else {
        tokenType = 'IDENTIFIER';
      }
      let token: LexerTokens = { token_type: tokenType, value: tokenVal };
      tokens.push(token);
      word = ''; // ALWAYS reset word after flushing
    }
  };

  while (position < size) {
    const character: string = sourceCode[position];
    

    // handle comments 
    if (character === '/' && position + 1 < size && sourceCode[position + 1] === '/') {
      while (sourceCode[position] !== '\n') {
        position++;
      }
    }

    else if (character === ' ' || character === '\t' || character === '\n' || character === '\r') {
      flush();
    } else if (character === '"' || character === "'") {
      flush();
      const stringResult = readString(sourceCode, position);
      tokens.push({ token_type: 'STRING', value: stringResult.value });
      position = stringResult.nextPosition - 1; // subtract 1 because loop ends with position++
    } else if (character == '-' && position + 1 < size && sourceCode[position + 1] == '>') {
      flush();
      let token: LexerTokens = { token_type: KEYWORDS['->'], value: '->' };
      tokens.push(token);
      position++; // consume '-'
    } else if (character === ',') {
      flush(); // Flush preceding word (e.g. 'c1') before adding comma token
      let token: LexerTokens = {
        token_type: KEYWORDS[','] || 'COMMA',
        value: character,
      };
      tokens.push(token);
    } else if (
      (character >= 'a' && character <= 'z') ||
      (character >= 'A' && character <= 'Z') ||
      (character >= '0' && character <= '9') ||
      character === '_'
    ) {
      word = word + character;
    }

    // Handle chars
    else if (character == '{') {
      flush();
      tokens.push({ token_type: KEYWORDS[character], value: character });
    } else if (character == '}') {
      flush();
      tokens.push({ token_type: KEYWORDS[character], value: character });
    } else if (character == ']') {
      flush();
      tokens.push({ token_type: KEYWORDS[character] });
    } else if (character == '[') {
      flush();
      tokens.push({ token_type: KEYWORDS[character], value: character });
    } else if (character == ':') {
      flush();
      tokens.push({ token_type: KEYWORDS[':'], value: character });
    }

    position++;
  }

  // Final flush for any trailing word
  flush();

  return tokens;
}

export { lexerFlow };
