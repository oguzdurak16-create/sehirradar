import { relativeStatus } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status status-${status}`}>{relativeStatus(status)}</span>;
}
