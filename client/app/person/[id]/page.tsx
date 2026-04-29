import Link from "next/link";
import { notFound } from "next/navigation";
import ChatClient from "../../components/ChatClient";
import { personas, personaMap, type PersonaId } from "../../lib/personas";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return personas.map((p) => ({ id: p.id }));
}

export default async function PersonaPage({ params }: Props) {
  const { id } = await params;
  const persona = personaMap[id as PersonaId];
  if (!persona) notFound();

  return (
    <div
      className="min-h-screen flex flex-col overflow-hidden"
      style={{ background: "#030712" }}
    >
      {/* Ambient top glow tied to persona accent */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[50vh] -z-0 opacity-20"
        style={{
          background: `radial-gradient(ellipse at 50% -10%, ${persona.accent} 0%, transparent 65%)`,
        }}
      />

      {/* Nav bar */}
      <header className="relative z-10 flex items-center justify-between px-6 pt-5 pb-3 max-w-screen-xl mx-auto w-full">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-full font-medium"
        >
          ← Back
        </Link>

        <div className="flex items-center gap-2 text-sm">
          <span
            className="w-2 h-2 rounded-full status-pulse"
            style={{ backgroundColor: persona.accent, color: persona.accent }}
          />
          <span className="text-gray-400 font-medium tracking-wide">
            {persona.name}
          </span>
        </div>
      </header>

      {/* Chat shell takes all remaining height */}
      <div className="relative z-10 flex-1 flex flex-col min-h-0 px-4 pb-4 max-w-screen-xl mx-auto w-full">
        <ChatClient personaId={id as PersonaId} />
      </div>
    </div>
  );
}
