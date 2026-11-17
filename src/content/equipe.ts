/**
 * Contenus de la page « L'équipe » (maquette 05-equipe-desktop / 06-equipe-mobile).
 *
 * Deux sortes de données ici :
 * 1. Les textes fixes de la page (titres, intro) : ils ne changent pas.
 * 2. Les vrais membres (repris de la page Équipe de websteem.com). Ils servent de
 *    REPLI : la page affiche en priorité les membres saisis dans Strapi
 *    (collection « Membre d'équipe »). Voir src/lib/strapi/team.ts.
 *
 * Les textes entre crochets ([Phrase personnelle]…) sont des emplacements
 * voulus par la maquette, à compléter avec chaque personne.
 */
import { siteConfig } from "@/config/site";
import { contactPortrait } from "@/content/exemples";
import type { StrapiMedia } from "@/types/strapi";

/**
 * Ce dont une carte « membre » a besoin pour s'afficher.
 *
 * C'est un type "de vue" : il ne dépend pas de Strapi. Que la personne
 * vienne de Strapi ou des données d'exemple ci-dessous, on la convertit
 * dans ce format, et les composants n'ont qu'un seul cas à gérer.
 */
export interface TeamCardMember {
  /** Prénom affiché en grand (h3) */
  firstName: string;
  /** Nom complet, affiché sous le prénom avec le poste */
  fullName: string;
  role: string;
  /** Une phrase qui décrit ce que la personne fait pour vous */
  bio: string;
  /**
   * ⚠️ Champs ABSENTS du content-type Strapi « Membre d'équipe ».
   * La maquette les affiche : pour les gérer depuis Strapi, il faudrait
   * ajouter au content-type deux champs texte, par exemple :
   *   - phrasePersonnelle (Text)
   *   - ceQueJaime       (Text, « Ce que j'aime dans mon métier »)
   * En attendant, ils ne sont remplis que dans les données d'exemple.
   */
  quote?: string;
  loves?: string;
  /** Photo Strapi (null pour les données d'exemple) */
  photo: StrapiMedia | null;
  /** Vraie photo locale (public/equipe/), utilisée tant qu'il n'y a pas de photo Strapi */
  localPhoto?: string;
  /** Photo provisoire utilisée en dernier recours ("" = aucune) */
  placeholder: string;
}

/** Textes à compléter, repris tels quels de la maquette. */
const QUOTE = "[Phrase personnelle]";
const LOVES = "[Ce que j'aime dans mon métier]";

/* ------------------------------------------------------------------ */
/* Votre premier interlocuteur (Emmanuel)                              */
/* ------------------------------------------------------------------ */

/**
 * Emmanuel est mis en avant à part : c'est l'interlocuteur unique du site
 * (son prénom est dans siteConfig). Son bloc reste statique, même quand
 * Strapi est rempli, pour garantir que la page ne perde jamais son contact
 * principal.
 */
export const mainContact = {
  firstName: siteConfig.contact.firstName,
  fullName: siteConfig.contact.fullName,
  role: siteConfig.contact.role,
  bio: "Il pilote votre projet du premier appel à la mise en ligne, et reste votre contact ensuite. Avant WebSteem, 26 ans comme consultant, concepteur-rédacteur et chef de projet web.",
  quote: `[Phrase personnelle d'${siteConfig.contact.firstName}]`,
  loves: "[Ce que j'aime dans mon métier, en une ou deux phrases, à la première personne.]",
  photo: contactPortrait,
};

/* ------------------------------------------------------------------ */
/* Membres réels (repli quand Strapi est vide ou éteint)               */
/* ------------------------------------------------------------------ */

/**
 * Raccourci pour créer une carte à partir des infos de websteem.com.
 * `photoFile` = nom du fichier photo rangé dans public/equipe/.
 */
