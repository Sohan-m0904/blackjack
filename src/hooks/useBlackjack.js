import {useCallback,useMemo,useRef,useState} from 'react';
import {createShoe,decksRemaining} from '../utils/deck';
import {getTrueCount} from '../utils/counting';
import {dealerShouldHit,evaluateHand,settle} from '../utils/blackjack';

const emptyHand=(seat=0,bet=0)=>({cards:[],bet,done:false,split:false,result:null,seat,splitIndex:0});

export function useBlackjack(settings,balance,setBalance,onHand){
 const makeShoe=()=>createShoe(settings.decks,settings.countSystem);
 const initial=useRef(null); if(!initial.current) initial.current=makeShoe();
 const shoeRef=useRef(initial.current); const [shoe,setShoeState]=useState(initial.current);
 const [discard,setDiscard]=useState([]),[dealer,setDealer]=useState([]),[hands,setHands]=useState([emptyHand()]);
 const [active,setActive]=useState(0),[runningCount,setRunningCount]=useState(0),[status,setStatus]=useState('betting');
 const [seatCount,setSeatCountState]=useState(1),[seatBets,setSeatBets]=useState([25,25,25,25,25]);
 const [message,setMessage]=useState('Choose your spots, place training bets and deal.'),[handsSinceCheck,setHandsSinceCheck]=useState(0);
 const visible=useRef(new Set());
 const syncShoe=a=>{shoeRef.current=a;setShoeState(a)};
 const draw=n=>{const cards=shoeRef.current.slice(0,n);syncShoe(shoeRef.current.slice(n));return cards};
 const expose=useCallback(cards=>{let delta=0;for(const c of cards.filter(Boolean)){if(!visible.current.has(c.id)){visible.current.add(c.id);delta+=c.countValue}}if(delta)setRunningCount(v=>v+delta)},[]);
 const totalWager=useCallback(list=>list.reduce((sum,h)=>sum+h.bet,0),[]);
 const activeSeatBets=useMemo(()=>seatBets.slice(0,seatCount),[seatBets,seatCount]);
 const roundBet=useMemo(()=>activeSeatBets.reduce((sum,n)=>sum+Number(n||0),0),[activeSeatBets]);

 const setSeatCount=n=>{if(!['betting','complete'].includes(status))return;setSeatCountState(Math.max(1,Math.min(5,n)))};
 const setSeatBet=(seat,value)=>{if(!['betting','complete'].includes(status))return;const n=Math.max(1,Math.floor(Number(value)||0));setSeatBets(prev=>prev.map((x,i)=>i===seat?n:x))};
 const setBet=value=>{for(let i=0;i<seatCount;i++)setSeatBet(i,value)};
 const bet=seatBets[0];

 const reshuffle=useCallback(()=>{const s=createShoe(settings.decks,settings.countSystem);syncShoe(s);setDiscard([]);setDealer([]);setHands(Array.from({length:seatCount},(_,i)=>emptyHand(i,seatBets[i])));setActive(0);setRunningCount(0);visible.current=new Set();setStatus('betting');setMessage('Shuffle complete — count reset to zero.');},[settings.decks,settings.countSystem,seatCount,seatBets]);

 const finishDealer=useCallback((currentHands,currentDealer)=>{
   setStatus('dealer'); expose(currentDealer.slice(1)); let d=[...currentDealer];
   const live=currentHands.some(h=>!evaluateHand(h.cards).bust);
   if(live){while(dealerShouldHit(d,settings.hitSoft17)&&shoeRef.current.length){const [c]=draw(1);if(!c)break;d.push(c);expose([c]);}}
   setDealer(d);
   const settled=currentHands.map(h=>({...h,...settle(h.cards,d,h.bet,!h.split,settings.blackjackPayout)}));
   const delta=settled.reduce((s,h)=>s+h.delta,0);
   setHands(settled);setBalance(b=>Math.max(0,b+delta));setStatus('complete');setHandsSinceCheck(x=>x+1);
   const wins=settled.filter(h=>h.delta>0).length,losses=settled.filter(h=>h.delta<0).length,pushes=settled.length-wins-losses;
   const resultText=[wins&&`${wins} win${wins===1?'':'s'}`,losses&&`${losses} loss${losses===1?'':'es'}`,pushes&&`${pushes} push${pushes===1?'':'es'}`].filter(Boolean).join(' • ');
   setMessage(`${resultText}${delta?` • ${delta>0?'+':''}${delta} chips`:' • even round'}`);
   setDiscard(prev=>[...prev,...currentHands.flatMap(h=>h.cards),...d]);onHand?.(settled.length);
 },[expose,onHand,setBalance,settings.blackjackPayout,settings.hitSoft17]);

 const advance=useCallback((next,idx,currentDealer=dealer)=>{const nextIdx=next.findIndex((h,i)=>i>idx&&!h.done);if(nextIdx>=0){setActive(nextIdx);return;}if(next.every(h=>h.done))finishDealer(next,currentDealer);},[dealer,finishDealer]);

 const startHand=()=>{
   if(!['betting','complete'].includes(status))return;
   const selected=seatBets.slice(0,seatCount);
   if(selected.some(x=>x<=0)||roundBet>balance){setMessage(`Your ${seatCount} spot bet total (${roundBet}) must fit within your ${Math.round(balance)} chip balance.`);return;}
   const need=seatCount*2+2;if(shoeRef.current.length<Math.max(25,need+12)){reshuffle();return;}
   // Real table order: each player gets one, dealer up-card, each player gets second, dealer hole-card.
   const first=draw(seatCount);const [dealerUp]=draw(1);const second=draw(seatCount);const [dealerHole]=draw(1);
   const d=[dealerUp,dealerHole];
   const next=Array.from({length:seatCount},(_,i)=>{const cards=[first[i],second[i]];return {...emptyHand(i,selected[i]),cards,done:evaluateHand(cards).blackjack}});
   expose([...first,dealerUp,...second]);setDealer(d);setHands(next);setActive(next.findIndex(h=>!h.done));setStatus('playing');
   setMessage(seatCount===1?'Your move.':`Playing ${seatCount} spots • start with Spot 1.`);
   const dealerCanPeek=dealerUp?.rank==='A'||dealerUp?.blackjackValue===10;
   const dealerBJ=evaluateHand(d).blackjack;
   if(dealerCanPeek&&dealerBJ){setMessage('Dealer blackjack — hole card revealed.');setTimeout(()=>finishDealer(next,d),220);return;}
   if(next.every(h=>h.done)){setTimeout(()=>finishDealer(next,d),220);return;}
   const firstLive=next.findIndex(h=>!h.done);setActive(firstLive);
 };

 const hit=()=>{if(status!=='playing'||!hands[active]||hands[active].done)return;const [c]=draw(1);if(!c)return;expose([c]);const next=hands.map((h,i)=>i===active?{...h,cards:[...h.cards,c]}:h);const ev=evaluateHand(next[active].cards);if(ev.bust||ev.total===21)next[active]={...next[active],done:true};setHands(next);if(next[active].done)setTimeout(()=>advance(next,active),90)};
 const stand=()=>{if(status!=='playing')return;const next=hands.map((h,i)=>i===active?{...h,done:true}:h);setHands(next);setTimeout(()=>advance(next,active),90)};
 const committed=totalWager(hands);
 const double=()=>{const h=hands[active];if(status!=='playing'||!h||h.cards.length!==2||committed+h.bet>balance)return;const [c]=draw(1);if(!c)return;expose([c]);const next=hands.map((x,i)=>i===active?{...x,cards:[...x.cards,c],bet:x.bet*2,done:true}:x);setHands(next);setTimeout(()=>advance(next,active),90)};
 const split=()=>{
   const h=hands[active];
   const seatSplitCount=hands.filter(x=>x.seat===h?.seat).length-1;
   if(status!=='playing'||!h||!evaluateHand(h.cards).pair||seatSplitCount>=settings.maxSplits||committed+h.bet>balance)return;
   const [c1,c2]=draw(2);if(!c1||!c2)return;expose([c1,c2]);
   const lock=h.cards[0].rank==='A'&&settings.splitAcesOneCard;
   const existing=hands.filter(x=>x.seat===h.seat).length;
   const left={cards:[h.cards[0],c1],bet:h.bet,done:lock,split:true,result:null,seat:h.seat,splitIndex:h.splitIndex||0};
   const right={cards:[h.cards[1],c2],bet:h.bet,done:lock,split:true,result:null,seat:h.seat,splitIndex:existing};
   const next=[...hands.slice(0,active),left,right,...hands.slice(active+1)];setHands(next);
   if(lock)setTimeout(()=>advance(next,active-1),90);
 };
 const nextHand=()=>{const pen=discard.length/(settings.decks*52);if(pen>=settings.penetration||shoeRef.current.length<Math.max(25,seatCount*2+14)){reshuffle();return;}setDealer([]);setHands(Array.from({length:seatCount},(_,i)=>emptyHand(i,seatBets[i])));setActive(0);setStatus('betting');setMessage('Adjust spots or bets, then deal the next round.');};
 const current=hands[active];
 const seatSplitCount=current?hands.filter(x=>x.seat===current.seat).length-1:0;
 const can={hit:status==='playing'&&!!current&&!current.done,stand:status==='playing'&&!!current&&!current.done,double:status==='playing'&&current?.cards.length===2&&committed+(current?.bet||0)<=balance,split:status==='playing'&&!!current&&evaluateHand(current.cards).pair&&seatSplitCount<settings.maxSplits&&committed+current.bet<=balance};
 const trueCount=useMemo(()=>getTrueCount(runningCount,decksRemaining(shoe.length),settings.trueCountRounding),[runningCount,shoe.length,settings.trueCountRounding]);
 return {shoe,discard,dealer,hands,active,runningCount,trueCount,status,bet,setBet,seatCount,setSeatCount,seatBets,setSeatBet,roundBet,message,handsSinceCheck,setHandsSinceCheck,can,startHand,hit,stand,double,split,nextHand,reshuffle};
}
