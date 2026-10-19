import {dateAt,goalProgress,scheduleWeek,uid,type PlannerState,type Theme} from './planner.ts';
export function carryCandidates(state:PlannerState,week:string):Theme[]{
 const current=state.weekThemes.filter(t=>t.week===week);
 return state.weekThemes.filter(t=>t.week===dateAt(week,-7)&&goalProgress(t,state.plans).percent<100&&!current.some(c=>c.title===t.title&&c.activity===t.activity));
}
export function carryGoals(state:PlannerState,week:string,now:Date):PlannerState{
 const added=carryCandidates(state,week).map(t=>({...t,id:uid(),week,hours:Math.max(.5,t.hours-goalProgress(t,state.plans).completedHours)}));
 if(!added.length)return state;
 const result=scheduleWeek(added,state.plans,state.availability,week,{preserveExisting:true,now});
 return {...state,weekThemes:[...state.weekThemes,...added],plans:result.plans};
}
