"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react";
import FlowFrameCodeEditor from "@/components/FlowFrameCodeEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  BaseEdge,
  getSmoothStepPath,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  Position,
  MarkerType,
  Handle,
  NodeResizer,
  MiniMap,
  Controls as FlowControls,
  type Node,
  type Edge,
  type EdgeProps,
  getStraightPath,
  getBezierPath,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import ShortUniqueId from "short-unique-id";
import { toPng } from "html-to-image";
import {
  FiRotateCcw,
  FiLink,
  FiDatabase,
  FiRefreshCw,
  FiChevronDown,
  FiPlay,
  FiPause,
  FiMenu,
  FiSave,
  FiCopy,
  FiTrash2,
  FiZap,
  FiGrid,
  FiCode,
  FiCheck,
  FiCheckCircle,
  FiAlertTriangle,
  FiAlertCircle,
  FiX,
  FiClock,
  FiChevronRight,
  FiChevronLeft,
  FiActivity,
  FiSliders,
  FiFolder,
  FiTerminal,
  FiMaximize2,
  FiMinimize2,
  FiZoomIn,
  FiZoomOut,
  FiDownload,
  FiUpload,
  FiSkipBack,
  FiSkipForward,
  FiCpu,
  FiBox,
  FiSquare,
  FiShare2,
  FiGlobe,
  FiFilm,
  FiLock,
} from "react-icons/fi";
import AIAssistantDrawer from "@/components/AIAssistantDrawer";
import CanvasToolbar from "@/components/CanvasToolbar";
import CanvasSettingsSheet from "@/components/CanvasSettingsSheet";
import CanvasControlsBar from "@/components/CanvasControlsBar";
import TemplateBrowserDialog, { WORKSPACE_TEMPLATES } from "@/components/TemplateBrowserDialog";
import { getTemplateArchitecture } from "@/templates/starterTemplates";
import { recordSimulationVideo } from "@/utils/recordSimulationVideo";
import { Sparkles } from "lucide-react";

// DSL Interpreter & Graph Engine
import { compileDSL } from "@/DSL";
import { GraphManager } from "@/engine/core/Graph/graph";
import { NodeRegistry } from "@/engine/core/Graph/nodeResgistry";
import { SimulationManager } from "@/engine/core/Simulations/Simulation";
import ClientModel from "@/engine/models/Client";
import LoadBalancerModel from "@/engine/models/LoadBalancer";
import ServerModel from "@/engine/models/server";
import RedisModel from "@/engine/models/Redis";
import PostgresModel from "@/engine/models/Postgres";
import ApiGatewayModel from "@/engine/models/ApiGateway";
import StorageModel from "@/engine/models/Storage";
import DnsModel from "@/engine/models/Dns";
import CdnModel from "@/engine/models/Cdn";
import MessageQueueModel from "@/engine/models/MessageQueue/MessageQueue";
import PubSubModel from "@/engine/models/PubSub/PubSubModel";
import RoundRobinStrategy from "@/engine/core/Strategy/RoundRobinStrategy";
import Ipv4Generator from "@/utils/generateRandomIp";
import PriorityQueue from "@/engine/core/Simulations/ParallelSimulation";
import { validateEndpointPipelines } from "@/utils/routeValidator";

// Auth & API
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeStore } from "@/store/useThemeStore";
import {
  getDiagramById,
  updateDiagram,
  getSharedDiagram,
} from "@/services/diagramApi";
import FlowLoader from "@/components/FlowLoader";

// Header
import SiteHeader from "@/components/SiteHeader";
import {
  ComponentIcon,
  BrandLogo,
  CustomDropdown,
  NODE_FLAVORS,
  getDefaultFlavor,
} from "@/components/ComponentIcons";

type Theme = "light" | "dark";

// Component categories for the sidebar
type ComponentType =
  | "client"
  | "api-gateway"
  | "load-balancer"
  | "server"
  | "redis"
  | "postgres"
  | "storage"
  | "dns"
  | "cdn"
  | "message-queue"
  | "pubsub";

interface ComponentMetadata {
  type: ComponentType;
  label: string;
  icon: string;
  description: string;
  colorClass: string;
}

const COMPONENTS_LIBRARY: ComponentMetadata[] = [
  {
    type: "client",
    label: "Client",
    icon: "client",
    description:
      "Generates requests (GET/POST/uploads) to route through the network.",
    colorClass: "border-l-violet-500 shadow-violet-500/10 text-violet-400",
  },
  {
    type: "api-gateway",
    label: "API Gateway",
    icon: "api-gateway",
    description: "Routes requests to specific services based on path prefixes.",
    colorClass: "border-l-fuchsia-500 shadow-fuchsia-500/10 text-fuchsia-400",
  },
  {
    type: "load-balancer",
    label: "Load Balancer",
    icon: "load-balancer",
    description:
      "Balances traffic across multiple backend servers using Round Robin.",
    colorClass: "border-l-blue-500 shadow-blue-500/10 text-blue-400",
  },
  {
    type: "server",
    label: "Web Server",
    icon: "server",
    description:
      "Handles HTTP queries, reads/writes cache, and fallbacks to DB.",
    colorClass: "border-l-emerald-500 shadow-emerald-500/10 text-emerald-400",
  },
  {
    type: "redis",
    label: "Redis Cache",
    icon: "redis",
    description:
      "Fast key-value cache layer prioritizing low-latency retrieval.",
    colorClass: "border-l-amber-500 shadow-amber-500/10 text-amber-400",
  },
  {
    type: "postgres",
    label: "Postgres DB",
    icon: "postgres",
    description: "Persistent SQL database. Primary storage of system records.",
    colorClass: "border-l-cyan-500 shadow-cyan-500/10 text-cyan-400",
  },
  {
    type: "storage",
    label: "Cloud Storage",
    icon: "storage",
    description: "Object storage bucket for file uploads using valet key URLs.",
    colorClass: "border-l-yellow-500 shadow-yellow-500/10 text-yellow-400",
  },
  {
    type: "message-queue",
    label: "Message Queue",
    icon: "message-queue",
    description:
      "Asynchronous message queue broker with producer-consumer routing.",
    colorClass: "border-l-pink-500 shadow-pink-500/10 text-pink-400",
  },
  {
    type: "pubsub",
    label: "Pub/Sub Broker",
    icon: "pubsub",
    description:
      "Asynchronous fanout message broker with topic/channel routing.",
    colorClass: "border-l-indigo-500 shadow-indigo-500/10 text-indigo-400",
  },
];
// Pre-built Architecture DSL Presets for Code Editor
export const DSL_PRESETS: Record<string, { label: string; code: string }> = {
  cacheAside: {
    label: "Cache Aside",
    code: `// FlowFrame Architecture DSL - Cache Aside Pattern
define CLIENT c1 {
  x: 80,
  y: 220,
  label: "Web Client",
  requests: [
    {
      endpoint: "/api/v1/posts",
      allowedMethods: ["GET", "POST"],
      key: "rohan"
    }
  ]
}

define SERVER s1 {
  x: 380,
  y: 220,
  label: "API Server",
  capacity: 100,
  tcpConnectionsToPostgres: 5,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ]
}

define REDIS r1 {
  x: 680,
  y: 100,
  label: "Redis Cache",
  data: [
    { key: "rohan", value: "cached post data" }
  ]
}

define POSTGRES db1 {
  x: 680,
  y: 340,
  label: "PostgreSQL Database",
  table: "posts",
  data: [
    { key: "rohan", value: "persistent database record" }
  ]
}

connect c1 -> s1
connect s1 -> r1
connect s1 -> db1
`,
  },
  loadBalancing: {
    label: "Load Balancer",
    code: `// FlowFrame Architecture DSL - Load Balancing Pattern
define CLIENT c1 {
  x: 80,
  y: 240,
  label: "Web Client",
  requests: [
    {
      endpoint: "/api/v1/posts",
      allowedMethods: ["GET", "POST"],
      key: "rohan"
    }
  ]
}

define LOADBALANCER lb1 {
  x: 380,
  y: 240,
  label: "Load Balancer",
  strategy: "ROUND_ROBIN"
}

define SERVER s1 {
  x: 680,
  y: 80,
  label: "Server 1",
  capacity: 100,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ]
}

define SERVER s2 {
  x: 680,
  y: 240,
  label: "Server 2",
  capacity: 100,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ]
}

define SERVER s3 {
  x: 680,
  y: 400,
  label: "Server 3",
  capacity: 100,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ]
}

connect c1 -> lb1
connect lb1 -> s1
connect lb1 -> s2
connect lb1 -> s3
`,
  },
  apiGateway: {
    label: "API Gateway",
    code: `// FlowFrame Architecture DSL - API Gateway Routing Pattern
define CLIENT c1 {
  x: 80,
  y: 240,
  label: "Mobile Client",
  requests: [
    {
      endpoint: "/api/v1/posts",
      allowedMethods: ["GET", "POST"],
      key: "rohan"
    },
    {
      endpoint: "/api/v1/users",
      allowedMethods: ["GET"],
      key: "user_101"
    }
  ]
}

define GATEWAY gw1 {
  x: 380,
  y: 240,
  label: "API Gateway",
  strategy: "ROUND_ROBIN",
  routes: [
    {
      path: "/api/v1/posts",
      target: s1
    },
    {
      path: "/api/v1/users",
      target: s2
    }
  ]
}

define SERVER s1 {
  x: 680,
  y: 140,
  label: "Posts Server",
  capacity: 100,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ]
}

define SERVER s2 {
  x: 680,
  y: 340,
  label: "Users Server",
  capacity: 100,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/users",
      allowedMethod: ["GET"]
    }
  ]
}

connect c1 -> gw1
connect gw1 -> s1
connect gw1 -> s2
`,
  },
  messageQueue: {
    label: "Message Queue",
    code: `// FlowFrame Architecture DSL - Asynchronous Message Queue Pattern
define CLIENT c1 {
  x: 80,
  y: 240,
  label: "Mobile App",
  requests: [
    {
      endpoint: "/api/v1/orders",
      allowedMethods: ["POST"]
    }
  ]
}

define SERVER producer {
  x: 380,
  y: 240,
  label: "Order Producer API",
  capacity: 100,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/orders",
      allowedMethod: ["POST"]
    }
  ]
}

define MESSAGEQUEUE mq1 {
  x: 680,
  y: 240,
  label: "RabbitMQ Order Queue",
  processingType: "FIFO",
  queueSize: 25,
  overflowBehavior: "REJECT"
}

define SERVER consumer {
  x: 980,
  y: 240,
  label: "Order Processor Worker",
  capacity: 50,
  prefetchLimit: 1
}

connect c1 -> producer
connect producer -> mq1
connect mq1 -> consumer
`,
  },
  pubSub: {
    label: "PubSub Fanout",
    code: `// FlowFrame Architecture DSL - Event PubSub Fanout Pattern
define SERVER paymentServer {
  x: 80,
  y: 240,
  label: "Payment Server",
  capacity: 100
}

define PUBSUB eventBroker {
  x: 380,
  y: 240,
  label: "Redis Event Broker",
  topic: "order.completed"
}

define SERVER emailWorker {
  x: 680,
  y: 140,
  label: "Email Worker",
  registeredTopics: ["order.completed"]
}

define SERVER analyticsWorker {
  x: 680,
  y: 340,
  label: "Analytics Worker",
  registeredTopics: ["order.completed"]
}

connect paymentServer -> eventBroker
connect eventBroker -> emailWorker
connect eventBroker -> analyticsWorker
`,
  },
};

