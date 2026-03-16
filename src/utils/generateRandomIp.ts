class Ipv4Generator {
  static uniqueIps: Set<string> = new Set();

  getRandomIpv4(): string {
    let ip: string;

    // Generate a random IP address and ensure it's unique
    do {
      const part = () => Math.floor(Math.random() * 256);
      ip = `${part()}.${part()}.${part()}.${part()}`;

      // If the generated IP is already in the set, it will generate a new one
    } while (Ipv4Generator.uniqueIps.has(ip));

    Ipv4Generator.uniqueIps.add(ip);
    return ip;
  }
}

export default Ipv4Generator;
