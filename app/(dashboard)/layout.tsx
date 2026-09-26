import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { DataProvider } from "@/lib/data/DataProvider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <TopBar />
      <main className="mx-auto w-full max-w-[var(--container-max)] flex-1 px-4 pb-[calc(var(--safe-bottom)+72px)] pt-4 min-[760px]:pb-6 min-[1024px]:px-6">
        {children}
      </main>
      <BottomNav />
    </DataProvider>
  );
}
