"use client";
import Link from "next/link";
import { useState } from "react";
export default function Settings(){const[light,setLight]=useState(false);const[accent,setAccent]=useState("#55b5ff");return <main className={light?"auth-page light":"auth-page"}><section className="auth-card"><h1>Settings</h1><p>Personalize your workspace.</p><div className="setting-row"><span>Light mode</span><button className={`switch ${light?"on":""}`} onClick={()=>setLight(!light)}><i/></button></div><label className="color-label">Accent color<input type="color" value={accent} onChange={e=>setAccent(e.target.value)}/></label><p className="auth-switch"><Link href="/">Return to chat</Link></p></section></main>}
