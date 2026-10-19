import {test} from 'node:test';
import assert from 'node:assert/strict';
import {carryCandidates,carryGoals} from './carry-goals.ts';
import {DEFAULT_AVAILABILITY,type PlannerState} from './planner.ts';
const state:PlannerState={starterGoalsInitialized:true,availability:{...DEFAULT_AVAILABILITY},weekThemes:[{id:'old',week:'2026-10-12',title:'Goal',activity:'Work',hours:3,priority:1,energy:'medium'}],plans:[{id:'done',date:'2026-10-13',time:'19:00',hours:1,title:'Work',cat:'side',energy:'medium',themeId:'old',completed:true}]};
const week='2026-10-19',now=new Date('2026-10-19T12:00:00');
test('new week surfaces saved unfinished goals and preserves past data when carrying',()=>{assert.equal(carryCandidates(state,week).length,1);const result=carryGoals(state,week,now);assert.deepEqual(result.weekThemes[0],state.weekThemes[0]);assert.deepEqual(result.plans[0],state.plans[0]);assert.equal(result.weekThemes[1].hours,2);assert.equal(result.weekThemes[1].week,week);assert.equal(result.plans.filter(p=>p.themeId===result.weekThemes[1].id).reduce((s,p)=>s+p.hours,0),2);assert.equal(carryCandidates(result,week).length,0);assert.equal(carryGoals(result,week,now),result)});
test('completed goals do not reappear and unrelated weeks are not carried',()=>{const done={...state,plans:[{...state.plans[0],hours:3}]};assert.equal(carryCandidates(done,week).length,0);assert.equal(carryCandidates(state,'2026-10-26').length,0)});
