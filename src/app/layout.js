import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  title: "Analista de Jugadas MLB - Predicciones de Béisbol Inteligentes",
  description: "Sistema avanzado de predicciones lógicas de la MLB en base a estadísticas integradas en tiempo real de MLB Stats y ESPN. Encuentra jugadas de bajo riesgo.",
  keywords: ["mlb", "apuestas mlb", "predicciones béisbol", "espn mlb", "analista de jugadas", "béisbol", "bajo riesgo"],
  verification: {
    google: "AQUÍ_VA_TU_CÓDIGO_DE_VERIFICACIÓN_DE_GOOGLE",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
