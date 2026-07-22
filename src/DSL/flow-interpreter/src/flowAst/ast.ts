import { Ast } from '../contracts/ast';

class StringLiteralAst implements Ast {
  value: string;
  constructor(value: string) {
    this.value = value;
  }
}

class NumberLiteralAst implements Ast {
  value: number;
  constructor(value: number) {
    this.value = value;
  }
}

class BooleanLiteralAst implements Ast {
  value: boolean;
  constructor(value: boolean) {
    this.value = value;
  }
}

class IdentifierLiteralAst implements Ast {
  value: string;
  constructor(value: string) {
    this.value = value;
  }
}

class ArrayAst implements Ast {
  elements: Ast[];
  constructor(elements: Ast[]) {
    this.elements = elements;
  }
}

export interface ObjectProperty {
  key: string;
  value: Ast;
}

class ObjectAst implements Ast {
  properties: ObjectProperty[];
  constructor(properties: ObjectProperty[]) {
    this.properties = properties;
  }
}

export {
  StringLiteralAst,
  NumberLiteralAst,
  BooleanLiteralAst,
  IdentifierLiteralAst,
  ArrayAst,
  ObjectAst,
};
