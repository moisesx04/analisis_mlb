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
    google: "XLVEuwJvWbEVFXx3WJJk-0YLiDD-T8QtU7YBI7xQk20",
  }
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Analista de Jugadas MLB",
    "alternateName": "Predicciones de Jugadas MLB y ESPN",
    "url": "https://analisis-mlb.vercel.app/",
    "description": "Sistema avanzado de predicciones lógicas y estadísticas de béisbol de la MLB en tiempo real.",
  };

  return (
    <html lang="es" className={`${outfit.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('mlb_theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light-theme');
                  } else {
                    document.documentElement.classList.remove('light-theme');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
