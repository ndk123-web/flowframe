import FlowLoader from "@/components/FlowLoader";

export default function Loading() {
  return (
    <FlowLoader
      size="fullscreen"
      label="Initializing FlowFrame Engine..."
      sublabel="Synchronizing system models, network vectors, and workspace..."
    />
  );
}
