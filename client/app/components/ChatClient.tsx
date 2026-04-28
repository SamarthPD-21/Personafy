"use client";

import React, { useEffect, useRef, useState } from "react";
import { personaMap, type PersonaId, type PersonaProfile } from "../lib/personas";

type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
};

type ChatClientProps = {
  personaId: PersonaId;
};

const storageKeyFor = (personaId: PersonaId) => `personafy.history.${personaId}`;

const defaultPrompts = (persona: PersonaProfile) => persona.prompts;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function loadMessages(personaId: PersonaId) {
  if (typeof window === "undefined") return [] as Message[];

  try {
    const raw = window.localStorage.getItem(storageKeyFor(personaId));
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Message[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (entry): entry is Message =>
        !!entry &&
        (entry.sender === "user" || entry.sender === "assistant") &&
        typeof entry.text === "string" &&
        typeof entry.id === "string",
    );
  } catch {
    return [];
  }
}

export default function ChatClient({ personaId }: ChatClientProps) {
  const persona = personaMap[personaId];
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMessages(loadMessages(personaId));
    setDraft("");
    setIsHydrated(true);
    setIsThinking(false);
  }, [personaId]);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(storageKeyFor(personaId), JSON.stringify(messages));
  }, [messages, personaId, isHydrated]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking]);

  const sendMessage = async (override?: string) => {
    const text = (override ?? draft).trim();
    if (!text || isThinking) return;

    const userMessage: Message = { id: createId(), sender: "user", text };
    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setIsThinking(true);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: personaId, message: text }),
      });

      const payload = await response.json().catch(() => ({}));
      const reply = response.ok ? payload?.reply : payload?.error || payload?.message || `Server error ${response.status}`;

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          sender: "assistant",
          text: response.ok ? reply : `Error: ${reply}`,
        },
      ]);
    } catch (error: any) {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          sender: "assistant",
          text: `Network error: ${error?.message || String(error)}`,
        },
      ]);
    } finally {
      setIsThinking(false);
      composerRef.current?.focus();
    }
  };

  const resetHistory = () => {
    setMessages([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKeyFor(personaId));
    }
  };

  if (!persona) {
    return (
      <div className="chat-empty-state">
        <p className="eyebrow">Unknown</p>
        <h2>Persona not found.</h2>
        <p>Pick one from the home screen.</p>
      </div>
    );
  }

  return (
    <section className="chat-shell">
      <aside className="chat-profile-panel glass-card">
        <div className="profile-orb" style={{ background: persona.glow }} />
        <p className="eyebrow">Persona</p>
        <h1>{persona.name}</h1>
        <p className="profile-title">{persona.title}</p>
        <p className="profile-description">{persona.description}</p>

        <div className="persona-philosophy">
          {persona.philosophy.map((item) => (
            <div key={item} className="philosophy-pill">
              {item}
            </div>
          ))}
        </div>

        <div className="panel-metrics">
          <div>
            <span>History</span>
            <strong>{messages.length}</strong>
          </div>
          <div>
            <span>Storage</span>
            <strong>Local</strong>
          </div>
        </div>

        <button type="button" className="secondary-btn" onClick={resetHistory}>
          Clear history
        </button>
      </aside>

      <div className="chat-workspace">
        <header className="chat-header glass-card">
          <div>
            <p className="eyebrow">Chat</p>
            <h2>{persona.tagline}</h2>
            <p>Each persona keeps its own local thread.</p>
          </div>

          <div className="chat-status">
            <span className="status-dot" style={{ background: persona.accent }} />
            <span>{isThinking ? "Generating reply" : "Ready"}</span>
          </div>
        </header>

        <div className="prompt-rail glass-card">
          <div className="prompt-rail-copy">
            <p className="eyebrow">Quick prompts</p>
            <h3>Start with one of these.</h3>
          </div>
          <div className="prompt-chip-grid">
            {defaultPrompts(persona).map((prompt) => (
              <button key={prompt} type="button" className="prompt-chip" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="chat-stream glass-card" aria-live="polite" aria-busy={isThinking}>
          {messages.length === 0 ? (
            <div className="empty-thread">
              <div className="empty-thread-badge">New thread</div>
              <h3>No messages yet.</h3>
              <p>Select a prompt or type your own.</p>
            </div>
          ) : (
            messages.map((message) => (
              <article key={message.id} className={`message-bubble ${message.sender}`}>
                <div className="message-meta">{message.sender === "user" ? "You" : persona.name}</div>
                <p>{message.text}</p>
              </article>
            ))
          )}

          {isThinking && (
            <article className="message-bubble assistant typing-bubble">
              <div className="message-meta">{persona.name}</div>
              <div className="typing-indicator" aria-label="Typing">
                <span />
                <span />
                <span />
              </div>
            </article>
          )}
          <div ref={endRef} />
        </div>

        <footer className="composer glass-card">
          <label className="sr-only" htmlFor={`composer-${personaId}`}>
            Message composer for {persona.name}
          </label>
          <textarea
            id={`composer-${personaId}`}
            ref={composerRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            placeholder={`Ask ${persona.name} something specific...`}
            rows={3}
          />
          <div className="composer-actions">
            <span className="composer-hint">Enter to send, Shift+Enter for a line.</span>
            <button type="button" className="primary-btn" onClick={() => sendMessage()} disabled={!draft.trim() || isThinking}>
              Send message
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
