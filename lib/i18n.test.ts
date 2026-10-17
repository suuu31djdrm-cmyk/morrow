import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {detectLocale,translate,english} from './i18n.ts';
test('follows the preferred browser language, defaults to English',()=>{
 assert.equal(detectLocale(['ja-JP','en-US']),'ja');assert.equal(detectLocale(['en-US','ja']),'en');assert.equal(detectLocale(['JA']),'ja');assert.equal(detectLocale(['fr-FR']),'en');assert.equal(detectLocale([]),'en');
});
test('interpolates results without translating user content',()=>{
 assert.equal(translate('en','placed',{count:3}),'Added 3 events. Tap an event to adjust it.');assert.equal(translate('ja','remaining',{title:'自分のテーマ',hours:2}),'自分のテーマ：残り2h');assert.equal(translate('en','remaining',{title:'自分のテーマ',hours:2}),'自分のテーマ: 2h remaining');
});
test('all literal Japanese UI translation keys have English translations',()=>{
 const source=readFileSync(new URL('../components/Planner.tsx',import.meta.url),'utf8');for(const match of source.matchAll(/tr\(("(?:[^"\\]|\\.)*")/g)){const key=JSON.parse(match[1]);if(/[\u3040-\u30ff\u3400-\u9fff]/.test(key))assert.ok(english[key],`Missing English translation: ${key}`)}
});
