function getKeywods() {
  const KEYWORDS: Record<string, string> = {
    define: 'DEFINE',
    DEFINE: 'DEFINE',
    client: 'CLIENT_NODE',
    CLIENT: 'CLIENT_NODE',
    server: 'SERVER_NODE',
    SERVER: 'SERVER_NODE',
    gateway: 'GATEWAY_NODE',
    GATEWAY: 'GATEWAY_NODE',
    loadbalancer: 'LOADBALANCER_NODE',
    LOADBALANCER: 'LOADBALANCER_NODE',
    pubsub: 'PUBSUB_NODE',
    PUBSUB: 'PUBSUB_NODE',
    postgres: 'POSTGRES_NODE',
    POSTGRES: 'POSTGRES_NODE',
    redis: 'REDIS_NODE',
    REDIS: 'REDIS_NODE',
    messagequeue: 'MESSAGE_QUEUE_NODE',
    MESSAGEQUEUE: 'MESSAGE_QUEUE_NODE',
    ',': 'COMMA',
    '{': 'LBRACE',
    '}': 'RBRACE',
    '->': 'CONNECT',
    connect: 'CONNECT_KEYWORD',
    CONNECT: 'CONNECT_KEYWORD',
    '[': 'LBRACKET',
    ']': 'RBRACKET',
    ':': 'COLON',
  };

  return KEYWORDS;
}

export { getKeywods };
