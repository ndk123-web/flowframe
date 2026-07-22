import { Ast } from '../contracts/ast';

class ConnectionAst implements Ast {
  from: string;
  to: string;

  constructor(from: string, to: string) {
    this.from = from;
    this.to = to;
  }

  toString(): string {
    return `Connection(${this.from} -> ${this.to})`;
  }
}

export { ConnectionAst };
