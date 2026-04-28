import Link from "next/link";
import { personas } from "./lib/personas";

const highlights = [
  {
    title: "Separate history",
    copy: "Each persona keeps its own local thread.",
  },
  {
    title: "Better prompts",
    copy: "Starter prompts now match the voice.",
  },
];

export default function Home() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="hero-copy glass-card">
          <p className="eyebrow">Personafy</p>
          <h1>Distinct personas. One polished chat.</h1>
          <p className="hero-description">Pick a voice, keep its history, and switch without losing context.</p>

          <div className="hero-actions">
            <Link href={`/person/${personas[0].id}`} className="primary-btn">
              Open first persona
            </Link>
            <a href="#personas" className="secondary-btn">
              All personas
            </a>
          </div>

          <div className="hero-stats">
            <div>
              <strong>{personas.length}</strong>
              <span>persona channels</span>
            </div>
            <div>
              <strong>Local</strong>
              <span>saved locally</span>
            </div>
            <div>
              <strong>Animated</strong>
              <span>smooth motion</span>
            </div>
          </div>
        </div>

        <div className="hero-side glass-card">
          <div className="floating-orb floating-orb-one" />
          <div className="floating-orb floating-orb-two" />
          <p className="eyebrow">Live preview</p>
          <h2>Built to feel finished.</h2>
          <p>Preview the persona cards and open any channel.</p>

          <div className="mini-card-stack">
            {personas.map((persona) => (
              <Link key={persona.id} href={`/person/${persona.id}`} className="mini-persona-card" style={{ borderColor: persona.glow }}>
                <div>
                  <strong>{persona.name}</strong>
                  <span>{persona.title}</span>
                </div>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="highlights-grid">
        {highlights.map((item) => (
          <article key={item.title} className="glass-card highlight-card">
            <p className="eyebrow">Experience</p>
            <h3>{item.title}</h3>
            <p>{item.copy}</p>
          </article>
        ))}
      </section>

      <section id="personas" className="persona-showcase">
        <div className="section-heading">
          <p className="eyebrow">Choose your voice</p>
          <h2>Three personas, three entry points.</h2>
        </div>

        <div className="persona-grid">
          {personas.map((persona, index) => (
            <Link key={persona.id} href={`/person/${persona.id}`} className="persona-preview glass-card" style={{ ["--accent" as string]: persona.accent, ["--glow" as string]: persona.glow }}>
              <div className="persona-preview-top">
                <span className="persona-index">0{index + 1}</span>
                <span className="persona-dot" />
              </div>
              <h3>{persona.name}</h3>
              <p>{persona.tagline}</p>
              <div className="persona-snippets">
                {persona.prompts.slice(0, 2).map((prompt) => (
                  <span key={prompt}>{prompt}</span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
