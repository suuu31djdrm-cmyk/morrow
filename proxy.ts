import {NextRequest,NextResponse} from 'next/server';
export function proxy(request:NextRequest){
 const nonce=Buffer.from(crypto.randomUUID()).toString('base64');
 const development=process.env.NODE_ENV!=='production';
 const csp=["default-src 'self'",`script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://challenges.cloudflare.com${development?" 'unsafe-eval'":''}`,"style-src 'self' 'unsafe-inline'","img-src 'self' data:","font-src 'self'","connect-src 'self' https://challenges.cloudflare.com"+(development?' ws:':''),"frame-src https://challenges.cloudflare.com","object-src 'none'","base-uri 'self'","form-action 'self'","frame-ancestors 'none'",...(!development?['upgrade-insecure-requests']:[])].join('; ');
 const headers=new Headers(request.headers);headers.set('x-nonce',nonce);headers.set('Content-Security-Policy',csp);
 const response=NextResponse.next({request:{headers}});response.headers.set('Content-Security-Policy',csp);response.headers.set('X-Content-Type-Options','nosniff');response.headers.set('X-Frame-Options','DENY');response.headers.set('Referrer-Policy','no-referrer');response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');response.headers.set('Cache-Control','private, no-store');if(!development)response.headers.set('Strict-Transport-Security','max-age=31536000');return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']};
