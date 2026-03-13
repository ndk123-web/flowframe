import type { NodeInstance } from "../contracts";

class RedisModel implements NodeInstance{
  id: string;
  name: string;
  type: string = "REDIS_CACHE";
  data: Map<string, any> = new Map();

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  addData(key: string, value: any) {
    this.data.set(key, value);
  }

  removeData(key: string) {
    this.data.delete(key);
  }

  getData(key: string) {
    return this.data.get(key) ?? null;
  }
}

export default RedisModel;
