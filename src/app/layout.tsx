
import { UserProvider } from "@/context/UserContext";
import "mapbox-gl/dist/mapbox-gl.css";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

