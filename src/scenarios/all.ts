import { ScenarioRunOptions, SimBundle } from "@/engine/types";
import createSimpleLoadBalancerSimulationBundle from "./simple-load-balancer";
import createSimpleCacheScenario from "./simple-cache";

// mapp of scenario name to simulation bundle creator function
const ALL_SCENARIOS: Map<string, (options: ScenarioRunOptions) => SimBundle> =
  new Map([
    ["simple-load-balancer", createSimpleLoadBalancerSimulationBundle],
    ["simple-cache", createSimpleCacheScenario],
  ]);

export { ALL_SCENARIOS };
