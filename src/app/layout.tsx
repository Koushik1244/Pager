// src\app\layout.tsx

import { UserProvider } from "@/context/UserContext";
import MenuBar from "@/components/MenuBar";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

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

      <body className="min-h-screen text-textMainLight dark:text-textMainDark font-display transition-colors duration-300">
        <UserProvider>
          <MenuBar />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
