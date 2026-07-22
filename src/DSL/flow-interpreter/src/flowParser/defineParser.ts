import { LexerTokens } from '../types/tokens';
import { DATA_TYPES } from '../shared/dataTypes';
import { DefineParse } from '../types/parser';
import { parseBlock } from './blockParser';

function defineParser(tokens: LexerTokens[], position: number, tokenType: string) {
  let size = tokens.length;

  if (DATA_TYPES[tokens[position]['token_type']] == undefined) {
    throw Error(
      'Data Type Must be either of (client,server,loadbalancer,gateway,messagequeue,pubsub,postgres,redis)',
    );
  }
  position++;

  if (position < size && tokens[position]['token_type'] != 'IDENTIFIER') {
    throw Error('After Data type there must be valid Identifier');
  }

  let identifer_name: string = tokens[position]['value'];
  if (identifer_name.length === 0) throw Error('Identifier Name is Invalid');

  position++;

  let config = null;
  if (position < size && tokens[position].token_type === 'LBRACE') {
    const parseResult = parseBlock(tokens, position);
    config = parseResult.node;
    position = parseResult.nextPosition;
  }

  let response: DefineParse = {
    position: position,
    identifer_name: identifer_name,
    data: '',
    config: config,
  };

  return response;
}

export { defineParser };
