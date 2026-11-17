import type { NextConfig } from "next";

// Même valeur par défaut que dans src/lib/strapi/client.ts
const strapiUrl = process.env.STRAPI_URL ?? "http://localhost:1337";

const nextConfig: NextConfig = {
  // Build autonome pour le déploiement Passenger (repris de develop)
  output: "standalone",
  // process.cwd() plutôt que __dirname : __dirname n'existe pas quand Next
  // compile ce fichier en module ES (cas du compilateur WebAssembly de secours).
  outputFileTracingRoot: process.cwd(),

  // Nécessaire pour 'use cache' / cacheLife / cacheTag (appels Strapi)
  cacheComponents: true,
  partialPrefetching: true,

  images: {
    // Sobriété : AVIF (le plus léger) puis WebP selon ce que le navigateur
    // accepte. Next convertit les photos à la volée et garde le résultat en cache.
    formats: ["image/avif", "image/webp"],
    // Qualité 60 au lieu de 75 : 20 à 30 % de poids en moins, différence
    // invisible à l'œil sur des photos. Toute <Image> est ramenée à cette valeur.
    qualities: [60],
    // <Image> de Next.js refuse les images externes non déclarées ici :
    // on autorise uniquement le dossier des médias uploadés dans Strapi.
    remotePatterns: [
      new URL(`${strapiUrl}/uploads/**`),
      // Photos d'exemple provisoires (Unsplash, licence gratuite) : voir src/content/exemples.ts.
      // Pas de propriété `search` : on autorise les paramètres ?w=…&q=… d'Unsplash.
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    // En local, Strapi tourne sur localhost. Depuis Next 16, l'optimisation
    // d'images venant d'une IP locale est bloquée par défaut (protection SSRF).
    // On ne l'autorise qu'en développement.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
};

export default nextConfig;
