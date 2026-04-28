"use client";

import { useState, useRef, useEffect } from "react";

type Message = { sender: "user" | "bot"; text: string };

export default function Home() {
  const [persona, setPersona] = useState<string>("anshuman");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const personas = [
    { id: "anshuman", label: "Anshuman Singh" },
    { id: "abhimanyu", label: "Abhimanyu Saxena" },
    { id: "kshitij", label: "Kshitij Mishra" },
  ];

  const suggestions = [
    "How should I structure my DSA study?",
    "I feel stuck, give me a plan.",
    "What practice routine works best?",
  ];

  const switchPersona = (p: string) => {
    setPersona(p);
    setMessages([]);
  };

  const endRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // auto-scroll to bottom when messages change
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, typing]);

  const sendMessage = async (text?: string) => {
    const msg = text ?? input;
    if (!msg) return;
    // append user message first
    setMessages((m) => [...m, { sender: "user", text: msg }]);
    setInput("");
    setTyping(true);

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, message: msg }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data && data.reply) {
        setMessages((m) => [...m, { sender: "bot", text: data.reply }]);
      } else {
        const errMsg = (data && (data.error || data.message)) || `Server error: ${res.status} ${res.statusText}`;
        setMessages((m) => [...m, { sender: "bot", text: `Error: ${errMsg}` }]);
      }
    } catch (err: any) {
      setMessages((m) => [...m, { sender: "bot", text: `Network error: ${err?.message || String(err)}` }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: 24, background: "#0f172a", color: "#e6eef8", fontFamily: "Inter, Arial" }}>
      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
        <aside style={{ background: "#071029", padding: 18, borderRadius: 12 }}>
          <h2 style={{ margin: 0, marginBottom: 12, fontSize: 18 }}>Personas</h2>
          <div style={{ display: "grid", gap: 8 }}>
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => switchPersona(p.id)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: persona === p.id ? "#0ea5a4" : "transparent",
                  color: persona === p.id ? "#022" : "#dbeafe",
                  border: "1px solid rgba(255,255,255,0.04)",
                  textAlign: "left",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <h3 style={{ margin: "8px 0" }}>Quick prompts</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {suggestions.map((s) => (
                <button key={s} onClick={() => sendMessage(s)} style={{ padding: 8, borderRadius: 8, background: "#022c41", color: "#dbeafe", border: "none" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <section style={{ background: "#07203a", padding: 18, borderRadius: 12, display: "flex", flexDirection: "column", height: "80vh" }}>
          <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 20 }}>Persona Chat</h1>
              <div style={{ fontSize: 12, color: "#9fb3c9" }}>{personas.find((p) => p.id === persona)?.label} — system prompt only changes</div>
            </div>
            <div style={{ fontSize: 12, color: "#9fb3c9" }}>Model: same for all personas</div>
          </header>

          <div ref={containerRef} style={{ flex: 1, overflow: "auto", padding: 8, display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.sender === "user" ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                <div style={{ fontSize: 12, color: "#9fb3c9", marginBottom: 6 }}>{m.sender === "user" ? "You" : personas.find((p) => p.id === persona)?.label}</div>
                <div style={{ whiteSpace: "pre-wrap", background: m.sender === "user" ? "#0369a1" : "#083344", padding: 12, borderRadius: 8, color: "#e6eef8" }}>{m.text}</div>
              </div>
            ))}

            {typing && (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <div style={{ width: 8, height: 8, background: "#9fe2c8", borderRadius: "50%", animation: "blink 1s infinite" }} />
                <div style={{ color: "#9fb3c9" }}>Typing...</div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              placeholder="Type your message..."
              style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)", background: "#021826", color: "#e6eef8" }}
            />
            <button onClick={() => sendMessage()} style={{ padding: "10px 14px", borderRadius: 8, background: "#0ea5a4", border: "none", color: "#022" }}>Send</button>
          </div>
        </section>
      </div>

      <style>{`@keyframes blink { 0% {opacity:1} 50% {opacity:0.2} 100% {opacity:1} }`}</style>
    </div>
  );
}
