import {
  LuminaFlowConnector,
} from "@/components/design-system/lumina";

const STAGES = 5;

export function FlowLayer() {
  return (
    <LuminaFlowConnector
      stageCount={STAGES}
    />
  );
}
