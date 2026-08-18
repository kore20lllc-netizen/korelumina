import {
  LuminaExecutiveRibbon,
} from "@/components/design-system/lumina";

import {
  ExecutiveIdentity,
} from "./ExecutiveIdentity";
import {
  ExecutiveMetrics,
} from "./ExecutiveMetrics";
import {
  ExecutiveOperationsDeck,
} from "./ExecutiveOperationsDeck";

export function ExecutiveRibbon() {
  return (
    <LuminaExecutiveRibbon
      identity={
        <ExecutiveIdentity />
      }
      operations={
        <ExecutiveOperationsDeck />
      }
      metrics={
        <ExecutiveMetrics />
      }
    />
  );
}
