"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { ImagePlus, LogOut, Palette, Settings, Upload, X } from "lucide-react";
import { clearBrowserProfile, readBrowserProfile } from "@/app/lib/browser-auth";

type Panel = "images" | "settings" | null;
type Profile = { email: string; name?: string; picture?: string };

export function GlobalActions() {
  const [panel, setPanel] = useState<Panel>(null);
  const [images, setImages] = useState<string[]>([]);
  const [light, setLight] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    setImages(JSON.parse(localStorage.getItem("zyntra-images") || "[]"));
    fetch("/api/auth/session").then((response) => response.ok ? response.json() : null).then((data) => setProfile(data?.profile ?? readBrowserProfile())).catch(() => setProfile(readBrowserProfile()));
  }, []);

  useEffect(() => {
    const handle = (event: MouseEvent) => {
      const label = (event.target as HTMLElement).closest("button")?.textContent?.trim();
      const next = label === "Images" ? "images" : label === "Settings" ? "settings" : null;
      if (next) { event.preventDefault(); event.stopImmediatePropagation(); setPanel(next); }
    };
    document.addEventListener("click", handle, true);
    return () => document.removeEventListener("click", handle, true);
  }, []);

  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = [reader.result as string, ...images];
      setImages(next);
      localStorage.setItem("zyntra-images", JSON.stringify(next));
    };
    reader.readAsDataURL(file);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearBrowserProfile();
    setProfile(null);
    setPanel(null);
    window.location.reload();
  };

  if (!panel) return null;
  return <div className="overlay" onClick={(event) => { if (event.target === event.currentTarget) setPanel(null); }}><div className="dialog image-dialog"><button className="close" onClick={() => setPanel(null)}><X size={18} /></button>
    {panel === "images" ? <><ImagePlus size={24} /><h2>Images</h2><p>Images you send and ZYNTRA-generated images are saved here.</p><div className="library">{images.map((image) => <img key={image} src={image} alt="Stored" />)}</div></> : <>
      <Settings size={24} /><h2>Settings</h2>
      <div className="setting-row"><span>Light mode</span><button className={`switch ${light ? "on" : ""}`} onClick={() => { const next = !light; setLight(next); document.documentElement.classList.toggle("zyntra-light", next); }}><i /></button></div>
      <label className="color-label"><Palette size={16} /> Accent color<input type="color" onChange={(event) => document.documentElement.style.setProperty("--accent", event.target.value)} /></label>
      <div className="account-card"><b>Account</b>{profile ? <div className="settings-account"><img src="/zyntra-logo.jpeg" alt="Zyntra" /><div><strong>{profile.name || profile.email.split("@")[0]}</strong><small>{profile.email}</small></div><button onClick={logout} title="Sign out"><LogOut size={15} /></button></div> : <div><a href="/signin">Sign in</a><a href="/signup">Create account</a></div>}</div>
    </>}
  </div></div>;
}
