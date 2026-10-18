import {scheduleWeek,weekStart,uid,type PlannerState,type Theme} from './planner.ts';
/** Generic editable starter goals only; never include account or company data. */
export function withStarterGoals(state:PlannerState,locale:'ja'|'en',now=new Date()):PlannerState{
 if(state.starterGoalsInitialized)return state;
 if(state.plans.length||state.weekThemes.length)return {...state,starterGoalsInitialized:true};
 const text=locale==='ja'?[
  ['副業を完了する','残っている作業を整理し、仕上げと納品確認を進める'],
  ['他案件を探す','候補案件を比較し、応募・問い合わせを進める'],
  ['ポートフォリオを完成する','掲載する事例を選び、文章と画面を仕上げる']
 ]:[
  ['Finish freelance work','Review remaining work, finish deliverables, and check handoff'],
  ['Find new projects','Compare opportunities and send applications or inquiries'],
  ['Complete my portfolio','Choose case studies and polish the writing and visuals']
 ];
 const week=weekStart(now);
 const themes:Theme[]=text.map(([title,activity],i)=>({id:uid(),week,title,activity,hours:[3,2,3][i],priority:i+1,energy:i===1?'medium':'high'}));
 // Invalid availability must not prevent goals from being created; show missing time in Home.
 let plans=state.plans;
 try{plans=scheduleWeek(themes,plans,state.availability,week,{now}).plans}catch{}
 return {...state,weekThemes:themes,plans,starterGoalsInitialized:true};
}
