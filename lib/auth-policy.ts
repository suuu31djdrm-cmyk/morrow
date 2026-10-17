export function sameOrigin(origin:string|null,expected:string){try{return !!origin&&origin===new URL(expected).origin}catch{return false}}
