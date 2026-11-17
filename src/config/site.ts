/**
 * Contenus "fixes" du site : navigation, coordonnées, liens légaux.
 *
 * Ces infos changent rarement : les garder dans le code évite un appel API
 * sur chaque page. Si l'équipe veut pouvoir les modifier elle-même, on
 * pourra créer un Single Type "Global" dans Strapi et remplacer ce fichier.
 */

export interface NavLink {
  label: string;
  href: string;
}

export const siteConfig = {
  name: "WebSteem",
  description: "Agence web à Grenoble et Saint-Cyr-sur-Mer, pour les TPE, PME, commerces et associations.",
  email: "contact@websteem.com",
  phone: {
    display: "06 78 28 19 27",
    international: "+33 (0)6 78 28 19 27",
    href: "tel:+33678281927",
  },
  /**
   * Votre interlocuteur unique. La maquette écrit souvent « [Prénom de
   * l'interlocuteur] » : on centralise le prénom ici pour le changer partout.
   */
  contact: {
    firstName: "Emmanuel",
    fullName: "Emmanuel Bertrand",
    role: "gérant de WebSteem, webmaster",
  },
  /** ⚠️ Lien de prise de rendez-vous (Calendly, Google Agenda…) à renseigner. */
  bookingUrl: "/contact",
  /** Avis Google : valeurs à compléter (la maquette affiche [NOTE] et [NB]). */
  googleReviews: { rating: "[NOTE]", count: "[NB]", url: "#" },
  yearStart: 2020,
} as const;

/** Liens du menu principal (Header). */
export const mainNav: NavLink[] = [
  { label: "Tarifs", href: "/tarifs" },
  { label: "Vos besoins", href: "/#vos-besoins" },
  { label: "Références", href: "/references" },
  { label: "Équipe", href: "/equipe" },
  { label: "Blog", href: "/blog" },
];

/** Bouton d'action principal, présent dans le header et le footer. */
export const primaryCta: NavLink = { label: "Parlons de votre projet", href: "/contact" };

/** Colonne "Navigation" du footer. */
export const footerNav: NavLink[] = [
  { label: "Accueil", href: "/" },
  { label: "Tarifs", href: "/tarifs" },
  { label: "Références", href: "/references" },
  { label: "Équipe", href: "/equipe" },
  { label: "Blog", href: "/blog" },
  { label: "Engagement RSE", href: "/engagements-rse" },
  { label: "Contact", href: "/contact" },
];

/** Bas du footer. ⚠️ Les pages cookies, accessibilité et plan du site restent à créer. */
export const legalLinks: NavLink[] = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "CGV", href: "/cgv" },
  { label: "Politique de confidentialité (RGPD)", href: "/politique-de-confidentialite" },
  { label: "Gestion des cookies", href: "#" },
  { label: "Accessibilité", href: "#" },
  { label: "Plan du site", href: "#" },
];

/**
 * Réseaux sociaux. ⚠️ URLs à renseigner.
 *
 * Sobriété : les icônes (fichiers de /public/brand/reseaux, moins de 600 octets
 * chacun) sont écrites directement dans la page en « data URI » (image encodée
 * en base64). Résultat : 4 requêtes HTTP en moins sur chaque page.
 * <Image> de Next accepte ces data URI et ne cherche pas à les optimiser.
 */
