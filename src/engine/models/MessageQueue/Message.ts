class Message {
  id: string;
  name: string;
  producerId: string;
  payload: any;
  createdAt: number;
  status: "WAITING" | "PROCESSING" | "COMPLETED" | "FAILED";

  constructor(id: string, name: string, producerId: string, message: any) {
    this.id = id;
    this.name = name;
    this.producerId = producerId;
    this.payload = message;
    this.createdAt = Date.now();
    this.status = "WAITING";
  }

  updateStatus(status: "WAITING" | "PROCESSING" | "COMPLETED" | "FAILED") {
    this.status = status;
  }
}

export default Message;
