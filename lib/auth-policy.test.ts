import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sameOrigin} from './auth-policy.ts';
import {plannerStateSchema} from './state-schema.ts';
test('mutation origin check rejects missing, lookalike and foreign origins',()=>{assert.ok(sameOrigin('https://morrow.example','https://morrow.example'));for(const origin of [null,'null','https://morrow.example.attacker.test','http://morrow.example','https://other.example'])assert.equal(sameOrigin(origin,'https://morrow.example'),false)});
const state={plans:[],weekThemes:[],availability:{weekdayStart:'19:00',weekdayEnd:'22:00',weekendStart:'09:00',weekendEnd:'18:00',peak:'morning'}};
test('stored state accepts planner data and rejects injected ownership or contact fields',()=>{assert.ok(plannerStateSchema.safeParse(state).success);for(const extra of [{user_id:'someone-else'},{email:'person@example.com'},{password:'not-stored'}])assert.equal(plannerStateSchema.safeParse({...state,...extra}).success,false)});
test('stored state rejects excessive hours, invalid times, and oversized titles',()=>{const plan={id:'x',date:'2026-10-17',time:'09:00',hours:1,title:'Read',cat:'side',energy:'low',completed:true};assert.ok(plannerStateSchema.safeParse({...state,plans:[plan]}).success);for(const change of [{hours:25},{time:'99:00'},{title:'x'.repeat(301)}])assert.equal(plannerStateSchema.safeParse({...state,plans:[{...plan,...change}]}).success,false)});
