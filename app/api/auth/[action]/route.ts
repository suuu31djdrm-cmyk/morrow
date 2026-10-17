import {NextRequest,NextResponse} from 'next/server';
import {loginSchema,signupSchema} from '@/lib/auth-input';
import {authClient,authConfigured,appOrigin,checkOrigin,json} from '@/lib/auth-server';
export const dynamic='force-dynamic';
function enabled(){return process.env.AUTH_EMAIL_ENABLED==='true'}
export async function GET(request:NextRequest,{params}:{params:Promise<{action:string}>}){
 const {action}=await params;
 if(action==='config'){const ready=authConfigured();return json({ready,localDemo:!ready&&process.env.ALLOW_LOCAL_DEMO==='true',email:ready&&enabled(),captchaSiteKey:process.env.TURNSTILE_SITE_KEY||null})}
 if(!authConfigured())return json({error:'authNotConfigured'},503);
 try{
  const client=await authClient();
  if(action==='callback'){
   const code=request.nextUrl.searchParams.get('code');
   const {error}=code&&code.length<=2048?await client.auth.exchangeCodeForSession(code):{error:true};
   const response=NextResponse.redirect(appOrigin()+(error?'/?auth_error=1':'/'));response.headers.set('Cache-Control','private, no-store');response.headers.set('Referrer-Policy','no-referrer');return response;
  }
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
  if(action==='login'||action==='signup'){
   const input=(action==='signup'?signupSchema:loginSchema).parse(body);if(!enabled())return json({error:'methodUnavailable'},503);
   if(process.env.TURNSTILE_SITE_KEY&&!input.captchaToken)return json({error:'captchaRequired'},400);
   if(action==='login'){
    const {data,error}=await client.auth.signInWithPassword({email:input.identifier,password:input.password,options:{captchaToken:input.captchaToken}});
    if(error||!data.session)return json({error:'credentialsInvalid'},400);
    return json({ok:true,authenticated:true});
   }
   const {data,error}=await client.auth.signUp({email:input.identifier,password:input.password,options:{captchaToken:input.captchaToken,emailRedirectTo:appOrigin()+'/api/auth/callback'}});
   if(error)return json({error:'signupFailed'},400);
   return json({ok:true,authenticated:!!data.session});
  }
  return json({error:'notFound'},404);
 }catch{return json({error:'invalidRequest'},400)}
}
