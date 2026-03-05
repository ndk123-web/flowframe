import type { NodeInstance } from "../contracts";

// for the NodeRegistry we will store the instance of the ClientModel
class ClientModel implements NodeInstance {
  id: string;
  name: string;
  // request: number;
  type: string = "client";

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
    // this.request = request;
  }
}

export default ClientModel;
