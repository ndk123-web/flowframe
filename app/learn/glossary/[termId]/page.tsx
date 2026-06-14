"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import SiteHeader from "@/components/SiteHeader";
import { TERMS } from "../page";

type Theme = "light" | "dark";

interface Section {
  title: string;
  body: string; // supports **bold**, `code`, ```blocks```, - lists, numbered lists
}

interface TermDetail {
  id: string;
  term: string;
  category: string;
  categoryColor: string;
  tldr: string;
  diagram?: string;
  sections: Section[];
  codeExample?: { label: string; code: string };
  misconception?: string;
  realWorld?: string;
  relatedIds?: string[];
  nextId?: string;
}

// ── Deep content for each term ──────────────
const TERM_MAP: Record<string, TermDetail> = {
  http: {
    id: "http",
    term: "HTTP",
    category: "HTTP & APIs",
    categoryColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    tldr: "HTTP (HyperText Transfer Protocol) is the standardized language of the web that browsers and servers use to request and send data.",
    diagram: `  Browser (Client)          Server
  ─────────────────         ─────────────────
  │  GET /about    │──────▶ │  Routing Table │
  │  Host: site.co │        │  /about → HTML │
  └─────────────────        └───────┬────────
                                    │
  ─────────────────                 ▼
  │  200 OK        │◀────── HTML content
  │  <html>...</h>  │        Content-Type: text/html
  └─────────────────`,
    sections: [
      { title: "1. What is it?", body: "HTTP stands for **HyperText Transfer Protocol**. It is the baseline agreement and collection of rules that defines how a web browser or mobile client requests files (like HTML, JSON, or images) and how a remote server returns them." },
      { title: "2. Why do we need it?", body: "Without HTTP, every browser developer and server vendor would build custom socket protocols. A Safari browser wouldn't know how to query a Node.js server. HTTP acts as the universal translator, ensuring that any client can communicate with any backend seamlessly." },
      { title: "3. How does it work?", body: "1. The user types a URL or triggers an API call.\n2. The client resolves the domain name to an IP address via [DNS](/learn/glossary/dns) and opens a TCP connection.\n3. The client sends a plaintext request message (containing method, path, headers, and body).\n4. The server parses this, queries databases if needed, and returns an HTTP response containing a [status code](/learn/glossary/status-codes) (like 200 OK or 404 Not Found), headers, and the response body." },
      { title: "4. Real-World Example & Analogy", body: "Think of ordering food at a restaurant:\n- You are the **Client**.\n- The waiter is the **HTTP protocol** carrying the message.\n- Your order (\"I want a burger\") is the **Request**.\n- The kitchen is the **Server**.\n- The burger brought to your table is the **Response**, and the waiter saying \"Here you go!\" represents status **200 OK**." },
      { title: "5. Core Logic & Architecture Concept", body: "HTTP is **stateless**. This means each request-response roundtrip is entirely independent; the server does not remember you from a previous request. To handle user identities, we must layer state management techniques (such as [cookies](/learn/glossary/headers) or [JWT tokens](/learn/glossary/jwt)) on top of HTTP." }
    ],
    misconception: "HTTP is not just for web browsers. Mobile apps, desktop applications, microservices, and smart IoT devices all utilize HTTP to send and receive structured data.",
    realWorld: "Every search, page navigation, and API fetch runs over HTTP. It is the core communication medium of the modern internet.",
    relatedIds: ["https", "rest", "status-codes"],
    nextId: "https",
  },


  https: {
    id: "https",
    term: "HTTPS",
    category: "HTTP & APIs",
    categoryColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    tldr: "HTTPS is HTTP with a layer of cryptographic encryption, keeping passwords and user data safe from eavesdroppers.",
    diagram: `  Client                          Server
  ──────                          ──────
  │         TLS Handshake        │
  │──────── Hello ──────────────▶│
  │◀─────── Certificate ─────────│  (identity proof)
  │──────── Session Key ────────▶│  (encrypted key exchange)
  │                               │
  │  All further traffic is       │
  │  encrypted with session key   │
  │◀─────────────────────────────▶│`,
    sections: [
      { title: "1. What is it?", body: "HTTPS stands for **HyperText Transfer Protocol Secure**. It is simply standard HTTP traffic wrapped inside a secure, encrypted tunnel managed by the **TLS (Transport Layer Security)** protocol." },
      { title: "2. Why do we need it?", body: "Standard HTTP requests are sent in raw, readable text. If you log into a site over HTTP at a public coffee shop, anyone sniffing the local WiFi can steal your password. HTTPS scrambles this data so that only you and the server can read it." },
      { title: "3. How does it work?", body: "1. The browser connects to the server and initiates a **TLS handshake**.\n2. The server presents its digital security certificate, proving its identity.\n3. The browser checks the certificate against trusted authorities (like Let's Encrypt).\n4. Browser and server agree on a shared secret key.\n5. All subsequent HTTP headers, paths, and bodies are encrypted using this secret key before transit." },
      { title: "4. Real-World Example & Analogy", body: "Imagine sending a bank check in the mail:\n- **HTTP**: Putting the check in a clear, unsealed envelope. Anyone handling the envelope can read your account details.\n- **HTTPS**: Putting the check in a heavy-duty, titanium lockbox. Only you and the banker have the key to open the box." },
      { title: "5. Core Logic & Architecture Concept", body: "HTTPS guarantees three crucial pillars:\n1. **Encryption**: Scrambles data to prevent eavesdropping.\n2. **Data Integrity**: Ensures that the data is not modified or tampered with during transit.\n3. **Authentication**: Confirms that you are actually talking to the official website and not an impersonating server." }
    ],
    codeExample: { label: "Security headers enforced over HTTPS", code: `HTTP/2 200 OK
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY` },
    misconception: "HTTPS does not mean a website is safe to trust. A malicious or scam website can easily obtain a free TLS certificate and run over HTTPS. It only means the connection is encrypted, not that the content is honest.",
    realWorld: "All payment transactions, logins, and API transfers require HTTPS. Search engines down-rank pages that do not implement HTTPS, and modern browsers display active security warnings on standard HTTP links.",
    relatedIds: ["http", "tls", "authentication"],
    nextId: "rest",
  },
  rest: {
    id: "rest",
    term: "REST",
    category: "HTTP & APIs",
    categoryColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    tldr: "REST is an API design style that uses standard HTTP verbs and clean, resource-based URLs to organize and edit data.",
    diagram: `  RESTful API Design Pattern:
  Resource: Users
  ──────────────────────────────────────────
  GET    /api/v1/users       →  list all
  POST   /api/v1/users       →  create one
  GET    /api/v1/users/:id   →  get one
  PUT    /api/v1/users/:id   →  replace one
  PATCH  /api/v1/users/:id   →  update fields
  DELETE /api/v1/users/:id   →  delete one
  ──────────────────────────────────────────`,
    sections: [
      { title: "1. What is it?", body: "REST (Representational State Transfer) is an architectural style for designing APIs. It is a set of design conventions for exposing database models over HTTP so that client apps can perform CRUD operations on them." },
      { title: "2. Why do we need it?", body: "Without a design convention like REST, API URLs become chaotic (e.g. `/get-users-list`, `/create_new_user_v2`, `/deleteUserById?id=9`). REST standardizes layouts so APIs are predictable, clean, and easy for other developers to integrate." },
      { title: "3. How does it work?", body: "REST organizes APIs around **Resources** (represented by nouns in URLs, like `/users` or `/posts`) and utilizes standard **HTTP Methods** as actions:\n- **GET**: Read data\n- **POST**: Create data\n- **PUT/PATCH**: Update data\n- **DELETE**: Remove data" },
      { title: "4. Real-World Example & Analogy", body: "Think of an office filing cabinet:\n- The cabinet drawer is named **`/documents`** (Resource URL).\n- Pulling a folder out to read it is a **GET** request.\n- Dropping a brand new folder in is a **POST** request.\n- Editing lines on an existing paper is a **PATCH** request.\n- Shredding a folder is a **DELETE** request." },
      { title: "5. Core Logic & Architecture Concept", body: "A key constraint of REST is **statelessness**. The server must not store any client context (like session state) internally. Every single API request from the client must contain all necessary parameters and tokens to authenticate and complete the action. This makes REST APIs highly scalable and easy to distribute behind load balancers." }
    ],
    codeExample: { label: "Standard REST CRUD route pattern", code: `GET    /api/v1/posts        → 200 { posts: [...] }
POST   /api/v1/posts        → 201 { id: "p_91", title: "..." }
PATCH  /api/v1/posts/p_91   → 200 { updated fields }
DELETE /api/v1/posts/p_91   → 200 { deleted: true }` },
    misconception: "REST is not a protocol or a library. It is simply a style guide. A system does not crash if it violates REST constraints, but it will be harder to maintain and scale.",
    realWorld: "Most web platforms (GitHub, Stripe, Shopify, Twitter) expose REST APIs. Developers use tools like `fetch` or `Axios` to make calls to these routes.",
    relatedIds: ["http", "json", "endpoint"],
    nextId: "endpoint",
  },
  endpoint: {
    id: "endpoint",
    term: "Endpoint",
    category: "HTTP & APIs",
    categoryColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    tldr: "An endpoint is a specific URL path + HTTP method pair that routes a request to a dedicated handler function on the server.",
    diagram: `  Server's Routing Table:
  ┌──────────────────────────────────────────┐
  │  GET  /api/v1/users     → listUsers()    │
  │  POST /api/v1/users     → createUser()   │
  │  DEL  /api/v1/users/:id → deleteUser()   │
  └──────────────────────────────────────────┘
  Incoming: POST /api/v1/users → matches row 2`,
    sections: [
      { title: "1. What is it?", body: "An endpoint is the entry point or address exposed by a web server, formed by combining an HTTP verb (method) with a URL path (e.g. `GET /api/v1/users`). It represents the physical destination where a client sends a request." },
      { title: "2. Why do we need it?", body: "A backend server runs many functions: creating users, sending emails, processing payments. We need a routing mechanism to connect incoming web requests to the correct block of execution code. Endpoints serve as this routing map." },
      { title: "3. How does it work?", body: "The web application registers an array of endpoints in its **routing table**. When a request arrives, the server checks the request method and path, matches it with a registered route, extracts parameters (like `/users/:id` matching `/users/42`), and executes the matching handler function." },
      { title: "4. Real-World Example & Analogy", body: "Think of an office directory building:\n- The building address is `api.myapp.com`.\n- The endpoint is room **`Room 102 (POST /api/v1/support)`**.\n- If you walk to Room 102 with a form (request body), you will trigger the Support team's intake script (handler function)." },
      { title: "5. Core Logic & Architecture Concept", body: "Endpoints utilize **Path parameters** (e.g. `/users/:id` for resource identification) and **Query parameters** (e.g. `?limit=10&page=2` for filtering and sorting). Designing clear boundaries between path and query parameters ensures clean API architecture." }
    ],
    codeExample: { label: "Express.js route registration", code: `// Registering an endpoint
app.get('/api/v1/users/:id', async (req, res) => {
  const userId = req.params.id; // Path param
  const user = await database.find(userId);
  if (!user) return res.status(404).json({ error: 'Not found' });
  return res.json(user);
});` },
    relatedIds: ["http", "rest", "server"],
    nextId: "status-codes",
  },
  "status-codes": {
    id: "status-codes",
    term: "HTTP Status Codes",
    category: "HTTP & APIs",
    categoryColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    tldr: "3-digit standard response numbers that instantly communicate if an HTTP request succeeded or failed.",
    diagram: `  Status Code Families:
  ─────────────────────────────────────────
  1xx  Informational   (connecting...)
  2xx  ✅ Success       (request completed!)
  3xx  ↪ Redirect      (resource moved)
  4xx  ⚠️ Client Error  (invalid request body)
  5xx  💥 Server Error  (database crashed)
  ─────────────────────────────────────────`,
    sections: [
      { title: "1. What is it?", body: "HTTP Status Codes are standardized 3-digit integers returned in every server response. They serve as metadata indicating how the request was handled." },
      { title: "2. Why do we need it?", body: "If servers only returned text messages (like \"Error!\" or \"Success!\"), client application code would have to parse arbitrary words to handle events. Standard status codes give clients a uniform, machine-readable language to handle results." },
      { title: "3. How does it work?", body: "Status codes are categorized into numeric families:\n- **2xx**: Success (e.g. `200 OK`, `201 Created`)\n- **3xx**: Redirection (e.g. `301 Moved Permanently`)\n- **4xx**: Client Error (e.g. `400 Bad Request`, `401 Unauthorized`, `404 Not Found`)\n- **5xx**: Server Error (e.g. `500 Internal Error`, `503 Service Unavailable`)" },
      { title: "4. Real-World Example & Analogy", body: "Imagine submitting a loan application at a bank counter:\n- **200 OK**: The teller hands you the approved money.\n- **400 Bad Request**: The teller hands the paper back, saying \"You forgot to sign your name.\"\n- **401 Unauthorized**: The teller says \"You don't work here, show me your ID.\"\n- **500 Server Error**: The bank vault lock malfunctions and jams, preventing the teller from getting cash." },
      { title: "5. Core Logic & Architecture Concept", body: "Returning appropriate status codes is essential for client-side routing, caching systems, and error tracking. For example, a CDN uses status codes to determine if a response should be cached (like caching `200 OK` but ignoring `500 Server Error`)." }
    ],
    codeExample: { label: "Handling response codes in API controllers", code: `app.post('/api/users', (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ error: 'Email is required' }); // 400 Bad Request
  }
  const isDuplicate = checkDuplicate(req.body.email);
  if (isDuplicate) {
    return res.status(409).json({ error: 'Email already registered' }); // 409 Conflict
  }
  const newUser = saveUser(req.body);
  return res.status(201).json(newUser); // 201 Created
});` },
    relatedIds: ["http", "rest", "endpoint"],
    nextId: "json",
  },
  json: {
    id: "json",
    term: "JSON",
    category: "HTTP & APIs",
    categoryColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    tldr: "JSON (JavaScript Object Notation) is a lightweight key-value format for exchanging data between applications.",
    diagram: `  JSON Data Format Structure:
  {
    "name": "Rohan Sharma",
    "role": "admin",
    "active": true,
    "skills": ["TypeScript", "System Design"],
    "profile": { "id": 104 }
  }`,
    sections: [
      { title: "1. What is it?", body: "JSON stands for **JavaScript Object Notation**. It is a standardized text format for storing and exchanging structured data as key-value pairs and arrays." },
      { title: "2. Why do we need it?", body: "Applications built in different programming languages need a shared format to exchange complex structures. A Python client cannot read memory objects from a Java server. JSON serves as a lightweight, language-neutral, and text-based bridge." },
      { title: "3. How does it work?", body: "JSON represents data using strings, numbers, booleans, arrays, objects, and null values. Every modern programming language provides helper functions (like `JSON.stringify()` and `JSON.parse()` in JavaScript) to serialize memory objects to JSON strings, and vice-versa." },
      { title: "4. Real-World Example & Analogy", body: "Think of an international customs declaration form. No matter what language you speak at home, you write your name and package contents on the form in standardized fields (key-value boxes) so officers anywhere can read it." },
      { title: "5. Core Logic & Architecture Concept", body: "JSON is highly readable but is a **text format**, meaning it has serialization and parsing overhead. In high-performance systems where millisecond latency is critical, binary alternatives like Protobuf (gRPC) or MessagePack are often used instead of JSON." }
    ],
    relatedIds: ["rest", "request-response"],
    nextId: "request-response",
  },
  "request-response": {
    id: "request-response",
    term: "Request / Response",
    category: "HTTP & APIs",
    categoryColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    tldr: "The classic communication pattern where a client initiates a request message and a server replies with a response message.",
    diagram: `  Client (Request)                       Server (Response)
  ──────────────────────────────────     ──────────────────────────────────
  GET /api/v1/users HTTP/1.1             HTTP/1.1 200 OK
  Host: api.myapp.com              ──▶   Content-Type: application/json
  Authorization: Bearer xyz              Content-Length: 42
                                   ◀──
                                         {"status": "healthy"}`,
    sections: [
      { title: "1. What is it?", body: "The Request-Response pattern is the fundamental communication style of the web. It requires a client to initiate a socket connection, send a request message, and wait for the server to send a response message back before closing or reusing the connection." },
      { title: "2. Why do we need it?", body: "Web pages and databases are stored on remote servers. Clients need a structured way to ask for specific files or trigger mutations. The request-response cycle ensures that communication is structured, predictable, and client-controlled." },
      { title: "3. How does it work?", body: "1. **Request**: The client packs request parameters (headers, method, URL path, and optional body payload) into bytes and transmits them over a TCP socket.\n2. **Processing**: The server parses the packet, executes database logic, and formats a response payload.\n3. **Response**: The server sends the response status code, headers, and body back to the client." },
      { title: "4. Real-World Example & Analogy", body: "Think of sending a text message query to a customer support line: you ask a specific question (Request), and a support agent sends a message back with the answer (Response). The conversation is quiet until you initiate the next question." },
      { title: "5. Core Logic & Architecture Concept", body: "This cycle is synchronous and client-driven. If you need real-time, server-initiated updates (e.g. chat messages, live notifications), standard request-response cycles are inefficient due to polling overhead. For real-time applications, persistent channels like [WebSockets](/learn/glossary/websocket) should be used." }
    ],
    relatedIds: ["http", "json", "status-codes"],
    nextId: "headers",
  },
  server: {
    id: "server",
    term: "Web Server",
    category: "Infrastructure",
    categoryColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    tldr: "A web server is a program that listens on a network port, processes incoming HTTP request packets, and returns response bytes.",
    diagram: `  Client (Browser)                  Web Server (api.myapp.com)
  ─────────────────                 ─────────────────────────
  │ GET /index.html│ ─────────────▶  │ Listening on Port 443   │
  │                 │ ◀─────────────  │ Reads file from disk    │
  └─────────────────    200 OK HTML   └─────────────────────────`,
    sections: [
      { title: "1. What is it?", body: "A web server is an application process running on a host machine that opens a specific network port (like 80 for HTTP or 443 for HTTPS) and listens for incoming TCP client connections to process and return data." },
      { title: "2. Why do we need it?", body: "Without a web server, files and API logic stored on backend hardware wouldn't be accessible to the outside network. Web servers listen for incoming traffic, authenticate clients, route endpoints, and translate data to and from network packets." },
      { title: "3. How does it work?", body: "1. **Listen**: Binds to a port and waits for incoming connections.\n2. **Accept**: Establishes a TCP socket connection with a client.\n3. **Read**: Receives raw request bytes and parses them into a request structure.\n4. **Handle**: Matches parameters to router tables and runs business logic.\n5. **Respond**: Formats the output array as HTTP bytes and writes them back to the network interface." },
      { title: "4. Real-World Example & Analogy", body: "Think of a physical post office clerk. The clerk sits at their designated desk (Port), listens for customers in line (Connections), reads their package instructions (Request headers), retrieves the correct package from storage (Backend logic), and hands it to the customer (Response)." },
      { title: "5. Core Logic & Architecture Concept", body: "Modern web servers use different concurrency models. Node.js uses a single-threaded event loop with non-blocking I/O to handle thousands of requests concurrently on a single thread. Languages like Go utilize lightweight green threads (goroutines) to handle each request concurrently." }
    ],
    codeExample: { label: "Barebones HTTP server in Node.js", code: `import http from 'http';

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Web Server!');
});

server.listen(3000, () => {
  console.log('Server listening on port 3000');
});` },
    relatedIds: ["http", "endpoint", "request-response"],
    nextId: "load-balancer",
  },
  "load-balancer": {
    id: "load-balancer",
    term: "Load Balancer",
    category: "Infrastructure",
    categoryColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    tldr: "A load balancer acts as a traffic cop, distributing incoming requests across a group of backend servers to prevent overload.",
    diagram: `          ┌─────────────┐
          │   Client    │
          └──────┬──────┘
                 │  Requests
                 ▼
          ┌─────────────┐
          │ Load Balancer│  (Routes traffic)
          └──┬─────┬─┬──┘
             │     │ │
             ▼     ▼ ▼
          ┌──┐   ┌──┐ ┌──┐
          │S1│   │S2│ │S3│  (Backend servers)
          └──┘   └──┘ └──┘`,
    sections: [
      { title: "1. What is it?", body: "A Load Balancer is a server that sits between incoming user traffic and a pool of backend servers, routing each request to one server to balance the workload." },
      { title: "2. Why do we need it?", body: "A single server can only handle a limited number of requests. Under high traffic, a single server will run out of CPU or RAM and crash. A load balancer allows you to scale horizontally, adding more servers to share the load and preventing any single point of failure." },
      { title: "3. How does it work?", body: "The load balancer exposes a single public IP address to the client. When a request arrives, the load balancer applies a scheduling algorithm (like Round Robin or Least Connections), checks if backend servers are healthy, and routes the request to an available server." },
      { title: "4. Real-World Example & Analogy", body: "Imagine a busy grocery store with 10 checkout lanes. If customers randomly piled up at Lane 1, the store would be inefficient. A queue manager stands at the front, directing incoming shoppers to whichever lane is empty or has the shortest line." },
      { title: "5. Core Logic & Architecture Concept", body: "Load balancers regularly send ping requests to backend servers (called **Health Checks**). If a server fails to respond, it is marked as unhealthy and removed from the active pool. This enables automated failover, keeping the application online during server crashes." }
    ],
    codeExample: { label: "Nginx load balancing configuration", code: `upstream backend_servers {
  server 10.0.0.1:8080;
  server 10.0.0.2:8080;
  server 10.0.0.3:8080;
}

server {
  listen 80;
  location / {
    proxy_pass http://backend_servers;
  }
}` },
    relatedIds: ["server", "api-gateway", "high-availability"],
    nextId: "api-gateway",
  },
  "api-gateway": {
    id: "api-gateway",
    term: "API Gateway",
    category: "Infrastructure",
    categoryColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    tldr: "An API Gateway is the single front door for client requests, routing them to the correct backend services and managing auth.",
    diagram: `  Client ──────────────────▶ API Gateway (single entry point)
                              │ (validates token, checks rate limits)
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
         /api/users      /api/posts      /api/payments
         User Service    Post Service    Payment Service`,
    sections: [
      { title: "1. What is it?", body: "An API Gateway is a reverse proxy that serves as a single entry point for all client requests in a microservices architecture. It routes paths to their respective microservices, handles authentication, and shields the internal server layout." },
      { title: "2. Why do we need it?", body: "In a microservices system, a client app might need data from five different backend services. Connecting to five separate domains makes client code complex and exposes internal servers. The API gateway aggregates these endpoints into a single address." },
      { title: "3. How does it work?", body: "Clients send all requests to the gateway. The gateway inspects the URL path (e.g. `/api/payments` -> Payment Service), validates the client's authentication token, checks request quotas (rate limiting), and routes the request internally." },
      { title: "4. Real-World Example & Analogy", body: "Think of a hotel lobby receptionist. You don't walk directly into the kitchen to order food or the laundry room to clean sheets. You ask the receptionist (Gateway), who coordinates with the kitchen or laundry team on your behalf." },
      { title: "5. Core Logic & Architecture Concept", body: "By handling authentication and rate limiting at the gateway level, individual microservices don't have to duplicate this logic, keeping backend services lightweight and focused on business logic." }
    ],
    relatedIds: ["load-balancer", "microservices", "rate-limiting", "authentication"],
    nextId: "cdn",
  },
  cdn: {
    id: "cdn",
    term: "CDN",
    category: "Infrastructure",
    categoryColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    tldr: "A CDN (Content Delivery Network) is a global network of caching servers that deliver static assets from the closest physical location to the user.",
    diagram: `  [Origin Server in New York] ── (caches assets) ──▶ [CDN Edge in Mumbai]
                                                        │ (super fast ~10ms)
                                                        ▼
                                                  [User in India]`,
    sections: [
      { title: "1. What is it?", body: "A CDN (Content Delivery Network) is a distributed group of servers spread globally that cache static files (like images, JS files, HTML, and CSS) and serve them to users from the closest edge node." },
      { title: "2. Why do we need it?", body: "If your database server is physically located in New York, a user in India requesting an image has to wait for data to travel across the globe (~250ms roundtrip). A CDN places that image on a server in India, reducing latency to ~15ms." },
      { title: "3. How does it work?", body: "When a user requests a file, a DNS lookup routes their request to the physically closest CDN edge server. If the edge server has the file cached (Cache Hit), it serves it immediately. If not (Cache Miss), it fetches the file from the main server (Origin), caches it locally, and returns it." },
      { title: "4. Real-World Example & Analogy", body: "Think of buying a book: instead of ordering it from a printing press in the US and waiting weeks, you walk into a local bookstore (CDN Edge) that has copies in stock, getting it immediately." },
      { title: "5. Core Logic & Architecture Concept", body: "CDNs rely on **TTL (Time to Live)** to determine when cached files expire. Setting correct Cache-Control headers is essential to ensure users don't see stale assets after updates." }
    ],
    relatedIds: ["cache", "latency", "dns"],
    nextId: "reverse-proxy",
  },
  "reverse-proxy": {
    id: "reverse-proxy",
    term: "Reverse Proxy",
    category: "Infrastructure",
    categoryColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    tldr: "A reverse proxy acts as an intermediary, receiving public web requests and forwarding them internally to backend servers.",
    diagram: `  Client ──▶ [Reverse Proxy] (Public IP) ──▶ [Internal App Server] (Private IP)`,
    sections: [
      { title: "1. What is it?", body: "A Reverse Proxy is a server that sits in front of one or more backend applications, intercepting public requests and forwarding them securely to the appropriate internal server." },
      { title: "2. Why do we need it?", body: "Exposing application servers (like Node.js or Python) directly to the internet is a security risk. A reverse proxy acts as a shield, handling SSL termination, rate limiting, and caching, keeping backend application code isolated." },
      { title: "3. How does it work?", body: "The client makes a request to the proxy server's public IP. The proxy terminates the HTTPS connection, runs safety checks, rewrite headers (like forwarding client IPs), and forwards the request over a fast local network to the backend server." },
      { title: "4. Real-World Example & Analogy", body: "Think of an office receptionist. External mail and visitors go to the receptionist's desk first. The receptionist checks their details and routes them to the correct internal desk, shielding employees from direct public access." },
      { title: "5. Core Logic & Architecture Concept", body: "Common tools like Nginx or Caddy are optimized for high-throughput network routing and handling SSL certificates. Using a reverse proxy allows developers to deploy backend code in simple HTTP environments while offloading security and compression to the proxy layer." }
    ],
    relatedIds: ["load-balancer", "api-gateway", "tls"],
    nextId: "postgres",
  },
  postgres: {
    id: "postgres",
    term: "PostgreSQL",
    category: "Databases",
    categoryColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    tldr: "PostgreSQL is a highly reliable relational database that stores data in structured tables and queries it using SQL.",
    diagram: `  PostgreSQL Table Structure:
  Table: Users
  ┌──────┬──────────────┬──────────────────┐
  │  id  │  name        │  email           │
  ├──────┼──────────────┼──────────────────┤
  │  1   │  Rohan       │  rohan@test.com  │
  │  2   │  Priya       │  priya@test.com  │
  └──────┴──────────────┴──────────────────┘`,
    sections: [
      { title: "1. What is it?", body: "PostgreSQL (Postgres) is an open-source, relational database management system. It stores data in rows and columns across linked tables, enforcing strict data types and structural integrity." },
      { title: "2. Why do we need it?", body: "Applications need persistent, structured, and bulletproof storage for critical data like account billing and transactions. Postgres ensures that writes are fully completed and durable, avoiding data corruption even during system crashes." },
      { title: "3. How does it work?", body: "Postgres writes changes to a disk-based transactional log (Write-Ahead Log) before committing them to active storage files. It processes relational queries using SQL, analyzing tables to create optimized query execution paths." },
      { title: "4. Real-World Example & Analogy", body: "Think of a spreadsheet workbook where one sheet is 'Customers' and another is 'Orders'. You link them using ID numbers (Foreign Keys). Postgres acts as the software engine that guarantees customer names on the order sheet match active rows on the customers sheet." },
      { title: "5. Core Logic & Architecture Concept", body: "Postgres guarantees **ACID transactions** (Atomicity, Consistency, Isolation, Durability). If a multi-step operation fails halfway through (e.g. deducting money but failing to deposit it), Postgres rolls back the entire transaction as if it never started." }
    ],
    codeExample: { label: "SQL table structure and relational join", code: `-- Create a table with relationships
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100),
  author_id INT REFERENCES users(id) ON DELETE CASCADE
);

-- Join table query
SELECT p.title, u.name
FROM posts p
JOIN users u ON p.author_id = u.id;` },
    relatedIds: ["sql", "database", "redis"],
    nextId: "redis",
  },
  redis: {
    id: "redis",
    term: "Redis",
    category: "Databases",
    categoryColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    tldr: "Redis is an in-memory key-value database used for caching and lightning-fast (~1ms) data lookups.",
    diagram: `  Request flow with Redis cache:
  ────────────────────────────────────────────
  Request for user_42
       │
       ▼
  Redis.get("user:42")
       │
  ┌────┴───────────────────┐
  │ HIT?                   │ MISS?
  ▼                        ▼
  Return instantly (<1ms)  Query Postgres (~20ms)
                           Redis.set("user:42", data, TTL=300)
                           Return data`,
    sections: [
      { title: "1. What is it?", body: "Redis is an open-source, in-memory key-value database. Unlike disk databases (Postgres), Redis holds its dataset in RAM, enabling read and write operations in under a millisecond." },
      { title: "2. Why do we need it?", body: "Standard database disk reads can take tens of milliseconds. Under heavy load, thousands of database hits will choke your storage systems. Redis caches expensive calculations, stores session states, and handles rate counters rapidly." },
      { title: "3. How does it work?", body: "Redis maps key strings directly to basic data structures (Strings, Hashes, Lists, Sets). It processes operations in a single-threaded loop, bypassing lock management overhead, and supports automatic expiration timers (TTLs) on keys." },
      { title: "4. Real-World Example & Analogy", body: "Imagine studying for an exam: looking up a definition in a thick dictionary on a bookshelf takes a minute (Postgres on disk). Writing 5 common definitions on a index card in your hand takes seconds (Redis in RAM)." },
      { title: "5. Core Logic & Architecture Concept", body: "Because RAM is volatile and lost during power failure, Redis should not serve as the primary source of truth for critical, durable data. It is traditionally used beside a database like Postgres (the Cache-Aside pattern)." }
    ],
    codeExample: { label: "Quick caching wrapper in Node.js", code: `import { createClient } from 'redis';
const redis = createClient();

async function getCachedData(key, fetchFromDbFunc) {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached); // Cache HIT!
  
  const freshData = await fetchFromDbFunc();
  await redis.setEx(key, 300, JSON.stringify(freshData)); // Cache with 5m TTL
  return freshData;
}` },
    relatedIds: ["cache", "cache-aside", "postgres"],
    nextId: "cache",
  },
  cache: {
    id: "cache",
    term: "Cache",
    category: "Performance",
    categoryColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    tldr: "A cache stores copies of frequently requested data in a fast access medium to reduce load on the primary storage system.",
    diagram: `  Without cache (slow):            With cache (fast):
  ─────────────────────            ─────────────────────
  Client → Server                  Client → Server
    → DB query (~50ms)               → Redis.get() (~0.2ms)
    → Return                         → HIT! Return immediately`,
    sections: [
      { title: "1. What is it?", body: "A cache is a high-speed data storage layer that stores a copy of active data so that subsequent requests for the same information are served faster." },
      { title: "2. Why do we need it?", body: "Fetching data from databases, APIs, or files requires computing resources and time. If 1,000 users ask for the same blog post, repeating the database query 1,000 times wastes CPU cycles. Caching serves the data instantly without re-processing." },
      { title: "3. How does it work?", body: "The application intercepts requests at the cache layer. If the data is present (Cache Hit), it is returned. If missing (Cache Miss), the app pulls the data from the slow storage, writes a copy to the cache, and returns it." },
      { title: "4. Real-World Example & Analogy", body: "Think of a chef preparing a popular sauce: instead of chopping vegetables and simmering them on order (slow), they make a batch in the morning and keep it in a warm pan (Cache), ladling it out in seconds." },
      { title: "5. Core Logic & Architecture Concept", body: "Caches must be managed with eviction policies (like LRU - Least Recently Used) to prevent memory exhaustion, and invalidation strategies to clear stale data when the primary database updates." }
    ],
    relatedIds: ["redis", "cache-aside", "ttl"],
    nextId: "cache-aside",
  },
  "cache-aside": {
    id: "cache-aside",
    term: "Cache-Aside Pattern",
    category: "Performance",
    categoryColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    tldr: "The application handles database caching: check cache first, fetch from database on miss, and write back to the cache.",
    diagram: `  App.getProduct(id) ──▶ [Check Redis] ── HIT ──▶ Return
                              │
                            MISS
                              ▼
                      [Read Postgres] ──▶ [Save to Redis] ──▶ Return`,
    sections: [
      { title: "1. What is it?", body: "Cache-Aside (or Lazy Loading) is a software pattern where the application code explicitly orchestrates reading from and writing to both the cache and the database." },
      { title: "2. Why do we need it?", body: "If you cache everything upfront, you waste memory on data that is never requested. Cache-aside ensures that the cache only stores hot, requested data, populating dynamically on-demand." },
      { title: "3. How does it work?", body: "1. The app receives a read request.\n2. The app queries the cache.\n3. **Cache Hit**: Returns data immediately.\n4. **Cache Miss**: Queries the database, saves a copy to the cache with a expiration timer (TTL), and returns the data." },
      { title: "4. Real-World Example & Analogy", body: "Looking for your keys: you check your pocket (Cache) first. If they aren't there (Miss), you walk around search the house (DB), put them in your pocket (Write to cache), and open the door." },
      { title: "5. Core Logic & Architecture Concept", body: "When updating data in the database, the application must invalidate (delete) the corresponding cache key to prevent serving stale data to subsequent requests." }
    ],
    relatedIds: ["cache", "redis", "ttl"],
    nextId: "high-availability",
  },
  "high-availability": {
    id: "high-availability",
    term: "High Availability",
    category: "Architecture",
    categoryColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    tldr: "High Availability (HA) is a design pattern aimed at minimizing service downtime through hardware redundancy and failover systems.",
    diagram: `  Server 1 (Active)  ──┐
                       ├─▶ [Load Balancer] ──▶ User
  Server 2 (Standby) ──┘
  (If Server 1 fails, Load Balancer routes all traffic to Server 2)`,
    sections: [
      { title: "1. What is it?", body: "High Availability (HA) describes a system designed to operate continuously without failure for long periods, measured by the percentage of uptime (like 99.99%)." },
      { title: "2. Why do we need it?", body: "Computers crash, disks fail, and power cables get disconnected. In a single-server system, a hardware crash brings down your business. HA ensures that when a component fails, another immediately takes its place." },
      { title: "3. How does it work?", body: "HA requires deploying redundant servers in active-active configurations (all servers handle traffic) or active-passive configurations (passive takes over if active fails) and routing traffic using intelligent load balancers." },
      { title: "4. Real-World Example & Analogy", body: "Imagine a commercial airplane: it is designed with two separate engines and redundant navigation computers. If one engine fails in mid-flight, the plane doesn't crash; the other engine handles the flight." },
      { title: "5. Core Logic & Architecture Concept", body: "HA is measured in 'nines' of availability. For example, 'Three Nines' (99.9% uptime) allows for ~8.7 hours of downtime per year, while 'Five Nines' (99.999%) allows for only 5 minutes of downtime per year." }
    ],
    relatedIds: ["load-balancer", "horizontal-scaling", "fault-tolerance"],
    nextId: "microservices",
  },
  microservices: {
    id: "microservices",
    term: "Microservices",
    category: "Architecture",
    categoryColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    tldr: "An architecture style that decomposes an application into a suite of small, independent services communicating via APIs.",
    diagram: `  Monolith: [Auth + Orders + Billing] (One large app)
  
  Microservices: [Auth Service] ◀──▶ [Orders Service] ◀──▶ [Billing Service]`,
    sections: [
      { title: "1. What is it?", body: "Microservices is an architectural style that structures an application as a collection of small, loosely coupled, and independently deployable services." },
      { title: "2. Why do we need it?", body: "In a monolithic application, hundreds of developers write code in one massive codebase. A single syntax error can crash the entire application. Microservices isolate code boundaries so that a crash in Billing doesn't take down User Authentication." },
      { title: "3. How does it work?", body: "Each service runs its own business logic, maintains its own database schema, and communicates with other services over light protocols like HTTP REST, gRPC, or Message Queues (RabbitMQ)." },
      { title: "4. Real-World Example & Analogy", body: "A department store: instead of one manager running cashiering, security, cleaning, and sales, the store employs distinct specialists. If the sales manager goes on vacation, the cashiers and security guards continue working." },
      { title: "5. Core Logic & Architecture Concept", body: "Microservices introduce operational complexity (managing separate servers, network latency, distributed transactions). It is recommended to start with a structured monolith and split into microservices once the team size and traffic scale warrant the overhead." }
    ],
    relatedIds: ["monolith", "api-gateway", "high-availability"],
    nextId: "dns",
  },
  dns: {
    id: "dns",
    term: "DNS",
    category: "Networking",
    categoryColor: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
    tldr: "DNS (Domain Name System) translates human-readable domain names (google.com) to machine-readable IP addresses (142.250.80.46).",
    diagram: `  Browser ── Query: myapp.com ──▶ [DNS Resolver] ──▶ IP: 54.92.17.33
     │                                                     ▲
     └───────────────── HTTP Request ──────────────────────┘`,
    sections: [
      { title: "1. What is it?", body: "DNS stands for **Domain Name System**. It acts as the global directories of the internet, mapping text-based domains to physical server IP addresses." },
      { title: "2. Why do we need it?", body: "Computers need numerical IP addresses to route data packets over the network. Since humans cannot remember IP numbers (like `104.21.55.30`), DNS provides a clean mapping from readable domains." },
      { title: "3. How does it work?", body: "When you request a domain name, the browser queries a DNS Recursive Resolver. The resolver asks Root Servers, TLD Servers (like `.com`), and Authoritative Nameservers to find the IP address record, caching the result locally." },
      { title: "4. Real-World Example & Analogy", body: "Think of your phone's contact list. You don't memorize your friend's 10-digit phone number. You select their name, and your phone calls the mapped number." },
      { title: "5. Core Logic & Architecture Concept", body: "DNS records utilize **TTL (Time to Live)** to declare how long resolvers should cache their values. Updating a DNS record does not apply instantly across the web; it propagates slowly as cache timers expire." }
    ],
    relatedIds: ["ip", "cdn"],
    nextId: "rate-limiting",
  },
  "rate-limiting": {
    id: "rate-limiting",
    term: "Rate Limiting",
    category: "Performance",
    categoryColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    tldr: "Rate Limiting restricts the number of incoming API requests from a user or IP address in a specific time window.",
    diagram: `  Client (Fast requests) ──▶ [Rate Limiter] ── Allowed? ── YES ──▶ App Server
                                                      └── NO  ──▶ 429 Error`,
    sections: [
      { title: "1. What is it?", body: "Rate Limiting is a system defense design pattern that controls how many requests a specific client (identified by IP, token, or account ID) can send to a server within a defined time frame." },
      { title: "2. Why do we need it?", body: "Without rate limits, bad actors can write scripts to query your endpoints millions of times per second (DDoS attacks), crashing your systems. It also prevents brute-force login attacks and protects database quotas." },
      { title: "3. How does it work?", body: "When a request arrives, the server checks the client's key in a fast store (like Redis). If the request count exceeds the limit (e.g. 100 requests per minute), the server rejects the request with HTTP Status **429 Too Many Requests**." },
      { title: "4. Real-World Example & Analogy", body: "Think of a ticket booth at a museum: if 500 people try to enter the door at the exact same second, there will be a crush. The guard only allows 2 people through every 5 seconds to manage the flow." },
      { title: "5. Core Logic & Architecture Concept", body: "Common rate limiting algorithms include **Token Bucket** (users spend tokens from a bucket that refills at a fixed rate) and **Sliding Window Log** (tracking exact timestamps in a sorted list to verify limits)." }
    ],
    relatedIds: ["api-gateway", "throughput", "status-codes"],
    nextId: "authentication",
  },
  authentication: {
    id: "authentication",
    term: "Authentication",
    category: "Security",
    categoryColor: "text-red-400 bg-red-500/10 border-red-500/20",
    tldr: "Authentication (AuthN) is the security check that verifies who a user or service is (identity verification).",
    diagram: `  User (Inputs password) ──▶ [Authentication Check] ── Valid? ──▶ Issuing Token (JWT)`,
    sections: [
      { title: "1. What is it?", body: "Authentication is the security process of verifying the identity of a client attempting to access a system. It answers the question: **'Who are you?'**." },
      { title: "2. Why do we need it?", body: "To protect private user accounts, financial data, and administrative systems. We must confirm that the person requesting account access is the actual account owner." },
      { title: "3. How does it work?", body: "The user submits identity factors (credentials, biometrics, or security keys). The server validates these credentials against hashed records in the database. If correct, the server issues a session token." },
      { title: "4. Real-World Example & Analogy", body: "Think of presenting your passport at airport security: the officer looks at your passport photo, compares it to your face, and checks the government stamp to verify you are who you claim to be." },
      { title: "5. Core Logic & Architecture Concept", body: "Applications should never store plaintext passwords. Passwords must be cryptographically hashed using salting algorithms (like bcrypt or Argon2) to ensure database security during breaches." }
    ],
    relatedIds: ["authorization", "jwt", "https"],
    nextId: "authorization",
  },
  authorization: {
    id: "authorization",
    term: "Authorization",
    category: "Security",
    categoryColor: "text-red-400 bg-red-500/10 border-red-500/20",
    tldr: "Authorization (AuthZ) checks the permissions of an authenticated user to verify what they are allowed to access.",
    diagram: `  Logged-in User (admin/user) ──▶ [Authorization Guard] ── Authorized? ──▶ Access Resource`,
    sections: [
      { title: "1. What is it?", body: "Authorization checks the access levels and permissions of a client. It answers the question: **'What are you allowed to do?'**." },
      { title: "2. Why do we need it?", body: "Simply knowing *who* a user is (Authentication) is not enough. A standard user should not be allowed to delete other users' accounts, view company billing logs, or change system admin credentials." },
      { title: "3. How does it work?", body: "Once authenticated, the server loads the user's roles or permissions (e.g. `Role: Member` or `Role: Administrator`). When the user calls an endpoint (like `/delete-database`), the authorization guard verifies if their role permits that action." },
      { title: "4. Real-World Example & Analogy", body: "Think of checking into a hotel: showing your ID card to the front desk is **Authentication** (proves who you are). The plastic key card they hand you is programmed to only open Room 304, not the penthouse suite (this is **Authorization**)." },
      { title: "5. Core Logic & Architecture Concept", body: "Access control is commonly structured as **RBAC (Role-Based Access Control)** where permissions are assigned to roles (Admin, Editor, Viewer), or **ABAC (Attribute-Based Access Control)** where permissions evaluate attributes like location or time." }
    ],
    relatedIds: ["authentication", "status-codes"],
    nextId: "jwt",
  },
  jwt: {
    id: "jwt",
    term: "JWT",
    category: "Security",
    categoryColor: "text-red-400 bg-red-500/10 border-red-500/20",
    tldr: "A JSON Web Token (JWT) is a secure, signed base64 token used to transmit user identity claims statelessly between client and server.",
    diagram: `  JWT Format: Header.Payload.Signature
  [eyJhbGci...] . [eyJzdWIi...] . [SflKxwRj...]`,
    sections: [
      { title: "1. What is it?", body: "JWT stands for **JSON Web Token**. It is a standardized compact format for packing user information (claims) into a digitally signed, base64-encoded string." },
      { title: "2. Why do we need it?", body: "In standard session authentication, the server must store session IDs in a database and look them up on every single request. JWTs are stateless — the token contains its own validation signature, letting the server authenticate users without database queries." },
      { title: "3. How does it work?", body: "1. The user logs in.\n2. The server creates a JSON payload (containing user ID, role, and expiration) and signs it using a secret key.\n3. The server sends this token to the client.\n4. For all future requests, the client attaches the JWT in the `Authorization` header.\n5. The server validates the signature mathematically; if valid, it logs the user in." },
      { title: "4. Real-World Example & Analogy", body: "Think of an amusement park wristband: you pay at the ticket counter (Authentication), and they give you a stamped, tamper-proof wristband. Ride operators don't call the main office to verify your payment; they just inspect the stamp (Signature) on your wristband." },
      { title: "5. Core Logic & Architecture Concept", body: "JWTs are encoded, not encrypted. Anyone who intercepts a JWT can decode the payload to read user details (e.g., email or roles). Therefore, sensitive data like passwords should never be stored in a JWT payload." }
    ],
    relatedIds: ["authentication", "https"],
    nextId: "tls",
  },
  tls: {
    id: "tls",
    term: "TLS / SSL",
    category: "Security",
    categoryColor: "text-red-400 bg-red-500/10 border-red-500/20",
    tldr: "TLS (Transport Layer Security) is the cryptographic protocol that encrypts TCP sockets, turning HTTP into HTTPS.",
    diagram: `  [Client Browser] ── Encrypted TCP Tunnel (TLS) ──▶ [Web Server]`,
    sections: [
      { title: "1. What is it?", body: "TLS (Transport Layer Security, the modern successor to SSL) is a cryptographic protocol designed to provide secure, encrypted communication over a computer network." },
      { title: "2. Why do we need it?", body: "Raw network traffic runs over routers, public lines, and ISPs. Without TLS, any entity in the network path can view or inject data (Man-in-the-Middle attacks). TLS prevents packet sniffing by encrypting all data packets." },
      { title: "3. How does it work?", body: "During the handshake, the client uses asymmetric encryption (Public Key cryptography) to securely agree on a symmetric session key with the server. Once the handshake is complete, both systems encrypt all data using this shared key." },
      { title: "4. Real-World Example & Analogy", body: "Think of locking a contract in a briefcase: you open the lock, drop the contract in, spin the dials, and ship it. Only you and the recipient know the dial combination (Symmetric Session Key) to open the briefcase." },
      { title: "5. Core Logic & Architecture Concept", body: "TLS operates at the transport layer of the OSI model, securing raw TCP streams. This means that application protocols (HTTP, SMTP, WebSockets) run securely without needing custom encryption logic." }
    ],
    relatedIds: ["https", "authentication"],
    nextId: "signed-url",
  },
  "signed-url": {
    id: "signed-url",
    term: "Signed URL / Valet Key",
    category: "Security",
    categoryColor: "text-red-400 bg-red-500/10 border-red-500/20",
    tldr: "A Signed URL is a temporary, secure link that allows a client to upload or download files directly from cloud storage, bypassing the app server.",
    diagram: `  1. Client ── Request upload ──▶ [App Server]
     ▲                                   │ 2. Returns Signed URL
     │                                   ▼
     └────── 3. Upload file directly ──▶ [Cloud Storage (S3)]`,
    sections: [
      { title: "1. What is it?", body: "A Signed URL (also known as the Valet Key pattern) is a URL that contains cryptographic query parameters (signature, expiration, and permissions) granting temporary access to a specific file in cloud storage." },
      { title: "2. Why do we need it?", body: "If clients upload large files (like videos) through your main application server, your server's bandwidth and RAM will choke. Signed URLs let users stream files directly to cloud storage, protecting your application server's resources." },
      { title: "3. How does it work?", body: "1. The client requests to upload a file.\n2. The server verifies their permissions and asks cloud storage for a Signed URL containing a signature, file key, and short TTL.\n3. The server sends this URL back to the client.\n4. The client uploads the file directly to the cloud bucket using that URL." },
      { title: "4. Real-World Example & Analogy", body: "Imagine using a hotel valet: instead of parking your car yourself or letting the valet drive you home, the valet hands you a temporary gate key card (Signed URL) that lets you park your car in the hotel VIP lot for 10 minutes." },
      { title: "5. Core Logic & Architecture Concept", body: "The signing is performed using secure HMAC cryptography, meaning the signature cannot be forged or altered. If the client tries to change the file path or access the link after the expiration time, cloud storage rejects the request." }
    ],
    relatedIds: ["authentication", "https"],
    nextId: "circuit-breaker",
  },
  "circuit-breaker": {
    id: "circuit-breaker",
    term: "Circuit Breaker",
    category: "Architecture",
    categoryColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    tldr: "A circuit breaker is a resilience pattern that stops requests to a failing backend service, returning fallbacks and allowing the system to recover.",
    diagram: `  [Client] ──▶ [Circuit Breaker (Closed: OK)] ──▶ [Downstream Service]
  
  [Client] ──▶ [Circuit Breaker (Open: Error)] ── (Blocks call, returns fallback)`,
    sections: [
      { title: "1. What is it?", body: "A Circuit Breaker is an architectural design pattern that detects failures in downstream network services and blocks calls to them once failures exceed a threshold, preventing cascading crashes." },
      { title: "2. Why do we need it?", body: "If a database or external service slows down, incoming requests will queue up waiting for responses. This exhausts server connection pools, eventually bringing down the entire application. Circuit breakers fail fast, protecting your server." },
      { title: "3. How does it work?", body: "The circuit breaker operates in three states:\n- **Closed**: Requests pass through normally. It monitors the error rate.\n- **Open**: Error rate is too high. Requests are blocked immediately, returning a fallback response.\n- **Half-Open**: Cooldown timer expires. It sends a few test requests. If successful, it closes the circuit; if they fail, it opens it again." },
      { title: "4. Real-World Example & Analogy", body: "An electrical fuse in a house: if an appliance draws too much current, the fuse trips and cuts power to that room, preventing the house wires from overheating and catching fire." },
      { title: "5. Core Logic & Architecture Concept", body: "Implementing circuit breakers allows developers to write clean fallback code, such as serving stale cached data or a user-friendly error message when downstream services are down." }
    ],
    relatedIds: ["fault-tolerance", "microservices"],
    nextId: "websocket",
  },
  websocket: {
    id: "websocket",
    term: "WebSocket",
    category: "Networking",
    categoryColor: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
    tldr: "A WebSocket is a persistent, bidirectional communication protocol that allows a client and server to push messages to each other instantly.",
    diagram: `  Client ── 1. HTTP Upgrade Handshake ──▶ Server
  Client ◀─────── 2. Persistent TCP ──────▶ Server (Bidirectional messages)`,
    sections: [
      { title: "1. What is it?", body: "A WebSocket is a protocol that provides full-duplex (two-way), persistent communication channels over a single TCP connection, enabling real-time client-server communication." },
      { title: "2. Why do we need it?", body: "HTTP requests are one-way and stateless; the server cannot push updates unless the client asks. WebSockets allow the server to push updates instantly without the latency and server overhead of repeated polling." },
      { title: "3. How does it work?", body: "1. The client sends a standard HTTP request with an `Upgrade: websocket` header.\n2. The server responds with a `101 Switching Protocols` status code.\n3. The underlying TCP socket connection is kept open, allowing both parties to send data frames back and forth at any time." },
      { title: "4. Real-World Example & Analogy", body: "Sending mail vs a phone call:\n- **HTTP**: Sending a letter asking a question, and waiting for a reply letter (one-way, slow).\n- **WebSocket**: Dialing a phone number and keeping the line open, letting both people talk and interrupt each other instantly." },
      { title: "5. Core Logic & Architecture Concept", body: "WebSockets bypass the overhead of HTTP headers on every message, reducing packet sizes. They are ideal for real-time applications like chat apps, collaborative document editors, and live financial dashboards." }
    ],
    relatedIds: ["http", "tcp"],
    nextId: "bandwidth",
  },
  headers: {
    id: "headers",
    term: "HTTP Headers",
    category: "HTTP & APIs",
    categoryColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    tldr: "HTTP headers are key-value metadata pairs attached to every request and response, carrying auth tokens, content types, and caching rules.",
    diagram: `  GET /api/users HTTP/1.1
  Host: api.myapp.com
  Authorization: Bearer eyJhbG...
  Content-Type: application/json
  Accept: application/json`,
    sections: [
      { title: "1. What is it?", body: "HTTP headers are key-value pairs sent alongside the request or response body. They carry metadata — who you are, what format the data is in, caching instructions, and tracing IDs — without cluttering the payload itself." },
      { title: "2. Why do we need it?", body: "The HTTP body only holds the main data. Headers let client and server negotiate format, authenticate users, control caching, and pass context the body cannot express. Without headers, every API would need custom conventions baked into JSON bodies." },
      { title: "3. How does it work?", body: "Each header is a single line: `Header-Name: value`. Common request headers: `Authorization` (identity token), `Content-Type` (body format), `Accept` (expected response format). Common response headers: `Cache-Control` (caching rules), `Set-Cookie` (session cookies), `X-Request-ID` (distributed tracing)." },
      { title: "4. Real-World Example & Analogy", body: "Think of mailing a package:\n- The **box contents** are the HTTP body (the actual product).\n- The **shipping label** is the headers — destination, fragile sticker, return address, and tracking number.\n- The postal worker reads the label without opening the box." },
      { title: "5. Core Logic & Architecture Concept", body: "Headers are case-insensitive but conventionally use Title-Case names. Security-sensitive headers like `Authorization` should only travel over [HTTPS](/learn/glossary/https). Custom `X-` prefixed headers (e.g. `X-Request-ID`) are widely used for observability across microservices." }
    ],
    codeExample: { label: "Common request headers in fetch", code: `fetch('/api/users', {
  headers: {
    'Authorization': 'Bearer eyJhbGci...',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});` },
    misconception: "Headers are not optional extras — many HTTP features (auth, caching, CORS, content negotiation) depend entirely on headers. Browsers and servers will reject or mis-handle requests when required headers are missing.",
    realWorld: "Every JWT-authenticated API call sends `Authorization: Bearer <token>`. CDNs read `Cache-Control` headers to decide how long to cache a response.",
    relatedIds: ["http", "authentication", "jwt"],
    nextId: "api",
  },
  api: {
    id: "api",
    term: "API",
    category: "HTTP & APIs",
    categoryColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    tldr: "An API is a defined contract that lets one software component request data or actions from another without knowing its internal implementation.",
    diagram: `  Mobile App ──▶ [API Contract] ──▶ Backend Server
                 (endpoints + rules)     (hidden internals)
  
  Client only sees: GET /users, POST /orders
  Client never sees: database schema, business logic`,
    sections: [
      { title: "1. What is it?", body: "API stands for **Application Programming Interface**. A web API exposes a set of [endpoints](/learn/glossary/endpoint) and rules that external clients (mobile apps, other services, third-party developers) use to read or modify data." },
      { title: "2. Why do we need it?", body: "Without APIs, every client would need direct database access — a security nightmare. APIs abstract the backend: clients call a stable contract (`POST /api/v1/charges`) while the server team can refactor databases and internal logic freely." },
      { title: "3. How does it work?", body: "1. The API publisher documents available [endpoints](/learn/glossary/endpoint), methods, and request/response formats.\n2. Clients send [HTTP](/learn/glossary/http) requests to those endpoints.\n3. The server validates auth, runs business logic, and returns structured [JSON](/learn/glossary/json) responses with [status codes](/learn/glossary/status-codes)." },
      { title: "4. Real-World Example & Analogy", body: "Think of a restaurant menu:\n- The **menu** is the API documentation — it lists what you can order and at what price.\n- You don't walk into the kitchen (internal implementation).\n- You tell the waiter your order (API request), and the kitchen prepares it (server logic)." },
      { title: "5. Core Logic & Architecture Concept", body: "Good APIs are versioned (`/api/v1/`), backward-compatible, and follow consistent conventions like [REST](/learn/glossary/rest). Public APIs (Stripe, Google Maps) let external developers build products on your platform without access to your codebase." }
    ],
    codeExample: { label: "Calling a public API", code: `const response = await fetch('https://api.stripe.com/v1/charges', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer sk_live_...' },
  body: JSON.stringify({ amount: 2000, currency: 'usd' }),
});
const charge = await response.json(); // 201 Created` },
    misconception: "An API is not the same as a database. The API is the controlled front door; the database is the private storage room behind it. Clients should never connect to the database directly.",
    realWorld: "Stripe's payment API, GitHub's repo API, and Twitter's timeline API power thousands of third-party apps — all through HTTP endpoints.",
    relatedIds: ["rest", "endpoint", "http"],
    nextId: "server",
  },
  "horizontal-scaling": {
    id: "horizontal-scaling",
    term: "Horizontal Scaling",
    category: "Infrastructure",
    categoryColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    tldr: "Horizontal scaling adds more server instances to share load, enabling near-linear capacity growth and built-in redundancy.",
    diagram: `  Before:  [Server 1] ── handles 1000 req/s (maxed out)
  
  After:   [Server 1] ──┐
           [Server 2] ──┼──▶ Load Balancer ──▶ 2000 req/s total
           [Server 3] ──┘`,
    sections: [
      { title: "1. What is it?", body: "Horizontal scaling (scaling **out**) means adding more machines or container instances to your system rather than upgrading a single machine. Each new instance shares the incoming traffic." },
      { title: "2. Why do we need it?", body: "A single server has a hard ceiling on requests it can handle. When traffic grows, adding more identical servers behind a [load balancer](/learn/glossary/load-balancer) distributes work and provides redundancy — if one server dies, others keep running." },
      { title: "3. How does it work?", body: "1. Deploy multiple identical app instances (e.g. 3 Node.js containers).\n2. Place a [load balancer](/learn/glossary/load-balancer) in front.\n3. Configure auto-scaling rules: when CPU > 70%, spin up another instance.\n4. All instances share stateless logic; session data lives in [Redis](/learn/glossary/redis) or a database." },
      { title: "4. Real-World Example & Analogy", body: "Think of a busy restaurant:\n- **Vertical scaling**: Make one chef faster with better equipment (limited improvement).\n- **Horizontal scaling**: Hire 5 more chefs and split orders among them (scales with demand)." },
      { title: "5. Core Logic & Architecture Concept", body: "Horizontal scaling requires **stateless** application design — any server can handle any request. Stateful components (databases) are harder to scale horizontally and often use replication instead. Cloud platforms (AWS, GCP) make horizontal scaling trivial with auto-scaling groups." }
    ],
    relatedIds: ["load-balancer", "vertical-scaling", "high-availability"],
    nextId: "vertical-scaling",
  },
  "vertical-scaling": {
    id: "vertical-scaling",
    term: "Vertical Scaling",
    category: "Infrastructure",
    categoryColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    tldr: "Vertical scaling upgrades a single machine with more CPU, RAM, or faster storage — simpler but capped by hardware limits.",
    diagram: `  Before:  Server (4 CPU, 16 GB RAM) ──▶ bottleneck at peak traffic
  
  After:   Server (16 CPU, 128 GB RAM) ──▶ handles more load on one machine`,
    sections: [
      { title: "1. What is it?", body: "Vertical scaling (scaling **up**) means making a single server more powerful by adding CPU cores, RAM, or faster SSD storage — without adding more machines." },
      { title: "2. Why do we need it?", body: "Some workloads don't split easily across machines — especially databases. Upgrading one Postgres server from 16 GB to 128 GB RAM can dramatically improve query performance with zero code changes." },
      { title: "3. How does it work?", body: "1. Monitor server metrics (CPU, RAM, disk I/O).\n2. When consistently maxed out, resize the instance to a larger tier.\n3. The cloud provider migrates or reboots the machine with more resources.\n4. No application code changes required — same IP, same deployment." },
      { title: "4. Real-World Example & Analogy", body: "Think of a laptop upgrade:\n- Instead of buying a second laptop to share work (horizontal), you upgrade your existing laptop's RAM from 8 GB to 32 GB (vertical).\n- Simpler, but eventually you hit the maximum the motherboard supports." },
      { title: "5. Core Logic & Architecture Concept", body: "Vertical scaling has a **hard ceiling** — the largest available machine. It also creates a **single point of failure**: if that one big server crashes, everything goes down. Use vertical scaling for databases; use [horizontal scaling](/learn/glossary/horizontal-scaling) for stateless web servers." }
    ],
    relatedIds: ["horizontal-scaling", "postgres", "database"],
    nextId: "database",
  },
  database: {
    id: "database",
    term: "Database",
    category: "Databases",
    categoryColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    tldr: "A database is persistent storage software that saves, organizes, and retrieves structured data reliably across server restarts.",
    diagram: `  App Server ──▶ [Database Engine]
                        │
                   ┌────┴────┐
                   │ Tables  │  users, orders, posts
                   │ Indexes │  fast lookups
                   │ Logs    │  crash recovery
                   └─────────┘`,
    sections: [
      { title: "1. What is it?", body: "A database is software that stores data on disk (or memory) and provides structured mechanisms to create, read, update, and delete records — known as **CRUD** operations." },
      { title: "2. Why do we need it?", body: "In-memory variables disappear when a server restarts. Applications need durable storage for user accounts, orders, and content. Databases guarantee data survives crashes, supports concurrent access, and enables efficient querying." },
      { title: "3. How does it work?", body: "1. The application sends a query (SQL or API call) to the database engine.\n2. The engine uses indexes and query planners to find matching rows efficiently.\n3. **Transactions** ensure multi-step writes are atomic — either all succeed or all roll back.\n4. Data is written to disk (and optionally replicated to backup nodes)." },
      { title: "4. Real-World Example & Analogy", body: "Think of a library:\n- **Books on shelves** = rows in tables.\n- **The card catalog** = indexes for fast lookup.\n- **The librarian** = the database engine that enforces rules (no duplicate ISBNs, books must be returned before re-borrowed)." },
      { title: "5. Core Logic & Architecture Concept", body: "Two main families: **Relational (SQL)** databases like [PostgreSQL](/learn/glossary/postgres) use structured tables with relationships. **NoSQL** databases like MongoDB or [Redis](/learn/glossary/redis) use flexible schemas for different data models. Most production apps use SQL for core data and Redis for caching." }
    ],
    relatedIds: ["sql", "postgres", "redis", "nosql"],
    nextId: "sql",
  },
  sql: {
    id: "sql",
    term: "SQL",
    category: "Databases",
    categoryColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    tldr: "SQL is the standard language for querying and managing relational databases using structured tables and relationships.",
    diagram: `  SELECT name, email FROM users WHERE role = 'admin';
         │              │         │            │
       read cols    from table  filter     condition`,
    sections: [
      { title: "1. What is it?", body: "SQL (Structured Query Language) is the universal language for interacting with relational databases. It defines how to read, insert, update, and delete data stored in tables with rows and columns." },
      { title: "2. Why do we need it?", body: "Relational data has complex relationships (users have many orders, orders have many items). SQL provides a declarative way to query across linked tables using **JOINs**, **aggregations**, and **constraints** — without writing low-level disk access code." },
      { title: "3. How does it work?", body: "Core operations:\n- **SELECT** — read rows matching conditions\n- **INSERT** — add new rows\n- **UPDATE** — modify existing rows\n- **DELETE** — remove rows\n\nRelationships use **foreign keys** linking tables. [Indexes](/learn/glossary/index) speed up frequent queries." },
      { title: "4. Real-World Example & Analogy", body: "Think of SQL as asking a librarian precise questions:\n- \"Show me all books by author X published after 2020\" = `SELECT * FROM books WHERE author = 'X' AND year > 2020`\n- \"Add this new book to the catalog\" = `INSERT INTO books ...`" },
      { title: "5. Core Logic & Architecture Concept", body: "SQL databases enforce **ACID** guarantees and schema constraints (NOT NULL, UNIQUE, FOREIGN KEY). This makes them ideal for financial transactions and any data where integrity matters more than schema flexibility." }
    ],
    codeExample: { label: "Common SQL queries", code: `-- Read with filter and sort
SELECT name, email FROM users WHERE role = 'admin' ORDER BY created_at DESC;

-- Join two related tables
SELECT u.name, o.total FROM orders o
JOIN users u ON o.user_id = u.id;` },
    relatedIds: ["postgres", "database", "index"],
    nextId: "nosql",
  },
  nosql: {
    id: "nosql",
    term: "NoSQL",
    category: "Databases",
    categoryColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    tldr: "NoSQL databases use flexible, non-tabular data models optimized for horizontal scaling and high write throughput.",
    diagram: `  SQL (Rigid):     users table → fixed columns (id, name, email)
  
  NoSQL (Flexible): { "id": 1, "name": "Rohan", "tags": ["admin", "beta"] }
                    { "id": 2, "name": "Priya", "prefs": { "theme": "dark" } }`,
    sections: [
      { title: "1. What is it?", body: "NoSQL (Not Only SQL) refers to non-relational databases that store data in flexible formats — key-value pairs, JSON documents, wide columns, or graph nodes — instead of rigid tables with fixed schemas." },
      { title: "2. Why do we need it?", body: "Not all data fits neatly into rows and columns. Social media feeds, IoT sensor streams, and session caches need different storage models. NoSQL databases often trade strict consistency for higher availability and easier [horizontal scaling](/learn/glossary/horizontal-scaling)." },
      { title: "3. How does it work?", body: "Main types:\n- **Key-Value** ([Redis](/learn/glossary/redis), DynamoDB) — fast lookups by key\n- **Document** (MongoDB) — stores JSON-like documents\n- **Wide-Column** (Cassandra) — optimized for time-series data\n- **Graph** (Neo4j) — stores nodes and relationships" },
      { title: "4. Real-World Example & Analogy", body: "Think of filing systems:\n- **SQL** = a strict spreadsheet where every row must have the same columns.\n- **NoSQL** = a folder of mixed documents — some are invoices, some are photos, each with different fields." },
      { title: "5. Core Logic & Architecture Concept", body: "NoSQL is not a replacement for [SQL](/learn/glossary/sql) — it's a complement. Use Postgres for transactional core data and MongoDB/Redis for flexible or high-speed workloads. The CAP theorem often guides NoSQL design choices between consistency and availability." }
    ],
    relatedIds: ["database", "redis", "sql"],
    nextId: "index",
  },
  index: {
    id: "index",
    term: "Database Index",
    category: "Databases",
    categoryColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    tldr: "A database index is a lookup structure that speeds up queries on specific columns at the cost of extra write overhead.",
    diagram: `  Without index:  Scan ALL 10M rows ──▶ ~5000ms
  
  With index on email:  B-tree lookup ──▶ ~5ms`,
    sections: [
      { title: "1. What is it?", body: "A database index is an auxiliary data structure (usually a **B-tree**) that maps column values to row locations, allowing the database to find matching rows without scanning the entire table." },
      { title: "2. Why do we need it?", body: "Without an index, finding a user by email on a 10-million-row table requires reading every row — O(n) time. With an index, the lookup is O(log n). This is the difference between a 5-second page load and a 5-millisecond one." },
      { title: "3. How does it work?", body: "1. You create an index: `CREATE INDEX idx_users_email ON users(email)`.\n2. The database builds a sorted tree of email values pointing to row IDs.\n3. On `SELECT * FROM users WHERE email = 'x@y.com'`, the engine walks the tree instead of scanning.\n4. On INSERT/UPDATE/DELETE, the index is updated too — slowing writes slightly." },
      { title: "4. Real-World Example & Analogy", body: "Think of a textbook:\n- **No index** = reading every page to find a topic (full table scan).\n- **With index** = using the index at the back to jump directly to page 247." },
      { title: "5. Core Logic & Architecture Concept", body: "Index columns you **filter**, **sort**, or **JOIN** on frequently. Don't over-index — each index adds write overhead and storage cost. Composite indexes (`CREATE INDEX ON orders(user_id, created_at)`) help multi-column queries." }
    ],
    codeExample: { label: "Creating and using an index", code: `-- Slow: full table scan on 10M rows
SELECT * FROM users WHERE email = 'rohan@test.com';

-- Fast: add index first
CREATE INDEX idx_users_email ON users(email);
SELECT * FROM users WHERE email = 'rohan@test.com'; -- uses index` },
    relatedIds: ["sql", "postgres", "latency"],
    nextId: "ttl",
  },
  ttl: {
    id: "ttl",
    term: "TTL",
    category: "Performance",
    categoryColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    tldr: "TTL (Time To Live) defines how long cached data stays valid before it automatically expires and must be refreshed.",
    diagram: `  Cache entry created at 10:00 AM, TTL = 300s (5 min)
  
  10:00 ── HIT ── HIT ── HIT ── 10:05 EXPIRED ── MISS ── re-fetch from DB`,
    sections: [
      { title: "1. What is it?", body: "TTL (Time To Live) is a duration set on cached items — in [Redis](/learn/glossary/redis), CDN edge nodes, or DNS records — after which the entry is automatically deleted or considered stale." },
      { title: "2. Why do we need it?", body: "Without TTL, cached data lives forever and users see outdated information after database updates. TTL balances freshness (how current the data is) against performance (how often you hit the slow source)." },
      { title: "3. How does it work?", body: "1. On cache write: `redis.setEx('user:42', 300, data)` sets a 300-second TTL.\n2. Reads within 300s return cached data instantly (cache hit).\n3. After expiry, the key is deleted; the next read triggers a database fetch (cache miss).\n4. DNS and CDN caches use the same principle via `Cache-Control` and record TTL values." },
      { title: "4. Real-World Example & Analogy", body: "Think of milk in a fridge:\n- Fresh milk (within expiry date) = cache hit, drink immediately.\n- Expired milk (past TTL) = cache miss, go to the store (database) for fresh milk.\n- Shorter expiry = fresher milk but more store trips." },
      { title: "5. Core Logic & Architecture Concept", body: "Choose TTL based on data change frequency: user profiles (TTL=5 min) vs static assets (TTL=1 year). For [cache-aside](/learn/glossary/cache-aside), always invalidate cache keys on writes to avoid serving stale data beyond the TTL window." }
    ],
    relatedIds: ["cache", "redis", "cache-aside"],
    nextId: "latency",
  },
  latency: {
    id: "latency",
    term: "Latency",
    category: "Performance",
    categoryColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    tldr: "Latency is the time delay between sending a request and receiving a response — the single-operation speed users feel.",
    diagram: `  User click ──▶ [Network 50ms] ──▶ [Server 20ms] ──▶ [DB 30ms] ──▶ Response
  Total latency felt by user: ~100ms`,
    sections: [
      { title: "1. What is it?", body: "Latency measures how long a single operation takes from start to finish, typically in milliseconds. It answers: \"How fast does one request complete?\"" },
      { title: "2. Why do we need it?", body: "Users abandon pages that take more than 3 seconds to load. High latency frustrates users and kills conversion rates. Understanding latency helps you find bottlenecks — slow database queries, missing [indexes](/learn/glossary/index), or cross-continent network hops." },
      { title: "3. How does it work?", body: "Latency adds up across layers:\n- RAM read: ~100 ns\n- [Redis](/learn/glossary/redis) read: ~1 ms\n- [Postgres](/learn/glossary/postgres) query: ~5–50 ms\n- Cross-continent HTTP: ~200 ms\n\nReduce latency via [caching](/learn/glossary/cache), [CDNs](/learn/glossary/cdn), database [indexes](/learn/glossary/index), and colocating services in the same region." },
      { title: "4. Real-World Example & Analogy", body: "Think of ordering food delivery:\n- **Latency** = how long one order takes from click to doorstep (30 min).\n- **Throughput** = how many orders the kitchen handles per hour (50 orders/hr).\n- A fast kitchen (low latency) can still get overwhelmed if 500 people order at once." },
      { title: "5. Core Logic & Architecture Concept", body: "Latency and [throughput](/learn/glossary/throughput) are different metrics. A system can have low latency but poor throughput (fast per request, but queues build up). Always measure p50, p95, and p99 latency — averages hide slow tail requests that ruin user experience." }
    ],
    relatedIds: ["cache", "cdn", "throughput"],
    nextId: "throughput",
  },
  throughput: {
    id: "throughput",
    term: "Throughput",
    category: "Performance",
    categoryColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    tldr: "Throughput is the number of requests or operations a system completes per second — its total capacity under load.",
    diagram: `  Server A: 1 req at 10ms each  → 100 req/s throughput
  Server B: 1 req at 50ms each  →  20 req/s throughput
  
  4× Server A behind load balancer → ~400 req/s total throughput`,
    sections: [
      { title: "1. What is it?", body: "Throughput measures how many operations a system can complete per unit of time — typically requests per second (req/s) or transactions per second (TPS)." },
      { title: "2. Why do we need it?", body: "During traffic spikes (product launch, viral post), throughput determines whether your system stays online or crashes. [Rate limiting](/learn/glossary/rate-limiting) protects throughput limits; [horizontal scaling](/learn/glossary/horizontal-scaling) increases them." },
      { title: "3. How does it work?", body: "Throughput depends on:\n- Server CPU/RAM capacity\n- Database connection pool size\n- Network [bandwidth](/learn/glossary/bandwidth)\n- Async processing and queueing\n\nImprove throughput via connection pooling, batch processing, [caching](/learn/glossary/cache), and adding more instances." },
      { title: "4. Real-World Example & Analogy", body: "Think of a highway:\n- **Latency** = how fast one car travels from A to B (speed limit).\n- **Throughput** = how many cars pass a checkpoint per hour (lanes × speed).\n- Adding more lanes (horizontal scaling) increases throughput without changing speed." },
      { title: "5. Core Logic & Architecture Concept", body: "Optimize for the metric that matters: interactive APIs need low [latency](/learn/glossary/latency); batch pipelines and data ingestion need high throughput. Load testing (k6, Locust) reveals your system's throughput ceiling before users do." }
    ],
    relatedIds: ["latency", "horizontal-scaling", "rate-limiting"],
    nextId: "monolith",
  },
  monolith: {
    id: "monolith",
    term: "Monolith",
    category: "Architecture",
    categoryColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    tldr: "A monolith is a single deployable application containing all features — auth, payments, notifications — in one codebase.",
    diagram: `  Monolith App
  ┌─────────────────────────────┐
  │ Auth + Orders + Email + UI  │  → one deploy, one database
  └─────────────────────────────┘`,
    sections: [
      { title: "1. What is it?", body: "A monolithic architecture puts all application code — user management, payments, notifications, and UI — into a single codebase that is built and deployed as one unit." },
      { title: "2. Why do we need it?", body: "Monoliths are simpler to develop, test, and deploy at small scale. One repo, one deployment pipeline, one database — no network calls between services. Most successful products start as well-structured monoliths." },
      { title: "3. How does it work?", body: "1. All features share one process and often one database.\n2. Function calls between modules are in-process (microseconds, not milliseconds).\n3. Deploying a notification fix requires redeploying the entire application.\n4. Scaling means running multiple copies of the whole app behind a [load balancer](/learn/glossary/load-balancer)." },
      { title: "4. Real-World Example & Analogy", body: "Think of a small family restaurant:\n- One chef handles cooking, billing, and cleaning.\n- Simple to manage when there are 20 customers.\n- When 2,000 customers arrive, one chef can't do everything — time to hire specialists ([microservices](/learn/glossary/microservices))." },
      { title: "5. Core Logic & Architecture Concept", body: "Don't start with [microservices](/learn/glossary/microservices). Start with a modular monolith — clear internal boundaries — and split into services only when team size, deployment conflicts, or scaling pain justify the operational overhead." }
    ],
    relatedIds: ["microservices", "high-availability"],
    nextId: "fault-tolerance",
  },
  "fault-tolerance": {
    id: "fault-tolerance",
    term: "Fault Tolerance",
    category: "Architecture",
    categoryColor: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    tldr: "Fault tolerance is a system's ability to keep operating — or degrade gracefully — when individual components fail.",
    diagram: `  Payment Service DOWN
       │
       ▼
  Circuit Breaker OPEN ──▶ Return fallback: "Payment unavailable, try later"
  (App stays online, users aren't blocked)`,
    sections: [
      { title: "1. What is it?", body: "Fault tolerance means a system continues to function (fully or in degraded mode) when parts of it fail — a database timeout, a crashed microservice, or a network partition." },
      { title: "2. Why do we need it?", body: "In distributed systems, failures are inevitable — not exceptional. A single downstream timeout can cascade into a full outage if unhandled. Fault-tolerant design isolates failures and prevents them from spreading." },
      { title: "3. How does it work?", body: "Common strategies:\n- **[Circuit breakers](/learn/glossary/circuit-breaker)** — stop calling failing services, return fallbacks\n- **Retries with exponential backoff** — retry failed requests with increasing delays\n- **Timeouts** — don't wait forever for a response\n- **Graceful degradation** — serve reduced functionality instead of crashing\n- **Bulkheads** — isolate failures to one subsystem" },
      { title: "4. Real-World Example & Analogy", body: "Think of a power grid:\n- When one substation fails, circuit breakers isolate it so the rest of the city keeps power.\n- Hospitals switch to backup generators (fallback) instead of going dark." },
      { title: "5. Core Logic & Architecture Concept", body: "Design for failure from day one: assume any network call can fail. Pair fault tolerance with [high availability](/learn/glossary/high-availability) (redundant instances) and observability (logging, alerting) to detect and recover from failures quickly." }
    ],
    relatedIds: ["high-availability", "circuit-breaker", "microservices"],
    nextId: "ip",
  },
  ip: {
    id: "ip",
    term: "IP Address",
    category: "Networking",
    categoryColor: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
    tldr: "An IP address is a unique numerical label that identifies a device on a network so data packets know where to go.",
    diagram: `  myapp.com ──[DNS]──▶ 54.92.17.33 (IPv4)
                              │
                         data packets routed here`,
    sections: [
      { title: "1. What is it?", body: "An IP (Internet Protocol) address is a numerical label assigned to each device on a network. **IPv4** uses four octets (e.g. `192.168.1.50`); **IPv6** uses 128-bit addresses for the growing number of connected devices." },
      { title: "2. Why do we need it?", body: "Computers route data using IP addresses, not domain names. When you visit a website, [DNS](/learn/glossary/dns) translates the domain to an IP, and routers forward packets to that address across the internet." },
      { title: "3. How does it work?", body: "- **Public IPs** are globally routable (your cloud server's address on the internet).\n- **Private IPs** (`10.x.x.x`, `192.168.x.x`) are used inside internal networks.\n- **NAT** (Network Address Translation) maps many private devices to one public IP.\n- Routers read destination IPs on each packet to forward them hop by hop." },
      { title: "4. Real-World Example & Analogy", body: "Think of IP addresses like street addresses:\n- **Domain name** = \"Rohan's House\" (human-friendly label).\n- **IP address** = \"42 MG Road, Pune 411001\" (exact routing coordinates).\n- The postal system (routers) needs the exact address, not the nickname." },
      { title: "5. Core Logic & Architecture Concept", body: "In cloud deployments, servers get public IPs for external traffic and private IPs for internal service-to-service communication. Never expose databases on public IPs — keep them on private networks behind security groups." }
    ],
    relatedIds: ["dns", "tcp", "server"],
    nextId: "tcp",
  },
  tcp: {
    id: "tcp",
    term: "TCP",
    category: "Networking",
    categoryColor: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
    tldr: "TCP is a reliable transport protocol that guarantees ordered, acknowledged delivery of data packets over the internet.",
    diagram: `  3-Way Handshake:
  Client ── SYN ──────────▶ Server
  Client ◀── SYN-ACK ─────── Server
  Client ── ACK ──────────▶ Server
  Connection established → HTTP data flows`,
    sections: [
      { title: "1. What is it?", body: "TCP (Transmission Control Protocol) is the transport-layer protocol that underlies [HTTP](/learn/glossary/http) and [HTTPS](/learn/glossary/https). It establishes a connection and ensures all data packets arrive in order." },
      { title: "2. Why do we need it?", body: "The internet drops and reorders packets constantly. TCP handles retransmission of lost packets and reassembly in correct order — so your API response arrives complete and uncorrupted, not as garbled fragments." },
      { title: "3. How does it work?", body: "1. **3-way handshake**: Client sends SYN → Server replies SYN-ACK → Client sends ACK.\n2. Data flows in numbered segments; receiver acknowledges each.\n3. Lost segments are retransmitted automatically.\n4. Connection closes with a FIN handshake when done." },
      { title: "4. Real-World Example & Analogy", body: "Think of TCP vs UDP like phone call vs postcard:\n- **TCP (phone call)**: You confirm the other person heard you; if not, you repeat. Reliable but slower setup.\n- **UDP (postcard)**: Fire and forget — fast but no delivery guarantee. Used for video streaming where speed beats perfection." },
      { title: "5. Core Logic & Architecture Concept", body: "HTTP/1.1 and HTTP/2 run over TCP. [WebSockets](/learn/glossary/websocket) upgrade an existing TCP connection. TCP's reliability adds [latency](/learn/glossary/latency) overhead (handshake + acknowledgments) — acceptable for APIs, less ideal for real-time gaming where UDP is preferred." }
    ],
    relatedIds: ["http", "websocket", "latency"],
    nextId: "bandwidth",
  },
  bandwidth: {
    id: "bandwidth",
    term: "Bandwidth",
    category: "Networking",
    categoryColor: "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
    tldr: "Bandwidth is the maximum data transfer capacity of a network connection, measured in Mbps or Gbps.",
    diagram: `  1 Gbps link = max ~125 MB/s theoretical throughput
  
  100 users × 10 MB upload each = 1000 MB ──▶ saturates 1 Gbps link`,
    sections: [
      { title: "1. What is it?", body: "Bandwidth is the maximum amount of data that can be transmitted through a network connection per unit of time — measured in megabits per second (Mbps) or gigabits per second (Gbps)." },
      { title: "2. Why do we need it?", body: "Large file uploads, video streaming, and traffic spikes consume bandwidth fast. If your server's bandwidth is saturated, new requests queue up and [latency](/learn/glossary/latency) spikes — even if CPU and RAM are fine." },
      { title: "3. How does it work?", body: "Every network link has a bandwidth ceiling. When total traffic exceeds capacity, packets queue and drop. Mitigations:\n- Offload large uploads via [signed URLs](/learn/glossary/signed-url) to cloud storage\n- Use a [CDN](/learn/glossary/cdn) for static assets\n- Compress responses (gzip/brotli)\n- Scale horizontally to distribute load" },
      { title: "4. Real-World Example & Analogy", body: "Think of a water pipe:\n- **Bandwidth** = pipe diameter (how much water flows per second).\n- **Latency** = how long water takes to travel from source to tap.\n- A wide pipe (high bandwidth) can fill a pool fast; a narrow pipe bottlenecks even if water travels quickly." },
      { title: "5. Core Logic & Architecture Concept", body: "Bandwidth and latency are independent. A satellite link has high bandwidth but high latency. Design systems to minimize data transfer — paginate API responses, compress assets, and never proxy large file uploads through your app server when [signed URLs](/learn/glossary/signed-url) can offload directly to S3." }
    ],
    relatedIds: ["latency", "cdn", "signed-url"],
  },
};

