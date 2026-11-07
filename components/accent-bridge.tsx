"use client";
import { useEffect } from "react";
export function AccentBridge(){useEffect(()=>{const change=(event:Event)=>{const el=event.target as HTMLInputElement;if(el.type!=="color")return;document.querySelector<HTMLElement>(".app-shell")?.style.setProperty("--accent",el.value)};document.addEventListener("input",change);return()=>document.removeEventListener("input",change)},[]);return null}
