'use client';
import Image from 'next/image';
import {useEffect,useRef,useState} from 'react';
import {useLocale} from '@/lib/use-locale';

export default function NatureIntro(){
 const {tr}=useLocale();const [visible,setVisible]=useState(false);const dismissRef=useRef<HTMLButtonElement>(null);const previousFocus=useRef<HTMLElement|null>(null);
 useEffect(()=>{
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  if(media.matches)return;
  try{if(sessionStorage.getItem('morrow-intro-seen')==='1')return;sessionStorage.setItem('morrow-intro-seen','1')}catch{/* The intro also works when session storage is unavailable. */}
  setVisible(true);const timer=window.setTimeout(()=>setVisible(false),3200);
  const reduce=()=>{if(media.matches)setVisible(false)};media.addEventListener('change',reduce);
  return()=>{window.clearTimeout(timer);media.removeEventListener('change',reduce)};
 },[]);
 useEffect(()=>{
  if(!visible)return;previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const content=document.getElementById('planner-content');const wasInert=content?.inert??false;if(content)content.inert=true;
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';dismissRef.current?.focus({preventScroll:true});
  function escape(e:KeyboardEvent){if(e.key==='Escape')setVisible(false)}window.addEventListener('keydown',escape);
  return()=>{if(content)content.inert=wasInert;document.body.style.overflow=overflow;window.removeEventListener('keydown',escape);if(previousFocus.current&&previousFocus.current!==document.body)previousFocus.current.focus({preventScroll:true})};
 },[visible]);
 if(!visible)return null;
 return <div className="nature-intro" role="dialog" aria-modal="true" aria-label={tr('introTitle')} onAnimationEnd={e=>{if(e.target===e.currentTarget)setVisible(false)}}>
  <button ref={dismissRef} className="intro-skip" onClick={()=>setVisible(false)}>{tr('skipIntro')} ↗</button>
  <div className="intro-center">
   <div className="intro-landscape" aria-hidden="true">
    <span className="intro-sun"/>
    <Image className="intro-mountains" src="/nature/mountains.png" alt="" width={360} height={132} priority/>
    <Image className="intro-tree" src="/nature/apple-tree.png" alt="" width={105} height={126} priority/>
    <Image className="intro-grass intro-grass-left" src="/nature/grass.png" alt="" width={60} height={72} priority/>
    <Image className="intro-grass intro-grass-right" src="/nature/grass-tall.png" alt="" width={64} height={80} priority/>
    <Image className="intro-rabbit" src="/nature/rabbit.png" alt="" width={49} height={52} priority/>
    <Image className="intro-bird" src="/nature/bird.png" alt="" width={40} height={38} priority/>
    <Image className="intro-leaf" src="/nature/leaf.png" alt="" width={22} height={28} priority/>
   </div>
   <div className="intro-wordmark" aria-label="Morrow">mor<span>row.</span></div>
   <p className="intro-tagline">A LITTLE GROWTH, EVERY DAY</p>
  </div>
 </div>
}
