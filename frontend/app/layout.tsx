import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reservas de salas",
  description: "Reserva salas de reuniones",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: "0 auto", maxWidth: 720, padding: 24 }}>
        <nav style={{ display: "flex", gap: 16, marginBottom: 24 }}>
          <Link href="/">Salas</Link>
          <Link href="/bookings">Reservar</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
