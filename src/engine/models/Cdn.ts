import { NodeInstance } from "../contracts";
import { NodeId } from "../types";

/**
 * CDN is globally distributed network of cache servers
 * Basic Flow: (each router uses shortest path algorithm to find next router (BGP))
 *  Client Router -> ISP Router -> ... Middle Routers -> Origin Router -> Content
 *                                                                  |
 *                                                                  V
 *                                                             Origin Server/Storage
 */
class CdnModel implements NodeInstance {
  id: string;
  name: string;
  type: string = "CDN";

  // it might be Server or Storage
  originId: NodeId = "";

  cache: Set<string> = new Set();

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  setOriginId(originId: NodeId) {
    this.originId = originId;
  }

  getData(key: string) {
    if (this.cache.has(key)) {
      return true;
    }
    return false;
  }

  cacheData(key: string) {
    this.cache.add(key);
  }

  clearCache() {
    this.cache.clear();
  }
}

export default CdnModel;
