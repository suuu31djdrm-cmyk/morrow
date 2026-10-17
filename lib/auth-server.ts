import 'server-only';
import {sameOrigin} from './auth-policy';
import {createServerClient} from '@supabase/ssr';
import {cookies} from 'next/headers';
import {NextResponse,type NextRequest} from 'next/server';

export function authConfigured(){return !!(process.env.SUPABASE_URL&&process.env.SUPABASE_PUBLISHABLE_KEY&&process.env.AUTH_APP_ORIGIN)}
export function appOrigin(){const url=new URL(process.env.AUTH_APP_ORIGIN||'http://localhost:3000');if(process.env.NODE_ENV==='production'&&url.protocol!=='https:')throw new Error('HTTPS_REQUIRED');return url.origin}
export function checkOrigin(request:NextRequest){return sameOrigin(request.headers.get('origin'),appOrigin())}
export function json(body:unknown,status=200){return NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store','Pragma':'no-cache','X-Content-Type-Options':'nosniff'}})}
export async function authClient(){
 if(!authConfigured())throw new Error('AUTH_NOT_CONFIGURED');
 const jar=await cookies();
 return createServerClient(process.env.SUPABASE_URL!,process.env.SUPABASE_PUBLISHABLE_KEY!,{
  cookieOptions:{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:60*60*24*7},
  cookies:{getAll(){return jar.getAll()},setAll(values){for(const {name,value,options} of values)jar.set(name,value,{...options,httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'})}}
 });
}
