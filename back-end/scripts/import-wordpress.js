/**
 * Import des articles du blog WordPress actuel (websteem.com) dans Strapi.
 *
 * Utilisation (depuis le dossier back-end, Strapi ARRÊTÉ) :
 *   npm run import:wordpress
 *
 * ──────────────────────────────────────────────────────────────────────
 * CE QUE FAIT LE SCRIPT
 * ──────────────────────────────────────────────────────────────────────
 * 1. Lit les articles, catégories et images via l'API REST publique de
 *    WordPress (https://websteem.com/wp-json/wp/v2/...). Aucun accès admin
 *    au WordPress n'est nécessaire.
 * 2. Démarre Strapi "en interne" (sans serveur HTTP) et écrit directement
 *    dans sa base avec la Document Service API. Pas besoin de compte admin
 *    ni de token d'API.
 * 3. Pour chaque article :
 *    - convertit le HTML de WordPress en "Blocks" Strapi (titres,
 *      paragraphes, listes, liens, gras, code, images…) ;
 *    - téléverse l'image à la une dans la médiathèque Strapi ;
 *    - crée la catégorie et l'auteur s'ils n'existent pas ;
 *    - remplit le composant SEO (titre et description Yoast).
 * 4. Ouvre la lecture publique (find / findOne) des articles, catégories et
 *    membres d'équipe, sinon le front reçoit une erreur 403.
 *
 * On peut relancer le script sans risque : un article déjà présent (même
 * slug) est MIS À JOUR, pas dupliqué, et les images déjà importées sont
 * réutilisées.
 * ──────────────────────────────────────────────────────────────────────
 *
 * Pourquoi un fichier .js et pas .ts ? Le script est lancé directement par
 * Node, sans étape de compilation : c'est plus simple.
 */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createStrapi, compileStrapi } = require("@strapi/strapi");
const { parseDocument } = require("htmlparser2");

const WP_API = "https://websteem.com/wp-json/wp/v2";

/** L'auteur WordPress n° 1 est Emmanuel : on le relie au membre d'équipe. */
const AUTHOR = {
  nom: "Emmanuel Bertrand",
  poste: "Gérant de WebSteem, webmaster",
  bio: "26 ans d'expérience dans la communication digitale. Il pilote votre projet du premier appel à la mise en ligne.",
  // Photo déjà présente dans le front (public/equipe)
  photo: path.join(__dirname, "..", "..", "public", "equipe", "emmanuel-bertrand.jpg"),
};

/** Limites du composant SEO (src/components/shared/seo.json). */
const META_TITLE_MAX = 70;
const META_DESCRIPTION_MAX = 160;

/* ------------------------------------------------------------------ */
/* Lecture de WordPress                                                */
/* ------------------------------------------------------------------ */

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WordPress a répondu ${res.status} sur ${url}`);
  return res.json();
}

/** Tous les articles publiés (100 max : le blog en compte une dizaine). */
function getPosts() {
  return getJson(
    `${WP_API}/posts?per_page=100&status=publish&_fields=id,slug,date,title,excerpt,content,categories,featured_media,yoast_head_json.title,yoast_head_json.description`,
  );
}

async function getCategories() {
  const list = await getJson(`${WP_API}/categories?per_page=100&_fields=id,name,slug`);
  return new Map(list.map((c) => [c.id, c]));
}

/* ------------------------------------------------------------------ */
/* Petits utilitaires texte                                            */
/* ------------------------------------------------------------------ */

/** Texte brut d'un fragment HTML (les entités &#8217; etc. sont décodées par le parseur). */
function htmlToText(html) {
  const walk = (nodes) => nodes.map((n) => (n.type === "text" ? n.data : n.children ? walk(n.children) : "")).join("");
  return walk(parseDocument(html).children).replace(/\s+/g, " ").trim();
}

/** Coupe un texte à `max` caractères sur une fin de mot, avec « … ». */
function truncate(text, max) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.!?-]+$/, "")}…`;
}

/* ------------------------------------------------------------------ */
/* Conversion HTML WordPress → Blocks Strapi                           */
/* ------------------------------------------------------------------ */
/*
 * Le champ "Rich text (Blocks)" de Strapi stocke un tableau JSON :
 *   [{ type: "paragraph", children: [{ type: "text", text: "Bonjour", bold: true }] }, …]
 * Types de blocs : paragraph, heading (level 1-6), list (ordered/unordered)
 * avec des list-item, quote, code, image. Dans le texte : text (avec bold,
 * italic, underline, strikethrough, code) et link.
 */

