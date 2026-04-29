"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { personaMap, type PersonaId } from "../lib/personas";

/* ─── Types ────────────────────────────────────────────── */
type Message = { id: string; sender: "user" | "assistant"; text: string };
type ThreadInfo = { id: string; title: string; updatedAt: number };

/* ─── Storage helpers ───────────────────────────────────── */
const msgKey = (pid: PersonaId, tid: string) => `pfy.msg.${pid}.${tid}`;
const thrKey = (pid: PersonaId) => `pfy.thr.${pid}`;
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function readThreads(pid: PersonaId): ThreadInfo[] {
  try {
    const raw = localStorage.getItem(thrKey(pid));
    return raw ? JSON.parse(raw) : [{ id: "default", title: "Chat 1", updatedAt: Date.now() }];
  } catch { return [{ id: "default", title: "Chat 1", updatedAt: Date.now() }]; }
}

function readMessages(pid: PersonaId, tid: string): Message[] {
  try {
    const raw = localStorage.getItem(msgKey(pid, tid));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

function saveThreads(pid: PersonaId, threads: ThreadInfo[]) {
  localStorage.setItem(thrKey(pid), JSON.stringify(threads));
}

function saveMessages(pid: PersonaId, tid: string, msgs: Message[]) {
  localStorage.setItem(msgKey(pid, tid), JSON.stringify(msgs));
}

/* ─── Send icon ─────────────────────────────────────────── */
function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  );
}

/* ─── Plus icon ─────────────────────────────────────────── */
function PlusIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

