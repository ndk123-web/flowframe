export interface Checkpoint {
  id: string;
  title: string;
  description: string;
  targetNodeId: string;
  configPatch: Record<string, any>;
}

export interface LearnSection {
  id: string;
  title: string;
  content: string;
  checkpoints?: Checkpoint[];
}

export interface LearnTopic {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  scenarioId: string;
  sections: LearnSection[];
}

export const LEARN_TOPICS: LearnTopic[] = [
  {
    id: "load-balancers",
    title: "Load Balancers",
    subtitle: "Distributing traffic evenly across backend fleets",
    description: "Learn how load balancers route incoming requests to multiple servers to prevent bottlenecks, scale capacity, and implement horizontal failover.",
    scenarioId: "simple-load-balancer",
    sections: [
      {
        id: "lb-intro",
        title: "1. What is a Load Balancer?",
        content: `A **Load Balancer (LB)** acts as a traffic cop sitting in front of your web servers. It intercepts all incoming HTTP/HTTPS queries and distributes them across a fleet of backend servers.

### Why do we need it?
* **High Availability**: If one server crashes, the load balancer routes traffic to the surviving servers seamlessly.
* **Scalability**: By adding more servers behind the load balancer, your application can handle millions of requests without changing client configurations.
* **Resource Optimization**: Prevents any single server from becoming a bottleneck by spreading the CPU/Memory load.

In this scenario, we have a **Client** sending parallel requests, a **Load Balancer**, and **3 Web Servers**.`
      },
      {
        id: "lb-strategies",
        title: "2. Routing Strategies",
        content: `Load balancers decide where to route traffic using specific algorithms:

* **Round Robin**: Routes requests sequentially (Server 1 ➔ Server 2 ➔ Server 3 ➔ Server 1). It assumes all servers have equal capacity.
* **Random**: Dispatches requests completely at random. Useful for testing or when request load is extremely light.
* **IP Hash**: Computes a hash of the client's IP address (e.g. \`192.168.1.50\`) and maps it to a specific server. This ensures the same client *always* lands on the same server, preserving session/cache persistence.

---

### Interactive Checkpoints
Click on the check-points below to configure the simulator instantly and see them in action!`,
        checkpoints: [
          {
            id: "cp-lb-rr",
            title: "Visualize Round Robin Routing",
            description: "Click here to set the Load Balancer to 'Round Robin' and run the simulation. Watch how each request goes sequentially to Server 1, 2, and 3.",
            targetNodeId: "lb-1",
            configPatch: { strategy: "ROUND_ROBIN" }
          },
          {
            id: "cp-lb-iphash",
            title: "Enforce IP Hash Stickiness",
            description: "Click here to set the strategy to 'IP Hash'. Run the simulation to see how a client's requests stick to a single server based on their IP hash value.",
            targetNodeId: "lb-1",
            configPatch: { strategy: "IP_HASH" }
          }
        ]
      },
      {
        id: "lb-failover",
        title: "3. Handling Server Failovers",
        content: `In the real world, servers crash or undergo updates. A load balancer uses **health checks** to detect dead nodes. If a server is unhealthy (or has zero capacity), the load balancer skips it and routes requests to active servers.

### Try it Yourself:
1. Select **Server 1** in the graph canvas.
2. Under **⚙️ Configure Node**, set its **Connections Capacity** to \`0\`.
3. Press **Play** or click **Reset** & **Play** to run.
4. Observe how the load balancer skips **Server 1** entirely and balances traffic only between **Server 2** and **Server 3**!`
      }
    ]
  },
  {
    id: "cache-aside",
    title: "Cache-Aside Pattern",
    subtitle: "Accelerating data retrieval with Redis and Postgres",
    description: "Understand the industry-standard cache-aside caching mechanism using a high-speed Redis cache in front of a Postgres database.",
    scenarioId: "simple-cache",
    sections: [
      {
        id: "cache-intro",
        title: "1. The Cache-Aside Architecture",
        content: `Reading data from a disk-based SQL database like **Postgres** is relatively slow. To speed up applications, we place an in-memory key-value store like **Redis** in front of it.

Under the **Cache-Aside Pattern**:
1. The application checks the cache (Redis) first.
2. **Cache Hit**: If data is found in Redis, return it immediately (low latency, ~1ms).
3. **Cache Miss**: If not found, read from Postgres, save it back to Redis for subsequent requests, and then return it.`
      },
      {
        id: "cache-miss-hit",
        title: "2. Visualizing Cache Hits and Misses",
        content: `Let's watch how the simulation engine handles different keys:
* **Cache Hit**: Client requests \`john\` or \`rohan\`. Since these are pre-seeded in Redis, the server gets the data instantly and returns, never querying Postgres.
* **Cache Miss**: Client requests \`doe\`. Since \`doe\` is *not* in Redis but exists in Postgres, the server does a database lookup, gets the record, writes it to Redis, and returns.

---

### Interactive Checkpoints
Use these buttons to instantly seed cache memory:`,
        checkpoints: [
          {
            id: "cp-cache-empty",
            title: "Clear Redis Cache (Force Cache Misses)",
            description: "Click here to empty all cached pairs in Redis. Running the simulation now will force the Server to query Postgres for every request, showing cache misses.",
            targetNodeId: "redis1",
            configPatch: { data: [] }
          },
          {
            id: "cp-cache-fill",
            title: "Pre-seed Redis Cache (Force Cache Hits)",
            description: "Click here to seed rohan, john, and doe in Redis. Run the simulation to see lightning-fast Cache Hits that never hit Postgres.",
            targetNodeId: "redis1",
            configPatch: {
              data: [
                { key: "rohan", val: "cached data for rohan" },
                { key: "john", val: "cached data for john" },
                { key: "doe", val: "cached data for doe" }
              ]
            }
          }
        ]
      }
    ]
  },
  {
    id: "api-gateways",
    title: "API Gateways",
    subtitle: "Centralized entry points for microservices routing",
    description: "Master path-based routing, service pool mappings, and client query resolution using a centralized API Gateway node.",
    scenarioId: "simple-api-gateway",
    sections: [
      {
        id: "gw-intro",
        title: "1. What is an API Gateway?",
        content: `In microservice architectures, clients (web/mobile apps) shouldn't talk directly to dozens of backend services. Instead, they hit a single entry point called the **API Gateway**.

The API Gateway is responsible for:
* **Routing**: Inspecting path prefixes (e.g. \`/api/v1/users\` or \`/api/v1/posts\`) and forwarding request queries to the correct microservice fleet.
* **Security & Authentication**: Ensuring requests are authenticated before passing them back.
* **Rate Limiting**: Preventing denial-of-service (DoS) attacks by throttling heavy traffic.
* **Load Balancing**: Distributing requests across servers inside each microservice pool.`
      },
      {
        id: "gw-routing",
        title: "2. Prefix Routing & Service Pools",
        content: `In the diagram, our API Gateway has rules configured:
* \`/api/v1/posts\` maps to **POST_SERVICE** (balanced across Server 2 and Server 3).
* \`/api/v1/users\` maps to **USER_SERVICE** (balanced to Server 1).

If a client requests an endpoint path that is not defined, or if the destination server doesn't expose it, the gateway handles routing validation and returns ` + "`404 Not Found`" + ` or ` + "`405 Method Not Allowed`" + `.

---

### Interactive Checkpoints:`,
        checkpoints: [
          {
            id: "cp-gw-badroute",
            title: "Simulate Wrong Gateway Routing",
            description: "Click to point all posts routes to USER_SERVICE on Server 1. Watch how the gateway routes post requests to Server 1, causing endpoint mismatches.",
            targetNodeId: "apigateway-1-id",
            configPatch: {
              routes: {
                "/api/v1/posts": "USER_SERVICE",
                "/api/v1/users": "USER_SERVICE"
              }
            }
          }
        ]
      }
    ]
  },
  {
    id: "valet-key",
    title: "Valet Key Pattern",
    subtitle: "Offloading file upload bandwidth to Cloud Storage",
    description: "Learn how to use pre-signed URLs to enable clients to upload large binary assets directly to object storage without choking backend servers.",
    scenarioId: "simple-valet-key",
    sections: [
      {
        id: "valet-intro",
        title: "1. The Upload Bottleneck",
        content: `If clients upload large files (images, PDFs, videos) directly to a backend server, the server's CPU and bandwidth get choked, causing slowdowns for other users.

The **Valet Key Pattern** solves this:
1. The **Client** requests a temporary "signed upload URL" from the **Server** for a specific file.
2. The **Server** checks permissions, requests/generates a pre-signed URL (e.g. with AWS S3 credentials) and returns it to the client.
3. The **Client** uploads the file **directly** to **Cloud Storage** using that URL.
4. The backend server never has to handle the heavy file bytes!`
      },
      {
        id: "valet-flow",
        title: "2. Direct Upload vs Server Bypass",
        content: `In this scenario:
1. **Request 1**: Client asks Server for a signed URL.
2. **Backtrack**: Server returns the signed URL containing a secure token.
3. **Request 2**: Client bypasses the server and sends file bytes directly to Cloud Storage.
4. **Backtrack**: Cloud Storage records the upload success in the bucket and responds to the Client.

---

### Interactive Checkpoints:`,
        checkpoints: [
          {
            id: "cp-valet-bucket",
            title: "Add Custom Storage Bucket",
            description: "Click here to add 'secure-invoices' and 'user-profiles' to Cloud Storage, and update client request targets.",
            targetNodeId: "storage-1",
            configPatch: {
              buckets: ["media-uploads", "secure-invoices", "user-profiles"]
            }
          }
        ]
      }
    ]
  }
];
