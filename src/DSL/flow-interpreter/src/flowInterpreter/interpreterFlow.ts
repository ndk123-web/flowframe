import { Ast } from '../contracts/ast';
import graphBuilder, { FlowFrameGraphOutput } from '../flowGraphBuilder/graphBuilder';
import util from 'util';

class InterpreterFlow {
  ast: Ast[] = [];

  constructor(ast: Ast[]) {
    this.ast = ast;
  }

  run(): FlowFrameGraphOutput {
    console.log('\n--- AST NODES ---');
    console.log(util.inspect(this.ast, { depth: null, colors: true }));

    const graphOutput = graphBuilder(this.ast);

    console.log('\n--- FINAL GENERATED FLOWFRAME GRAPH JSON ---');
    console.log(util.inspect(graphOutput, { depth: null, colors: true }));

    return graphOutput;
  }
}

export default InterpreterFlow;
