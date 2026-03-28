import { MarkerType, Position, type Edge, type Node } from "@xyflow/react";
import type { Event, Frame, ScenarioRunOptions, SimBundle } from "@/engine/types";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
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
        const requestId = `vk-req-${i + 1}`;
        const requestName = `ValetKeyRequest-${i + 1}`;
        const signedUrl = `https://storage.example/upload/${fileName}?token=vkey-${i + 1}`;

        const runFrames: Frame[] = [
            {
                requestId,
                requestName,
                from: clientId,
                to: serverId,
                timestamp: 0,
                action: "CLIENT_REQUEST_UPLOAD_URL",
                sourceIp,
                payloadSummary: `file=${fileName}`,
            },
            {
                requestId,
                requestName,
                from: serverId,
                to: storageId,
                timestamp: 1,
                action: "SERVER_REQUEST_SIGNED_UPLOAD_URL",
                sourceIp,
                payloadSummary: `bucket=media-uploads file=${fileName}`,
            },
            {
                requestId,
                requestName,
                from: storageId,
                to: serverId,
                timestamp: 2,
                action: "STORAGE_RETURN_SIGNED_UPLOAD_URL",
                sourceIp,
                payloadSummary: `signedUrl=${signedUrl}`,
            },
            {
                requestId,
                requestName,
                from: serverId,
                to: clientId,
                timestamp: 3,
                action: "SERVER_RETURN_VALET_KEY",
                sourceIp,
                payloadSummary: `ttl=120s permission=PUT` ,
            },
            {
                requestId,
                requestName,
                from: clientId,
                to: storageId,
                timestamp: 4,
                action: "CLIENT_UPLOAD_USING_VALET_KEY",
                sourceIp,
                payloadSummary: `upload ${fileName}`,
            },
            {
                requestId,
                requestName,
                from: storageId,
                to: clientId,
                timestamp: 5,
                action: "STORAGE_UPLOAD_SUCCESS",
                sourceIp,
                payloadSummary: `status=201` ,
            },
            {
                requestId,
                requestName,
                from: clientId,
                to: serverId,
                timestamp: 6,
                action: "CLIENT_NOTIFY_UPLOAD_COMPLETE",
                sourceIp,
                payloadSummary: `file=${fileName}`,
            },
            {
                requestId,
                requestName,
                from: serverId,
                to: clientId,
                timestamp: 7,
                action: "SERVER_SEND_RESPONSE_UPLOAD_CONFIRMED",
                sourceIp,
                payloadSummary: `db=metadata-saved`,
            },
        ].map((frame) => ({
            ...frame,
            timestamp: parallelResponse
                ? frame.timestamp
                : frame.timestamp + globalTimestampOffset,
        }));

        storage.addFileIntoBucket("media-uploads", fileName, {
            uploadedBy: clientId,
            requestId,
            sourceIp,
        });

        requestInputs.push({
            requestId,
            sourceIp,
            lookupKey: fileName,
        });

        allFrames.push(...runFrames);

        if (!parallelResponse) {
            globalTimestampOffset += runFrames.length;
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
            data: { label: "Upload Service" },
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
        },
    };
}

export default createSimpleValetKeySimulationBundle;