function getKeywods() {
  const KEYWORDS = {
    client: 'CLIENT_NODE',
    server: 'SERVER_NODE',
    gateway: 'GATEWAY_NODE',
    loadbalancer: 'LOADBALANCER_NODE',
    pubsub: 'PUBSUB_NODE',
    postgres: 'POSTGRES_NODE',
    redis: 'REDIS_NODE',
    messagequeue: 'MESSAGE_QUEUE_NODE',
    ',': 'COMMA',
    '{': 'LBRACE',
    '}': 'RBRACE',
    '->': 'CONNECT',
    '[': 'LBRACKET',
    ']': 'RBRACKET',
    ':': 'COLON',
  };

  return KEYWORDS;
}

export { getKeywods };
