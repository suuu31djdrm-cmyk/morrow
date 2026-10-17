import {type NextRequest} from 'next/server';
import {authClient,authConfigured,checkOrigin,json} from '@/lib/auth-server';
import {plannerStateSchema} from '@/lib/state-schema';
export const dynamic='force-dynamic';
export async function GET(){
 if(!authConfigured())return json({error:'authNotConfigured'},503);
 try{const client=await authClient(),{data:{user},error}=await client.auth.getUser();if(error||!user)return json({error:'unauthorized'},401);const result=await client.from('planner_states').select('state').eq('user_id',user.id).maybeSingle();if(result.error)return json({error:'dataLoadFailed'},500);return json({state:result.data?.state||null})}catch{return json({error:'dataLoadFailed'},500)}
}
export async function PUT(request:NextRequest){
 if(!authConfigured())return json({error:'authNotConfigured'},503);if(!checkOrigin(request))return json({error:'forbidden'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'invalidRequest'},415);
 if(Number(request.headers.get('content-length')||0)>2_000_000)return json({error:'invalidRequest'},413);
 try{const client=await authClient(),{data:{user},error}=await client.auth.getUser();if(error||!user)return json({error:'unauthorized'},401);const raw=await request.text();if(raw.length>2_000_000)return json({error:'invalidRequest'},413);const parsed=plannerStateSchema.safeParse(JSON.parse(raw));if(!parsed.success)return json({error:'invalidRequest'},400);
 const result=await client.from('planner_states').upsert({user_id:user.id,state:parsed.data,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(result.error)return json({error:'dataSaveFailed'},500);return json({ok:true});
 }catch{return json({error:'dataSaveFailed'},500)}
}
