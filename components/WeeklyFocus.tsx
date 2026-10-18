'use client';
import Image from 'next/image';
import {useLocale} from '@/lib/use-locale';
import {weeklyFocus} from '@/lib/focus';
import type {Plan,Theme} from '@/lib/planner';
export default function WeeklyFocus({themes,plans,onPriority,onRebalance,onEdit}:{themes:Theme[];plans:Plan[];onPriority:(id:string,priority:number)=>void;onRebalance:()=>void;onEdit:(theme:Theme)=>void}){
 const {tr}=useLocale();const rows=weeklyFocus(themes,plans);if(!rows.length)return null;
 const n=(v:number)=>Number(v.toFixed(1));
 return <section className="card weekly-focus" aria-labelledby="focus-title">
  <div className="focus-heading"><div><p className="eyebrow">MAKE ROOM FOR WHAT MATTERS</p><h2 id="focus-title">{tr('focusTitle')}</h2><p className="description">{tr('focusHint')}</p></div><Image src="/nature/blossom.png" alt="" width={48} height={60}/></div>
  <div className="focus-lead"><span>{tr('focusFirst')}</span><strong>{rows[0].theme.title}</strong></div>
  <div className="energy-allocation" aria-label={tr('energyAllocation')}>{rows.map(({theme,share},i)=><span key={theme.id} className={`focus-color-${i%4}`} style={{flexGrow:share}} title={`${theme.title}: ${Math.round(share)}%`}/>)}</div>
  <p className="focus-caption">{tr('energyEstimate')}</p>
  <div className="focus-goals">{rows.map(({theme,share,planned,remaining},i)=><article className="focus-goal" key={theme.id}>
   <div className="focus-goal-title"><span className={`focus-dot focus-color-${i%4}`} aria-hidden="true"/><button className="text-button" onClick={()=>onEdit(theme)} aria-label={tr('editFocus',{title:theme.title})}>{theme.title} ↗</button><strong>{Math.round(share)}<small>%</small></strong></div>
   <p className="focus-activity">{theme.activity}</p>
   <div className="priority-options" role="group" aria-label={tr('priorityFor',{title:theme.title})}>{[1,2,3].map(p=><button key={p} aria-pressed={theme.priority===p} onClick={()=>onPriority(theme.id,p)}>{tr(`focusPriority${p}`)}</button>)}</div>
   <div className="focus-coverage"><span>{tr('focusScheduled',{hours:n(planned),target:theme.hours})}</span><span>{tr(theme.energy==='high'?'focusHigh':theme.energy==='medium'?'focusMedium':'focusLow')}</span></div>
   <progress max={theme.hours} value={Math.min(planned,theme.hours)} aria-label={tr('focusScheduled',{hours:n(planned),target:theme.hours})}/>
   {remaining>0&&<p className="focus-gap">{tr('focusUnplaced',{hours:n(remaining)})}</p>}
  </article>)}</div>
  <div className="focus-action"><p>{tr('focusRebalanceHint')}</p><button className="primary" onClick={onRebalance}>{tr('focusRebalance')} ↗</button></div>
 </section>
}
