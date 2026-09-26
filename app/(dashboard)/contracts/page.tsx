import { Suspense } from "react";
import { ContractsView } from "@/components/contracts/ContractsView";

export default function ContractsPage() {
  return (
    <Suspense>
      <ContractsView />
    </Suspense>
  );
}
