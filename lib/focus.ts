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

export function weeklyDigest(themes:Theme[],plans:Plan[]){
 const rows=weeklyFocus(themes,plans);
 const completed=(t:Theme)=>Math.min(t.hours,plans.filter(p=>p.themeId===t.id&&p.completed&&inWeek(p.date,t.week)).reduce((s,p)=>s+p.hours,0));
 return {target:themes.reduce((s,t)=>s+t.hours,0),scheduled:rows.reduce((s,r)=>s+Math.min(r.planned,r.theme.hours),0),completed:themes.reduce((s,t)=>s+completed(t),0),unplaced:rows.reduce((s,r)=>s+r.remaining,0),first:rows.find(r=>completed(r.theme)<r.theme.hours)?.theme.title||null};
}
