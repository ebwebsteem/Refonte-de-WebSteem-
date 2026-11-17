import { featuredReferences } from "@/content/references";
import { Container } from "@/components/ui/Container";
import { Photo } from "@/components/ui/Photo";
import { SectionHeading } from "@/components/ui/SectionHeading";

/**
 * Grille des références de la page /references.
 *
 * Même données que la section de l'accueil (featuredReferences), mais en
 * 2 colonnes avec de plus grandes photos : ici, c'est le sujet principal
 * de la page. <ul>/<li> car c'est une liste de projets.
 */
export function ReferencesGrid() {
  return (
    <section className="pb-16 lg:pb-24">
      <Container className="flex flex-col gap-10">
        <SectionHeading eyebrow="Nos réalisations" title="Quelques projets, et ce qu'ils ont changé pour nos clients." />

        <ul className="grid gap-10 md:grid-cols-2 lg:gap-x-8 lg:gap-y-14">
          {featuredReferences.map((reference) => (
            <li key={reference.name}>
              <article className="flex h-full flex-col gap-4">
                <div className="relative h-64 overflow-hidden rounded-[14px] bg-placeholder lg:h-[360px]">
                  <Photo src={reference.photo} alt="" sizes="(min-width: 768px) 50vw, 100vw" />
                </div>
                <p className="text-sm font-medium">{reference.meta}</p>
                <h3 className="text-2xl leading-8 font-semibold text-navy">{reference.name}</h3>
                <p className="max-w-[60ch] text-[17px] leading-7">{reference.summary}</p>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
