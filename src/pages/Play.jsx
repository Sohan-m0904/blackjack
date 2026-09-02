import {useEffect,useRef,useState} from 'react';
import {evaluateHand} from '../utils/blackjack';
import {decksRemaining} from '../utils/deck';
import PlayingCard from '../components/PlayingCard';
import CountInput from '../components/CountInput';
import DiscardTray from '../components/DiscardTray';
import {useBlackjack} from '../hooks/useBlackjack';

const CHIP_VALUES=[5,10,25,50,100,250,500];

export default function Play({settings,balance,setBalance,statsApi}){
 const game=useBlackjack(settings,balance,setBalance,statsApi.recordHand);
 const [showCheck,setShowCheck]=useState(false); const questionStart=useRef(Date.now());
 useEffect(()=>{if(game.status==='complete'){const should=settings.difficulty==='intermediate'||(settings.difficulty==='advanced'&&game.handsSinceCheck>=2+Math.floor(Math.random()*5));if(should){setShowCheck(true);questionStart.current=Date.now();}}},[game.status,game.handsSinceCheck,settings.difficulty]);
 useEffect(()=>{if(game.status==='playing'){requestAnimationFrame(()=>document.querySelector('.multi-player-zone .player-hand.active')?.scrollIntoView({behavior:'smooth',inline:'center',block:'nearest'}));}},[game.active,game.status]);
 useEffect(()=>{const fn=e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;const k=e.key.toLowerCase();if(k==='h'&&game.can.hit)game.hit();if(k==='s'&&game.can.stand)game.stand();if(k==='d'&&game.can.double)game.double();if(k==='p'&&game.can.split)game.split();if(e.code==='Space'){e.preventDefault();game.status==='betting'?game.startHand():game.status==='complete'&&!showCheck&&game.nextHand();}};addEventListener('keydown',fn);return()=>removeEventListener('keydown',fn)},[game,showCheck]);
 const dealerEval=evaluateHand(game.dealer); const decks=decksRemaining(game.shoe.length); const pen=Math.round(game.discard.length/(settings.decks*52)*100);
 const answer=(n,ok)=>{statsApi.recordAnswer(ok,n-game.runningCount,Date.now()-questionStart.current,'play');setTimeout(()=>{setShowCheck(false);game.setHandsSinceCheck(0)},500)};
 const editable=game.status==='betting'||game.status==='complete';
 const activeHand=game.hands[game.active];
 return <div className="page play-page">
  <div className="play-header"><div><span className="eyebrow">PLAY & COUNT</span><h1>Blackjack Table</h1></div><div className="table-meta"><span>Balance <b>{Math.round(balance).toLocaleString()}</b></span><span>Shoe <b>{settings.decks} decks</b></span><span>Penetration <b>{pen}%</b></span><span>Spots <b>{game.seatCount}</b></span></div></div>
  <div className="mobile-table-meta"><span><small>BALANCE</small><b>{Math.round(balance).toLocaleString()}</b></span><span><small>SHOE</small><b>{settings.decks}D</b></span><span><small>PEN</small><b>{pen}%</b></span><span><small>SPOTS</small><b>{game.seatCount}</b></span></div>
  <div className="table-layout">
   <section className={`blackjack-table multi-spot-table spots-${game.seatCount}`}>
    <div className="dealer-zone"><label>DEALER {game.status!=='playing'&&game.dealer.length?`• ${dealerEval.total}`:''}</label><div className="hand">{game.dealer.map((c,i)=><PlayingCard key={c.id} card={c} hidden={i===1&&game.status==='playing'}/>)}</div></div>
    <div className="felt-center"><div className="table-logo">COUNTCRAFT<small>BLACKJACK PAYS 3 TO 2</small></div><DiscardTray discard={game.discard} total={settings.decks*52} hideExact={!settings.showDecksRemaining}/></div>
    <div className="player-zone multi-player-zone">{game.hands.map((h,i)=>{const ev=evaluateHand(h.cards);const splitLabel=h.split?String.fromCharCode(65+(h.splitIndex||0)):'';return <div key={`${h.seat}-${h.splitIndex}-${i}`} className={`player-hand ${i===game.active&&game.status==='playing'?'active':''}`}><div className="seat-badge">SPOT {h.seat+1}{splitLabel&&` · ${splitLabel}`}</div><div className="hand">{h.cards.map(c=><PlayingCard key={c.id} card={c}/>)}</div><span>{h.cards.length?`${ev.soft?'Soft ':''}${ev.total} • Bet ${h.bet}`:'Waiting'}</span>{h.result&&<b className={`result ${h.delta>=0?'good':'bad'}`}>{h.result} {h.delta?`${h.delta>0?'+':''}${h.delta}`:''}</b>}</div>})}</div>
   </section>
   <aside className="trainer-panel">
    <div className="panel-section count-panel"><span className="eyebrow">HI-LO TRAINER</span>{settings.difficulty==='beginner'||settings.showRunningCount?<><div className="big-count">{game.runningCount>=0?'+':''}{game.runningCount}</div><small>Running Count</small></>:<div className="hidden-count">COUNT HIDDEN</div>}{settings.showTrueCount&&<div className="mini-stat"><span>True Count</span><b>{game.trueCount.rounded>=0?'+':''}{game.trueCount.rounded}</b></div>}{settings.showDecksRemaining&&<div className="mini-stat"><span>Decks Remaining</span><b>{decks.toFixed(2)}</b></div>}</div>
    <div className="panel-section betting-panel"><span className="eyebrow">TABLE SETUP</span><div className="spot-picker"><span>Hands</span><div>{[1,2,3,4,5].map(n=><button key={n} className={game.seatCount===n?'selected':''} disabled={!editable} onClick={()=>game.setSeatCount(n)}>{n}</button>)}</div></div><div className="seat-bets">{game.seatBets.slice(0,game.seatCount).map((bet,seat)=><div className="seat-bet" key={seat}><span>Spot {seat+1}</span><select value={bet} disabled={!editable} onChange={e=>game.setSeatBet(seat,Number(e.target.value))}>{CHIP_VALUES.map(v=><option key={v} value={v}>{v} chips</option>)}</select></div>)}</div><div className="bet-total"><span>Total at risk</span><b>{game.roundBet.toLocaleString()} chips</b></div><div className="quick-bets">{[10,25,50,100].map(v=><button key={v} disabled={!editable} onClick={()=>game.setBet(v)}>{v} all</button>)}</div></div>
    <div className="panel-section action-panel"><span className="eyebrow">ACTIONS</span>{game.status==='playing'&&activeHand&&<div className="active-spot-line">Playing <b>Spot {activeHand.seat+1}{activeHand.split?` split ${String.fromCharCode(65+(activeHand.splitIndex||0))}`:''}</b></div>}<div className="actions">{game.status==='betting'&&<button className="gold-btn" onClick={game.startHand}>Deal {game.seatCount} {game.seatCount===1?'Hand':'Hands'}</button>}{game.status==='playing'&&<><button disabled={!game.can.hit} onClick={game.hit}>Hit <kbd>H</kbd></button><button disabled={!game.can.stand} onClick={game.stand}>Stand <kbd>S</kbd></button><button disabled={!game.can.double} onClick={game.double}>Double <kbd>D</kbd></button><button disabled={!game.can.split} onClick={game.split}>Split <kbd>P</kbd></button></>}{game.status==='dealer'&&<button disabled>Dealer playing…</button>}{game.status==='complete'&&!showCheck&&<button className="gold-btn" onClick={game.nextHand}>Next Round</button>}</div><p className="table-message">{game.message}</p></div>
    {showCheck&&<div className="panel-section count-check"><CountInput actual={game.runningCount} onSubmit={answer}/></div>}
   </aside>
  </div>
 </div>
}
