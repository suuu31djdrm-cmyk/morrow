import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'Morrow — なりたい自分に、時間を。', description:'今週のテーマから、時間とエナジーに合う1週間を。', appleWebApp:{capable:true,title:'Morrow',statusBarStyle:'black-translucent'}, icons:{icon:'/icon.svg',apple:'/apple-touch-icon.png'} };
export const viewport: Viewport = {width:'device-width',initialScale:1,themeColor:'#0c1510'};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="ja"><body>{children}</body></html>}
