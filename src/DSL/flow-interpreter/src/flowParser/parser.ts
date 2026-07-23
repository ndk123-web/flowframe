import { LexerTokens } from '../types/tokens';
import { DATA_TYPES } from '../shared/dataTypes';
import { defineParser } from './defineParser';
import { DefineParse } from '../types/parser';
import { Ast } from '../contracts/ast';
import { DefineNodeAst } from '../flowAst/defineNode';
import { ConnectionAst } from '../flowAst/connectionNode';

function parserFlow(tokens: LexerTokens[]): Ast[] {
  let position = 0;
  const size = tokens.length;

  let ast: Ast[] = [];

  while (position < size) {
    let typeOfToken: string = tokens[position]['token_type'];

    // Handle optional 'define' keyword before node data type
    if (typeOfToken === 'DEFINE') {
      position++;
      if (position < size) {
        typeOfToken = tokens[position]['token_type'];
      }
    }

    if (DATA_TYPES[typeOfToken] !== undefined) {
      let response: DefineParse = defineParser(tokens, position, typeOfToken);
      let identiferName: string = response['identifer_name'];

      let node: DefineNodeAst = new DefineNodeAst(identiferName, typeOfToken, response.config);
      ast.push(node);

      position = response.position;
    } else if (
      typeOfToken === 'CONNECT_KEYWORD' ||
      (typeOfToken === 'IDENTIFIER' &&
        position + 1 < size &&
        tokens[position + 1]['token_type'] === 'CONNECT')
    ) {
      if (typeOfToken === 'CONNECT_KEYWORD') {
        position++; // consume 'connect' keyword
      }

      if (position >= size || tokens[position]['token_type'] !== 'IDENTIFIER') {
        throw new Error(`Syntax Error: Expected source node identifier after 'connect'`);
      }

      let from = tokens[position].value;
      position++; // consume source IDENTIFIER

      if (position >= size || tokens[position]['token_type'] !== 'CONNECT') {
        throw new Error(`Syntax Error: Expected '->' after node '${from}'`);
      }
      position++; // consume '->'

      while (position < size && tokens[position]['token_type'] === 'IDENTIFIER') {
        let to = tokens[position].value;
        ast.push(new ConnectionAst(from, to));
        from = to;
        position++; // consume target IDENTIFIER

        if (position < size && tokens[position]['token_type'] === 'CONNECT') {
          position++; // consume next CONNECT
        } else {
          break;
        }
      }
    } else {
      const invalidTokenVal = tokens[position].value || tokens[position].token_type;
      throw new Error(`Syntax Error: Unexpected keyword or token '${invalidTokenVal}'`);
    }
  }

  return ast;
}

export default parserFlow;
