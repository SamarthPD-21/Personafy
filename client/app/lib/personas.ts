export type PersonaId = "anshuman" | "abhimanyu" | "kshitij";

export type PersonaProfile = {
  id: PersonaId;
  name: string;
  title: string;
  tagline: string;
  description: string;
  accent: string;
  glow: string;
  prompts: string[];
  philosophy: string[];
};

export const personas: PersonaProfile[] = [
  {
    id: "anshuman",
    name: "Anshuman Singh",
    title: "Direct, disciplined, execution-first",
    tagline: "Sharp, direct guidance.",
    description: "Direct, practical, and no-nonsense.",
    accent: "#4cc9f0",
    glow: "rgba(76, 201, 240, 0.35)",
    prompts: [
      "Fix my DSA routine.",
      "Give me a 7-day comeback plan.",
    ],
    philosophy: [
      "Consistency beats motivation.",
      "Finish one thing before the next.",
    ],
  },
  {
    id: "abhimanyu",
    name: "Abhimanyu Saxena",
    title: "Structured, calm, analytical",
    tagline: "Calm, structured guidance.",
    description: "Calm, analytical, and structured.",
    accent: "#f97316",
    glow: "rgba(249, 115, 22, 0.32)",
    prompts: [
      "Build an interview prep roadmap.",
      "How do I revise without forgetting?",
    ],
    philosophy: [
      "Clarity beats speed.",
      "Strong fundamentals compound.",
    ],
  },
  {
    id: "kshitij",
    name: "Kshitij Mishra",
    title: "Friendly, simple, intuitive",
    tagline: "Friendly, simple teaching.",
    description: "Energetic and relatable.",
    accent: "#34d399",
    glow: "rgba(52, 211, 153, 0.33)",
    prompts: [
      "Explain recursion simply.",
      "Make graphs intuitive.",
    ],
    philosophy: [
      "Intuition matters.",
      "Small daily habits win.",
    ],
  },
];

export const personaMap = Object.fromEntries(personas.map((persona) => [persona.id, persona])) as Record<PersonaId, PersonaProfile>;

export const defaultPersonaId: PersonaId = "anshuman";