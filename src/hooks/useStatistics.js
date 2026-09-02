import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';

export const statisticsDefaults={questions:0,correct:0,totalAbsError:0,largestError:0,currentStreak:0,bestStreak:0,responseTotal:0,fastest:null,cardsCounted:0,handsPlayed:0,shoesCompleted:0,trueQuestions:0,trueCorrect:0,strategyQuestions:0,strategyCorrect:0,sessions:[],xp:0,practiceDates:[],mistakes:{}};

export function normalizeStatistics(value){
 const incoming=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 return {
  ...statisticsDefaults,
  ...incoming,
  sessions:Array.isArray(incoming.sessions)?incoming.sessions:[],
  practiceDates:Array.isArray(incoming.practiceDates)?incoming.practiceDates:[],
  mistakes:incoming.mistakes&&typeof incoming.mistakes==='object'&&!Array.isArray(incoming.mistakes)?incoming.mistakes:{},
  questions:Number(incoming.questions)||0,
  correct:Number(incoming.correct)||0,
  totalAbsError:Number(incoming.totalAbsError)||0,
  largestError:Number(incoming.largestError)||0,
  currentStreak:Number(incoming.currentStreak)||0,
  bestStreak:Number(incoming.bestStreak)||0,
  responseTotal:Number(incoming.responseTotal)||0,
  cardsCounted:Number(incoming.cardsCounted)||0,
  handsPlayed:Number(incoming.handsPlayed)||0,
  shoesCompleted:Number(incoming.shoesCompleted)||0,
  trueQuestions:Number(incoming.trueQuestions)||0,
  trueCorrect:Number(incoming.trueCorrect)||0,
  strategyQuestions:Number(incoming.strategyQuestions)||0,
  strategyCorrect:Number(incoming.strategyCorrect)||0,
  xp:Number(incoming.xp)||0,
  fastest:incoming.fastest==null?null:Number(incoming.fastest)||null
 };
}

export function useStatistics(){
 const [rawStats,setRawStats]=useLocalStorage('cc_stats',statisticsDefaults);
 const stats=normalizeStatistics(rawStats);
 const setStats=useCallback(update=>setRawStats(current=>normalizeStatistics(typeof update==='function'?update(normalizeStatistics(current)):update)),[setRawStats]);
 const recordAnswer=(correct,error,time,mode='count')=>setStats(s=>{const streak=correct?s.currentStreak+1:0;return {...s,questions:s.questions+1,correct:s.correct+(correct?1:0),totalAbsError:s.totalAbsError+Math.abs(error),largestError:Math.max(s.largestError,Math.abs(error)),currentStreak:streak,bestStreak:Math.max(s.bestStreak,streak),responseTotal:s.responseTotal+time,fastest:s.fastest==null?time:Math.min(s.fastest,time),xp:s.xp+(correct?10:2),mistakes:{...s.mistakes,[mode]:(s.mistakes[mode]||0)+(correct?0:1)}}});
 const recordCards=n=>setStats(s=>({...s,cardsCounted:s.cardsCounted+n,xp:s.xp+n}));
 const recordHand=(n=1)=>setStats(s=>({...s,handsPlayed:s.handsPlayed+n,xp:s.xp+(5*n)}));
 const recordTrue=(correct)=>setStats(s=>({...s,trueQuestions:s.trueQuestions+1,trueCorrect:s.trueCorrect+(correct?1:0),xp:s.xp+(correct?10:2)}));
 const recordStrategy=(correct)=>setStats(s=>({...s,strategyQuestions:s.strategyQuestions+1,strategyCorrect:s.strategyCorrect+(correct?1:0),xp:s.xp+(correct?8:1)}));
 const addSession=session=>setStats(s=>({...s,sessions:[session,...s.sessions].slice(0,100)}));
 const reset=()=>setStats(statisticsDefaults);
 return {stats,setStats,recordAnswer,recordCards,recordHand,recordTrue,recordStrategy,addSession,reset};
}
