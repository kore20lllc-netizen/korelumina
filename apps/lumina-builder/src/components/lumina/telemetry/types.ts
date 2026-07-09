export interface TelemetrySample {
  value: number;
  timestamp: number;
}

export interface TelemetryBufferOptions {
  capacity?: number;
}
