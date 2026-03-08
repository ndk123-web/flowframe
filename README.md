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