/* ─── Main Component ────────────────────────────────────── */
export default function ChatClient({ personaId }: { personaId: PersonaId }) {
  const persona = personaMap[personaId];

  const [threads, setThreads] = useState<ThreadInfo[]>([]);
  const [activeId, setActiveId] = useState("default");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Hydrate */
  useEffect(() => {
    const thr = readThreads(personaId);
    setThreads(thr);
    const tid = thr[0]?.id ?? "default";
    setActiveId(tid);
    setMessages(readMessages(personaId, tid));
    setHydrated(true);
  }, [personaId]);

  /* Persist messages */
  useEffect(() => {
    if (!hydrated) return;
    saveMessages(personaId, activeId, messages);
    if (messages.length === 1) {
      setThreads(prev => {
        const updated = prev.map(t =>
          t.id === activeId && (t.title === "Chat 1" || t.title === "New Chat")
            ? { ...t, title: messages[0].text.slice(0, 28) + (messages[0].text.length > 28 ? "…" : ""), updatedAt: Date.now() }
            : t
        );
        saveThreads(personaId, updated);
        return updated;
      });
    }
  }, [messages, hydrated, personaId, activeId]);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  /* Auto-resize textarea */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [draft]);

  const switchThread = useCallback((tid: string) => {
    setActiveId(tid);
    setMessages(readMessages(personaId, tid));
    setDraft("");
    setStreaming(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [personaId]);

  const newThread = useCallback(() => {
    const t: ThreadInfo = { id: uid(), title: "New Chat", updatedAt: Date.now() };
    setThreads(prev => {
      const updated = [t, ...prev];
      saveThreads(personaId, updated);
      return updated;
    });
    switchThread(t.id);
  }, [personaId, switchThread]);

  const renameThread = useCallback((tid: string, currentTitle: string) => {
    const newName = window.prompt("Rename chat:", currentTitle);
    if (newName && newName.trim()) {
      setThreads(prev => {
        const updated = prev.map(t => t.id === tid ? { ...t, title: newName.trim(), updatedAt: Date.now() } : t);
        saveThreads(personaId, updated);
        return updated;
      });
    }
  }, [personaId]);


  const send = useCallback(async (override?: string) => {
    const text = (override ?? draft).trim();
    if (!text || streaming) return;

    const userMsg: Message = { id: uid(), sender: "user", text };
    const asstId = uid();
    const asstMsg: Message = { id: asstId, sender: "assistant", text: "" };

    setMessages(prev => [...prev, userMsg, asstMsg]);
    setDraft("");
    setStreaming(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_BACKEND_API || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000"}/chat`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ persona: personaId, message: text }) }
      );
      if (!res.body) throw new Error("No body");

      const reader = res.body.getReader();
      const dec = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        for (const line of chunk.split("\n\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const { text: t, error: e } = JSON.parse(payload);
            if (t) setMessages(prev => prev.map(m => m.id === asstId ? { ...m, text: m.text + t } : m));
            if (e) setMessages(prev => prev.map(m => m.id === asstId ? { ...m, text: m.text + `\n\n⚠️ ${e}` } : m));
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err: any) {
      setMessages(prev => prev.map(m => m.id === asstId ? { ...m, text: `⚠️ ${err.message}` } : m));
    } finally {
      setStreaming(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [draft, streaming, personaId]);

  if (!persona) return null;

  return (
    <div className="flex flex-1 gap-4 min-h-0 h-full pt-2">

      {/* ── Sidebar ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="flex-shrink-0 overflow-hidden"
          >
            <div className="glass-panel h-full rounded-2xl flex flex-col p-4 w-[260px] relative overflow-hidden">
              {/* Persona glow */}
              <div
                className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: persona.accent }}
              />

              {/* Persona info */}
              <div className="mb-6 relative z-10">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black mb-3"
                  style={{ background: `${persona.accent}25`, color: persona.accent }}
                >
                  {persona.name[0]}
                </div>
                <h2 className="text-white font-bold text-lg leading-tight">{persona.name}</h2>
                <p className="text-gray-500 text-xs mt-1 leading-snug">{persona.title}</p>
              </div>

              {/* Philosophy pills */}
              <div className="flex flex-col gap-2 mb-6 relative z-10">
                {persona.philosophy.map(p => (
                  <div
                    key={p}
                    className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-gray-400 leading-snug"
                  >
                    {p}
                  </div>
                ))}
              </div>

              {/* Thread list */}
              <div className="flex-1 flex flex-col min-h-0 relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold">Chats</span>
                  <button
                    onClick={newThread}
                    className="w-6 h-6 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center text-gray-300 hover:text-white transition-colors border border-white/10"
                  >
                    <PlusIcon />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-1">
                  {threads.map(t => (
                    <button
                      key={t.id}
                      onClick={() => switchThread(t.id)}
                      onDoubleClick={() => renameThread(t.id, t.title)}
                      title="Double-click to rename"
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all truncate ${
                        t.id === activeId
                          ? "text-white bg-white/10 border border-white/15"
                          : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Chat panel ── */}
      <div className="flex-1 flex flex-col min-h-0 glass-panel rounded-2xl overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/8 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(s => !s)}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
            title="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate">{persona.name}</h1>
            <p className="text-xs text-gray-500 truncate">{persona.title}</p>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0">
            <span
              className="w-1.5 h-1.5 rounded-full status-pulse"
              style={{ backgroundColor: streaming ? persona.accent : "#4ade80", color: streaming ? persona.accent : "#4ade80" }}
            />
            {streaming ? "Thinking…" : "Ready"}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 select-none">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-5 font-black"
                style={{ background: `${persona.accent}20`, color: persona.accent }}
              >
                {persona.name[0]}
              </div>
              <p className="text-white font-bold text-xl mb-1">{persona.name}</p>
              <p className="text-gray-500 text-sm mb-8">{persona.tagline}</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                {persona.prompts.map(p => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    className="text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-gray-300 hover:text-white transition-all hover:scale-105 active:scale-95"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  {/* Avatar for assistant */}
                  {msg.sender === "assistant" && (
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black mr-2 mt-1 flex-shrink-0"
                      style={{ background: `${persona.accent}25`, color: persona.accent }}
                    >
                      {persona.name[0]}
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] px-4 py-3 rounded-2xl shadow-sm ${
                      msg.sender === "user"
                        ? "bg-blue-600 text-white rounded-br-md"
                        : "bg-[#1c2433] text-gray-100 rounded-bl-md border border-white/8"
                    }`}
                  >
                    {/* Typing dots for empty assistant message while streaming */}
                    {msg.sender === "assistant" && msg.text === "" && streaming ? (
                      <div className="flex items-center gap-1 h-5 px-1">
                        <span className="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block" />
                        <span className="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block" />
                        <span className="typing-dot w-2 h-2 rounded-full bg-gray-400 inline-block" />
                      </div>
                    ) : (
                      <p className="msg-content">{msg.text}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-white/8 bg-black/20">
          <div
            className="flex items-end gap-3 bg-[#111827] border rounded-2xl px-4 py-2 focus-within:border-blue-500/60 transition-colors"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
              }}
              placeholder={`Ask ${persona.name} something…`}
              className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none resize-none min-h-[36px] max-h-40 py-1 text-sm leading-relaxed"
              rows={1}
              disabled={streaming}
            />
            <motion.button
              onClick={() => send()}
              disabled={!draft.trim() || streaming}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed transition-colors mb-0.5"
              style={{ backgroundColor: persona.accent }}
            >
              <SendIcon className="w-4 h-4" />
            </motion.button>
          </div>
          <p className="text-center text-gray-600 text-[11px] mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