const BLOCK_CONTAINERS = new Set(["div", "section", "article", "figure", "body", "main", "aside", "center"]);
const HEADINGS = { h1: 2, h2: 2, h3: 3, h4: 4, h5: 5, h6: 6 }; // h1 → h2 : le titre de l'article est déjà le h1

/**
 * Convertit le contenu "en ligne" (texte, gras, liens…) en nœuds Blocks.
 * `marks` = mises en forme héritées des balises parentes (ex. <strong><em>).
 */
function inlineNodes(nodes, marks = {}) {
  const out = [];
  for (const node of nodes) {
    if (node.type === "text") {
      const text = node.data.replace(/\s+/g, " ");
      if (text) out.push({ type: "text", text, ...marks });
    } else if (node.type === "tag") {
      const tag = node.name;
      if (tag === "br") out.push({ type: "text", text: "\n", ...marks });
      else if (tag === "strong" || tag === "b") out.push(...inlineNodes(node.children, { ...marks, bold: true }));
      else if (tag === "em" || tag === "i") out.push(...inlineNodes(node.children, { ...marks, italic: true }));
      else if (tag === "u") out.push(...inlineNodes(node.children, { ...marks, underline: true }));
      else if (tag === "s" || tag === "del") out.push(...inlineNodes(node.children, { ...marks, strikethrough: true }));
      else if (tag === "code") out.push(...inlineNodes(node.children, { ...marks, code: true }));
      else if (tag === "a" && node.attribs.href) {
        // Un lien ne peut contenir que du texte (pas de lien dans un lien)
        const children = inlineNodes(node.children, marks).filter((c) => c.type === "text");
        if (children.length) out.push({ type: "link", url: node.attribs.href, children });
      } else if (tag !== "img" && tag !== "script" && tag !== "style") {
        out.push(...inlineNodes(node.children || [], marks));
      }
    }
  }
  return out;
}

/** Nettoie les espaces en début/fin de bloc et garantit au moins un nœud texte. */
function tidy(children) {
  const list = children.filter((c) => c.type !== "text" || c.text !== "");
  const first = list[0];
  const last = list[list.length - 1];
  if (first?.type === "text") first.text = first.text.trimStart();
  if (last?.type === "text") last.text = last.text.trimEnd();
  const kept = list.filter((c) => c.type !== "text" || c.text !== "");
  return kept.length ? kept : [{ type: "text", text: "" }];
}

const isEmpty = (children) => children.every((c) => c.type === "text" && !c.text.trim());

/** Texte brut (pour les blocs de code <pre>). WordPress y marque les retours à la ligne avec <br>. */
function rawText(nodes) {
  return nodes
    .map((n) => (n.type === "text" ? n.data : n.name === "br" ? "\n" : n.children ? rawText(n.children) : ""))
    .join("");
}

/** Convertit une liste <ul>/<ol> (avec ses sous-listes éventuelles). */
function listBlock(node, indentLevel = 0) {
  const children = [];
  for (const li of node.children.filter((c) => c.type === "tag" && c.name === "li")) {
    const nested = li.children.filter((c) => c.type === "tag" && (c.name === "ul" || c.name === "ol"));
    const inline = li.children.filter((c) => !nested.includes(c));
    children.push({ type: "list-item", children: tidy(inlineNodes(inline)) });
    for (const sub of nested) children.push(listBlock(sub, indentLevel + 1));
  }
  return { type: "list", format: node.name === "ol" ? "ordered" : "unordered", indentLevel, children };
}

/**
 * Parcourt le HTML et renvoie les blocs. Les images sont renvoyées sous
 * forme de "jeton" { type: "image", src, alt } : elles seront téléversées
 * dans Strapi ensuite (fonction resolveImages).
 */
