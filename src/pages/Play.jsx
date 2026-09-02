import {useEffect,useRef,useState} from 'react';
import {ChevronLeft, ChevronRight, Eye, EyeOff, Layers3, WalletCards} from 'lucide-react';
import {evaluateHand} from '../utils/blackjack';
import {decksRemaining} from '../utils/deck';
import PlayingCard from '../components/PlayingCard';
import CountInput from '../components/CountInput';
import DiscardTray from '../components/DiscardTray';
import {useBlackjack} from '../hooks/useBlackjack';

const CHIP_VALUES=[5,10,25,50,100,250,500];

export default function Play({settings,balance,setBalance,statsApi}){
 const game=useBlackjack(settings,balance,setBalance,statsApi.recordHand);
 const [showCheck,setShowCheck]=useState(false);
 const [showTableSetup,setShowTableSetup]=useState(true);
 const questionStart=useRef(Date.now());
 const seatsRef=useRef(null);

 useEffect(()=>{
  if(game.status==='complete'){
   const should=settings.difficulty==='intermediate'||(settings.difficulty==='advanced'&&game.handsSinceCheck>=2+Math.floor(Math.random()*5));
   if(should){setShowCheck(true);questionStart.current=Date.now();}
  }
 },[game.status,game.handsSinceCheck,settings.difficulty]);

 useEffect(()=>{
  if(game.status==='playing'){
   requestAnimationFrame(()=>document.querySelector('.casino-seat.is-active')?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}));
   setShowTableSetup(false);
  }
  if(game.status==='betting') setShowTableSetup(true);
 },[game.active,game.status]);

 useEffect(()=>{
  const fn=e=>{
   if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
   const k=e.key.toLowerCase();
   if(k==='h'&&game.can.hit)game.hit();
   if(k==='s'&&game.can.stand)game.stand();
   if(k==='d'&&game.can.double)game.double();
   if(k==='p'&&game.can.split)game.split();
   if(e.code==='Space'){
    e.preventDefault();
    if(game.status==='betting')game.startHand();
    if(game.status==='complete'&&!showCheck)game.nextHand();
   }
  };
  addEventListener('keydown',fn);return()=>removeEventListener('keydown',fn)
 },[game,showCheck]);

 const dealerEval=evaluateHand(game.dealer);
 const decks=decksRemaining(game.shoe.length);
 const pen=Math.round(game.discard.length/(settings.decks*52)*100);
 const answer=(n,ok)=>{statsApi.recordAnswer(ok,n-game.runningCount,Date.now()-questionStart.current,'play');setTimeout(()=>{setShowCheck(false);game.setHandsSinceCheck(0)},500)};
 const editable=game.status==='betting'||game.status==='complete';
 const activeHand=game.hands[game.active];
 const activeEval=activeHand?evaluateHand(activeHand.cards):null;
 const visibleCount=settings.difficulty==='beginner'||settings.showRunningCount;
 const roundLabel=game.status==='betting'?'Place bets':game.status==='playing'?'Your turn':game.status==='dealer'?'Dealer turn':'Round complete';

 const scrollSeats=dir=>seatsRef.current?.scrollBy({left:dir*220,behavior:'smooth'});

 return <div className="page play-page play-v2">
  <header className="casino-topbar">
   <div className="casino-title"><span className="eyebrow">PLAY & COUNT</span><h1>Blackjack</h1></div>
   <div className="casino-hud">
    <div><WalletCards size={15}/><span>Balance</span><b>{Math.round(balance).toLocaleString()}</b></div>
    <div><Layers3 size={15}/><span>Shoe</span><b>{settings.decks}D · {pen}%</b></div>
    <div className={`count-pill ${visibleCount?'':'is-hidden'}`}>{visibleCount?<Eye size={15}/>:<EyeOff size={15}/>}<span>RC</span><b>{visibleCount?(game.runningCount>=0?'+':'')+game.runningCount:'—'}</b></div>
   </div>
  </header>

  <div className="casino-workspace">
   <main className="casino-main">
    <section className={`casino-table spots-${game.seatCount}`}>
     <div className="table-rail top-rail"><span>{settings.decks} DECK SHOE</span><span>BLACKJACK PAYS 3 TO 2</span><span>{settings.hitSoft17?'DEALER HITS SOFT 17':'DEALER STANDS SOFT 17'}</span></div>

     <div className="casino-dealer">
      <div className="zone-heading"><span>DEALER</span>{game.dealer.length>0&&game.status!=='playing'&&<b>{dealerEval.soft?'SOFT ':''}{dealerEval.total}</b>}</div>
      <div className="casino-hand dealer-hand">{game.dealer.map((c,i)=><PlayingCard key={c.id} card={c} hidden={i===1&&game.status==='playing'}/>)}</div>
     </div>

     <div className="casino-middle">
      <div className="table-mark"><span>COUNTCRAFT</span><small>TRAIN THE COUNT · PLAY THE HAND</small></div>
      <div className="round-status"><i></i><span>{roundLabel}</span>{game.status==='playing'&&activeHand&&<b>Spot {activeHand.seat+1}</b>}</div>
      <DiscardTray discard={game.discard} total={settings.decks*52} hideExact={!settings.showDecksRemaining}/>
     </div>

     <div className="seat-viewport-wrap">
      {game.hands.length>2&&<button className="seat-scroll left" onClick={()=>scrollSeats(-1)} aria-label="Previous hands"><ChevronLeft/></button>}
      <div className="casino-seats" ref={seatsRef}>
       {game.hands.map((h,i)=>{
        const ev=evaluateHand(h.cards);
        const splitLabel=h.split?String.fromCharCode(65+(h.splitIndex||0)):'';
        const isActive=i===game.active&&game.status==='playing';
        return <article key={`${h.seat}-${h.splitIndex}-${i}`} className={`casino-seat ${isActive?'is-active':''} ${h.result?'is-finished':''}`}>
         <div className="seat-topline"><span>SPOT {h.seat+1}{splitLabel&&` · ${splitLabel}`}</span><b>{h.bet||game.seatBets[h.seat]} chips</b></div>
         <div className="casino-hand player-cards">{h.cards.map(c=><PlayingCard key={c.id} card={c}/>)}</div>
         <div className="seat-footer">
          <span className="hand-total">{h.cards.length?(ev.blackjack&&!h.split?'BJ':`${ev.soft?'S':''}${ev.total}`):'—'}</span>
          {h.result?<strong className={h.delta>=0?'win-text':'loss-text'}>{h.result}{h.delta?` ${h.delta>0?'+':''}${h.delta}`:''}</strong>:isActive?<strong>YOUR HAND</strong>:<small>{h.done?'Waiting for dealer':'Waiting'}</small>}
         </div>
        </article>
       })}
      </div>
      {game.hands.length>2&&<button className="seat-scroll right" onClick={()=>scrollSeats(1)} aria-label="Next hands"><ChevronRight/></button>}
     </div>
    </section>

    <section className="play-control-dock">
     {editable&&<div className="betting-console">
      <div className="console-heading"><div><span className="eyebrow">TABLE SETUP</span><strong>{game.seatCount} {game.seatCount===1?'hand':'hands'} · {game.roundBet.toLocaleString()} chips total</strong></div><button className="setup-toggle" onClick={()=>setShowTableSetup(v=>!v)}>{showTableSetup?'Hide':'Edit bets'}</button></div>
      {showTableSetup&&<div className="betting-body">
       <div className="hands-selector"><span>How many hands?</span><div>{[1,2,3,4,5].map(n=><button key={n} className={game.seatCount===n?'selected':''} disabled={!editable} onClick={()=>game.setSeatCount(n)}>{n}</button>)}</div></div>
       <div className="quick-chip-row"><span>Bet all spots</span><div>{[10,25,50,100,250].map(v=><button key={v} disabled={!editable} className={game.seatBets.slice(0,game.seatCount).every(x=>x===v)?'selected':''} onClick={()=>game.setBet(v)}>{v}</button>)}</div></div>
       <div className="individual-bets">{game.seatBets.slice(0,game.seatCount).map((bet,seat)=><label key={seat}><span>Spot {seat+1}</span><select value={bet} disabled={!editable} onChange={e=>game.setSeatBet(seat,Number(e.target.value))}>{CHIP_VALUES.map(v=><option key={v} value={v}>{v} chips</option>)}</select></label>)}</div>
      </div>}
     </div>}

     <div className="game-action-bar">
      <div className="active-hand-summary">
       {game.status==='playing'&&activeHand?<><span>SPOT {activeHand.seat+1}{activeHand.split?` · ${String.fromCharCode(65+(activeHand.splitIndex||0))}`:''}</span><strong>{activeEval?.soft?'Soft ':''}{activeEval?.total}</strong><small>{activeHand.bet} chip bet</small></>:<><span>{roundLabel.toUpperCase()}</span><strong>{game.status==='complete'?game.message:'Ready'}</strong></>}
      </div>
      <div className="primary-actions">
       {game.status==='betting'&&<button className="deal-action" onClick={game.startHand}>DEAL <span>{game.roundBet.toLocaleString()} chips</span></button>}
       {game.status==='playing'&&<>
        <button className="hit-action" disabled={!game.can.hit} onClick={game.hit}><b>HIT</b><small>H</small></button>
        <button className="stand-action" disabled={!game.can.stand} onClick={game.stand}><b>STAND</b><small>S</small></button>
        <button disabled={!game.can.double} onClick={game.double}><b>DOUBLE</b><small>D</small></button>
        <button disabled={!game.can.split} onClick={game.split}><b>SPLIT</b><small>P</small></button>
       </>}
       {game.status==='dealer'&&<button className="deal-action" disabled>DEALER PLAYING…</button>}
       {game.status==='complete'&&!showCheck&&<button className="deal-action" onClick={game.nextHand}>NEXT ROUND</button>}
      </div>
      <p className="game-message">{game.message}</p>
     </div>
    </section>
   </main>

   <aside className="casino-coach">
    <div className="coach-card count-coach"><div className="coach-title"><span className="eyebrow">HI-LO COACH</span><small>{settings.difficulty}</small></div>{visibleCount?<><strong className="coach-count">{game.runningCount>=0?'+':''}{game.runningCount}</strong><span>Running count</span></>:<div className="coach-hidden"><EyeOff size={20}/><strong>Count hidden</strong><span>Keep it mentally</span></div>}{settings.showTrueCount&&<div className="coach-row"><span>True count</span><b>{game.trueCount.rounded>=0?'+':''}{game.trueCount.rounded}</b></div>}{settings.showDecksRemaining&&<div className="coach-row"><span>Decks remaining</span><b>{decks.toFixed(2)}</b></div>}<div className="coach-row"><span>Penetration</span><b>{pen}%</b></div></div>
    <div className="coach-card rules-card"><span className="eyebrow">ROUND</span><div className="coach-row"><span>Hands</span><b>{game.seatCount}</b></div><div className="coach-row"><span>Total wager</span><b>{game.roundBet}</b></div><div className="coach-row"><span>Cards remaining</span><b>{settings.showDecksRemaining?game.shoe.length:'Hidden'}</b></div></div>
   </aside>
  </div>

  {showCheck&&<div className="mobile-count-sheet"><div className="count-sheet-card"><span className="eyebrow">COUNT CHECK</span><CountInput actual={game.runningCount} onSubmit={answer}/></div></div>}
 </div>
}
