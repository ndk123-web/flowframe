import { NodeInstance } from "../contracts";
import { NodeId } from "../types";

export interface DnsTarget {
  to: NodeId;
  ip: NodeId;
  typeOfRecord:
    | "A"
    | "AAAA"
    | "CNAME"
    | "MX"
    | "PTR"
    | "SOA"
    | "SRV"
    | "TXT"
    | "ANY";
}

/**
 * @description DNS is a distributed system that translates domain names to IP addresses
 */
class DnsModel implements NodeInstance {
  id: string;
  name: string;
  type: string = "DNS";

  records: Map<string, Record<string, DnsTarget>> = new Map();

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  addDomain(domain: string) {
    if (!this.records.has(domain)) {
      this.records.set(domain, {});
    }
  }

  addSubDomain(
    domain: string,
    subDomain: string,
    to: NodeId,
    ip: NodeId,
    typeOfRecord: DnsTarget["typeOfRecord"],
  ) {
    if (this.records.has(domain)) {
      const domainRecord = this.records.get(domain)!;
      domainRecord[subDomain] = {
        to,
        ip,
        typeOfRecord,
      };
    }
  }

  removeSubDomain(domain: string, subDomain: string) {
    if (this.records.has(domain)) {
      const domainRecord = this.records.get(domain)!;
      delete domainRecord[subDomain];
    }
  }

  removeDomain(domain: string) {
    this.records.delete(domain);
  }

  resolve(domain: string, subDomain: string) {
    if (this.records.has(domain)) {
      const domainRecord = this.records.get(domain)!;
      return domainRecord[subDomain];
    }
    return null;
  }

  getAllRecords() {
    return Object.fromEntries(this.records.entries());
  }
}

export default DnsModel;
