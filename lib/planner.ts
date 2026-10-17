export type Energy='high'|'medium'|'low';
export type Theme={id:string;week:string;title:string;activity:string;hours:number;priority:number;energy:Energy};
export type Plan={id:string;date:string;time:string;hours:number;title:string;cat:string;energy:Energy;themeId?:string;origin?:'suggestion'|'manual'};
export type Availability={weekdayStart:string;weekdayEnd:string;weekendStart:string;weekendEnd:string;peak:'morning'|'afternoon'|'evening'};
export type PlannerState={plans:Plan[];weekThemes:Theme[];availability:Availability};
export const DEFAULT_AVAILABILITY:Availability={weekdayStart:'19:00',weekdayEnd:'22:00',weekendStart:'09:00',weekendEnd:'18:00',peak:'morning'};
export const CATEGORIES=[{id:'work',label:'仕事',color:'#a4b8f4'},{id:'side',label:'学習・制作',color:'#8ad9b3'},{id:'sleep',label:'睡眠・休息',color:'#b3c9d9'},{id:'life',label:'生活',color:'#e5c08b'},{id:'social',label:'人との時間',color:'#efb2c6'},{id:'exercise',label:'運動・趣味',color:'#c8b2ee'},{id:'free',label:'余白',color:'#b8ceba'}];
export const ENERGY:Record<Energy,string>={high:'集中',medium:'ふつう',low:'軽め'};
export const DAYS=['月','火','水','木','金','土','日'];
export function dateKey(d:Date){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
export function weekStart(now:Date,offset=0){const d=new Date(now);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7+offset*7);return dateKey(d)}
export function dateAt(week:string,day:number){const d=new Date(week+'T12:00:00');d.setDate(d.getDate()+day);return dateKey(d)}
export function inWeek(date:string,week:string){return date>=week&&date<=dateAt(week,6)}
export function minutes(t:string){const [h,m]=t.split(':').map(Number);return h*60+m}
export function clock(m:number){return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
export function uid(){return globalThis.crypto.randomUUID()}
export function sumHours(plans:Plan[]){return plans.reduce((s,p)=>s+p.hours,0)}
export function availabilityError(a:Availability){for(const kind of ['weekday','weekend'] as const){const st=a[`${kind}Start`],en=a[`${kind}End`];if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(st)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(en)||minutes(st)>=minutes(en))return '使える時間帯の終了は、開始より後に設定してください。'}return ''}
export function validatePlan(plan:Plan,others:Plan[]){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(plan.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(plan.time))return '日付と開始時刻を確認してください。';
 const st=minutes(plan.time),end=st+plan.hours*60;
 if(!plan.title.trim())return '予定名を入力してください。';
 if(!Number.isFinite(plan.hours)||plan.hours<=0||end>1440)return '終了時刻は開始より後、24:00までに設定してください。';
 const same=others.filter(p=>p.id!==plan.id&&p.date===plan.date);
 if(same.some(p=>p.time&&st<minutes(p.time)+p.hours*60&&end>minutes(p.time)))return 'ほかの予定と時間が重なっています。';
 if(sumHours(same)+plan.hours>24+1e-8)return '1日の予定は合計24時間以内にしてください。';return '';
}
export function scheduleWeek(themes:Theme[],plans:Plan[],a:Availability,week:string){
 const error=availabilityError(a);if(error)throw new Error(error);
 const kept=plans.filter(p=>!inWeek(p.date,week)||p.origin!=='suggestion');const generated:Plan[]=[],unplaced:{title:string;hours:number}[]=[];
 const peak={morning:[360,720],afternoon:[720,1080],evening:[1080,1440]}[a.peak];
 for(const theme of themes.filter(t=>t.week===week).slice().sort((a,b)=>a.priority-b.priority)){
 let remain=Math.max(0,Math.round((theme.hours-sumHours(kept.filter(p=>inWeek(p.date,week)&&p.themeId===theme.id)))*60));const usedDays:Record<number,number>={};
 while(remain>=30){const choices:{date:string;day:number;start:number;length:number;score:number}[]=[];
 for(let day=0;day<7;day++){const date=dateAt(week,day),kind=day<5?'weekday':'weekend',start=minutes(a[`${kind}Start`]),end=minutes(a[`${kind}End`]);const busy=[...kept,...generated].filter(p=>p.date===date);const allocated=generated.filter(p=>p.date===date).reduce((s,p)=>s+p.hours*60,0);const manualOccupied=kept.filter(p=>p.date===date&&p.time).reduce((s,p)=>s+Math.max(0,Math.min(end,minutes(p.time)+p.hours*60)-Math.max(start,minutes(p.time))),0);const budget=Math.floor(Math.max(0,end-start-manualOccupied)*.7/30)*30;
 for(let m=Math.ceil(start/30)*30;m+30<=end;m+=30){let length=Math.floor(Math.min(remain,theme.energy==='high'?60:90,budget-allocated)/30)*30;while(length>=30&&busy.some(p=>p.time&&m<minutes(p.time)+p.hours*60&&m+length>minutes(p.time)))length-=30;if(length<30||m+length>end||sumHours(busy)+length/60>24)continue;const isPeak=m>=peak[0]&&m+length<=peak[1];if(theme.energy==='high'&&!isPeak)continue;const score=(usedDays[day]||0)*500+allocated*2+day*3+(theme.energy==='low'&&isPeak?90:0)+(theme.energy==='medium'&&!isPeak?20:0);choices.push({date,day,start:m,length,score});}}
 if(!choices.length)break;choices.sort((a,b)=>a.score-b.score||a.start-b.start);const c=choices[0];generated.push({id:uid(),date:c.date,time:clock(c.start),hours:c.length/60,title:theme.activity,cat:'side',energy:theme.energy,themeId:theme.id,origin:'suggestion'});usedDays[c.day]=(usedDays[c.day]||0)+1;remain-=c.length;
 }if(remain>0)unplaced.push({title:theme.title,hours:remain/60});
 }return {plans:[...kept,...generated],count:generated.length,unplaced};
}
export function eventLayout(plans:Plan[]){const sorted=plans.filter(p=>p.time).slice().sort((a,b)=>minutes(a.time)-minutes(b.time));const groups:{items:Plan[];end:number}[]=[];for(const p of sorted){const start=minutes(p.time),end=start+p.hours*60;let g=groups.at(-1);if(!g||start>=g.end){g={items:[],end};groups.push(g)}g.items.push(p);g.end=Math.max(g.end,end)}return groups.flatMap(g=>{const ends:number[]=[];const items=g.items.map(p=>{let lane=ends.findIndex(end=>end<=minutes(p.time));if(lane<0)lane=ends.length;ends[lane]=minutes(p.time)+p.hours*60;return {plan:p,lane}});return items.map(item=>({...item,lanes:ends.length}))})}
