import type { Metadata } from "next";
import "./globals.css";
import "./overrides.css";
import "./auth.css";
import { GlobalActions } from "@/components/global-actions";
import { AccentBridge } from "@/components/accent-bridge";
import { AssistantActions } from "@/components/assistant-actions";
import { ImageHistory } from "@/components/image-history";

export const metadata: Metadata = {
  title: "Zyntra — Think Deeper. Secure Smarter.",
  description: "AI cybersecurity intelligence by ZYNTRA INDUSTRIES.",
  icons: {
    icon: "/zyntra-logo.jpeg",
    shortcut: "/zyntra-logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><AccentBridge /><AssistantActions /><ImageHistory /><GlobalActions />{children}</body>
    </html>
  );
}
