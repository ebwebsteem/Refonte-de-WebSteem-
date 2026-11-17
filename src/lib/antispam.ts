/**
 * Protections anti-spam du formulaire de contact, SANS captcha.
 *
 * Un captcha gêne tout le monde (et bloque souvent les personnes malvoyantes),
 * alors on combine trois pièges invisibles pour les humains :
 *
 * 1. Le « pot de miel » (dans ContactForm.tsx) : un champ caché que seuls
 *    les robots remplissent.
 * 2. Le délai minimum (`isTooFast`) : un humain met plusieurs secondes à
 *    remplir 4 champs ; un robot envoie tout en quelques millisecondes.
 * 3. La limite d'envois par adresse IP (`checkRateLimit`) : empêche une même
 *    machine d'envoyer des dizaines de messages à la suite.
 *
 * Ce fichier ne contient que de la logique serveur (il est importé par la
 * Server Action, jamais par un composant client).
 */

/* ------------------------------------------------------------------ */
/* 2. Délai minimum                                                    */
/* ------------------------------------------------------------------ */

/** En dessous de 3 secondes entre l'affichage de la page et l'envoi, c'est un robot. */
export const MIN_FILL_MS = 3000;

/**
 * Vrai si le formulaire a été rempli trop vite pour être humain.
 *
 * @param elapsed durée en millisecondes envoyée par le navigateur (champ
 *   "duree_saisie"). Elle est absente si JavaScript est désactivé : dans ce
 *   cas on ne bloque pas (les deux autres protections restent actives), pour
 *   ne pas empêcher un vrai visiteur de nous écrire.
 */
export function isTooFast(elapsed: string): boolean {
  if (!elapsed) return false;
  const ms = Number(elapsed);
  // Valeur absurde (texte, négatif) : seul un robot bricole ce champ
  if (!Number.isFinite(ms) || ms < 0) return true;
  return ms < MIN_FILL_MS;
}

/* ------------------------------------------------------------------ */
/* 3. Limite d'envois par adresse IP                                   */
/* ------------------------------------------------------------------ */

/** 3 messages maximum par adresse IP sur une fenêtre de 10 minutes. */
export const RATE_LIMIT = { max: 3, windowMs: 10 * 60 * 1000 };

/**
 * Mémoire des derniers envois : adresse IP → dates des envois (en ms).
 *
 * ⚠️ Stockée dans la mémoire du serveur Node : elle est vidée à chaque
 * redémarrage et n'est pas partagée entre plusieurs serveurs. C'est suffisant
 * pour un site vitrine sur un seul serveur (Passenger). Pour plusieurs
 * serveurs, il faudrait une base partagée (Redis, par exemple).
 */
const attempts = new Map<string, number[]>();

/**
 * Enregistre une tentative d'envoi et dit si elle est autorisée.
 * Renvoie aussi le nombre de minutes à attendre quand la limite est atteinte.
 */
export function checkRateLimit(ip: string, now = Date.now()): { allowed: boolean; retryInMinutes: number } {
  // On ne garde que les envois encore dans la fenêtre des 10 dernières minutes
  const recent = (attempts.get(ip) ?? []).filter((time) => now - time < RATE_LIMIT.windowMs);

  if (recent.length >= RATE_LIMIT.max) {
    attempts.set(ip, recent);
    // Le plus ancien envoi « sort » de la fenêtre à : recent[0] + windowMs
    const waitMs = recent[0] + RATE_LIMIT.windowMs - now;
    return { allowed: false, retryInMinutes: Math.max(1, Math.ceil(waitMs / 60000)) };
  }

  recent.push(now);
  attempts.set(ip, recent);

  // Ménage de temps en temps : on oublie les IP qui n'ont rien envoyé récemment
  if (attempts.size > 1000) {
    for (const [key, times] of attempts) {
      if (times.every((time) => now - time >= RATE_LIMIT.windowMs)) attempts.delete(key);
    }
  }

  return { allowed: true, retryInMinutes: 0 };
}

/**
 * Adresse IP du visiteur, lue dans les en-têtes HTTP.
 * Derrière un hébergeur (Passenger, proxy), l'IP réelle est dans
 * "x-forwarded-for" (la 1re de la liste) ; sinon dans "x-real-ip".
 */
export function readClientIp(headerList: Headers): string {
  const forwarded = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headerList.get("x-real-ip") || "inconnue";
}
