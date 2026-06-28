export interface ExecutionTask {
  id: string;

  actionId: string;

  title: string;

  description: string;

  providerId: string;

  status:
    | "pending"
    | "running"
    | "completed"
    | "failed"
    | "cancelled";
}
