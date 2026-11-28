// src\app\layout.tsx

import type { Viewport } from "next";
import { UserProvider } from "@/context/UserContext";
import MenuBar from "@/components/MenuBar";
import { ToastProvider } from "@/components/ui/Toast";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

export const viewport: Viewport = { viewportFit: "cover" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>

      <body className="
        min-h-screen text-textMainLight dark:text-textMainDark font-display transition-colors duration-300
        [--mobile-tab-bar-height:calc(4rem+1px+env(safe-area-inset-bottom))]
        max-md:pb-[var(--mobile-tab-bar-height)]
        max-md:[&_main>button.fixed.bottom-8.right-8]:bottom-[calc(var(--mobile-tab-bar-height)+2rem)]
      ">
        <ToastProvider>
          <UserProvider>
            <MenuBar />
            {children}
          </UserProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
