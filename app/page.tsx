"use client";

import { ChangeEvent, TouchEvent as ReactTouchEvent, useEffect, useRef, useState } from "react";
import { Bot, Ellipsis, ImagePlus, Menu, PanelLeft, Pencil, Plus, Search, Send, Settings, Shield, Sparkles, Square, SquarePen, X } from "lucide-react";
import { readBrowserProfile } from "@/app/lib/browser-auth";

type Message = { role: "user" | "assistant"; text: string; image?: string };
type Chat = { id: number; title: string; messages: Message[] };
type Profile = { email: string; name?: string; picture?: string };

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([{ id: 1, title: "New chat", messages: [] }]);
  const [active, setActive] = useState(1);
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [side, setSide] = useState(true);
  const [research, setResearch] = useState(false);
  const [model, setModel] = useState<"Free" | "OpenAI">("Free");
  const [modelMenu, setModelMenu] = useState(false);
  const [sidebarMenu, setSidebarMenu] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [selectedUserIndex, setSelectedUserIndex] = useState<number | null>(null);
  const [copiedUserIndex, setCopiedUserIndex] = useState<number | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const sidebarMenuRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<number | null>(null);
  const [dragX, setDragX] = useState<number | null>(null);
  const chat = chats.find((item) => item.id === active) ?? chats[0];
  const replyHasStarted = busy && chat.messages.at(-1)?.role === "assistant";

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setProfile(data?.profile ?? readBrowserProfile()))
      .catch(() => setProfile(readBrowserProfile()));
  }, []);

  useEffect(() => { if (window.innerWidth <= 850) setSide(false); }, []);

  useEffect(() => {
    if (!sidebarMenu && !modelMenu) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target as Node;
      if (sidebarMenu && !sidebarMenuRef.current?.contains(target)) setSidebarMenu(false);
      if (modelMenu && !modelMenuRef.current?.contains(target)) setModelMenu(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [sidebarMenu, modelMenu]);

  const addMessage = (message: Message) => setChats((items) => items.map((item) => item.id === active ? {
    ...item,
    title: item.messages.length ? item.title : message.text.replace("Generate image: ", "").slice(0, 35),
    messages: [...item.messages, message],
  } : item));

  const appendToAssistant = (chunk: string) => setChats((items) => items.map((item) => item.id === active ? {
    ...item,
    messages: item.messages.map((message, index) => index === item.messages.length - 1 && message.role === "assistant" ? { ...message, text: message.text + chunk } : message),
  } : item));

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  };

  const send = async (draft?: { user: Message; previous: Message[] }) => {
    if (((!text.trim() && !image) && !draft) || busy) return;
    const user: Message = draft?.user ?? { role: "user", text: text || "Analyze this image for cybersecurity-relevant information.", image: image ?? undefined };
    const recentMessages = [...(draft?.previous ?? chat.messages), user].slice(-6);
    const history = recentMessages.map((item, index) => ({
      role: item.role,
      content: item.text,
      images: index === recentMessages.length - 1 && item.image ? [item.image.split(",")[1] ?? item.image] : undefined,
    }));
    addMessage(user);
    setText("");
    setImage(null);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const response = await fetch(model === "OpenAI" ? "/api/chat" : "/api/ollama", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(model === "OpenAI" ? { input: user.text, images: user.image ? [user.image] : [], research } : { messages: history, research }), signal: controller.signal,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Model request failed");
      }
      if (model === "OpenAI") {
        const data = await response.json();
        addMessage({ role: "assistant", text: data.text });
      } else {
        addMessage({ role: "assistant", text: "" });
        const reader = response.body?.getReader();
        if (!reader) throw new Error("Streaming response was unavailable");
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line);
            if (event.message?.content) appendToAssistant(event.message.content);
          }
        }
        if (buffer.trim()) {
          const event = JSON.parse(buffer);
          if (event.message?.content) appendToAssistant(event.message.content);
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) addMessage({ role: "assistant", text: `${model} model error: ${error instanceof Error ? error.message : "Unknown error"}` });
    } finally { abortRef.current = null; setBusy(false); }
  };

  const editAndResend = (index: number) => {
    const original = chat.messages[index];
    const revised = editingText.trim();
    if (!original || !revised || busy) return;
    const previous = chat.messages.slice(0, index);
    setChats((items) => items.map((item) => item.id === active ? { ...item, messages: previous } : item));
    setEditingIndex(null);
    setSelectedUserIndex(null);
    void send({ user: { ...original, text: revised }, previous });
  };

  const copyQuestion = async (value: string, index: number) => {
    await navigator.clipboard?.writeText(value);
    setCopiedUserIndex(index);
    window.setTimeout(() => setCopiedUserIndex(null), 1200);
  };

  const newChat = () => {
    const next = { id: Date.now(), title: "New chat", messages: [] as Message[] };
    setChats((items) => [next, ...items]);
    setActive(next.id);
  };

  const beginSidebarDrag = (event: ReactTouchEvent) => {
    if (window.innerWidth > 850) return;
    const x = event.touches[0]?.clientX ?? 0;
    if (!side && x > 32) return;
    touchStart.current = x;
  };
  const moveSidebarDrag = (event: ReactTouchEvent) => {
    if (touchStart.current === null || window.innerWidth > 850) return;
    const width = sidebarRef.current?.offsetWidth || 286;
    const delta = (event.touches[0]?.clientX ?? touchStart.current) - touchStart.current;
    setDragX(side ? Math.min(0, delta) : Math.min(0, -width + Math.max(0, delta)));
  };
  const endSidebarDrag = () => {
    if (touchStart.current === null || window.innerWidth > 850) return;
    const width = sidebarRef.current?.offsetWidth || 286;
    const position = dragX ?? (side ? 0 : -width);
    setSide(position > -width * 0.5);
    setDragX(null);
    touchStart.current = null;
  };

  return <main className="app-shell" onTouchStart={beginSidebarDrag} onTouchMove={moveSidebarDrag} onTouchEnd={endSidebarDrag} onTouchCancel={endSidebarDrag}>
    <aside ref={sidebarRef} className={`sidebar ${side ? "" : "closed"} ${dragX !== null ? "dragging" : ""}`} style={dragX === null ? undefined : { transform: `translateX(${dragX}px)` }}>
      <div className="side-top"><div className="brand"><img className="brand-logo-img" src="/zyntra-logo.jpeg" alt="Zyntra" />Zyntra</div></div>
      <button className="new-chat" onClick={newChat}><Plus size={17} />New chat</button>
      <div className="search-box"><Search size={16} /><input placeholder="Search chats" /></div>
      <div className="sidebar-label">RECENT CHATS</div>
      <div className="recent chat-history">{chats.filter((item) => item.messages.length).map((item) => <button key={item.id} onClick={() => setActive(item.id)}><span className="history-dot" />{item.title}</button>)}</div>
      <div className="side-bottom"><button><ImagePlus size={17} />Images</button><button><Settings size={17} />Settings</button></div>
    </aside>
    {side && <button className="mobile-backdrop" aria-label="Close navigation" onClick={() => setSide(false)} />}
    <section className="workspace">
      <header className="topbar">
        <button className="mobile-menu-btn" onClick={() => setSide(!side)} aria-label="Open navigation"><Menu size={22} /></button>
        <button className="desktop-sidebar-btn" onClick={() => setSide(!side)} aria-label="Toggle sidebar"><PanelLeft size={19} /></button>
        <div className="topbar-right"><div className="chatbar-actions" ref={sidebarMenuRef}><button onClick={newChat} aria-label="New chat" title="New chat"><SquarePen size={17} /></button><div><button onClick={() => setSidebarMenu(!sidebarMenu)} aria-label="More options" title="More options"><Ellipsis size={19} /></button>{sidebarMenu && <div className="sidebar-more"><button onClick={() => setSidebarMenu(false)}>Images</button><button onClick={() => setSidebarMenu(false)}>Settings</button></div>}</div></div>{!profile && <div className="signin-prompt"><span>You’ll get smarter responses and can upload files, images, and more.</span><div><a href="/signin">Sign in</a><a href="/signup">Sign up</a></div></div>}</div>
      </header>
      <section className="chat-view">
        <div className="chat-scroll">
          {selectedUserIndex !== null && <button className="message-focus-backdrop" aria-label="Close message options" onClick={() => setSelectedUserIndex(null)} />}
          {chat.messages.map((message, index) => <article className={`message ${message.role} ${selectedUserIndex === index ? "message-selected" : ""}`} key={index} onClick={() => message.role === "user" && setSelectedUserIndex(selectedUserIndex === index ? null : index)}>
            <div className="message-avatar">{message.role === "assistant" ? <Bot size={17} /> : profile?.picture ? <img src={profile.picture} alt="Your profile" referrerPolicy="no-referrer" /> : <Shield size={14} />}</div>
            <div className="message-body">
              <div className="message-meta"><b>{message.role === "assistant" ? "Zyntra" : "You"}</b></div>
              {message.image && <div className="attached-images"><img src={message.image} alt={message.role === "assistant" ? "Generated" : "Submitted"} /></div>}
              {editingIndex === index ? <div className="question-editor" onClick={(event) => event.stopPropagation()}><textarea value={editingText} onChange={(event) => setEditingText(event.target.value)} autoFocus /><div><button onClick={() => setEditingIndex(null)}>Cancel</button><button onClick={() => editAndResend(index)}>Save & send</button></div></div> : <><div className="message-content">{message.text.split("\n").map((line, lineIndex) => <p key={lineIndex}>{line}</p>)}</div>{message.role === "user" && selectedUserIndex === index && <div className="question-actions" onClick={(event) => event.stopPropagation()}><button onClick={() => { setEditingIndex(index); setEditingText(message.text); }} title="Edit question" aria-label="Edit question"><Pencil size={13} /></button><button onClick={() => copyQuestion(message.text, index)} title="Copy question" aria-label="Copy question">{copiedUserIndex === index ? "✓" : "⧉"}</button></div>}</>}
            </div>
          </article>)}
          {busy && !replyHasStarted && <article className="message assistant"><div className="message-avatar"><Bot size={17} /></div><div className="thinking"><i /><i /><i /> Zyntra is thinking</div></article>}
        </div>
        <div className="composer-wrap">
          {image && <div className="selected-images"><div><img src={image} alt="Ready" /><button onClick={() => setImage(null)}><X size={13} /></button></div></div>}
          <div className="composer">
            <textarea value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Message Zyntra…" />
            <div className="composer-bottom">
              <input ref={picker} className="hidden-file" type="file" accept="image/*" onChange={pick} />
              <button className="attach" onClick={() => picker.current?.click()}><ImagePlus size={17} /></button>
              <button className={`mini-control ${research ? "chosen" : ""}`} onClick={() => setResearch(!research)}><Sparkles size={12} />Research</button>
              <div className="model-select" ref={modelMenuRef}><button className="mini-control model-trigger" onClick={() => setModelMenu(!modelMenu)}>{model}</button>{modelMenu && <div className="model-menu"><button onClick={() => { setModel("Free"); setModelMenu(false); }}><b>Free</b><small>Local ZYNTRA model</small></button><button onClick={() => { setModel("OpenAI"); setModelMenu(false); }}><b>OpenAI</b><small>Uses your OpenAI API allowance</small></button></div>}</div>
              <button className={`send ${busy ? "stop" : ""}`} disabled={!busy && (!text.trim() && !image)} onClick={() => busy ? abortRef.current?.abort() : send()} aria-label={busy ? "Stop generating" : "Send message"} title={busy ? "Stop generating" : "Send message"}>{busy ? <Square size={14} fill="currentColor" /> : <Send size={17} />}</button>
            </div>
          </div>
        </div>
      </section>
    </section>
  </main>;
}
