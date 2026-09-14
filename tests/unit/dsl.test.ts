import { describe, it, expect } from 'vitest';
import { compileDSL } from '../../src/DSL';

describe('DSL Flow Interpreter - Canvas Position (x, y coordinates)', () => {
  it('should compile nodes with explicit x and y coordinates', () => {
    const dsl = `
      define CLIENT c1 {
        x: 120,
        y: 240,
        label: "Mobile Client",
        requests: [
          {
            endpoint: "/api/posts",
            allowedMethods: ["GET"]
          }
        ]
      }

      define SERVER s1 {
        x: 450,
        y: 240,
        label: "API Gateway Server",
        capacity: 150
      }

      connect c1 -> s1
    `;

    const output = compileDSL(dsl);
    expect(output.nodes).toHaveLength(2);

    const clientNode = output.nodes.find((n) => n.id === 'c1');
    const serverNode = output.nodes.find((n) => n.id === 's1');

    expect(clientNode).toBeDefined();
    expect(clientNode.position).toEqual({ x: 120, y: 240 });
    expect(clientNode.data.x).toBe(120);
    expect(clientNode.data.y).toBe(240);
    expect(output.nodeConfigs.c1.x).toBe(120);
    expect(output.nodeConfigs.c1.y).toBe(240);

    expect(serverNode).toBeDefined();
    expect(serverNode.position).toEqual({ x: 450, y: 240 });
    expect(serverNode.data.x).toBe(450);
    expect(serverNode.data.y).toBe(240);
    expect(output.nodeConfigs.s1.x).toBe(450);
    expect(output.nodeConfigs.s1.y).toBe(240);
  });

  it('should support xAxis, yAxis, and nested position coordinates', () => {
    const dsl = `
      define REDIS r1 {
        xAxis: 300,
        yAxis: 500,
        label: "Redis Cache"
      }

      define POSTGRES db1 {
        position: { x: 600, y: 500 },
        label: "Postgres DB"
      }

      define LOADBALANCER lb1 {
        x_axis: 150,
        y_axis: 100,
        label: "Load Balancer"
      }
    `;

    const output = compileDSL(dsl);
    const redisNode = output.nodes.find((n) => n.id === 'r1');
    const dbNode = output.nodes.find((n) => n.id === 'db1');
    const lbNode = output.nodes.find((n) => n.id === 'lb1');

    expect(redisNode.position).toEqual({ x: 300, y: 500 });
    expect(dbNode.position).toEqual({ x: 600, y: 500 });
    expect(lbNode.position).toEqual({ x: 150, y: 100 });
  });

  it('should support negative coordinates', () => {
    const dsl = `
      define GATEWAY gw1 {
        x: -50,
        y: 80,
        label: "API Gateway"
      }
    `;

    const output = compileDSL(dsl);
    const gwNode = output.nodes.find((n) => n.id === 'gw1');
    expect(gwNode.position).toEqual({ x: -50, y: 80 });
  });

  it('should fallback to dynamic DAG layout when x or y is omitted', () => {
    const dsl = `
      define CLIENT c1 {
        label: "Client"
      }

      define SERVER s1 {
        label: "Server"
      }

      connect c1 -> s1
    `;

    const output = compileDSL(dsl);
    const clientNode = output.nodes.find((n) => n.id === 'c1');
    const serverNode = output.nodes.find((n) => n.id === 's1');

    // Auto layout sets layer 0 at x=80, layer 1 at x=380
    expect(clientNode.position.x).toBe(80);
    expect(serverNode.position.x).toBe(380);
  });

  it('should throw semantic error if x or y is not a number', () => {
    const invalidDsl = `
      define CLIENT c1 {
        x: "invalid_coordinate",
        label: "Client"
      }
    `;

    expect(() => compileDSL(invalidDsl)).toThrow(/Semantic Error.*must be a valid number/);
  });
});
