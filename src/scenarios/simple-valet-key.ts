import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import type { Event, Frame, ScenarioRunOptions, SimBundle } from "@/engine/types";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import ServerModel from "@/engine/models/server";
import ClientModel from "@/engine/models/Client";
import StorageModel from "@/engine/models/Storage";
import Ipv4Generator from "@/utils/generateRandomIp";
import PriorityQueue from "@/engine/core/Simulations/ParallelSimulation";

function shouldKeepFrame(hideResponse: boolean, frame: Frame) {
    if (!hideResponse) {
        return true;
    }

    return !(
        frame.action.includes("SEND_RESPONSE") ||
        frame.action.includes("RETURN_DATA") ||
        frame.action.includes("CACHE_HIT") ||
        frame.action.includes("CACHE_MISS") ||
        frame.action === "RESPONSE_BACKTRACK" ||
        frame.action === "SERVER_RETURN_VALET_KEY" ||
        frame.action === "STORAGE_RETURN_SIGNED_UPLOAD_URL" ||
        frame.action === "STORAGE_UPLOAD_SUCCESS"
    );
}

function createSimpleValetKeySimulationBundle(
    options: ScenarioRunOptions,
): SimBundle {
    const { hideResponse, parallelResponse } = options;

    const graph = new GraphManager("graph-valet-key");
    const registry = new NodeRegistry("registry-valet-key");
    const ipv4Instance = new Ipv4Generator();

    const clientId = "client-1";
    const serverId = "server-1";
    const storageId = "storage-1";

    const client = new ClientModel(clientId, "Client");
    const server = new ServerModel(serverId, "Upload Service");
    const storage = new StorageModel(storageId, "Cloud Storage");
    storage.addBucket("media-uploads");

    graph.addNode(clientId, "Client");
    graph.addNode(serverId, "Upload Service");
    graph.addNode(storageId, "Cloud Storage");

    graph.addEdge(clientId, serverId);
    graph.addEdge(serverId, storageId);
    graph.addEdge(clientId, storageId);

    registry.register(clientId, client);
    registry.register(serverId, server);
    registry.register(storageId, storage);

    const testFiles = [
        "avatar-1.png",
        "invoice-2026.pdf",
        "portfolio-banner.jpg",
    ];

    const allFrames: Frame[] = [];
    const requestInputs: Array<{
        requestId?: string;
        sourceIp?: string;
        lookupKey?: string;
    }> = [];

    let globalTimestampOffset = 0;

    for (let i = 0; i < testFiles.length; i++) {
        const fileName = testFiles[i];
        const sourceIp = ipv4Instance.getRandomIpv4() as string;
        const simulation = new SimulationManager(
            graph,
            registry,
            {
                valetKeyFlow: true,
                fileName,
            },
            sourceIp,
        );

        simulation.runSimulation(clientId);

        const generatedFrames = simulation.getFrames() as Frame[];
        const runFrames = generatedFrames.map((frame) => ({
            ...frame,
            timestamp: parallelResponse
                ? frame.timestamp
                : frame.timestamp + globalTimestampOffset,
            sourceIp,
        }));

        const firstFrame = runFrames[0];
        if (firstFrame) {
            requestInputs.push({
                requestId: firstFrame.requestId,
                sourceIp,
                lookupKey: fileName,
            });
        }

        allFrames.push(...runFrames);

        if (!parallelResponse) {
            globalTimestampOffset += generatedFrames.length;
        }
    }

    const framesToRender: Frame[] = parallelResponse
        ? (() => {
                const pq = new PriorityQueue();
                pq.pushMultipleIntoQueue(allFrames as Event[]);

                const mergedFrames: Frame[] = [];
                while (!pq.isEmpty()) {
                    const event = pq.popMinTimeStampItem();
                    if (event) {
                        mergedFrames.push(event as Frame);
                    }
                }

                return mergedFrames;
            })()
        : allFrames.sort((a, b) => a.timestamp - b.timestamp);

    const filteredFrames = framesToRender.filter((frame) =>
        shouldKeepFrame(hideResponse, frame),
    );

    const flowNodes: Node[] = [
        {
            id: clientId,
            data: { label: "Client" },
            position: { x: 60, y: 220 },
            type: "default",
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            style: {
                background: "var(--surface)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "8px 12px",
                fontWeight: 600,
            },
        },
        {
            id: serverId,
            data: { label: "Server" },
            position: { x: 380, y: 100 },
            type: "default",
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            style: {
                background: "var(--surface)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "8px 12px",
                fontWeight: 600,
            },
        },
        {
            id: storageId,
            data: { label: "Cloud Storage" },
            position: { x: 760, y: 300 },
            type: "default",
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
            style: {
                background: "var(--surface)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "8px 12px",
                fontWeight: 600,
            },
        },
    ];

    const edgeBaseStyle = {
        stroke: "#60a5fa",
        strokeWidth: 1.8,
    };

    const flowEdges: Edge[] = [
        {
            id: `${clientId}->${serverId}`,
            source: clientId,
            target: serverId,
            type: "packet",
            markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
            style: edgeBaseStyle,
            data: { active: false, packetDuration: 2.15 },
        },
        {
            id: `${serverId}->${storageId}`,
            source: serverId,
            target: storageId,
            type: "packet",
            markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
            style: edgeBaseStyle,
            data: { active: false, packetDuration: 2.15 },
        },
        {
            id: `${clientId}->${storageId}`,
            source: clientId,
            target: storageId,
            type: "packet",
            markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
            style: edgeBaseStyle,
            data: { active: false, packetDuration: 2.15 },
        },
    ];

    return {
        frames: filteredFrames,
        nodes: flowNodes,
        edges: flowEdges,
        debug: {
            parallelResponse,
            requestInputs,
            storageStore: storage.getAllBuckets(),
        },
    };
}

export default createSimpleValetKeySimulationBundle;