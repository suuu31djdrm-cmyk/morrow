import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {authClient,authConfigured,appOrigin,checkOrigin,json} from '@/lib/auth-server';
export const dynamic='force-dynamic';
const identity=z.discriminatedUnion('method',[z.object({method:z.literal('email'),identifier:z.email().max(254)}),z.object({method:z.literal('sms'),identifier:z.string().regex(/^\+[1-9]\d{7,14}$/)})]);
const sendSchema=z.object({method:z.enum(['email','sms']),identifier:z.string().max(254),captchaToken:z.string().max(4096).optional()});
function enabled(method:string){return process.env[`AUTH_${method.toUpperCase()}_ENABLED`]==='true'}
export async function GET(request:NextRequest,{params}:{params:Promise<{action:string}>}){
 const {action}=await params;
 if(action==='config'){const ready=authConfigured();return json({ready,localDemo:!ready&&process.env.ALLOW_LOCAL_DEMO==='true',google:ready&&enabled('google'),line:ready&&enabled('line'),email:ready&&enabled('email'),sms:ready&&enabled('sms'),captchaSiteKey:process.env.TURNSTILE_SITE_KEY||null})}
 if(!authConfigured())return json({error:'authNotConfigured'},503);
 try{
  const client=await authClient();
  if(action==='session'){const {data,error}=await client.auth.getUser();return json({authenticated:!error&&!!data.user,userId:!error?data.user?.id:null})}
  if(action==='callback'){
   const code=request.nextUrl.searchParams.get('code');if(!code||code.length>2048)return NextResponse.redirect(appOrigin()+'/?auth_error=1');
   const {error}=await client.auth.exchangeCodeForSession(code);
   const response=NextResponse.redirect(appOrigin()+(error?'/?auth_error=1':'/'));response.headers.set('Cache-Control','private, no-store');response.headers.set('Referrer-Policy','no-referrer');return response;
  }
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
  if(action==='oauth'){
   const {provider}=z.object({provider:z.enum(['google','line'])}).parse(body);if(!enabled(provider))return json({error:'methodUnavailable'},503);
   const {data,error}=await client.auth.signInWithOAuth({provider:provider==='line'?'custom:line':'google',options:{redirectTo:appOrigin()+'/api/auth/callback',skipBrowserRedirect:true,scopes:provider==='line'?'openid':'openid email'}});
   if(error||!data.url)return json({error:'authFailed'},400);return json({url:data.url});
  }
  if(action==='otp'){
   const input=sendSchema.parse(body),person=identity.parse(input);if(!enabled(person.method))return json({error:'methodUnavailable'},503);
   // Supabase validates this token. Production OTP requires its CAPTCHA protection.
   if(process.env.NODE_ENV==='production'&&(!process.env.TURNSTILE_SITE_KEY||!input.captchaToken))return json({error:'captchaRequired'},400);
   const result=person.method==='email'?await client.auth.signInWithOtp({email:person.identifier,options:{captchaToken:input.captchaToken,shouldCreateUser:true}}):await client.auth.signInWithOtp({phone:person.identifier,options:{captchaToken:input.captchaToken,shouldCreateUser:true,channel:'sms'}});
   if(result.error)return json({error:'codeSendFailed'},400);return json({ok:true});
  }
  if(action==='verify'){
   const person=identity.parse(body),token=z.string().regex(/^\d{6,8}$/).parse(body.token);if(!enabled(person.method))return json({error:'methodUnavailable'},503);
   const result=person.method==='email'?await client.auth.verifyOtp({email:person.identifier,token,type:'email'}):await client.auth.verifyOtp({phone:person.identifier,token,type:'sms'});
   if(result.error)return json({error:'codeInvalid'},400);return json({ok:true});
  }
  return json({error:'notFound'},404);
 }catch{return json({error:'invalidRequest'},400)}
}
