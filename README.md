# FlowFrame

<p align="center">
	<img
		src="public/logo/flow-frame-dark.png"
		alt="FlowFrame Logo"
		width="150"
		style="border-radius: 50%; border: 1px solid #2a2a2a; padding: 8px;"
	/>
</p>

Interactive distributed system simulator.

## Quick Links

- [Goal](#goal)
- [How Engine Works](#how-engine-works)
- [Simulation Flow (Simple English)](#simulation-flow-simple-english)
- [Cache Internals (Payload, IPv4, Forward/Backward)](#cache-internals-payload-ipv4-forwardbackward)
- [Actual Flow With Code](#actual-flow-with-code)
- [Scenario Route](#scenario-route)
- [Run](#run)
- [Tech](#tech)

## Goal

Build a developer-first tool to visually understand distributed system behavior,
not just draw architecture diagrams.

## How Engine Works

1. GraphManager

- Stores architecture as nodes + edges.
- Example path: Client -> LoadBalancer -> Server1/Server2/Server3.

2. NodeRegistry

- Maps nodeId -> actual class instance.
- Graph only knows structure; NodeRegistry gives behavior (LoadBalancerModel, ServerModel, ClientModel).
- Simulation uses this to detect node type and run node-specific logic.

3. Strategy Layer (RoundRobinStrategy)

- Load balancer asks strategy: "next server konsa?"
- Pointer rotates over available servers for fair distribution.

4. SimulationManager

- Runs request step-by-step.
- Each hop becomes a frame object:
  { requestId, from, to, timestamp }
- Frames are generated in order and stored for UI playback.

5. UI Playback

- UI reads frames array and moves frameIndex over time.
- Current frame decides active server highlight.
- Animated packets + controls (Play/Pause/Next/Speed) visualize the same engine output.

## Simulation Flow (Simple English)

This is the simple end-to-end flow of one simulation request.

1. Start from scenario file

- A scenario creates `GraphManager`, `NodeRegistry`, and `SimulationManager`.
- Then it calls `simulation.runSimulation("client-1")` one or more times.
- This is where simulation starts.

2. Create a request object

- `runSimulation` creates a unique request id.
- It stores current node (`client-1` initially), payload, and direction (`forward` by default).

3. Move hop-by-hop using graph + registry

- Graph tells: what are the next connected nodes.
- Registry tells: what kind of node this is (Client, Load Balancer, Server, Redis, Postgres).
- Based on node type, simulation decides next step.

4. Save every hop as a frame

- Every movement is stored in `frames` as:
	`{ requestId, from, to, timestamp, action }`
- These frames are the source of truth for UI animation.

5. Forward phase

- Client sends request to next node.
- Load balancer picks one server (using strategy).
- Server can call Redis first.
- If Redis miss happens, server forwards to Postgres.

6. Backward phase (response path)

- When data is found (Redis hit or Postgres return), request direction becomes `backward`.
- Simulation walks back through the traversal path and pushes response frames.
- Response eventually returns to client.

### Minimal Code Sample (How it starts)

```ts
const graph = new GraphManager("graph-cache");
const registry = new NodeRegistry("registry-cache");

// Register node behavior instances (Client, Server, Redis, Postgres)
registry.register("client-1", clientInstance);
registry.register("server-1", serverInstance);

// Connect architecture in graph
graph.addEdge("client-1", "server-1");

const simulation = new SimulationManager(
	graph,
	registry,
	payload,
	ipv4Generator.getRandomIpv4() as string,
);

// Simulation starts here
simulation.runSimulation("client-1");

// UI consumes these frames for packet animation
const frames = simulation.getFrames();
```

### Tiny Internal Logic Sample (inside SimulationManager)

```ts
// One forward hop example: Client -> next node
if (nodeType === "CLIENT") {
	const toNodeId = nextNodes[0];
	this.pushFrame(request.id, currentNodeId, toNodeId, "CLIENT_SEND_REQUEST");
	traversalPath.push(toNodeId);
	currentNodeId = toNodeId;
}
```

## Cache Internals (Payload, IPv4, Forward/Backward)

This section explains your exact simple-cache setup in plain English.

### 1) What we pass into SimulationManager

```ts
const dataToPass = {
	redis: {
		data: [{ rohan: "cached data for rohan" }],
	},
	testCasesForRedis: {
		// deterministic order in simulation: hit -> db fallback -> invalid key
		data: ["rohan", "doe", "invalid-user"],
	},
};

const simulation = new SimulationManager(
	graph,
	registry,
	dataToPass,
	ipv4Instance.getRandomIpv4() as string,
);
```

- `dataToPass` goes into each new request as request context/payload.
- `ipv4` is attached to the request object so each request can carry a client IP identity.

### 2) What happens when `runSimulation("client-1")` is called

- `SimulationManager` creates a new request id (unique).
- It sets `currentNodeId = "client-1"`.
- It initializes direction as forward (`request.direction` is forward unless changed).
- It picks a Redis lookup key from `testCasesForRedis.data` using a cursor:
	first run -> `rohan`, second run -> `doe`, third run -> `invalid-user`.

### 3) How frames are generated internally

Every hop calls `pushFrame(...)` and stores:

```ts
{ requestId, from, to, timestamp, action }
```

So engine is not drawing UI directly. It only creates ordered frames.
UI reads these frames and animates edges.

### 4) Forward vs Backward logic

Forward means request is still traveling deeper into the system.
Backward means response is returning to previous nodes.

High-level rules:

- CLIENT node: send to next node (server/lb), create forward frame.
- SERVER node:
	- if Redis lookup not done: forward to Redis.
	- if Redis miss happened and DB lookup is pending: forward to Postgres.
	- otherwise switch to backward.
- REDIS node:
	- if key found: emit `REDIS_CACHE_HIT`, then switch to backward.
	- if key not found: emit `REDIS_CACHE_MISS`, mark DB lookup pending, continue forward.
- POSTGRES node:
	- emit `POSTGRES_RETURN_DATA`, then switch to backward.

Backward movement uses traversal path stack and emits response frames while popping nodes.

### 5) Example sequence for your 3 deterministic test keys

1. Key = `rohan` (cache hit)

- Client -> Server (`CLIENT_SEND_REQUEST`)
- Server -> Redis (`SERVER_FORWARD_REQUEST_TO_REDIS`)
- Redis -> Server (`REDIS_CACHE_HIT`)
- Server -> Client (`SERVER_SEND_RESPONSE`)

2. Key = `doe` (cache miss, db fallback)

- Client -> Server (`CLIENT_SEND_REQUEST`)
- Server -> Redis (`SERVER_FORWARD_REQUEST_TO_REDIS`)
- Redis -> Server (`REDIS_CACHE_MISS`)
- Server -> Postgres (`SERVER_FORWARD_REQUEST_TO_POSTGRES`)
- Postgres -> Server (`POSTGRES_RETURN_DATA`)
- Server -> Client (`SERVER_SEND_RESPONSE`)

3. Key = `invalid-user` (miss, no useful db data path in this simplified setup)

- Client -> Server
- Server -> Redis
- Redis miss -> Server
- Server tries DB path if connected, then returns backward based on current context flags.

### 6) Why this is deterministic

- `redisLookupCursor` is incremented every run.
- Key is selected by modulo over `testCasesForRedis.data`.
- So run order is predictable and repeatable for demos.

## Actual Flow With Code

### 1) Scenario bundle engine output banata hai

Source: [src/scenarios/simple-load-balancer.ts](src/scenarios/simple-load-balancer.ts)

```ts
export function createSimpleLoadBalancerSimulationBundle(): SimBundle {
	const graph = new GraphManager("graph-1");
	const registry = new NodeRegistry("registry-1");
	const simulation = new SimulationManager(graph, registry);

	// nodes + edges + registry wiring ...

	for (let i = 0; i < 8; i++) {
		simulation.runTest("client-1");
	}

	return {
		frames: simulation.getFrames() as Frame[],
		nodes: flowNodes,
		edges: flowEdges,
	};
}
```

### 2) Page scenarioId ke basis pe bundle pick karta hai

Source: [app/scenarios/[scenarioId]/page.tsx](app/scenarios/[scenarioId]/page.tsx)

```ts
const { scenarioId } = use(params);
const createSimulationBundle = ALL_SCENARIOS.get(scenarioId);
const [{ frames, nodes, edges }] = useState<SimBundle>(createSimulationBundle);
```

### 3) Current frame se active edge calculate hoti hai

```ts
const currentFrame = frames[frameIndex] ?? null;

const animatedEdges = useMemo(() => {
	if (!currentFrame) return edges;

	const activeEdgeId = `${currentFrame.from}->${currentFrame.to}`;

	return edges.map((edge) => ({
		...edge,
		data: {
			...edge.data,
			active: edge.id === activeEdgeId,
			packetDuration: edge.id === activeEdgeId ? 1 / speed : 2.2,
		},
	}));
}, [currentFrame, edges, speed]);
```

### 4) ReactFlow custom edge renderer use karta hai

```tsx
const edgeTypes = { packet: PacketEdge };

<ReactFlow
	nodes={nodes}
	edges={animatedEdges}
	edgeTypes={edgeTypes}
/>
```

`type: "packet"` wali har edge ke liye `PacketEdge` call hota hai.

### 5) PacketEdge BaseEdge draw karta hai + active edge par packet animate karta hai

```tsx
function PacketEdge(props: EdgeProps) {
	const isActive = Boolean(props.data?.active);

	return (
		<>
			<BaseEdge path={edgePath} markerEnd={props.markerEnd} style={props.style} />

			{isActive && (
				<circle r="5" fill="#8b5cf6">
					<animateMotion dur={`${packetDuration}s`} repeatCount="indefinite" path={edgePath} />
				</circle>
			)}
		</>
	);
}
```

## Scenario Route

- Main scenario page: [http://localhost:3000/scenarios/simple-load-balancer](http://localhost:3000/scenarios/simple-load-balancer)
- Scenario registry map: [src/scenarios/all.ts](src/scenarios/all.ts)

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Tech

- Next.js
- Tailwind CSS
- Framer Motion