function htmlToBlocks(nodes) {
  const blocks = [];
  let pending = []; // texte "orphelin" hors balise de bloc → paragraphe

  const flush = () => {
    const children = tidy(inlineNodes(pending));
    if (!isEmpty(children)) blocks.push({ type: "paragraph", children });
    pending = [];
  };

  for (const node of nodes) {
    if (node.type !== "tag") {
      pending.push(node);
      continue;
    }
    const tag = node.name;
    const images = tag === "img" ? [node] : findImages(node);

    if (tag in HEADINGS) {
      flush();
      const children = tidy(inlineNodes(node.children));
      if (!isEmpty(children)) blocks.push({ type: "heading", level: HEADINGS[tag], children });
    } else if (tag === "p") {
      flush();
      const children = tidy(inlineNodes(node.children));
      if (!isEmpty(children)) blocks.push({ type: "paragraph", children });
      images.forEach((img) => blocks.push(imageToken(img)));
    } else if (tag === "ul" || tag === "ol") {
      flush();
      blocks.push(listBlock(node));
    } else if (tag === "blockquote") {
      flush();
      const children = tidy(inlineNodes(node.children));
      if (!isEmpty(children)) blocks.push({ type: "quote", children });
    } else if (tag === "pre") {
      flush();
      blocks.push({ type: "code", children: [{ type: "text", text: rawText(node.children).replace(/\n+$/, "") }] });
    } else if (tag === "img") {
      flush();
      blocks.push(imageToken(node));
    } else if (BLOCK_CONTAINERS.has(tag)) {
      flush();
      blocks.push(...htmlToBlocks(node.children));
    } else if (tag === "hr" || tag === "script" || tag === "style" || tag === "iframe") {
      flush(); // pas d'équivalent dans Blocks : on ignore
    } else {
      pending.push(node); // balise en ligne (strong, a, span…) hors paragraphe
    }
  }
  flush();
  return blocks;
}

function findImages(node) {
  if (node.type !== "tag") return [];
  if (node.name === "img") return [node];
  return (node.children || []).flatMap(findImages);
}

function imageToken(img) {
  const src = img.attribs["data-src"] || img.attribs.src;
  return { type: "image-token", src, alt: img.attribs.alt || "" };
}

/** Nombre de mots → minutes de lecture (≈ 200 mots/minute). */
function readingMinutes(html) {
  return Math.max(1, Math.round(htmlToText(html).split(" ").length / 200));
}

/* ------------------------------------------------------------------ */
/* Médias : téléchargement depuis WordPress, envoi dans Strapi         */
/* ------------------------------------------------------------------ */

const TMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "wp-import-"));

/**
 * Téléverse une image dans la médiathèque Strapi, sauf si un fichier du même
 * nom y est déjà (relance du script). Renvoie l'entrée "plugin::upload.file".
 */
