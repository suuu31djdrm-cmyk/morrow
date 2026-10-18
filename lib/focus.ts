import {inWeek,type Theme,type Plan} from './planner.ts';
/** Relative planning estimate, not measured energy or an AI assessment. */
export function weeklyFocus(themes:Theme[],plans:Plan[]){
 const ordered=themes.slice().sort((a,b)=>a.priority-b.priority||a.title.localeCompare(b.title));
 const weights={high:3,medium:2,low:1};
 const total=ordered.reduce((sum,t)=>sum+t.hours*weights[t.energy],0);
 return ordered.map(t=>{
  const linked=plans.filter(p=>p.themeId===t.id&&inWeek(p.date,t.week));
  const planned=linked.reduce((sum,p)=>sum+p.hours,0);
  return {theme:t,share:total?t.hours*weights[t.energy]/total*100:0,planned,remaining:Math.max(0,t.hours-planned)};
 });
}
