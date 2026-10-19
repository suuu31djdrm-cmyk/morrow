import type {Energy} from './planner.ts';
export type GoalDraft={title:string;activity:string;hours:number;priority:number;energy:Energy};
/** Small, deterministic rules. No model, network request or inferred private context. */
export function goalDraft(input:string,locale:'ja'|'en'):GoalDraft{
 const text=input.normalize('NFKC').trim();if(!text)throw new Error('draftEmpty');
 const duration=/(\d+(?:\.\d+)?)\s*(時間|hours?\b|hrs?\b|h\b|分|minutes?\b|mins?\b)/i;
 const match=text.match(duration);
 let hours=match?Number(match[1])*(/分|min/i.test(match[2])?1/60:1):3;
 if(match&&/毎日|\bdaily\b|\bper day\b/i.test(text))hours*=7;
 hours=Math.round(hours*2)/2;if(hours<.5||hours>40)throw new Error('draftHoursInvalid');
 const priority=/最優先|最重要|\btop priority\b|\burgent\b/i.test(text)?1:/余裕があれば|\bif time allows\b/i.test(text)?3:2;
 const cleaned=text.replace(duration,'').replace(/毎日|今週|週に?|最優先|最重要|余裕があれば|(?:top|high) priority|if time allows|urgent|per week|weekly|per day|daily/gi,'').replace(/^[\s、,・:：;；—-]+|[\s、,・:：;；—-]+$/g,'').replace(/\s{2,}/g,' ').trim();
 if(!cleaned||cleaned.length>120)throw new Error('draftTitleInvalid');
 const categories=[
  {match:/ポートフォリオ|portfolio/i,ja:'事例を選び、文章と画面を仕上げて確認する',en:'Choose case studies, polish the writing and visuals, and review',energy:'high'},
  {match:/案件|応募|project search|find.*projects|applications?/i,ja:'条件を整理し、候補の比較・応募を進める',en:'Clarify criteria, compare opportunities, and prepare applications',energy:'medium'},
  {match:/副業|制作|開発|デザイン|freelance|design|develop/i,ja:'残りの作業を整理し、制作と仕上げを進める',en:'List the remaining tasks and work through production and finishing',energy:'high'},
  {match:/英語|勉強|学習|読書|english|study|learn|read/i,ja:'取り組む内容をひとつ選び、練習と振り返りをする',en:'Choose one topic, practise, and review what you learned',energy:'high'},
  {match:/運動|散歩|ランニング|ジム|exercise|walk|run|gym/i,ja:'散歩や無理のない運動に取り組む',en:'Make time for a walk or comfortable exercise',energy:'low'},
  {match:/休息|休む|リラックス|rest|relax/i,ja:'予定を詰めずに、ゆっくり休む時間をつくる',en:'Leave some time open and give yourself a restful break',energy:'low'}
 ] as const;
 const category=categories.find(c=>c.match.test(cleaned));
 const energy:Energy=/軽め|低エナジー|low energy|light effort/i.test(text)?'low':/集中|高エナジー|high energy|deep work/i.test(text)?'high':category?.energy||'medium';
 return {title:cleaned,activity:category?(locale==='ja'?category.ja:category.en):cleaned,hours,priority,energy};
}
