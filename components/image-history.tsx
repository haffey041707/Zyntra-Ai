"use client";
import {useEffect} from "react";
export function ImageHistory(){useEffect(()=>{const save=()=>{const current=JSON.parse(localStorage.getItem("zyntra-images")||"[]") as string[];const sent=[...document.querySelectorAll<HTMLImageElement>(".message.user .attached-images img")].map(image=>image.src);const next=[...new Set([...sent,...current])];localStorage.setItem("zyntra-images",JSON.stringify(next))};const observer=new MutationObserver(save);observer.observe(document.body,{childList:true,subtree:true});save();return()=>observer.disconnect()},[]);return null}
