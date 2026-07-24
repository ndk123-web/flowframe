# FlowFrame Architecture DSL Reference

FlowFrame DSL (`.flow`) is a declarative domain-specific language designed to construct, visualize, and simulate distributed system architectures. It allows developers to define infrastructure nodes, configure operational parameters, and declare network topologies for execution within the FlowFrame simulation engine.

---

## 1. Core Syntax Rules

Every `.flow` script consists of two fundamental constructs: **Node Definitions** and **Connections**.

### Node Definitions
Nodes are defined using the `define` keyword followed by the node type, an identifier, and a configuration block:

```javascript
define <NODE_TYPE> <identifier> {
  <property>: <value>,
  ...
}
```

* Keywords like `define`, `connect`, and node type names (e.g., `CLIENT`, `SERVER`) can be written in uppercase or lowercase.
* Node identifiers must be unique alphanumeric strings without spaces (e.g., `c1`, `s1`, `gw1`).
* Trailing commas inside configuration blocks are optional.

### Connections
Connections define directed traffic flow between infrastructure components. They can be written using either the `connect` keyword or direct arrow notation:

```javascript
// Using explicit connect keyword
connect c1 -> s1 -> db1

// Direct arrow notation
c1 -> s1 -> db1
```

Chained connections (`a -> b -> c`) are automatically split into discrete directed edges (`a -> b` and `b -> c`).

---

## 2. Supported Node Types & Configuration Schemas

### CLIENT
Represents end-user traffic sources (web browsers, mobile applications, HTTP clients).

```javascript
define CLIENT c1 {
  label: "Mobile Client",
  valet: false,
  requests: [
    {
      endpoint: "/api/v1/posts",
      allowedMethods: ["GET", "POST"],
      key: "rohan",
      body: { title: "Hello World" }
    }
  ]
}
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Display name shown on the visual canvas. |
| `valet` | `boolean` | Enables Valet Key pattern for direct storage uploads. Default: `false`. |
| `requests` | `array` | List of HTTP request configurations sent by the client. |

#### Request Object Properties:
- `endpoint`: HTTP route path (e.g., `"/api/v1/posts"`).
- `allowedMethods`: Array of supported HTTP methods (e.g., `["GET", "POST"]`).
- `key`: Primary lookup key used for Redis cache or Database query matches.
- `body`: JSON object or payload string sent with the request.
- `fileName`: Target filename for file upload requests.
- `targetBucket`: Cloud storage bucket name for file uploads.

---

### SERVER
Represents backend application servers, microservices, or API runtimes.

```javascript
define SERVER s1 {
  label: "API Server",
  capacity: 100,
  tcpConnectionsToPostgres: 10,
  prefetchLimit: 1,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ],
  registeredTopics: ["order.created"]
}
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Display name shown on the visual canvas. |
| `capacity` | `number` | Maximum concurrent requests the server can process before throttling. Default: `100`. |
| `tcpConnectionsToPostgres` | `number` | Database TCP connection pool size. Default: `10`. |
| `prefetchLimit` | `number` | Maximum message prefetch count for queue consumers. Default: `1`. |
| `acceptedEndpoints` | `array` | List of endpoint objects accepted by the server. |
| `registeredTopics` | `array` | Event topic names the server subscribes to on a PubSub broker. |

---

### GATEWAY (API Gateway)
Entry-point gateway for routing, rate-limiting, and microservice distribution.

```javascript
define GATEWAY gw1 {
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
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Display name shown on the visual canvas. |
| `strategy` | `string` | Load balancing algorithm: `"ROUND_ROBIN"`, `"LEAST_CONNECTIONS"`, `"IP_HASH"`, `"RANDOM"`. |
| `routes` | `array` or `object` | Mapping of route path prefixes to target server node identifiers or service names. |

*Note: In `routes`, `target` can be specified as a direct node identifier (e.g., `target: s1`) or a string literal (e.g., `target: "s1"`).*

---

### LOADBALANCER
Distributes incoming traffic across a pool of application servers.

```javascript
define LOADBALANCER lb1 {
  label: "Nginx Load Balancer",
  strategy: "ROUND_ROBIN"
}
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Display name shown on the visual canvas. |
| `strategy` | `string` | Traffic distribution strategy: `"ROUND_ROBIN"`, `"LEAST_CONNECTIONS"`, `"IP_HASH"`, `"RANDOM"`. |

---

### REDIS
In-memory key-value cache node used for rapid data lookups.

```javascript
define REDIS r1 {
  label: "Redis Cache",
  data: [
    {
      key: "rohan",
      value: "cached post data for rohan"
    }
  ]
}
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Display name shown on the visual canvas. |
| `data` | `array` | Key-value records pre-populated in the cache. Each item contains `key` and `value` (or `val`). |

---

### POSTGRES
Relational database node providing persistent storage.

```javascript
define POSTGRES db1 {
  label: "PostgreSQL Database",
  table: "users",
  data: [
    {
      key: "rohan",
      value: "persistent record for rohan"
    }
  ]
}
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Display name shown on the visual canvas. |
| `table` | `string` | Target database table name. Default: `"users"`. |
| `data` | `array` | Records pre-populated in the database. Each item contains `key` and `value` (or `val`). |

