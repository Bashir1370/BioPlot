import { BioPlotDocument, migrateDocument } from './model';

const PREFIX='bioplot_recovery_v1:';
const MAX_SNAPSHOTS=8;

interface RecoverySnapshot { savedAt:string; document:BioPlotDocument; }

function key(id:string){return `${PREFIX}${id}`;}

export function saveRecoverySnapshot(document:BioPlotDocument){
  try{
    const current=loadRecoverySnapshots(document.id);
    const next:[RecoverySnapshot,...RecoverySnapshot[]]=[{savedAt:new Date().toISOString(),document:structuredClone(document)},...current];
    localStorage.setItem(key(document.id),JSON.stringify(next.slice(0,MAX_SNAPSHOTS)));
  }catch{}
}

export function loadRecoverySnapshots(documentId:string):RecoverySnapshot[]{
  try{
    const raw=localStorage.getItem(key(documentId));
    const parsed=raw?JSON.parse(raw):[];
    if(!Array.isArray(parsed))return[];
    return parsed.map(item=>({savedAt:typeof item?.savedAt==='string'?item.savedAt:new Date().toISOString(),document:migrateDocument(item?.document)}));
  }catch{return[];}
}

export function latestRecoverySnapshot(documentId:string){return loadRecoverySnapshots(documentId)[0]??null;}
export function clearRecoverySnapshots(documentId:string){try{localStorage.removeItem(key(documentId));}catch{}}
