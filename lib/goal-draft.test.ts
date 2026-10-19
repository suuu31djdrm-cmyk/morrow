import {test} from 'node:test';
import assert from 'node:assert/strict';
import {goalDraft} from './goal-draft.ts';
test('reads Japanese weekly time and priority, with editable activity template',()=>{const d=goalDraft('ポートフォリオを完成したい、週３時間、最優先','ja');assert.equal(d.title,'ポートフォリオを完成したい');assert.equal(d.hours,3);assert.equal(d.priority,1);assert.equal(d.energy,'high');assert.ok(d.activity.includes('事例'))});
test('understands minutes and explicit daily repetition, without confusing weekly time',()=>{assert.equal(goalDraft('散歩 毎日30分','ja').hours,3.5);assert.equal(goalDraft('散歩 週30分','ja').hours,.5);assert.equal(goalDraft('Read 2 hours per week, if time allows','en').priority,3)});
test('uses safe defaults for unknown goals and rejects invalid durations and empty goals',()=>{const d=goalDraft('陶芸を楽しむ','ja');assert.equal(d.activity,'陶芸を楽しむ');assert.equal(d.hours,3);assert.equal(d.energy,'medium');for(const text of ['', '学習 100h', '学習 0h', '週3時間'])assert.throws(()=>goalDraft(text,'ja'))});
