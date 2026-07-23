import { lexerFlow } from './flow-interpreter/src/flowLexer/lexer';
import parserFlow from './flow-interpreter/src/flowParser/parser';
import semanticAnalyzer from './flow-interpreter/src/flowSemantic/semantic';
import InterpreterFlow from './flow-interpreter/src/flowInterpreter/interpreterFlow';
import type { FlowFrameGraphOutput } from './flow-interpreter/src/flowGraphBuilder/graphBuilder';

export function compileDSL(sourceCode: string): FlowFrameGraphOutput {
  const tokens = lexerFlow(sourceCode);
  const ast = parserFlow(tokens);
  const semanticAst = semanticAnalyzer(ast);
  const interpreter = new InterpreterFlow(semanticAst);
  return interpreter.run();
}

export type { FlowFrameGraphOutput };
