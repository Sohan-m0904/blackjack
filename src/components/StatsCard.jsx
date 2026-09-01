export default function StatsCard({label,value,detail}){return <div className="stat-card"><small>{label}</small><strong>{value}</strong>{detail&&<span>{detail}</span>}</div>}
