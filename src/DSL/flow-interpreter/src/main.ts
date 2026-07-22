import { Ast } from './contracts/ast';
import { lexerFlow } from './flowLexer/lexer';
import parserFlow from './flowParser/parser';
import { LexerTokens } from './types/tokens';
import InterpreterFlow from './flowInterpreter/interpreterFlow';
import semanticAnalyzer from './flowSemantic/semantic';

function main() {
  let sourceCode = `

        // handle and create client configs
        client c1 {
          requests: [
            {
              endpoint: "/posts", 
              allowedMethods: ["GET", "POST"], 
              body: {}, 
              key: "rohan"
            },
            {
              endpoint: "/users", 
              allowedMethods: ["GET", "POST"], 
              body: {}, 
              key: "rohan"
            },
          ],
          label: "Client",
          type: "Web Browser",
          valet: false,
        }
        
        // handle and create server configs
        server s1 {
          acceptedEndpoints: [
            {
              endpoint: "/posts", 
              allowedMethod: ["GET", "POST"]
            }
          ],
          tcpConnectionsToPostgres: 10,
          capacity: 100,
          label: "Post Server"
        }

        c1 -> s1
    `;

  const tokens: LexerTokens[] = lexerFlow(sourceCode);
  console.log('TOKENS: ', tokens);

  const ast: Ast[] = parserFlow(tokens);

  const semanticAst = semanticAnalyzer(ast);

  const interpreter = new InterpreterFlow(semanticAst);
  interpreter.run();
}

main();
