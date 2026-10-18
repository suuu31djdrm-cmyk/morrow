import {DEFAULT_AVAILABILITY,type PlannerState,type Plan,type Theme} from './planner';
export const STORAGE_KEY='morrow-planner-v1';
export function emptyState():PlannerState{return {plans:[],weekThemes:[],availability:{...DEFAULT_AVAILABILITY}}}
export function readState():PlannerState{
 const raw=localStorage.getItem(STORAGE_KEY)??localStorage.getItem('time-value-v2');if(!raw)return emptyState();const data=JSON.parse(raw);if(!data||!Array.isArray(data.plans))throw new Error('保存データを読み込めませんでした。元のデータは上書きしていません。');
 const plans:Plan[]=data.plans.filter((p:Plan)=>p&&typeof p.id==='string'&&typeof p.date==='string'&&Number.isFinite(p.hours)&&p.hours>0).map((p:Plan&{memo?:string})=>({...p,title:p.title||p.memo||'予定',time:p.time||'',energy:['high','medium','low'].includes(p.energy)?p.energy:'medium'}));
 const weekThemes:Theme[]=Array.isArray(data.weekThemes)?data.weekThemes.filter((t:Theme)=>t&&typeof t.id==='string'&&typeof t.week==='string'&&typeof t.title==='string'&&typeof t.activity==='string'&&Number.isFinite(t.hours)&&t.hours>0&&['high','medium','low'].includes(t.energy)):[];
 return {starterGoalsInitialized:data.starterGoalsInitialized===true,plans,weekThemes,availability:{...DEFAULT_AVAILABILITY,...data.availability}};
}
