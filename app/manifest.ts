import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FlowFrame | Distributed Systems Simulator",
    short_name: "FlowFrame",
    description: "Design architectures and simulate distributed request flow frame-by-frame.",
    start_url: "/",
    display: "standalone",
    background_color: "#090d16",
    theme_color: "#3b82f6",
    orientation: "any",
    scope: "/",
    icons: [
      {
        src: "/logo/flow-frame-light.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo/flow-frame-light.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo/flow-frame-light.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/logo/flow-frame-light.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
