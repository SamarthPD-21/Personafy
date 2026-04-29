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
      "Critique my current DSA practice routine and tell me what I'm doing wrong.",
      "I've slacked off for weeks. Give me a brutal 7-day comeback plan.",
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
      "Design a comprehensive 3-month interview prep roadmap for top tech companies.",
      "Explain your system for revising complex topics without forgetting them.",
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
      "Explain the concept of recursion simply, with an intuitive real-world example.",
      "I'm struggling with Graph algorithms. Can you help me visualize them?",
    ],
    philosophy: [
      "Intuition matters.",
      "Small daily habits win.",
    ],
  },
];

export const personaMap = Object.fromEntries(personas.map((persona) => [persona.id, persona])) as Record<PersonaId, PersonaProfile>;

export const defaultPersonaId: PersonaId = "anshuman";