async function uploadImage(strapi, { url, filePath, name, alt }) {
  const existing = await strapi.db.query("plugin::upload.file").findOne({ where: { name } });
  if (existing) return existing;

  let localPath = filePath;
  let mimetype = "image/jpeg";
  if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Image introuvable (${res.status}) : ${url}`);
    mimetype = res.headers.get("content-type") || mimetype;
    localPath = path.join(TMP_DIR, name);
    fs.writeFileSync(localPath, Buffer.from(await res.arrayBuffer()));
  } else if (localPath.endsWith(".png")) {
    mimetype = "image/png";
  }

  const [file] = await strapi
    .plugin("upload")
    .service("upload")
    .upload({
      data: { fileInfo: { name, alternativeText: alt, caption: "" } },
      files: {
        filepath: localPath,
        originalFilename: name,
        originalFileName: name,
        mimetype,
        size: fs.statSync(localPath).size,
      },
    });
  return file;
}

/** Image à la une d'un article WordPress (null si absente). */
async function uploadFeaturedImage(strapi, post) {
  if (!post.featured_media) return null;
  const media = await getJson(`${WP_API}/media/${post.featured_media}?_fields=source_url,alt_text`);
  const ext = path.extname(new URL(media.source_url).pathname) || ".jpg";
  return uploadImage(strapi, {
    url: media.source_url,
    name: `blog-${post.slug.slice(0, 80)}${ext}`,
    alt: media.alt_text || htmlToText(post.title.rendered),
  });
}

/** Remplace les jetons d'image par de vrais blocs "image" Strapi. */
async function resolveImages(strapi, blocks, slug) {
  const out = [];
  let index = 0;
  for (const block of blocks) {
    if (block.type !== "image-token") {
      out.push(block);
      continue;
    }
    index += 1;
    const url = new URL(block.src, "https://websteem.com").href;
    const ext = path.extname(new URL(url).pathname) || ".jpg";
    try {
      const file = await uploadImage(strapi, { url, name: `blog-${slug.slice(0, 70)}-${index}${ext}`, alt: block.alt });
      out.push({
        type: "image",
        image: {
          name: file.name,
          alternativeText: file.alternativeText || block.alt,
          url: file.url,
          caption: file.caption || null,
          width: file.width,
          height: file.height,
          formats: file.formats,
          hash: file.hash,
          ext: file.ext,
          mime: file.mime,
          size: file.size,
          previewUrl: file.previewUrl,
          provider: file.provider,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt,
        },
        children: [{ type: "text", text: "" }],
      });
    } catch (error) {
      console.warn(`  ⚠ image ignorée (${error.message})`);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Écriture dans Strapi                                                */
/* ------------------------------------------------------------------ */

/** Trouve un document par un champ, ou le crée (publié). */
async function findOrCreate(strapi, uid, where, data) {
  const existing = await strapi.documents(uid).findFirst({ filters: where });
  if (existing) return existing;
  return strapi.documents(uid).create({ data, status: "published" });
}

async function getAuthor(strapi) {
  const existing = await strapi.documents("api::team-member.team-member").findFirst({ filters: { nom: AUTHOR.nom } });
  if (existing) return existing;
  const photo = fs.existsSync(AUTHOR.photo)
    ? await uploadImage(strapi, { filePath: AUTHOR.photo, name: "equipe-emmanuel-bertrand.jpg", alt: AUTHOR.nom })
    : null;
  return strapi.documents("api::team-member.team-member").create({
    data: { nom: AUTHOR.nom, poste: AUTHOR.poste, bio: AUTHOR.bio, photo: photo?.id ?? null },
    status: "published",
  });
}

/** Autorise la lecture publique des contenus utilisés par le front. */
async function openPublicRead(strapi) {
  const role = await strapi.db.query("plugin::users-permissions.role").findOne({ where: { type: "public" } });
  if (!role) return;
  const actions = ["article", "category", "team-member"].flatMap((name) => [
    `api::${name}.${name}.find`,
    `api::${name}.${name}.findOne`,
  ]);
  for (const action of actions) {
    const exists = await strapi.db
      .query("plugin::users-permissions.permission")
      .findOne({ where: { action, role: role.id } });
    if (!exists) await strapi.db.query("plugin::users-permissions.permission").create({ data: { action, role: role.id } });
  }
}

async function importPosts(strapi) {
  const [posts, wpCategories] = await Promise.all([getPosts(), getCategories()]);
  console.log(`${posts.length} articles trouvés sur WordPress.\n`);

  const author = await getAuthor(strapi);

  for (const post of posts) {
    const titre = htmlToText(post.title.rendered);
    console.log(`→ ${titre}`);

    // Strapi n'accepte qu'UNE catégorie par article : on garde la 1re de WordPress
    const wpCategory = wpCategories.get(post.categories[0]);
    const categorie = wpCategory
      ? await findOrCreate(
          strapi,
          "api::category.category",
          { slug: wpCategory.slug },
          { nom: htmlToText(wpCategory.name), slug: wpCategory.slug },
        )
      : null;

    const image = await uploadFeaturedImage(strapi, post);
    const contenu = await resolveImages(strapi, htmlToBlocks(parseDocument(post.content.rendered).children), post.slug);

    const yoast = post.yoast_head_json || {};
    const description = yoast.description || htmlToText(post.excerpt.rendered);

    const data = {
      titre,
      slug: post.slug,
      contenu,
      datePublication: post.date.slice(0, 10),
      tempsLecture: readingMinutes(post.content.rendered),
      image: image?.id ?? null,
      categorie: categorie?.documentId ?? null,
      auteur: author.documentId,
      seo: {
        metaTitle: truncate(htmlToText(yoast.title || titre), META_TITLE_MAX),
        metaDescription: truncate(description, META_DESCRIPTION_MAX),
        shareImage: image?.id ?? null,
      },
    };

    const existing = await strapi.documents("api::article.article").findFirst({ filters: { slug: post.slug } });
    if (existing) {
      await strapi.documents("api::article.article").update({ documentId: existing.documentId, data, status: "published" });
      console.log("  mis à jour");
    } else {
      await strapi.documents("api::article.article").create({ data, status: "published" });
      console.log("  créé");
    }
  }
}

async function main() {
  const appContext = await compileStrapi();
  const strapi = await createStrapi(appContext).load();
  strapi.log.level = "error";

  try {
    await importPosts(strapi);
    await openPublicRead(strapi);
    console.log("\nImport terminé. Lance `npm run develop` puis ouvre http://localhost:3000/blog");
  } finally {
    await strapi.destroy();
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