// Pre-built Architecture templates
const TEMPLATES = {
  loadBalancing: {
    nodes: [
      {
        id: "client-1",
        type: "customNode",
        position: { x: 40, y: 220 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Client", type: "client" },
      },
      {
        id: "lb-1",
        type: "customNode",
        position: { x: 320, y: 220 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Load Balancer", type: "load-balancer" },
      },
      {
        id: "server-1",
        type: "customNode",
        position: { x: 620, y: 40 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Server 1", type: "server" },
      },
      {
        id: "server-2",
        type: "customNode",
        position: { x: 620, y: 220 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Server 2", type: "server" },
      },
      {
        id: "server-3",
        type: "customNode",
        position: { x: 620, y: 400 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Server 3", type: "server" },
      },
    ],
    edges: [
      {
        id: "client-1->lb-1",
        source: "client-1",
        target: "lb-1",
        type: "packet",
      },
      {
        id: "lb-1->server-1",
        source: "lb-1",
        target: "server-1",
        type: "packet",
      },
      {
        id: "lb-1->server-2",
        source: "lb-1",
        target: "server-2",
        type: "packet",
      },
      {
        id: "lb-1->server-3",
        source: "lb-1",
        target: "server-3",
        type: "packet",
      },
    ],
  },
  cacheAside: {
    nodes: [
      {
        id: "client-1",
        type: "customNode",
        position: { x: 40, y: 220 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Client", type: "client" },
      },
      {
        id: "server-1",
        type: "customNode",
        position: { x: 320, y: 220 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Server", type: "server" },
      },
      {
        id: "redis-1",
        type: "customNode",
        position: { x: 620, y: 80 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Redis Cache", type: "redis" },
      },
      {
        id: "postgres-1",
        type: "customNode",
        position: { x: 620, y: 340 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Postgres Database", type: "postgres" },
      },
    ],
    edges: [
      {
        id: "client-1->server-1",
        source: "client-1",
        target: "server-1",
        type: "packet",
      },
      {
        id: "server-1->redis-1",
        source: "server-1",
        target: "redis-1",
        type: "packet",
      },
      {
        id: "server-1->postgres-1",
        source: "server-1",
        target: "postgres-1",
        type: "packet",
      },
    ],
  },
  valetKey: {
    nodes: [
      {
        id: "client-1",
        type: "customNode",
        position: { x: 40, y: 220 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Client", type: "client" },
      },
      {
        id: "server-1",
        type: "customNode",
        position: { x: 360, y: 80 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Upload Server", type: "server" },
      },
      {
        id: "storage-1",
        type: "customNode",
        position: { x: 360, y: 340 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Cloud Storage", type: "storage" },
      },
    ],
    edges: [
      {
        id: "client-1->server-1",
        source: "client-1",
        target: "server-1",
        type: "packet",
      },
      {
        id: "client-1->storage-1",
        source: "client-1",
        target: "storage-1",
        type: "packet",
      },
    ],
  },
  apiGateway: {
    nodes: [
      {
        id: "client-1",
        type: "customNode",
        position: { x: 40, y: 220 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Client", type: "client" },
      },
      {
        id: "gateway-1",
        type: "customNode",
        position: { x: 320, y: 220 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "API Gateway", type: "api-gateway" },
      },
      {
        id: "server-1",
        type: "customNode",
        position: { x: 620, y: 80 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "Post Server", type: "server" },
      },
      {
        id: "server-2",
        type: "customNode",
        position: { x: 620, y: 340 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: { label: "User Server", type: "server" },
      },
    ],
    edges: [
      {
        id: "client-1-right->gateway-1-left",
        source: "client-1",
        sourceHandle: "right",
        target: "gateway-1",
        targetHandle: "left",
        type: "packet",
      },
      {
        id: "gateway-1-right->server-1-left",
        source: "gateway-1",
        sourceHandle: "right",
        target: "server-1",
        targetHandle: "left",
        type: "packet",
      },
      {
        id: "gateway-1-right->server-2-left",
        source: "gateway-1",
        sourceHandle: "right",
        target: "server-2",
        targetHandle: "left",
        type: "packet",
      },
    ],
  },
  // messageQueue: {
  //   nodes: [
  //     {
  //       id: "client-1",
  //       type: "customNode",
  //       position: { x: 80, y: 240 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "Client", type: "client" },
  //     },
  //     {
  //       id: "server-1",
  //       type: "customNode",
  //       position: { x: 380, y: 240 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "Order Server", type: "server" },
  //     },
  //     {
  //       id: "queue-1",
  //       type: "customNode",
  //       position: { x: 680, y: 240 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "Message Queue", type: "message-queue" },
  //     },
  //     {
  //       id: "server-2",
  //       type: "customNode",
  //       position: { x: 980, y: 240 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "Worker Server", type: "server" },
  //     },
  //     {
  //       id: "postgres-1",
  //       type: "customNode",
  //       position: { x: 1280, y: 240 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "Postgres Database", type: "postgres" },
  //     },
  //   ],
  //   edges: [
  //     {
  //       id: "client-1-right->server-1-left",
  //       source: "client-1",
  //       sourceHandle: "right",
  //       target: "server-1",
  //       targetHandle: "left",
  //       type: "packet",
  //     },
  //     {
  //       id: "server-1-right->queue-1-left",
  //       source: "server-1",
  //       sourceHandle: "right",
  //       target: "queue-1",
  //       targetHandle: "left",
  //       type: "packet",
  //     },
  //     {
  //       id: "queue-1-right->server-2-left",
  //       source: "queue-1",
  //       sourceHandle: "right",
  //       target: "server-2",
  //       targetHandle: "left",
  //       type: "packet",
  //     },
  //     {
  //       id: "server-2-right->postgres-1-left",
  //       source: "server-2",
  //       sourceHandle: "right",
  //       target: "postgres-1",
  //       targetHandle: "left",
  //       type: "packet",
  //     },
  //   ],
  // },
  // pubSub: {
  //   nodes: [
  //     {
  //       id: "client-1",
  //       type: "customNode",
  //       position: { x: 40, y: 220 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "Client", type: "client" },
  //     },
  //     {
  //       id: "server-1",
  //       type: "customNode",
  //       position: { x: 280, y: 220 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "Publisher Server", type: "server" },
  //     },
  //     {
  //       id: "broker-1",
  //       type: "customNode",
  //       position: { x: 520, y: 220 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "PubSub Broker", type: "pub-sub" },
  //     },
  //     {
  //       id: "server-2",
  //       type: "customNode",
  //       position: { x: 760, y: 80 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "Web Server 2", type: "server" },
  //     },
  //     {
  //       id: "server-3",
  //       type: "customNode",
  //       position: { x: 760, y: 360 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "Web Server 3", type: "server" },
  //     },
  //     {
  //       id: "postgres-1",
  //       type: "customNode",
  //       position: { x: 1000, y: 80 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "Postgres Database", type: "postgres" },
  //     },
  //     {
  //       id: "redis-1",
  //       type: "customNode",
  //       position: { x: 1000, y: 360 },
  //       sourcePosition: Position.Right,
  //       targetPosition: Position.Left,
  //       data: { label: "Redis Cache", type: "redis" },
  //     },
  //   ],
  //   edges: [
  //     {
  //       id: "client-1-right->server-1-left",
  //       source: "client-1",
  //       sourceHandle: "right",
  //       target: "server-1",
  //       targetHandle: "left",
  //       type: "packet",
  //     },
  //     {
  //       id: "server-1-right->broker-1-left",
  //       source: "server-1",
  //       sourceHandle: "right",
  //       target: "broker-1",
  //       targetHandle: "left",
  //       type: "packet",
  //     },
  //     {
  //       id: "broker-1-right->server-2-left",
  //       source: "broker-1",
  //       sourceHandle: "right",
  //       target: "server-2",
  //       targetHandle: "left",
  //       type: "packet",
  //     },
  //     {
  //       id: "broker-1-right->server-3-left",
  //       source: "broker-1",
  //       sourceHandle: "right",
  //       target: "server-3",
  //       targetHandle: "left",
  //       type: "packet",
  //     },
  //     {
  //       id: "server-2-right->postgres-1-left",
  //       source: "server-2",
  //       sourceHandle: "right",
  //       target: "postgres-1",
  //       targetHandle: "left",
  //       type: "packet",
  //     },
  //     {
  //       id: "server-3-right->redis-1-left",
  //       source: "server-3",
  //       sourceHandle: "right",
  //       target: "redis-1",
  //       targetHandle: "left",
  //       type: "packet",
  //     },
  //   ],
  // },
};

// Default configurations helper
function createDefaultConfig(type: ComponentType, id: string, label: string) {
  switch (type) {
    case "client":
      return {
        endpoint: "/api/v1/posts",
        method: "GET",
        lookupKey: "rohan",
        valetKeyFlow: false,
        fileName: "file.png",
        isThereFileToUpload: false,
        targetBucket: "media-uploads",
        body: "",
        requests: [
          {
            endpoint: "/api/v1/posts",
            method: "GET",
            lookupKey: "rohan",
            fileName: "file.png",
            isThereFileToUpload: false,
            targetBucket: "media-uploads",
            body: "",
          },
        ],
      };
    case "api-gateway":
      return {
        strategy: "ROUND_ROBIN",
        routes: {
          "/api/v1/posts": "POST_SERVICE",
          "/api/v1/users": "USER_SERVICE",
        },
      };
    case "load-balancer":
      return {
        strategy: "ROUND_ROBIN",
      };
    case "server":
      return {
        capacity: 100,
        tcpConnections: 10,
        prefetchLimit: 1,
        endpoints: {
          "/api/v1/posts": ["GET", "POST", "PUT", "DELETE", "PATCH"],
          "/api/v1/users": ["GET", "POST", "PUT", "DELETE", "PATCH"],
          "/api/v1/getData": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        },
      };
    case "redis":
      return {
        data: [
          { key: "rohan", val: "cached data for rohan" },
          { key: "john", val: "cached data for john" },
        ],
      };
    case "postgres":
      return {
        table: "users",
        data: [
          { key: "doe", val: "db data for doe" },
          { key: "john", val: "db data for john" },
          { key: "rohan", val: "db data for rohan" },
        ],
      };
    case "storage":
      return {
        buckets: ["media-uploads"],
      };
    case "dns":
      return {
        domains: {
          "ndkdev.me": {
            www: { to: "", ip: "192.168.1.1", typeOfRecord: "A" },
          },
        },
      };
    case "cdn":
      return {
        originId: "",
        cache: [],
      };
    case "message-queue":
      return {
        processingType: "FIFO",
        queueSize: 10,
        overflowBehavior: "REJECT",
        connections: {},
      };
    case "pubsub":
      return {
        channels: {},
      };
    default:
      return {};
  }
}

function inferWorkspaceNodeType(node: any): ComponentType {
  if (node?.data?.type && node.data.type !== "default") {
    return node.data.type as ComponentType;
  }
  const id = (node?.id || "").toLowerCase();
  const label = (node?.data?.label || "").toLowerCase();

  if (id.includes("client") || label.includes("client") || label.includes("browser") || label.includes("user")) {
    return "client";
  }
  if (id.includes("api") || id.includes("gateway") || label.includes("gateway")) {
    return "api-gateway";
  }
  if (id.includes("lb") || label.includes("load balancer")) {
    return "load-balancer";
  }
  if (id.includes("redis") || id.includes("cache") || label.includes("redis") || label.includes("cache")) {
    return "redis";
  }
  if (
    id.includes("postgres") ||
    id.includes("sql") ||
    id.includes("db") ||
    id.includes("database") ||
    label.includes("postgres") ||
    label.includes("db") ||
    label.includes("database")
  ) {
    return "postgres";
  }
  if (id.includes("storage") || id.includes("s3") || id.includes("blob") || label.includes("storage")) {
    return "storage";
  }
  if (id.includes("pubsub") || id.includes("broker") || label.includes("pub/sub") || label.includes("broker")) {
    return "pubsub";
  }
  if (id.includes("queue") || label.includes("queue")) {
    return "message-queue";
  }
  if (id.includes("dns") || label.includes("dns")) {
    return "dns";
  }
  if (id.includes("cdn") || label.includes("cdn")) {
    return "cdn";
  }
  return "server";
}

// ── Node shape geometry helpers ────────────────────────────────────────────
// Shapes that need a wrapper SVG overlay (non-rectangular geometry)
const NODE_SHAPES = [
  { id: "rectangle", label: "Rectangle" },
  { id: "rounded", label: "Rounded" },
  { id: "stadium", label: "Stadium" },
  { id: "circle", label: "Circle" },
  { id: "diamond", label: "Diamond" },
  { id: "hexagon", label: "Hexagon" },
  { id: "cylinder", label: "Cylinder" },
  { id: "parallelogram", label: "Slant" },
];

function getShapeStyle(shape: string): React.CSSProperties {
  switch (shape) {
    case "rounded":
      return { borderRadius: "999px" };
    case "stadium":
      return { borderRadius: "999px 999px 999px 999px" };
    case "circle":
      return {
        borderRadius: "50%",
        aspectRatio: "1",
        minWidth: 90,
        padding: "12px",
      };
    case "diamond":
      return {
        transform: "rotate(45deg)",
        borderRadius: "8px",
        aspectRatio: "1",
        minWidth: 120,
        padding: "0",
      };
    case "hexagon":
      return {
        clipPath:
          "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
        borderRadius: 0,
      };
    case "cylinder":
      return { borderRadius: "12px 12px 12px 12px", borderBottomWidth: "4px" };
    case "parallelogram":
      return {
        clipPath: "polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)",
        borderRadius: 0,
      };
    case "rectangle":
    default:
      return { borderRadius: "12px" };
  }
}

// React Flow Custom Node
function CustomNode({ id, data, selected }: any) {
  const shape = (data.shape as string) || "rectangle";

  // Per-type accent colors
  const accentColors: Record<
    string,
    { ring: string; glow: string; accent: string; dot: string }
  > = {
    client: {
      ring: "rgba(59,130,246,0.5)",
      glow: "rgba(59,130,246,0.1)",
      accent: "#2563eb",
      dot: "#3b82f6",
    },
    "api-gateway": {
      ring: "rgba(217,70,239,0.6)",
      glow: "rgba(217,70,239,0.12)",
      accent: "#a21caf",
      dot: "#d946ef",
    },
    "load-balancer": {
      ring: "rgba(59,130,246,0.6)",
      glow: "rgba(59,130,246,0.12)",
      accent: "#1d4ed8",
      dot: "#3b82f6",
    },
    server: {
      ring: "rgba(16,185,129,0.6)",
      glow: "rgba(16,185,129,0.12)",
      accent: "#059669",
      dot: "#10b981",
    },
    redis: {
      ring: "rgba(245,158,11,0.6)",
      glow: "rgba(245,158,11,0.12)",
      accent: "#d97706",
      dot: "#f59e0b",
    },
    postgres: {
      ring: "rgba(6,182,212,0.6)",
      glow: "rgba(6,182,212,0.12)",
      accent: "#0e7490",
      dot: "#06b6d4",
    },
    storage: {
      ring: "rgba(234,179,8,0.6)",
      glow: "rgba(234,179,8,0.12)",
      accent: "#a16207",
      dot: "#eab308",
    },
    dns: {
      ring: "rgba(99,102,241,0.6)",
      glow: "rgba(99,102,241,0.12)",
      accent: "#4338ca",
      dot: "#6366f1",
    },
    cdn: {
      ring: "rgba(20,184,166,0.6)",
      glow: "rgba(20,184,166,0.12)",
      accent: "#0f766e",
      dot: "#14b8a6",
    },
    "message-queue": {
      ring: "rgba(236,72,153,0.6)",
      glow: "rgba(236,72,153,0.12)",
      accent: "#be185d",
      dot: "#ec4899",
    },
    pubsub: {
      ring: "rgba(99,102,241,0.6)",
      glow: "rgba(99,102,241,0.12)",
      accent: "#4338ca",
      dot: "#6366f1",
    },
  };

  const colors = accentColors[data.type as string] ?? accentColors.server;

  // Flow rules
  const hasTarget = data.type !== "client";
  const hasSource =
    data.type !== "redis" &&
    data.type !== "postgres" &&
    data.type !== "storage";

  // Flavor badge
  const flavors = NODE_FLAVORS[data.type as string];
  const activeFlavor = flavors
    ? (flavors.find((f) => f.id === data.flavor) ?? flavors[0])
    : null;

  // Diamond shape requires inner counter-rotation for content
  const isDiamond = shape === "diamond";
  const isCircle = shape === "circle";
  const isHexagon = shape === "hexagon";
  const isParallelogram = shape === "parallelogram";
  const isCylinder = shape === "cylinder";

  const shapeStyle = getShapeStyle(shape);
  const isClipShape = isHexagon || isParallelogram;

  // Handle positions vary by shape
  const handleStyle: React.CSSProperties = {
    background: colors.dot,
    width: 8,
    height: 8,
    border: "2px solid rgba(255,255,255,0.25)",
    borderRadius: "50%",
  };

  return (
    <div
      className="relative flex items-center justify-center transition-all duration-200"
      style={{
        width: "100%",
        height: "100%",
        minWidth: isDiamond ? 120 : isCircle ? 90 : 180,
      }}
    >
      {/* Resizer — outside shape container */}
      <NodeResizer
        isVisible={selected}
        minWidth={isDiamond || isCircle ? 90 : 150}
        minHeight={isDiamond || isCircle ? 90 : 44}
        lineStyle={{ borderColor: colors.accent, borderWidth: 1 }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: colors.accent,
          border: "2px solid rgba(255,255,255,0.3)",
        }}
      />

      {/* Target handles (Left & Top) */}
      {hasTarget && (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="left"
            className="w-3.5 h-3.5 rounded-full border-[2.5px] border-white dark:border-[#0f172a] shadow-md cursor-crosshair hover:scale-[1.4] transition-all duration-150 z-50"
            style={{ background: colors.dot }}
          />
          <Handle
            type="target"
            position={Position.Top}
            id="top"
            className="w-3.5 h-3.5 rounded-full border-[2.5px] border-white dark:border-[#0f172a] shadow-md cursor-crosshair hover:scale-[1.4] transition-all duration-150 z-50"
            style={{ background: colors.dot }}
          />
        </>
      )}

      {/* ── Shape Container ─────────────────────────────────────────────── */}
      <div
        className="w-full h-full flex items-center justify-center overflow-hidden transition-all duration-150"
        style={{
          background: "var(--surface)",
          border: selected
            ? `1.5px solid ${colors.accent}`
            : `1px solid color-mix(in srgb, var(--border) 80%, ${colors.accent} 20%)`,
          boxShadow: selected
            ? `0 0 0 2px ${colors.ring}, 0 2px 6px rgba(0, 0, 0, 0.08)`
            : "0 1px 3px rgba(0, 0, 0, 0.05)",
          ...shapeStyle,
          ...(isCylinder
            ? {
                boxShadow: selected
                  ? `0 0 0 2px ${colors.ring}, 0 2px 6px rgba(0, 0, 0, 0.08)`
                  : "0 1px 3px rgba(0, 0, 0, 0.05)",
              }
            : {}),
        }}
      >
        {/* Content wrapper — counter-rotate if diamond */}
        <div
          className="flex items-center gap-2.5 px-3 py-2.5 w-full h-full"
          style={{
            transform: isDiamond ? "rotate(-45deg)" : undefined,
            flexDirection: isCircle ? "column" : "row",
            justifyContent: isCircle ? "center" : "flex-start",
            textAlign: isCircle ? "center" : "left",
            paddingLeft: isParallelogram ? "20px" : undefined,
          }}
        >
          {/* Icon */}
          <div
            className="shrink-0 flex items-center justify-center rounded-lg"
            style={{
              width: isCircle ? 28 : 26,
              height: isCircle ? 28 : 26,
              background: `color-mix(in srgb, transparent 88%, ${colors.accent})`,
              padding: "5px",
            }}
          >
            <ComponentIcon type={data.type} className="w-full h-full" />
          </div>

          {/* Label + sublabel */}
          {!isCircle && (
            <div className="min-w-0 flex-1 leading-tight">
              <p
                className="font-semibold text-[color:var(--foreground)] truncate"
                style={{
                  fontSize:
                    typeof data.fontSize === "number"
                      ? `${data.fontSize}px`
                      : isDiamond
                        ? "10px"
                        : "12.5px",
                }}
              >
                {data.label}
              </p>
              {activeFlavor && !isDiamond && (
                <p className="text-[10px] text-[color:var(--foreground)]/45 truncate font-medium">
                  {activeFlavor.shortLabel}
                </p>
              )}
              {data.type === "client" && !isDiamond && (
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary font-mono tracking-tight mt-0.5 bg-primary/10 px-1 py-0.2 rounded border border-primary/20">
                  <svg className="w-2 h-2 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Click to Run</span>
                </span>
              )}
            </div>
          )}

          {/* Brand logo badge */}
          {activeFlavor && !isDiamond && !isCircle && (
            <div
              className="shrink-0 flex items-center justify-center rounded-md"
              style={{
                width: 22,
                height: 22,
                background: `color-mix(in srgb, var(--surface) 80%, ${colors.accent})`,
                border: `1px solid color-mix(in srgb, var(--border) 70%, ${colors.accent})`,
              }}
            >
              <BrandLogo id={activeFlavor.id} className="w-4 h-4" />
            </div>
          )}

          {/* Circle: show label below icon */}
          {isCircle && (
            <p className="text-[9.5px] font-semibold text-[color:var(--foreground)] leading-tight w-full text-center truncate px-1 mt-0.5">
              {data.label}
            </p>
          )}
        </div>
      </div>

      {/* Active pulse dot */}
      {data.isActive && (
        <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: colors.dot }}
          />
          <span
            className="relative inline-flex rounded-full h-3 w-3"
            style={{ background: colors.dot }}
          />
        </span>
      )}

      {/* Source handles (Right & Bottom) */}
      {hasSource && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            className="w-3.5 h-3.5 rounded-full border-[2.5px] border-white dark:border-[#0f172a] shadow-md cursor-crosshair hover:scale-[1.4] transition-all duration-150 z-50"
            style={{ background: colors.dot }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom"
            className="w-3.5 h-3.5 rounded-full border-[2.5px] border-white dark:border-[#0f172a] shadow-md cursor-crosshair hover:scale-[1.4] transition-all duration-150 z-50"
            style={{ background: colors.dot }}
          />
        </>
      )}
    </div>
  );
}

// React Flow Custom Edge
function packetColor(isReverseMotion: boolean) {
  return isReverseMotion ? "#f59e0b" : "#3b82f6";
}

function PacketEdge(props: EdgeProps) {
  const {
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style,
    markerEnd,
    data,
  } = props;

  const connectionStyle = data?.connectionStyle ?? "default";
  const [edgePath] =
    connectionStyle === "straight"
      ? getStraightPath({ sourceX, sourceY, targetX, targetY })
      : connectionStyle === "smooth"
        ? getBezierPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
          })
        : getSmoothStepPath({
            sourceX,
            sourceY,
            targetX,
            targetY,
            sourcePosition,
            targetPosition,
            borderRadius: 12,
            offset: 20,
          });

  const isActive = Boolean(data?.active);
  const duration = Number(data?.packetDuration ?? 1.8);
  const isReverseMotion = Boolean(data?.reverseMotion);
  const count = Math.max(1, Math.min(Number(data?.packetCount ?? 1), 4));
  const frameIndex = Number(data?.frameIndex ?? 0);

  const animateRefs = useRef<Array<any>>([]);

  useEffect(() => {
    if (isActive) {
      animateRefs.current.forEach((ref, index) => {
        if (ref) {
          try {
            if (typeof ref.beginElementAt === "function") {
              ref.beginElementAt(index * 0.12);
            } else if (typeof ref.beginElement === "function") {
              ref.beginElement();
            }
          } catch (e) {
            console.error("Error starting SMIL animation:", e);
          }
        }
      });
    }
  }, [isActive, frameIndex]);

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeOpacity: isActive ? 0.95 : 0.4,
          transition: "stroke-opacity 150ms ease",
        }}
      />
      {isActive &&
        Array.from({ length: count }).map((_, index) => (
          <circle
            key={`${props.id}-${index}-${edgePath}-${frameIndex}`}
            r={4.5 - index * 0.5}
            fill={packetColor(isReverseMotion)}
            cx="0"
            cy="0"
            style={{
              filter: isReverseMotion
                ? "drop-shadow(0 0 5px rgba(245,158,11,0.85))"
                : "drop-shadow(0 0 5px rgba(59,130,246,0.85))",
              opacity: Math.max(0.45, 0.9 - index * 0.15),
            }}
          >
            <animateMotion
              ref={(el) => {
                animateRefs.current[index] = el;
              }}
              dur={`${duration}s`}
              repeatCount={data?.isPlaying ? "1" : "indefinite"}
              fill="freeze"
              begin={`${index * 0.12}s`}
              path={edgePath}
              keyPoints={isReverseMotion ? "1;0" : "0;1"}
              keyTimes="0;1"
              calcMode="linear"
            />
          </circle>
        ))}
    </>
  );
}

// Scenarios Detail Page Components ported for visual consistency
function shouldKeepFrame(hideResponse: boolean, frame: any) {
  if (!hideResponse) {
    return true;
  }

  return !(
    frame.action.includes("SEND_RESPONSE") ||
    frame.action.includes("RETURN_DATA") ||
    frame.action.includes("CACHE_HIT") ||
    frame.action.includes("CACHE_MISS") ||
    frame.action === "RESPONSE_BACKTRACK"
  );
}

function Controls({
  isPlaying,
  isCompiling,
  onPlayToggle,
  onPrev,
  onNext,
  onReset,
  onReframe,
  debugEnabled,
  onDebugToggle,
  speed,
  onSpeedChange,
  theme,
}: {
  isPlaying: boolean;
  isCompiling?: boolean;
  onPlayToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
  onReframe: () => void;
  debugEnabled: boolean;
  onDebugToggle: () => void;
  speed: number;
  onSpeedChange: (value: number) => void;
  theme: Theme;
}) {
  const btnBg = theme === "dark" ? "bg-slate-950" : "bg-slate-100";
  const btnBorder =
    theme === "dark"
      ? "border-slate-700 hover:border-slate-600"
      : "border-slate-300 hover:border-slate-400";
  const btnText = theme === "dark" ? "text-slate-300" : "text-slate-700";
  const buttonClass = `rounded-md border ${btnBorder} ${btnBg} px-3 py-1.5 text-xs ${btnText} transition hover:bg-${theme === "dark" ? "slate-900" : "slate-200"} cursor-pointer font-semibold`;

  return (
    <div className="flex flex-col gap-2 sm:gap-3 w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            disabled={isCompiling}
            onClick={onPlayToggle}
            className={`${buttonClass} flex items-center gap-1.5`}
          >
            {isCompiling ? (
              <>
                <div className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" />
                <span>Compiling...</span>
              </>
            ) : isPlaying ? (
              "Pause"
            ) : (
              "Play"
            )}
          </button>
          <button type="button" onClick={onPrev} className={buttonClass}>
            ← Prev
          </button>
          <button type="button" onClick={onNext} className={buttonClass}>
            Next →
          </button>
          <button type="button" onClick={onReset} className={buttonClass}>
            Reset
          </button>
          <button
            type="button"
            onClick={onReframe}
            className={`${buttonClass} bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[color:var(--accent)] border-[var(--accent)]/30 flex items-center gap-1.5`}
            title="Re-run simulation with current changes"
          >
            <FiRotateCcw className="w-3.5 h-3.5" />
            <span>Reframe</span>
          </button>
        </div>

        <div className="h-6 w-px bg-[var(--border)] hidden sm:block" />

        <div className="flex items-center gap-1 sm:gap-2">
          <label
            className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
          >
            <span className="hidden sm:inline">Speed: </span>
            <span className="font-semibold">{speed?.toFixed(1)}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speed}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            className="w-16 sm:w-20 cursor-pointer accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

function Timeline({
  frameIndex,
  frameGroups,
  onSeek,
  theme,
}: {
  frameIndex: number;
  frameGroups: Array<{ timestamp: number; frames: any[] }>;
  onSeek: (index: number) => void;
  theme: Theme;
}) {
  const emptyBg =
    theme === "dark"
      ? "bg-slate-950 border-slate-800"
      : "bg-slate-100 border-slate-300";
  const emptyText = theme === "dark" ? "text-slate-500" : "text-slate-600";
  const inactiveBg =
    theme === "dark"
      ? "bg-slate-950 border-slate-700 text-slate-400"
      : "bg-slate-100 border-slate-300 text-slate-600";
  const inactiveHover =
    theme === "dark"
      ? "hover:border-slate-600 hover:bg-slate-900"
      : "hover:border-slate-400 hover:bg-slate-200";

  if (frameGroups.length === 0) {
    return (
      <div className={`rounded-lg border ${emptyBg} p-2.5`}>
        <p className={`text-xs ${emptyText}`}>
          No frames available. Run simulation first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-x-hidden">
      <input
        type="range"
        min={0}
        max={Math.max(frameGroups.length - 1, 0)}
        value={Math.min(frameIndex, Math.max(frameGroups.length - 1, 0))}
        onChange={(event) => onSeek(Number(event.target.value))}
        className="w-full accent-blue-500 cursor-pointer"
      />

      <div className="flex gap-1 overflow-x-auto pb-1 max-h-12 scrollbar-thin">
        {frameGroups.map((group, index) => {
          const isActive = index === frameIndex;

          return (
            <button
              key={`${group.timestamp}-${index}`}
              type="button"
              onClick={() => onSeek(index)}
              className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] transition cursor-pointer font-medium ${
                isActive
                  ? "border-[var(--accent)]/60 bg-[var(--accent)]/20 text-[color:var(--accent)] shadow-inner"
                  : `${inactiveBg} ${inactiveHover}`
              }`}
              title={`t=${group.timestamp} (${group.frames.length} frame${group.frames.length > 1 ? "s" : ""})`}
            >
              t={group.timestamp}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getFormattedLogText(frame: any) {
  const normAction = frame.action.toUpperCase();
  const flow = `${frame.from} ➔ ${frame.to}`;

  if (normAction.includes("CACHE_HIT")) {
    return {
      text: `${flow} | Cache HIT - Key: "${frame.lookupKey || "N/A"}"`,
      type: "success",
    };
  }

  if (normAction.includes("CACHE_MISS")) {
    return {
      text: `${flow} | Cache MISS - Key: "${frame.lookupKey || "N/A"}"`,
      type: "warn",
    };
  }

  if (normAction.includes("DB_READ") || normAction.includes("READ_RECORD")) {
    return {
      text: `${flow} | DB Read - Key: "${frame.lookupKey || "N/A"}"`,
      type: "warn",
    };
  }

  if (
    normAction.includes("DB_WRITE") ||
    normAction.includes("STORE_FILE") ||
    normAction.includes("WRITE_RECORD") ||
    normAction.includes("UPLOAD_SUCCESS")
  ) {
    const payloadStr =
      frame.payloadSummary && frame.payloadSummary !== "{}"
        ? ` - Data: ${frame.payloadSummary}`
        : "";
    return {
      text: `${flow} | DB Write - Key: "${frame.lookupKey || "N/A"}"${payloadStr}`,
      type: "info",
    };
  }

  if (normAction.includes("RESPONSE_ERROR")) {
    const payloadStr =
      frame.payloadSummary && frame.payloadSummary !== "{}"
        ? ` - Payload: ${frame.payloadSummary}`
        : "";
    let statusText = "404 Not Found";
    if (normAction.includes("_405")) {
      statusText = "405 Method Not Allowed";
    } else if (normAction.includes("_500")) {
      statusText = "500 Internal Server Error";
    }
    return {
      text: `${flow} | Respond - Status: ${statusText}${payloadStr}`,
      type: "warn",
    };
  }

  if (normAction.includes("ENDPOINT_NOT_FOUND")) {
    return {
      text: `${flow} | 404 Not Found - ${frame.payloadSummary || "Endpoint Not Found"}`,
      type: "warn",
    };
  }

  if (normAction.includes("METHOD_NOT_ALLOWED")) {
    return {
      text: `${flow} | 405 Method Not Allowed - ${frame.payloadSummary || "Method Not Allowed"}`,
      type: "warn",
    };
  }

  if (
    normAction.includes("SEND_RESPONSE") ||
    normAction.includes("RETURN_DATA")
  ) {
    const payloadStr =
      frame.payloadSummary && frame.payloadSummary !== "{}"
        ? ` - Payload: ${frame.payloadSummary}`
        : "";
    return {
      text: `${flow} | Respond - Status: 200 OK${payloadStr}`,
      type: "success",
    };
  }

  if (
    normAction.includes("SEND_REQUEST") ||
    normAction.includes("ROUTE_REQUEST")
  ) {
    const payloadStr =
      frame.payloadSummary && frame.payloadSummary !== "{}"
        ? ` - Payload: ${frame.payloadSummary}`
        : "";
    return {
      text: `${flow} | Dispatch Request - Action: ${frame.action}${payloadStr}`,
      type: "default",
    };
  }

  if (normAction.includes("POSTGRES_POOL_WAIT")) {
    const payloadStr = frame.payloadSummary ? ` — ${frame.payloadSummary}` : "";
    return {
      text: `${flow} | [WAIT] POSTGRES POOL WAIT${payloadStr}`,
      type: "error",
    };
  }

  if (normAction.includes("POSTGRES_CONNECTION_ERROR")) {
    const payloadStr = frame.payloadSummary ? ` — ${frame.payloadSummary}` : "";
    return {
      text: `${flow} | [ERROR] POSTGRES CONNECTION ERROR${payloadStr}`,
      type: "error",
    };
  }

  if (normAction.includes("POSTGRES_QUERY_HIT")) {
    const reqStr = frame.requestName ? ` for ${frame.requestName}` : "";
    const keyStr = frame.lookupKey ? ` (Key: "${frame.lookupKey}")` : "";
    return {
      text: `${flow} | POSTGRES QUERY HIT${reqStr}${keyStr}`,
      type: "success",
    };
  }

  if (normAction.includes("POSTGRES_QUERY_MISS")) {
    const reqStr = frame.requestName ? ` for ${frame.requestName}` : "";
    const keyStr = frame.lookupKey ? ` (Key: "${frame.lookupKey}")` : "";
    return {
      text: `${flow} | POSTGRES QUERY MISS${reqStr}${keyStr}`,
      type: "warn",
    };
  }

  const details = [
    frame.lookupKey ? `Key: "${frame.lookupKey}"` : "",
    frame.payloadSummary && frame.payloadSummary !== "{}"
      ? `Payload: ${frame.payloadSummary}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");

  return {
    text: `${flow} | ${frame.action}${details ? ` (${details})` : ""}`,
    type: "default",
  };
}

function DebugPanel({
  currentFrames,
  frameIndex,
  theme,
}: {
  currentFrames: any[];
  frameIndex: number;
  theme: Theme;
}) {
  const textColor = theme === "dark" ? "text-slate-500" : "text-slate-400";
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [currentFrames.length]);

  if (currentFrames.length === 0) {
    return (
      <div className="font-mono text-xs p-2 text-center sm:text-left flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-violet-400/60 animate-ping shrink-0" />
        <span className={textColor}>
          Simulation logs ready — click{" "}
          <strong className="text-violet-400">Play</strong> or{" "}
          <strong className="text-violet-400">Reframe</strong> to stream live
          execution logs.
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="font-mono text-xs space-y-1.5 max-h-40 overflow-y-auto p-1 scroll-smooth scrollbar-thin"
    >
      {currentFrames.map((frame, idx) => {
        const formatted = getFormattedLogText(frame);
        const colors: Record<string, string> = {
          success: "text-emerald-400",
          info: "text-blue-400",
          warn: "text-amber-400",
          default: "text-[color:var(--foreground)]/80",
        };

        return (
          <div
            key={`${frame.requestId}-${idx}`}
            className="flex gap-2 items-start text-[11px] leading-relaxed"
          >
            <span className="text-[color:var(--foreground)]/35 select-none">
              [t={frame.timestamp}]
            </span>
            <span className="text-violet-400 font-bold select-none">&gt;</span>
            <span className={colors[formatted.type] || colors.default}>
              {formatted.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Shapes / Frame Library ─────────────────────────────────────────────────
// These are used as group containers / annotation frames (like Excalidraw frames,
// Figma frames, draw.io swim lanes). They sit behind regular nodes.
const SHAPES_LIBRARY = [
  {
    id: "rect",
    label: "Rectangle",
    borderRadius: "10px",
    clipPath: undefined,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-4 h-4 text-violet-400"
      >
        <rect x="3" y="3" width="18" height="18" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "rounded-rect",
    label: "Round Rect",
    borderRadius: "999px",
    clipPath: undefined,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-4 h-4 text-blue-400"
      >
        <rect x="3" y="3" width="18" height="18" rx="6" />
      </svg>
    ),
  },
  {
    id: "circle",
    label: "Circle",
    borderRadius: "50%",
    clipPath: undefined,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-4 h-4 text-emerald-400"
      >
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    id: "diamond",
    label: "Diamond",
    borderRadius: "0",
    clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-4 h-4 text-amber-400"
      >
        <path d="M12 2L22 12L12 22L2 12Z" />
      </svg>
    ),
  },
  {
    id: "hexagon",
    label: "Hexagon",
    borderRadius: "0",
    clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-4 h-4 text-cyan-400"
      >
        <path d="M12 2L21 7.2V16.8L12 22L3 16.8V7.2Z" />
      </svg>
    ),
  },
  {
    id: "parallelogram",
    label: "Slant",
    borderRadius: "0",
    clipPath: "polygon(12% 0%, 100% 0%, 88% 100%, 0% 100%)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-4 h-4 text-yellow-400"
      >
        <path d="M6 4H21L18 20H3Z" />
      </svg>
    ),
  },
  {
    id: "triangle",
    label: "Triangle",
    borderRadius: "0",
    clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-4 h-4 text-pink-400"
      >
        <path d="M12 3L22 21H2Z" />
      </svg>
    ),
  },
  {
    id: "sticky",
    label: "Sticky",
    borderRadius: "4px",
    clipPath: undefined,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-4 h-4 text-orange-400"
      >
        <path d="M3 3H16L21 8V21H3V3Z" />
        <path d="M16 3V8H21" />
      </svg>
    ),
  },
  {
    id: "text",
    label: "Text",
    borderRadius: "0",
    clipPath: undefined,
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="w-4 h-4 text-slate-300"
      >
        <path d="M4 7V4H20V7M12 4V20M9 20H15" />
      </svg>
    ),
  },
];

// Preset color palette for frame fills
const FRAME_COLOR_PRESETS = [
  { color: "#8b5cf6", label: "Violet" },
  { color: "#3b82f6", label: "Blue" },
  { color: "#10b981", label: "Emerald" },
  { color: "#f59e0b", label: "Amber" },
  { color: "#ec4899", label: "Pink" },
  { color: "#06b6d4", label: "Cyan" },
  { color: "#f97316", label: "Orange" },
  { color: "#ef4444", label: "Red" },
  { color: "#6366f1", label: "Indigo" },
  { color: "#14b8a6", label: "Teal" },
  { color: "#64748b", label: "Slate" },
  { color: "#a3a3a3", label: "Gray" },
];

// React Flow Shape Node — Group frame / container, sits behind nodes
// Label shown inside body (sticky/text) or bottom-left badge, with align options
function ShapeNode({ data, selected }: any) {
  const shapeDef =
    SHAPES_LIBRARY.find((s) => s.id === (data.shapeId ?? "rect")) ??
    SHAPES_LIBRARY[0];
  const isText = data.shapeId === "text";
  const isSticky = data.shapeId === "sticky";
  const color = (data.color as string) || "#8b5cf6";
  const textAlign = (data.textAlign as "left" | "center" | "right") || "center";

  // Parse a hex color into rgba with an alpha
  function hexToRgba(hex: string, alpha: number) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  const fillColor = isText
    ? "transparent"
    : hexToRgba(color, isSticky ? 0.18 : 0.07);
  const borderColor = isText
    ? "transparent"
    : selected
      ? hexToRgba(color, 0.9)
      : hexToRgba(color, 0.45);
  const labelColor = hexToRgba(color, 0.9);

  const customFontSize =
    typeof data.fontSize === "number" ? data.fontSize : undefined;

  return (
    <div
      className="w-full h-full relative group"
      style={{ minWidth: isText ? 80 : 160, minHeight: isText ? 28 : 100 }}
    >
      {/* Resizer — always shown for frames */}
      <NodeResizer
        isVisible={selected}
        minWidth={isText ? 60 : 120}
        minHeight={isText ? 24 : 80}
        lineStyle={{ borderColor: hexToRgba(color, 0.6), borderWidth: 1 }}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
          border: "2px solid rgba(255,255,255,0.3)",
        }}
      />

      {isText ? (
        /* ── Plain text label ── */
        <div
          className="w-full h-full flex items-center"
          style={{
            justifyContent:
              textAlign === "left"
                ? "flex-start"
                : textAlign === "right"
                  ? "flex-end"
                  : "center",
          }}
        >
          {data.label && (
            <span
              className="select-none font-semibold w-full break-words"
              style={{
                fontSize: customFontSize ?? 15,
                color: "var(--foreground)",
                pointerEvents: "none",
                textAlign: textAlign,
              }}
            >
              {data.label}
            </span>
          )}
        </div>
      ) : isSticky ? (
        /* ── Sticky Note ── */
        <div
          className="w-full h-full relative overflow-hidden transition-all duration-150 flex items-center p-3"
          style={{
            background: fillColor,
            border: `2px solid ${borderColor}`,
            borderRadius: shapeDef.borderRadius,
            boxShadow: selected
              ? `0 0 0 1px ${hexToRgba(color, 0.3)}, 0 4px 24px ${hexToRgba(color, 0.12)}`
              : "none",
            justifyContent:
              textAlign === "left"
                ? "flex-start"
                : textAlign === "right"
                  ? "flex-end"
                  : "center",
          }}
        >
          {data.label && (
            <span
              className="font-semibold select-none leading-snug break-words w-full"
              style={{
                fontSize: customFontSize ?? 12,
                color: labelColor,
                pointerEvents: "none",
                textAlign: textAlign,
              }}
            >
              {data.label}
            </span>
          )}
        </div>
      ) : (
        /* ── Group Frame / Container shape ── */
        <div
          className="w-full h-full relative overflow-hidden transition-all duration-150"
          style={{
            background: fillColor,
            border: `2px ${selected ? "solid" : "dashed"} ${borderColor}`,
            borderRadius: shapeDef.borderRadius,
            clipPath: shapeDef.clipPath,
            boxShadow: selected
              ? `0 0 0 1px ${hexToRgba(color, 0.3)}, 0 4px 24px ${hexToRgba(color, 0.12)}`
              : "none",
          }}
        >
          {/* ── Label badge at bottom-left ── */}
          {!shapeDef.clipPath && data.label && (
            <div
              className="absolute bottom-0 left-0 right-0 px-3 py-1.5 flex items-center"
              style={{
                background: hexToRgba(color, 0.12),
                borderTop: `1px solid ${hexToRgba(color, 0.2)}`,
                justifyContent:
                  textAlign === "left"
                    ? "flex-start"
                    : textAlign === "right"
                      ? "flex-end"
                      : "center",
              }}
            >
              <span
                className="font-bold truncate select-none"
                style={{
                  fontSize: customFontSize ?? 11,
                  color: labelColor,
                  pointerEvents: "none",
                  textAlign: textAlign,
                  width: "100%",
                }}
              >
                {data.label}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PIPELINE_PRESETS = [
  {
    id: "auto",
    label: "Auto (Topology Discovery)",
    description: "Automatic routing via connected canvas topology",
    icon: FiShare2,
  },
  {
    id: "cache-aside",
    label: "Cache-Aside Pattern",
    description: "Redis cache hop with early return, PostgreSQL fallback",
    icon: FiLink,
  },
  {
    id: "strict-sequence",
    label: "Strict Sequence",
    description: "Unconditional Redis hop followed by PostgreSQL",
    icon: FiDatabase,
  },
  {
    id: "direct-db",
    label: "Direct Database",
    description: "Bypass cache and query PostgreSQL directly",
    icon: FiDatabase,
  },
  {
    id: "write-through",
    label: "Write-Through Invalidation",
    description: "PostgreSQL write followed by Redis invalidation",
    icon: FiRefreshCw,
  },
  {
    id: "custom",
    label: "Custom Hop Sequence",
    description: "Manually configured and ordered service hops",
    icon: FiSliders,
  },
];

function PipelinePresetDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as unknown as globalThis.Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const activePreset =
    PIPELINE_PRESETS.find((p) => p.id === value) || PIPELINE_PRESETS[0];
  const ActiveIcon = activePreset.icon;

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] transition cursor-pointer text-xs text-[color:var(--foreground)] outline-none focus:border-[var(--accent)]"
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          <ActiveIcon className="size-3.5 text-[color:var(--accent)] shrink-0" />
          <span className="truncate font-medium">{activePreset.label}</span>
        </div>
        <FiChevronDown
          className={`size-3 text-[color:var(--foreground)]/50 transition-transform duration-150 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-xl p-1 max-h-56 overflow-y-auto scrollbar-thin">
          {PIPELINE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = preset.id === value;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onChange(preset.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start gap-2 p-2 rounded-md text-left transition cursor-pointer ${
                  isSelected
                    ? "bg-[var(--accent)]/10 text-[color:var(--accent)]"
                    : "hover:bg-[var(--surface-muted)] text-[color:var(--foreground)]"
                }`}
              >
                <Icon
                  className={`size-3.5 mt-0.5 shrink-0 ${
                    isSelected ? "text-[color:var(--accent)]" : "text-[color:var(--foreground)]/60"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">
                      {preset.label}
                    </span>
                    {isSelected && <FiCheck className="size-3 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-[color:var(--foreground)]/50 leading-tight mt-0.5">
                    {preset.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const nodeTypes = {
  customNode: CustomNode,
  default: CustomNode,
  shapeNode: ShapeNode,
};

const edgeTypes = {
  packet: PacketEdge,
};

// The actual workspace content — extracted so useReactFlow() hook works
function WorkspaceInner({
  workspaceId,
  diagramId,
  shareId,
  isSharedView = false,
}: {
  workspaceId?: string;
  diagramId?: string;
  shareId?: string;
  isSharedView?: boolean;
}) {
  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();
  const { token, user } = useAuthStore();
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const [diagramTitle, setDiagramTitle] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingDiagram, setIsLoadingDiagram] = useState<boolean>(
    Boolean((workspaceId && diagramId) || shareId),
  );

  // Load diagram from backend if workspaceId and diagramId are provided, or if shareId is provided
  useEffect(() => {
    if (shareId) {
      setIsLoadingDiagram(true);
      getSharedDiagram(shareId)
        .then((dto) => {
          setDiagramTitle(dto.title);
          if (Array.isArray(dto.nodes) && dto.nodes.length > 0) {
            const sanitizedNodes = dto.nodes.map((n: any) => {
              const inferred = inferWorkspaceNodeType(n);
              const isShape = n.type === "shapeNode";
              return {
                ...n,
                type: isShape ? "shapeNode" : "customNode",
                style: isShape ? n.style : undefined,
                data: {
                  ...(n.data || {}),
                  label: n.data?.label || (inferred.charAt(0).toUpperCase() + inferred.slice(1)),
                  type: n.data?.type || inferred,
                },
              };
            });
            setNodes(sanitizedNodes);

            const baseConfigs =
              dto.configs && typeof dto.configs === "object"
                ? { ...dto.configs }
                : {};
            for (const n of sanitizedNodes) {
              if (!baseConfigs[n.id]) {
                const nodeType = (n.data?.type || inferWorkspaceNodeType(n)) as ComponentType;
                baseConfigs[n.id] = createDefaultConfig(
                  nodeType,
                  n.id,
                  n.data?.label || n.id,
                );
              }
            }
            setNodeConfigs(baseConfigs);
          } else if (dto.configs && typeof dto.configs === "object") {
            setNodeConfigs(dto.configs);
          }
          if (Array.isArray(dto.edges)) {
            setEdges(dto.edges);
          }
          setTimeout(() => {
            fitView({ duration: 600 });
          }, 150);
        })
        .catch((err) => {
          console.error("Failed to load shared diagram:", err);
          setValidationWarning(err.message || "Failed to load shared diagram");
        })
        .finally(() => {
          setIsLoadingDiagram(false);
        });
    } else if (workspaceId && diagramId && token) {
      setIsLoadingDiagram(true);
      getDiagramById(workspaceId, diagramId, token)
        .then((dto) => {
          setDiagramTitle(dto.title);
          if (Array.isArray(dto.nodes) && dto.nodes.length > 0) {
            const sanitizedNodes = dto.nodes.map((n: any) => {
              const inferred = inferWorkspaceNodeType(n);
              const isShape = n.type === "shapeNode";
              return {
                ...n,
                type: isShape ? "shapeNode" : "customNode",
                style: isShape ? n.style : undefined,
                data: {
                  ...(n.data || {}),
                  label: n.data?.label || (inferred.charAt(0).toUpperCase() + inferred.slice(1)),
                  type: n.data?.type || inferred,
                },
              };
            });
            setNodes(sanitizedNodes);

            const baseConfigs =
              dto.configs && typeof dto.configs === "object"
                ? { ...dto.configs }
                : {};
            for (const n of sanitizedNodes) {
              if (!baseConfigs[n.id]) {
                const nodeType = (n.data?.type || inferWorkspaceNodeType(n)) as ComponentType;
                baseConfigs[n.id] = createDefaultConfig(
                  nodeType,
                  n.id,
                  n.data?.label || n.id,
                );
              }
            }
            setNodeConfigs(baseConfigs);
          } else if (dto.configs && typeof dto.configs === "object") {
            setNodeConfigs(dto.configs);
          }
          if (Array.isArray(dto.edges)) {
            setEdges(dto.edges);
          }
          setTimeout(() => {
            fitView({ duration: 600 });
          }, 150);
        })
        .catch((err) => {
          console.error("Failed to load diagram from server:", err);
        })
        .finally(() => {
          setIsLoadingDiagram(false);
        });
    }
  }, [workspaceId, diagramId, shareId, token, fitView]);

  // React Flow States
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Node Configurations State
  const [nodeConfigs, setNodeConfigs] = useState<Record<string, any>>({});
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [inspectorWidth, setInspectorWidth] = useState<number>(380);
  const [isResizingInspector, setIsResizingInspector] = useState<boolean>(false);

  const handleStartResizeInspector = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizingInspector(true);
      const startX = e.clientX;
      const startWidth = inspectorWidth;

      const onMouseMove = (moveEvent: MouseEvent) => {
        const delta = startX - moveEvent.clientX;
        const newWidth = Math.max(300, Math.min(800, startWidth + delta));
        setInspectorWidth(newWidth);
      };

      const onMouseUp = () => {
        setIsResizingInspector(false);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [inspectorWidth],
  );

  const handleSaveDiagramToBackend = async () => {
    if (!workspaceId || !diagramId || !token) return;
    try {
      setIsSaving(true);
      await updateDiagram(
        workspaceId,
        diagramId,
        {
          nodes,
          edges,
          configs: nodeConfigs,
        },
        token,
      );
      setSuccessToast("Diagram saved to MongoDB successfully!");
    } catch (err: any) {
      setValidationWarning(err.message || "Failed to save diagram");
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut Ctrl+S (Save) and Ctrl+I (Toggle Relay Assistant)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSaveDiagramToBackend();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
        e.preventDefault();
        setIsAIAssistantOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [workspaceId, diagramId, token, nodes, edges, nodeConfigs]);

  // Playback Simulation States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompilingSimulation, setIsCompilingSimulation] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [frameIndex, setFrameIndex] = useState(0);
  const [executionMode, setExecutionMode] = useState<"animation" | "instant">("animation");

  // Dynamic top-bar configs
  const [hideResponse, setHideResponse] = useState(false);
  const [parallelResponse, setParallelResponse] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(false);
  const [bgPattern, setBgPattern] = useState<
    "dots" | "lines" | "cross" | "none"
  >("dots");
  const [connectionStyle, setConnectionStyle] = useState<
    "default" | "smooth" | "straight"
  >("default");
  const [bgOpacity, setBgOpacity] = useState<number>(0.12);
  const [showBgControls, setShowBgControls] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);

  // Simulation Video Recording (WebM / MP4)
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingMinimized, setIsRecordingMinimized] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [videoFormat, setVideoFormat] = useState<"webm" | "mp4">("webm");
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Raw generated simulation frames list
  const [rawSimulationFrames, setRawSimulationFrames] = useState<any[]>([]);
  const [validationWarning, setValidationWarning] = useState<string | null>(
    null,
  );
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Export Video Configuration Options
  const [exportTheme, setExportTheme] = useState<"dark" | "light">(
    theme === "dark" ? "dark" : "light",
  );
  const [exportExecutionMode, setExportExecutionMode] = useState<
    "sequential" | "parallel"
  >(parallelResponse ? "parallel" : "sequential");
  const [exportPacketFilter, setExportPacketFilter] = useState<
    "all" | "forwardOnly"
  >(hideResponse ? "forwardOnly" : "all");
  const [exportSpeed, setExportSpeed] = useState<number>(speed || 1);
  const [exportBgPattern, setExportBgPattern] = useState<
    "dots" | "lines" | "cross" | "none"
  >(bgPattern || "dots");
  const [exportResolution, setExportResolution] = useState<
    "720p" | "1080p" | "1440p"
  >("1080p");
  const [exportConnectionStyle, setExportConnectionStyle] = useState<
    "default" | "smooth" | "straight"
  >((connectionStyle as any) || "default");
  const [exportIncludeSelection, setExportIncludeSelection] =
    useState<boolean>(true);
  const [exportWatermark, setExportWatermark] = useState<"none" | "branded">(
    "branded",
  );
  const [isExportingVideo, setIsExportingVideo] = useState(false);

  // Format MM:SS helper for recording duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const cancelRecordingRef = useRef<(() => void) | null>(null);

  // ── Dedicated Simulation Video Export (WebM / MP4) with user-configured options ──
  const handleExportSimulationVideo = async () => {
    try {
      if (nodes.length === 0) {
        setValidationWarning(
          "Canvas is empty. Add nodes and connections before exporting video.",
        );
        return;
      }

      setIsExportingVideo(true);
      setSuccessToast(
        `Rendering architecture simulation video (${videoFormat.toUpperCase()})...`,
      );

      // Determine active frame groups to record based on export options
      let activeGroups = frameGroups;

      if (rawSimulationFrames.length > 0) {
        const isParallel = exportExecutionMode === "parallel";
        const hideResp = exportPacketFilter === "forwardOnly";
        let globalTimestampOffset = 0;
        const flatFrames: any[] = [];

        rawSimulationFrames.forEach((run) => {
          const runFrames = run.frames.map((frame: any) => ({
            ...frame,
            timestamp: isParallel
              ? frame.timestamp
              : frame.timestamp + globalTimestampOffset,
          }));

          flatFrames.push(...runFrames);

          if (!isParallel) {
            const maxTime =
              run.frames.length > 0
                ? Math.max(...run.frames.map((f: any) => f.timestamp))
                : -1;
            globalTimestampOffset += maxTime + 1;
          }
        });

        const framesToRender = isParallel
          ? (() => {
              const pq = new PriorityQueue();
              pq.pushMultipleIntoQueue(flatFrames);
              const merged: any[] = [];
              while (!pq.isEmpty()) {
                const item = pq.popMinTimeStampItem();
                if (item) merged.push(item);
              }
              return merged;
            })()
          : flatFrames.sort((a, b) => a.timestamp - b.timestamp);

        const filtered = framesToRender.filter((frame) =>
          shouldKeepFrame(hideResp, frame),
        );

        const grouped = new Map<number, any[]>();
        for (const frame of filtered) {
          const list = grouped.get(frame.timestamp) ?? [];
          list.push(frame);
          grouped.set(frame.timestamp, list);
        }

        activeGroups = Array.from(grouped.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([timestamp, frames]) => ({ timestamp, frames }));
      } else if (activeGroups.length === 0) {
        if (edges.length > 0) {
          activeGroups = edges.map((e, idx) => ({
            timestamp: idx,
            frames: [
              {
                from: e.source,
                to: e.target,
                action: "PACKET_DISPATCH",
              },
            ],
          }));
        } else {
          setValidationWarning(
            "Please connect at least two nodes to simulate packet hops.",
          );
          setIsExportingVideo(false);
          return;
        }
      } else if (exportPacketFilter === "forwardOnly") {
        activeGroups = activeGroups
          .map((g) => ({
            timestamp: g.timestamp,
            frames: g.frames.filter((f) => shouldKeepFrame(true, f)),
          }))
          .filter((g) => g.frames.length > 0);
      }

      const isAuthorUser =
        user?.email?.toLowerCase().trim() === "navnathkadam284@gmail.com";
      const effectiveWatermark = isAuthorUser ? exportWatermark : "branded";

      const cancel = await recordSimulationVideo({
        nodes,
        edges,
        frameGroups: activeGroups,
        theme: exportTheme,
        videoFormat,
        speed: exportSpeed,
        bgPattern: exportBgPattern,
        resolution: exportResolution,
        connectionStyle: exportConnectionStyle,
        selectedNodeId: selectedNode?.id ?? null,
        includeSelection: exportIncludeSelection,
        watermark: effectiveWatermark,
        showPorts: true,
        onProgress: (_percent, _status) => {
          // Progress updates
        },
        onComplete: (blob, url, ext) => {
          setIsExportingVideo(false);
          if (recordedVideoUrl) {
            URL.revokeObjectURL(recordedVideoUrl);
          }
          setRecordedVideoBlob(blob);
          setRecordedVideoUrl(url);
          setSuccessToast(
            `${exportResolution} Simulation video saved as .${ext}!`,
          );
        },
        onError: (err) => {
          setIsExportingVideo(false);
          setValidationWarning(`Export error: ${err.message || err}`);
        },
      });

      cancelRecordingRef.current = cancel;
    } catch (err: any) {
      setIsExportingVideo(false);
      setValidationWarning(`Failed to export video: ${err.message || err}`);
    }
  };

  // ── Live Session Freeform Screen Recorder ──
  const handleStartRecording = async () => {
    try {
      setIsSettingsOpen(false);

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getDisplayMedia
      ) {
        setValidationWarning(
          "Screen recording is not supported in this browser environment.",
        );
        return;
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
          frameRate: { ideal: 60, max: 60 },
        } as any,
        audio: false,
      });

      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];

      let mimeType =
        videoFormat === "mp4" ? "video/mp4" : "video/webm;codecs=vp9";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
          mimeType = "video/webm;codecs=vp8";
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
          mimeType = "video/webm";
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4";
        } else {
          mimeType = "";
        }
      }

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000 })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setIsRecording(false);

        const actualMime =
          recorder.mimeType ||
          (videoFormat === "mp4" ? "video/mp4" : "video/webm");
        const blob = new Blob(recordedChunksRef.current, { type: actualMime });
        setRecordedVideoBlob(blob);

        if (recordedVideoUrl) {
          URL.revokeObjectURL(recordedVideoUrl);
        }
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);

        const ext =
          videoFormat === "mp4" && actualMime.includes("mp4") ? "mp4" : "webm";
        const a = document.createElement("a");
        a.href = url;
        a.download = `flowframe-session-${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setSuccessToast(`Live session recorded & saved as .${ext}!`);
      };

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          if (
            mediaRecorderRef.current &&
            mediaRecorderRef.current.state !== "inactive"
          ) {
            mediaRecorderRef.current.stop();
          }
        };
      }

      recorder.start(250);
      setIsRecording(true);
      setIsRecordingMinimized(false);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      setSuccessToast("Live recording started! Use the canvas freely.");
    } catch (err: any) {
      if (err.name !== "NotAllowedError") {
        setValidationWarning(`Failed to start recording: ${err.message || err}`);
      }
    }
  };

  const handleStopRecording = () => {
    if (cancelRecordingRef.current) {
      cancelRecordingRef.current();
      cancelRecordingRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsRecordingMinimized(false);
    setIsExportingVideo(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const handleDownloadRecordedVideo = () => {
    if (!recordedVideoUrl) return;
    const a = document.createElement("a");
    a.href = recordedVideoUrl;
    a.download = `flowframe-simulation-${Date.now()}.${videoFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClearRecordedVideo = () => {
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
    }
    setRecordedVideoUrl(null);
    setRecordedVideoBlob(null);
  };

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl);
      }
    };
  }, [recordedVideoUrl]);

  // Auto-dismiss success toast
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const [showMetrics, setShowMetrics] = useState(true);
  const [activeReqIdx, setActiveReqIdx] = useState(0);

  // Extract client requests for top toolbar API selection
  const clientEndpoints = useMemo(() => {
    const eps: Array<{ id: string; label: string; method?: string }> = [];
    nodes.forEach((n) => {
      const nType = (n.data?.type || n.type || "") as string;
      if (nType === "client") {
        const reqs = (n.data?.requests as any[]) || [];
        reqs.forEach((r, idx) => {
          eps.push({
            id: `${n.id}-${idx}`,
            label: `${n.data?.label || n.id}: ${r.endpoint || "/"}`,
            method: Array.isArray(r.allowedMethods)
              ? r.allowedMethods[0]
              : r.method || "GET",
          });
        });
      }
    });
    return eps;
  }, [nodes]);

  // Terminal Panel height state for bottom docked resizable view
  const [panelHeight, setPanelHeight] = useState(220);
  const [isDraggingTerminal, setIsDraggingTerminal] = useState(false);

  // Floating Panel Visibility States
  const [showCanvasTip, setShowCanvasTip] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [initialAIPrompt, setInitialAIPrompt] = useState<string>("");
  const [initialThink, setInitialThink] = useState<boolean>(true);

  // Auto-open AI Architecture Assistant if ?ai=true is in URL query parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("ai") === "true") {
        setIsAIAssistantOpen(true);
      }
      const promptParam = params.get("prompt");
      if (promptParam) {
        setInitialAIPrompt(promptParam);
      }
      const thinkParam = params.get("think");
      if (thinkParam !== null) {
        setInitialThink(thinkParam === "true");
      }
    }
  }, []);

  // Redesigned Sidebar Accordions & Search states
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(true);
  const [isComponentsExpanded, setIsComponentsExpanded] = useState(true);
  const [isShapesExpanded, setIsShapesExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Workspace Mode: Minimal Canvas vs Dominant Full IDE Code Editor
  const [workspaceMode, setWorkspaceMode] = useState<"canvas" | "editor">(
    "canvas",
  );
  const [sidebarTab, setSidebarTab] = useState<"library" | "editor">("library");

  // Read ?tab=editor query parameter to immediately open in Full IDE mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "editor") {
        setWorkspaceMode("editor");
      }
    }
  }, []);

  const [dslCode, setDslCode] =
    useState<string>(`// FlowFrame Architecture DSL Script
// Define system nodes with canvas positions (x, y coordinates)

// Define Client Node (left entrypoint)
define CLIENT c1 {
  x: 80,
  y: 220,
  label: "Client 1",
  requests: [
    {
      endpoint: "/api/v1/posts",
      allowedMethods: ["GET", "POST"],
      key: "rohan"
    }
  ]
}

// Define API Server Node (center compute & routing)
define SERVER s1 {
  x: 380,
  y: 220,
  label: "API Server",
  capacity: 100,
  tcpConnectionsToPostgres: 5,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ]
}

// Define In-Memory Redis Cache (top right)
define REDIS r1 {
  x: 680,
  y: 100,
  label: "Redis Cache",
  data: [
    { key: "rohan", value: "cached post data" }
  ]
}

// Define Relational PostgreSQL Database (bottom right)
define POSTGRES db1 {
  x: 680,
  y: 340,
  label: "PostgreSQL DB",
  table: "posts",
  data: [
    { key: "rohan", value: "persistent post record" }
  ]
}

// System Request Flow Connections
connect c1 -> s1
connect s1 -> r1
connect s1 -> db1
`);

  // Movable / Resizable / Mobile sidebar states
  const [isSidebarFloating, setIsSidebarFloating] = useState(false);
  const [sidebarPosition, setSidebarPosition] = useState({ x: 16, y: 16 });
  const [sidebarWidth, setSidebarWidth] = useState(288);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  // Hover popover states to avoid overflow clip
  const [hoveredComponent, setHoveredComponent] =
    useState<ComponentMetadata | null>(null);
  const [hoverTooltipX, setHoverTooltipX] = useState(0);
  const [hoverTooltipY, setHoverTooltipY] = useState(0);

  // Drag-and-drop state
  const [draggingType, setDraggingType] = useState<ComponentType | null>(null);
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false);

  const dragStartOffset = useRef({ x: 0, y: 0 });

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (!isSidebarFloating) return;
    if ((e.target as HTMLElement).closest("button, input, select")) return;

    setIsDraggingSidebar(true);
    dragStartOffset.current = {
      x: e.clientX - sidebarPosition.x,
      y: e.clientY - sidebarPosition.y,
    };
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDraggingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragStartOffset.current.x;
      const newY = e.clientY - dragStartOffset.current.y;

      const maxX = window.innerWidth - 300;
      const maxY = window.innerHeight - 200;

      setSidebarPosition({
        x: Math.max(10, Math.min(newX, maxX)),
        y: Math.max(10, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingSidebar]);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingSidebar(true);
  };

  useEffect(() => {
    if (!isResizingSidebar) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      setSidebarWidth(Math.max(240, Math.min(newWidth, 480)));
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingSidebar]);

  // Terminal Panel height row resize handler (similar to scenarios/ academy pages)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingTerminal) return;

      const container = document.querySelector(
        "[data-resizable-container]",
      ) as HTMLElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;

      // Min height 100px, max 80% of container
      const minHeight = 100;
      const maxHeight = containerRect.height * 0.8;

      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setPanelHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingTerminal(false);
    };

    if (isDraggingTerminal) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "row-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "auto";
      document.body.style.cursor = "auto";
    };
  }, [isDraggingTerminal]);

  const filteredComponents = useMemo(() => {
    return COMPONENTS_LIBRARY.filter(
      (item) =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery]);

  const uid = useMemo(() => new ShortUniqueId({ length: 8 }), []);

  // Build model state mappings & Run Simulation
  const handleStartSimulation = useCallback(
    (
      targetClientId?: string,
      overrideNodes?: Node[],
      overrideEdges?: Edge[],
      overrideConfigs?: Record<string, any>,
    ) => {
      const activeNodes = overrideNodes || nodes;
      const activeEdges = overrideEdges || edges;
      const activeConfigs = overrideConfigs || nodeConfigs;

      // 1. Detect Clients
      const clientNodes = activeNodes.filter(
        (n) =>
          n.data?.type === "client" ||
          (typeof n.data?.label === "string" &&
            n.data.label.toLowerCase().includes("client")) ||
          n.id.toLowerCase().startsWith("client"),
      );
      if (clientNodes.length === 0) {
        setValidationWarning(
          "Please add at least one Client node to the canvas.",
        );
        return;
      }

      const clientToRun = targetClientId
        ? clientNodes.find((n) => n.id === targetClientId)
        : clientNodes[0];

      if (!clientToRun) {
        setValidationWarning("Valid Client not found.");
        return;
      }

      const clientId = clientToRun.id;
      setValidationWarning(null);
      setIsCompilingSimulation(true);

      // 2. Initialize simulation components
      const graph = new GraphManager("dynamic-graph");
      const registry = new NodeRegistry("dynamic-registry");
      const ipv4Instance = new Ipv4Generator();
      const rrStrategy = new RoundRobinStrategy();

      // 3. Register nodes
      activeNodes.forEach((n) => {
        const type = (n.data?.type || inferWorkspaceNodeType(n)) as ComponentType;
        const labelStr = (n.data?.label as string) || "";
        const config =
          activeConfigs[n.id] || createDefaultConfig(type, n.id, labelStr);

        let modelInstance: any;

        switch (type) {
          case "client":
            modelInstance = new ClientModel(n.id, labelStr);
            break;
          case "load-balancer":
            modelInstance = new LoadBalancerModel(n.id, labelStr, rrStrategy);
            break;
          case "server":
            modelInstance = new ServerModel(n.id, labelStr);
            if (typeof config.capacity === "number") {
              modelInstance.capacity = config.capacity;
            }
            if (typeof config.prefetchLimit === "number") {
              modelInstance.prefetchLimit = config.prefetchLimit;
            }
            if (config.endpoints) {
              modelInstance.endpoints = { ...config.endpoints };
            }
            if (config.endpointPipelines && typeof config.endpointPipelines === "object") {
              modelInstance.endpointPipelines = { ...config.endpointPipelines };
            }
            if (config.endpointPipelinePolicies && typeof config.endpointPipelinePolicies === "object") {
              modelInstance.endpointPipelinePolicies = { ...config.endpointPipelinePolicies };
            }
            break;
          case "redis":
            modelInstance = new RedisModel(n.id, labelStr);
            if (Array.isArray(config.data)) {
              config.data.forEach((item: any) => {
                const itemVal =
                  item.value !== undefined
                    ? item.value
                    : item.val !== undefined
                      ? item.val
                      : "cached data";
                if (item.key) modelInstance.addData(item.key, itemVal);
              });
            }
            break;
          case "postgres":
            modelInstance = new PostgresModel(n.id, labelStr);
            if (Array.isArray(config.data)) {
              config.data.forEach((item: any) => {
                const itemVal =
                  item.value !== undefined
                    ? item.value
                    : item.val !== undefined
                      ? item.val
                      : "record data";
                if (item.key) {
                  modelInstance.addRecord(
                    config.table || "users",
                    item.key,
                    itemVal,
                  );
                }
              });
            }
            break;
          case "api-gateway":
            modelInstance = new ApiGatewayModel(n.id, labelStr);
            modelInstance.strategy = config.strategy || "ROUND_ROBIN";
            if (config.routes) {
              modelInstance.setRoutes(config.routes);
            }

            // Dynamic routing node target registration (supports Server and Load Balancer targets)
            const connectedTargets = activeEdges
              .filter((e) => {
                const isSourceGateway = e.source === n.id;
                const isTargetGateway = e.target === n.id;
                if (isSourceGateway) {
                  const targetNode = activeNodes.find(
                    (node) => node.id === e.target,
                  );
                  return (
                    targetNode?.data.type === "server" ||
                    targetNode?.data.type === "load-balancer"
                  );
                }
                if (isTargetGateway) {
                  const sourceNode = activeNodes.find(
                    (node) => node.id === e.source,
                  );
                  return (
                    sourceNode?.data.type === "server" ||
                    sourceNode?.data.type === "load-balancer"
                  );
                }
                return false;
              })
              .map((e) => (e.source === n.id ? e.target : e.source));

            const serviceMapping = config.serviceMapping || {};
            const serviceGroups: Record<string, string[]> = {};
            const routesList = config.routes || {};
            const serviceOptions = Array.from(
              new Set(Object.values(routesList)),
            );

            connectedTargets.forEach((targetId) => {
              const targetNode = activeNodes.find(
                (node) => node.id === targetId,
              );
              const targetLabel = String(targetNode?.data.label || targetId);
              let serviceName = serviceMapping[targetId];

              if (!serviceName) {
                // If routes list explicitly targets this targetId directly (e.g. target: lb1 or target: s1)
                const routeTargets = Object.values(routesList).map(String);
                if (routeTargets.includes(targetId)) {
                  serviceName = targetId;
                } else {
                  const labelLower = targetLabel.toLowerCase();
                  if (labelLower.includes("user")) {
                    serviceName = "USER_SERVICE";
                  } else if (labelLower.includes("post")) {
                    serviceName = "POST_SERVICE";
                  } else {
                    serviceName =
                      serviceOptions[0] !== undefined
                        ? String(serviceOptions[0])
                        : targetId;
                  }
                }
              }

              if (serviceName !== "UNASSIGNED") {
                if (!serviceGroups[serviceName]) {
                  serviceGroups[serviceName] = [];
                }
                if (!serviceGroups[serviceName].includes(targetId)) {
                  serviceGroups[serviceName].push(targetId);
                }
              }
            });

            // Fallback: Ensure all target keys/names specified in routes exist in serviceGroups
            Object.values(routesList).forEach((targetName: any) => {
              const targetStr = String(targetName);
              if (!serviceGroups[targetStr]) {
                const isTargetNode = activeNodes.some(
                  (node) =>
                    node.id === targetStr &&
                    (node.data.type === "server" ||
                      node.data.type === "load-balancer"),
                );
                if (isTargetNode) {
                  serviceGroups[targetStr] = [targetStr];
                }
              }
            });

            // Register service groups with gateway
            for (const serviceName in serviceGroups) {
              modelInstance.setServiceNodes(
                serviceName,
                serviceGroups[serviceName],
              );
            }
            break;
          case "storage":
            modelInstance = new StorageModel(n.id, labelStr);
            if (Array.isArray(config.buckets)) {
              config.buckets.forEach((b: string) => modelInstance.addBucket(b));
            }
            break;
          case "dns":
            modelInstance = new DnsModel(n.id, labelStr);
            if (config.domains) {
              Object.entries(config.domains).forEach(
                ([domain, subdomains]: [string, any]) => {
                  modelInstance.addDomain(domain);
                  if (subdomains && typeof subdomains === "object") {
                    Object.entries(subdomains).forEach(
                      ([sub, subData]: [string, any]) => {
                        if (subData && typeof subData === "object") {
                          modelInstance.addSubDomain(
                            domain,
                            sub,
                            subData.to || "",
                            subData.ip || "",
                            subData.typeOfRecord || "A",
                          );
                        }
                      },
                    );
                  }
                },
              );
            }
            break;
          case "cdn":
            modelInstance = new CdnModel(n.id, labelStr);
            if (config.originId) {
              modelInstance.setOriginId(config.originId);
            }
            if (Array.isArray(config.cache)) {
              config.cache.forEach((item: string) =>
                modelInstance.cacheData(item),
              );
            }
            break;
          case "message-queue":
            modelInstance = new MessageQueueModel(
              n.id,
              labelStr,
              config.processingType || "FIFO",
              typeof config.queueSize === "number" ? config.queueSize : 10,
              config.overflowBehavior || "REJECT",
            );
            break;
          case "pubsub":
            modelInstance = new PubSubModel(n.id, labelStr);
            break;
        }

        if (modelInstance) {
          graph.addNode(n.id, labelStr);
          registry.register(n.id, modelInstance);
        }
      });

      // Wire up Server TCP Connection Pools to Postgres
      activeNodes.forEach((n) => {
        if (n.data.type === "server") {
          const serverInstance = registry.getInstance(n.id) as ServerModel;
          const config =
            activeConfigs[n.id] ||
            createDefaultConfig("server", n.id, (n.data.label as string) || "");
          const tcpConns =
            typeof config.tcpConnections === "number"
              ? config.tcpConnections
              : 10;

          // Find if there is an edge between this server and any postgres node
          const connectedPostgresEdges = activeEdges.filter((e) => {
            if (e.source === n.id) {
              const targetNode = activeNodes.find(
                (node) => node.id === e.target,
              );
              return targetNode?.data.type === "postgres";
            }
            if (e.target === n.id) {
              const sourceNode = activeNodes.find(
                (node) => node.id === e.source,
              );
              return sourceNode?.data.type === "postgres";
            }
            return false;
          });

          connectedPostgresEdges.forEach((edge) => {
            const targetId = edge.source === n.id ? edge.target : edge.source;
            const postgresInstance = registry.getInstance(
              targetId,
            ) as PostgresModel;
            if (postgresInstance && serverInstance) {
              serverInstance.addPostgresConnectionPool(
                tcpConns,
                postgresInstance,
              );
            }
          });

          // Find if there is an edge between this server and any message-queue node
          const connectedQueueEdges = activeEdges.filter((e) => {
            if (e.source === n.id) {
              const targetNode = activeNodes.find(
                (node) => node.id === e.target,
              );
              return targetNode?.data.type === "message-queue";
            }
            if (e.target === n.id) {
              const sourceNode = activeNodes.find(
                (node) => node.id === e.source,
              );
              return sourceNode?.data.type === "message-queue";
            }
            return false;
          });

          connectedQueueEdges.forEach((edge) => {
            const isProducer = edge.source === n.id;
            const queueId = isProducer ? edge.target : edge.source;
            const queueNode = activeNodes.find((node) => node.id === queueId);
            const queueLabel = String(queueNode?.data.label || queueId);

            if (isProducer) {
              serverInstance.addQueueProducer(queueId, queueLabel);
            } else {
              serverInstance.addQueueConsumer(queueId, queueLabel);
            }
          });

          // Find if there is an edge between this server and any pubsub node
          const connectedPubSubEdges = activeEdges.filter((e) => {
            if (e.source === n.id) {
              const targetNode = activeNodes.find(
                (node) => node.id === e.target,
              );
              return targetNode?.data.type === "pubsub";
            }
            if (e.target === n.id) {
              const sourceNode = activeNodes.find(
                (node) => node.id === e.source,
              );
              return sourceNode?.data.type === "pubsub";
            }
            return false;
          });

          connectedPubSubEdges.forEach((edge) => {
            const isProducer = edge.source === n.id;
            const pubSubId = isProducer ? edge.target : edge.source;
            if (!isProducer) {
              // It's a subscriber/consumer server. Register subscription topic.
              const pubSubInstance = registry.getInstance(
                pubSubId,
              ) as PubSubModel;
              if (pubSubInstance) {
                const subTopicsArray =
                  config.registeredTopics || config.subscriptionTopics;
                if (Array.isArray(subTopicsArray)) {
                  subTopicsArray.forEach((topic: string) => {
                    if (topic && topic.trim().length > 0) {
                      pubSubInstance.subscribe(topic.trim(), n.id);
                    }
                  });
                } else {
                  const subTopicsStr =
                    (config.registeredTopics as string) ||
                    (config.subscriptionTopic as string) ||
                    "order.created";
                  const subTopics = subTopicsStr
                    .split(",")
                    .map((t: string) => t.trim())
                    .filter((t: string) => t.length > 0);

                  subTopics.forEach((topic: string) => {
                    pubSubInstance.subscribe(topic, n.id);
                  });
                }
              }
            }
          });
        }
      });

      // 4. Register edges
      activeEdges.forEach((edge) => {
        const sourceNode = activeNodes.find((n) => n.id === edge.source);
        const targetNode = activeNodes.find((n) => n.id === edge.target);
        if (sourceNode && targetNode) {
          graph.addEdge(edge.source, edge.target);

          // Bidirectional routing fallback for gateway -> server in graph
          if (
            sourceNode.data.type === "server" &&
            targetNode.data.type === "api-gateway"
          ) {
            graph.addEdge(edge.target, edge.source);
          }
        }
      });

      // 5. Check cycles or validations
      const hasCycle = graph.detectCycle(registry);
      if (hasCycle) {
        setValidationWarning(
          "Warning: Cycle detected in graph! Simulation may behave unexpectedly or hang.",
        );
      }

      // Pre-flight route and pipeline validation
      const pipelineValidation = validateEndpointPipelines(activeNodes, activeEdges, activeConfigs);
      if (!pipelineValidation.isValid) {
        const warningMsg = pipelineValidation.errors.map((e) => e.message).join(" ");
        setValidationWarning(warningMsg);
      }

      // 6. Run sequential request queries
      const clientLabelStr = (clientToRun.data.label as string) || "";
      const clientConfig =
        activeConfigs[clientId] ||
        createDefaultConfig("client", clientId, clientLabelStr);

      const allFrames: any[] = [];

      const clientRequests = clientConfig.requests || [
        {
          endpoint: clientConfig.endpoint || "/api/v1/posts",
          method: clientConfig.method || "GET",
          lookupKey: clientConfig.lookupKey || "rohan",
          fileName: clientConfig.fileName || "file.png",
          isThereFileToUpload: clientConfig.isThereFileToUpload !== false,
        },
      ];

      setTimeout(() => {
        try {
          // Clear active states on Postgres and Server models
          activeNodes.forEach((n) => {
            if (n.data.type === "postgres") {
              const pg = registry.getInstance(n.id) as PostgresModel;
              if (pg) {
                pg.activeConnections.clear();
                pg.connectionIntervals = [];
              }
            }
            if (n.data.type === "server") {
              const server = registry.getInstance(n.id) as ServerModel;
              if (server) {
                server.activeQueueMessages = 0;
                server.queueProcessingIntervals = [];
              }
            }
          });

          for (let i = 0; i < clientRequests.length; i++) {
            const sourceIp = ipv4Instance.getRandomIpv4();
            const reqItem = clientRequests[i];

            let parsedBody = {};
            if (
              typeof reqItem.body === "string" &&
              reqItem.body.trim().length > 0
            ) {
              try {
                parsedBody = JSON.parse(reqItem.body);
              } catch (err) {
                console.error("Failed to parse request body JSON:", err);
              }
            }

            const payload: any = {
              valetKeyFlow: clientConfig.valetKeyFlow,
              lookupKey: reqItem.lookupKey,
              fileName: reqItem.fileName,
              isThereFileToUpload: reqItem.isThereFileToUpload,
              endpoint: reqItem.endpoint,
              method: reqItem.method || "GET",
              targetBucket: reqItem.targetBucket,
              parallelResponse,
              ...parsedBody,
            };

            const simulation = new SimulationManager(
              graph,
              registry,
              payload,
              sourceIp,
            );
            simulation.runSimulation(clientId);

            const runFrames = (simulation.getFrames() as any[]).map(
              (frame) => ({
                ...frame,
                sourceIp,
                payloadSummary:
                  frame.payloadSummary || `lookupKey=${reqItem.lookupKey}`,
              }),
            );

            allFrames.push({
              runIndex: i,
              frames: runFrames,
            });
          }

          setRawSimulationFrames(allFrames);
          if (executionMode === "instant") {
            const totalHops = allFrames.reduce(
              (acc, run) => acc + (run.frames?.length || 0),
              0,
            );
            setFrameIndex(Math.max(0, totalHops - 1));
            setIsPlaying(false);
            setIsCompilingSimulation(false);
            setDebugEnabled(true);
            setSuccessToast(`Instant Trace: ${totalHops} hops analyzed.`);
          } else {
            setFrameIndex(0);
            setIsPlaying(true);
            setIsCompilingSimulation(false);
          }
        } catch (err: any) {
          setValidationWarning(`Simulation Error: ${err.message || err}`);
          setIsCompilingSimulation(false);
        }
      }, 10);
    },
    [nodes, nodeConfigs, edges, executionMode],
  );

  // Compile & Execute DSL script from Monaco Editor
  const handleRunDSL = useCallback(() => {
    try {
      if (!dslCode || dslCode.trim().length === 0) {
        setValidationWarning("DSL code is empty.");
        return;
      }
      const output = compileDSL(dslCode);
      if (!output.nodes || output.nodes.length === 0) {
        setValidationWarning("No nodes generated from DSL.");
        return;
      }

      setNodes(output.nodes);
      setEdges(output.edges);
      setNodeConfigs(output.nodeConfigs);
      setValidationWarning(null);
      setSuccessToast("DSL compiled & architecture generated!");

      const firstClient = output.nodes.find(
        (n: any) => n.data?.type === "client",
      );
      if (firstClient) {
        handleStartSimulation(
          firstClient.id,
          output.nodes,
          output.edges,
          output.nodeConfigs,
        );
      }
    } catch (err: any) {
      setValidationWarning(`DSL Compilation Error: ${err.message || err}`);
    }
  }, [dslCode, setNodes, setEdges, setNodeConfigs, handleStartSimulation]);

  // Register custom .flow language, syntax highlighter, autocompletion & bracket pairs for Monaco Editor
  const handleEditorWillMount = useCallback((monaco: any) => {
    if (
      !monaco.languages.getLanguages().some((lang: any) => lang.id === "flow")
    ) {
      monaco.languages.register({ id: "flow" });

      // Auto-closing brackets & quotes configuration
      monaco.languages.setLanguageConfiguration("flow", {
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
        surroundingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
      });

      // Syntax tokens classification
      monaco.languages.setMonarchTokensProvider("flow", {
        keywords: [
          "define",
          "connect",
          "CONNECT",
          "client",
          "server",
          "loadbalancer",
          "gateway",
          "pubsub",
          "postgres",
          "redis",
          "messagequeue",
          "CLIENT",
          "SERVER",
          "LOADBALANCER",
          "GATEWAY",
          "PUBSUB",
          "POSTGRES",
          "REDIS",
          "MESSAGEQUEUE",
          "true",
          "false",
        ],
        tokenizer: {
          root: [
            [
              /[a-zA-Z_]\w*/,
              { cases: { "@keywords": "keyword", "@default": "identifier" } },
            ],
            [/[{}()\[\]]/, "@brackets"],
            [/->/, "operator.special"],
            [/[:]/, "delimiter"],
            [/\d+/, "number"],
            [/"([^"\\]|\\.)*"/, "string"],
            [/'([^'\\]|\\.)*'/, "string"],
            [/\/\/.*$/, "comment"],
          ],
        },
      });

      monaco.editor.defineTheme("flow-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "C586C0", fontStyle: "bold" },
          { token: "identifier", foreground: "9CDCFE" },
          { token: "string", foreground: "CE9178" },
          { token: "number", foreground: "B5CEA8" },
          {
            token: "operator.special",
            foreground: "569CD6",
            fontStyle: "bold",
          },
          { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        ],
        colors: {
          "editor.background": "#1e1e1e",
        },
      });

      monaco.editor.defineTheme("flow-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "AF00DB", fontStyle: "bold" },
          { token: "identifier", foreground: "001080" },
          { token: "string", foreground: "A31515" },
          { token: "number", foreground: "098658" },
          {
            token: "operator.special",
            foreground: "0000FF",
            fontStyle: "bold",
          },
          { token: "comment", foreground: "008000", fontStyle: "italic" },
        ],
        colors: {
          "editor.background": "#f8fafc",
        },
      });
    }
  }, []);

  // Quick Load Template
  const loadTemplate = useCallback(
    (templateKey: keyof typeof TEMPLATES) => {
      const template = TEMPLATES[templateKey];

      // Choose connection colors dynamically based on theme (handled in animatedEdges)
      const defaultInactiveStroke = "#475569";

      const templateNodes = template.nodes.map((n) => ({
        ...n,
        style: {
          borderRadius: "8px",
        },
      }));
      setNodes(templateNodes);

      const templateEdges = template.edges.map((e) => ({
        ...e,
        markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
        style: { stroke: defaultInactiveStroke, strokeWidth: 1.8 },
      }));
      setEdges(templateEdges);

      // Seed configurations
      const configs: Record<string, any> = {};
      template.nodes.forEach((n) => {
        const defaultConfig = createDefaultConfig(
          n.data.type as ComponentType,
          n.id,
          n.data.label,
        );
        if (templateKey === "valetKey" && n.data.type === "client") {
          defaultConfig.valetKeyFlow = true;
        }
        configs[n.id] = defaultConfig;
      });
      setNodeConfigs(configs);

      // Stop and Reset playback - do NOT auto-run simulation on template load
      setIsPlaying(false);
      setRawSimulationFrames([]);
      setFrameIndex(0);
      setValidationWarning(null);
      setSelectedNodeId(null);

      // Sync corresponding DSL code into editor state if preset exists
      const matchingDsl = DSL_PRESETS[templateKey as keyof typeof DSL_PRESETS];
      if (matchingDsl) {
        setDslCode(matchingDsl.code);
      }

      // Center the loaded template on the canvas
      setTimeout(() => {
        fitView({ duration: 400 });
      }, 80);
    },
    [setNodes, setEdges, fitView],
  );

  const loadStarterTemplate = useCallback(
    (templateId: string) => {
      const architecture = getTemplateArchitecture(templateId);
      if (architecture.nodes.length === 0) {
        setValidationWarning(`Unable to load template: ${templateId}`);
        return;
      }

      setNodes(architecture.nodes);
      setEdges(
        architecture.edges.map((edge) => ({
          ...edge,
          markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
          style: { stroke: "#475569", strokeWidth: 1.8 },
        })),
      );
      setNodeConfigs(architecture.configs);
      setIsPlaying(false);
      setRawSimulationFrames([]);
      setFrameIndex(0);
      setSelectedNodeId(null);
      setValidationWarning(null);
      setTimeout(() => fitView({ duration: 400 }), 80);
    },
    [fitView, setEdges, setNodes],
  );

  // Open template selection picker modal ONLY on standalone sandbox load (not inside workspace diagrams or share view)
  useEffect(() => {
    if (!workspaceId && !diagramId && !shareId) {
      setShowWelcomeModal(true);
    } else {
      setShowWelcomeModal(false);
    }
  }, [workspaceId, diagramId, shareId]);

  // Add Component to Canvas — used both by click and drag-drop
  const addComponent = useCallback(
    (type: ComponentType, position?: { x: number; y: number }) => {
      const id = `${type}-${uid.rnd()}`;
      const label = `${COMPONENTS_LIBRARY.find((c) => c.type === type)?.label} ${nodes.filter((n) => n.data.type === type).length + 1}`;

      const newNode: Node = {
        id,
        type: "customNode",
        position: position ?? {
          x: 120 + Math.random() * 250,
          y: 80 + Math.random() * 200,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label,
          type,
          isActive: false,
          flavor: getDefaultFlavor(type),
        },
      };

      setNodes((nds) => [...nds, newNode]);
      setNodeConfigs((prev) => ({
        ...prev,
        [id]: createDefaultConfig(type, id, label),
      }));
      setSelectedNodeId(id);
    },
    [nodes, uid, setNodes, setNodeConfigs],
  );

  // Drag from sidebar handlers
  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData("application/flowframe-type", type);
    e.dataTransfer.effectAllowed = "copy";
    setDraggingType(type);
    setHoveredComponent(null);
  };

  // Add Shape / Frame Node to canvas — sits behind regular nodes as a group container
  const addShape = useCallback(
    (shapeId: string, position?: { x: number; y: number }) => {
      const shapeDef = SHAPES_LIBRARY.find((s) => s.id === shapeId);
      const id = `shape-${shapeId}-${uid.rnd()}`;
      const isText = shapeId === "text";
      const isCompact =
        shapeId === "circle" || shapeId === "diamond" || shapeId === "triangle";
      // Pick a random color from presets for new frames
      const defaultColor =
        FRAME_COLOR_PRESETS[
          Math.floor(Math.random() * FRAME_COLOR_PRESETS.length)
        ].color;

      const newNode = {
        id,
        type: "shapeNode",
        position: position ?? {
          x: 80 + Math.random() * 200,
          y: 60 + Math.random() * 150,
        },
        zIndex: -1, // ← render behind all other nodes
        data: {
          shapeId,
          label: "", // Always default to empty label so shape remains pure unless renamed by user
          color: defaultColor,
        },
        style: {
          // Frames are large by default so nodes fit inside
          width: isText ? 130 : isCompact ? 140 : 320,
          height: isText ? 36 : isCompact ? 140 : 220,
          zIndex: -1,
        },
      };
      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(id);
    },
    [uid, setNodes, setSelectedNodeId],
  );

  const handleShapeDragStart = (e: React.DragEvent, shapeId: string) => {
    e.dataTransfer.setData("application/flowframe-shape", shapeId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDragEnd = () => {
    setDraggingType(null);
    setIsDragOverCanvas(false);
  };

  // Drop onto canvas handlers
  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOverCanvas(true);
  };

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the canvas wrapper itself
    if (!e.currentTarget.contains(e.relatedTarget as Element)) {
      setIsDragOverCanvas(false);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverCanvas(false);
    setDraggingType(null);

    // Convert screen coordinates to canvas-space using ReactFlow's utility
    const canvasPosition = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    // Check for shape drops first
    const shapeId = e.dataTransfer.getData("application/flowframe-shape");
    if (shapeId) {
      addShape(shapeId, canvasPosition);
      return;
    }

    const type = e.dataTransfer.getData(
      "application/flowframe-type",
    ) as ComponentType;
    if (!type) return;

    addComponent(type, canvasPosition);
  };

  // Connect Edges
  const onConnect = useCallback(
    (connection: any) => {
      const inactiveStrokeColor = theme === "dark" ? "#475569" : "#cbd5e1";
      const sourceHandleId = connection.sourceHandle || "right";
      const targetHandleId = connection.targetHandle || "left";
      const newEdge = {
        ...connection,
        id: `${connection.source}-${sourceHandleId}->${connection.target}-${targetHandleId}`,
        type: "packet",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#60a5fa" },
        style: { stroke: inactiveStrokeColor, strokeWidth: 1.8 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, theme],
  );

  // Selected Node Reference
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  // Update Config Helper
  const updateNodeConfig = (nodeId: string, updatedFields: Partial<any>) => {
    setNodeConfigs((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        ...updatedFields,
      },
    }));
  };

  // Dynamically calculate and sort frames based on parallelResponse and hideResponse states!
  const simulationFrames = useMemo(() => {
    if (rawSimulationFrames.length === 0) return [];

    let globalTimestampOffset = 0;
    const flatFrames: any[] = [];

    rawSimulationFrames.forEach((run) => {
      const runFrames = run.frames.map((frame: any) => ({
        ...frame,
        timestamp: parallelResponse
          ? frame.timestamp
          : frame.timestamp + globalTimestampOffset,
      }));

      flatFrames.push(...runFrames);

      if (!parallelResponse) {
        const maxTime =
          run.frames.length > 0
            ? Math.max(...run.frames.map((f: any) => f.timestamp))
            : -1;
        globalTimestampOffset += maxTime + 1;
      }
    });

    // Merge parallel frames if parallel is checked
    const framesToRender = parallelResponse
      ? (() => {
          const pq = new PriorityQueue();
          pq.pushMultipleIntoQueue(flatFrames);

          const merged: any[] = [];
          while (!pq.isEmpty()) {
            const item = pq.popMinTimeStampItem();
            if (item) merged.push(item);
          }
          return merged;
        })()
      : flatFrames.sort((a, b) => a.timestamp - b.timestamp);

    // Filter hide response frames if hideResponse is checked
    return framesToRender.filter((frame) =>
      shouldKeepFrame(hideResponse, frame),
    );
  }, [rawSimulationFrames, parallelResponse, hideResponse]);

  // Group frames by timestamp
  const frameGroups = useMemo(() => {
    const grouped = new Map<number, any[]>();
    for (const frame of simulationFrames) {
      const list = grouped.get(frame.timestamp) ?? [];
      list.push(frame);
      grouped.set(frame.timestamp, list);
    }
    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([timestamp, frames]) => ({ timestamp, frames }));
  }, [simulationFrames]);

  const currentFrameGroup = frameGroups[frameIndex] ?? null;
  const currentFrames = currentFrameGroup?.frames ?? [];

  const accumulatedFrames = useMemo(() => {
    const acc: any[] = [];
    for (let i = 0; i <= frameIndex; i++) {
      if (frameGroups[i]) {
        acc.push(...frameGroups[i].frames);
      }
    }
    return acc;
  }, [frameGroups, frameIndex]);

  // System Metrics Hook to analyze simulation health in real-time
  const systemMetrics = useMemo(() => {
    if (simulationFrames.length === 0) return null;

    const currentTick = currentFrameGroup?.timestamp ?? 0;
    const requestStats = new Map<
      string,
      {
        start: number;
        end: number;
        label: string;
        key: string;
        isWaiting: boolean;
        hasError: boolean;
        errorMsg?: string;
        hasWarning: boolean;
        warningMsg?: string;
      }
    >();

    simulationFrames.forEach((f) => {
      const existing = requestStats.get(f.requestId);
      const isWait = f.action === "POSTGRES_POOL_WAIT";
      const isError =
        f.action === "POSTGRES_CONNECTION_ERROR" ||
        f.action.includes("REJECT") ||
        f.action.includes("RESPONSE_ERROR");
      const isWarning =
        f.action.includes("CACHE_MISS") || f.action.includes("QUERY_MISS");

      if (!existing) {
        requestStats.set(f.requestId, {
          start: f.timestamp,
          end: f.timestamp,
          label: f.requestName || `Req-${f.requestId.slice(0, 4)}`,
          key: f.lookupKey || "",
          isWaiting: isWait,
          hasError: isError,
          errorMsg: isError ? f.payloadSummary : undefined,
          hasWarning: isWarning,
          warningMsg: isWarning
            ? f.action.includes("CACHE_MISS")
              ? "Cache Miss"
              : "Query Miss"
            : undefined,
        });
      } else {
        existing.end = Math.max(existing.end, f.timestamp);
        if (f.timestamp === currentTick) {
          existing.isWaiting = isWait;
          if (isError) {
            existing.hasError = true;
            existing.errorMsg = f.payloadSummary;
          }
          if (isWarning) {
            existing.hasWarning = true;
            existing.warningMsg = f.action.includes("CACHE_MISS")
              ? "Cache Miss"
              : "Query Miss";
          }
        }
      }
    });

    let activeCount = 0;
    let completedCount = 0;
    let pendingCount = 0;
    const queuedRequests: string[] = [];
    const activeRequestsList: string[] = [];
    const errorRequests: string[] = [];
    const warningRequests: string[] = [];

    requestStats.forEach((stats) => {
      if (currentTick >= stats.start && currentTick <= stats.end) {
        activeCount++;
        activeRequestsList.push(
          `${stats.label}${stats.key ? ` (Key: ${stats.key})` : ""}`,
        );

        if (stats.isWaiting) {
          pendingCount++;
          queuedRequests.push(
            `${stats.label}${stats.key ? ` (Key: ${stats.key})` : ""}`,
          );
        }
        if (stats.hasError) {
          errorRequests.push(
            `${stats.label}: ${stats.errorMsg || "Error occurred"}`,
          );
        }
        if (stats.hasWarning && !stats.hasError) {
          warningRequests.push(
            `${stats.label}: ${stats.warningMsg || "Warning occurred"}`,
          );
        }
      } else if (currentTick > stats.end) {
        completedCount++;
      }
    });

    return {
      totalRequests: requestStats.size,
      activeCount,
      completedCount,
      pendingCount,
      activeRequestsList,
      queuedRequests,
      errorRequests,
      warningRequests,
      currentTick,
    };
  }, [simulationFrames, currentFrameGroup]);

  // Dynamically calculate storage files at the current frame index!
  const storageFilesByBucket = useMemo(() => {
    const filesMap: Record<
      string,
      Record<string, Array<{ name: string; info: any }>>
    > = {};

    // 1. Initialize empty buckets for all storage nodes
    nodes.forEach((n) => {
      if (n.data.type === "storage") {
        const config = nodeConfigs[n.id] || {};
        const buckets = config.buckets || ["media-uploads"];
        const filesByBucket: Record<
          string,
          Array<{ name: string; info: any }>
        > = {};
        buckets.forEach((b: string) => {
          filesByBucket[b] = [];
        });
        filesMap[n.id] = filesByBucket;
      }
    });

    // 2. Replay all accumulated frames to add files at their actual trigger timestamps
    accumulatedFrames.forEach((frame) => {
      // Find if this frame involves a storage node
      const fromNode = nodes.find((n) => n.id === frame.from);
      const toNode = nodes.find((n) => n.id === frame.to);

      let storageId: string | null = null;
      if (fromNode?.data.type === "storage") {
        storageId = fromNode.id;
      } else if (toNode?.data.type === "storage") {
        storageId = toNode.id;
      }

      if (storageId && frame.storageBucket && frame.storageFileName) {
        const bucketMap = filesMap[storageId];
        if (bucketMap) {
          // Ensure the bucket list exists
          if (!bucketMap[frame.storageBucket]) {
            bucketMap[frame.storageBucket] = [];
          }

          // Check if file is already added in this bucket for this storage node
          const fileExists = bucketMap[frame.storageBucket].some(
            (f) => f.name === frame.storageFileName,
          );

          if (!fileExists) {
            bucketMap[frame.storageBucket].push({
              name: frame.storageFileName,
              info: {
                sourceIp: frame.sourceIp,
                requestId: frame.requestId,
              },
            });
          }
        }
      }
    });

    return filesMap;
  }, [nodes, nodeConfigs, accumulatedFrames]);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying || frameGroups.length === 0) return;

    const baseInterval = 1000;
    const interval = baseInterval / speed;

    const timerId = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev >= frameGroups.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, interval);

    return () => clearInterval(timerId);
  }, [isPlaying, frameGroups.length, speed]);

  // Reset frame index if filters change
  useEffect(() => {
    setFrameIndex(0);
  }, [hideResponse, parallelResponse]);

  // Node highlight style mapping
  const styledNodes = useMemo(() => {
    return nodes.map((node) => {
      const isSelected = node.id === selectedNodeId;
      const isActive = currentFrames.some(
        (f) => f.from === node.id || f.to === node.id,
      );
      const isShape = node.type === "shapeNode";

      return {
        ...node,
        type: isShape ? "shapeNode" : "customNode",
        selected: isSelected,
        style: isShape ? { ...node.style, zIndex: -1 } : undefined,
        data: {
          ...node.data,
          isActive,
        },
      };
    });
  }, [nodes, selectedNodeId, currentFrames]);

  // Edge animation speed and high visibility theme-based styling
  const animatedEdges = useMemo(() => {
    const inactiveStroke = theme === "dark" ? "#475569" : "#cbd5e1";

    if (currentFrames.length === 0) {
      return edges.map((edge) => ({
        ...edge,
        style: {
          stroke: inactiveStroke,
          strokeWidth: 1.8,
        },
        data: { active: false },
      }));
    }

    const edgeState = new Map<
      string,
      { reverseMotion: boolean; packetCount: number }
    >();

    for (const frame of currentFrames) {
      // Find all edges that match this transmission step
      const directEdge = edges.find(
        (e) => e.source === frame.from && e.target === frame.to,
      );
      const reverseEdge = edges.find(
        (e) => e.source === frame.to && e.target === frame.from,
      );

      if (directEdge) {
        const resolvedEdgeId = directEdge.id;
        const previous = edgeState.get(resolvedEdgeId);
        if (!previous) {
          edgeState.set(resolvedEdgeId, {
            reverseMotion: false,
            packetCount: 1,
          });
        } else {
          edgeState.set(resolvedEdgeId, {
            reverseMotion: previous.reverseMotion,
            packetCount: previous.packetCount + 1,
          });
        }
      } else if (reverseEdge) {
        const resolvedEdgeId = reverseEdge.id;
        const previous = edgeState.get(resolvedEdgeId);
        if (!previous) {
          edgeState.set(resolvedEdgeId, {
            reverseMotion: true,
            packetCount: 1,
          });
        } else {
          edgeState.set(resolvedEdgeId, {
            reverseMotion: previous.reverseMotion || true,
            packetCount: previous.packetCount + 1,
          });
        }
      }
    }

    return edges.map((edge) => {
      const active = edgeState.has(edge.id);
      const reverseMotion = edgeState.get(edge.id)?.reverseMotion ?? false;
      const speedAdjustedDuration = active ? 1.0 / speed : 1.8 / speed;

      return {
        ...edge,
        data: {
          active,
          reverseMotion,
          packetCount: edgeState.get(edge.id)?.packetCount ?? 1,
          packetDuration: speedAdjustedDuration,
          isPlaying,
          frameIndex,
        },
        style: {
          stroke: active ? packetColor(reverseMotion) : inactiveStroke,
          strokeWidth: active ? 2.5 : 1.8,
        },
      };
    });
  }, [currentFrames, edges, theme, speed, isPlaying, frameIndex]);

  // Click handler to run client node directly
  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      setSelectedNodeId(node.id);
      const resolvedType = node.data?.type || inferWorkspaceNodeType(node);
      if (resolvedType === "client") {
        handleStartSimulation(node.id);
      }
    },
    [handleStartSimulation],
  );

  // Pane click handler to clear selections
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  // Playback control helpers
  const goToPreviousFrame = () => {
    setIsPlaying(false);
    setFrameIndex((prev) =>
      frameGroups.length === 0
        ? 0
        : prev === 0
          ? frameGroups.length - 1
          : prev - 1,
    );
  };

  const goToNextFrame = () => {
    setIsPlaying(false);
    setFrameIndex((prev) => (prev + 1) % Math.max(frameGroups.length, 1));
  };

  const resetPlayback = () => {
    setFrameIndex(0);
    setIsPlaying(false);
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If code editor tab is active or workspace is in Full IDE Editor mode, NEVER intercept any keyboard keys!
      if (workspaceMode === "editor" || sidebarTab === "editor") {
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const targetEl = e.target as HTMLElement | null;

      // Ignore shortcut keys if user is typing in CodeMirror Editor, Monaco, or form inputs
      const isInputFocused =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.tagName === "SELECT" ||
        Boolean(activeEl?.isContentEditable) ||
        Boolean(activeEl?.closest(".cm-editor")) ||
        Boolean(targetEl?.closest(".cm-editor")) ||
        Boolean(activeEl?.closest(".monaco-editor")) ||
        Boolean(targetEl?.closest(".monaco-editor")) ||
        Boolean(document.querySelector(".cm-editor")?.contains(activeEl)) ||
        Boolean(document.querySelector(".cm-editor")?.contains(targetEl));

      if (isInputFocused) {
        return;
      }

      if (e.target === document.body || e.target === document.documentElement) {
        if (e.code === "Space") {
          e.preventDefault();
          setIsPlaying((p) => !p);
        }
        if (e.code === "ArrowLeft") {
          e.preventDefault();
          goToPreviousFrame();
        }
        if (e.code === "ArrowRight") {
          e.preventDefault();
          goToNextFrame();
        }
      }
    };

    // Use bubbling phase (false) so textareas and editors receive keystrokes without interference
    window.addEventListener("keydown", handleKeyDown, false);
    return () => window.removeEventListener("keydown", handleKeyDown, false);
  }, [workspaceMode, sidebarTab, frameGroups.length]);

  // Clear Canvas handler
  const handleClearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setNodeConfigs({});
    setSelectedNodeId(null);
    setRawSimulationFrames([]);
    setFrameIndex(0);
    setIsPlaying(false);
    setValidationWarning(null);
  };

  // Export flow handler
  const handleExportFlow = () => {
    try {
      const exportData = {
        version: "1.0",
        nodes,
        edges,
        nodeConfigs,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `flow-frame-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccessToast("Architecture flow exported successfully!");
    } catch (err: any) {
      setValidationWarning(`Export failed: ${err.message || err}`);
    }
  };

  // Import click trigger
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Import flow handler
  const handleImportFlow = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);

        if (!data || typeof data !== "object") {
          throw new Error("Invalid file format.");
        }
        if (!Array.isArray(data.nodes)) {
          throw new Error("Missing 'nodes' array.");
        }
        if (!Array.isArray(data.edges)) {
          throw new Error("Missing 'edges' array.");
        }

        setIsPlaying(false);
        setFrameIndex(0);
        setRawSimulationFrames([]);
        setSelectedNodeId(null);
        setValidationWarning(null);

        setNodes(data.nodes);
        setEdges(data.edges);
        setNodeConfigs(data.nodeConfigs || {});

        setSuccessToast("Architecture flow imported successfully!");

        setTimeout(() => {
          fitView({ duration: 800 });
        }, 100);
      } catch (err: any) {
        setValidationWarning(
          `Import failed: ${err.message || "Invalid JSON structure."}`,
        );
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  // Share flow handler
  const handleShareFlow = () => {
    // Close the settings dialog before opening the independent share surface.
    setIsSettingsOpen(false);
    setShowShareModal(true);
    setCopiedTemplate(false);
  };

  // Download canvas flow as PNG screenshot
  const downloadCanvasImage = () => {
    const reactFlowElement = document.querySelector(
      ".react-flow",
    ) as HTMLElement;
    if (!reactFlowElement) return;

    toPng(reactFlowElement, {
      backgroundColor: theme === "dark" ? "#020617" : "#ffffff",
      filter: (node) => {
        if (
          node?.classList?.contains("react-flow__controls") ||
          node?.classList?.contains("react-flow__minimap") ||
          node?.classList?.contains("react-flow__panel")
        ) {
          return false;
        }
        return true;
      },
    })
      .then((dataUrl) => {
        const a = document.createElement("a");
        a.setAttribute(
          "download",
          `flow-frame-architecture-${new Date().toISOString().split("T")[0]}.png`,
        );
        a.setAttribute("href", dataUrl);
        a.click();
        setSuccessToast("Architecture image downloaded successfully!");
      })
      .catch((error) => {
        console.error("Failed to download canvas image:", error);
        setValidationWarning(
          `Failed to capture image: ${error.message || error}`,
        );
      });
  };

  return (
    <main className="relative min-h-[100dvh] h-[100dvh] overflow-hidden flex flex-col bg-[var(--bg)]">
      <div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-35" />

      <SiteHeader
        theme={theme}
        onToggleTheme={toggleTheme}
        showHomeLink
        badgeText="Interactive Sandbox Workspace"
        hideSandboxLink={true}
        alwaysGlass={true}
      />

      {/* Workspace Dual Modes: Full IDE Code Editor Mode vs Minimal Canvas Mode */}
      {workspaceMode === "editor" ? (
        <div className="flex-1 w-full min-h-0 flex flex-col relative overflow-hidden bg-[var(--surface)]">
          {/* Top IDE Toolbar */}
          <div className="h-12 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0 select-none gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] px-3 py-1.5 rounded-lg shadow-xs">
                <FiCode className="size-4 text-blue-400" />
                <span className="text-xs font-mono font-bold text-foreground">
                  architecture.flow
                </span>
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono px-1.5 py-0 bg-blue-500/10 text-blue-400 border-blue-500/20"
                >
                  Flow Code
                </Badge>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <span>{nodes.length} Nodes</span>
                <span>·</span>
                <span>{edges.length} Edges</span>
              </div>
            </div>

            {/* Quick Template Presets for DSL */}
            <div className="hidden lg:flex items-center gap-1 bg-[var(--surface-muted)] p-1 rounded-lg border border-[var(--border)] text-xs">
              <span className="text-[10px] uppercase font-mono font-bold px-1.5 text-muted-foreground">
                Presets:
              </span>
              {Object.entries(DSL_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setDslCode(preset.code);
                    setSuccessToast(
                      `Pasted "${preset.label}" code into editor`,
                    );
                  }}
                  className="px-2 py-0.5 rounded text-[11px] font-medium hover:bg-[var(--surface)] text-foreground/75 hover:text-foreground transition cursor-pointer"
                  title={`Paste ${preset.label} architecture DSL into editor (no auto-run)`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Actions: Run, Copy, Switch to Canvas */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleRunDSL}
                className="h-8 px-3 gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer"
                title="Compile DSL script, update architecture, and run simulation"
              >
                <FiPlay className="size-3.5 fill-current" />
                <span>Compile & Run Flow</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(dslCode);
                  setSuccessToast("DSL code copied to clipboard!");
                }}
                className="h-8 px-2.5 gap-1.5 text-xs cursor-pointer"
                title="Copy DSL script"
              >
                <FiCopy className="size-3.5" />
                <span className="hidden sm:inline">Copy</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setWorkspaceMode("canvas")}
                className="h-8 px-3 gap-1.5 text-xs font-semibold cursor-pointer border-primary/30 text-primary hover:bg-primary/10 shadow-xs"
                title="Switch back to interactive visual canvas"
              >
                <FiBox className="size-3.5" />
                <span>Canvas View</span>
              </Button>
            </div>
          </div>

          {/* CodeMirror IDE Editor Surface */}
          <div className="flex-1 flex flex-col min-h-0 relative">
            <div className="flex-1 min-h-0 relative">
              <FlowFrameCodeEditor
                value={dslCode}
                onChange={setDslCode}
                theme={theme === "dark" ? "dark" : "light"}
                onRun={handleRunDSL}
              />
            </div>

            {/* Status / Console Bar */}
            <div className="border-t border-[var(--border)] bg-[var(--surface-muted)]/80 px-4 py-2 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`size-2 rounded-full ${validationWarning ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}
                  />
                  <span className="text-[11px] font-bold text-foreground">
                    {validationWarning ? "Advisory" : "Engine Ready"}
                  </span>
                </div>
                {validationWarning ? (
                  <span className="text-[11px] text-amber-500 truncate max-w-lg">
                    {validationWarning}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground truncate max-w-lg">
                    FlowFrame DSL compiler initialized · Ready for simulation
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-muted-foreground shrink-0">
                <span className="px-1.5 py-0.5 rounded bg-muted border border-border">
                  Ctrl+Enter to compile
                </span>
                <span className="px-1.5 py-0.5 rounded bg-muted border border-border">
                  Tab size: 2
                </span>
                <span className="px-1.5 py-0.5 rounded bg-muted border border-border">
                  UTF-8
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Modern Full-Screen Canvas Workspace with Side-by-Side Shapes Sidebar */
        <div
          className="flex-1 w-full min-h-0 flex flex-row relative overflow-hidden"
          data-resizable-container
        >
          {/* Draw.io / Miro-Style Left Shapes Sidebar */}
          <aside
            className={`flex flex-col z-10 shrink-0 h-full overflow-hidden transition-all duration-300 relative border-r border-[var(--border)] bg-[var(--surface)] ${
              isSidebarFloating
                ? "absolute rounded-2xl shadow-2xl border"
                : "relative"
            } ${"max-md:fixed max-md:top-0 max-md:left-0 max-md:z-30 max-md:w-72 max-md:h-full max-md:shadow-2xl max-md:transition-transform max-md:duration-300"} ${
              isSidebarOpenMobile
                ? "max-md:translate-x-0"
                : "max-md:-translate-x-full"
            }`}
            style={{
              width: isSidebarFloating
                ? 288
                : isSidebarCollapsed
                  ? 56
                  : sidebarWidth,
              left: isSidebarFloating ? sidebarPosition.x : undefined,
              top: isSidebarFloating ? sidebarPosition.y : undefined,
              height: isSidebarFloating ? "calc(100vh - 160px)" : "100%",
            }}
          >
            {/* Resize Handle (only active in docked mode on desktop when expanded) */}
            {!isSidebarFloating && !isSidebarCollapsed && (
              <div
                onMouseDown={handleResizeMouseDown}
                className="absolute right-0 top-0 bottom-0 w-1 hover:w-2 bg-transparent hover:bg-[var(--accent)]/25 cursor-col-resize transition-all z-20 max-md:hidden"
              />
            )}

            {isSidebarCollapsed ? (
              /* Collapsed Vertical Tool Rail (56px / w-14) */
              <div className="flex-1 flex flex-col items-center justify-between py-3 px-1 w-full bg-[var(--surface)] select-none">
                <div className="flex flex-col items-center gap-2.5 w-full">
                  {/* Expand Button */}
                  <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="p-2 rounded-xl text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition cursor-pointer"
                    title="Expand Shapes Sidebar"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>

                  <div className="w-8 h-px bg-[var(--border)]" />

                  {/* Library tab button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarTab("library");
                      setIsSidebarCollapsed(false);
                    }}
                    className={`p-2.5 rounded-xl transition cursor-pointer ${
                      sidebarTab === "library"
                        ? "bg-[var(--accent)]/15 text-[color:var(--accent)]"
                        : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)]"
                    }`}
                    title="Component & Shape Library"
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>

                  {/* Code Editor tab button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarTab("editor");
                      setIsSidebarCollapsed(false);
                    }}
                    className={`p-2.5 rounded-xl transition cursor-pointer ${
                      sidebarTab === "editor"
                        ? "bg-[var(--accent)]/15 text-[color:var(--accent)]"
                        : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)]"
                    }`}
                    title="Monaco Architecture DSL Editor"
                  >
                    <FiCode className="w-4 h-4" />
                  </button>

                  {/* Architecture Templates button */}
                  <button
                    type="button"
                    onClick={() => setShowWelcomeModal(true)}
                    className="p-2.5 rounded-xl text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition cursor-pointer"
                    title="Architecture Templates"
                  >
                    <FiFolder className="w-4 h-4" />
                  </button>
                </div>

                {/* Bottom Clear Canvas */}
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="p-2.5 rounded-xl text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  title="Clear Canvas"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Mode Switcher Header: Library vs Monaco Code Editor */}
                <div className="p-2 border-b border-[var(--border)] bg-[var(--surface)] shrink-0 flex items-center gap-1.5">
                  <div className="flex-1 flex items-center gap-1 bg-[var(--surface-muted)] p-1 rounded-xl border border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => setSidebarTab("library")}
                      className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        sidebarTab === "library"
                          ? "bg-[var(--surface)] text-[color:var(--accent)] shadow-sm border border-[var(--border)] font-bold"
                          : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
                      }`}
                    >
                      <FiGrid className="w-3.5 h-3.5" />
                      <span>Library</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSidebarTab("editor")}
                      className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        sidebarTab === "editor"
                          ? "bg-[var(--surface)] text-[color:var(--accent)] shadow-sm border border-[var(--border)] font-bold"
                          : "text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
                      }`}
                    >
                      <FiCode className="w-3.5 h-3.5" />
                      <span>Code Editor</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(true)}
                    className="p-1.5 rounded-lg text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] transition cursor-pointer hidden md:flex"
                    title="Collapse Sidebar"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                </div>

                {sidebarTab === "editor" ? (
                  /* FlowFrame DSL Code Editor Panel in Left Sidebar */
                  <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[var(--background)] p-3 gap-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--foreground)]/70">
                          Flow Editor
                        </span>
                        <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                          DSL
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handleRunDSL}
                          className="rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 py-1 font-bold shadow-xs transition cursor-pointer flex items-center gap-1"
                          title="Compile DSL script and render architecture on canvas"
                        >
                          <FiPlay className="w-3 h-3 fill-current" />
                          <span>Run</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setWorkspaceMode("editor")}
                          className="rounded hover:bg-[var(--surface-muted)] text-[10px] px-2 py-1 border border-[var(--border)] font-semibold text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)] transition cursor-pointer flex items-center gap-1"
                          title="Expand to Full IDE Workspace"
                        >
                          <FiMaximize2 className="w-3 h-3" />
                          <span className="hidden sm:inline">Full IDE</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(dslCode);
                            setSuccessToast("Code copied to clipboard!");
                          }}
                          className="rounded hover:bg-[var(--surface-muted)] text-[10px] px-2 py-1 border border-[var(--border)] font-semibold text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] transition cursor-pointer"
                          title="Copy Code"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => setDslCode("")}
                          className="rounded hover:bg-rose-500/10 text-[10px] px-2 py-1 border border-rose-500/20 font-semibold text-rose-400 transition cursor-pointer"
                          title="Clear Editor"
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Quick Presets Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin shrink-0 text-[10px]">
                      <span className="text-muted-foreground uppercase font-mono font-bold shrink-0">
                        Presets:
                      </span>
                      {Object.entries(DSL_PRESETS).map(([key, preset]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setDslCode(preset.code);
                            setSuccessToast(
                              `Pasted "${preset.label}" code into editor`,
                            );
                          }}
                          className="px-1.5 py-0.5 rounded bg-[var(--surface-muted)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] text-foreground/75 hover:text-foreground shrink-0 transition cursor-pointer text-[10px]"
                          title={`Paste ${preset.label} DSL code into editor`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex-1 w-full h-full min-h-0 rounded-xl overflow-hidden border border-[var(--border)] shadow-inner relative">
                      <FlowFrameCodeEditor
                        value={dslCode}
                        onChange={setDslCode}
                        theme={theme === "dark" ? "dark" : "light"}
                        onRun={handleRunDSL}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Sidebar Title & Search Shape */}
                    <div
                      className={`p-3 border-b border-[var(--border)] flex flex-col gap-2 shrink-0 bg-[var(--surface)] ${
                        isSidebarFloating
                          ? "cursor-grab active:cursor-grabbing select-none"
                          : ""
                      }`}
                      onMouseDown={handleHeaderMouseDown}
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[color:var(--foreground)]/70">
                          Shape Library
                        </h2>
                        <div className="flex items-center gap-1.5">
                          {/* Modern Help Button */}
                          <button
                            type="button"
                            onClick={() => setShowHelpModal(true)}
                            className="rounded hover:bg-[var(--surface-muted)] text-[10px] px-1.5 py-0.5 border border-[var(--border)] font-semibold text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] transition cursor-pointer flex items-center gap-1"
                            title="How to Use Guide"
                          >
                            <svg
                              className="w-3.5 h-3.5 text-violet-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                              <line
                                x1="12"
                                y1="17"
                                x2="12.01"
                                y2="17"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            </svg>
                            <span>Help</span>
                          </button>
                          {/* Dock / Float Toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              setIsSidebarFloating(!isSidebarFloating)
                            }
                            className="rounded hover:bg-[var(--surface-muted)] text-[10px] px-1.5 py-0.5 border border-[var(--border)] font-semibold text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] transition cursor-pointer flex items-center gap-1"
                            title={
                              isSidebarFloating
                                ? "Dock Sidebar"
                                : "Float Sidebar"
                            }
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              <path d="M12 2v20M17 5H7" />
                            </svg>
                            <span>{isSidebarFloating ? "Dock" : "Float"}</span>
                          </button>
                          {/* Mobile Close Button */}
                          <button
                            type="button"
                            onClick={() => setIsSidebarOpenMobile(false)}
                            className="md:hidden rounded-full hover:bg-[var(--surface-muted)] text-xs font-bold h-6 w-6 flex items-center justify-center border border-[var(--border)] text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] cursor-pointer"
                            title="Close Sidebar"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                          <svg
                            className="w-3.5 h-3.5 text-[color:var(--foreground)]/40"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Type to search shapes..."
                          className="w-full pl-8 pr-7 py-1.5 bg-[var(--surface-muted)]/70 hover:bg-[var(--surface-muted)] focus:bg-[var(--surface)] text-xs text-[color:var(--foreground)] placeholder-[color:var(--foreground)]/40 border border-[var(--border)] rounded-lg outline-none focus:border-violet-500/80 transition-all duration-150"
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-xs text-[color:var(--foreground)]/40 hover:text-[color:var(--foreground)] font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Collapsible Accordion Lists */}
                    <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-2">
                      {/* 1. Templates Section */}
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() =>
                            setIsTemplatesExpanded(!isTemplatesExpanded)
                          }
                          className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--surface-muted)] transition duration-150 text-left font-semibold cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FiChevronRight
                              className={`w-3 h-3 text-[color:var(--foreground)]/60 transform transition-transform duration-200 ${isTemplatesExpanded ? "rotate-90" : "rotate-0"}`}
                            />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--foreground)]/70">
                              Templates
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsTemplateBrowserOpen(true);
                              }}
                              className="text-[10px] font-medium text-primary hover:underline px-1 py-0.5 cursor-pointer"
                              title="Browse all templates"
                            >
                              Browse
                            </span>
                            <span className="text-[9px] text-[color:var(--foreground)]/40 bg-[var(--surface-muted)] px-1.5 py-0.5 rounded font-mono">
                              {Object.keys(TEMPLATES).length}
                            </span>
                          </div>
                        </button>

                        {isTemplatesExpanded && (
                          <div className="grid grid-cols-2 gap-2 p-1">
                            {Object.entries({
                              cacheAside: {
                                label: "Cache Aside",
                                icon: (
                                  <svg
                                    className="w-5 h-5 text-violet-400 group-hover:scale-110 transition duration-150"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <rect
                                      x="2"
                                      y="3"
                                      width="20"
                                      height="14"
                                      rx="2"
                                      ry="2"
                                    />
                                    <line x1="2" y1="10" x2="22" y2="10" />
                                    <line x1="12" y1="10" x2="12" y2="21" />
                                  </svg>
                                ),
                                description:
                                  "Write/read path caching strategy prioritizing low latency using Redis Cache and Postgres DB.",
                                color:
                                  "hover:border-violet-500/40 text-violet-400",
                              },
                              loadBalancing: {
                                label: "Load Balancer",
                                icon: (
                                  <svg
                                    className="w-5 h-5 text-blue-400 group-hover:scale-110 transition duration-150"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="2" x2="12" y2="22" />
                                    <line x1="12" y1="12" x2="22" y2="12" />
                                  </svg>
                                ),
                                description:
                                  "Distribute client requests across multiple backend web server nodes using Round Robin routing.",
                                color: "hover:border-blue-500/40 text-blue-400",
                              },
                              valetKey: {
                                label: "Valet Key",
                                icon: (
                                  <svg
                                    className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition duration-150"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <rect
                                      x="3"
                                      y="11"
                                      width="18"
                                      height="11"
                                      rx="2"
                                      ry="2"
                                    />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                  </svg>
                                ),
                                description:
                                  "Clients fetch secure signed URLs from server, then upload files directly to Cloud Storage.",
                                color:
                                  "hover:border-yellow-500/40 text-yellow-400",
                              },
                              apiGateway: {
                                label: "API Gateway",
                                icon: (
                                  <svg
                                    className="w-5 h-5 text-fuchsia-400 group-hover:scale-110 transition duration-150"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                  >
                                    <path d="M9 3H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM21 3h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z" />
                                  </svg>
                                ),
                                description:
                                  "Central entry point routes requests dynamically to Post or User services based on path prefixes.",
                                color:
                                  "hover:border-fuchsia-500/40 text-fuchsia-400",
                              },
                            }).map(([key, value]) => (
                              <button
                                key={key}
                                type="button"
                                onClick={() => loadTemplate(key as any)}
                                onMouseEnter={(e) => {
                                  const rect =
                                    e.currentTarget.getBoundingClientRect();
                                  setHoveredComponent({
                                    type: key as any,
                                    label: value.label,
                                    icon: "",
                                    description: value.description,
                                    colorClass: "",
                                  });
                                  setHoverTooltipX(rect.right + 12);
                                  setHoverTooltipY(rect.top + rect.height / 2);
                                }}
                                onMouseLeave={() => setHoveredComponent(null)}
                                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border border-[var(--border)]/70 bg-[var(--surface)]/40 ${value.color} hover:bg-[var(--surface)]/80 transition duration-150 text-center cursor-pointer group shadow-sm`}
                              >
                                {value.icon}
                                <span className="text-[9.5px] font-semibold text-[color:var(--foreground)]/65 mt-1.5 truncate max-w-full">
                                  {value.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-[var(--border)]/40" />

                      {/* 2. Components & Shapes Unified Section */}
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() =>
                            setIsComponentsExpanded(!isComponentsExpanded)
                          }
                          className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--surface-muted)] transition duration-150 text-left font-semibold cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <FiChevronRight
                              className={`w-3 h-3 text-[color:var(--foreground)]/60 transform transition-transform duration-200 ${isComponentsExpanded ? "rotate-90" : "rotate-0"}`}
                            />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--foreground)]/70">
                              Components & Shapes
                            </span>
                          </div>
                          <span className="text-[9px] text-[color:var(--foreground)]/40 bg-[var(--surface-muted)] px-1.5 py-0.5 rounded font-mono">
                            {filteredComponents.length + SHAPES_LIBRARY.length}
                          </span>
                        </button>

                        {isComponentsExpanded && (
                          <div className="space-y-3 p-1">
                            {/* Category 1: System Components */}
                            <div>
                              <h3 className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--foreground)]/40 mb-1.5 px-1">
                                System Components
                              </h3>
                              <div className="grid grid-cols-3 gap-2">
                                {filteredComponents.map((item) => (
                                  <button
                                    key={item.type}
                                    type="button"
                                    draggable
                                    onDragStart={(e) =>
                                      handleDragStart(e, item.type)
                                    }
                                    onDragEnd={handleDragEnd}
                                    onClick={() => addComponent(item.type)}
                                    onMouseEnter={(e) => {
                                      if (draggingType) return; // don't show tooltip while dragging
                                      const rect =
                                        e.currentTarget.getBoundingClientRect();
                                      setHoveredComponent(item);
                                      setHoverTooltipX(rect.right + 12);
                                      setHoverTooltipY(
                                        rect.top + rect.height / 2,
                                      );
                                    }}
                                    onMouseLeave={() =>
                                      setHoveredComponent(null)
                                    }
                                    className={`aspect-square rounded-xl border bg-[var(--surface)]/30 hover:bg-[var(--surface)] hover:border-violet-500/50 flex flex-col items-center justify-center transition duration-150 cursor-grab active:cursor-grabbing group relative shadow-sm ${
                                      draggingType === item.type
                                        ? "border-violet-500/60 bg-violet-500/10 scale-95"
                                        : "border-[var(--border)]"
                                    }`}
                                    title={`${item.label} — click to add or drag onto canvas`}
                                  >
                                    <ComponentIcon
                                      type={item.type}
                                      className="w-6 h-6 group-hover:scale-110 transition duration-150 text-[color:var(--foreground)]/65 group-hover:text-violet-400"
                                    />
                                    <span className="text-[8px] font-bold text-[color:var(--foreground)]/50 mt-1 truncate max-w-full px-1">
                                      {item.label}
                                    </span>
                                  </button>
                                ))}
                                {filteredComponents.length === 0 && (
                                  <div className="col-span-3 text-center py-6 text-xs text-[color:var(--foreground)]/40">
                                    No matching components
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Category 2: Canvas Shapes */}
                            <div className="pt-1.5 border-t border-[var(--border)]/20">
                              <h3 className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--foreground)]/40 mb-1.5 px-1">
                                Canvas Shapes & Frames
                              </h3>
                              <div className="grid grid-cols-5 gap-1.5">
                                {SHAPES_LIBRARY.map((shape) => (
                                  <button
                                    key={shape.id}
                                    type="button"
                                    draggable
                                    onDragStart={(e) =>
                                      handleShapeDragStart(e, shape.id)
                                    }
                                    onClick={() => addShape(shape.id)}
                                    title={`${shape.label} — click to add or drag onto canvas`}
                                    className="aspect-square rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 flex flex-col items-center justify-center gap-0.5 transition duration-150 cursor-grab active:cursor-grabbing group hover:scale-105 hover:border-violet-500/40 hover:bg-[var(--surface)]"
                                  >
                                    {/* Legitimate vector SVG shape icon */}
                                    <div className="w-5 h-5 flex items-center justify-center group-hover:scale-110 transition duration-150">
                                      {shape.icon}
                                    </div>
                                    <span className="text-[7.5px] font-semibold text-[color:var(--foreground)]/45 leading-none truncate max-w-full px-0.5 group-hover:text-violet-400 transition">
                                      {shape.label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sidebar Footer Controls */}
                    <div className="p-3 border-t border-[var(--border)] bg-[var(--surface)]/45 flex flex-col gap-2 shrink-0 bg-[var(--surface)]">
                      <button
                        type="button"
                        onClick={() => {
                          handleStartSimulation();
                          setFrameIndex(0);
                          setIsPlaying(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[color:var(--accent)] text-[11px] font-bold transition cursor-pointer"
                        title="Re-run simulation with current changes"
                      >
                        <svg
                          className="w-3.5 h-3.5 animate-spin-hover"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l.56-1.54" />
                        </svg>
                        <span>Re-run Simulation</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleClearCanvas}
                        className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 hover:border-rose-500/40 text-rose-500 dark:text-rose-400 text-[11px] font-semibold transition cursor-pointer active:scale-95 duration-200"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Clear Canvas</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </aside>

          {/* Right Canvas Area: Center Canvas Column + Docked Right Inspector */}
          <div className="flex-1 h-full min-w-0 flex flex-col md:flex-row relative z-0 overflow-hidden">
            {/* Center Column: Top Technical Bar + ReactFlow Canvas + Bottom Logs Drawer */}
            <div className="flex-1 h-full min-w-0 flex flex-col relative overflow-hidden">
              {/* Top Engineering Canvas Toolbar */}
              <CanvasToolbar
                title={
                  workspaceId
                    ? diagramTitle || "Distributed Architecture"
                    : "Architecture Sandbox"
                }
                onToggleSidebar={() => setIsSidebarOpenMobile(true)}
                nodesCount={nodes.length}
                edgesCount={edges.length}
                viewMode={workspaceMode}
                onViewModeChange={setWorkspaceMode}
                isPlaying={isPlaying}
                isCompiling={isCompilingSimulation}
                onPlayToggle={() => {
                  if (isCompilingSimulation) return;
                  if (simulationFrames.length === 0) {
                    handleStartSimulation();
                  } else {
                    setIsPlaying((prev) => !prev);
                  }
                }}
                onPrevFrame={goToPreviousFrame}
                onNextFrame={goToNextFrame}
                onReset={resetPlayback}
                frameIndex={frameIndex}
                completedFrames={accumulatedFrames.length}
                totalFrames={simulationFrames.length}
                executionMode={executionMode}
                onExecutionModeChange={setExecutionMode}
                speed={speed}
                onSpeedChange={setSpeed}
                requestEndpoints={clientEndpoints}
                selectedRequestId={clientEndpoints[activeReqIdx]?.id}
                onSelectRequest={(id) => {
                  const idx = clientEndpoints.findIndex((ep) => ep.id === id);
                  if (idx !== -1) setActiveReqIdx(idx);
                }}
                onOpenSettings={() => setIsSettingsOpen(true)}
                debugEnabled={debugEnabled}
                onToggleLogs={() => setDebugEnabled((prev) => !prev)}
                isAssistantOpen={isAIAssistantOpen}
                onToggleAssistant={() => setIsAIAssistantOpen((prev) => !prev)}
                onSave={
                  workspaceId && diagramId
                    ? handleSaveDiagramToBackend
                    : undefined
                }
                isSaving={isSaving}
              />
              {/* Full-Screen React Flow Canvas */}
              <div
                className={`flex-1 min-h-0 relative z-0 w-full transition-all duration-150 ${
                  isDragOverCanvas ? "ring-2 ring-inset ring-violet-500/50" : ""
                }`}
                onDrop={handleCanvasDrop}
                onDragOver={handleCanvasDragOver}
                onDragLeave={handleCanvasDragLeave}
              >
                {/* Drop overlay hint */}
                {isDragOverCanvas && (
                  <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-violet-400/60 bg-violet-500/10 px-8 py-5 backdrop-blur-sm shadow-xl">
                      <span className="text-3xl">+</span>
                      <p className="text-sm font-bold text-violet-300">
                        Drop to place node
                      </p>
                    </div>
                  </div>
                )}

                {/* Canvas Loading Overlay with Engineering FlowLoader */}
                {isLoadingDiagram && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-[var(--background)]/85 backdrop-blur-md transition-all">
                    <FlowLoader
                      label="Loading Architecture Diagram..."
                      sublabel="Fetching nodes, connections & configurations from database"
                    />
                  </div>
                )}

                {/* Simulation Compiling HUD Indicator */}
                {isCompilingSimulation && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                    <FlowLoader
                      size="hud"
                      label="Compiling Simulation Engine"
                      sublabel="Tracing network paths & allocating buffer queues"
                    />
                  </div>
                )}

                {/* Interactive Canvas Tip / First-Time Hint Banner */}
                {showCanvasTip && !isLoadingDiagram && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full border border-violet-500/30 bg-[var(--surface)]/90 backdrop-blur-md px-3.5 py-1.5 shadow-lg text-xs animate-fade-in pointer-events-auto max-w-[90vw]">
                    <span className="flex h-2 w-2 rounded-full bg-violet-400 animate-pulse shrink-0" />
                    <span className="text-[color:var(--foreground)]/85 text-[11px] truncate">
                      <strong className="text-violet-400 font-semibold">
                        Tip:
                      </strong>{" "}
                      Click any <strong>Client node</strong> directly on the
                      canvas to trigger request simulations!
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCanvasTip(false)}
                      className="text-[color:var(--foreground)]/40 hover:text-[color:var(--foreground)] ml-1 text-sm font-bold cursor-pointer shrink-0"
                      title="Dismiss tip"
                    >
                      ×
                    </button>
                  </div>
                )}

                <ReactFlow
                  nodes={styledNodes}
                  edges={animatedEdges.map((edge) => ({
                    ...edge,
                    data: { ...edge.data, connectionStyle },
                  }))}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  snapToGrid={snapToGrid}
                  snapGrid={[gridSize, gridSize]}
                  minZoom={0.2}
                  maxZoom={2.5}
                  proOptions={{ hideAttribution: true }}
                  style={{ width: "100%", height: "100%" }}
                >
                  {bgPattern !== "none" && (
                    <Background
                      variant={
                        bgPattern === "lines"
                          ? BackgroundVariant.Lines
                          : bgPattern === "cross"
                            ? BackgroundVariant.Cross
                            : BackgroundVariant.Dots
                      }
                      gap={gridSize}
                      size={bgPattern === "dots" ? 1.5 : 1}
                      color={
                        theme === "dark"
                          ? `rgba(148, 163, 184, ${bgOpacity})`
                          : `rgba(15, 23, 42, ${bgOpacity})`
                      }
                    />
                  )}
                  {showMinimap && (
                    <MiniMap
                      nodeStrokeWidth={2}
                      zoomable
                      pannable
                      style={{
                        backgroundColor:
                          theme === "dark"
                            ? "rgba(15, 23, 42, 0.85)"
                            : "rgba(255, 255, 255, 0.85)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        backdropFilter: "blur(12px)",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      }}
                      maskColor={
                        theme === "dark"
                          ? "rgba(0, 0, 0, 0.45)"
                          : "rgba(241, 245, 249, 0.55)"
                      }
                    />
                  )}
                </ReactFlow>

                {/* Minimal Floating Canvas Controls Dock (Bottom Left) */}
                <CanvasControlsBar
                  onZoomIn={() => zoomIn({ duration: 200 })}
                  onZoomOut={() => zoomOut({ duration: 200 })}
                  onFitView={() => fitView({ duration: 400 })}
                  showMinimap={showMinimap}
                  onToggleMinimap={() => setShowMinimap((prev) => !prev)}
                  bgPattern={bgPattern}
                  onToggleGrid={() =>
                    setBgPattern((prev) => (prev === "none" ? "dots" : "none"))
                  }
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />

                {/* Circular Floating Relay Assistant Trigger Button (Bottom Right) */}
                {!isAIAssistantOpen && (
                  <div className="absolute bottom-5 right-5 sm:bottom-6 sm:right-6 z-20 select-none">
                    <button
                      type="button"
                      onClick={() => setIsAIAssistantOpen(true)}
                      className="relative size-11 rounded-full border border-[var(--border)] bg-[var(--surface)]/95 hover:bg-[var(--bg-elevated)] backdrop-blur-md shadow-md flex items-center justify-center text-foreground hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all cursor-pointer group"
                      title={
                        !workspaceId
                          ? "Relay AI (Locked in Sandbox — Click to view)"
                          : "Open Relay AI Copilot"
                      }
                      aria-label="Open Relay"
                    >
                      <Sparkles className="size-4 text-primary group-hover:scale-110 transition-transform" />
                      {!workspaceId && (
                        <span
                          className="absolute -top-1 -right-1 size-4 rounded-full bg-amber-500 text-black flex items-center justify-center border-2 border-[var(--surface)] shadow-xs"
                          title="Locked in Sandbox"
                        >
                          <FiLock className="size-2.5 stroke-[2.5]" />
                        </span>
                      )}
                    </button>
                  </div>
                )}

                {/* Floating Active Live Screen Recording Widget (Collapsible to Corner Circle) */}
                {isRecording && (
                  <>
                    {isRecordingMinimized ? (
                      /* ── 1. Minimized State: Sleek Floating Corner Circle Box ── */
                      <div className="absolute top-4 right-4 z-40 select-none animate-in fade-in zoom-in-75 duration-200">
                        <button
                          type="button"
                          onClick={() => setIsRecordingMinimized(false)}
                          className="group relative size-11 rounded-full border border-red-500/50 bg-[var(--surface)]/95 hover:bg-[var(--bg-elevated)] backdrop-blur-xl shadow-xl shadow-red-950/20 flex items-center justify-center text-foreground hover:border-red-500 transition-all duration-300 hover:scale-105 cursor-pointer"
                          title={`Recording active (${formatDuration(recordingDuration)}) · Click to expand`}
                          aria-label="Expand live recording controls"
                        >
                          {/* Outer breathing aura */}
                          <span className="absolute -inset-0.5 rounded-full bg-red-500/25 animate-pulse" />

                          {/* Pulsing red REC beacon */}
                          <span className="relative flex h-3 w-3 items-center justify-center">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-xs shadow-red-500" />
                          </span>

                          {/* Hover fly-out badge showing elapsed time & expand prompt */}
                          <div className="pointer-events-none absolute right-full mr-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-red-500/30 bg-zinc-950/95 text-white text-[11px] font-mono shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap translate-x-1 group-hover:translate-x-0">
                            <span className="font-bold text-red-400">REC</span>
                            <span>{formatDuration(recordingDuration)}</span>
                            <span className="text-[10px] text-zinc-400 font-sans">· Click to Stop</span>
                          </div>
                        </button>
                      </div>
                    ) : (
                      /* ── 2. Expanded State: Full Controls HUD Pill in Corner ── */
                      <div className="absolute top-4 right-4 z-40 select-none flex items-center gap-3 pl-3.5 pr-2 py-1.5 rounded-full border border-red-500/40 bg-[var(--surface)]/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl text-xs font-mono animate-in fade-in zoom-in-95 duration-200">
                        {/* Live Beacon */}
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                        </span>

                        {/* Status, Time & Format */}
                        <div className="flex items-center gap-1.5 select-none font-bold text-foreground">
                          <span className="tracking-wider text-red-500">REC</span>
                          <span className="font-mono text-foreground">{formatDuration(recordingDuration)}</span>
                          <span className="ml-0.5 text-[9px] px-1.5 py-0.2 rounded bg-muted/60 text-muted-foreground uppercase border border-border/50">
                            {videoFormat}
                          </span>
                        </div>

                        {/* Divider */}
                        <div className="h-3.5 w-px bg-border/60" />

                        {/* Stop & Save Action */}
                        <button
                          type="button"
                          onClick={handleStopRecording}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 hover:bg-red-500 active:scale-95 text-white text-[11px] font-semibold transition cursor-pointer shadow-xs shadow-red-950/20"
                        >
                          <FiSquare className="w-2.5 h-2.5 fill-current" />
                          <span>Stop & Save</span>
                        </button>

                        {/* Minimize to Corner Circle */}
                        <button
                          type="button"
                          onClick={() => setIsRecordingMinimized(true)}
                          className="size-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition cursor-pointer"
                          title="Hide to corner circle"
                          aria-label="Minimize recording indicator"
                        >
                          <FiMinimize2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Professional Clean Empty State */}
                {nodes.length === 0 && !isLoadingDiagram && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none select-none">
                    <div className="flex flex-col items-center text-center max-w-sm px-6 py-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-md shadow-2xl">
                      <div className="w-12 h-12 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)] flex items-center justify-center mb-3 text-[color:var(--accent)]">
                        <FiGrid className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-[color:var(--foreground)] mb-1 tracking-tight">
                        Architecture Canvas is Empty
                      </h3>
                      <p className="text-xs text-[color:var(--foreground)]/60 mb-4 leading-relaxed font-sans">
                        Drag components from the library or load a production
                        template to simulate distributed requests in real-time.
                      </p>
                      <div className="flex items-center gap-2 pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => setIsTemplateBrowserOpen(true)}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer transition"
                        >
                          Browse Templates
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* System Health & Load Monitor Overlay */}
                {systemMetrics &&
                  (showMetrics ? (
                    <div className="absolute top-16 left-4 z-10 w-72 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/80 backdrop-blur-md shadow-lg p-3 flex flex-col gap-2.5 font-sans select-none pointer-events-auto">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span
                              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                systemMetrics.errorRequests.length > 0
                                  ? "bg-rose-400"
                                  : systemMetrics.warningRequests?.length > 0
                                    ? "bg-amber-400"
                                    : "bg-emerald-400"
                              }`}
                            ></span>
                            <span
                              className={`relative inline-flex rounded-full h-2 w-2 ${
                                systemMetrics.errorRequests.length > 0
                                  ? "bg-rose-500"
                                  : systemMetrics.warningRequests?.length > 0
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                              }`}
                            ></span>
                          </span>
                          <h3 className="text-[10px] font-bold text-[color:var(--foreground)] tracking-tight uppercase">
                            System Health & Load
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-[color:var(--foreground)]/45">
                            t={systemMetrics.currentTick}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowMetrics(false)}
                            className="text-xs text-[color:var(--foreground)]/40 hover:text-[color:var(--foreground)]/70 transition p-1 hover:bg-[var(--surface-muted)] rounded cursor-pointer leading-none flex items-center justify-center w-5 h-5 border border-transparent"
                            title="Collapse Overlay"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-center">
                        <div className="bg-[var(--surface-muted)]/50 p-1.5 rounded-xl border border-[var(--border)]/35">
                          <p className="text-[8px] uppercase font-semibold text-[color:var(--foreground)]/40 tracking-wider">
                            In-Flight Req
                          </p>
                          <p className="text-xs font-bold text-[color:var(--foreground)] mt-0.5">
                            {systemMetrics.activeCount} /{" "}
                            {systemMetrics.totalRequests}
                          </p>
                        </div>
                        <div
                          className={`p-1.5 rounded-xl border ${
                            systemMetrics.pendingCount > 0
                              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                              : "bg-[var(--surface-muted)]/50 border-[var(--border)]/35 text-[color:var(--foreground)]"
                          }`}
                        >
                          <p
                            className={`text-[8px] uppercase font-semibold tracking-wider ${
                              systemMetrics.pendingCount > 0
                                ? "text-rose-400/80"
                                : "text-[color:var(--foreground)]/40"
                            }`}
                          >
                            Queue Size
                          </p>
                          <p className="text-xs font-bold mt-0.5">
                            {systemMetrics.pendingCount}
                          </p>
                        </div>
                      </div>

                      {systemMetrics.queuedRequests.length > 0 && (
                        <div className="flex flex-col gap-1 rounded-xl bg-rose-500/5 border border-rose-500/15 p-2">
                          <p className="text-[8px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
                            <FiClock className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>Bottleneck: Database Wait</span>
                          </p>
                          <div className="max-h-16 overflow-y-auto space-y-0.5 mt-0.5 scrollbar-thin">
                            {systemMetrics.queuedRequests.map(
                              (req: string, idx: number) => (
                                <p
                                  key={idx}
                                  className="text-[9px] font-mono text-rose-300/90 leading-tight"
                                >
                                  • {req} queued
                                </p>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {systemMetrics.errorRequests.length > 0 && (
                        <div className="flex flex-col gap-1 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2">
                          <p className="text-[8px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1.5">
                            <FiAlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                            <span>Failures Detected</span>
                          </p>
                          <div className="max-h-16 overflow-y-auto space-y-0.5 mt-0.5 scrollbar-thin">
                            {systemMetrics.errorRequests.map(
                              (err: string, idx: number) => (
                                <p
                                  key={idx}
                                  className="text-[9px] font-mono text-rose-200/90 leading-tight"
                                >
                                  • {err}
                                </p>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {systemMetrics.warningRequests &&
                        systemMetrics.warningRequests.length > 0 && (
                          <div className="flex flex-col gap-1 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2">
                            <p className="text-[8px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                              <FiAlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                              <span>Warnings Detected</span>
                            </p>
                            <div className="max-h-16 overflow-y-auto space-y-0.5 mt-0.5 scrollbar-thin">
                              {systemMetrics.warningRequests.map(
                                (warn: string, idx: number) => (
                                  <p
                                    key={idx}
                                    className="text-[9px] font-mono text-amber-200/90 leading-tight"
                                  >
                                    • {warn}
                                  </p>
                                ),
                              )}
                            </div>
                          </div>
                        )}

                      {systemMetrics.activeCount > 0 &&
                        systemMetrics.queuedRequests.length === 0 &&
                        systemMetrics.errorRequests.length === 0 &&
                        (!systemMetrics.warningRequests ||
                          systemMetrics.warningRequests.length === 0) && (
                          <div className="flex items-center gap-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-1.5 text-emerald-400">
                            <FiCheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span className="text-[8px] font-bold uppercase tracking-wider">
                              Processing requests smoothly
                            </span>
                          </div>
                        )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowMetrics(true)}
                      className="absolute top-16 left-4 z-10 rounded-full border border-[var(--border)] bg-[var(--surface)]/90 hover:bg-[var(--surface-muted)] hover:border-[var(--border)]/80 text-[10px] font-bold text-[color:var(--foreground)]/80 transition px-3 py-1.5 flex items-center gap-1.5 shadow-md cursor-pointer pointer-events-auto"
                      title="Expand Health Overlay"
                    >
                      <span className="relative flex h-2 w-2">
                        <span
                          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            systemMetrics.errorRequests.length > 0
                              ? "bg-rose-400"
                              : systemMetrics.warningRequests?.length > 0
                                ? "bg-amber-400"
                                : "bg-emerald-400"
                          }`}
                        ></span>
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${
                            systemMetrics.errorRequests.length > 0
                              ? "bg-rose-500"
                              : systemMetrics.warningRequests?.length > 0
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                          }`}
                        ></span>
                      </span>
                      <FiActivity className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                      <span>Health & Load</span>
                    </button>
                  ))}
              </div>

              {/* Floating Warning Message */}
              {validationWarning && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 max-w-md w-auto px-4 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="pointer-events-auto rounded-2xl border border-amber-500/30 bg-[var(--surface)]/95 shadow-2xl backdrop-blur-xl px-4 py-2.5 text-xs text-foreground flex items-center justify-between gap-3 select-none">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <FiAlertTriangle className="size-3.5" />
                      </div>
                      <p className="font-medium text-foreground text-xs leading-snug">
                        {validationWarning}
                      </p>
                    </div>
                    <button
                      onClick={() => setValidationWarning(null)}
                      className="size-5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer shrink-0 ml-1"
                      aria-label="Dismiss warning"
                    >
                      <FiX className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Floating Success Message */}
              {successToast && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 max-w-md w-auto px-4 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="pointer-events-auto rounded-2xl border border-emerald-500/30 bg-[var(--surface)]/95 shadow-2xl backdrop-blur-xl px-4 py-2.5 text-xs text-foreground flex items-center justify-between gap-3 select-none">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <FiCheck className="size-3.5 stroke-[2.5]" />
                      </div>
                      <p className="font-medium text-foreground text-xs leading-snug">
                        {successToast}
                      </p>
                    </div>
                    <button
                      onClick={() => setSuccessToast(null)}
                      className="size-5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground flex items-center justify-center transition cursor-pointer shrink-0 ml-1"
                      aria-label="Dismiss success notification"
                    >
                      <FiX className="size-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Bottom Docked Playback / Timeline Terminal Panel */}
              {debugEnabled && (
                <div
                  style={{ height: `${panelHeight}px` }}
                  className={`flex flex-col border-t border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-xl overflow-hidden shrink-0 z-10 w-full transition-all duration-150 ${selectedNode ? "max-md:hidden" : ""}`}
                >
                  {/* Drag Handle */}
                  <div
                    onMouseDown={() => setIsDraggingTerminal(true)}
                    className="h-1 w-full cursor-row-resize bg-[var(--border)] hover:bg-[var(--accent)]/60 transition-colors shrink-0"
                    title="Drag to resize terminal panel"
                  />

                  <div className="p-3 flex-1 flex flex-col gap-2.5 min-h-0 overflow-y-auto scrollbar-thin">
                    <div className="mx-auto flex w-full max-w-7xl flex-col gap-2.5">
                      <div className="flex items-center justify-between border-b border-[var(--border)]/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-mono font-bold tracking-tight uppercase text-[color:var(--foreground)]/80">
                            Simulation Execution Logs & Timeline
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--surface-muted)] text-[color:var(--foreground)]/60 border border-[var(--border)]">
                            Frame{" "}
                            {simulationFrames.length > 0
                              ? accumulatedFrames.length
                              : 0}{" "}
                            / {simulationFrames.length}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDebugEnabled(false)}
                          className="p-1 rounded-md text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)] text-xs cursor-pointer font-bold"
                          title="Close Logs Drawer"
                        >
                          ✕
                        </button>
                      </div>

                      <Timeline
                        frameIndex={frameIndex}
                        frameGroups={frameGroups}
                        onSeek={(idx) => {
                          setIsPlaying(false);
                          setFrameIndex(idx);
                        }}
                        theme={theme}
                      />

                      <div className="min-h-0 flex-1">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 p-2.5 shadow-inner">
                          <DebugPanel
                            currentFrames={accumulatedFrames}
                            frameIndex={frameIndex}
                            theme={theme}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Docked Right Inspector Panel — bottom sheet on mobile, right-docked on desktop (Section 15) */}
            {selectedNode && (
              <aside
                style={{ width: `${inspectorWidth}px` }}
                className="
            fixed inset-x-0 bottom-0 max-h-[60vh] rounded-t-2xl border-t border-[var(--border)] z-50
            md:static md:h-full md:max-h-full md:rounded-none md:border-t-0 md:border-l md:border-[var(--border)] md:z-20
            bg-[var(--surface)] shadow-2xl md:shadow-none flex flex-col overflow-y-auto scrollbar-thin shrink-0 relative
          "
              >
                {/* Desktop Left Resize Drag Handle */}
                <div
                  onMouseDown={handleStartResizeInspector}
                  className={`hidden md:flex absolute -left-1 top-0 bottom-0 w-2.5 cursor-col-resize items-center justify-center z-40 group hover:bg-[var(--accent)]/15 select-none transition-colors ${
                    isResizingInspector ? "bg-[var(--accent)]/25" : ""
                  }`}
                  title="Drag to resize Inspector width"
                >
                  <div className="w-0.5 h-10 rounded-full bg-[var(--border)] group-hover:bg-[var(--accent)] transition-colors" />
                </div>
                <div className="p-3.5 px-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface-muted)]/50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-lg bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[color:var(--accent)] shadow-xs shrink-0">
                      <ComponentIcon
                        type={String(
                          selectedNode.data?.type ||
                            (selectedNode.type !== "default" && selectedNode.type ? selectedNode.type : "") ||
                            inferWorkspaceNodeType(selectedNode) ||
                            "node",
                        )}
                        className="size-4"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h2 className="text-xs font-bold tracking-tight text-[color:var(--foreground)] truncate">
                          {String(selectedNode.data?.label || selectedNode.id)}
                        </h2>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-[var(--surface)] text-[color:var(--accent)] border border-[var(--border)] shrink-0">
                          {String(
                            selectedNode.data?.type ||
                              (selectedNode.type !== "default" && selectedNode.type ? selectedNode.type : "") ||
                              inferWorkspaceNodeType(selectedNode) ||
                              "node",
                          )}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono text-[color:var(--foreground)]/50 truncate">
                        ID: {selectedNode.id}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNodeId(null);
                      setNodes((nds) =>
                        nds.map((n) => ({ ...n, selected: false })),
                      );
                    }}
                    className="text-xs text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] h-6 w-6 rounded-md hover:bg-[var(--surface)] flex items-center justify-center font-bold transition cursor-pointer shrink-0"
                    title="Close Inspector"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-4 flex-1 space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      handleStartSimulation();
                      setFrameIndex(0);
                      setIsPlaying(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 text-[color:var(--accent)] text-[11px] font-bold transition cursor-pointer"
                    title="Re-run simulation with current changes"
                  >
                    <FiRotateCcw className="w-3.5 h-3.5" />
                    <span>Re-run Simulation</span>
                  </button>

                  {/* Rename Node section */}
                  <div>
                    <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                      Label / Component Name
                    </label>
                    <input
                      type="text"
                      value={(selectedNode.data.label as string) || ""}
                      maxLength={100}
                      onChange={(e) => {
                        const nextVal = e.target.value;
                        setNodes((nds) =>
                          nds.map((n) =>
                            n.id === selectedNodeId
                              ? { ...n, data: { ...n.data, label: nextVal } }
                              : n,
                          ),
                        );
                      }}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[color:var(--foreground)] outline-none focus:border-violet-500 transition"
                    />
                  </div>

                  <div className="h-px bg-[var(--border)]/70" />

                  {/* ── Frame Color Picker (only for shape/frame nodes) ── */}
                  {selectedNode.type === "shapeNode" && (
                    <div>
                      <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                        Frame Color
                      </label>
                      {/* Preset swatches */}
                      <div className="grid grid-cols-6 gap-1.5 mb-2">
                        {FRAME_COLOR_PRESETS.map((preset) => {
                          const isCurrent =
                            ((selectedNode.data.color as string) ||
                              "#8b5cf6") === preset.color;
                          return (
                            <button
                              key={preset.color}
                              type="button"
                              title={preset.label}
                              onClick={() => {
                                setNodes((nds) =>
                                  nds.map((n) =>
                                    n.id === selectedNodeId
                                      ? {
                                          ...n,
                                          data: {
                                            ...n.data,
                                            color: preset.color,
                                          },
                                        }
                                      : n,
                                  ),
                                );
                              }}
                              className="aspect-square rounded-lg transition cursor-pointer hover:scale-110"
                              style={{
                                background: preset.color,
                                outline: isCurrent ? `3px solid white` : "none",
                                outlineOffset: isCurrent ? "2px" : "0",
                                boxShadow: isCurrent
                                  ? `0 0 0 5px ${preset.color}55`
                                  : "none",
                              }}
                            />
                          );
                        })}
                      </div>
                      {/* Custom hex input */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-md border border-[var(--border)] shrink-0 cursor-pointer"
                          style={{
                            background:
                              (selectedNode.data.color as string) || "#8b5cf6",
                          }}
                        />
                        <input
                          type="color"
                          value={
                            (selectedNode.data.color as string) || "#8b5cf6"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNodeId
                                  ? { ...n, data: { ...n.data, color: val } }
                                  : n,
                              ),
                            );
                          }}
                          className="flex-1 h-7 rounded-md border border-[var(--border)] bg-[var(--surface)] cursor-pointer text-xs px-1 outline-none"
                          title="Custom color"
                        />
                        <span className="text-[10px] text-[color:var(--foreground)]/40 font-mono">
                          {(
                            (selectedNode.data.color as string) || "#8b5cf6"
                          ).toUpperCase()}
                        </span>
                      </div>

                      {/* Text Alignment Picker */}
                      <div className="mt-3">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Text Alignment
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {(["left", "center", "right"] as const).map(
                            (align) => {
                              const isCurrent =
                                ((selectedNode.data.textAlign as string) ||
                                  "center") === align;
                              return (
                                <button
                                  key={align}
                                  type="button"
                                  onClick={() => {
                                    setNodes((nds) =>
                                      nds.map((n) =>
                                        n.id === selectedNodeId
                                          ? {
                                              ...n,
                                              data: {
                                                ...n.data,
                                                textAlign: align,
                                              },
                                            }
                                          : n,
                                      ),
                                    );
                                  }}
                                  className="py-1.5 px-2 text-xs rounded-lg border transition cursor-pointer font-semibold flex items-center justify-center"
                                  style={{
                                    borderColor: isCurrent
                                      ? "rgba(139,92,246,0.6)"
                                      : "var(--border)",
                                    background: isCurrent
                                      ? "rgba(139,92,246,0.12)"
                                      : "var(--surface)",
                                    color: isCurrent
                                      ? "#a78bfa"
                                      : "var(--foreground)",
                                  }}
                                >
                                  {align === "left"
                                    ? "Left"
                                    : align === "right"
                                      ? "Right"
                                      : "Center"}
                                </button>
                              );
                            },
                          )}
                        </div>
                      </div>

                      {/* Font Size Picker */}
                      <div className="mt-3.5 pt-3 border-t border-[var(--border)]/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55">
                            Font Size
                          </label>
                          <span className="text-[11px] font-mono text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                            {(selectedNode.data.fontSize as number) ||
                              (selectedNode.data.shapeId === "text"
                                ? 15
                                : selectedNode.data.shapeId === "sticky"
                                  ? 12
                                  : 11)}
                            px
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={9}
                            max={36}
                            step={1}
                            value={
                              (selectedNode.data.fontSize as number) ||
                              (selectedNode.data.shapeId === "text"
                                ? 15
                                : selectedNode.data.shapeId === "sticky"
                                  ? 12
                                  : 11)
                            }
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setNodes((nds) =>
                                nds.map((n) =>
                                  n.id === selectedNodeId
                                    ? {
                                        ...n,
                                        data: { ...n.data, fontSize: val },
                                      }
                                    : n,
                                ),
                              );
                            }}
                            className="flex-1 accent-violet-500 cursor-pointer h-1.5 bg-[var(--surface-muted)] rounded-lg"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                const curr =
                                  (selectedNode.data.fontSize as number) ||
                                  (selectedNode.data.shapeId === "text"
                                    ? 15
                                    : selectedNode.data.shapeId === "sticky"
                                      ? 12
                                      : 11);
                                const next = Math.max(8, curr - 2);
                                setNodes((nds) =>
                                  nds.map((n) =>
                                    n.id === selectedNodeId
                                      ? {
                                          ...n,
                                          data: { ...n.data, fontSize: next },
                                        }
                                      : n,
                                  ),
                                );
                              }}
                              className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--surface)] text-xs font-bold hover:bg-[var(--surface-muted)] flex items-center justify-center transition cursor-pointer"
                              title="Decrease font size"
                            >
                              -
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const curr =
                                  (selectedNode.data.fontSize as number) ||
                                  (selectedNode.data.shapeId === "text"
                                    ? 15
                                    : selectedNode.data.shapeId === "sticky"
                                      ? 12
                                      : 11);
                                const next = Math.min(48, curr + 2);
                                setNodes((nds) =>
                                  nds.map((n) =>
                                    n.id === selectedNodeId
                                      ? {
                                          ...n,
                                          data: { ...n.data, fontSize: next },
                                        }
                                      : n,
                                  ),
                                );
                              }}
                              className="w-6 h-6 rounded-md border border-[var(--border)] bg-[var(--surface)] text-xs font-bold hover:bg-[var(--surface-muted)] flex items-center justify-center transition cursor-pointer"
                              title="Increase font size"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {/* Quick font presets */}
                        <div className="flex items-center gap-1.5 mt-2">
                          {[10, 12, 14, 16, 20, 24].map((sz) => {
                            const isCur =
                              ((selectedNode.data.fontSize as number) ||
                                (selectedNode.data.shapeId === "text"
                                  ? 15
                                  : selectedNode.data.shapeId === "sticky"
                                    ? 12
                                    : 11)) === sz;
                            return (
                              <button
                                key={sz}
                                type="button"
                                onClick={() => {
                                  setNodes((nds) =>
                                    nds.map((n) =>
                                      n.id === selectedNodeId
                                        ? {
                                            ...n,
                                            data: { ...n.data, fontSize: sz },
                                          }
                                        : n,
                                    ),
                                  );
                                }}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition cursor-pointer border ${
                                  isCur
                                    ? "border-violet-500/70 bg-violet-500/20 text-violet-400 font-bold shadow-sm"
                                    : "border-[var(--border)] bg-[var(--surface)] text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)]"
                                }`}
                              >
                                {sz}px
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Client specific configuration */}
                  {selectedNode.data.type === "client" && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Client Type
                        </label>
                        <CustomDropdown
                          type={(selectedNode.data as any).type}
                          value={
                            ((selectedNode.data as any).flavor ||
                              getDefaultFlavor(
                                (selectedNode.data as any).type,
                              )) as string
                          }
                          onChange={(flavorId) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNodeId
                                  ? {
                                      ...n,
                                      data: { ...n.data, flavor: flavorId },
                                    }
                                  : n,
                              ),
                            );
                          }}
                        />
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      <p className="text-xs font-semibold text-violet-400 font-mono">
                        Client Settings
                      </p>

                      <label className="flex items-center gap-2 text-xs text-[color:var(--foreground)]/80 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            nodeConfigs[selectedNode.id]?.valetKeyFlow ?? false
                          }
                          onChange={(e) =>
                            updateNodeConfig(selectedNode.id, {
                              valetKeyFlow: e.target.checked,
                            })
                          }
                          className="accent-violet-500 cursor-pointer"
                        />
                        <span>Valet Key Flow</span>
                      </label>

                      <div className="h-px bg-[var(--border)]/70" />

                      <div>
                        {(() => {
                          const requests = nodeConfigs[selectedNode.id]
                            ?.requests || [
                            {
                              endpoint:
                                nodeConfigs[selectedNode.id]?.endpoint ||
                                "/api/v1/posts",
                              method:
                                nodeConfigs[selectedNode.id]?.method || "GET",
                              lookupKey:
                                nodeConfigs[selectedNode.id]?.lookupKey ||
                                "rohan",
                              fileName:
                                nodeConfigs[selectedNode.id]?.fileName ||
                                "file.png",
                              isThereFileToUpload:
                                nodeConfigs[selectedNode.id]
                                  ?.isThereFileToUpload !== false,
                              targetBucket:
                                nodeConfigs[selectedNode.id]?.targetBucket ||
                                "media-uploads",
                            },
                          ];
                          const activeIdx = Math.max(
                            0,
                            Math.min(activeReqIdx, requests.length - 1),
                          );
                          const activeReq = requests[activeIdx];

                          return (
                            <div className="space-y-3">
                              {/* Horizontal Tabs */}
                              <div className="flex flex-wrap gap-1 border-b border-[var(--border)]/50 pb-1 items-center">
                                {requests.map((_: any, idx: number) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setActiveReqIdx(idx)}
                                    className={`text-[10px] px-2.5 py-1 rounded-t-md font-medium transition cursor-pointer border-t border-x ${
                                      idx === activeIdx
                                        ? "bg-[var(--surface-muted)] border-[var(--border)] text-violet-400 font-bold -mb-[5px] pb-[5px]"
                                        : "border-transparent text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] hover:bg-[var(--surface-muted)]/50"
                                    }`}
                                  >
                                    Req #{idx + 1}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextReqs = [
                                      ...requests,
                                      {
                                        endpoint: "/api/v1/posts",
                                        method: "GET",
                                        lookupKey: `key-${requests.length + 1}`,
                                        fileName: `file-${requests.length + 1}.png`,
                                        isThereFileToUpload: true,
                                        targetBucket: "media-uploads",
                                      },
                                    ];
                                    updateNodeConfig(selectedNode.id, {
                                      requests: nextReqs,
                                    });
                                    setActiveReqIdx(nextReqs.length - 1);
                                  }}
                                  className="text-[9px] bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 font-bold px-2 py-0.5 rounded transition cursor-pointer ml-auto"
                                >
                                  + Add
                                </button>
                              </div>

                              {activeReq ? (
                                <div className="border border-[var(--border)] rounded-lg p-2 bg-[var(--surface)]/50 space-y-1.5 relative group/req mt-2">
                                  {requests.length > 1 && (
                                    <button
                                      onClick={() => {
                                        const nextRequests = requests.filter(
                                          (_: any, i: number) =>
                                            i !== activeIdx,
                                        );
                                        updateNodeConfig(selectedNode.id, {
                                          requests: nextRequests,
                                        });
                                        setActiveReqIdx(
                                          Math.max(0, activeIdx - 1),
                                        );
                                      }}
                                      className="absolute top-1 right-2 text-rose-500 hover:text-rose-600 text-xs font-bold cursor-pointer"
                                      title="Delete Request"
                                    >
                                      Remove ×
                                    </button>
                                  )}

                                  <p className="text-[9px] font-bold text-violet-400">
                                    Editing Request #{activeIdx + 1}
                                  </p>

                                  {!nodeConfigs[selectedNode.id]
                                    ?.valetKeyFlow ? (
                                    <div className="space-y-1.5">
                                      <div className="flex gap-1.5">
                                        <div className="w-[70px] shrink-0">
                                          <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                            Method
                                          </label>
                                          <select
                                            value={activeReq.method || "GET"}
                                            onChange={(e) => {
                                              const currentRequests = [
                                                ...requests,
                                              ];
                                              currentRequests[activeIdx] = {
                                                ...currentRequests[activeIdx],
                                                method: e.target.value,
                                              };
                                              updateNodeConfig(
                                                selectedNode.id,
                                                {
                                                  requests: currentRequests,
                                                },
                                              );
                                            }}
                                            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-xs font-mono outline-none focus:border-violet-500 cursor-pointer text-[color:var(--foreground)]"
                                          >
                                            <option value="GET">GET</option>
                                            <option value="POST">POST</option>
                                            <option value="PUT">PUT</option>
                                            <option value="DELETE">
                                              DELETE
                                            </option>
                                            <option value="PATCH">PATCH</option>
                                          </select>
                                        </div>
                                        <div className="flex-1">
                                          <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                            Path
                                          </label>
                                          <input
                                            type="text"
                                            value={activeReq.endpoint}
                                            onChange={(e) => {
                                              const currentRequests = [
                                                ...requests,
                                              ];
                                              currentRequests[activeIdx] = {
                                                ...currentRequests[activeIdx],
                                                endpoint: e.target.value,
                                              };
                                              updateNodeConfig(
                                                selectedNode.id,
                                                {
                                                  requests: currentRequests,
                                                },
                                              );
                                            }}
                                            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-mono outline-none focus:border-violet-500 text-[color:var(--foreground)]"
                                          />
                                        </div>
                                      </div>
                                      <div>
                                        <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                          Key
                                        </label>
                                        <input
                                          type="text"
                                          value={activeReq.lookupKey}
                                          onChange={(e) => {
                                            const currentRequests = [
                                              ...requests,
                                            ];
                                            currentRequests[activeIdx] = {
                                              ...currentRequests[activeIdx],
                                              lookupKey: e.target.value,
                                            };
                                            updateNodeConfig(selectedNode.id, {
                                              requests: currentRequests,
                                            });
                                          }}
                                          className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-mono outline-none focus:border-violet-500 text-[color:var(--foreground)]"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                          Request Body (JSON)
                                        </label>
                                        <textarea
                                          value={activeReq.body || ""}
                                          onKeyDown={(e) => {
                                            if (e.key === "Tab") {
                                              e.preventDefault();
                                              const textarea = e.currentTarget;
                                              const start =
                                                textarea.selectionStart;
                                              const end = textarea.selectionEnd;
                                              const val = textarea.value;
                                              const newVal =
                                                val.substring(0, start) +
                                                "  " +
                                                val.substring(end);

                                              // Update value in requests
                                              const currentRequests = [
                                                ...requests,
                                              ];
                                              currentRequests[activeIdx] = {
                                                ...currentRequests[activeIdx],
                                                body: newVal,
                                              };
                                              updateNodeConfig(
                                                selectedNode.id,
                                                {
                                                  requests: currentRequests,
                                                },
                                              );

                                              // Restore selection start/end safely on local ref
                                              setTimeout(() => {
                                                textarea.selectionStart =
                                                  textarea.selectionEnd =
                                                    start + 2;
                                              }, 0);
                                            }
                                          }}
                                          onChange={(e) => {
                                            const currentRequests = [
                                              ...requests,
                                            ];
                                            currentRequests[activeIdx] = {
                                              ...currentRequests[activeIdx],
                                              body: e.target.value,
                                            };
                                            updateNodeConfig(selectedNode.id, {
                                              requests: currentRequests,
                                            });
                                          }}
                                          rows={4}
                                          placeholder='{\n  "topic": "order.created",\n  "amount": 250\n}'
                                          className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs font-mono outline-none focus:border-violet-500 text-[color:var(--foreground)] resize-none"
                                        />
                                        {(() => {
                                          if (
                                            activeReq.body &&
                                            activeReq.body.trim().length > 0
                                          ) {
                                            try {
                                              JSON.parse(activeReq.body);
                                            } catch (err: any) {
                                              return (
                                                <span className="text-[9px] text-rose-500 mt-1 flex items-center gap-1 leading-normal font-mono">
                                                  <FiAlertCircle className="w-2.5 h-2.5 shrink-0" />
                                                  <span>{err.message}</span>
                                                </span>
                                              );
                                            }
                                          }
                                          return null;
                                        })()}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <div className="grid grid-cols-2 gap-1.5">
                                        <div>
                                          <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                            Upload File
                                          </label>
                                          <input
                                            type="text"
                                            value={activeReq.fileName}
                                            onChange={(e) => {
                                              const currentRequests = [
                                                ...requests,
                                              ];
                                              currentRequests[activeIdx] = {
                                                ...currentRequests[activeIdx],
                                                fileName: e.target.value,
                                              };
                                              updateNodeConfig(
                                                selectedNode.id,
                                                {
                                                  requests: currentRequests,
                                                },
                                              );
                                            }}
                                            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-mono outline-none focus:border-violet-500 text-[color:var(--foreground)]"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                            Target Bucket
                                          </label>
                                          <input
                                            type="text"
                                            value={
                                              activeReq.targetBucket ||
                                              "media-uploads"
                                            }
                                            onChange={(e) => {
                                              const currentRequests = [
                                                ...requests,
                                              ];
                                              currentRequests[activeIdx] = {
                                                ...currentRequests[activeIdx],
                                                targetBucket: e.target.value,
                                              };
                                              updateNodeConfig(
                                                selectedNode.id,
                                                {
                                                  requests: currentRequests,
                                                },
                                              );
                                            }}
                                            className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs font-mono outline-none focus:border-violet-500 text-[color:var(--foreground)]"
                                            placeholder="media-uploads"
                                          />
                                        </div>
                                      </div>
                                      <label className="flex items-center gap-1 text-[9px] text-[color:var(--foreground)]/80 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={
                                            activeReq.isThereFileToUpload
                                          }
                                          onChange={(e) => {
                                            const currentRequests = [
                                              ...requests,
                                            ];
                                            currentRequests[activeIdx] = {
                                              ...currentRequests[activeIdx],
                                              isThereFileToUpload:
                                                e.target.checked,
                                            };
                                            updateNodeConfig(selectedNode.id, {
                                              requests: currentRequests,
                                            });
                                          }}
                                          className="accent-violet-500"
                                        />
                                        <span>Attach File Payload</span>
                                      </label>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-[10px] text-[color:var(--foreground)]/50 italic py-4 text-center">
                                  No requests configured. Click "+ Add" to add
                                  one.
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Load Balancer Configuration */}
                  {selectedNode.data.type === "load-balancer" && (
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-blue-400 font-mono">
                        Load Balancer Settings
                      </p>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Provider / Technology
                        </label>
                        <CustomDropdown
                          type={(selectedNode.data as any).type}
                          value={
                            ((selectedNode.data as any).flavor ||
                              getDefaultFlavor(
                                (selectedNode.data as any).type,
                              )) as string
                          }
                          onChange={(flavorId) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNodeId
                                  ? {
                                      ...n,
                                      data: { ...n.data, flavor: flavorId },
                                    }
                                  : n,
                              ),
                            );
                          }}
                        />
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                          Balancing Strategy
                        </label>
                        <select
                          value={
                            nodeConfigs[selectedNode.id]?.strategy ??
                            "ROUND_ROBIN"
                          }
                          onChange={(e) =>
                            updateNodeConfig(selectedNode.id, {
                              strategy: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-violet-500 cursor-pointer text-[color:var(--foreground)]"
                        >
                          <option value="ROUND_ROBIN">Round Robin</option>
                          <option value="RANDOM">Random Dispatch</option>
                          <option value="IP_HASH">IP Address Hash</option>
                          <option value="LEAST_CONNECTIONS">
                            Least Connections
                          </option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* API Gateway Configuration */}
                  {selectedNode.data.type === "api-gateway" && (
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-fuchsia-400 font-mono">
                        Gateway Settings
                      </p>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Provider / Technology
                        </label>
                        <CustomDropdown
                          type={(selectedNode.data as any).type}
                          value={
                            ((selectedNode.data as any).flavor ||
                              getDefaultFlavor(
                                (selectedNode.data as any).type,
                              )) as string
                          }
                          onChange={(flavorId) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNodeId
                                  ? {
                                      ...n,
                                      data: { ...n.data, flavor: flavorId },
                                    }
                                  : n,
                              ),
                            );
                          }}
                        />
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                          Load Balance Strategy
                        </label>
                        <select
                          value={
                            nodeConfigs[selectedNode.id]?.strategy ??
                            "ROUND_ROBIN"
                          }
                          onChange={(e) =>
                            updateNodeConfig(selectedNode.id, {
                              strategy: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-violet-500 cursor-pointer"
                        >
                          <option value="ROUND_ROBIN">Round Robin</option>
                          <option value="RANDOM">Random Dispatch</option>
                          <option value="IP_HASH">IP Address Hash</option>
                          <option value="LEAST_CONNECTIONS">
                            Least Connections
                          </option>
                        </select>
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      {/* Route Mappings */}
                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Route Rules
                        </label>
                        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                          {Object.entries(
                            nodeConfigs[selectedNode.id]?.routes || {},
                          ).map(([path, svc]: [string, any], idx) => (
                            <div key={idx} className="flex gap-1 items-center">
                              <input
                                type="text"
                                value={path}
                                placeholder="Path prefix"
                                onChange={(e) => {
                                  const routes = (nodeConfigs[selectedNode.id]
                                    ?.routes || {}) as Record<string, string>;
                                  const nextRoutes: Record<string, string> = {};
                                  for (const [k, v] of Object.entries(routes)) {
                                    if (k === path) {
                                      nextRoutes[e.target.value] =
                                        svc as string;
                                    } else {
                                      nextRoutes[k] = v;
                                    }
                                  }
                                  updateNodeConfig(selectedNode.id, {
                                    routes: nextRoutes,
                                  });
                                }}
                                className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono"
                              />
                              <input
                                type="text"
                                value={svc}
                                placeholder="Service name"
                                onChange={(e) => {
                                  const nextRoutes = {
                                    ...(nodeConfigs[selectedNode.id]?.routes ||
                                      {}),
                                  };
                                  nextRoutes[path] = e.target.value;
                                  updateNodeConfig(selectedNode.id, {
                                    routes: nextRoutes,
                                  });
                                }}
                                className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono"
                              />
                              <button
                                onClick={() => {
                                  const nextRoutes = {
                                    ...(nodeConfigs[selectedNode.id]?.routes ||
                                      {}),
                                  };
                                  delete nextRoutes[path];
                                  updateNodeConfig(selectedNode.id, {
                                    routes: nextRoutes,
                                  });
                                }}
                                className="text-rose-500 hover:text-rose-600 text-xs px-1 cursor-pointer font-bold"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            const routes =
                              nodeConfigs[selectedNode.id]?.routes || {};
                            const nextRoutes = {
                              ...routes,
                              [`/api/v1/route-${Object.keys(routes).length + 1}`]: `NEW_SERVICE`,
                            };
                            updateNodeConfig(selectedNode.id, {
                              routes: nextRoutes,
                            });
                          }}
                          className="w-full mt-2 rounded-lg border border-[var(--border)] py-1 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer"
                        >
                          + Add Route Rule
                        </button>
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      {/* Service Pools Mapping (supports Servers and Load Balancers) */}
                      {(() => {
                        const targetNodes = nodes.filter(
                          (n) =>
                            n.data.type === "server" ||
                            n.data.type === "load-balancer",
                        );

                        if (targetNodes.length === 0) {
                          return (
                            <div>
                              <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                                Service Pools Mapping
                              </label>
                              <p className="text-[10px] text-[color:var(--foreground)]/50 italic">
                                No servers or load balancers on the canvas. Add
                                a Server or Load Balancer first.
                              </p>
                            </div>
                          );
                        }

                        const routes =
                          nodeConfigs[selectedNode.id]?.routes || {};
                        const routeTargets = Array.from(
                          new Set(Object.values(routes)),
                        );

                        return (
                          <div className="space-y-2">
                            <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block">
                              Service Pools Mapping
                            </label>
                            <div className="space-y-2 border border-[var(--border)] rounded-lg p-2 bg-[var(--surface)]/50">
                              {targetNodes.map((targetNode) => {
                                const targetId = targetNode.id;
                                const targetLabel = String(
                                  targetNode.data.label || targetId,
                                );
                                const targetType = targetNode.data
                                  .type as string;
                                const serviceMapping =
                                  nodeConfigs[selectedNode.id]
                                    ?.serviceMapping || {};

                                const isConnectedCorrectly = edges.some(
                                  (e) =>
                                    e.source === selectedNode.id &&
                                    e.target === targetId,
                                );
                                const isConnectedBackwards = edges.some(
                                  (e) =>
                                    e.source === targetId &&
                                    e.target === selectedNode.id,
                                );
                                const isConnected =
                                  isConnectedCorrectly || isConnectedBackwards;

                                // Include targetId in dropdown choices alongside route target strings
                                const dropdownChoices = Array.from(
                                  new Set([...routeTargets, targetId]),
                                );

                                let currentVal = serviceMapping[targetId];
                                if (!currentVal) {
                                  if (
                                    routeTargets.map(String).includes(targetId)
                                  ) {
                                    currentVal = targetId;
                                  } else {
                                    const labelLower =
                                      targetLabel.toLowerCase();
                                    if (labelLower.includes("user")) {
                                      currentVal = "USER_SERVICE";
                                    } else if (labelLower.includes("post")) {
                                      currentVal = "POST_SERVICE";
                                    } else {
                                      currentVal =
                                        dropdownChoices[0] ||
                                        targetId ||
                                        "DEFAULT_SERVICE";
                                    }
                                  }
                                }

                                return (
                                  <div
                                    key={targetId}
                                    className="flex flex-col gap-1 border-b border-[var(--border)]/35 pb-2 last:border-b-0 last:pb-0"
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="text-[10px] font-medium text-[color:var(--foreground)]/70 truncate flex items-center gap-1.5">
                                        <ComponentIcon
                                          type={targetType}
                                          className="w-3.5 h-3.5"
                                        />
                                        {targetLabel}
                                      </span>
                                      {!isConnected && (
                                        <span className="text-[8px] text-amber-500 font-semibold bg-amber-500/10 px-1 rounded flex items-center gap-0.5">
                                          <FiAlertTriangle className="w-2.5 h-2.5" />
                                          <span>Unlinked</span>
                                        </span>
                                      )}
                                      {isConnectedBackwards && (
                                        <span className="text-[8px] text-rose-500 font-semibold bg-rose-500/10 px-1 rounded animate-pulse flex items-center gap-0.5">
                                          <FiAlertCircle className="w-2.5 h-2.5" />
                                          <span>Reverse</span>
                                        </span>
                                      )}
                                      {isConnectedCorrectly && (
                                        <span className="text-[8px] text-emerald-400 font-semibold bg-emerald-500/10 px-1 rounded">
                                          ✓ Linked
                                        </span>
                                      )}
                                    </div>
                                    <select
                                      value={currentVal}
                                      onChange={(e) => {
                                        const nextMapping = {
                                          ...(nodeConfigs[selectedNode.id]
                                            ?.serviceMapping || {}),
                                          [targetId]: e.target.value,
                                        };
                                        updateNodeConfig(selectedNode.id, {
                                          serviceMapping: nextMapping,
                                        });
                                      }}
                                      className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1 text-xs outline-none focus:border-violet-500 cursor-pointer"
                                    >
                                      {dropdownChoices.map((opt: any) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Redis Configuration */}
                  {selectedNode.data.type === "redis" && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-amber-400 font-mono">
                        Redis Cache Memory
                      </p>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Provider / Technology
                        </label>
                        <CustomDropdown
                          type={(selectedNode.data as any).type}
                          value={
                            ((selectedNode.data as any).flavor ||
                              getDefaultFlavor(
                                (selectedNode.data as any).type,
                              )) as string
                          }
                          onChange={(flavorId) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNodeId
                                  ? {
                                      ...n,
                                      data: { ...n.data, flavor: flavorId },
                                    }
                                  : n,
                              ),
                            );
                          }}
                        />
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      <div className="space-y-1.5">
                        <p className="text-[9px] text-[color:var(--foreground)]/65">
                          Cached Pairs
                        </p>
                        {!nodeConfigs[selectedNode.id]?.data ||
                        nodeConfigs[selectedNode.id].data.length === 0 ? (
                          <p className="text-xs italic text-[color:var(--foreground)]/50">
                            No keys stored.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                            {nodeConfigs[selectedNode.id].data.map(
                              (item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex gap-1.5 items-center"
                                >
                                  <input
                                    type="text"
                                    value={item.key}
                                    placeholder="Key"
                                    onChange={(e) => {
                                      const nextList = [
                                        ...nodeConfigs[selectedNode.id].data,
                                      ];
                                      nextList[idx].key = e.target.value;
                                      updateNodeConfig(selectedNode.id, {
                                        data: nextList,
                                      });
                                    }}
                                    className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono"
                                  />
                                  <input
                                    type="text"
                                    value={item.val}
                                    placeholder="Value"
                                    onChange={(e) => {
                                      const nextList = [
                                        ...nodeConfigs[selectedNode.id].data,
                                      ];
                                      nextList[idx].val = e.target.value;
                                      updateNodeConfig(selectedNode.id, {
                                        data: nextList,
                                      });
                                    }}
                                    className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none"
                                  />
                                  <button
                                    onClick={() => {
                                      const nextList = nodeConfigs[
                                        selectedNode.id
                                      ].data.filter(
                                        (_: any, i: number) => i !== idx,
                                      );
                                      updateNodeConfig(selectedNode.id, {
                                        data: nextList,
                                      });
                                    }}
                                    className="text-red-500 hover:text-red-600 text-xs px-1 cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const prevList =
                            nodeConfigs[selectedNode.id]?.data ?? [];
                          updateNodeConfig(selectedNode.id, {
                            data: [...prevList, { key: "", val: "" }],
                          });
                        }}
                        className="w-full rounded-lg border border-[var(--border)] py-1.5 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer"
                      >
                        + Add Cache Key
                      </button>
                    </div>
                  )}

                  {/* Postgres Configuration */}
                  {selectedNode.data.type === "postgres" && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-cyan-400 font-mono">
                        Database Records
                      </p>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Provider / Technology
                        </label>
                        <CustomDropdown
                          type={(selectedNode.data as any).type}
                          value={
                            ((selectedNode.data as any).flavor ||
                              getDefaultFlavor(
                                (selectedNode.data as any).type,
                              )) as string
                          }
                          onChange={(flavorId) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNodeId
                                  ? {
                                      ...n,
                                      data: { ...n.data, flavor: flavorId },
                                    }
                                  : n,
                              ),
                            );
                          }}
                        />
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      <div>
                        <label className="text-[9px] text-[color:var(--foreground)]/60 block mb-0.5">
                          Table Name
                        </label>
                        <input
                          type="text"
                          value={nodeConfigs[selectedNode.id]?.table ?? "users"}
                          onChange={(e) =>
                            updateNodeConfig(selectedNode.id, {
                              table: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono outline-none focus:border-violet-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[9px] text-[color:var(--foreground)]/65">
                          Row Entries (ID / Payload)
                        </p>
                        {!nodeConfigs[selectedNode.id]?.data ||
                        nodeConfigs[selectedNode.id].data.length === 0 ? (
                          <p className="text-xs italic text-[color:var(--foreground)]/50">
                            No records found.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
                            {nodeConfigs[selectedNode.id].data.map(
                              (item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex gap-1.5 items-center"
                                >
                                  <input
                                    type="text"
                                    value={item.key}
                                    placeholder="PK"
                                    onChange={(e) => {
                                      const nextList = [
                                        ...nodeConfigs[selectedNode.id].data,
                                      ];
                                      nextList[idx].key = e.target.value;
                                      updateNodeConfig(selectedNode.id, {
                                        data: nextList,
                                      });
                                    }}
                                    className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none font-mono"
                                  />
                                  <input
                                    type="text"
                                    value={item.val}
                                    placeholder="Summary"
                                    onChange={(e) => {
                                      const nextList = [
                                        ...nodeConfigs[selectedNode.id].data,
                                      ];
                                      nextList[idx].val = e.target.value;
                                      updateNodeConfig(selectedNode.id, {
                                        data: nextList,
                                      });
                                    }}
                                    className="w-1/2 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-xs outline-none"
                                  />
                                  <button
                                    onClick={() => {
                                      const nextList = nodeConfigs[
                                        selectedNode.id
                                      ].data.filter(
                                        (_: any, i: number) => i !== idx,
                                      );
                                      updateNodeConfig(selectedNode.id, {
                                        data: nextList,
                                      });
                                    }}
                                    className="text-red-500 hover:text-red-600 text-xs px-1 cursor-pointer"
                                  >
                                    ×
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const prevList =
                            nodeConfigs[selectedNode.id]?.data ?? [];
                          updateNodeConfig(selectedNode.id, {
                            data: [...prevList, { key: "", val: "" }],
                          });
                        }}
                        className="w-full rounded-lg border border-[var(--border)] py-1.5 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer mb-3"
                      >
                        + Add DB Row
                      </button>

                      {/* Connection Pool Status — shown on Postgres node when pool frames are present */}
                      {(() => {
                        const poolFrames = currentFrames.filter(
                          (f) =>
                            f.action === "POSTGRES_POOL_WAIT" ||
                            f.action === "POSTGRES_QUERY_HIT" ||
                            f.action === "POSTGRES_QUERY_MISS",
                        );
                        const poolMap = new Map<
                          string,
                          {
                            poolSize: number;
                            activeConnections: number;
                            exhausted: boolean;
                          }
                        >();
                        for (const f of poolFrames) {
                          const ps = (f as any).postgresPoolStatus;
                          if (ps && ps.serverId && ps.poolSize >= 0) {
                            poolMap.set(ps.serverId, {
                              poolSize: ps.poolSize,
                              activeConnections: ps.activeConnections,
                              exhausted: ps.exhausted,
                            });
                          }
                        }
                        if (poolMap.size === 0) return null;
                        return (
                          <div
                            className={`rounded-md border ${theme === "dark" ? "border-cyan-500/25 bg-cyan-500/5" : "border-cyan-400/30 bg-cyan-50"} p-3 mt-3`}
                          >
                            <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold font-mono mb-2.5">
                              Connection Pool Status
                            </p>
                            <div className="space-y-2.5">
                              {Array.from(poolMap.entries()).map(
                                ([serverId, info]) => {
                                  const pct =
                                    info.poolSize > 0
                                      ? Math.round(
                                          (info.activeConnections /
                                            info.poolSize) *
                                            100,
                                        )
                                      : 0;
                                  const barColor = info.exhausted
                                    ? "bg-rose-500"
                                    : pct > 70
                                      ? "bg-amber-400"
                                      : "bg-cyan-400";
                                  return (
                                    <div key={serverId}>
                                      <div className="flex items-center justify-between mb-1">
                                        <span
                                          className={`text-[10px] font-mono text-[color:var(--foreground)]/80 truncate max-w-[90px]`}
                                        >
                                          {serverId}
                                        </span>
                                        <span
                                          className={`text-[10px] font-mono font-bold ${info.exhausted ? "text-rose-400" : "text-cyan-400"}`}
                                        >
                                          {info.activeConnections}/
                                          {info.poolSize}
                                          {info.exhausted ? " [WAIT]" : ""}
                                        </span>
                                      </div>
                                      <div
                                        className={`h-1.5 w-full rounded-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"} overflow-hidden`}
                                      >
                                        <div
                                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                                          style={{
                                            width: `${Math.max(2, Math.min(pct, 100))}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* DNS Configuration */}
                  {selectedNode.data.type === "dns" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-indigo-400 font-mono">
                          DNS Domain Rules
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const domains =
                              nodeConfigs[selectedNode.id]?.domains || {};
                            const newDomain = prompt(
                              "Enter domain name (e.g., ndkdev.me):",
                            );
                            if (newDomain) {
                              updateNodeConfig(selectedNode.id, {
                                domains: {
                                  ...domains,
                                  [newDomain]: {},
                                },
                              });
                            }
                          }}
                          className="rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                        >
                          + Add Domain
                        </button>
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Provider / Technology
                        </label>
                        <CustomDropdown
                          type={(selectedNode.data as any).type}
                          value={
                            ((selectedNode.data as any).flavor ||
                              getDefaultFlavor(
                                (selectedNode.data as any).type,
                              )) as string
                          }
                          onChange={(flavorId) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNodeId
                                  ? {
                                      ...n,
                                      data: { ...n.data, flavor: flavorId },
                                    }
                                  : n,
                              ),
                            );
                          }}
                        />
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                        {Object.entries(
                          nodeConfigs[selectedNode.id]?.domains || {},
                        ).map(([domain, subdomains]: [string, any], domIdx) => (
                          <div
                            key={domIdx}
                            className="border border-[var(--border)] rounded-lg p-2 bg-[var(--surface)]/50 space-y-2 relative group/dom"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const nextDomains = {
                                  ...nodeConfigs[selectedNode.id].domains,
                                };
                                delete nextDomains[domain];
                                updateNodeConfig(selectedNode.id, {
                                  domains: nextDomains,
                                });
                              }}
                              className="absolute top-1.5 right-2 text-rose-500 hover:text-rose-600 text-[9px] font-bold cursor-pointer opacity-40 group-hover/dom:opacity-100 transition"
                              title="Delete Domain"
                            >
                              Delete ×
                            </button>

                            <p className="text-[10px] font-bold text-primary font-mono">
                              host: {domain}
                            </p>

                            <div className="space-y-2 pl-1.5 border-l border-[var(--border)]">
                              {Object.entries(subdomains || {}).map(
                                ([sub, subData]: [string, any], subIdx) => (
                                  <div
                                    key={subIdx}
                                    className="bg-[var(--surface)] p-2 rounded border border-[var(--border)]/45 space-y-1.5 relative group/sub"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextDomains = {
                                          ...nodeConfigs[selectedNode.id]
                                            .domains,
                                        };
                                        const nextSubs = {
                                          ...nextDomains[domain],
                                        };
                                        delete nextSubs[sub];
                                        nextDomains[domain] = nextSubs;
                                        updateNodeConfig(selectedNode.id, {
                                          domains: nextDomains,
                                        });
                                      }}
                                      className="absolute top-1 right-1 text-rose-500 hover:text-rose-600 text-xs font-bold cursor-pointer opacity-30 group-hover/sub:opacity-100 transition"
                                      title="Delete Record"
                                    >
                                      ×
                                    </button>

                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div>
                                        <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                          Subdomain
                                        </label>
                                        <input
                                          type="text"
                                          value={sub}
                                          onChange={(e) => {
                                            const nextDomains = {
                                              ...nodeConfigs[selectedNode.id]
                                                .domains,
                                            };
                                            const nextSubs = {
                                              ...nextDomains[domain],
                                            };
                                            const valObj = nextSubs[sub];
                                            delete nextSubs[sub];
                                            nextSubs[e.target.value] = valObj;
                                            nextDomains[domain] = nextSubs;
                                            updateNodeConfig(selectedNode.id, {
                                              domains: nextDomains,
                                            });
                                          }}
                                          className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-mono outline-none"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                          Record Type
                                        </label>
                                        <select
                                          value={subData.typeOfRecord || "A"}
                                          onChange={(e) => {
                                            const nextDomains = {
                                              ...nodeConfigs[selectedNode.id]
                                                .domains,
                                            };
                                            nextDomains[domain][
                                              sub
                                            ].typeOfRecord = e.target.value;
                                            updateNodeConfig(selectedNode.id, {
                                              domains: nextDomains,
                                            });
                                          }}
                                          className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-[10px] outline-none cursor-pointer"
                                        >
                                          {[
                                            "A",
                                            "AAAA",
                                            "CNAME",
                                            "MX",
                                            "PTR",
                                            "SOA",
                                            "SRV",
                                            "TXT",
                                            "ANY",
                                          ].map((t) => (
                                            <option key={t} value={t}>
                                              {t}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div>
                                        <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                          Target Node
                                        </label>
                                        <select
                                          value={subData.to || ""}
                                          onChange={(e) => {
                                            const nextDomains = {
                                              ...nodeConfigs[selectedNode.id]
                                                .domains,
                                            };
                                            nextDomains[domain][sub].to =
                                              e.target.value;
                                            updateNodeConfig(selectedNode.id, {
                                              domains: nextDomains,
                                            });
                                          }}
                                          className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1 py-0.5 text-[10px] outline-none cursor-pointer"
                                        >
                                          <option value="">
                                            -- Target Node --
                                          </option>
                                          {nodes.map((n) => (
                                            <option key={n.id} value={n.id}>
                                              {String(n.data.label || n.id)}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[8px] text-[color:var(--foreground)]/50 block">
                                          IP Address
                                        </label>
                                        <input
                                          type="text"
                                          value={subData.ip || ""}
                                          onChange={(e) => {
                                            const nextDomains = {
                                              ...nodeConfigs[selectedNode.id]
                                                .domains,
                                            };
                                            nextDomains[domain][sub].ip =
                                              e.target.value;
                                            updateNodeConfig(selectedNode.id, {
                                              domains: nextDomains,
                                            });
                                          }}
                                          className="w-full rounded border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-mono outline-none"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ),
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  const nextDomains = {
                                    ...nodeConfigs[selectedNode.id].domains,
                                  };
                                  const subCount = Object.keys(
                                    subdomains || {},
                                  ).length;
                                  nextDomains[domain][
                                    `subdomain${subCount + 1}`
                                  ] = {
                                    to: "",
                                    ip: "192.168.1.1",
                                    typeOfRecord: "A",
                                  };
                                  updateNodeConfig(selectedNode.id, {
                                    domains: nextDomains,
                                  });
                                }}
                                className="w-full py-1 text-center border border-dashed border-[var(--border)] hover:bg-[var(--surface)] text-[9px] font-bold text-indigo-400/80 rounded transition cursor-pointer"
                              >
                                + Add Record Rule
                              </button>
                            </div>
                          </div>
                        ))}
                        {Object.keys(
                          nodeConfigs[selectedNode.id]?.domains || {},
                        ).length === 0 && (
                          <p className="text-xs italic text-[color:var(--foreground)]/50">
                            No domains added yet. Click Add Domain above.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* CDN Configuration */}
                  {selectedNode.data.type === "cdn" && (
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-teal-400 font-mono">
                        CDN Settings
                      </p>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Provider / Technology
                        </label>
                        <CustomDropdown
                          type={(selectedNode.data as any).type}
                          value={
                            ((selectedNode.data as any).flavor ||
                              getDefaultFlavor(
                                (selectedNode.data as any).type,
                              )) as string
                          }
                          onChange={(flavorId) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNodeId
                                  ? {
                                      ...n,
                                      data: { ...n.data, flavor: flavorId },
                                    }
                                  : n,
                              ),
                            );
                          }}
                        />
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                          Origin Server / Storage
                        </label>
                        <select
                          value={nodeConfigs[selectedNode.id]?.originId ?? ""}
                          onChange={(e) =>
                            updateNodeConfig(selectedNode.id, {
                              originId: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-teal-500 cursor-pointer"
                        >
                          <option value="">-- Select Origin --</option>
                          {nodes
                            .filter(
                              (n) =>
                                n.id !== selectedNode.id &&
                                (n.data.type === "server" ||
                                  n.data.type === "storage"),
                            )
                            .map((n) => (
                              <option key={n.id} value={n.id}>
                                {String(n.data.label || n.id)} (
                                {String(n.data.type || "")})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      <div>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 mb-2">
                          Cached Keys (Static Content)
                        </p>
                        {!nodeConfigs[selectedNode.id]?.cache ||
                        nodeConfigs[selectedNode.id].cache.length === 0 ? (
                          <p className="text-xs italic text-[color:var(--foreground)]/50">
                            CDN Cache is empty.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                            {(nodeConfigs[selectedNode.id]?.cache || []).map(
                              (item: string, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex gap-2 items-center"
                                >
                                  <input
                                    type="text"
                                    value={item}
                                    placeholder="Cache Key (e.g. file.png)"
                                    onChange={(e) => {
                                      const nextCache = [
                                        ...nodeConfigs[selectedNode.id].cache,
                                      ];
                                      nextCache[idx] = e.target.value;
                                      updateNodeConfig(selectedNode.id, {
                                        cache: nextCache,
                                      });
                                    }}
                                    className="flex-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none font-mono focus:border-teal-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const nextCache = nodeConfigs[
                                        selectedNode.id
                                      ].cache.filter(
                                        (_: any, i: number) => i !== idx,
                                      );
                                      updateNodeConfig(selectedNode.id, {
                                        cache: nextCache,
                                      });
                                    }}
                                    className="text-rose-500 hover:text-rose-600 text-xs px-1 cursor-pointer font-bold"
                                  >
                                    ×
                                  </button>
                                </div>
                              ),
                            )}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const prevCache =
                              nodeConfigs[selectedNode.id]?.cache ?? [];
                            updateNodeConfig(selectedNode.id, {
                              cache: [...prevCache, ""],
                            });
                          }}
                          className="w-full mt-2 rounded-lg border border-[var(--border)] py-1 text-center text-xs hover:bg-[var(--surface)] transition font-semibold cursor-pointer"
                        >
                          + Add Cache Item
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Server Specific Configuration */}
                  {selectedNode.data.type === "server" && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-emerald-400 font-mono">
                        Server Settings
                      </p>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Runtime / Technology
                        </label>
                        <CustomDropdown
                          type={(selectedNode.data as any).type}
                          value={
                            ((selectedNode.data as any).flavor ||
                              getDefaultFlavor(
                                (selectedNode.data as any).type,
                              )) as string
                          }
                          onChange={(flavorId) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNodeId
                                  ? {
                                      ...n,
                                      data: { ...n.data, flavor: flavorId },
                                    }
                                  : n,
                              ),
                            );
                          }}
                        />
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      <div>
                        <label className="text-[9px] text-[color:var(--foreground)]/60 block mb-0.5">
                          Connections Capacity
                        </label>
                        <input
                          type="number"
                          value={nodeConfigs[selectedNode.id]?.capacity ?? 100}
                          onChange={(e) =>
                            updateNodeConfig(selectedNode.id, {
                              capacity: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-violet-500"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-[color:var(--foreground)]/60 block mb-0.5">
                          TCP Connections to Postgres
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={200}
                            value={
                              nodeConfigs[selectedNode.id]?.tcpConnections ?? 10
                            }
                            onChange={(e) =>
                              updateNodeConfig(selectedNode.id, {
                                tcpConnections: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-cyan-500"
                          />
                          <span className="text-[10px] text-[color:var(--foreground)]/45 shrink-0 font-mono">
                            conns
                          </span>
                        </div>
                        <p className="mt-1 text-[9px] text-[color:var(--foreground)]/40 leading-relaxed">
                          Pool size for parallel Postgres queries. 0 = no
                          connections (blocks queries).
                        </p>
                      </div>

                      {edges.some(
                        (e) =>
                          e.target === selectedNode.id &&
                          nodes.find((node) => node.id === e.source)?.data
                            .type === "message-queue",
                      ) && (
                        <div className="mt-3">
                          <label className="text-[9px] text-[color:var(--foreground)]/60 block mb-0.5">
                            Prefetch Limit (Competing Consumers)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={
                              nodeConfigs[selectedNode.id]?.prefetchLimit ?? 1
                            }
                            onChange={(e) =>
                              updateNodeConfig(selectedNode.id, {
                                prefetchLimit: Number(e.target.value),
                              })
                            }
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-pink-500"
                          />
                          <p className="mt-1 text-[9px] text-[color:var(--foreground)]/40 leading-relaxed">
                            Max concurrent messages this consumer can pull from
                            the queue.
                          </p>
                        </div>
                      )}

                      {edges.some(
                        (e) =>
                          e.target === selectedNode.id &&
                          nodes.find((node) => node.id === e.source)?.data
                            .type === "pubsub",
                      ) && (
                        <div className="mt-3 space-y-2">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                            Subscription Topics / Channels
                          </label>

                          {(() => {
                            const topics =
                              nodeConfigs[selectedNode.id]
                                ?.subscriptionTopics ||
                              (nodeConfigs[selectedNode.id]?.subscriptionTopic
                                ? [
                                    nodeConfigs[selectedNode.id]
                                      .subscriptionTopic,
                                  ]
                                : ["order.created"]);

                            return (
                              <div className="space-y-2">
                                {topics.map((topic: string, index: number) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-1.5"
                                  >
                                    <input
                                      type="text"
                                      value={topic}
                                      onChange={(e) => {
                                        const nextTopics = [...topics];
                                        nextTopics[index] = e.target.value;
                                        updateNodeConfig(selectedNode.id, {
                                          subscriptionTopics: nextTopics,
                                          subscriptionTopic:
                                            nextTopics[0] || "",
                                        });
                                      }}
                                      className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 font-mono text-[color:var(--foreground)]"
                                      placeholder="e.g. order.created"
                                    />
                                    {topics.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextTopics = topics.filter(
                                            (_: any, i: number) => i !== index,
                                          );
                                          updateNodeConfig(selectedNode.id, {
                                            subscriptionTopics: nextTopics,
                                            subscriptionTopic:
                                              nextTopics[0] || "",
                                          });
                                        }}
                                        className="text-rose-500 hover:text-rose-600 text-xs px-2 font-bold cursor-pointer transition-colors"
                                        title="Remove Topic"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                ))}

                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextTopics = [
                                      ...topics,
                                      `topic-${topics.length + 1}`,
                                    ];
                                    updateNodeConfig(selectedNode.id, {
                                      subscriptionTopics: nextTopics,
                                      subscriptionTopic: nextTopics[0] || "",
                                    });
                                  }}
                                  className="w-full mt-1.5 rounded-lg border border-[var(--border)] py-1 text-center text-[10px] hover:bg-[var(--surface)] transition font-semibold cursor-pointer text-[color:var(--foreground)]/70 hover:text-[color:var(--foreground)]"
                                >
                                  + Add Topic / Channel
                                </button>
                              </div>
                            );
                          })()}
                          <p className="mt-1 text-[9px] text-[color:var(--foreground)]/40 leading-relaxed">
                            Topics/channels this server subscribes to on the
                            Pub/Sub broker.
                          </p>
                        </div>
                      )}

                      <div className="h-px bg-[var(--border)]/70 my-2" />

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block">
                            Exposed Endpoints & Pipelines
                          </label>
                        </div>
                        {(() => {
                          const downstreamNodes = edges
                            .filter((e) => e.source === selectedNode.id)
                            .map((e) => {
                              const targetNode = nodes.find((n) => n.id === e.target);
                              return {
                                id: e.target,
                                label: (targetNode?.data?.label as string) || e.target,
                                type: (targetNode?.data?.type as string) || "node",
                              };
                            });

                          const endpointsObj =
                            nodeConfigs[selectedNode.id]?.endpoints || {};
                          const endpointEntries = Object.entries(endpointsObj);

                          return (
                            <div className="space-y-2.5">
                              {endpointEntries.map(([path, methods]: [string, any], idx) => {
                                const allHttpMethods = [
                                  "GET",
                                  "POST",
                                  "PUT",
                                  "DELETE",
                                  "PATCH",
                                ];
                                const isExpanded =
                                  expandedEndpoint === path ||
                                  (expandedEndpoint === null && idx === 0);

                                const currentPipelines =
                                  nodeConfigs[selectedNode.id]?.endpointPipelines || {};
                                const currentPipeline: string[] =
                                  currentPipelines[path] || [];

                                const currentPolicies =
                                  nodeConfigs[selectedNode.id]?.endpointPipelinePolicies || {};
                                const currentPolicy =
                                  currentPolicies[path] || {};

                                const firstMethod = (methods || [])[0] || "GET";

                                // Detect preset pattern
                                const redisNode = downstreamNodes.find((n) => n.type === "redis");
                                const pgNode = downstreamNodes.find((n) => n.type === "postgres");

                                const isCacheAside =
                                  currentPipeline.length === 2 &&
                                  redisNode &&
                                  pgNode &&
                                  currentPipeline[0] === redisNode.id &&
                                  currentPipeline[1] === pgNode.id &&
                                  Boolean(currentPolicy.stopOnCacheHit);

                                const isStrictSequence =
                                  currentPipeline.length === 2 &&
                                  redisNode &&
                                  pgNode &&
                                  currentPipeline[0] === redisNode.id &&
                                  currentPipeline[1] === pgNode.id &&
                                  !currentPolicy.stopOnCacheHit;

                                const isDirectDb =
                                  currentPipeline.length === 1 &&
                                  pgNode &&
                                  currentPipeline[0] === pgNode.id;

                                const isWriteThrough =
                                  currentPipeline.length === 2 &&
                                  redisNode &&
                                  pgNode &&
                                  currentPipeline[0] === pgNode.id &&
                                  currentPipeline[1] === redisNode.id;

                                let currentPreset = "custom";
                                if (currentPipeline.length === 0) currentPreset = "auto";
                                else if (isCacheAside) currentPreset = "cache-aside";
                                else if (isStrictSequence) currentPreset = "strict-sequence";
                                else if (isDirectDb) currentPreset = "direct-db";
                                else if (isWriteThrough) currentPreset = "write-through";

                                return (
                                  <div
                                    key={idx}
                                    className={`border rounded-xl transition-all duration-150 overflow-hidden ${
                                      isExpanded
                                        ? "border-[var(--accent)]/50 bg-[var(--surface)] shadow-xs"
                                        : "border-[var(--border)] bg-[var(--surface)]/70 hover:border-[var(--border)]"
                                    }`}
                                  >
                                    {/* ── Collapsed Header Summary ── */}
                                    <div
                                      onClick={() =>
                                        setExpandedEndpoint(isExpanded ? "" : path)
                                      }
                                      className="p-2.5 flex items-center justify-between gap-2 cursor-pointer select-none group/hdr hover:bg-[var(--surface-muted)]/50 transition"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-[var(--border)] bg-[var(--surface-muted)] text-[color:var(--foreground)] shrink-0">
                                          {firstMethod}
                                        </span>
                                        <span className="text-xs font-mono font-medium text-[color:var(--foreground)] truncate">
                                          {path}
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {/* Mini Pipeline Preview Badge */}
                                        {currentPipeline.length > 0 ? (
                                          <div className="flex items-center gap-1 bg-[var(--surface-muted)] px-1.5 py-0.5 rounded text-[9px] font-mono text-[color:var(--foreground)]/70 border border-[var(--border)]">
                                            {currentPipeline.map((nid, pIdx) => {
                                              const nObj = nodes.find((n) => n.id === nid);
                                              const displayLabel = String(nObj?.data?.label || nid);
                                              return (
                                                <Fragment key={pIdx}>
                                                  {pIdx > 0 && <FiChevronRight className="size-2.5 opacity-40 shrink-0" />}
                                                  <span className="font-semibold">{displayLabel}</span>
                                                </Fragment>
                                              );
                                            })}
                                            {currentPolicy.stopOnCacheHit && (
                                              <span className="opacity-70 ml-0.5" title="Stops on Cache Hit">⚡</span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-[9px] font-mono text-[color:var(--foreground)]/40 px-1">
                                            Auto
                                          </span>
                                        )}

                                        <span className="text-[10px] text-[color:var(--foreground)]/40 group-hover/hdr:text-[color:var(--foreground)] px-1">
                                          {isExpanded ? "▲" : "▼"}
                                        </span>

                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const nextEndpoints = { ...endpointsObj };
                                            delete nextEndpoints[path];
                                            const nextPipes = { ...currentPipelines };
                                            delete nextPipes[path];
                                            const nextPols = { ...currentPolicies };
                                            delete nextPols[path];
                                            updateNodeConfig(selectedNode.id, {
                                              endpoints: nextEndpoints,
                                              endpointPipelines: nextPipes,
                                              endpointPipelinePolicies: nextPols,
                                            });
                                          }}
                                          className="text-[color:var(--foreground)]/40 hover:text-rose-500 hover:bg-rose-500/10 text-xs font-bold px-1 rounded transition cursor-pointer"
                                          title="Delete Endpoint"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>

                                    {/* ── Expanded Configuration Body ── */}
                                    {isExpanded && (
                                      <div className="p-3 border-t border-[var(--border)] space-y-3 bg-[var(--surface-muted)]/20">
                                        {/* Route Path Input */}
                                        <div>
                                          <label className="text-[9px] uppercase tracking-wider font-bold text-[color:var(--foreground)]/60 block mb-1">
                                            Route Path
                                          </label>
                                          <input
                                            type="text"
                                            value={path}
                                            placeholder="/api/v1/resource"
                                            onChange={(e) => {
                                              const newPath = e.target.value;
                                              const nextEndpoints: Record<string, any> = {};
                                              const nextPipes: Record<string, string[]> = {};
                                              const nextPols: Record<string, any> = {};

                                              for (const [k, v] of Object.entries(endpointsObj)) {
                                                if (k === path) {
                                                  nextEndpoints[newPath] = v;
                                                  if (currentPipelines[k]) nextPipes[newPath] = currentPipelines[k];
                                                  if (currentPolicies[k]) nextPols[newPath] = currentPolicies[k];
                                                } else {
                                                  nextEndpoints[k] = v;
                                                  if (currentPipelines[k]) nextPipes[k] = currentPipelines[k];
                                                  if (currentPolicies[k]) nextPols[k] = currentPolicies[k];
                                                }
                                              }

                                              updateNodeConfig(selectedNode.id, {
                                                endpoints: nextEndpoints,
                                                endpointPipelines: nextPipes,
                                                endpointPipelinePolicies: nextPols,
                                              });
                                              setExpandedEndpoint(newPath);
                                            }}
                                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs font-mono outline-none focus:border-[var(--accent)] text-[color:var(--foreground)]"
                                          />
                                        </div>

                                        {/* Allowed HTTP Methods */}
                                        <div>
                                          <label className="text-[9px] uppercase tracking-wider font-bold text-[color:var(--foreground)]/60 block mb-1.5">
                                            Allowed Methods
                                          </label>
                                          <div className="flex flex-wrap gap-1">
                                            {allHttpMethods.map((m) => {
                                              const curM = methods || [];
                                              const isSelected = curM.includes(m);
                                              return (
                                                <button
                                                  key={m}
                                                  type="button"
                                                  onClick={() => {
                                                    const nextEndpoints = { ...endpointsObj };
                                                    const updated = isSelected
                                                      ? curM.filter((x: string) => x !== m)
                                                      : [...curM, m];
                                                    nextEndpoints[path] = updated;
                                                    updateNodeConfig(selectedNode.id, {
                                                      endpoints: nextEndpoints,
                                                    });
                                                  }}
                                                  className={`text-[9px] px-2 py-0.5 rounded font-mono font-medium transition cursor-pointer border ${
                                                    isSelected
                                                      ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-2xs"
                                                      : "bg-[var(--surface)] border-[var(--border)] text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)]"
                                                  }`}
                                                >
                                                  {m}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>

                                        {/* ── Architecture Presets Option Box ── */}
                                        <div className="pt-2 border-t border-[var(--border)]/60">
                                          <label className="text-[9px] uppercase tracking-wider font-bold text-[color:var(--foreground)]/60 block mb-1.5">
                                            Pipeline Preset
                                          </label>
                                          <PipelinePresetDropdown
                                            value={currentPreset}
                                            onChange={(val) => {
                                              if (val === "cache-aside" && redisNode && pgNode) {
                                                const pipes = { ...currentPipelines, [path]: [redisNode.id, pgNode.id] };
                                                const pols = { ...currentPolicies, [path]: { stopOnCacheHit: true } };
                                                updateNodeConfig(selectedNode.id, {
                                                  endpointPipelines: pipes,
                                                  endpointPipelinePolicies: pols,
                                                });
                                              } else if (val === "strict-sequence" && redisNode && pgNode) {
                                                const pipes = { ...currentPipelines, [path]: [redisNode.id, pgNode.id] };
                                                const pols = { ...currentPolicies, [path]: { stopOnCacheHit: false } };
                                                updateNodeConfig(selectedNode.id, {
                                                  endpointPipelines: pipes,
                                                  endpointPipelinePolicies: pols,
                                                });
                                              } else if (val === "direct-db" && pgNode) {
                                                const pipes = { ...currentPipelines, [path]: [pgNode.id] };
                                                const pols = { ...currentPolicies, [path]: { stopOnCacheHit: false } };
                                                updateNodeConfig(selectedNode.id, {
                                                  endpointPipelines: pipes,
                                                  endpointPipelinePolicies: pols,
                                                });
                                              } else if (val === "write-through" && redisNode && pgNode) {
                                                const pipes = { ...currentPipelines, [path]: [pgNode.id, redisNode.id] };
                                                const pols = { ...currentPolicies, [path]: { stopOnCacheHit: false } };
                                                updateNodeConfig(selectedNode.id, {
                                                  endpointPipelines: pipes,
                                                  endpointPipelinePolicies: pols,
                                                });
                                              } else if (val === "auto") {
                                                const pipes = { ...currentPipelines };
                                                delete pipes[path];
                                                const pols = { ...currentPolicies };
                                                delete pols[path];
                                                updateNodeConfig(selectedNode.id, {
                                                  endpointPipelines: pipes,
                                                  endpointPipelinePolicies: pols,
                                                });
                                              }
                                            }}
                                          />
                                        </div>

                                        {/* ── Vertical Pipeline Stepper ── */}
                                        <div className="pt-2 border-t border-[var(--border)]/60">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-[9px] uppercase tracking-wider font-bold text-[color:var(--foreground)]/60">
                                              Execution Flow
                                            </span>
                                            <span className="text-[9px] font-mono text-[color:var(--foreground)]/40">
                                              {currentPipeline.length > 0
                                                ? `${currentPipeline.length} Hop${currentPipeline.length > 1 ? "s" : ""}`
                                                : "Auto"}
                                            </span>
                                          </div>

                                          {/* Step 0: Origin Server */}
                                          <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[10px] font-mono text-[color:var(--foreground)] shadow-2xs">
                                              <div className="size-6 rounded-md bg-[var(--surface-muted)] text-[color:var(--foreground)]/70 flex items-center justify-center shrink-0 border border-[var(--border)]">
                                                <ComponentIcon type="server" className="size-3.5" />
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <span className="font-semibold text-[color:var(--foreground)]">
                                                  {(selectedNode.data?.label as string) || "Server"}
                                                </span>
                                              </div>
                                              <span className="text-[9px] font-mono text-[color:var(--foreground)]/50 bg-[var(--surface-muted)] px-1.5 py-0.5 rounded border border-[var(--border)] shrink-0">
                                                Origin
                                              </span>
                                            </div>

                                            {/* Sequence Steps */}
                                            {currentPipeline.map((stepNodeId, stepIdx) => {
                                              const stepNode = nodes.find((n) => n.id === stepNodeId);
                                              const stepLabel = String((stepNode?.data?.label as string) || stepNodeId);
                                              const stepType = (stepNode?.data?.type as string) || "node";

                                              return (
                                                <Fragment key={stepIdx}>
                                                  {/* Flow connector line */}
                                                  <div className="flex items-center justify-center h-2.5">
                                                    <div className="w-px h-full bg-[var(--border)]" />
                                                  </div>

                                                  <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 shadow-2xs space-y-1.5">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                      <span className="size-4 rounded bg-[var(--surface-muted)] text-[color:var(--foreground)]/70 font-mono text-[8px] font-bold flex items-center justify-center shrink-0 border border-[var(--border)]">
                                                        {stepIdx + 1}
                                                      </span>
                                                      <div className="size-6 rounded-md bg-[var(--surface-muted)] text-[color:var(--foreground)]/70 flex items-center justify-center shrink-0 border border-[var(--border)]">
                                                        <ComponentIcon type={stepType} className="size-3.5" />
                                                      </div>
                                                      <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 truncate">
                                                          <span className="text-xs font-medium text-[color:var(--foreground)] truncate">
                                                            {stepLabel}
                                                          </span>
                                                          <span className="text-[8px] font-mono text-[color:var(--foreground)]/40 uppercase">
                                                            ({stepNodeId})
                                                          </span>
                                                        </div>
                                                      </div>

                                                      {/* Reorder and Delete controls */}
                                                      <div className="flex items-center gap-0.5 shrink-0">
                                                        <button
                                                          type="button"
                                                          disabled={stepIdx === 0}
                                                          onClick={() => {
                                                            const nextPipe = [...currentPipeline];
                                                            const temp = nextPipe[stepIdx - 1];
                                                            nextPipe[stepIdx - 1] = nextPipe[stepIdx];
                                                            nextPipe[stepIdx] = temp;
                                                            const pipes = { ...currentPipelines, [path]: nextPipe };
                                                            updateNodeConfig(selectedNode.id, { endpointPipelines: pipes });
                                                          }}
                                                          className="size-5 rounded hover:bg-[var(--surface-muted)] text-[10px] text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] disabled:opacity-20 flex items-center justify-center cursor-pointer"
                                                          title="Move Up"
                                                        >
                                                          ↑
                                                        </button>
                                                        <button
                                                          type="button"
                                                          disabled={stepIdx === currentPipeline.length - 1}
                                                          onClick={() => {
                                                            const nextPipe = [...currentPipeline];
                                                            const temp = nextPipe[stepIdx + 1];
                                                            nextPipe[stepIdx + 1] = nextPipe[stepIdx];
                                                            nextPipe[stepIdx] = temp;
                                                            const pipes = { ...currentPipelines, [path]: nextPipe };
                                                            updateNodeConfig(selectedNode.id, { endpointPipelines: pipes });
                                                          }}
                                                          className="size-5 rounded hover:bg-[var(--surface-muted)] text-[10px] text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] disabled:opacity-20 flex items-center justify-center cursor-pointer"
                                                          title="Move Down"
                                                        >
                                                          ↓
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const nextPipe = currentPipeline.filter((_, i) => i !== stepIdx);
                                                            const pipes = { ...currentPipelines };
                                                            if (nextPipe.length === 0) {
                                                              delete pipes[path];
                                                            } else {
                                                              pipes[path] = nextPipe;
                                                            }
                                                            updateNodeConfig(selectedNode.id, { endpointPipelines: pipes });
                                                          }}
                                                          className="size-5 rounded hover:bg-[var(--surface-muted)] text-[color:var(--foreground)]/40 hover:text-rose-500 text-xs font-bold flex items-center justify-center cursor-pointer ml-0.5 transition-colors"
                                                          title="Remove Hop"
                                                        >
                                                          ✕
                                                        </button>
                                                      </div>
                                                    </div>

                                                    {/* Redis Stop-on-Hit Toggle */}
                                                    {stepType === "redis" && (
                                                      <div className="pt-1.5 border-t border-[var(--border)]/40 flex items-center justify-between text-[8px]">
                                                        <span className="text-[color:var(--foreground)]/60 font-mono">
                                                          Cache Hit Rule:
                                                        </span>
                                                        <button
                                                          type="button"
                                                          onClick={() => {
                                                            const cur = Boolean(currentPolicy.stopOnCacheHit);
                                                            const pols = {
                                                              ...currentPolicies,
                                                              [path]: { stopOnCacheHit: !cur },
                                                            };
                                                            updateNodeConfig(selectedNode.id, {
                                                              endpointPipelinePolicies: pols,
                                                            });
                                                          }}
                                                          className={`px-1.5 py-0.5 rounded font-mono font-medium border transition cursor-pointer flex items-center gap-1 ${
                                                            currentPolicy.stopOnCacheHit
                                                              ? "bg-[var(--surface-muted)] border-[var(--border)] text-[color:var(--foreground)]"
                                                              : "bg-[var(--surface)] border-[var(--border)] text-[color:var(--foreground)]/60"
                                                          }`}
                                                        >
                                                          {currentPolicy.stopOnCacheHit ? (
                                                            <>
                                                              <span>⚡</span>
                                                              <span>Stop on Hit (Cache-Aside)</span>
                                                            </>
                                                          ) : (
                                                            <>
                                                              <span>➜</span>
                                                              <span>Always Continue</span>
                                                            </>
                                                          )}
                                                        </button>
                                                      </div>
                                                    )}
                                                  </div>
                                                </Fragment>
                                              );
                                            })}

                                            {/* Terminal Step: Client Response */}
                                            <div className="flex items-center justify-center h-2.5">
                                              <div className="w-px h-full bg-[var(--border)]" />
                                            </div>
                                            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[10px] font-mono text-[color:var(--foreground)] shadow-2xs">
                                              <div className="size-6 rounded-md bg-[var(--surface-muted)] text-[color:var(--foreground)]/70 flex items-center justify-center shrink-0 border border-[var(--border)]">
                                                ✓
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <span className="font-semibold text-[color:var(--foreground)]">
                                                  Client Response
                                                </span>
                                              </div>
                                              <span className="text-[8px] font-mono text-[color:var(--foreground)]/60 bg-[var(--surface-muted)] px-1.5 py-0.5 rounded border border-[var(--border)] shrink-0">
                                                200 OK
                                              </span>
                                            </div>
                                          </div>

                                          {/* Add Hop Option Box (Select Dropdown) */}
                                          <div className="pt-2 mt-2 border-t border-[var(--border)]/60 space-y-1.5">
                                            <label className="text-[9px] uppercase tracking-wider font-bold text-[color:var(--foreground)]/60 block">
                                              Append Service Hop
                                            </label>
                                            <div className="flex items-center gap-1.5">
                                              <select
                                                value=""
                                                onChange={(e) => {
                                                  const nextId = e.target.value;
                                                  if (!nextId) return;
                                                  const nextPipe = [...currentPipeline, nextId];
                                                  const pipes = { ...currentPipelines, [path]: nextPipe };
                                                  updateNodeConfig(selectedNode.id, { endpointPipelines: pipes });
                                                }}
                                                disabled={downstreamNodes.length === 0}
                                                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-[var(--accent)] text-[color:var(--foreground)] cursor-pointer disabled:opacity-50"
                                              >
                                                <option value="">
                                                  {downstreamNodes.length === 0
                                                    ? "No connected downstream nodes"
                                                    : "+ Select service to append..."}
                                                </option>
                                                {downstreamNodes.map((n) => {
                                                  const count = currentPipeline.filter((id) => id === n.id).length;
                                                  return (
                                                    <option key={n.id} value={n.id}>
                                                      {n.label} ({n.id}) - {n.type.toUpperCase()} {count > 0 ? `[Hop ${count + 1}]` : ""}
                                                    </option>
                                                  );
                                                })}
                                              </select>

                                              {currentPipeline.length > 0 && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const pipes = { ...currentPipelines };
                                                    delete pipes[path];
                                                    const pols = { ...currentPolicies };
                                                    delete pols[path];
                                                    updateNodeConfig(selectedNode.id, {
                                                      endpointPipelines: pipes,
                                                      endpointPipelinePolicies: pols,
                                                    });
                                                  }}
                                                  className="text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] transition cursor-pointer shrink-0 font-medium"
                                                  title="Reset to default auto-discovery"
                                                >
                                                  Reset
                                                </button>
                                              )}
                                            </div>
                                            {downstreamNodes.length === 0 && (
                                              <p className="text-[8px] text-[color:var(--foreground)]/40 italic">
                                                Connect this server to other services (Redis, Postgres, Queue) on the canvas to add pipeline hops.
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                        <button
                          type="button"
                          onClick={() => {
                            const endpoints =
                              nodeConfigs[selectedNode.id]?.endpoints || {};
                            const nextEndpoints = {
                              ...endpoints,
                              [`/api/v1/endpoint-${Object.keys(endpoints).length + 1}`]:
                                ["GET"],
                            };
                            updateNodeConfig(selectedNode.id, {
                              endpoints: nextEndpoints,
                            });
                          }}
                          className="w-full mt-2 rounded-lg border border-[var(--border)] py-1.5 text-center text-xs hover:bg-[var(--surface-muted)] transition font-medium cursor-pointer"
                        >
                          + Add Endpoint Rule
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedNode.data.type === "message-queue" && (
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-pink-400 font-mono">
                        Message Queue Settings
                      </p>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Provider / Broker
                        </label>
                        <CustomDropdown
                          type={(selectedNode.data as any).type}
                          value={
                            ((selectedNode.data as any).flavor ||
                              getDefaultFlavor(
                                (selectedNode.data as any).type,
                              )) as string
                          }
                          onChange={(flavorId) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNodeId
                                  ? {
                                      ...n,
                                      data: { ...n.data, flavor: flavorId },
                                    }
                                  : n,
                              ),
                            );
                          }}
                        />
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                          Processing Type
                        </label>
                        <select
                          value={
                            nodeConfigs[selectedNode.id]?.processingType ??
                            "FIFO"
                          }
                          onChange={(e) =>
                            updateNodeConfig(selectedNode.id, {
                              processingType: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-pink-500 cursor-pointer text-[color:var(--foreground)]"
                        >
                          <option value="FIFO">
                            FIFO (First In, First Out)
                          </option>
                          <option value="LIFO">
                            LIFO (Last In, First Out)
                          </option>
                          <option value="PRIORITY">
                            PRIORITY (Priority Queue)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-[color:var(--foreground)]/60 block mb-0.5">
                          Queue Size Limit
                        </label>
                        <input
                          type="number"
                          value={nodeConfigs[selectedNode.id]?.queueSize ?? 10}
                          onChange={(e) =>
                            updateNodeConfig(selectedNode.id, {
                              queueSize: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-pink-500"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                          Overflow Behavior
                        </label>
                        <select
                          value={
                            nodeConfigs[selectedNode.id]?.overflowBehavior ??
                            "REJECT"
                          }
                          onChange={(e) =>
                            updateNodeConfig(selectedNode.id, {
                              overflowBehavior: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 text-xs outline-none focus:border-pink-500 cursor-pointer text-[color:var(--foreground)]"
                        >
                          <option value="REJECT">
                            Reject (Immediate Error)
                          </option>
                          <option value="BLOCK">
                            Block Producer (Wait for consumer)
                          </option>
                          <option value="UNLIMITED">
                            Unlimited Size (No limit)
                          </option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Pub/Sub Broker Configuration */}
                  {selectedNode.data.type === "pubsub" && (
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-indigo-400 font-mono">
                        Pub/Sub Broker Settings
                      </p>

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-2">
                          Provider / Technology
                        </label>
                        <CustomDropdown
                          type={selectedNode.data.type}
                          value={
                            ((selectedNode.data as any).flavor ||
                              getDefaultFlavor(
                                selectedNode.data.type,
                              )) as string
                          }
                          onChange={(flavorId) => {
                            setNodes((nds) =>
                              nds.map((n) =>
                                n.id === selectedNodeId
                                  ? {
                                      ...n,
                                      data: { ...n.data, flavor: flavorId },
                                    }
                                  : n,
                              ),
                            );
                          }}
                        />
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      <div>
                        <label className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 block mb-1">
                          Active Subscribers (Connected)
                        </label>
                        {(() => {
                          const subscriberEdges = edges.filter(
                            (e) => e.source === selectedNode.id,
                          );
                          if (subscriberEdges.length === 0) {
                            return (
                              <p className="text-[10px] text-[color:var(--foreground)]/45 italic leading-normal">
                                No subscribers connected. Connect an outgoing
                                line from the Pub/Sub broker to a Web Server
                                node.
                              </p>
                            );
                          }
                          return (
                            <div className="space-y-1.5 mt-2">
                              {subscriberEdges.map((edge) => {
                                const targetNode = nodes.find(
                                  (n) => n.id === edge.target,
                                );
                                const targetLabel =
                                  (targetNode?.data?.label as string) ||
                                  edge.target;
                                const targetTopics =
                                  nodeConfigs[edge.target]
                                    ?.subscriptionTopics ||
                                  (nodeConfigs[edge.target]?.subscriptionTopic
                                    ? [
                                        nodeConfigs[edge.target]
                                          .subscriptionTopic,
                                      ]
                                    : ["order.created"]);
                                return (
                                  <div
                                    key={edge.id}
                                    className="flex justify-between items-center text-xs p-2 rounded border border-[var(--border)] bg-[var(--surface)]/50 gap-2"
                                  >
                                    <span className="font-semibold text-[color:var(--foreground)]/80 shrink-0">
                                      {targetLabel}
                                    </span>
                                    <div className="flex flex-wrap gap-1 max-w-[65%] justify-end">
                                      {targetTopics.map(
                                        (topic: string, tIdx: number) => (
                                          <span
                                            key={tIdx}
                                            className="font-mono text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded shrink-0"
                                          >
                                            {topic}
                                          </span>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Storage bucket configuration */}
                  {selectedNode.data.type === "storage" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-yellow-400 font-mono">
                          Storage Buckets
                        </p>
                        <button
                          onClick={() => {
                            const currentBuckets = nodeConfigs[selectedNode.id]
                              ?.buckets || ["media-uploads"];
                            const nextBuckets = [
                              ...currentBuckets,
                              `bucket-${currentBuckets.length + 1}`,
                            ];
                            updateNodeConfig(selectedNode.id, {
                              buckets: nextBuckets,
                            });
                          }}
                          className="rounded bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                        >
                          + Add Bucket
                        </button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {(
                          nodeConfigs[selectedNode.id]?.buckets || [
                            "media-uploads",
                          ]
                        ).map((b: string, idx: number) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input
                              type="text"
                              value={b}
                              onChange={(e) => {
                                const nextList = [
                                  ...(nodeConfigs[selectedNode.id]?.buckets || [
                                    "media-uploads",
                                  ]),
                                ];
                                nextList[idx] = e.target.value;
                                updateNodeConfig(selectedNode.id, {
                                  buckets: nextList,
                                });
                              }}
                              className="flex-1 rounded border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-xs outline-none font-mono focus:border-yellow-500"
                            />
                            <button
                              onClick={() => {
                                const currentBuckets = nodeConfigs[
                                  selectedNode.id
                                ]?.buckets || ["media-uploads"];
                                if (currentBuckets.length <= 1) return;
                                const nextBuckets = currentBuckets.filter(
                                  (_: any, i: number) => i !== idx,
                                );
                                updateNodeConfig(selectedNode.id, {
                                  buckets: nextBuckets,
                                });
                              }}
                              className="text-rose-500 hover:text-rose-600 text-xs font-bold px-2 cursor-pointer"
                              title="Delete Bucket"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="h-px bg-[var(--border)]/70" />

                      {/* Uploaded Files Section */}
                      <div>
                        <p className="text-[9px] uppercase font-bold tracking-widest text-[color:var(--foreground)]/55 mb-2">
                          Live Uploaded Files
                        </p>
                        {(() => {
                          const filesMap =
                            storageFilesByBucket[selectedNode.id] || {};
                          const buckets = nodeConfigs[selectedNode.id]
                            ?.buckets || ["media-uploads"];
                          const allFiles = Object.values(filesMap).flat();

                          if (allFiles.length === 0) {
                            return (
                              <div className="text-xs text-[color:var(--foreground)]/50 italic bg-[var(--surface)]/30 rounded-lg p-3 border border-[var(--border)]/50">
                                No files uploaded. Run client simulation to
                                upload.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                              {buckets.map((bucketName: string) => {
                                const filesInBucket =
                                  filesMap[bucketName] || [];
                                return (
                                  <div
                                    key={bucketName}
                                    className="border border-[var(--border)] rounded-lg p-2.5 bg-[var(--surface)]/50 space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between border-b border-[var(--border)]/45 pb-1">
                                      <span className="text-[10px] font-bold text-amber-500 dark:text-amber-400 font-mono">
                                        bucket: {bucketName}
                                      </span>
                                      <span className="text-[9px] text-[color:var(--foreground)]/55 bg-[var(--surface-muted)] px-1.5 py-0.5 rounded font-semibold">
                                        {filesInBucket.length} file
                                        {filesInBucket.length !== 1 ? "s" : ""}
                                      </span>
                                    </div>

                                    {filesInBucket.length === 0 ? (
                                      <p className="text-[10px] italic text-[color:var(--foreground)]/45">
                                        Empty bucket
                                      </p>
                                    ) : (
                                      <div className="space-y-1">
                                        {filesInBucket.map(
                                          (fileObj: any, fileIdx: number) => {
                                            const fileName =
                                              typeof fileObj === "string"
                                                ? fileObj
                                                : fileObj.name;
                                            const info =
                                              typeof fileObj === "string"
                                                ? null
                                                : fileObj.info;

                                            return (
                                              <div
                                                key={fileIdx}
                                                className="text-[11px] bg-[var(--surface)] p-1.5 rounded border border-[var(--border)]/35 font-mono flex flex-col gap-0.5"
                                              >
                                                <div className="flex justify-between items-center text-xs font-semibold text-[color:var(--foreground)]/80">
                                                  <span>{fileName}</span>
                                                </div>
                                                {info && (
                                                  <div className="text-[9px] text-[color:var(--foreground)]/50 mt-0.5 flex flex-col gap-0.5 border-t border-[var(--border)]/20 pt-1">
                                                    {info.sourceIp && (
                                                      <span>
                                                        IP: {info.sourceIp}
                                                      </span>
                                                    )}
                                                    {info.requestId && (
                                                      <span className="truncate">
                                                        Req: {info.requestId}
                                                      </span>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-[var(--border)]/70 pt-2" />

                  {/* Delete component helper */}
                  <button
                    onClick={() => {
                      setNodes((nds) =>
                        nds.filter((n) => n.id !== selectedNodeId),
                      );
                      setEdges((eds) =>
                        eds.filter(
                          (e) =>
                            e.source !== selectedNodeId &&
                            e.target !== selectedNodeId,
                        ),
                      );
                      setSelectedNodeId(null);
                    }}
                    className="w-full rounded-lg border border-rose-500/30 text-rose-500 dark:text-rose-400 py-2 text-center text-xs hover:bg-rose-500/10 transition font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    <span>Delete Component</span>
                  </button>
                </div>
              </aside>
            )}

            {/* Docked Right AI Architecture Assistant Panel */}
            <AIAssistantDrawer
              isOpen={isAIAssistantOpen}
              onClose={() => setIsAIAssistantOpen(false)}
              workspaceId={workspaceId}
              diagramId={diagramId}
              isSandbox={!workspaceId || !diagramId}
              token={token}
              nodes={nodes}
              edges={edges}
              nodeConfigs={nodeConfigs}
              theme={theme}
              initialPrompt={initialAIPrompt}
              initialThink={initialThink}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNodeId}
              onApplyDsl={(code: string, explanation: string) => {
                try {
                  const output = compileDSL(code);
                  if (!output.nodes || output.nodes.length === 0) {
                    setValidationWarning(
                      "No nodes generated from AI architecture DSL.",
                    );
                    return;
                  }
                  setDslCode(code);
                  setNodes(output.nodes);
                  setEdges(output.edges);
                  setNodeConfigs(output.nodeConfigs || {});
                  setValidationWarning(null);
                  setSuccessToast(
                    explanation || "AI Architecture applied to canvas!",
                  );
                  setTimeout(() => {
                    fitView({ duration: 600 });
                  }, 150);
                } catch (err: any) {
                  setValidationWarning(
                    `Failed to apply architecture: ${err.message || err}`,
                  );
                }
              }}
              onRunSimulation={() => {
                handleStartSimulation();
              }}
            />

            {/* Dedicated Canvas Settings Sheet */}
            <CanvasSettingsSheet
              isOpen={isSettingsOpen}
              onOpenChange={setIsSettingsOpen}
              bgPattern={bgPattern}
              setBgPattern={setBgPattern}
              connectionStyle={connectionStyle}
              setConnectionStyle={setConnectionStyle}
              bgOpacity={bgOpacity}
              setBgOpacity={setBgOpacity}
              snapToGrid={snapToGrid}
              setSnapToGrid={setSnapToGrid}
              gridSize={gridSize}
              setGridSize={setGridSize}
              showMinimap={showMinimap}
              setShowMinimap={setShowMinimap}
              onZoomIn={() => zoomIn({ duration: 200 })}
              onZoomOut={() => zoomOut({ duration: 200 })}
              onFitView={() => fitView({ duration: 400 })}
              nodes={nodes}
              edges={edges}
              speed={speed}
              setSpeed={setSpeed}
              hideResponse={hideResponse}
              setHideResponse={setHideResponse}
              parallelResponse={parallelResponse}
              setParallelResponse={setParallelResponse}
              debugEnabled={debugEnabled}
              setDebugEnabled={setDebugEnabled}
              onExport={handleExportFlow}
              onImport={handleImportClick}
              onShare={handleShareFlow}
              onDownloadImage={downloadCanvasImage}
              onClearCanvas={handleClearCanvas}
              theme={theme}
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              videoFormat={videoFormat}
              setVideoFormat={setVideoFormat}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              recordedVideoUrl={recordedVideoUrl}
              onDownloadRecordedVideo={handleDownloadRecordedVideo}
              onClearRecordedVideo={handleClearRecordedVideo}
              exportTheme={exportTheme}
              setExportTheme={setExportTheme}
              exportExecutionMode={exportExecutionMode}
              setExportExecutionMode={setExportExecutionMode}
              exportPacketFilter={exportPacketFilter}
              setExportPacketFilter={setExportPacketFilter}
              exportSpeed={exportSpeed}
              setExportSpeed={setExportSpeed}
              exportBgPattern={exportBgPattern}
              setExportBgPattern={setExportBgPattern}
              exportResolution={exportResolution}
              setExportResolution={setExportResolution}
              exportConnectionStyle={exportConnectionStyle}
              setExportConnectionStyle={setExportConnectionStyle}
              exportIncludeSelection={exportIncludeSelection}
              setExportIncludeSelection={setExportIncludeSelection}
              exportWatermark={exportWatermark}
              setExportWatermark={setExportWatermark}
              onProLockedNotice={(msg) => setValidationWarning(msg)}
              isExportingVideo={isExportingVideo}
              onExportSimulationVideo={handleExportSimulationVideo}
            />

            {/* Template Browser Dialog */}
            <TemplateBrowserDialog
              isOpen={isTemplateBrowserOpen}
              onClose={() => setIsTemplateBrowserOpen(false)}
              onSelectTemplate={(templateId) => {
                loadStarterTemplate(templateId);
                const tpl = WORKSPACE_TEMPLATES.find((t) => t.id === templateId);
                setSuccessToast(`Loaded ${tpl?.title || "Architecture"} template`);
              }}
              existingNodeCount={nodes.length}
            />

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFlow}
              accept=".json"
              className="hidden"
            />
          </div>

          {/* ── Help / How to Use Modal ────────────────────────────────────── */}
          {showHelpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md transition-all">
              <div className="w-[500px] max-w-[95vw] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-violet-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line
                        x1="12"
                        y1="17"
                        x2="12.01"
                        y2="17"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-[color:var(--foreground)]">
                      FlowFrame Sandbox Guide
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(false)}
                    className="rounded-full hover:bg-[var(--surface-muted)] text-sm font-bold h-7 w-7 flex items-center justify-center border border-[var(--border)] text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)] cursor-pointer transition"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1 text-xs text-[color:var(--foreground)]/75">
                  {/* 1. Placing components */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-violet-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="9" y1="3" x2="9" y2="21" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-[color:var(--foreground)] mb-0.5">
                        1. Add & Manage Nodes
                      </h3>
                      <p className="leading-relaxed">
                        Drag shapes and system components (Client, Load
                        Balancer, Web Server, Message Queue, Event Broker,
                        Storage, Database) from the left sidebar directly onto
                        the canvas, or click any library element to place it.
                      </p>
                    </div>
                  </div>

                  {/* 2. Resizing & Layout */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-[color:var(--foreground)] mb-0.5">
                        2. Resizing & Organization
                      </h3>
                      <p className="leading-relaxed">
                        Reposition elements by dragging. Click a node to reveal
                        boundary resize handles. Drag decorative shapes like
                        **Sticky Notes** or **Text** elements to label your
                        stack, or use **Rectangle frames** to visually group
                        multiple servers.
                      </p>
                    </div>
                  </div>

                  {/* 3. Multi-port handles */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="19" r="3" />
                        <path d="M6 16V9a4 4 0 0 1 4-4h5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-[color:var(--foreground)] mb-0.5">
                        3. Multi-Port Connections
                      </h3>
                      <p className="leading-relaxed">
                        Link nodes by dragging from output handles (Right &
                        Bottom) to input handles (Left & Top). Custom multi-port
                        handles allow you to clean up your canvas routing and
                        prevent overlapping lines when nodes have multiple
                        connections.
                      </p>
                    </div>
                  </div>

                  {/* 4. Requests & Simulations */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4 text-amber-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-[color:var(--foreground)] mb-0.5">
                        4. Trigger Packet Animations
                      </h3>
                      <p className="leading-relaxed">
                        Select the Client node to write requests and payload
                        parameters in the inspector (JSON request body supports
                        the **Tab** key). Click `Re-run Simulation` or hit the
                        **Spacebar** to see packets route in real-time through
                        your architecture!
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[var(--border)] pt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(false)}
                    className="rounded-xl border border-violet-500/30 bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 text-xs font-semibold px-4 py-2 transition cursor-pointer"
                  >
                    Got it, close guide
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── World-Class Redesigned Share Modal ────────────────────────────── */}
          {showShareModal && (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setShowShareModal(false);
                }
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="share-flow-title"
                className="relative flex max-h-[min(820px,calc(100dvh-2rem))] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-border bg-[var(--surface)] shadow-2xl animate-in zoom-in-95 duration-200"
              >
                {/* Glowing Blue Top Gradient Accent */}
                <div className="h-1 w-full bg-gradient-to-r from-primary via-blue-500 to-sky-400 shrink-0" />

                <div className="overflow-y-auto p-6 sm:p-7 space-y-5">
                  {/* Close button */}
                  <button
                    type="button"
                    onClick={() => setShowShareModal(false)}
                    className="absolute right-5 top-5 size-8 flex items-center justify-center rounded-full border border-border bg-[var(--surface-muted)] text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] hover:bg-[var(--bg-elevated)] transition cursor-pointer"
                    title="Close"
                    aria-label="Close share dialog"
                  >
                    <FiX className="size-4" />
                  </button>

                  {/* Header */}
                  <div className="flex items-start gap-3.5 pr-8">
                    <div className="size-11 rounded-2xl border border-primary/25 bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                      <FiShare2 className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <h2 id="share-flow-title" className="text-lg font-bold text-foreground tracking-tight">
                        Share Architecture Flow
                      </h2>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Share interactive simulation links, export crisp HD diagrams, or post directly to social channels.
                      </p>
                    </div>
                  </div>

                  {/* Public Link Container */}
                  {(diagramId || shareId) ? (
                    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <FiGlobe className="size-3.5 text-primary" />
                          <span>Public Simulation Link</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-medium">
                          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live Interactive
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            readOnly
                            value={`${typeof window !== "undefined" ? window.location.origin : ""}/share/${diagramId || shareId}`}
                            className="w-full rounded-xl border border-border bg-[var(--bg-elevated)] px-3.5 py-2 text-xs font-mono text-foreground select-all outline-none focus:border-primary/50 transition"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${diagramId || shareId}`;
                            navigator.clipboard.writeText(url);
                            setSuccessToast("Public share link copied to clipboard!");
                          }}
                          className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 active:scale-95 text-primary-foreground text-xs font-semibold transition shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                        >
                          <FiCopy className="size-3.5" />
                          <span>Copy Link</span>
                        </button>
                      </div>
                      
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Anyone with this link can view the diagram topology, inspect latency metrics, and run interactive packet simulations.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2 text-left">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                        <FiGlobe className="size-3.5" />
                        <span>Save Diagram to Enable Public Link</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Save this architecture to your workspace (Ctrl+S) to generate a permanent public interactive link.
                      </p>
                    </div>
                  )}

                  {/* Quick Export Actions */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground font-mono">
                      Export Options
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={downloadCanvasImage}
                        className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl border border-border bg-[var(--bg-elevated)] hover:border-primary/40 hover:bg-[var(--surface-muted)] text-foreground text-xs font-semibold transition active:scale-95 cursor-pointer group"
                      >
                        <FiDownload className="size-4 text-primary group-hover:scale-110 transition-transform" />
                        <span>Download HD PNG (2x)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setShowShareModal(false);
                          setIsSettingsOpen(true);
                        }}
                        className="flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl border border-border bg-[var(--bg-elevated)] hover:border-primary/40 hover:bg-[var(--surface-muted)] text-foreground text-xs font-semibold transition active:scale-95 cursor-pointer group"
                      >
                        <FiFilm className="size-4 text-primary group-hover:scale-110 transition-transform" />
                        <span>Export Simulation Video</span>
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Social Sharing */}
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground font-mono">
                      Share to Networks
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* LinkedIn */}
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${diagramId || shareId}`;
                          const templateText = `I designed a distributed system architecture on FlowFrame.\n\nSimulate traffic routing, caching, and failure dynamics in real-time:\n${url}`;
                          navigator.clipboard.writeText(templateText);
                          setSuccessToast("Caption copied to clipboard! Opening LinkedIn...");
                          window.open(
                            `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&text=${encodeURIComponent(templateText)}`,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                        className="flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl border border-[#0a66c2]/30 bg-[#0a66c2]/10 hover:bg-[#0a66c2]/20 text-[#0a66c2] dark:text-[#38bdf8] text-xs font-semibold transition active:scale-95 cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                        </svg>
                        <span>LinkedIn</span>
                      </button>

                      {/* X / Twitter */}
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${diagramId || shareId}`;
                          const postText = `Check out this distributed system architecture I designed on FlowFrame.\n\nVisual interactive simulator for caching & load balancing:\n${url}`;
                          window.open(
                            `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}`,
                            "_blank",
                            "noopener,noreferrer"
                          );
                        }}
                        className="flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-semibold transition active:scale-95 cursor-pointer"
                      >
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        <span>Post on X</span>
                      </button>
                    </div>
                  </div>

                  {/* Pre-crafted Caption Template Box */}
                  <div className="rounded-2xl border border-border bg-muted/20 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground font-mono">
                        Copy Post Caption
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const url = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${diagramId || shareId}`;
                          const templateText = `🚀 Check out this distributed system architecture I designed on FlowFrame!\n\nSimulate traffic routing, caching, and failover dynamics interactively:\n${url}`;
                          navigator.clipboard.writeText(templateText);
                          setCopiedTemplate(true);
                          setSuccessToast("Caption copied to clipboard!");
                          setTimeout(() => setCopiedTemplate(false), 2000);
                        }}
                        className="text-[11px] font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1"
                      >
                        {copiedTemplate ? (
                          <>
                            <FiCheck className="size-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <FiCopy className="size-3" />
                            <span>Copy Caption</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-mono bg-background/50 p-2.5 rounded-xl border border-border/50 select-all">
                      🚀 Check out this distributed system architecture I designed on FlowFrame! Simulate traffic routing, caching, and failover dynamics interactively.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpenMobile && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-20"
          onClick={() => setIsSidebarOpenMobile(false)}
        />
      )}

      {/* Modern Hover Tooltip Popover (Floats at page level, non-clipping) */}
      {hoveredComponent && (
        <div
          className="fixed z-50 w-56 p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md shadow-2xl pointer-events-none text-left"
          style={{
            left: `${hoverTooltipX}px`,
            top: `${hoverTooltipY}px`,
            transform: "translateY(-50%)",
          }}
        >
          <p className="text-xs font-bold text-violet-400">
            {hoveredComponent.label}
          </p>
          <p className="text-[10px] text-[color:var(--foreground)]/75 mt-1 leading-normal">
            {hoveredComponent.description}
          </p>
          <p className="text-[9px] text-violet-300/60 mt-1.5 font-bold uppercase tracking-wider">
            Click to add · Drag to place
          </p>
        </div>
      )}
    </main>
  );
}

// Wrap in ReactFlowProvider so useReactFlow() works inside WorkspaceInner
export default function WorkspacePage({
  workspaceId,
  diagramId,
  shareId,
  isSharedView = false,
}: {
  workspaceId?: string;
  diagramId?: string;
  shareId?: string;
  isSharedView?: boolean;
}) {
  return (
    <ReactFlowProvider>
      <WorkspaceInner
        workspaceId={workspaceId}
        diagramId={diagramId}
        shareId={shareId}
        isSharedView={isSharedView}
      />
    </ReactFlowProvider>
  );
}