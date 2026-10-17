import {NextRequest} from 'next/server';
import {sendCodeSchema,verifyCodeSchema} from '@/lib/auth-input';
import {authClient,authConfigured,checkOrigin,json} from '@/lib/auth-server';
export const dynamic='force-dynamic';
function enabled(){return process.env.AUTH_EMAIL_ENABLED==='true'}
export async function GET(request:NextRequest,{params}:{params:Promise<{action:string}>}){
 const {action}=await params;
 if(action==='config'){const ready=authConfigured();return json({ready,localDemo:!ready&&process.env.ALLOW_LOCAL_DEMO==='true',email:ready&&enabled(),captchaSiteKey:process.env.TURNSTILE_SITE_KEY||null})}
 if(!authConfigured())return json({error:'authNotConfigured'},503);
 try{
  const client=await authClient();
  if(action==='session'){const {data,error}=await client.auth.getUser();return json({authenticated:!error&&!!data.user,userId:!error?data.user?.id:null})}
 }catch{return json({error:'authFailed'},400)}return json({error:'notFound'},404);
}
export async function POST(request:NextRequest,{params}:{params:Promise<{action:string}>}){
 if(!authConfigured())return json({error:'authNotConfigured'},503);
 if(!checkOrigin(request))return json({error:'forbidden'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'invalidRequest'},415);
 if(Number(request.headers.get('content-length')||0)>8192)return json({error:'invalidRequest'},413);
 try{
  const {action}=await params,client=await authClient();
  if(action==='logout'){const {error}=await client.auth.signOut({scope:'local'});if(error)return json({error:'authFailed'},400);return json({ok:true})}
  const raw=await request.text();if(raw.length>8192)return json({error:'invalidRequest'},413);const body=JSON.parse(raw);
  if(action==='otp'){
   const input=sendCodeSchema.parse(body);if(!enabled())return json({error:'methodUnavailable'},503);
   // Supabase validates this token. Production OTP requires its CAPTCHA protection.
   if(process.env.NODE_ENV==='production'&&(!process.env.TURNSTILE_SITE_KEY||!input.captchaToken))return json({error:'captchaRequired'},400);
   const result=await client.auth.signInWithOtp({email:input.identifier,options:{captchaToken:input.captchaToken,shouldCreateUser:input.intent==='signup'}});
   if(result.error)return json({error:'codeSendFailed'},400);return json({ok:true});
  }
  if(action==='verify'){
   const input=verifyCodeSchema.parse(body);if(!enabled())return json({error:'methodUnavailable'},503);
   const result=await client.auth.verifyOtp({email:input.identifier,token:input.token,type:'email'});
   if(result.error)return json({error:'codeInvalid'},400);return json({ok:true});
  }
  return json({error:'notFound'},404);
 }catch{return json({error:'invalidRequest'},400)}
}
