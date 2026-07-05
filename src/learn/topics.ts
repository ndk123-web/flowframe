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
        id: "lb-components",
        title: "1. Components in This Simulation",
        content: `Before diving in, let's understand each component you'll see on the canvas:

### 💻 Client
The **Client** is the starting point of every request — think of it as a browser, mobile app, or any user device. It sends [HTTP requests](/learn/glossary/http) (GET, POST, etc.) to the network. In this simulation, the client sends **3 identical GET requests** back to back.

### ⚖️ Load Balancer
The [Load Balancer](/learn/glossary/load-balancer) sits between the client and your servers. It intercepts every incoming request and decides *which server* should handle it. The client never talks directly to a server — it always goes through the load balancer first.

### 🖥️ Web Servers (×3)
The three [Web Servers](/learn/glossary/server) are identical backend workers. Each one can independently handle the same requests. The load balancer decides which of them gets each incoming request.

---

**In this diagram:** \`Client → Load Balancer → Server 1 / Server 2 / Server 3\``
      },
      {
        id: "lb-intro",
        title: "2. What Does a Load Balancer Do?",
        content: `A [Load Balancer](/learn/glossary/load-balancer) acts like a traffic manager at a busy intersection. Instead of letting all cars pile onto one road, it spreads them across multiple roads.

### Why Do We Need It?

Imagine 1,000 users hitting your app at the same time. If they all reach a single server:
- That server gets overloaded → slowdowns and crashes
- If that server goes down → your entire app goes down

With a load balancer:
- **[High Availability](/learn/glossary/high-availability)**: If Server 1 crashes, traffic automatically reroutes to Server 2 and 3 — users don't notice.
- **Horizontal Scaling**: Need more capacity? Add another server behind the load balancer without changing anything on the client side.
- **Resource Optimization**: No single server gets overwhelmed — CPU and memory are spread evenly.

### Watch It in Action
Press **Play** on the simulator to the right. You'll see the client send 3 requests. Watch the animated purple dots (packets) — they should travel to different servers each time.`
      },
      {
        id: "lb-strategies",
        title: "3. Routing Strategies",
        content: `Load balancers use different algorithms to decide where each request goes:

### Round Robin *(default in this sim)*
Routes requests **sequentially**: Request 1 → Server 1, Request 2 → Server 2, Request 3 → Server 3, then back to Server 1. See details under [Load Balancer](/learn/glossary/load-balancer).

**Best for:** Servers with roughly equal capacity.

### IP Hash
Hashes the client's IP address (e.g., \`192.168.1.50\`) to a specific server. The *same client always hits the same server* — useful when you need session persistence (e.g., shopping carts, login state).

### Least Connections
Routes each new request to whichever server currently has the *fewest active connections* — great when some requests take much longer than others.

---

### Interactive Checkpoints

Click the buttons below to instantly apply different strategies and re-run the simulation:`,
        checkpoints: [
          {
            id: "cp-lb-rr",
            title: "▶ Visualize Round Robin Routing",
            description: "Click to set the Load Balancer to Round Robin mode. Watch how each of the 3 requests goes to a different server (1→2→3→1...).",
            targetNodeId: "lb-1",
            configPatch: { strategy: "ROUND_ROBIN" }
          },
          {
            id: "cp-lb-iphash",
            title: "▶ Try IP Hash Stickiness",
            description: "Click to switch to IP Hash mode. Notice how all requests from the same client always land on the same server — that's session stickiness.",
            targetNodeId: "lb-1",
            configPatch: { strategy: "IP_HASH" }
          }
        ]
      },
      {
        id: "lb-failover",
        title: "4. Failover: What Happens When a Server Dies?",
        content: `In the real world, servers crash or go under maintenance. The load balancer constantly runs **health checks** — pinging each server to confirm it's alive. If a server's capacity drops to 0 (or it stops responding), the load balancer skips it.

### Try It Yourself
1. On the canvas, click **Server 1** to select it.
2. In the **Inspector Panel** (appears on the right), find **Connections Capacity** and set it to \`0\`.
3. Click **Reset** then **Play** to re-run the simulation.
4. Watch — the load balancer now skips Server 1 entirely and only routes to **Server 2** and **Server 3**.

This is **automatic failover** in action. No client-side change is needed.

---

### 🛠️ Go Practice in the Sandbox!
Now that you understand Load Balancers, try building your own from scratch:

1. Open the **Interactive Sandbox** (button below or in the nav bar) — it will open in a new tab.
2. From the left panel, drag a **Client** onto the canvas.
3. Drag a **Load Balancer** onto the canvas and draw a connection from Client to it.
4. Add 2–4 **Web Servers** and connect them all to the Load Balancer.
5. Click the **Client** node to run the simulation. Watch packets flow!`
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
        id: "cache-components",
        title: "1. Components in This Simulation",
        content: `Here's what each node in the simulator represents:

### 💻 Client
Sends 3 GET requests — each asking for a different user record by key:
- Request 1 → key: \`rohan\` (exists in Redis)
- Request 2 → key: \`john\` (exists in Redis)
- Request 3 → key: \`doe\` (not in Redis, but exists in Postgres)

### 🖥️ Server
Acts as the application logic layer. It receives requests from the client and decides: *"Should I check cache first, or go straight to the database?"* In the [Cache-Aside Pattern](/learn/glossary/cache-aside), the server **always checks Redis first**.

### 💾 Redis Cache
An **in-memory key-value store** — blazing fast (~1ms [latency](/learn/glossary/latency)). It stores frequently accessed data in RAM. Think of it as your app's short-term [Cache](/learn/glossary/cache) memory. See details under [Redis](/learn/glossary/redis).

### 🗄️ Postgres Database
A **disk-based SQL database** — reliable but slower than Redis (~10–100ms [latency](/learn/glossary/latency)). It's the source of truth where all records live permanently. See details under [PostgreSQL](/learn/glossary/postgres).

---

**Flow overview:** \`Client → Server → Redis\` (or \`→ Postgres\` on cache miss)`
      },
      {
        id: "cache-intro",
        title: "2. Why Cache at All?",
        content: `Reading from a [SQL](/learn/glossary/sql) [database](/learn/glossary/database) on every single request is *slow* — it involves disk I/O, query parsing, and network round trips. Under heavy load, this becomes a bottleneck.

### The Solution: Cache-Aside Pattern
Instead of always going to Postgres, we put a [Redis](/learn/glossary/redis) cache in front of it:

\`\`\`
1. Request arrives → Server checks Redis first
2. CACHE HIT  → Data found in Redis → Return instantly (fast! ~1ms)
3. CACHE MISS → Data not in Redis → Query Postgres
               → Get the data → Save it to Redis → Return to client
\`\`\`

On the **first** request for a key ([cache miss](/learn/glossary/cache)), we pay the cost of a [Postgres](/learn/glossary/postgres) query. On **every subsequent** request for that same key ([cache hit](/learn/glossary/cache)), we skip Postgres entirely. See [TTL](/learn/glossary/ttl) configuration for expirations.

### Real-World Impact
A popular blog post queried by 10,000 users? With caching, only the **first request** hits Postgres. The other 9,999 get served from Redis at millisecond speed.

Press **Play** to see this unfold — watch which paths the purple packets take.`
      },
      {
        id: "cache-miss-hit",
        title: "3. Cache Hit vs. Cache Miss",
        content: `Let's look at what happens with each of the 3 requests in the simulation:

### Request 1 — key: \`rohan\` → **Cache HIT** ✅
- Server asks Redis: "Do you have \`rohan\`?"
- Redis says: YES → returns \`"cached data for rohan"\`
- Server sends response to client. **Postgres is never touched.**

### Request 2 — key: \`john\` → **Cache HIT** ✅
- Same flow as above. Redis has \`john\` → fast return.

### Request 3 — key: \`doe\` → **Cache MISS** ⚠️
- Server asks Redis: "Do you have \`doe\`?"
- Redis says: NO ([cache miss](/learn/glossary/cache))
- Server queries Postgres: "Find \`doe\` in the users table"
- Postgres returns \`"db data for doe"\`
- Server **saves \`doe\` to Redis** (so next time it's a [cache hit](/learn/glossary/cache)!)
- Server returns response to client

Watch the packet paths — a cache miss shows 2 hops (→ Redis → Postgres), while a hit shows just 1.

---

### Interactive Checkpoints`,
        checkpoints: [
          {
            id: "cp-cache-empty",
            title: "▶ Empty Redis Cache (Force All Misses)",
            description: "Click to clear all cached data from Redis. Now all 3 requests will miss the cache and fall back to Postgres. Watch the longer packet paths.",
            targetNodeId: "redis1",
            configPatch: { data: [] }
          },
          {
            id: "cp-cache-fill",
            title: "▶ Pre-seed Cache (Force All Hits)",
            description: "Click to pre-fill Redis with rohan, john, and doe. All 3 requests will be cache hits — notice how packets never reach Postgres.",
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
      },
      {
        id: "cache-sandbox",
        title: "4. Try It in the Sandbox",
        content: `Now that you understand cache-aside, build it yourself:

### 🛠️ Step-by-Step in the Sandbox
1. Open the **Interactive Sandbox** in a new tab (link below).
2. Add a **Client** node — configure it with a GET request, key: \`myuser\`.
3. Add a **Server** node — connect Client → Server.
4. Add a **Redis Cache** node — connect Server → Redis.
5. Add a **Postgres Database** node — connect Server → Postgres.
6. In the Redis inspector, add a key: \`myuser\` with a value.
7. Click the Client node to simulate. Watch it hit Redis first!
8. Now remove that key from Redis and re-simulate — watch it fall back to Postgres.

That's the [Cache-Aside](/learn/glossary/cache-aside) pattern — fully in your control!`
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
        id: "gw-components",
        title: "1. Components in This Simulation",
        content: `This is the most complex scenario — let's meet all the players:

### 💻 Client
Sends 3 different requests — each targeting different API paths:
- \`GET /api/v1/posts/list\` — a posts query
- \`GET /api/v1/users/profile\` — a users query
- \`GET /api/v1/posts/list\` — another posts query

### 🚪 API Gateway
The **single entry point** for all client requests. It looks at the URL path and decides: *"Which backend service should handle this?"* See details under [API Gateway](/learn/glossary/api-gateway).

### 🖥️ Post Server
Only handles \`/api/v1/posts/*\` [endpoints](/learn/glossary/endpoint). Ignores anything else.

### 🖥️ User Server
Only handles \`/api/v1/users/*\` [endpoints](/learn/glossary/endpoint). Ignores anything else.

---

**Flow:** \`Client → API Gateway → (Post Server or User Server)\`

The gateway reads the path prefix and routes accordingly — like a smart switchboard.`
      },
      {
        id: "gw-intro",
        title: "2. Why Use an API Gateway?",
        content: `In a **[microservices architecture](/learn/glossary/microservices)**, you might have dozens of specialized services — a user service, payment service, notification service, etc. Each lives at a different address.

**Without an API Gateway:**
- The client must know the exact address of every service.
- When a service moves or scales, every client has to update.
- Cross-cutting concerns ([authentication](/learn/glossary/authentication), [rate limiting](/learn/glossary/rate-limiting), logging) must be implemented in every service.

**With an API Gateway:**
- Clients talk to ONE address — the gateway.
- The gateway handles all routing transparently.
- [Authentication](/learn/glossary/authentication), [rate limiting](/learn/glossary/rate-limiting), and logging happen in one place.

### What the Gateway Does
1. **Routing** — Matches path prefixes to backend services.
2. **Security** — Can validate auth tokens before forwarding requests.
3. **Rate Limiting** — Prevents any client from flooding the backend.
4. **[Load Balancing](/learn/glossary/load-balancer)** — Distributes across multiple servers in a service pool.

Press **Play** to watch requests fan out to the correct servers!`
      },
      {
        id: "gw-routing",
        title: "3. Path Routing Rules",
        content: `The gateway uses a **routing table** to match incoming paths to backend services:

| Path Prefix | → Service |
|---|---|
| \`/api/v1/posts\` | \`POST_SERVICE\` |
| \`/api/v1/users\` | \`USER_SERVICE\` |

When a request arrives:
1. Gateway reads the URL path.
2. Finds the longest matching prefix in the [routing table](/learn/glossary/endpoint).
3. Forwards the request to the matching service pool.
4. If no rule matches → returns \`404 Not Found\`. See [Status Codes](/learn/glossary/status-codes).
5. If the method isn't allowed → returns \`405 Method Not Allowed\`.

### Service Pools
Each "service" in the gateway is actually a *pool of servers*. In our sim:
- \`POST_SERVICE\` → Post Server
- \`USER_SERVICE\` → User Server

If you added more Post Servers and connected them, the gateway would load-balance across all of them.

---

### Interactive Checkpoints`,

        checkpoints: [
          {
            id: "cp-gw-badroute",
            title: "▶ Misconfigure Routes (See a 405 Error)",
            description: "Click to point all posts routes to USER_SERVICE. The User Server only handles /users endpoints, so /posts requests will get Method Not Allowed errors. Watch the error frames!",
            targetNodeId: "apigateway-1-id",
            configPatch: {
              routes: {
                "/api/v1/posts": "USER_SERVICE",
                "/api/v1/users": "USER_SERVICE"
              }
            }
          }
        ]
      },
      {
        id: "gw-sandbox",
        title: "4. Build It in the Sandbox",
        content: `Create your own API Gateway architecture:

### 🛠️ Step-by-Step
1. Open the **Interactive Sandbox** in a new tab.
2. Add a **Client** — set up a request to \`/api/v1/users/me\` with method GET.
3. Add an **API Gateway** — connect Client → Gateway.
4. Add a **Server** (rename it "User Server").
5. Connect Gateway → User Server.
6. Select the Gateway in the inspector, and add a route rule: \`/api/v1/users\` → \`USER_SERVICE\`.
7. Assign User Server to the \`USER_SERVICE\` pool.
8. Click the Client to simulate — watch the gateway route the request correctly!

**Bonus:** Add a second server for a different path and see the gateway route to the right one.`
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
        id: "valet-components",
        title: "1. Components in This Simulation",
        content: `### 💻 Client
The user's device that wants to upload a file — like a profile photo (\`avatar-1.png\`) or a PDF.

### 🖥️ Upload Server
A backend [Web Server](/learn/glossary/server) that **generates secure signed URLs** for specific files. It doesn't receive the file data itself — it only issues permission tokens.

### ☁️ Cloud Storage
An object storage bucket (like AWS S3 or Google Cloud Storage) that **accepts direct uploads** from clients using [Valet Keys / Signed URLs](/learn/glossary/signed-url). Files land here without ever passing through the server.

---

**Flow overview:**
\`\`\`
Client → Server: "I want to upload avatar-1.png"
Server → Client: "Here's a signed URL with a 15-min token"
Client → Storage: Upload file directly using the signed URL
Storage → Client: "Upload success! File saved."
\`\`\``
      },
      {
        id: "valet-intro",
        title: "2. The Upload Bottleneck Problem",
        content: `When users upload files, the naive approach is to send them to your backend server first:

\`Client → Server → Storage\`

This creates a massive problem at scale:
- A 50MB video upload occupies a server thread for seconds.
- With 1,000 concurrent uploads, your server runs out of memory.
- Your server's bandwidth gets saturated — other requests slow down.

### The Valet Key Pattern Solves This
Named after the valet parking model: *you give the valet your car key, but only with limited permissions* (they can park it — not sell it). See [Valet Key / Signed URL](/learn/glossary/signed-url).

**The idea:**
1. **Client** asks the server for a *temporary, restricted upload token* for a specific file.
2. **Server** verifies the user's permissions, generates a **pre-signed URL** (e.g. AWS S3 presigned URL), and returns it to the client.
3. **Client** uploads directly to Cloud Storage using that [signed URL](/learn/glossary/signed-url) — bypassing the server entirely.
4. **Storage** validates the token and stores the file.

The server never touches the file bytes. Your backend handles only lightweight token generation!`
      },
      {
        id: "valet-flow",
        title: "3. The 4-Step Upload Flow",
        content: `In the simulator, you'll see 4 distinct steps (frames):

**Step 1 — Request Permission**
Client → Server: *"I want to upload \`avatar-1.png\` to the \`media-uploads\` bucket."*

**Step 2 — Receive Signed URL** *(amber/yellow packet = response)*
Server → Client: Returns a pre-[signed URL](/learn/glossary/signed-url) containing:
- The bucket name
- The file name
- An expiry timestamp (e.g., valid for 15 minutes)
- A cryptographic signature proving the server authorized it

**Step 3 — Direct Upload**
Client → Storage: Sends the file bytes directly with the [signed URL](/learn/glossary/signed-url) as a token. The server is completely bypassed.

**Step 4 — Upload Confirmation** *(amber packet = response)*
Storage → Client: \`"Upload successful. File stored in media-uploads/avatar-1.png"\`

Watch the packet colors — **purple = request going forward**, **amber/yellow = response going backward**.

---

### Interactive Checkpoints`,
        checkpoints: [
          {
            id: "cp-valet-bucket",
            title: "▶ Add More Storage Buckets",
            description: "Click to add 'secure-invoices' and 'user-profiles' buckets to Cloud Storage. Then update the client to upload to different buckets.",
            targetNodeId: "storage-1",
            configPatch: {
              buckets: ["media-uploads", "secure-invoices", "user-profiles"]
            }
          }
        ]
      },
      {
        id: "valet-sandbox",
        title: "4. Build It in the Sandbox",
        content: `Implement the Valet Key pattern from scratch:

### 🛠️ Step-by-Step
1. Open the **Interactive Sandbox** in a new tab.
2. Add a **Client** — in the inspector, enable **Valet Key Flow** and set \`fileName: my-photo.jpg\`, \`targetBucket: user-uploads\`.
3. Add a **Server** (rename it "Upload Server") — connect Client → Server.
4. Add a **Cloud Storage** node — connect Client → Storage *(direct upload bypass!)*
5. Select the Storage node and add a bucket named \`user-uploads\`.
6. Click the Client node to run the simulation.
7. Watch the 4-step flow: Client → Server → Client → Storage → Client.

After completing, notice that the server only appeared in steps 1–2. The actual file data (step 3) bypassed it completely. **That's the valet key pattern!**

---

### 🎉 You've Finished All Guides!
Ready to design any system you can imagine? Open the Sandbox and experiment freely. Some ideas to try:
- Build a full stack with API Gateway + Load Balancer + Cache + DB
- Add a CDN in front of Storage for faster global delivery
- Test what happens when you misconfigure routing rules`
      }
    ]
  },
  {
    id: "message-queues",
    title: "Message Queues",
    subtitle: "Decoupling workloads with asynchronous message queues",
    description: "Learn how message queues enable reliable, asynchronous communication, buffer spike traffic, and implement the competing consumers scaling pattern.",
    scenarioId: "simple-message-queue",
    sections: [
      {
        id: "mq-components",
        title: "1. Components in This Simulation",
        content: `Let's understand each component of the Message Queue architecture on the canvas:

### 💻 Client
Initiates the action (e.g., clicking 'Order Now' in an e-commerce app). It sends requests to the Web Server.

### 🖥️ Web Server
The entrypoint API. Instead of executing heavy tasks (like processing payment or generating PDF invoices) synchronously, it packages the task into a message and publishes it to the queue immediately, returning a quick \`202 Accepted\` back to the client.

### 📬 Message Queue Broker
Acts as the buffer storage. It receives messages from producers (Web Server) and queues them. It manages message routing using FIFO/LIFO ordering.

### ⚙️ Worker Servers (×2)
Independent background consumers that pull messages from the queue, execute the heavy tasks in parallel, and store the final results in the database.

### 💾 Postgres Database
The shared persistent storage where Worker Servers write completed transaction records.`
      },
      {
        id: "mq-intro",
        title: "2. Why Use a Message Queue?",
        content: `Without a queue, if your database slows down, the entire user-facing web server blocks, leading to request timeouts and site crashes.

### Key Benefits:
- **Asynchronous Execution**: Offloads heavy tasks to background workers, keeping user-facing APIs fast and responsive.
- **Load Spike Buffering (Rate Limiting)**: If 10,000 requests hit your site in 1 second, the queue holds them safely in a buffer. The workers pull them at a controlled speed, protecting your database from crashing.
- **Competing Consumers Pattern**: Multiple workers poll the same queue. If Worker 1 is busy with a heavy request, Worker 2 picks up the next message, allowing easy horizontal scaling.

### Watch It in Action
Press **Play**. The client fires 3 requests. The web server sends them straight to the queue and returns quick responses. Then, watch the two Worker Servers pull and process the queue messages in parallel!`
      }
    ]
  },
  {
    id: "pub-sub",
    title: "Publish / Subscribe",
    subtitle: "Event-driven microservices fanout routing",
    description: "Learn how Pub/Sub brokers distribute messages to multiple subscriber services in parallel, enabling decoupled event-driven architectures.",
    scenarioId: "simple-pub-sub",
    sections: [
      {
        id: "pubsub-components",
        title: "1. Components in This Simulation",
        content: `Let's understand each component of the Pub/Sub architecture:

### 💻 Client
Sends requests to the Publisher Server (e.g. creating a new post or making a purchase).

### 🖥️ Publisher Server
Receives user requests and publishes the event to the Pub/Sub Broker (e.g., publishing an \`order.created\` event).

### 📡 Pub/Sub Broker
The event router (like Redis Pub/Sub, Kafka, or AWS SNS). It manages channels/topics and delivers published messages to all subscribed services.

### 🖥️ Email & Analytics Services
Decoupled subscriber microservices. They subscribe to specific channels on the broker. When an event is published, the broker pushes the message to all of them concurrently.`
      },
      {
        id: "pubsub-intro",
        title: "2. The Power of Pub/Sub (Fanout)",
        content: `Unlike a Message Queue where **only one consumer** handles each message, a Pub/Sub Broker implements **fanout delivery**, where **every subscriber** receives a copy of the message.

### Why Use Pub/Sub?
- **Extreme Decoupling**: The Publisher Server does not know who the subscribers are. If you want to add a new SMS notification service, you just connect it to the broker. You don't need to change any code in the Publisher Server.
- **Parallel Event Processing**: When a user registers, the Email Service sends a welcome email and the Analytics Service logs the user signup *simultaneously* in parallel.

### Watch It in Action
Press **Play**. You'll see the publisher server post an event to the broker. The broker immediately sends an ACK back to the publisher, and concurrently fans out the message to both Email and Analytics services at the exact same timestamp!`
      }
    ]
  }
];
