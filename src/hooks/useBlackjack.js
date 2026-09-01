import {useCallback,useMemo,useRef,useState} from 'react';
import {createShoe,decksRemaining} from '../utils/deck';
import {getTrueCount} from '../utils/counting';
import {dealerShouldHit,evaluateHand,settle} from '../utils/blackjack';

export function useBlackjack(settings,balance,setBalance,onHand){
 const makeShoe=()=>createShoe(settings.decks,settings.countSystem);
 const initial=useRef(null); if(!initial.current) initial.current=makeShoe();
 const shoeRef=useRef(initial.current); const [shoe,setShoeState]=useState(initial.current);
 const [discard,setDiscard]=useState([]),[dealer,setDealer]=useState([]),[hands,setHands]=useState([{cards:[],bet:0,done:false,split:false,result:null}]);
 const [active,setActive]=useState(0),[runningCount,setRunningCount]=useState(0),[status,setStatus]=useState('betting'),[bet,setBet]=useState(25),[message,setMessage]=useState('Place a training bet and deal.'),[handsSinceCheck,setHandsSinceCheck]=useState(0);
 const visible=useRef(new Set());
 const syncShoe=a=>{shoeRef.current=a;setShoeState(a)};
 const draw=n=>{const cards=shoeRef.current.slice(0,n);syncShoe(shoeRef.current.slice(n));return cards};
 const expose=useCallback(cards=>{let delta=0;for(const c of cards.filter(Boolean)){if(!visible.current.has(c.id)){visible.current.add(c.id);delta+=c.countValue}}if(delta)setRunningCount(v=>v+delta)},[]);
 const reshuffle=useCallback(()=>{const s=createShoe(settings.decks,settings.countSystem);syncShoe(s);setDiscard([]);setDealer([]);setHands([{cards:[],bet:0,done:false,split:false,result:null}]);setActive(0);setRunningCount(0);visible.current=new Set();setStatus('betting');setMessage('Shuffle complete — count reset to zero.');},[settings.decks,settings.countSystem]);
 const finishDealer=useCallback((currentHands,currentDealer)=>{
   setStatus('dealer'); expose(currentDealer.slice(1)); let d=[...currentDealer];
   const live=currentHands.some(h=>!evaluateHand(h.cards).bust);
   if(live){while(dealerShouldHit(d,settings.hitSoft17)&&shoeRef.current.length){const [c]=draw(1);if(!c)break;d.push(c);expose([c]);}}
   setDealer(d); const settled=currentHands.map(h=>({...h,...settle(h.cards,d,h.bet,!h.split,settings.blackjackPayout)})); const delta=settled.reduce((s,h)=>s+h.delta,0);
   setHands(settled);setBalance(b=>Math.max(0,b+delta));setStatus('complete');setHandsSinceCheck(x=>x+1);setMessage(delta>0?`Hand complete: +${delta} chips`:delta<0?`Hand complete: ${delta} chips`:'Hand complete: push');setDiscard(prev=>[...prev,...currentHands.flatMap(h=>h.cards),...d]);onHand?.();
 },[expose,onHand,setBalance,settings.blackjackPayout,settings.hitSoft17]);
 const advance=useCallback((next,idx,currentDealer=dealer)=>{const nextIdx=next.findIndex((h,i)=>i>idx&&!h.done);if(nextIdx>=0){setActive(nextIdx);return;}if(next.every(h=>h.done))finishDealer(next,currentDealer);},[dealer,finishDealer]);
 const startHand=()=>{if(!['betting','complete'].includes(status))return;if(bet<=0||bet>balance){setMessage('Choose a valid bet within your training balance.');return;}if(shoeRef.current.length<25){reshuffle();return;}const c=draw(4);const p=[c[0],c[2]],d=[c[1],c[3]];expose([p[0],d[0],p[1]]);setDealer(d);const ph={cards:p,bet,done:evaluateHand(p).blackjack,split:false,result:null};setHands([ph]);setActive(0);setStatus('playing');setMessage('Your move.');if(ph.done)setTimeout(()=>finishDealer([ph],d),150)};
 const hit=()=>{if(status!=='playing'||!hands[active]||hands[active].done)return;const [c]=draw(1);if(!c)return;expose([c]);const next=hands.map((h,i)=>i===active?{...h,cards:[...h.cards,c]}:h);const ev=evaluateHand(next[active].cards);if(ev.bust||ev.total===21)next[active]={...next[active],done:true};setHands(next);if(next[active].done)setTimeout(()=>advance(next,active),80)};
 const stand=()=>{if(status!=='playing')return;const next=hands.map((h,i)=>i===active?{...h,done:true}:h);setHands(next);setTimeout(()=>advance(next,active),80)};
 const double=()=>{const h=hands[active];if(status!=='playing'||!h||h.cards.length!==2||h.bet*2>balance)return;const [c]=draw(1);if(!c)return;expose([c]);const next=hands.map((x,i)=>i===active?{...x,cards:[...x.cards,c],bet:x.bet*2,done:true}:x);setHands(next);setTimeout(()=>advance(next,active),80)};
 const split=()=>{const h=hands[active];if(status!=='playing'||!h||!evaluateHand(h.cards).pair||hands.length>settings.maxSplits||h.bet*2>balance)return;const [c1,c2]=draw(2);if(!c1||!c2)return;expose([c1,c2]);const lock=h.cards[0].rank==='A'&&settings.splitAcesOneCard;const left={cards:[h.cards[0],c1],bet:h.bet,done:lock,split:true,result:null},right={cards:[h.cards[1],c2],bet:h.bet,done:lock,split:true,result:null};const next=[...hands.slice(0,active),left,right,...hands.slice(active+1)];setHands(next);if(lock)setTimeout(()=>advance(next,active-1),80)};
 const nextHand=()=>{const pen=discard.length/(settings.decks*52);if(pen>=settings.penetration||shoeRef.current.length<25){reshuffle();return;}setDealer([]);setHands([{cards:[],bet:0,done:false,split:false,result:null}]);setActive(0);setStatus('betting');setMessage('Ready for the next hand.');};
 const current=hands[active];const can={hit:status==='playing'&&!!current&&!current.done,stand:status==='playing'&&!!current&&!current.done,double:status==='playing'&&current?.cards.length===2&&current.bet*2<=balance,split:status==='playing'&&!!current&&evaluateHand(current.cards).pair&&hands.length<=settings.maxSplits&&current.bet*2<=balance};
 const trueCount=useMemo(()=>getTrueCount(runningCount,decksRemaining(shoe.length),settings.trueCountRounding),[runningCount,shoe.length,settings.trueCountRounding]);
 return {shoe,discard,dealer,hands,active,runningCount,trueCount,status,bet,setBet,message,handsSinceCheck,setHandsSinceCheck,can,startHand,hit,stand,double,split,nextHand,reshuffle};
}
