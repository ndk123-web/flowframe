import type { NodeInstance } from "../contracts";

class PostgresModel implements NodeInstance {
  id: string;
  name: string;
  type: string = "POSTGRES_DATABASE";
  data: Map<string, any> = new Map();

  /**
   * Meaning how many servers opened the tcp connections to this postgres server
   * Each server postgres keep alive the tcp connections to this postgres server
   * Each server open at least 1 connection to this postgres server
   * so we can map each server to its own connection pool
   *
   * key: serverId, value: total TCP connections that server has opened to Postgres
   */
  connectionPools: Map<string, number> = new Map();

  /**
   * Tracks how many connections from each server are currently "in-flight" (actively processing a query).
   * Used to simulate connection pool exhaustion:
   *   if activeConnections[serverId] >= connectionPools[serverId], the request must wait.
   *
   * key: serverId, value: number of connections currently in use
   */
  activeConnections: Map<string, number> = new Map();
  connectionIntervals: Array<{ serverId: string; requestId: string; start: number; end: number }> = [];

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  isPoolExhaustedAt(serverId: string, timestamp: number, parallel: boolean): boolean {
    if (!parallel) return false;

    const poolSize = this.connectionPools.get(serverId);
    if (poolSize === undefined) return false;

    // Count how many intervals for this server cover the given timestamp
    const activeAtTime = this.connectionIntervals.filter(
      (int) => int.serverId === serverId && timestamp >= int.start && timestamp < int.end
    ).length;

    return activeAtTime >= poolSize;
  }

  // ─── Connection Pool Management ──────────────────────────────────────────

  /**
   * Check if the server's connection pool is exhausted.
   * Returns true if the server has no more connections available.
   * If no pool is configured for the server (no TCP connections registered),
   * we treat it as unlimited (always available).
   */
  isPoolExhausted(serverId: string): boolean {
    const poolSize = this.connectionPools.get(serverId);
    // No pool configured for this server → unlimited, never exhausted
    if (poolSize === undefined) return false;

    const active = this.activeConnections.get(serverId) ?? 0;
    return active >= poolSize;
  }

  /**
   * Acquire a connection slot from the server's pool.
   * Should only be called after confirming isPoolExhausted() === false.
   * Increments the active connection count for the given server.
   */
  acquireConnection(serverId: string): void {
    const current = this.activeConnections.get(serverId) ?? 0;
    this.activeConnections.set(serverId, current + 1);
  }

  /**
   * Release a connection slot back to the server's pool after a query completes.
   * Decrements the active connection count for the given server.
   * Clamps at 0 to avoid going negative.
   */
  releaseConnection(serverId: string): void {
    const current = this.activeConnections.get(serverId) ?? 0;
    this.activeConnections.set(serverId, Math.max(0, current - 1));
  }

  /**
   * Returns how many connections from a given server are currently active.
   */
  getActiveConnections(serverId: string): number {
    return this.activeConnections.get(serverId) ?? 0;
  }

  /**
   * Returns the total TCP connection pool size for a given server.
   * Returns 0 if no pool has been configured.
   */
  getPoolSize(serverId: string): number {
    return this.connectionPools.get(serverId) ?? 0;
  }

  // ─── Data Management ─────────────────────────────────────────────────────

  addRecord(databaseName: string, primaryKey: string, record: any) {
    const db = this.data.get(databaseName) || new Map();
    db.set(primaryKey, record);
    this.data.set(databaseName, db);
  }

  deleteRecord(databaseName: string, primaryKey: string) {
    const db = this.data.get(databaseName);
    if (db) {
      db.delete(primaryKey);
    }
  }

  getRecord(databaseName: string, primaryKey: string) {
    const db = this.data.get(databaseName);
    if (db) {
      return db.get(primaryKey) ?? null;
    }
  }
}

export default PostgresModel;
