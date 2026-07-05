import { ScenarioRunOptions, SimBundle } from "@/engine/types";
import createSimpleLoadBalancerSimulationBundle from "./simple-load-balancer";
import createSimpleCacheScenario from "./simple-cache";
import createSimpleApiGatewaySimulation from "./simple-api-gateway";
import createSimpleValetKeySimulationBundle from "./simple-valet-key";
import createSimpleMessageQueueSimulationBundle from "./simple-message-queue";
import createSimplePubSubSimulationBundle from "./simple-pub-sub";

// mapp of scenario name to simulation bundle creator function
const ALL_SCENARIOS: Map<string, (options: ScenarioRunOptions) => SimBundle> =
  new Map([
    ["simple-load-balancer", createSimpleLoadBalancerSimulationBundle],
    ["simple-cache", createSimpleCacheScenario],
    ["simple-api-gateway", createSimpleApiGatewaySimulation],
    ["simple-valet-key", createSimpleValetKeySimulationBundle],
    ["simple-message-queue", createSimpleMessageQueueSimulationBundle],
    ["simple-pub-sub", createSimplePubSubSimulationBundle],
  ]);

export { ALL_SCENARIOS };