---

### MESSAGEQUEUE
Asynchronous message broker (e.g., RabbitMQ, SQS) supporting producer-consumer patterns.

```javascript
define MESSAGEQUEUE mq1 {
  label: "RabbitMQ Queue",
  processingType: "FIFO",
  queueSize: 50,
  overflowBehavior: "REJECT"
}
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Display name shown on the visual canvas. |
| `processingType` | `string` | Message ordering scheme. Default: `"FIFO"`. |
| `queueSize` | `number` | Maximum buffer size for pending messages. Default: `10`. |
| `overflowBehavior` | `string` | Action when queue exceeds capacity: `"REJECT"` or `"DROP_OLDEST"`. |

---

### PUBSUB
Event broker supporting publish-subscribe fan-out distribution.

```javascript
define PUBSUB ps1 {
  label: "Event PubSub",
  topic: "order.created"
}
```

| Property | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Display name shown on the visual canvas. |
| `topic` | `string` | Topic channel name for event publishing and subscription matching. |

---

## 3. Architecture Blueprint Examples

### Example 1: Basic API Gateway Routing

```javascript
define CLIENT c1 {
  label: "Mobile Client",
  requests: [
    {
      endpoint: "/api/v1/posts",
      allowedMethods: ["GET", "POST"],
      key: "rohan"
    }
  ]
}

define GATEWAY gw1 {
  label: "API Gateway",
  strategy: "ROUND_ROBIN",
  routes: [
    {
      path: "/api/v1/posts",
      target: s1
    }
  ]
}

define SERVER s1 {
  label: "Posts Service",
  capacity: 100,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/posts",
      allowedMethod: ["GET", "POST"]
    }
  ]
}

connect c1 -> gw1 -> s1
```

---

### Example 2: Cache-Aside Architecture (Redis + Postgres)

```javascript
define CLIENT c1 {
  label: "Web Browser",
  requests: [
    {
      endpoint: "/api/v1/users",
      allowedMethods: ["GET"],
      key: "user_101"
    }
  ]
}

define SERVER s1 {
  label: "User Service Server",
  capacity: 100,
  tcpConnectionsToPostgres: 5,
  acceptedEndpoints: [
    {
      endpoint: "/api/v1/users",
      allowedMethod: ["GET"]
    }
  ]
}

define REDIS r1 {
  label: "Redis Cache Layer",
  data: [
    {
      key: "user_101",
      value: "cached user profile payload"
    }
  ]
}

define POSTGRES db1 {
  label: "PostgreSQL Database",
  table: "users",
  data: [
    {
      key: "user_101",
      value: "persistent database user record"
    }
  ]
}

connect c1 -> s1 -> db1
connect s1 -> r1
```

---

### Example 3: Asynchronous Message Queue

```javascript
define CLIENT c1 {
  label: "Mobile App",
  requests: [
    {
      endpoint: "/api/v1/orders",
      allowedMethods: ["POST"]
    }
  ]
}

define SERVER producer {
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
  label: "RabbitMQ Order Queue",
  processingType: "FIFO",
  queueSize: 25,
  overflowBehavior: "REJECT"
}

define SERVER consumer {
  label: "Order Processor Worker",
  capacity: 50,
  prefetchLimit: 1
}

connect c1 -> producer -> mq1 -> consumer
```

---

### Example 4: Event-Driven PubSub Fan-Out

```javascript
define SERVER paymentServer {
  label: "Payment Processing Server",
  capacity: 100
}

define PUBSUB eventBroker {
  label: "Redis Event Broker",
  topic: "payment.completed"
}

define SERVER emailWorker {
  label: "Email Dispatch Worker",
  registeredTopics: ["payment.completed"]
}

define SERVER analyticsWorker {
  label: "Analytics Tracking Worker",
  registeredTopics: ["payment.completed"]
}

connect paymentServer -> eventBroker -> emailWorker
connect eventBroker -> analyticsWorker
```

---

## 4. Error Diagnostics

The FlowFrame compiler performs Lexer, Parser, and Semantic checks before triggering visual layout or simulation execution.

Common errors handled by the semantic analyzer include:
* **Duplicate Node Identifiers**: Throw error if a node identifier is declared multiple times.
* **Undeclared Connection References**: Throws error if a connection references a non-existent node identifier.
* **Unknown Node Properties**: Throws error if invalid properties are provided inside node configuration blocks.
* **Invalid Topologies**: Throws error if an incoming connection targets a Client node or unsupported node combinations.
