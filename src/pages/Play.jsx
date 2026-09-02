import {useEffect,useRef,useState} from 'react';
import {Eye,EyeOff,Info,RotateCcw,Volume2} from 'lucide-react';
import {evaluateHand} from '../utils/blackjack';
import {decksRemaining} from '../utils/deck';
import PlayingCard from '../components/PlayingCard';
import CountInput from '../components/CountInput';
import {useBlackjack} from '../hooks/useBlackjack';

const CHIPS=[5,10,25,50,100,250];
export default function Play({settings,balance,setBalance,statsApi}){
 const game=useBlackjack(settings,balance,setBalance,statsApi.recordHand);
 const [chip,setChip]=useState(25),[showCheck,setShowCheck]=useState(false),[showInfo,setShowInfo]=useState(false);
 const questionStart=useRef(Date.now());
 const visibleCount=settings.difficulty==='beginner'||settings.showRunningCount;
 const editable=game.status==='betting'||game.status==='complete';
 const active=game.hands[game.active],activeEval=active?evaluateHand(active.cards):null;
 const dealerEval=evaluateHand(game.dealer),pen=Math.round(game.discard.length/(settings.decks*52)*100),decks=decksRemaining(game.shoe.length);

 useEffect(()=>{if(game.status==='complete'){const should=settings.difficulty==='intermediate'||(settings.difficulty==='advanced'&&game.handsSinceCheck>=2+Math.floor(Math.random()*5));if(should){setShowCheck(true);questionStart.current=Date.now();}}},[game.status,game.handsSinceCheck,settings.difficulty]);
 const answer=(n,ok)=>{statsApi.recordAnswer(ok,n-game.runningCount,Date.now()-questionStart.current,'play');setTimeout(()=>{setShowCheck(false);game.setHandsSinceCheck(0)},450)};
 const addChip=seat=>game.setSeatBet(seat,Math.min(500,(game.seatBets[seat]||0)+chip));
 const clearBets=()=>{for(let i=0;i<game.seatCount;i++)game.setSeatBet(i,5)};
 const applyAll=()=>game.setBet(chip);
 const roundTitle=game.status==='betting'?'PLACE YOUR BETS':game.status==='playing'?`SPOT ${active?.seat+1} · YOUR MOVE`:game.status==='dealer'?'DEALER PLAYING':'ROUND COMPLETE';

 return <div className="page smooth-play">
  <section className="smooth-shell">
   <div className="smooth-head">
    <button className="icon-ghost" onClick={()=>setShowInfo(v=>!v)}><Info size={17}/></button>
    <div className="smooth-brand"><b>BLACKJACK</b><span>{settings.decks} DECK · PAYS 3:2</span></div>
    <button className="icon-ghost"><Volume2 size={17}/></button>
   </div>

   <div className="smooth-table">
    <div className="table-glow"/>
    <div className="dealer-zone">
     <span className="mini-label">DEALER</span>
     <div className="smooth-cards">{game.dealer.map((c,i)=><PlayingCard key={c.id} card={c} hidden={i===1&&game.status==='playing'}/>)}</div>
     {game.dealer.length>0&&game.status!=='playing'&&<i className="total-bubble">{dealerEval.total}</i>}
    </div>

    <div className="felt-copy"><b>BLACKJACK</b><span>PAYS 3 TO 2</span><small>{settings.hitSoft17?'DEALER HITS SOFT 17':'DEALER STANDS SOFT 17'}</small></div>

    <div className={`smooth-spots count-${game.seatCount}`}>
     {Array.from({length:game.seatCount},(_,seat)=>{
      const handIndexes=game.hands.map((h,i)=>h.seat===seat?i:-1).filter(i=>i>=0), seatHands=handIndexes.map(i=>game.hands[i]);
      const isActive=seatHands.some((_,j)=>handIndexes[j]===game.active&&game.status==='playing');
      return <div key={seat} className={`smooth-spot ${isActive?'active':''}`}>
       <div className="spot-hands">{seatHands.map((h,j)=>{const ev=evaluateHand(h.cards);return <div className="spot-hand" key={j}><div className="smooth-cards player">{h.cards.map(c=><PlayingCard key={c.id} card={c}/>)}</div>{h.cards.length>0&&<i className="total-bubble">{ev.blackjack&&!h.split?'BJ':ev.total}</i>}{h.result&&<em className={h.delta>=0?'positive':'negative'}>{h.delta>0?'+':''}{h.delta}</em>}</div>})}</div>
       {editable&&<button className="bet-circle" onClick={()=>addChip(seat)}><span>SPOT {seat+1}</span><b>{game.seatBets[seat]}</b><small>+{chip}</small></button>}
       {!editable&&<div className="bet-marker"><span>{seat+1}</span><b>{seatHands[0]?.bet||game.seatBets[seat]}</b></div>}
      </div>
     })}
    </div>

    <div className="table-status"><span>{roundTitle}</span><b>{game.message}</b></div>
   </div>

   <div className="smooth-bottom">
    <div className="game-metrics"><span>BALANCE <b>{Math.round(balance).toLocaleString()}</b></span><span>BET <b>{game.roundBet.toLocaleString()}</b></span><span>SHOE <b>{pen}%</b></span><span>COUNT <b>{visibleCount?(game.runningCount>=0?'+':'')+game.runningCount:'••'}</b></span></div>

    {game.status==='betting'&&<div className="bet-controls">
      <div className="spot-count"><span>HANDS</span>{[1,2,3,4,5].map(n=><button key={n} className={game.seatCount===n?'on':''} onClick={()=>game.setSeatCount(n)}>{n}</button>)}</div>
      <div className="chip-rack">{CHIPS.map(v=><button key={v} className={`chip c${v} ${chip===v?'selected':''}`} onClick={()=>setChip(v)}><span>{v}</span></button>)}</div>
      <div className="bet-tools"><button onClick={clearBets}>MIN BET</button><button onClick={applyAll}>BET {chip} ON ALL</button></div>
      <button data-auto-deal="true" className="big-deal" onClick={game.startHand}>DEAL <span>{game.roundBet} CHIPS</span></button>
    </div>}

    {game.status==='playing'&&<div className="play-actions">
      <div className="turn-total"><span>SPOT {active?.seat+1}</span><b>{activeEval?.soft?'SOFT ':''}{activeEval?.total}</b></div>
      <button disabled={!game.can.hit} className="action hit" onClick={game.hit}>HIT</button>
      <button disabled={!game.can.stand} className="action stand" onClick={game.stand}>STAND</button>
      <button disabled={!game.can.double} className="action" onClick={game.double}>DOUBLE</button>
      <button disabled={!game.can.split} className="action" onClick={game.split}>SPLIT</button>
    </div>}
    {game.status==='dealer'&&<div className="dealer-wait"><span className="pulse-dot"/>Dealer playing…</div>}
    {game.status==='complete'&&!showCheck&&<div className="round-actions"><button onClick={game.nextHand}>CHANGE BET</button><button className="big-deal" onClick={game.rebetAndDeal}><RotateCcw size={16}/> REBET & DEAL</button></div>}
   </div>
  </section>

  {showInfo&&<div className="play-info-pop"><b>Table</b><span>{settings.decks} decks · {settings.hitSoft17?'H17':'S17'} · {settings.blackjackPayout}:1 blackjack</span><span>{decks.toFixed(1)} decks remaining</span><button onClick={()=>setShowInfo(false)}>Close</button></div>}
  {showCheck&&<div className="mobile-count-sheet"><div className="count-sheet-card"><span className="eyebrow">COUNT CHECK</span><CountInput expected={game.runningCount} label="What is the running count?" onSubmit={answer}/></div></div>}
 </div>
}