// Helper to parse bold, code, and links in descriptions
function parseTextWithLinks(text: string) {
  const parts: React.ReactNode[] = [];
  const pattern = /(\*\*(.*?)\*\*|`(.*?)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let match;
  let lastIndex = 0;
  let key = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const fullMatch = match[1];
    if (fullMatch.startsWith("**")) {
      parts.push(
        <strong key={key++} className="font-bold text-[color:var(--foreground)]">
          {match[2]}
        </strong>
      );
    } else if (fullMatch.startsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="font-mono text-[0.85em] bg-[var(--surface-muted)] px-1.5 py-0.5 rounded border border-[var(--border)] text-violet-400"
        >
          {match[3]}
        </code>
      );
    } else if (fullMatch.startsWith("[")) {
      const isExternal = match[5].startsWith("http");
      parts.push(
        <Link
          key={key++}
          href={match[5]}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-violet-400 hover:text-violet-300 underline font-semibold transition-colors duration-150"
        >
          {match[4]}
        </Link>
      );
    }
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

// ── Inline markdown renderer ──────────────────────────────────────────────────
function renderBody(text: string) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let codeLines: string[] = [];
  let inCode = false;
  let codeKey = 0;

  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith("```")) {
      if (inCode) {
        out.push(<pre key={`code-${codeKey++}`} className="my-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 font-mono text-xs text-[color:var(--foreground)]/80 overflow-x-auto whitespace-pre-wrap leading-relaxed">{codeLines.join("\n")}</pre>);
        codeLines = []; inCode = false;
      } else { inCode = true; }
      return;
    }
    if (inCode) { codeBuffer: codeLines.push(line); return; }

    const parts = parseTextWithLinks(t || line);

    if (!t) { out.push(<div key={i} className="h-1.5" />); return; }
    if (/^\d+\.\s/.test(t)) {
      const matchPrefix = /^\d+\.\s(.*)/.exec(t || line);
      const textOnly = matchPrefix ? matchPrefix[1] : (t || line);
      out.push(<li key={i} className="ml-5 list-decimal text-sm text-[color:var(--foreground)]/70 leading-relaxed mb-1">{parseTextWithLinks(textOnly)}</li>);
      return;
    }
    if (t.startsWith("- ")) {
      out.push(<li key={i} className="ml-5 list-disc text-sm text-[color:var(--foreground)]/70 leading-relaxed mb-1">{parseTextWithLinks(t.slice(2))}</li>);
      return;
    }
    out.push(<p key={i} className="text-sm text-[color:var(--foreground)]/70 leading-relaxed mb-2">{parts}</p>);
  });
  return out;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TermDetailPage({ params }: { params: Promise<{ termId: string }> }) {
  const { termId } = use(params);
  const [theme, setTheme] = useState<Theme>("dark");
  const [openSection, setOpenSection] = useState<number>(0);

  useEffect(() => {
    const saved = window.localStorage.getItem("flowframe-theme") as Theme | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
    else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) setTheme("light");
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("flowframe-theme", theme);
  }, [theme]);

  let term = TERM_MAP[termId];

  if (!term) {
    const fallbackTerm = TERMS.find(t => t.id === termId);
    if (fallbackTerm) {
      term = {
        id: fallbackTerm.id,
        term: fallbackTerm.term,
        category: fallbackTerm.category,
        categoryColor: fallbackTerm.category === "HTTP & APIs" ? "text-blue-400 bg-blue-500/10 border-blue-500/20" :
                       fallbackTerm.category === "Infrastructure" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" :
                       fallbackTerm.category === "Databases" ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" :
                       fallbackTerm.category === "Performance" ? "text-amber-400 bg-amber-500/10 border-amber-500/20" :
                       fallbackTerm.category === "Security" ? "text-red-400 bg-red-500/10 border-red-500/20" :
                       fallbackTerm.category === "Architecture" ? "text-violet-400 bg-violet-500/10 border-violet-500/20" :
                       "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20",
        tldr: fallbackTerm.short,
        sections: [
          { title: "The In-Depth Explanation", body: fallbackTerm.long }
        ],
        realWorld: fallbackTerm.example,
        relatedIds: fallbackTerm.related,
        nextId: undefined,
      };
    }
  }

  if (!term) {
    return (
      <main className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] flex flex-col items-center justify-center gap-4">
        <SiteHeader theme={theme} onToggleTheme={() => setTheme(p => p === "dark" ? "light" : "dark")} showHomeLink badgeText="Learn Academy" alwaysGlass />
        <p className="text-lg font-bold">Term not found: {termId}</p>
        <Link href="/learn/glossary" className="text-violet-400 underline text-sm">← Back to Glossary</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-[color:var(--foreground)] relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 technical-grid opacity-20" />
      <div className="pointer-events-none absolute -left-32 top-0 -z-10 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-[120px]" />

      <SiteHeader theme={theme} onToggleTheme={() => setTheme(p => p === "dark" ? "light" : "dark")} showHomeLink badgeText="Learn Academy" alwaysGlass />

      {/* Breadcrumb */}
      <div className="border-b border-[var(--border)]/60 bg-[var(--surface)]/40 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 h-10 flex items-center gap-2 text-xs text-[color:var(--foreground)]/40 font-mono">
          <Link href="/learn" className="hover:text-violet-400 transition-colors">Learn</Link>
          <span>/</span>
          <Link href="/learn/glossary" className="hover:text-violet-400 transition-colors">Glossary</Link>
          <span>/</span>
          <span className="text-violet-400">{term.term}</span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 sm:px-8 py-12 space-y-10">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${term.categoryColor}`}>{term.category}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[color:var(--foreground)]">{term.term}</h1>
          <p className="text-base sm:text-lg text-[color:var(--foreground)]/55 leading-relaxed border-l-2 border-violet-500/40 pl-4">{term.tldr}</p>
        </motion.div>

        {/* Diagram */}
        {term.diagram && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/30 mb-3 font-mono">Diagram</p>
            <pre className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 backdrop-blur px-5 py-4 text-xs sm:text-sm font-mono text-[color:var(--foreground)]/70 overflow-x-auto leading-relaxed">
              {term.diagram}
            </pre>
          </motion.div>
        )}

        {/* Sections (accordion) */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.08 }} className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/30 mb-3 font-mono">In Depth</p>
          {term.sections.map((sec, i) => (
            <div key={i} className={`rounded-2xl border transition-all duration-200 overflow-hidden ${openSection === i ? "border-violet-500/30 bg-[var(--surface)]/60" : "border-[var(--border)] bg-[var(--surface)]/40 hover:border-[var(--border)]"}`}>
              <button type="button" onClick={() => setOpenSection(p => p === i ? -1 : i)} className="w-full text-left px-5 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${openSection === i ? "bg-violet-500 text-white" : "bg-[var(--surface-muted)] text-[color:var(--foreground)]/50"}`}>{i + 1}</span>
                  <span className={`font-semibold text-sm ${openSection === i ? "text-[color:var(--foreground)]" : "text-[color:var(--foreground)]/75"}`}>{sec.title}</span>
                </div>
                <span className={`shrink-0 text-[color:var(--foreground)]/30 transition-transform duration-200 ${openSection === i ? "rotate-180" : ""}`}>▾</span>
              </button>
              <AnimatePresence>
                {openSection === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                    <div className="px-5 pb-5 border-t border-[var(--border)]/50 pt-4 space-y-1">
                      {renderBody(sec.body)}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        {/* Code example */}
        {term.codeExample && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/30 mb-3 font-mono">Code Example</p>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/50 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[var(--border)]/60 flex items-center gap-2">
                <div className="flex gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-red-400/60" /><div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" /><div className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" /></div>
                <p className="text-[10px] font-mono text-[color:var(--foreground)]/35">{term.codeExample.label}</p>
              </div>
              <pre className="px-5 py-4 font-mono text-xs text-[color:var(--foreground)]/80 overflow-x-auto whitespace-pre leading-relaxed">{term.codeExample.code}</pre>
            </div>
          </motion.div>
        )}

        {/* Misconception + Real World */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.14 }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {term.misconception && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400/70 font-mono">⚠️ Common Misconception</p>
              <p className="text-sm text-[color:var(--foreground)]/65 leading-relaxed">{term.misconception}</p>
            </div>
          )}
          {term.realWorld && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-400/70 font-mono">🌍 Real World Usage</p>
              <p className="text-sm text-[color:var(--foreground)]/65 leading-relaxed">{term.realWorld}</p>
            </div>
          )}
        </motion.div>

        {/* Related terms */}
        {term.relatedIds && term.relatedIds.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--foreground)]/30 mb-3 font-mono">Related Terms</p>
            <div className="flex flex-wrap gap-2">
              {term.relatedIds.map(id => (
                <Link key={id} href={`/learn/glossary/${id}`} className="rounded-full border border-[var(--border)] bg-[var(--surface)]/40 hover:border-violet-500/40 hover:text-violet-400 hover:bg-violet-500/5 px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)]/55 transition-all duration-150 capitalize">
                  {id.replace(/-/g, " ")}
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bottom CTAs */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.18 }} className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[var(--border)]/50">
          <Link href="/learn/glossary" className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 hover:bg-[var(--surface)]/70 px-5 py-3 text-sm font-bold text-[color:var(--foreground)]/60 hover:text-[color:var(--foreground)] transition-all duration-150">
            ← All Terms
          </Link>
          {term.nextId && TERM_MAP[term.nextId] && (
            <Link href={`/learn/glossary/${term.nextId}`} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-5 py-3 text-sm font-bold text-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/20">
              Next: {TERM_MAP[term.nextId].term} →
            </Link>
          )}
        </motion.div>

      </div>
    </main>
  );
}