export const socialLinks = [
  { label: "LinkedIn", href: "#", icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAYAAACJfM0wAAABj0lEQVR4XrWUzStEYRTGfyOUlI+SBaKUZm9rNVkoG03JVmk2/gDFwhop1uYfsLSxnC0pCyVSFhYWNohiMmPUo3OdW+9caq4bz+b0nvfc5z7n681J4j/QFpCOADtABdiD6JwdplhSt6RLSTVJFUkvkm4l5f0+jktt48AlSXVJy05k56qkUlbiuBR1z7nP7SBEd2+ZaxEoOtAXGm7tnDr1ZGwumIoiMA4MAw/AFXAKTAMdgfILYAyYBzqBR6AMnDRl538qeONCmPJyk6cZd5KOJD27ez9UHdfYFDWAXSDntgbcufoZ958B78ACMARMQdSXNfdtx6rDOf4JRhJu0AawBawA50DJP9r0+bfyRGhFnMQAsA70QpSRLdKiB9li9QOzWYjngGsgDxSAe2+u4Qno9hL9WrHNd9UVmrWMu77llaEUqdGqxj1Ae2q2AK2ILfVwOVKjFXFmhGnaYphCm02zdjZYzCQw6o1KPky2IPbNRFPPfA3t3b1JrKy9x6uSPhL+w2B1jxN3r5KKdh8+Qn+KTzWWpBgiogkpAAAAAElFTkSuQmCC", width: 22, height: 20 },
  { label: "Instagram", href: "#", icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAUCAYAAABiS3YzAAAB4UlEQVR4Xq2UMUhWURTHf1YS4iBtCk5CGmpLIDg4ODgJFjiIqDi5SDg0NEQSoouT4uKQ4C76kQpBg5s46KAIgriJGopJYSESUX857ztXrs/vMz/xD493373n/N85/3PuKZLEfeNBDsI+YA34Ddgfb3pOgFmgPuYpiiItBeaBFuAUWAd+/SeLSuCF27wDRpO1kfrzUVlMRHvxeb51paQNSX8kvUyCdIIaSd8lrRRAOCTpVNKkkxnmYtJuj3I8B6lFMiZpQVJG0oDbrLnPoX/vSNq19SPXo8Tf6VYYBEb87BAS+3ZgAHgPtAEzfn4GPIk17fO/WkpBkn7fW5JUGu23SPomaTu1vy7p2OxCSxUDf4GDqNo9wD7wCpIoApaAYaAaeJurOwLpU+BhZGDtVQOspggDpoEfQN1NpGlY/wW9c8Ei/5evh0OkP1MGO8BXoDaPYxdQ5vJcQyANWmarl0XGSSdTXpaFaWnpmwzXkE6xIrL4ADwD+oFWYBN4DDT7POgFtgrRNKAD6ASOgAYvzCIkhbVBEsMKbR10eU0bJZ1J+lLANY1nQZOk8+AfH3z2Zn9zB+J597ULc2X02UxcAKqAZeDTLUbfc0gkKnc5bH0lUovaruOUp3Jb7El6HWcXD+l7wwU35y1D/mtwBgAAAABJRU5ErkJggg==", width: 21, height: 20 },
  { label: "Facebook", href: "#", icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAUCAYAAAC58NwRAAAA/ElEQVR4Xt2TMUoEQRBF3xqYCJoZmItX8ABmHsF0gwXB2MDEC+wFPICBkRhoIILZRpvrwmK0ioiYCGZPaqyRpmcQNvXDUHR3/f7/NzUDlWWw0tO8BoyBGbAAnoCT375QKL4d9dEfvKoL9Uv9VHejr1Y4AraBU2AT2AKugFVgvVGpFG7UD22U7lMp8J57HcI0rcRFYelNvVD324tbhUP1ofDeEgKRY6LuNS+azOdsjsO73Isa65c8Oy8JIR926kyxHiVh3KcQmCcxaomDkhChIlyEDLUy9KV6XIdurdSv1LHZNxp/4r8SYjKHOaEd1KGvgQ3gLOttzRgs+4t+AwH+hPidnhI/AAAAAElFTkSuQmCC", width: 12, height: 20 },
  { label: "YouTube", href: "#", icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABYAAAAQCAYAAAAS7Y8mAAABbUlEQVR4XrWUvyuFYRTHPxdZrh+DbHew6CJKEQbKdLPJILPdYjBSt/wZd5BBsstk4goDi9SVBZmQXzFIHZ3XefT0ep68iVNvvfV+z+ec93vO8+REhP+Ihgh0CmgDOoC+gOYN2AOegRNg/5tGO7anV0Rq8vvYFpG84/ngTWOWfYFXOPZeEJGK5S6nwUUReRCRagC0ICIbIgkgBnf5h05TZ94MAq3mVzqGgGngCihHZlIDzmwmSThwiyWcRxIfgSNgCTgGRgO6CyAPjPjgThPeR8C6BQPAItAP7ACVgLYRPpt0HWeNFeDAxCWgGEt04KcMZPVXfR6GpEA3JN4Gw4Ev7WtPRNdu/qrPY8As8JLSNkMyi6pvxSnwCkGw+n4LzJnPu5HiXcDdV0FvN3WHdZf1BGY5GL5m3g7IqsvNeZfQDLDudXMDvP/gvf5+k2mugQl3FnywRgGYBMbtEtI1rI/A1WMdnlq1Baz5ujT4z+ID3rJgzUyXo8cAAAAASUVORK5CYII=", width: 22, height: 16 },
];

/** Bureaux (accueil, contact). */
export const offices = [
  {
    title: "Grenoble · Isère (38)",
    text: "Rendez-vous sur place à Grenoble, Saint-Martin-d'Hères, Échirolles, Meylan, Voiron…",
  },
  {
    title: "Saint-Cyr-sur-Mer · Var (83)",
    text: "Rendez-vous sur place à Saint-Cyr-sur-Mer, Bandol, La Cadière-d'Azur, Sanary-sur-Mer, La Ciotat.",
  },
];
