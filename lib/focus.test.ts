import {test} from 'node:test';
import assert from 'node:assert/strict';
import {weeklyFocus} from './focus.ts';
import type {Theme,Plan} from './planner.ts';
const a:Theme={id:'a',week:'2026-10-19',title:'A',activity:'Work',hours:4,priority:2,energy:'high'};
const b:Theme={...a,id:'b',title:'B',hours:2,priority:1,energy:'low'};
test('priorities determine order; energy estimates use effort and requested hours',()=>{const rows=weeklyFocus([a,b],[]);assert.equal(rows[0].theme.id,'b');assert.ok(Math.abs(rows.reduce((s,r)=>s+r.share,0)-100)<1e-9);assert.equal(rows[1].share/rows[0].share,6)});
test('calendar coverage includes completed and edited events, excludes other weeks and goals',()=>{const p:Plan={id:'p',date:a.week,time:'10:00',hours:1,title:'A',cat:'side',energy:'high',themeId:'a',completed:true,origin:'manual'};const row=weeklyFocus([a],[p,{...p,id:'future',date:'2026-10-26'},{...p,id:'other',themeId:'b'}])[0];assert.equal(row.planned,1);assert.equal(row.remaining,3)});
test('empty goals and overplanned goals remain well-defined',()=>{assert.deepEqual(weeklyFocus([],[]),[]);const p:Plan={id:'p',date:a.week,time:'10:00',hours:6,title:'A',cat:'side',energy:'high',themeId:'a'};assert.equal(weeklyFocus([a],[p])[0].remaining,0)});
