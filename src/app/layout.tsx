import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from 'next/link';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <ul className="flex space-x-4">
            <li><Link href="/" className="hover:text-gray-300">Home</Link></li>
            <li><Link href="/tailwind-example" className="hover:text-gray-300">Tailwind Example</Link></li>
            <li><Link href="/tailwind_gpt" className="hover:text-gray-300">TailwindGPT Demo</Link></li>
          </ul>
        </nav>
        {children}
      </body>
    </html>
  );
}
