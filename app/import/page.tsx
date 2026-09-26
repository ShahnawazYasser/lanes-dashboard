import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ImportPage() {
  return (
    <Panel>
      <EmptyState
        title="Import not built yet"
        hint="This will let Ali bring in contracts and prospects from a CSV or Excel sheet."
      />
    </Panel>
  );
}
