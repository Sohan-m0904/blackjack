import {suitSymbol} from '../utils/deck';
export default function PlayingCard({card,hidden=false,small=false}){
 if(hidden) return <div className={`playing-card card-back ${small?'small':''}`} aria-label="Hidden card"><span>CC</span></div>;
 if(!card) return null; const red=['hearts','diamonds'].includes(card.suit);
 return <div className={`playing-card ${red?'red':''} ${small?'small':''}`} aria-label={`${card.rank} of ${card.suit}`}>
   <div className="card-corner"><strong>{card.rank}</strong><span>{suitSymbol[card.suit]}</span></div><div className="card-suit">{suitSymbol[card.suit]}</div>
 </div>;
}
