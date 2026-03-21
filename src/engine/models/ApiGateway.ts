import type { NodeInstance } from "../contracts";

class ApiGatewayModel implements NodeInstance {
  id: string;
  name: string;
  type: string = "API_GATEWAY";

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export default ApiGatewayModel;
