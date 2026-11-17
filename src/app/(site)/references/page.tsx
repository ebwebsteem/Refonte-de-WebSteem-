import type { Metadata } from "next";
import { ClientsStrip } from "@/components/home/ClientsStrip";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { ReferencesGrid } from "@/components/references/ReferencesGrid";
import { CtaBanner } from "@/components/sections/CtaBanner";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Références",
  description:
    "Clubs, artisans, commerces, cabinets : découvrez les sites que WebSteem a créés et suit pour ses clients, de Grenoble au Var.",
};

/**
 * Page « Références » (/references).
 *
 * Il n'y a pas de maquette dédiée : la page réutilise les blocs de la charte V3
 * (bandeau clients et avis de l'accueil, bandeau CTA) autour d'une grille de
 * projets. Les données viennent de src/content/references.ts ; plus tard, un
 * content-type « Référence » dans Strapi pourra les remplacer.
 *
 * Page 100 % statique (aucune donnée Strapi) : Next la génère au build.
 */
export default function ReferencesPage() {
  return (
    <>
      <section className="pt-4 pb-10 lg:pt-18 lg:pb-14">
        <Container className="flex flex-col gap-4.5 lg:gap-6">
          <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: "Références" }]} />
          <h1 className="max-w-[900px] text-4xl leading-11 font-semibold tracking-tight text-balance text-navy lg:text-[56px] lg:leading-16">
            Des entreprises comme la vôtre nous ont confié leur site.
          </h1>
          <p className="max-w-[60ch] text-base leading-[26px] lg:text-lg lg:leading-[30px]">
            Associations, artisans, commerçants, professions libérales : chaque projet commence par une écoute de votre
            métier, et continue bien après la mise en ligne.
          </p>
        </Container>
      </section>

      <ReferencesGrid />
      <ClientsStrip />
      <div className="pt-16 lg:pt-24">
        <TestimonialsSection />
      </div>
      <CtaBanner
        title="Votre projet pourrait être le prochain."
        text="Parlons-en 30 minutes, sans engagement : on vous dit franchement ce qu'on ferait à votre place."
        withPortrait
      />
    </>
  );
}
