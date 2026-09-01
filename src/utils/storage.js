export function load(key, fallback){try{const x=JSON.parse(localStorage.getItem(key)); return x ?? fallback;}catch{return fallback;}}
export function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
export function downloadJSON(data, filename='countcraft-stats.json'){
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
