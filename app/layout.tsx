import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HSC Science Self-Assessment",
  description:
    "Chapter quizzes and mock tests for Maharashtra Board (MSBSHSE) 12th Science students",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <footer className="site-footer">
          Practice questions are illustrative, written for this app — not official MSBSHSE board
          questions. Verify chapter lists against the current official syllabus.
        </footer>
      </body>
    </html>
  );
}
