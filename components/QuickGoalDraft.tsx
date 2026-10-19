'use client';
import {useState} from 'react';
import {goalDraft,type GoalDraft} from '@/lib/goal-draft';
import {useLocale} from '@/lib/use-locale';
export default function QuickGoalDraft({onDraft}:{onDraft:(draft:GoalDraft)=>void}){
 const {locale,tr}=useLocale();const [text,setText]=useState(''),[message,setMessage]=useState(''),[error,setError]=useState(false);
 function prepare(){try{onDraft(goalDraft(text,locale));setError(false);setMessage(tr('draftReady'))}catch(e){setError(true);setMessage(tr((e as Error).message))}}
 return <section className="quick-draft" aria-label={tr('draftTitle')}><label>{tr('draftTitle')}<input value={text} maxLength={300} onChange={e=>setText(e.target.value)} placeholder={tr('draftExample')} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();prepare()}}}/></label><button type="button" onClick={prepare}>{tr('draftAction')} ↘</button><p className="footnote">{tr('draftHint')}</p>{message&&<p className={error?'error':'save-note'} role={error?'alert':'status'}>{message}</p>}</section>
}
