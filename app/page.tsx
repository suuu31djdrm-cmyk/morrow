import {headers} from 'next/headers';
import Planner from '@/components/Planner';
import AuthGate from '@/components/AuthGate';
export const dynamic='force-dynamic';
export default async function Page(){const nonce=(await headers()).get('x-nonce')||undefined;return <AuthGate nonce={nonce}><Planner/></AuthGate>}
