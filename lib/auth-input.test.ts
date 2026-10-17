import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loginSchema,signupSchema} from './auth-input.ts';
test('signup enforces length and bcrypt byte limit without changing the password',()=>{const input={identifier:'person@example.com',password:'correct horse battery staple'};assert.equal(signupSchema.parse(input).password,input.password);for(const password of ['short','a'.repeat(73),'あ'.repeat(25)])assert.equal(signupSchema.safeParse({...input,password}).success,false);assert.ok(signupSchema.safeParse({...input,password:'あ'.repeat(24)}).success)});
test('login accepts an existing shorter password but rejects missing credentials or injected ownership',()=>{const input={identifier:'person@example.com',password:'old-password'};assert.ok(loginSchema.safeParse(input).success);for(const change of [{password:''},{identifier:'not-email'},{user_id:'someone-else'},{provider:'google'}])assert.equal(loginSchema.safeParse({...input,...change}).success,false)});
