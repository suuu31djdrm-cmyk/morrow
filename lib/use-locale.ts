'use client';
import {useEffect,useState} from 'react';
import {detectLocale,translate,type Locale} from './i18n';
export function useLocale(){
 const [locale,setLocale]=useState<Locale>('ja');
 useEffect(()=>{const update=()=>setLocale(detectLocale(navigator.languages?.length?navigator.languages:[navigator.language]));update();window.addEventListener('languagechange',update);return()=>window.removeEventListener('languagechange',update)},[]);
 useEffect(()=>{document.documentElement.lang=locale;document.title=locale==='ja'?'Morrow — なりたい自分に、時間を。':'Morrow — Make time for who you want to be.';document.querySelector('meta[name="description"]')?.setAttribute('content',locale==='ja'?'今週のテーマから、時間とエナジーに合う1週間を。':'Plan your week around your goals, time, and energy.')},[locale]);
 return {locale,tr:(key:string,values?:Record<string,string|number>)=>translate(locale,key,values)};
}
