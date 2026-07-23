import { Ast } from '../contracts/ast';
import graphBuilder, { FlowFrameGraphOutput } from '../flowGraphBuilder/graphBuilder';

class InterpreterFlow {
  ast: Ast[] = [];

  constructor(ast: Ast[]) {
    this.ast = ast;
  }

  run(): FlowFrameGraphOutput {
    console.log('--- AST NODES ---', this.ast);

    const graphOutput = graphBuilder(this.ast);

    console.log('--- FINAL GENERATED FLOWFRAME GRAPH JSON ---', graphOutput);

    return graphOutput;
  }
}

export default InterpreterFlow;
