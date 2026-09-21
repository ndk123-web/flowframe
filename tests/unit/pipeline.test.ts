import { describe, it, expect } from "vitest";
import { compileDSL } from "@/DSL";
import { compileSimulationPipeline } from "@/utils/simulationCompiler";

describe("Dynamic Endpoint Pipelines", () => {
  it("Scenario 1: Cache-Aside Read Pipeline (GET -> Redis -> Postgres)", () => {
    const dsl = `
      define CLIENT c1 {
        requests: [
          {
            endpoint: "/api/v1/posts",
            allowedMethods: ["GET"]
          }
        ]
      }

      define SERVER s1 {
        capacity: 100,
        acceptedEndpoints: [
          {
            endpoint: "/api/v1/posts",
            allowedMethod: ["GET"],
            pipeline: ["r1", "db1"]
          }
        ]
      }

      define REDIS r1 {
        data: [{ key: "posts", value: "cached posts" }]
      }

      define POSTGRES db1 {
        table: "posts",
        data: [{ key: "posts", value: "db posts" }]
      }

      connect c1 -> s1
      connect s1 -> r1
      connect s1 -> db1
    `;

    const astResult = compileDSL(dsl);
    expect(astResult.nodeConfigs.s1.endpointPipelines).toBeDefined();
    expect(astResult.nodeConfigs.s1.endpointPipelines["/api/v1/posts"]).toEqual(["r1", "db1"]);

    const simResult = compileSimulationPipeline({
      activeNodes: astResult.nodes,
      activeEdges: astResult.edges,
      activeConfigs: astResult.nodeConfigs,
    });

    const actions = simResult.simulationFrames.map((f) => ({
      from: f.from,
      to: f.to,
      action: f.action,
    }));

    // Server should forward to r1 first, then upon miss to db1
    const r1Hop = actions.find((a) => a.from === "s1" && a.to === "r1");
    const db1Hop = actions.find((a) => a.from === "s1" && a.to === "db1");

    expect(r1Hop).toBeDefined();
    expect(db1Hop).toBeDefined();

    // Verify ordering: r1 comes before db1 in the execution path
    const r1Index = actions.findIndex((a) => a.from === "s1" && a.to === "r1");
    const db1Index = actions.findIndex((a) => a.from === "s1" && a.to === "db1");
    expect(r1Index).toBeLessThan(db1Index);
  });

  it("Scenario 2: Direct Database Write Pipeline (POST -> Postgres Only, skips Redis)", () => {
    const dsl = `
      define CLIENT c1 {
        requests: [
          {
            endpoint: "/api/v1/posts",
            allowedMethods: ["POST"]
          }
        ]
      }

      define SERVER s1 {
        capacity: 100,
        acceptedEndpoints: [
          {
            endpoint: "/api/v1/posts",
            allowedMethod: ["POST"],
            pipeline: ["db1"]
          }
        ]
      }

      define REDIS r1 {
        data: [{ key: "posts", value: "cached posts" }]
      }

      define POSTGRES db1 {
        table: "posts",
        data: [{ key: "posts", value: "db posts" }]
      }

      connect c1 -> s1
      connect s1 -> r1
      connect s1 -> db1
    `;

    const astResult = compileDSL(dsl);
    expect(astResult.nodeConfigs.s1.endpointPipelines["/api/v1/posts"]).toEqual(["db1"]);

    const simResult = compileSimulationPipeline({
      activeNodes: astResult.nodes,
      activeEdges: astResult.edges,
      activeConfigs: astResult.nodeConfigs,
    });

    const actions = simResult.simulationFrames.map((f) => ({
      from: f.from,
      to: f.to,
      action: f.action,
    }));

    // Server should forward directly to db1
    const db1Hop = actions.find((a) => a.from === "s1" && a.to === "db1");
    expect(db1Hop).toBeDefined();

    // Redis must NEVER be visited in this pipeline!
    const r1Hop = actions.find((a) => a.from === "s1" && a.to === "r1");
    expect(r1Hop).toBeUndefined();
  });

  it("Scenario 3: Write-Through / Cache-Invalidation Pipeline (POST -> Postgres, then Redis)", () => {
    const dsl = `
      define CLIENT c1 {
        requests: [
          {
            endpoint: "/api/v1/posts",
            allowedMethods: ["POST"]
          }
        ]
      }

      define SERVER s1 {
        capacity: 100,
        acceptedEndpoints: [
          {
            endpoint: "/api/v1/posts",
            allowedMethod: ["POST"],
            pipeline: ["db1", "r1"]
          }
        ]
      }

      define REDIS r1 {
        data: [{ key: "posts", value: "cached posts" }]
      }

      define POSTGRES db1 {
        table: "posts",
        data: [{ key: "posts", value: "db posts" }]
      }

      connect c1 -> s1
      connect s1 -> r1
      connect s1 -> db1
    `;

    const astResult = compileDSL(dsl);
    expect(astResult.nodeConfigs.s1.endpointPipelines["/api/v1/posts"]).toEqual(["db1", "r1"]);

    const simResult = compileSimulationPipeline({
      activeNodes: astResult.nodes,
      activeEdges: astResult.edges,
      activeConfigs: astResult.nodeConfigs,
    });

    const actions = simResult.simulationFrames.map((f) => ({
      from: f.from,
      to: f.to,
      action: f.action,
    }));

    // Server should forward to db1 first, then r1
    const db1Index = actions.findIndex((a) => a.from === "s1" && a.to === "db1");
    const r1Index = actions.findIndex((a) => a.from === "s1" && a.to === "r1");

    expect(db1Index).toBeGreaterThan(-1);
    expect(r1Index).toBeGreaterThan(-1);
    expect(db1Index).toBeLessThan(r1Index);
  });

  it("Scenario 4: Load Balancer distributes to servers with endpoint pipelines", () => {
    const dsl = `
      define CLIENT c1 {
        requests: [
          {
            endpoint: "/api/v1/posts",
            allowedMethods: ["GET"]
          },
          {
            endpoint: "/api/v1/posts",
            allowedMethods: ["GET"]
          }
        ]
      }

      define LOADBALANCER lb1 {
        strategy: "ROUND_ROBIN"
      }

      define SERVER s1 {
        capacity: 100,
        acceptedEndpoints: [
          {
            endpoint: "/api/v1/posts",
            allowedMethod: ["GET"],
            pipeline: ["r1", "db1"]
          }
        ]
      }

      define SERVER s2 {
        capacity: 100,
        acceptedEndpoints: [
          {
            endpoint: "/api/v1/posts",
            allowedMethod: ["GET"],
            pipeline: ["r1", "db1"]
          }
        ]
      }

      define REDIS r1 {
        data: [{ key: "posts", value: "cached" }]
      }

      define POSTGRES db1 {
        table: "posts",
        data: [{ key: "posts", value: "db" }]
      }

      connect c1 -> lb1
      connect lb1 -> s1
      connect lb1 -> s2
      connect s1 -> r1
      connect s1 -> db1
      connect s2 -> r1
      connect s2 -> db1
    `;

    const astResult = compileDSL(dsl);
    const simResult = compileSimulationPipeline({
      activeNodes: astResult.nodes,
      activeEdges: astResult.edges,
      activeConfigs: astResult.nodeConfigs,
    });

    // Run 1 hits s1, Run 2 hits s2 via Round Robin
    const lbHops = simResult.simulationFrames.filter(
      (f) => f.action === "LOAD_BALANCER_FORWARD_REQUEST"
    );
    expect(lbHops.length).toBe(2);
    expect(lbHops[0].to).toBe("s1");
    expect(lbHops[1].to).toBe("s2");
  });

  it("Scenario 5: Backward compatibility (no pipeline specified uses auto-discovery)", () => {
    const dsl = `
      define CLIENT c1 {
        requests: [
          {
            endpoint: "/api/v1/posts",
            allowedMethods: ["GET"]
          }
        ]
      }

      define SERVER s1 {
        capacity: 100,
        acceptedEndpoints: [
          {
            endpoint: "/api/v1/posts",
            allowedMethod: ["GET"]
          }
        ]
      }

      define POSTGRES db1 {
        table: "posts",
        data: [{ key: "posts", value: "db" }]
      }

      connect c1 -> s1
      connect s1 -> db1
    `;

    const astResult = compileDSL(dsl);
    // No pipeline defined, should default gracefully
    const simResult = compileSimulationPipeline({
      activeNodes: astResult.nodes,
      activeEdges: astResult.edges,
      activeConfigs: astResult.nodeConfigs,
    });

    const dbHop = simResult.simulationFrames.find(
      (f) => f.from === "s1" && f.to === "db1"
    );
    expect(dbHop).toBeDefined();
  });

  it("Scenario 6: Pre-flight Route Validation detects missing nodes and disconnected edges", async () => {
    const { validateEndpointPipelines } = await import("@/utils/routeValidator");

    // Subcase A: Valid pipeline
    const validDsl = `
      define CLIENT c1 {}
      define SERVER s1 {
        acceptedEndpoints: [{ endpoint: "/api/v1/posts", pipeline: ["db1"] }]
      }
      define POSTGRES db1 {}
      connect c1 -> s1
      connect s1 -> db1
    `;
    const validAst = compileDSL(validDsl);
    const validResult = validateEndpointPipelines(
      validAst.nodes,
      validAst.edges,
      validAst.nodeConfigs
    );
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // Subcase B: Disconnected target (s1 -> r1 connection is missing)
    const disconnectedDsl = `
      define CLIENT c1 {}
      define SERVER s1 {
        acceptedEndpoints: [{ endpoint: "/api/v1/posts", pipeline: ["r1"] }]
      }
      define REDIS r1 {}
      connect c1 -> s1
    `;
    const disconnAst = compileDSL(disconnectedDsl);
    const disconnResult = validateEndpointPipelines(
      disconnAst.nodes,
      disconnAst.edges,
      disconnAst.nodeConfigs
    );
    expect(disconnResult.isValid).toBe(false);
    expect(disconnResult.errors[0].type).toBe("DISCONNECTED_EDGE");
    expect(disconnResult.errors[0].targetId).toBe("r1");

    // Subcase C: Non-existent target
    const missingNodeDsl = `
      define CLIENT c1 {}
      define SERVER s1 {
        acceptedEndpoints: [{ endpoint: "/api/v1/posts", pipeline: ["ghost_db"] }]
      }
      connect c1 -> s1
    `;
    const missingAst = compileDSL(missingNodeDsl);
    const missingResult = validateEndpointPipelines(
      missingAst.nodes,
      missingAst.edges,
      missingAst.nodeConfigs
    );
    expect(missingResult.isValid).toBe(false);
    expect(missingResult.errors[0].type).toBe("MISSING_NODE");
    expect(missingResult.errors[0].targetId).toBe("ghost_db");
  });

  it("Scenario 7: Strict Sequence (Always Run) vs Cache-Aside (Stop on Hit)", () => {
    const dsl = `
      define CLIENT c1 {
        requests: [
          {
            endpoint: "/api/v1/posts",
            allowedMethods: ["GET"],
            key: "posts"
          }
        ]
      }

      define SERVER s1 {
        acceptedEndpoints: [
          {
            endpoint: "/api/v1/posts",
            allowedMethod: ["GET"],
            pipeline: ["r1", "db1"]
          }
        ]
      }

      define REDIS r1 {
        data: [{ key: "posts", value: "cached posts data" }]
      }

      define POSTGRES db1 {
        table: "posts",
        data: [{ key: "posts", value: "db posts data" }]
      }

      connect c1 -> s1
      connect s1 -> r1
      connect s1 -> db1
    `;

    const astResult = compileDSL(dsl);

    // Case 1: Default Strict Pipeline (Always Run) -> Visits r1, then visits db1 even on cache hit
    const strictSim = compileSimulationPipeline({
      activeNodes: astResult.nodes,
      activeEdges: astResult.edges,
      activeConfigs: astResult.nodeConfigs,
    });

    const strictActions = strictSim.simulationFrames.map((f) => ({
      from: f.from,
      to: f.to,
      action: f.action,
    }));

    const r1HopStrict = strictActions.find((a) => a.from === "s1" && a.to === "r1");
    const db1HopStrict = strictActions.find((a) => a.from === "s1" && a.to === "db1");
    expect(r1HopStrict).toBeDefined();
    expect(db1HopStrict).toBeDefined(); // Still visited!

    // Case 2: Cache-Aside Mode (Stop on Cache Hit) -> Visits r1, gets HIT, skips db1!
    const configsWithPolicy = {
      ...astResult.nodeConfigs,
      s1: {
        ...astResult.nodeConfigs.s1,
        endpointPipelinePolicies: {
          "/api/v1/posts": { stopOnCacheHit: true },
        },
      },
    };

    const cacheAsideSim = compileSimulationPipeline({
      activeNodes: astResult.nodes,
      activeEdges: astResult.edges,
      activeConfigs: configsWithPolicy,
    });

    const caActions = cacheAsideSim.simulationFrames.map((f) => ({
      from: f.from,
      to: f.to,
      action: f.action,
    }));

    const r1HopCA = caActions.find((a) => a.from === "s1" && a.to === "r1");
    const db1HopCA = caActions.find((a) => a.from === "s1" && a.to === "db1");
    expect(r1HopCA).toBeDefined();
    expect(db1HopCA).toBeUndefined(); // db1 was skipped because cache hit stopped it!
  });
});