function member(
  fullName: string,
  role: string,
  bio: string,
  photoFile: string,
  extras: Pick<TeamCardMember, "quote" | "loves"> = {},
): TeamCardMember {
  return {
    firstName: fullName.split(" ")[0],
    fullName,
    role,
    bio,
    ...extras,
    photo: null,
    localPhoto: `/equipe/${photoFile}`,
    placeholder: "",
  };
}

/** L'équipe au quotidien (source : page Équipe de websteem.com). */
export const fallbackTeam: TeamCardMember[] = [
  member(
    "Robin Hourtané",
    "développeur web",
    "Chez WebSteem et en BUT Métiers du Multimédia et de l'Internet, 3e année.",
    "robin-hourtane.jpg",
  ),
  member(
    "Grégory Beylier",
    "développeur web",
    "En stage jusqu'en février 2027, en recherche d'un contrat en alternance.",
    "gregory-beylier.jpg",
  ),
  member(
    "Quentin Blas-Trinidad",
    "développeur full stack",
    "En stage jusqu'en février 2027, en recherche d'un contrat en alternance.",
    "quentin-blas-trinidad.png",
  ),
].map((card) => ({ ...card, quote: QUOTE, loves: LOVES }));

/**
 * Les experts partenaires (source : page Équipe de websteem.com).
 * Pas de « phrase personnelle » ici : 16 cartes avec un texte à compléter
 * alourdiraient la page. On pourra les ajouter quand on aura les vrais textes.
 */
export const fallbackPartners: TeamCardMember[] = [
  member("Christophe Vitiello", "stratégie marketing & commerciale", "Partenaire pour développer vos ventes et votre efficacité.", "christophe-vitiello.jpg"),
  member("Corinne Rangod", "experte SEO", "Partenaire en référencement naturel et campagnes SEA.", "corinne-rangod.jpg"),
  member("Noël Lotito", "expert en stratégie digitale", "Partenaire co-créateur de Tchatbooster.", "noel-lotito.jpg"),
  member("Laura Marchetti", "communication de marque", "Partenaire pour révéler votre marque et vous démarquer.", "laura-marchetti.jpg"),
  member("Philippe Napoletano", "concepteur-rédacteur", "Partenaire qui trouvera les mots justes pour toucher votre public.", "philippe-napoletano.jpg"),
  member("Julie Mendes", "community manager", "Partenaire experte des réseaux sociaux pour entrepreneurs et entreprises locales.", "julie-mendes.jpg"),
  member("Emilie Tavel", "community manager", "Partenaire experte des réseaux sociaux et de la publicité Meta.", "emilie-tavel.jpg"),
  member("Marjorie Guinot", "éco-graphiste", "Partenaire pour une communication percutante, éthique et responsable.", "marjorie-guinot.jpg"),
  member("Florence Galtier", "directrice artistique, graphiste", "Partenaire pour la communication globale, print et webdesign.", "florence-galtier.jpg"),
  member("Elsi Cluysen", "graphiste", "Partenaire pour le design graphique : logo, identité de marque, illustration…", "elsi-cluysen.jpg"),
  member("Isabelle Moussu", "directrice artistique", "Partenaire pour accompagner vos projets de communication visuelle.", "isabelle-moussu.jpg"),
  member("Déborah Joly", "experte en systèmes informatiques", "Partenaire pour la transformation digitale des entreprises.", "deborah-joly.jpg"),
  member("Erich Zann", "photographe", "Partenaire pour la photographie en milieu professionnel.", "erich-zann.jpg"),
  member("Christian Morel", "vidéaste", "Partenaire pour vos réalisations audiovisuelles.", "christian-morel.jpg"),
  member("William Palandre", "consultant Google Ads", "Partenaire pour augmenter votre chiffre d'affaires grâce à Google Ads.", "william-palandre.jpg"),
  member("Pierre-Emmanuel Manteau", "développement web, data & IA", "Partenaire pour le développement d'applications web sur mesure.", "pierre-emmanuel-manteau.jpg"),
];
