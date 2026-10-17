import {test} from 'node:test';
import assert from 'node:assert/strict';
import {scheduleWeek,scheduleTheme,validatePlan,DEFAULT_AVAILABILITY,minutes,type Theme,type Plan} from './planner.ts';
const week='2026-10-12';
const theme:Theme={id:'a',week,title:'集中する',activity:'制作',hours:3,priority:1,energy:'high'};
test('concentrated work fits peak time, requested hours, no overlapping events',()=>{const {plans}=scheduleWeek([theme],[],DEFAULT_AVAILABILITY,week);assert.equal(plans.reduce((s,p)=>s+p.hours,0),3);for(const p of plans){assert.ok(minutes(p.time)>=360&&minutes(p.time)+p.hours*60<=720);assert.equal(validatePlan(p,plans),'')}});
test('manual changes survive regeneration and count toward theme target',()=>{const manual:Plan={id:'manual',date:week,time:'19:00',hours:1,title:'edited',cat:'side',energy:'high',themeId:'a',origin:'manual'};const old:Plan={...manual,id:'old',date:'2026-10-17',time:'09:00',origin:'suggestion'};const result=scheduleWeek([theme],[manual,old],DEFAULT_AVAILABILITY,week);assert.ok(result.plans.includes(manual));assert.ok(!result.plans.some(p=>p.id==='old'));assert.equal(result.plans.reduce((s,p)=>s+p.hours,0),3)});
test('unavailable peak hours yield an honest unplaced result',()=>{const result=scheduleWeek([theme],[],{...DEFAULT_AVAILABILITY,weekendStart:'19:00',weekendEnd:'22:00'},week);assert.equal(result.count,0);assert.equal(result.unplaced[0].hours,3)});
test('retains other weeks and leaves at least 30 percent of free time unallocated',()=>{const other:Plan={id:'other',date:'2026-11-02',time:'09:00',hours:1,title:'future',cat:'side',energy:'low'};const result=scheduleWeek([{...theme,hours:40,energy:'low'}],[other],DEFAULT_AVAILABILITY,week);assert.ok(result.plans.includes(other));for(let day=12;day<=18;day++){const h=result.plans.filter(p=>p.date===`2026-10-${day}`).reduce((s,p)=>s+p.hours,0);assert.ok(h<=(day<17?3:9)*.7)}});
test('rejects overlap, accepts midnight ending and adjacent events',()=>{const p:Plan={id:'1',date:week,time:'23:00',hours:1,title:'read',cat:'side',energy:'low'};assert.equal(validatePlan(p,[]),'');assert.notEqual(validatePlan({...p,id:'2'},[p]),'');assert.equal(validatePlan({...p,id:'3',time:'22:00'},[p]),'');assert.notEqual(validatePlan({...p,hours:2},[]),'')});
test('adding a theme preserves all other events and schedules only remaining future slots',()=>{
 const existing:Plan={id:'existing',date:'2026-10-17',time:'15:00',hours:1,title:'Other goal',cat:'side',energy:'low',themeId:'other',origin:'suggestion'};
 const result=scheduleTheme({...theme,energy:'low',hours:2},[existing],DEFAULT_AVAILABILITY,new Date('2026-10-17T14:12:00'));
 assert.ok(result.plans.includes(existing));assert.equal(result.count>0,true);
 for(const p of result.plans.filter(p=>p.id!==existing.id)){assert.ok(p.date>='2026-10-17');if(p.date==='2026-10-17')assert.ok(minutes(p.time)>=14*60+12);assert.equal(validatePlan(p,result.plans),'')}
});
test('choosing next week schedules next week and keeps the current week unchanged',()=>{
 const fixed:Plan={id:'fixed',date:week,time:'19:00',hours:1,title:'Existing',cat:'work',energy:'medium',origin:'manual'};
 const result=scheduleTheme({...theme,week:'2026-10-19'},[fixed],DEFAULT_AVAILABILITY,new Date('2026-10-17T14:12:00'));
 assert.ok(result.plans.includes(fixed));assert.equal(result.plans.filter(p=>p.id!==fixed.id).reduce((s,p)=>s+p.hours,0),3);assert.ok(result.plans.filter(p=>p.id!==fixed.id).every(p=>p.date>='2026-10-19'&&p.date<='2026-10-25'));
});
test('editing a theme replaces its suggestions only; manual edits still count toward target',()=>{
 const own:Plan={id:'old',date:'2026-10-17',time:'09:00',hours:1,title:'Old',cat:'side',energy:'high',themeId:'a',origin:'suggestion'};
 const manual:Plan={...own,id:'manual',date:'2026-10-18',time:'09:00',origin:'manual'};
 const result=scheduleTheme(theme,[own,manual],DEFAULT_AVAILABILITY,new Date('2026-10-17T14:00:00'));
 assert.ok(!result.plans.some(p=>p.id==='old'));assert.ok(result.plans.includes(manual));assert.equal(result.plans.reduce((s,p)=>s+p.hours,0),3);
});
test('no remaining time saves no invalid events and reports the full unscheduled goal',()=>{
 const result=scheduleTheme(theme,[],DEFAULT_AVAILABILITY,new Date('2026-10-19T01:00:00'));assert.equal(result.count,0);assert.equal(result.unplaced[0].hours,3);
});
