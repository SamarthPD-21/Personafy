"use client";

import React, { useEffect, useRef, useState } from "react";
import { personaMap, type PersonaId, type PersonaProfile } from "../lib/personas";

type Message = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  isNew?: boolean;
};

type ChatClientProps = {
  personaId: PersonaId;
};

const storageKeyFor = (personaId: PersonaId, threadId?: string) => 
  threadId ? `personafy.history.${personaId}.${threadId}` : `personafy.history.${personaId}`;

const threadListKey = (personaId: PersonaId) => `personafy.threads.${personaId}`;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

type ThreadInfo = {
  id: string;
  title: string;
  updatedAt: number;
};

function loadThreads(personaId: PersonaId): ThreadInfo[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(threadListKey(personaId));
    if (!raw) return [{ id: "default", title: "Current Chat", updatedAt: Date.now() }];
    return JSON.parse(raw);
  } catch {
    return [{ id: "default", title: "Current Chat", updatedAt: Date.now() }];
  }
}

function loadMessages(personaId: PersonaId, threadId: string) {
  if (typeof window === "undefined") return [] as Message[];

  try {
    const raw = window.localStorage.getItem(storageKeyFor(personaId, threadId));
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

function TypewriterMessage({ text, isFinal, isNew }: { text: string; isFinal: boolean, isNew?: boolean }) {
  const [displayedText, setDisplayedText] = useState(isNew ? "" : text);

  useEffect(() => {
    if (!isNew) {
      setDisplayedText(text);
      return;
    }
    
    if (displayedText.length === text.length) return;
    
    // Determine how many chars to add to catch up
    const charDiff = text.length - displayedText.length;
    
    // We let it animate the whole text over time, catching up slightly
    // but never snapping immediately to end unless we need to reset.
    if (isFinal && charDiff > 1000) {
      setDisplayedText(text); // only snap to end if absurdly behind
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText(prev => text.substring(0, prev.length + (charDiff > 25 ? 2 : 1)));
    }, 35); // Slower, more readable animation

    return () => clearTimeout(timer);
  }, [text, displayedText, isFinal, isNew]);

  return text.length === 0 ? (
    <div className="typing-indicator" aria-label="Typing">
      <span />
      <span />
      <span />
    </div>
  ) : (
    <p>{displayedText}</p>
  );
}

export default function ChatClient({ personaId }: ChatClientProps) {
  const persona = personaMap[personaId];
  const [threads, setThreads] = useState<ThreadInfo[]>([{ id: "default", title: "Current Chat", updatedAt: Date.now() }]);
  const [activeThreadId, setActiveThreadId] = useState<string>("default");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const defaultPrompts = (persona: PersonaProfile) => persona.prompts;

  useEffect(() => {
    const loadedThreads = loadThreads(personaId);
    setThreads(loadedThreads);    
    const initialThread = loadedThreads[0]?.id || "default";
    setActiveThreadId(initialThread);
    setMessages(loadMessages(personaId, initialThread));
    
    // Load custom prompts
    try {
      const cached = JSON.parse(window.localStorage.getItem(`personafy.prompts.${personaId}`) || "[]");
      setCustomPrompts(cached);
    } catch(e) { }

    setDraft("");
    setIsHydrated(true);
    setIsThinking(false);
  }, [personaId]);

  const switchThread = (tid: string) => {
    setActiveThreadId(tid);
    setMessages(loadMessages(personaId, tid));
    setIsThinking(false);
    setDraft("");
  };

  const renameThread = (tid: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setThreads(currentThreads => {
      const updated = currentThreads.map(t => t.id === tid ? { ...t, title: newTitle.trim(), updatedAt: Date.now() } : t);
      window.localStorage.setItem(threadListKey(personaId), JSON.stringify(updated));
      return updated;
    });
  };

  const createNewThread = () => {
    const newThread: ThreadInfo = { id: createId(), title: "New Conversation", updatedAt: Date.now() };
    const updatedThreads = [newThread, ...threads];
    setThreads(updatedThreads);
    window.localStorage.setItem(threadListKey(personaId), JSON.stringify(updatedThreads));
    switchThread(newThread.id);
  };

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(storageKeyFor(personaId, activeThreadId), JSON.stringify(messages));
    
    // Update thread title and date on first message
    if (messages.length > 0) {
      setThreads(currentThreads => {
        const updated = currentThreads.map(t => {
          if (t.id === activeThreadId) {
            const isFirstMsg = t.title === "New Conversation" || t.title === "Current Chat";
            return {
              ...t,
              title: isFirstMsg ? messages[0].text.substring(0, 30) + "..." : t.title,
              updatedAt: Date.now()
            };
          }
          return t;
        });
        window.localStorage.setItem(threadListKey(personaId), JSON.stringify(updated));
        return updated;
      });
    }
  }, [messages, personaId, isHydrated, activeThreadId]);

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

    const assistantId = createId();
    setMessages((current) => [...current, { id: assistantId, sender: "assistant", text: "", isNew: true }]);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: personaId, message: text }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataText = line.substring(6);
              if (dataText === "[DONE]") break;
              try {
                const data = JSON.parse(dataText);
                if (data.text) {
                  setMessages((current) =>
                    current.map((msg) =>
                      msg.id === assistantId ? { ...msg, text: msg.text + data.text } : msg
                    )
                  );
                } else if (data.error) {
                  setMessages((current) =>
                    current.map((msg) =>
                      msg.id === assistantId ? { ...msg, text: msg.text + `\n\nError: ${data.error}` } : msg
                    )
                  );
                }
              } catch (e) {}
            }
          }
        }
      }
      
      // Remove isNew flag when done so on reload it won't animate
      setMessages((current) =>
        current.map((msg) =>
          msg.id === assistantId ? { ...msg, isNew: false } : msg
        )
      );

    } catch (error: any) {
      setMessages((current) =>
        current.map((msg) =>
          msg.id === assistantId ? { ...msg, text: `Network error: ${error?.message || String(error)}` } : msg
        )
      );
    } finally {
      setIsThinking(false);
      composerRef.current?.focus();
    }
  };

  const resetHistory = () => {
    setMessages([]);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(storageKeyFor(personaId, activeThreadId));
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

        <div className="threads-list" style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conversations</span>
            <button 
              type="button" 
              onClick={createNewThread} 
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text-secondary)',
                borderRadius: '50px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                transition: 'all 0.2sease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              + New
            </button>
          </div>
          <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', paddingRight: '4px' }}>
            {threads.map(t => (
              <button 
                key={t.id} 
                onClick={() => switchThread(t.id)}
                onDoubleClick={() => {
                  const newName = window.prompt("Rename conversation:", t.title);
                  if (newName !== null) renameThread(t.id, newName);
                }}
                style={{ 
                  textAlign: 'left', 
                  padding: '8px 12px', 
                  borderRadius: '12px', 
                  background: t.id === activeThreadId ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: t.id === activeThreadId ? `1px solid ${persona.accent}40` : '1px solid transparent',
                  color: t.id === activeThreadId ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  transition: 'all 0.2s ease',
                  boxShadow: t.id === activeThreadId ? `0 0 10px ${persona.accent}15` : 'none'
                }}
                onMouseEnter={(e) => { if(t.id !== activeThreadId) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { if(t.id !== activeThreadId) e.currentTarget.style.background = 'transparent'; }}
              >
                {t.title || "Empty Thread"}
              </button>
            ))}
          </div>
        </div>

        <button type="button" className="secondary-btn" onClick={resetHistory} style={{ marginTop: '20px' }}>
          Clear current history
        </button>
      </aside>

      <div className="chat-workspace">
        <div className="prompt-rail glass-card">
          <div className="prompt-rail-copy">
            <p className="eyebrow">Quick prompts</p>
            <h3>Start with one of these.</h3>
            <div className="chat-status" style={{ marginTop: '10px' }}>
              <span className="status-dot" style={{ background: persona.accent }} />
              <span>{isThinking ? "Generating reply" : "Ready"}</span>
            </div>
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
                {message.sender === "assistant" ? <TypewriterMessage text={message.text} isFinal={!isThinking} isNew={message.isNew} /> : <p>{message.text}</p>}
              </article>
            ))
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
            rows={1}
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
