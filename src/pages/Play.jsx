import {useEffect,useRef,useState} from 'react';
import {Info,RotateCcw,Volume2,X} from 'lucide-react';
import {evaluateHand} from '../utils/blackjack';
import {decksRemaining} from '../utils/deck';
import PlayingCard from '../components/PlayingCard';
import CountInput from '../components/CountInput';
import {useBlackjack} from '../hooks/useBlackjack';

const CHIPS=[5,10,25,50,100,250];

export default function Play({settings,balance,setBalance,statsApi}){
 const game=useBlackjack(settings,balance,setBalance,statsApi.recordHand);
 const [chip,setChip]=useState(25);
 const [showCheck,setShowCheck]=useState(false);
 const [showInfo,setShowInfo]=useState(false);
 const questionStart=useRef(Date.now());
 const visibleCount=settings.difficulty==='beginner'||settings.showRunningCount;
 const active=game.hands[game.active];
 const activeEval=active?evaluateHand(active.cards):null;
 const dealerEval=evaluateHand(game.dealer);
 const pen=Math.round(game.discard.length/(settings.decks*52)*100);
 const decks=decksRemaining(game.shoe.length);
 const editable=game.status==='betting'||game.status==='complete';

 useEffect(()=>{
  if(game.status==='complete'){
   const should=settings.difficulty==='intermediate'||(settings.difficulty==='advanced'&&game.handsSinceCheck>=2+Math.floor(Math.random()*5));
   if(should){setShowCheck(true);questionStart.current=Date.now();}
  }
 },[game.status,game.handsSinceCheck,settings.difficulty]);

 const answer=(n,ok)=>{
  statsApi.recordAnswer(ok,n-game.runningCount,Date.now()-questionStart.current,'play');
  setTimeout(()=>{setShowCheck(false);game.setHandsSinceCheck(0)},450);
 };

 const addChip=seat=>{
  if(!editable)return;
  game.setSeatBet(seat,Math.min(1000,(game.seatBets[seat]||0)+chip));
 };
 const removeChip=seat=>{
  if(!editable)return;
  game.setSeatBet(seat,Math.max(5,(game.seatBets[seat]||0)-chip));
 };
 const clearBets=()=>{for(let i=0;i<game.seatCount;i++)game.setSeatBet(i,5)};
 const rebet=()=>game.rebetAndDeal();

 const seatHands=seat=>game.hands.map((h,i)=>({h,i})).filter(x=>x.h.seat===seat);
 const seatDelta=seat=>seatHands(seat).reduce((sum,x)=>sum+(x.h.delta||0),0);

 return <div className="page casino-play-page">
  <div className="casino-game-shell">
   <header className="casino-game-bar">
    <button className="casino-round-btn" onClick={()=>setShowInfo(true)}><Info size={17}/></button>
    <div className="casino-title"><b>BLACKJACK</b><small>TRAINING TABLE</small></div>
    <button className="casino-round-btn" aria-label="Sound"><Volume2 size={17}/></button>
   </header>

   <main className="casino-felt">
    <div className="felt-texture"/>
    <div className="casino-rule-arcs" aria-hidden="true"><i/><i/></div>

    <section className="casino-dealer-area">
     <span className="zone-label">DEALER</span>
     <div className="casino-card-stack dealer-cards">
      {game.dealer.map((c,i)=><PlayingCard key={c.id} card={c} hidden={i===1&&game.status==='playing'}/>)}
     </div>
     {game.dealer.length>0&&game.status!=='playing'&&<strong className="hand-total dealer-total">{dealerEval.total}</strong>}
    </section>

    <section className="casino-rules-copy">
     <h1>BLACKJACK</h1>
     <b>PAYS 3 TO 2</b>
     <span>{settings.hitSoft17?'Dealer hits soft 17':'Dealer stands on soft 17'}</span>
    </section>

    <section className={`casino-five-spots seats-${game.seatCount}`}>
     {Array.from({length:5},(_,seat)=>{
      const enabled=seat<game.seatCount;
      const hands=seatHands(seat);
      const isActive=enabled&&game.status==='playing'&&hands.some(x=>x.i===game.active);
      const result=game.status==='complete'?seatDelta(seat):null;
      return <div key={seat} className={`casino-seat seat-${seat+1} ${enabled?'enabled':'disabled'} ${isActive?'active':''}`}>
       <div className="casino-seat-cards">
        {hands.map(({h,i})=>{
         const ev=evaluateHand(h.cards);
         return <div className="casino-seat-hand" key={`${seat}-${i}`}>
          <div className="casino-card-stack player-cards">{h.cards.map(c=><PlayingCard key={c.id} card={c}/>)}</div>
          {h.cards.length>0&&<strong className="hand-total">{ev.blackjack&&!h.split?'BJ':ev.total}</strong>}
         </div>
        })}
       </div>

       <button
        className="casino-bet-ring"
        disabled={!enabled||!editable}
        onClick={()=>addChip(seat)}
        onContextMenu={e=>{e.preventDefault();removeChip(seat)}}
       >
        <span>{enabled?`HAND ${seat+1}`:'OFF'}</span>
        {enabled&&<b>{game.seatBets[seat]}</b>}
        {enabled&&editable&&<small>TAP +{chip}</small>}
       </button>
       {game.status==='complete'&&enabled&&<em className={`seat-result ${result>0?'win':result<0?'lose':'push'}`}>{result>0?`+${result}`:result===0?'PUSH':result}</em>}
      </div>
     })}
    </section>

    <div className="casino-table-message">
     <b>{game.status==='betting'?'PLACE YOUR BETS':game.status==='playing'?`HAND ${active?.seat+1} · YOUR MOVE`:game.status==='dealer'?'DEALER PLAYING':'ROUND COMPLETE'}</b>
     <span>{game.message}</span>
    </div>
   </main>

   <footer className="casino-control-deck">
    <div className="casino-live-stats">
     <span><small>BALANCE</small><b>{Math.round(balance).toLocaleString()}</b></span>
     <span><small>TOTAL BET</small><b>{game.roundBet.toLocaleString()}</b></span>
     <span><small>SHOE</small><b>{pen}%</b></span>
     <span><small>COUNT</small><b>{visibleCount?(game.runningCount>=0?'+':'')+game.runningCount:'••'}</b></span>
    </div>

    {game.status==='betting'&&<div className="casino-bet-deck">
     <div className="casino-hand-picker">
      <span>HANDS</span>
      {[1,2,3,4,5].map(n=><button key={n} className={game.seatCount===n?'selected':''} onClick={()=>game.setSeatCount(n)}>{n}</button>)}
     </div>
     <div className="casino-chip-tray">
      {CHIPS.map(v=><button key={v} className={`casino-chip chip-${v} ${chip===v?'selected':''}`} onClick={()=>setChip(v)}><span>{v}</span></button>)}
     </div>
     <div className="casino-bet-secondary"><button onClick={clearBets}>MIN</button><button onClick={()=>game.setBet(chip)}>BET {chip} ALL</button></div>
     <button data-auto-deal="true" className="casino-primary-deal" onClick={game.startHand}>DEAL <span>{game.roundBet}</span></button>
    </div>}

    {game.status==='playing'&&<div className="casino-action-deck">
     <div className="casino-current-total"><span>HAND {active?.seat+1}</span><b>{activeEval?.soft?'SOFT ':''}{activeEval?.total}</b></div>
     <button disabled={!game.can.hit} className="casino-action hit" onClick={game.hit}>HIT</button>
     <button disabled={!game.can.stand} className="casino-action stand" onClick={game.stand}>STAND</button>
     <button disabled={!game.can.double} className="casino-action" onClick={game.double}>DOUBLE</button>
     <button disabled={!game.can.split} className="casino-action" onClick={game.split}>SPLIT</button>
    </div>}

    {game.status==='dealer'&&<div className="casino-dealer-wait"><span/> Dealer playing…</div>}

    {game.status==='complete'&&!showCheck&&<div className="casino-round-deck">
     <button onClick={game.nextHand}>CHANGE BET</button>
     <button className="casino-primary-deal" onClick={rebet}><RotateCcw size={17}/> REBET & DEAL</button>
    </div>}
   </footer>
  </div>

  {showInfo&&<div className="casino-modal-backdrop" onClick={()=>setShowInfo(false)}><div className="casino-info-modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowInfo(false)}><X size={18}/></button><h3>Table Rules</h3><p>{settings.decks} decks · {settings.hitSoft17?'H17':'S17'} · Blackjack pays {settings.blackjackPayout}:1</p><p>{decks.toFixed(1)} decks remaining · {pen}% penetration</p><p>Tap a betting circle to add the selected chip. Choose 1–5 simultaneous hands before dealing.</p></div></div>}

  {showCheck&&<div className="mobile-count-sheet"><div className="count-sheet-card"><span className="eyebrow">COUNT CHECK</span><CountInput expected={game.runningCount} label="What is the running count?" onSubmit={answer}/></div></div>}
 </div>
}
