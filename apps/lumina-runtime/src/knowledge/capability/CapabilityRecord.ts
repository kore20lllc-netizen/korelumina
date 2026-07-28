export interface CapabilityRecord {
  id: string;
  name: string;
  description: string;
  category: string;
  lifecycleStage: string;
  owner?: string;
  intelligenceDomains: readonly string[];
  dependencies: readonly string[];
  consumers: readonly string[];
  metrics: readonly string[];
  tags: readonly string[];
}
