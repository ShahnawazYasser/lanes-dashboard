import { PinPad } from "@/components/login/PinPad";

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-[20px] font-bold text-ink">Lanes Dashboard</h1>
        <p className="text-[13px] text-ink-2">Enter the PIN to continue.</p>
      </div>
      <PinPad next={safeNext(next)} />
    </div>
  );
}
