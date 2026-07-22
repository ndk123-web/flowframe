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
    const typeOfToken: string = tokens[position]['token_type'];

    if (DATA_TYPES[typeOfToken] !== undefined) {
      let response: DefineParse = defineParser(tokens, position, typeOfToken);
      let identiferName: string = response['identifer_name'];

      let node: DefineNodeAst = new DefineNodeAst(identiferName, typeOfToken, response.config);
      ast.push(node);

      position = response.position;
    } else if (
      typeOfToken === 'IDENTIFIER' &&
      position + 1 < size &&
      tokens[position + 1]['token_type'] === 'CONNECT'
    ) {
      let from = tokens[position].value;
      position += 2; // consume initial IDENTIFIER and CONNECT

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
      // Prevent infinite loop by moving to next token if token type is unhandled
      position++;
    }
  }

  return ast;
}

export default parserFlow;
