import type { Metadata } from "next";
import { Montserrat, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

// Math equations (KaTeX) and code highlighting styles
import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Anurag Maurya",
  description: "My Blogs and thoughts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body
        className={`${montserrat.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground h-full overflow-hidden`}
      >
        <div className="flex flex-col h-full border border-border/40 m-0 md:m-2 relative">
          {/* Decorative Corner lines */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary -translate-x-[1px] -translate-y-[1px] z-20"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary -translate-x-[1px] -translate-y-[1px] z-20"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary -translate-x-[1px] -translate-y-[1px] z-20"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary -translate-x-[1px] -translate-y-[1px] z-20"></div>

          <div className="flex flex-1 overflow-hidden relative">
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative bg-[radial-gradient(#1f1f1f_1px,transparent_1px)] [background-size:16px_16px]">
                {children}
            </main>
          </div>
        </div>
      </body>
      <Analytics/>
    </html>
  );
}
