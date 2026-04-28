import Link from "next/link";
import { notFound } from "next/navigation";
import ChatClient from "../../components/ChatClient";
import { personas, personaMap, type PersonaId } from "../../lib/personas";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return personas.map((persona) => ({ id: persona.id }));
}

export default async function PersonaPage({ params }: Props) {
  const { id } = await params;
  const personaId = id as PersonaId;
  const persona = personaMap[personaId];

  if (!persona) {
    notFound();
  }

  return (
    <main className="persona-page">
      <div className="persona-page-bg" />
      <div className="persona-page-inner">
        <div className="persona-topbar">
          <Link href="/" className="back-link">
            ← Back
          </Link>
          <div className="persona-topbar-copy">
            <span className="eyebrow">Channel</span>
            <strong>{persona.name}</strong>
          </div>
        </div>

        <section className="persona-intro glass-card" style={{ ["--accent" as string]: persona.accent, ["--glow" as string]: persona.glow }}>
          <div className="persona-intro-copy">
            <p className="eyebrow">Session</p>
            <h1>{persona.tagline}</h1>
            <p>{persona.description}</p>
          </div>

          <div className="persona-intro-promptset">
            <span>Prompts</span>
            <div>
              {persona.prompts.map((prompt) => (
                <span key={prompt}>{prompt}</span>
              ))}
            </div>
          </div>
        </section>

        <ChatClient personaId={personaId} />
      </div>
    </main>
  );
}
