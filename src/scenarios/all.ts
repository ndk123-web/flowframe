import { ScenarioRunOptions, SimBundle } from "@/engine/types";
import createSimpleLoadBalancerSimulationBundle from "./simple-load-balancer";
import createSimpleCacheScenario from "./simple-cache";
import createSimpleApiGatewaySimulation from "./simple-api-gateway";

// mapp of scenario name to simulation bundle creator function
const ALL_SCENARIOS: Map<string, (options: ScenarioRunOptions) => SimBundle> =
  new Map([
    ["simple-load-balancer", createSimpleLoadBalancerSimulationBundle],
    ["simple-cache", createSimpleCacheScenario],
    ["simple-api-gateway", createSimpleApiGatewaySimulation],
  ]);

export { ALL_SCENARIOS };
