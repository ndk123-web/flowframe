"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";

type Theme = "light" | "dark";

interface GlossaryTerm {
  id: string;
  term: string;
  category: string;
  short: string;
  long: string;
  example?: string;
  related?: string[];
}

const CATEGORIES = [
  "All",
  "HTTP & APIs",
  "Infrastructure",
  "Databases",
  "Performance",
  "Security",
  "Architecture",
  "Networking",
];

export const TERMS: GlossaryTerm[] = [
  // ── HTTP & APIs ──────────────────────────────────────────────
  {
    id: "http",
    term: "HTTP",
    category: "HTTP & APIs",
    short: "The protocol used to transfer data on the web.",
    long: "HyperText Transfer Protocol (HTTP) is the foundation of data communication on the web. It's a request-response protocol — the client (browser or app) sends a request, and the server returns a response. HTTP is stateless, meaning each request is independent; the server doesn't remember previous requests unless you implement sessions or tokens.",
    example: "When you type a URL in your browser, your browser sends an HTTP GET request to that server.",
    related: ["HTTPS", "REST", "Status Codes"],
  },
  {
    id: "https",
    term: "HTTPS",
    category: "HTTP & APIs",
    short: "HTTP with encryption. Secure version of HTTP.",
    long: "HTTPS (HTTP Secure) is HTTP with TLS/SSL encryption layered on top. Every byte sent between client and server is encrypted so middlemen (routers, ISPs, attackers) cannot read it. HTTPS also verifies the server's identity via certificates, preventing impersonation attacks. Today, all production APIs and websites must use HTTPS.",
    example: "All payment pages, login forms, and APIs use HTTPS. Your browser shows a padlock icon for HTTPS sites.",
    related: ["HTTP", "TLS/SSL"],
  },
  {
    id: "rest",
    term: "REST",
    category: "HTTP & APIs",
    short: "A design style for building APIs using HTTP conventions.",
    long: "REST (Representational State Transfer) is an architectural style for designing APIs. RESTful APIs use standard HTTP methods (GET, POST, PUT, DELETE) and URL paths to represent resources. Key principles: statelessness (no session on server), uniform interface (consistent URL patterns), resource-based URLs. A RESTful URL looks like `/api/v1/users/42` — not `/getUserById?id=42`.",
    example: "GET /api/v1/posts → list posts. POST /api/v1/posts → create a post. DELETE /api/v1/posts/5 → delete post #5.",
    related: ["HTTP", "Endpoint", "JSON"],
  },
  {
    id: "endpoint",
    term: "Endpoint",
    category: "HTTP & APIs",
    short: "A specific URL that handles a particular type of request.",
    long: "An endpoint is a unique combination of an HTTP method and a URL path that the server listens on. Each endpoint maps to a specific handler function in your code. Endpoints define the 'surface area' of your API — the set of all actions clients can take. Well-designed APIs have endpoints that map cleanly to resources and actions.",
    example: "`GET /api/v1/users` is one endpoint. `POST /api/v1/users` is a different endpoint (same path, different method).",
    related: ["HTTP", "REST", "Route"],
  },
  {
    id: "status-codes",
    term: "HTTP Status Codes",
    category: "HTTP & APIs",
    short: "3-digit codes in every HTTP response indicating success or failure.",
    long: "Every HTTP response includes a status code that instantly communicates the outcome of the request. 1xx = informational, 2xx = success (200 OK, 201 Created, 204 No Content), 3xx = redirect (301 Moved Permanently, 302 Found), 4xx = client error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 429 Too Many Requests), 5xx = server error (500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable).",
    example: "A successful user creation returns 201. Trying to delete a non-existent resource returns 404.",
    related: ["HTTP", "REST"],
  },
  {
    id: "json",
    term: "JSON",
    category: "HTTP & APIs",
    short: "The universal format for exchanging structured data between systems.",
    long: "JSON (JavaScript Object Notation) is a lightweight text format for representing structured data as key-value pairs, arrays, and nested objects. It's human-readable and supported by every programming language. Almost every modern API sends and receives JSON. JSON supports: strings (\"text\"), numbers (42), booleans (true/false), null, arrays ([...]), and objects ({...}).",
    example: `{"id": "usr_001", "name": "Rohan", "active": true, "scores": [98, 87]}`,
    related: ["REST", "Request/Response"],
  },
  {
    id: "request-response",
    term: "Request / Response",
    category: "HTTP & APIs",
    short: "The fundamental interaction pattern of HTTP communication.",
    long: "Every HTTP interaction follows a request-response cycle. The client sends a Request containing: method, URL, headers (metadata), and optionally a body. The server processes it and sends a Response containing: status code, headers, and optionally a body. This is synchronous — the client waits until the server responds before proceeding. The full cycle happens in milliseconds over a fast network.",
    example: "Browser sends: `GET /api/users`. Server replies: `200 OK` with a JSON array of users.",
    related: ["HTTP", "Headers", "JSON"],
  },
  {
    id: "headers",
    term: "HTTP Headers",
    category: "HTTP & APIs",
    short: "Metadata attached to HTTP requests and responses.",
    long: "Headers are key-value pairs that carry metadata alongside request and response bodies. Common request headers: `Authorization` (auth token), `Content-Type` (format of body, e.g., application/json), `Accept` (what formats the client can handle). Common response headers: `Cache-Control` (caching rules), `Content-Type` (format of response), `X-Request-ID` (for tracing). Headers are invisible to end users but critical for system behaviour.",
    example: "`Authorization: Bearer eyJhbGci...` — tells the server who you are.",
    related: ["HTTP", "Authentication", "Cache-Control"],
  },
  {
    id: "api",
    term: "API",
    category: "HTTP & APIs",
    short: "A defined contract for how software components communicate.",
    long: "API (Application Programming Interface) is a set of rules defining how one software component talks to another. A web API exposes endpoints that clients call to read or modify data. APIs abstract internal implementation — the client doesn't care how the server stores data, it just calls the agreed-upon endpoint and gets a response. Public APIs (e.g. Google Maps, Stripe) let external developers build on top of your platform.",
    example: "Stripe's API lets you charge a card with `POST /v1/charges` — you don't need to understand their internals.",
    related: ["REST", "Endpoint", "HTTP"],
  },

  // ── Infrastructure ───────────────────────────────────────────
  {
    id: "server",
    term: "Web Server",
    category: "Infrastructure",
    short: "A program that listens for HTTP requests and sends back responses.",
    long: "A web server is software (like Node.js, Nginx, Apache) running on a machine that: 1) opens a port (usually 80 or 443), 2) listens for incoming TCP connections, 3) parses HTTP requests, 4) executes the matching handler code, 5) sends the HTTP response back. The word 'server' can refer to the software or the physical/virtual machine running it. In distributed systems, you typically run many server instances behind a load balancer.",
    example: "Node.js + Express is a popular web server. It listens on port 3000 and handles HTTP routes.",
    related: ["Load Balancer", "API Gateway", "Endpoint"],
  },
  {
    id: "load-balancer",
    term: "Load Balancer",
    category: "Infrastructure",
    short: "Distributes incoming traffic across multiple servers.",
    long: "A load balancer sits in front of a pool of servers and routes each incoming request to one of them. This prevents any single server from becoming a bottleneck. Load balancers also enable high availability — if one server crashes, the load balancer stops sending it traffic automatically. Common algorithms: Round Robin (1→2→3→1...), Least Connections (least busy server), IP Hash (same client always hits same server).",
    example: "Netflix runs thousands of servers behind load balancers so no single server handles all streaming traffic.",
    related: ["Server", "Horizontal Scaling", "High Availability"],
  },
  {
    id: "api-gateway",
    term: "API Gateway",
    category: "Infrastructure",
    short: "A single entry point that routes requests to the right backend service.",
    long: "An API Gateway acts as a reverse proxy sitting between clients and your backend services. It handles: routing (forwards /users requests to the user service, /payments to the payment service), authentication (validates tokens before forwarding), rate limiting, request/response transformation, and logging. It hides the complexity of your microservices from the outside world. Clients only talk to one address — the gateway.",
    example: "AWS API Gateway, Kong, and Nginx can all act as an API gateway.",
    related: ["Load Balancer", "Microservices", "Rate Limiting"],
  },
  {
    id: "cdn",
    term: "CDN",
    category: "Infrastructure",
    short: "A global network of servers that deliver content from the closest location.",
    long: "A Content Delivery Network (CDN) is a distributed system of edge servers spread across the globe. When a user requests a file (image, JS bundle, video), the CDN serves it from the edge node closest to them — reducing latency dramatically. CDNs cache static assets, absorb traffic spikes, and protect origin servers from being directly exposed. Cloudflare, AWS CloudFront, and Fastly are popular CDNs.",
    example: "An image served from a CDN edge node in Mumbai to an Indian user has ~10ms latency vs ~200ms from a US server.",
    related: ["Cache", "Latency", "Cloud Storage"],
  },
  {
    id: "reverse-proxy",
    term: "Reverse Proxy",
    category: "Infrastructure",
    short: "A server that sits in front of backends and forwards client requests to them.",
    long: "A reverse proxy accepts requests on behalf of backend servers and forwards them transparently. Unlike a forward proxy (which acts for clients), a reverse proxy acts for servers. It can handle SSL termination (so backend servers don't need to process HTTPS), compression, caching, and request routing. Nginx is commonly used as a reverse proxy in front of application servers.",
    example: "Client thinks it's talking to one server at myapp.com but Nginx forwards to different backends based on the path.",
    related: ["Load Balancer", "API Gateway", "Nginx"],
  },
  {
    id: "horizontal-scaling",
    term: "Horizontal Scaling",
    category: "Infrastructure",
    short: "Adding more server instances to handle more load.",
    long: "Horizontal scaling (scaling out) means adding more machines/instances to your system to share the load. This is the preferred approach for web services because it enables near-linear capacity growth and builds in redundancy. Contrast with vertical scaling (scaling up) which means giving your existing server more CPU/RAM — limited by hardware maximums. Most cloud services make horizontal scaling easy with auto-scaling groups.",
    example: "If your API handles 1000 req/s with 2 servers, adding 2 more (horizontal scale) should handle ~2000 req/s.",
    related: ["Load Balancer", "Vertical Scaling", "High Availability"],
  },
  {
    id: "vertical-scaling",
    term: "Vertical Scaling",
    category: "Infrastructure",
    short: "Making a single server more powerful by adding CPU/RAM.",
    long: "Vertical scaling (scaling up) means upgrading a single machine's hardware: more CPU cores, more RAM, faster storage. It's simpler to implement (no code changes needed) but has hard limits — you can only scale up to the largest available machine. Also, a bigger single machine is still a single point of failure. Vertical scaling is useful for stateful components like databases that are harder to scale horizontally.",
    example: "Upgrading your Postgres database server from 16GB to 128GB RAM is vertical scaling.",
    related: ["Horizontal Scaling", "Databases"],
  },

  // ── Databases ────────────────────────────────────────────────
  {
    id: "database",
    term: "Database",
    category: "Databases",
    short: "A system for persistently storing and querying structured data.",
    long: "A database is software that stores data reliably on disk (or memory) and provides mechanisms to create, read, update, and delete records (CRUD). Databases ensure data survives restarts (durability), can be queried efficiently (indexes), and maintain consistency under concurrent writes (transactions). Two main types: relational (SQL — structured tables with relationships) and non-relational (NoSQL — flexible schemas for different data models).",
    example: "User accounts, blog posts, orders — all stored in a database so they persist after the server restarts.",
    related: ["SQL", "PostgreSQL", "Redis", "NoSQL"],
  },
  {
    id: "sql",
    term: "SQL",
    category: "Databases",
    short: "The language for querying and managing relational databases.",
    long: "SQL (Structured Query Language) is the standard language for interacting with relational databases. Core operations: SELECT (read), INSERT (create), UPDATE (modify), DELETE (remove). SQL databases organize data into tables with rows and columns. Relationships between tables are defined using foreign keys. SQL is powerful for complex joins, aggregations, and enforcing data integrity with constraints.",
    example: "`SELECT name, email FROM users WHERE role = 'admin' ORDER BY created_at DESC;`",
    related: ["PostgreSQL", "Database", "Index"],
  },
  {
    id: "postgres",
    term: "PostgreSQL",
    category: "Databases",
    short: "A robust, full-featured open-source SQL database.",
    long: "PostgreSQL (Postgres) is a powerful open-source relational database known for its reliability, feature richness, and standards compliance. It supports ACID transactions, complex queries, JSON columns, full-text search, and custom data types. Postgres uses a disk-based storage engine — data is durable across restarts. It's the most popular open-source database for production web applications.",
    example: "Storing users, orders, and products in Postgres gives you SQL queries, joins, and ACID guarantees.",
    related: ["SQL", "Database", "Redis", "Index"],
  },
  {
    id: "redis",
    term: "Redis",
    category: "Databases",
    short: "An in-memory key-value store used for caching and real-time data.",
    long: "Redis (Remote Dictionary Server) is an in-memory data store that holds data in RAM, making reads and writes extremely fast (~1ms). Common uses: caching (cache-aside pattern), session storage, rate limiting counters, pub/sub messaging, and queues. Redis is not a replacement for a disk database — data lives in RAM and can be lost on restart unless persistence is configured. Typically used alongside Postgres: Postgres for durability, Redis for speed.",
    example: "Cache a database query result in Redis with a 5-minute TTL. Next 1000 requests skip Postgres entirely.",
    related: ["Cache", "TTL", "PostgreSQL", "Cache-Aside"],
  },
  {
    id: "nosql",
    term: "NoSQL",
    category: "Databases",
    short: "Non-relational databases with flexible schemas.",
    long: "NoSQL databases don't use tables and SQL. They come in several types: Key-Value (Redis, DynamoDB), Document (MongoDB — stores JSON-like documents), Wide-Column (Cassandra — for time-series data), and Graph (Neo4j — for relationship-heavy data). NoSQL databases often sacrifice strict consistency for higher availability and horizontal scalability. Use them when your data model doesn't fit neatly into tables or when you need extreme write throughput.",
    example: "MongoDB stores each user as a flexible JSON document — no need to define columns upfront.",
    related: ["Database", "Redis", "SQL"],
  },
  {
    id: "index",
    term: "Database Index",
    category: "Databases",
    short: "A data structure that speeds up queries at the cost of write overhead.",
    long: "An index is an auxiliary data structure (usually a B-tree) that allows the database to find rows matching a query condition without scanning the entire table. Without an index on `email`, finding a user by email requires a full table scan (O(n)). With an index, it's O(log n). Indexes speed up reads dramatically but slow down writes (the index must be updated on every INSERT/UPDATE/DELETE). Index columns you query or sort by frequently.",
    example: "Add an index on `users.email` so `SELECT * FROM users WHERE email = 'x@y.com'` is instant even with 10M rows.",
    related: ["SQL", "PostgreSQL", "Performance"],
  },

  // ── Performance ──────────────────────────────────────────────
  {
    id: "cache",
    term: "Cache",
    category: "Performance",
    short: "A fast-access storage layer that stores frequently used data.",
    long: "A cache stores copies of data closer to where it's needed, reducing the time to access it. When data is requested, the system checks the cache first (cache hit → fast return) before going to the slower source (cache miss → fetch from DB, store in cache for next time). Caches exist at many levels: CPU L1/L2 cache, browser cache, CDN cache, Redis application cache, database query cache.",
    example: "Store a blog post's HTML in Redis for 5 minutes. 10,000 visitors get it instantly without touching Postgres.",
    related: ["Redis", "Cache-Aside", "TTL", "CDN"],
  },
  {
    id: "cache-aside",
    term: "Cache-Aside Pattern",
    category: "Performance",
    short: "Check cache first; on miss, fetch from DB and update cache.",
    long: "Cache-Aside (also called Lazy Loading) is the most common caching pattern. The application code is responsible for managing the cache: 1) Look up data in cache. 2) Cache HIT: return it immediately. 3) Cache MISS: query the database, store the result in cache with a TTL, return it. The cache is only populated on demand — data that's never requested is never cached. This keeps the cache lean and relevant.",
    example: "Redis has `user:42` → HIT, return in <1ms. Redis doesn't have `user:43` → query Postgres, store in Redis, return.",
    related: ["Cache", "Redis", "TTL"],
  },
  {
    id: "ttl",
    term: "TTL",
    category: "Performance",
    short: "Time To Live — how long cached data stays valid before expiring.",
    long: "TTL (Time To Live) is a duration set on cached items. After the TTL expires, the cache automatically deletes the item and the next request will re-fetch it from the source. TTL prevents stale data from being served indefinitely. Short TTL = more up-to-date data but more cache misses. Long TTL = fewer misses but potentially stale data. Setting TTL requires understanding how often your data changes.",
    example: "Cache user profile data with TTL=300s (5 min). User updates profile → cache is stale for up to 5 min. That's acceptable.",
    related: ["Cache", "Redis", "Cache-Aside"],
  },
  {
    id: "latency",
    term: "Latency",
    category: "Performance",
    short: "The time delay between sending a request and receiving a response.",
    long: "Latency measures how long a single operation takes — typically measured in milliseconds. Common latency benchmarks: L1 cache ~1ns, RAM ~100ns, SSD read ~100μs, local network ~1ms, Redis ~1ms, same-datacenter DB query ~5ms, intercontinental HTTP ~200ms. High latency frustrates users. Reduce latency through caching, CDNs, efficient queries, database indexes, and colocating services.",
    example: "A Redis read: ~1ms. A Postgres query without an index on 10M rows: ~5,000ms. The difference is latency.",
    related: ["Cache", "CDN", "Throughput"],
  },
  {
    id: "throughput",
    term: "Throughput",
    category: "Performance",
    short: "The number of requests a system can handle per unit of time.",
    long: "Throughput measures how many operations a system can complete per second (requests/sec, transactions/sec). Unlike latency (speed of one operation), throughput is about total capacity. A system can have low latency but low throughput (handles one request fast, but queues up others) or high throughput with higher latency (batch processing). Optimizing throughput usually involves horizontal scaling, connection pooling, and async processing.",
    example: "An API that handles 10,000 requests per second has higher throughput than one handling 1,000 req/s.",
    related: ["Latency", "Horizontal Scaling", "Rate Limiting"],
  },
  {
    id: "rate-limiting",
    term: "Rate Limiting",
    category: "Performance",
    short: "Restricting how many requests a client can make in a time window.",
    long: "Rate limiting controls how many times a specific client (identified by IP, API key, or user ID) can call your API within a time window. It prevents abuse, protects your servers from being overwhelmed, and ensures fair usage. Common algorithms: Token Bucket (replenish tokens at fixed rate, spend one per request), Fixed Window (count requests per minute, reset at end), Sliding Window (more accurate, avoids boundary spikes).",
    example: "Free API tier: 100 requests/hour. When exceeded, server returns `429 Too Many Requests`.",
    related: ["API Gateway", "Throughput", "Status Codes"],
  },

  // ── Security ─────────────────────────────────────────────────
  {
    id: "authentication",
    term: "Authentication",
    category: "Security",
    short: "Verifying who you are (identity).",
    long: "Authentication (AuthN) is the process of verifying the identity of a user or service. Common methods: username + password, API keys, OAuth 2.0 (sign in with Google/GitHub), and JWT tokens. When you log in, the server authenticates you and issues a token. That token is sent with every subsequent request so the server knows who is making the request.",
    example: "You log in with email + password → server returns a JWT → you send that JWT in every future API request header.",
    related: ["Authorization", "JWT", "HTTPS"],
  },
  {
    id: "authorization",
    term: "Authorization",
    category: "Security",
    short: "Verifying what you're allowed to do (permissions).",
    long: "Authorization (AuthZ) happens after authentication. Once the server knows who you are, it checks if you have permission to perform the requested action. Role-based access control (RBAC) assigns roles (admin, editor, viewer) with different permissions. An admin can delete any post; a regular user can only delete their own. Always implement authorization checks server-side — never trust the client.",
    example: "Authenticated as user_99. Trying to DELETE /posts/1 (owned by user_01). Server returns 403 Forbidden.",
    related: ["Authentication", "Status Codes"],
  },
  {
    id: "jwt",
    term: "JWT",
    category: "Security",
    short: "A compact, self-contained token for transmitting identity claims.",
    long: "JWT (JSON Web Token) is a standardized token format: a base64-encoded JSON header.payload.signature. The payload contains claims (user ID, roles, expiry). The signature is created with a secret key — only the server can verify it's authentic. JWTs are stateless: the server doesn't need a database lookup to validate them — it just verifies the signature. Common for REST API authentication.",
    example: "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    related: ["Authentication", "HTTPS"],
  },
  {
    id: "tls",
    term: "TLS / SSL",
    category: "Security",
    short: "Encryption protocol that secures data in transit.",
    long: "TLS (Transport Layer Security, successor to SSL) encrypts all data sent between client and server so no one in the middle can read it. It also authenticates the server using certificates issued by Certificate Authorities (CAs). TLS is what turns HTTP into HTTPS. When your browser shows a padlock, it means TLS is active. Today, TLS 1.3 is the standard — older versions are deprecated.",
    example: "Without TLS: password sent as plain text. With TLS: password sent as encrypted gibberish that only the server can decrypt.",
    related: ["HTTPS", "Authentication"],
  },
  {
    id: "signed-url",
    term: "Signed URL / Valet Key",
    category: "Security",
    short: "A pre-authorized URL with a time-limited access token for a specific resource.",
    long: "A signed URL (also called a valet key) is a URL that includes a cryptographic signature granting time-limited, scope-limited access to a specific resource without requiring full authentication. The server generates the signed URL, passes it to the client, and the client uses it to directly access (read or write) the resource — bypassing the server. Commonly used for direct-to-S3 file uploads, short-lived download links, or public CDN access to private files.",
    example: "Server generates signed URL for `s3://bucket/photo.jpg?expires=1720000000&sig=abc123`. Client uploads directly to S3.",
    related: ["Authentication", "Cloud Storage", "HTTPS"],
  },

  // ── Architecture ─────────────────────────────────────────────
  {
    id: "microservices",
    term: "Microservices",
    category: "Architecture",
    short: "An architecture where a system is split into small independent services.",
    long: "Microservices architecture decomposes a large application into small, independently deployable services — each responsible for one specific business capability (user service, payment service, email service, etc.). Each service has its own database, is developed and deployed independently, and communicates with others via APIs or message queues. Pros: independent scaling, independent deployments, technology flexibility. Cons: operational complexity, network latency, distributed system challenges.",
    example: "Instead of one monolith, Uber has: trip service, pricing service, driver service, payment service, all talking to each other via APIs.",
    related: ["Monolith", "API Gateway", "Load Balancer"],
  },
  {
    id: "monolith",
    term: "Monolith",
    category: "Architecture",
    short: "A single application that contains all functionality in one deployable unit.",
    long: "A monolithic architecture puts all of an application's code — user management, payments, notifications, etc. — into one codebase that is built and deployed as a single unit. Monoliths are simpler to develop and operate at small scale. As teams and traffic grow, monoliths can become hard to maintain, scale, and deploy safely. Many successful products start as monoliths and migrate to microservices when the scale warrants it.",
    example: "A Rails app with user auth, blog, and payments all in one repo — deploy it all at once. That's a monolith.",
    related: ["Microservices"],
  },
  {
    id: "high-availability",
    term: "High Availability (HA)",
    category: "Architecture",
    short: "Designing systems to minimize downtime and keep services running.",
    long: "High Availability means a system is designed to continue operating even when individual components fail. Achieved through redundancy (multiple instances of each service), automatic failover (traffic reroutes when a node dies), health checks (load balancer removes unhealthy nodes), and across multiple availability zones/regions. Common HA targets: 99.9% uptime (~8.7 hours downtime/year), 99.99% (~52 minutes/year), 99.999% (~5 minutes/year — 'five nines'.",
    example: "Three web servers behind a load balancer: if server 2 crashes, servers 1 and 3 handle all traffic automatically.",
    related: ["Load Balancer", "Horizontal Scaling", "Failover"],
  },
  {
    id: "fault-tolerance",
    term: "Fault Tolerance",
    category: "Architecture",
    short: "The ability of a system to continue operating despite component failures.",
    long: "Fault tolerance means the system can withstand partial failures without complete outage. Strategies: circuit breakers (stop calling a failing downstream service and return a fallback), retries with backoff (retry failed requests but wait longer each time), bulkheads (isolate failures in one part from spreading), timeouts (don't wait forever for a response), and graceful degradation (serve reduced functionality rather than nothing).",
    example: "Payment service is down → instead of crashing, the API returns: 'Payment temporarily unavailable, try again in 2 minutes.'",
    related: ["High Availability", "Circuit Breaker"],
  },
  {
    id: "circuit-breaker",
    term: "Circuit Breaker",
    category: "Architecture",
    short: "Automatically stops calling a failing service to let it recover.",
    long: "A circuit breaker pattern monitors calls to a downstream service. If failures exceed a threshold (e.g., 50% error rate in 30 seconds), the circuit 'opens' — all further calls are immediately rejected with a fallback response, without even trying the failing service. After a cooldown period, a few test requests go through (half-open state). If they succeed, the circuit 'closes' and normal operation resumes. This prevents cascading failures across services.",
    example: "Email service starts failing. Circuit breaker opens. API returns success immediately while queuing emails for later — users aren't blocked.",
    related: ["Fault Tolerance", "Microservices"],
  },

  // ── Networking ───────────────────────────────────────────────
  {
    id: "dns",
    term: "DNS",
    category: "Networking",
    short: "Translates human-readable domain names to IP addresses.",
    long: "DNS (Domain Name System) is the internet's phonebook. When you type 'google.com', your device asks a DNS resolver to translate it to an IP address (e.g., 142.250.80.46) so it can connect to the right server. DNS records include A records (domain → IP), CNAME (alias), MX (email routing), and TXT (verification). DNS responses are cached with a TTL — changes to DNS can take minutes to propagate globally.",
    example: "myapp.com → DNS lookup → 104.21.55.30 → browser connects to that IP → TCP handshake → HTTP request.",
    related: ["IP Address", "CDN"],
  },
  {
    id: "ip",
    term: "IP Address",
    category: "Networking",
    short: "A unique numerical address identifying a device on a network.",
    long: "An IP (Internet Protocol) address is a numerical label assigned to each device on a network. IPv4 addresses are 32-bit numbers written as four octets (e.g., 192.168.1.50). IPv6 uses 128-bit addresses (e.g., 2001:db8::1). Public IPs are globally routable (your server's address on the internet). Private IPs (10.x.x.x, 192.168.x.x) are used within internal networks. NAT translates between private and public IPs.",
    example: "Your server's public IP: 54.92.17.33. Clients connect to it. Internally, services communicate via private IPs.",
    related: ["DNS", "Networking"],
  },
  {
    id: "tcp",
    term: "TCP",
    category: "Networking",
    short: "A reliable, connection-based transport protocol that guarantees delivery.",
    long: "TCP (Transmission Control Protocol) is the transport layer protocol underlying HTTP. It establishes a connection via a 3-way handshake (SYN → SYN-ACK → ACK), then ensures all data packets arrive in order and are acknowledged. Lost packets are retransmitted. This reliability makes TCP ideal for HTTP/HTTPS. The trade-off is overhead — the handshake, acknowledgments, and retransmission add latency compared to UDP.",
    example: "HTTP/1.1 and HTTP/2 run over TCP. One TCP connection can carry multiple HTTP requests (keep-alive).",
    related: ["HTTP", "Latency"],
  },
  {
    id: "websocket",
    term: "WebSocket",
    category: "Networking",
    short: "A persistent, full-duplex connection for real-time communication.",
    long: "WebSocket is a protocol that upgrades an HTTP connection into a persistent, bidirectional channel. Once established, both client and server can push messages at any time without the overhead of repeated HTTP requests. This makes WebSockets ideal for real-time features: live chat, collaborative editing (like Google Docs), stock price feeds, gaming, notifications. HTTP/1.1 polling is inefficient for these use cases — WebSocket is purpose-built.",
    example: "Slack uses WebSockets — when someone sends a message, the server pushes it to all connected clients instantly.",
    related: ["HTTP", "TCP"],
  },
  {
    id: "bandwidth",
    term: "Bandwidth",
    category: "Networking",
    short: "The maximum data transfer capacity of a network connection.",
    long: "Bandwidth is the maximum amount of data that can be transmitted through a network connection per unit of time — measured in Mbps or Gbps. It's often confused with latency: latency is delay, bandwidth is capacity. A high-bandwidth, high-latency connection (like a satellite link) can transfer large files quickly but interactive applications feel slow. Network bottlenecks become bandwidth constraints when many clients send large payloads simultaneously.",
    example: "Uploading 10GB files directly through your server uses server bandwidth. Valet Key pattern offloads that to Cloud Storage.",
    related: ["Latency", "Throughput"],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "HTTP & APIs": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Infrastructure": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "Databases": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Performance": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Security": "bg-red-500/10 text-red-400 border-red-500/20",
  "Architecture": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Networking": "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20",
};

function TermCard({ term, expanded, onToggle }: { term: GlossaryTerm; expanded: boolean; onToggle: () => void }) {
  const catColor = CATEGORY_COLORS[term.category] ?? "bg-slate-500/10 text-slate-400 border-slate-500/20";
  const hasDetail = true;
  return (
    <motion.div
      layout
      className={`rounded-xl border transition-all duration-200 overflow-hidden ${expanded ? "border-violet-500/30 shadow-[0_0_0_1px_rgba(139,92,246,0.1)]" : "border-[var(--border)] hover:border-[var(--border)]"} bg-[var(--surface)]/50 backdrop-blur-sm`}
    >
      <div
        onClick={onToggle}
        className="w-full text-left px-5 py-4 flex items-center gap-4 cursor-pointer select-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${catColor}`}>
              {term.category}
            </span>
            <h3 className="text-sm font-bold text-[color:var(--foreground)]">{term.term}</h3>
            <Link
              href={`/learn/glossary/${term.id}`}
              onClick={e => e.stopPropagation()}
              className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/20 hover:border-violet-500/40 uppercase tracking-wide transition-all duration-150 relative z-10"
            >
              Deep Dive →
            </Link>
          </div>
          <p className="text-xs text-[color:var(--foreground)]/50 mt-1 leading-relaxed">{term.short}</p>
        </div>
        <span className={`shrink-0 text-[color:var(--foreground)]/30 text-sm transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
          ▾
        </span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-[var(--border)]/50 pt-4">
              {/* Full explanation */}
              <p className="text-sm text-[color:var(--foreground)]/70 leading-relaxed">{term.long}</p>

              {/* Example */}
              {term.example && (
                <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">Example</p>
                  <p className="text-xs text-[color:var(--foreground)]/65 leading-relaxed font-mono">{term.example}</p>
                </div>
              )}

              {/* Footer: related + deep dive CTA */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {term.related && term.related.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--foreground)]/30">Related:</p>
                    {term.related.map(r => (
                      <span key={r} className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--border)]/60 text-[color:var(--foreground)]/50">{r}</span>
                    ))}
                  </div>
                )}
                <Link
                  href={`/learn/glossary/${term.id}`}
                  onClick={e => e.stopPropagation()}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/25 hover:border-violet-500/50 px-3.5 py-1.5 text-xs font-bold text-violet-400 transition-all duration-150"
                >
                  Full Deep Dive →
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function GlossaryPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("flowframe-theme") as Theme | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
    else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) setTheme("light");
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return TERMS.filter(t => {
      const matchCat = activeCategory === "All" || t.category === activeCategory;
      const matchQ = !q || t.term.toLowerCase().includes(q) || t.short.toLowerCase().includes(q) || t.long.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      return matchCat && matchQ;
    }).sort((a, b) => a.term.localeCompare(b.term));
  }, [query, activeCategory]);

  const countByCategory = useMemo(() => {
    const counts: Record<string, number> = { All: TERMS.length };
    TERMS.forEach(t => { counts[t.category] = (counts[t.category] ?? 0) + 1; });
    return counts;
  }, []);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] relative">
      <div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-20" />
      <div className="pointer-events-none absolute -right-32 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-violet-500/6 blur-[140px]" />

      <SiteHeader
        theme={theme}
        onToggleTheme={() => setTheme(p => p === "dark" ? "light" : "dark")}
        showHomeLink
        badgeText="Learn Academy"
        alwaysGlass
      />

      {/* Breadcrumb */}
      <div className="border-b border-[var(--border)]/60 bg-[var(--surface)]/40 backdrop-blur">
        <div className="mx-auto max-w-5xl px-5 sm:px-8 h-10 flex items-center gap-2 text-xs text-[color:var(--foreground)]/40 font-mono">
          <Link href="/learn" className="hover:text-violet-400 transition-colors">← Learn</Link>
          <span>/</span>
          <span className="text-violet-400">Systems Glossary</span>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 sm:px-8 py-12 space-y-10">

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4 max-w-2xl"
        >
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/35 font-mono">Reference</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mt-1">
              Systems <span className="text-violet-400">Glossary</span>
            </h1>
          </div>
          <p className="text-base text-[color:var(--foreground)]/55 leading-relaxed">
            {TERMS.length} terms across {CATEGORIES.length - 1} categories — from HTTP basics to distributed systems patterns. Search for anything.
          </p>

          {/* Search */}
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/30">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setExpandedId(null); }}
              placeholder="Search terms, concepts, acronyms…"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 pl-10 pr-4 py-3 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--foreground)]/30 outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/10 transition-all duration-150 backdrop-blur-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--foreground)]/30 hover:text-[color:var(--foreground)]/60 transition-colors text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
        </motion.div>

        {/* Category filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.06 }}
          className="flex flex-wrap gap-2"
        >
          {CATEGORIES.map(cat => {
            const count = countByCategory[cat] ?? 0;
            const active = activeCategory === cat;
            const color = CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => { setActiveCategory(cat); setExpandedId(null); }}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all duration-150 ${
                  active
                    ? cat === "All"
                      ? "border-violet-500/50 bg-violet-500/15 text-violet-400"
                      : `${color} opacity-100`
                    : "border-[var(--border)] bg-[var(--surface)]/40 text-[color:var(--foreground)]/50 hover:text-[color:var(--foreground)]/80 hover:border-[var(--border)]"
                }`}
              >
                {cat}
                <span className={`text-[9px] rounded-full px-1.5 py-0.5 ${active ? "bg-[var(--background)]/30" : "bg-[var(--surface-muted)]"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>

        {/* Results */}
        <motion.div layout className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">🔍</p>
              <p className="text-base font-semibold text-[color:var(--foreground)]/60">No terms match "{query}"</p>
              <p className="text-sm text-[color:var(--foreground)]/35">Try a shorter search or browse by category above.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 pb-1">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/30 font-mono">
                  {filtered.length} {filtered.length === 1 ? "Term" : "Terms"}
                  {query && ` for "${query}"`}
                  {activeCategory !== "All" && ` in ${activeCategory}`}
                </p>
              </div>
              {filtered.map(term => (
                <TermCard
                  key={term.id}
                  term={term}
                  expanded={expandedId === term.id}
                  onToggle={() => setExpandedId(prev => prev === term.id ? null : term.id)}
                />
              ))}
            </>
          )}
        </motion.div>

      </div>
    </main>
  );
}
