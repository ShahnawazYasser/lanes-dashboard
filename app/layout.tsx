import type { Metadata, Viewport } from "next";
import { schibstedGrotesk } from "@/lib/fonts";
import { TopBar } from "@/components/shell/TopBar";
import { BottomNav } from "@/components/shell/BottomNav";
import { ToastProvider } from "@/components/ui/Toast";
import { DataProvider } from "@/lib/data/DataProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lanes Dashboard",
  description: "Contracts and prospects dashboard for Lanes.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${schibstedGrotesk.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <ToastProvider>
          <DataProvider>
            <TopBar />
            <main className="mx-auto w-full max-w-[var(--container-max)] flex-1 px-4 pb-[calc(var(--safe-bottom)+72px)] pt-4 min-[760px]:pb-6 min-[1024px]:px-6">
              {children}
            </main>
            <BottomNav />
          </DataProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
