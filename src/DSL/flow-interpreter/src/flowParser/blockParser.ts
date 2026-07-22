import { LexerTokens } from '../types/tokens';
import { Ast } from '../contracts/ast';
import {
  StringLiteralAst,
  NumberLiteralAst,
  BooleanLiteralAst,
  IdentifierLiteralAst,
  ArrayAst,
  ObjectAst,
  ObjectProperty,
} from '../flowAst/ast';

function parseBlock(
  tokens: LexerTokens[],
  position: number,
): { node: ObjectAst; nextPosition: number } {
  return parseObject(tokens, position);
}

// it will parse the entire object
function parseObject(
  tokens: LexerTokens[],
  position: number,
): { node: ObjectAst; nextPosition: number } {
  const size = tokens.length;

  if (position >= size || tokens[position].token_type !== 'LBRACE') {
    throw new Error(`Expected '{' at position ${position}`);
  }
  position++; // consume '{'

  const properties: ObjectProperty[] = [];

  while (position < size && tokens[position].token_type !== 'RBRACE') {


    const currentToken = tokens[position];
    if (currentToken.token_type !== 'IDENTIFIER' && currentToken.token_type !== 'STRING') {
      throw new Error(`Expected identifier or string key at position ${position}`);
    }
    
    const key = currentToken.value;
    position++; // consume key identifier or string

    if (position >= size || tokens[position].token_type !== 'COLON') {
      throw new Error(`Expected ':' after key '${key}' at position ${position}`);
    }
    position++; // consume ':'

    const valResult = parseValue(tokens, position);
    properties.push({ key, value: valResult.node });
    position = valResult.nextPosition;

    // Optional comma separator
    if (position < size && tokens[position].token_type === 'COMMA') {
      position++; // consume ','
    }
  }

  if (position >= size || tokens[position].token_type !== 'RBRACE') {
    throw new Error(`Expected '}' at position ${position}`);
  }
  position++; // consume '}'

  return {
    node: new ObjectAst(properties),
    nextPosition: position,
  };
}

function parseArray(
  tokens: LexerTokens[],
  position: number,
): { node: ArrayAst; nextPosition: number } {
  const size = tokens.length;

  if (position >= size || tokens[position].token_type !== 'LBRACKET') {
    throw new Error(`Expected '[' at position ${position}`);
  }
  position++; // consume '['

  const elements: Ast[] = [];

  while (position < size && tokens[position].token_type !== 'RBRACKET') {
    const valResult = parseValue(tokens, position);
    elements.push(valResult.node);
    position = valResult.nextPosition;

    // Optional comma separator
    if (position < size && tokens[position].token_type === 'COMMA') {
      position++; // consume ','
    }
  }

  if (position >= size || tokens[position].token_type !== 'RBRACKET') {
    throw new Error(`Expected ']' at position ${position}`);
  }
  position++; // consume ']'

  return {
    node: new ArrayAst(elements),
    nextPosition: position,
  };
}

function parseValue(tokens: LexerTokens[], position: number): { node: Ast; nextPosition: number } {
  const size = tokens.length;
  if (position >= size) {
    throw new Error('Unexpected end of tokens in parseValue');
  }

  const token = tokens[position];

  if (token.token_type === 'STRING') {
    return {
      node: new StringLiteralAst(token.value),
      nextPosition: position + 1,
    };
  }

  if (token.token_type === 'NUMBER') {
    return {
      node: new NumberLiteralAst(token.value),
      nextPosition: position + 1,
    };
  }

  if (token.token_type === 'BOOL') {
    return {
      node: new BooleanLiteralAst(token.value),
      nextPosition: position + 1,
    };
  }

  if (token.token_type === 'LBRACKET') {
    return parseArray(tokens, position);
  }

  if (token.token_type === 'LBRACE') {
    return parseObject(tokens, position);
  }

  if (token.token_type === 'IDENTIFIER') {
    return {
      node: new IdentifierLiteralAst(token.value),
      nextPosition: position + 1,
    };
  }

  throw new Error(`Unexpected token '${token.token_type}' in parseValue at position ${position}`);
}

export { parseBlock, parseObject, parseArray, parseValue };
