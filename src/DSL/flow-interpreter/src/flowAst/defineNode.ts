import { Ast } from '../contracts/ast';

class DefineNodeAst implements Ast {
  identiferName: string;
  typeOfNode: string;
  config: Ast | null;

  constructor(identiferName: string, typeOfNode: string, config?: Ast | null) {
    this.identiferName = identiferName;
    this.typeOfNode = typeOfNode;
    this.config = config || null;
  }

  toString(): string {
    return `DefineNode(typeOfNode:${this.typeOfNode}, identiferName:${this.identiferName}, config:${this.config})`;
  }
}

export { DefineNodeAst };