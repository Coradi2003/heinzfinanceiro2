import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { DataLoader } from "@/components/DataLoader";
import { GlobalModals } from "@/components/layout/GlobalModals";
import { ThemeApplier } from "@/components/layout/ThemeApplier";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Studio Paty Heinz",
  description: "Gestão profissional para o Studio Paty Heinz.",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "Studio Paty Heinz",
    statusBarStyle: "default",
    capable: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#C9797F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className}`}>
        <DataLoader />
        <ThemeApplier />
        <GlobalModals />
        <div className="flex flex-col md:flex-row h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-background">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
