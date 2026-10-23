import React, { Component, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { assessGlobalField, KOPPEN_CODES, SOIL_TEXTURES, validateGlobalCatalog } from '../engine/global-engine.js';

let pending;
function loadEvidence() {
  if (!pending) pending = Promise.all(['global-crops','global-layers','sources','agronomy'].map(async (name) => {
    const response = await fetch(`./data/${name}.json`);
    if (!response.ok) throw new Error(`Evidence file unavailable (${response.status}).`);
    return response.json();
  })).then(([catalog,layers,registry,trials]) => {
    const sources = registry.sources;
    if (!Array.isArray(sources) || sources.some((s) => !s.url?.startsWith('https://'))) throw new Error('Invalid source registry.');
    const errors = validateGlobalCatalog(catalog,new Set(sources.map((s) => s.id)));
    if (errors.length) throw new Error(errors[0]);
    return {catalog,layers,sources,trials};
  }).catch((error) => { pending = null; throw error; });
  return pending;
}
function useEvidence() {
  const [data,setData] = useState(null), [error,setError] = useState(''), [attempt,setAttempt] = useState(0);
  useEffect(() => { let active=true; setError(''); loadEvidence().then((value)=>{if(active)setData(value);}).catch((e)=>{if(active)setError(e.message);}); return()=>{active=false;}; },[attempt]);
  return {data,error,retry:()=>setAttempt((n)=>n+1)};
}
function Source({id,sources}) {
  const source=sources.find((s)=>s.id===id);
  return source ? <a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} ↗</a> : <span>Source unavailable</span>;
}
function LoadState({error,retry}) { return <div className="g-notice" role="status">{error || 'Loading source-linked research…'}{error && <button type="button" className="g-button" onClick={retry}>Retry evidence</button>}</div>; }
class Boundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed ? <p role="alert" className="g-notice">This workspace could not render. Reload the page; no assessment has been saved.</p>:this.props.children;}
}
function Field({label,name,value,onChange,options,type='text',min,max,step='any',required=false}) {
  return <label className="g-field"><span>{label}</span>{options ? <select name={name} value={value} onChange={onChange} required={required}>{options.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select>:<input name={name} value={value} onChange={onChange} type={type} min={min} max={max} step={type==='number'?step:undefined} required={required}/>}</label>;
}
const initial={latitude:'',longitude:'',elevationM:'',koppen:'',texture:'',ph:'',som:'',annualRainMm:'',irrigation:'unknown',seasonEtcMm:'',effectiveRainMm:'',netIrrigationMm:'',sequence:['','','']};
export function GlobalPlanner() {
  const evidence=useEvidence();
  const [input,setInput]=useState(initial),[result,setResult]=useState(null),[error,setError]=useState(''),[context,setContext]=useState(null);
  useEffect(()=>{const update=(event)=>setContext(event.detail);window.addEventListener('fieldshift:context',update);window.dispatchEvent(new Event('fieldshift:request-context'));return()=>window.removeEventListener('fieldshift:context',update);},[]);
  const change=(event)=>{const {name,value}=event.target;setInput((previous)=>({...previous,[name]:value}));setResult(null);setError('');};
  useEffect(()=>{
    const capture=(event)=>{ event.detail.values={...input,sequence:[...input.sequence]}; };
    const restore=(event)=>{ if(event.detail?.values){setInput({...initial,...event.detail.values,sequence:[...event.detail.values.sequence]});setResult(null);setError('');} };
    window.addEventListener('fieldshift:capture-global',capture);
    window.addEventListener('fieldshift:restore-global',restore);
    return()=>{window.removeEventListener('fieldshift:capture-global',capture);window.removeEventListener('fieldshift:restore-global',restore);};
  },[input]);
  const submit=(event)=>{event.preventDefault();try{setResult(assessGlobalField({...input,sequence:input.sequence.filter(Boolean)},evidence.data.catalog));setError('');}catch(e){setResult(null);setError(e.message);}};
  if(!evidence.data)return <LoadState {...evidence}/>;
  const {catalog,layers,sources}=evidence.data;
  const entered=[input.latitude,input.longitude,input.texture,input.irrigation!=='unknown'?'yes':'',input.ph,input.som].filter(Boolean).length;
  const selected=input.sequence.filter(Boolean).length;
  return <div className="global-ui">
    <header className="g-command"><div><p className="g-eyebrow">FIELD LAB / GLOBAL EXPLORATION</p><h2>A plan begins<br/><em>with a place.</em></h2><p>Sketch a sequence and inspect its evidence gaps. This is a research workspace, not a crop prescription.</p></div><div className="g-command-meta" aria-label="Assessment status"><span>FIELD</span><span>SEQUENCE</span><span>REVIEW</span><strong>Local validation required</strong></div></header>
    <div className="g-workspace">
    <form className="g-form" onSubmit={submit}>
      <section className="g-form-section"><div className="g-section-heading"><span className="g-index">01</span><div><h3>Locate the field</h3><p>Use the map pin or enter coordinates. Soil results here are farmer-supplied.</p></div></div>
      <button type="button" className="g-button g-map-button" disabled={!context?.point} onClick={()=>{setInput((prev)=>({...prev,latitude:String(context.point.lat),longitude:String(context.point.lon)}));setResult(null);}}>↗ Use Dashboard map point</button>
      <div className="grid gap-4 md:grid-cols-2 mt-6">
      <Field label="Latitude" name="latitude" type="number" min="-90" max="90" value={input.latitude} onChange={change} required/>
      <Field label="Longitude" name="longitude" type="number" min="-180" max="180" value={input.longitude} onChange={change} required/>
      <Field label="Elevation · m, if known" name="elevationM" type="number" min="-500" max="9000" value={input.elevationM} onChange={change}/>
      <Field label="Köppen–Geiger class · manually supplied" name="koppen" value={input.koppen} onChange={change} options={[["","Unknown / no raster lookup"],...KOPPEN_CODES.map((c)=>[c,c])]}/>
      <Field label="USDA soil texture · if known" name="texture" value={input.texture} onChange={change} options={[["","Unknown"],...SOIL_TEXTURES.map((c)=>[c,c])]}/>
      <Field label="Water management" name="irrigation" value={input.irrigation} onChange={change} options={[["unknown","Unknown"],["rainfed","Rainfed"],["irrigated","Irrigated"],["supplemental","Supplemental irrigation"]]}/>
      <Field label="Measured pH · optional" name="ph" type="number" min="0" max="14" value={input.ph} onChange={change}/>
      <Field label="Measured SOM · % optional" name="som" type="number" min="0" max="100" value={input.som} onChange={change}/>
      <Field label="Annual rainfall · mm, if known" name="annualRainMm" type="number" min="0" max="20000" value={input.annualRainMm} onChange={change}/>
      </div>
      <p className="g-inline-limit">No climate class is inferred from coordinates. GAEZ, elevation and Köppen raster lookups are not connected; a manually entered class is unverified.</p></section>
      <section className="g-form-section"><div className="g-section-heading"><span className="g-index">02</span><div><h3>Sketch a sequence</h3><p>Choose crops you can actually access. Inclusion does not imply field suitability.</p></div></div>
      <div className="g-phase-grid">{input.sequence.map((value,index)=><div className="g-phase" key={index}><span className="g-phase-count">{String(index+1).padStart(2,'0')} / CROP PHASE</span><Field label={`Phase ${index+1}`} name={`phase-${index}`} value={value} onChange={(event)=>{setInput((prev)=>({...prev,sequence:prev.sequence.map((v,i)=>i===index?event.target.value:v)}));setResult(null);}} options={[["","Choose crop"],...catalog.crops.map((c)=>[c.id,c.name])]}/></div>)}</div></section>
      <section className="g-form-section g-form-section-last"><div className="g-section-heading"><span className="g-index">03</span><div><h3>Check the tradeoffs</h3><p>Optional water arithmetic uses values for the same crop and growing season.</p></div></div>
      <details className="g-disclosure"><summary>Enter seasonal water estimates</summary><p className="g-support">Do not substitute annual NASA POWER rainfall for effective seasonal rain.</p><div className="grid gap-4 md:grid-cols-3 mt-4">
      <Field label="Season ETc · mm" name="seasonEtcMm" type="number" min="0" max="10000" value={input.seasonEtcMm} onChange={change}/>
      <Field label="Effective seasonal rain · mm" name="effectiveRainMm" type="number" min="0" max="10000" value={input.effectiveRainMm} onChange={change}/>
      <Field label="Net seasonal irrigation · mm" name="netIrrigationMm" type="number" min="0" max="10000" value={input.netIrrigationMm} onChange={change}/></div></details>
      <button className="g-button g-primary g-submit" type="submit">Review evidence gaps <span aria-hidden="true">↗</span></button><p role="alert">{error}</p></section>
    </form>
    <aside className="g-readout"><p className="g-eyebrow">LIVE FIELD READOUT</p><h3>{result?'Assessment recorded':'Ready when you are.'}</h3><p className="g-readout-sub">{result?'Review the checks below before trying a field change.':'Your inputs will reveal questions to verify locally.'}</p><div className="g-telemetry"><div><strong>{entered}<span>/6</span></strong><small>core inputs supplied</small></div><div><strong>{selected}<span>/3</span></strong><small>crop phases chosen</small></div></div><div className="g-signal"><span className={context?.power?'g-signal-on':''} aria-hidden="true"/><div><strong>NASA POWER</strong><small>{context?.power?'Loaded for Dashboard point':'Available on Dashboard; not loaded here'}</small></div></div><div className="g-signal"><span aria-hidden="true"/><div><strong>Mapped global soil</strong><small>Not connected; enter measured soil values</small></div></div><div className="g-signal"><span aria-hidden="true"/><div><strong>Global crop approval</strong><small>Not established by this catalog</small></div></div><p className="g-readout-foot">No yield, profit, nitrogen credit or disease-break guarantee is calculated.</p></aside>
    </div>
    <div aria-live="polite">{result && <section className="g-result"><div className="g-result-head"><p className="g-eyebrow">ASSESSMENT / LOCAL VALIDATION REQUIRED</p><h3>{result.zone.lenses.length?result.zone.lenses.join(' + ')+' planning lens':'Climate classification unresolved'}</h3><p>{result.zone.lat.toFixed(4)}, {result.zone.lon.toFixed(4)} · {result.zone.classificationStatus}</p></div><p>{result.zone.limitation}</p><ol className="g-sequence">{result.crops.map((c,i)=><li key={i}><span>PHASE {i+1}</span>{c.name}</li>)}</ol><div className="grid gap-4 md:grid-cols-2">{result.checks.map((check)=><article className="g-check" key={check.id}><strong>{check.id} / {check.status}</strong><p>{check.text}</p></article>)}</div><p className="g-notice">Missing context: {result.missingInputs.join(', ') || 'Basic inputs supplied; local trait validation is still missing.'}</p><h4>Seasonal ET not covered by entered rain + irrigation</h4><p className="g-number">{result.water.uncoveredEtMm===null?'Not calculated':`${result.water.uncoveredEtMm} mm`}</p><p>{result.water.limitation} <Source id="fao-etc-method" sources={sources}/></p><p className="g-notice">{result.limitation} No yield, dollar impact, nitrogen credit or disease-break guarantee is generated.</p></section>}</div>
    <details className="g-data-drawer"><summary>Inspect data connections and provenance <span>{layers.layers.filter((layer)=>layer.status==='integrated').length} connected / {layers.layers.length} listed</span></summary><div className="g-data-grid">{layers.layers.map((layer)=><section className="g-layer" key={layer.id}><strong>{layer.name}</strong><span className="g-tag">{layer.status==='integrated'?(context?.power?'Loaded on Dashboard':'Available on Dashboard'):'Not connected'}</span><p>{layer.resolution}</p><p>{layer.use}</p><Source id={layer.sourceId} sources={sources}/></section>)}</div></details>
  </div>;
}

export function GlobalCropMatrix(){
  const evidence=useEvidence(),[query,setQuery]=useState(''),[group,setGroup]=useState('all');
  if(!evidence.data)return <LoadState {...evidence}/>;
  const {catalog,sources}=evidence.data;
  const rows=catalog.crops.filter((c)=>(group==='all'||c.group===group)&&`${c.name} ${c.group}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="global-ui g-panel mt-6"><header className="g-heading"><p className="g-eyebrow">GLOBAL REFERENCE MATRIX</p><h3>{catalog.crops.length} crops. Visible evidence gaps.</h3><p>{catalog.scope}</p></header><div className="grid gap-4 md:grid-cols-2"><label className="g-field">Search the global matrix<input type="search" value={query} onChange={(e)=>setQuery(e.target.value)}/></label><label className="g-field">Crop group<select value={group} onChange={(e)=>setGroup(e.target.value)}><option value="all">All groups</option>{[...new Set(catalog.crops.map((c)=>c.group))].map((g)=><option key={g}>{g}</option>)}</select></label></div><p role="status" className="g-support">{rows.length} matching reference entries · none approved for global recommendations</p><p className="g-notice">{catalog.limitations}</p><div className="g-table-scroll" role="region" tabIndex="0" aria-label="Global crop evidence matrix"><table><caption>Reference water ranges are context, not net irrigation prescriptions.</caption><thead><tr><th>Crop / group</th><th>Reference ET · mm/growing period</th><th>Trait review & source</th></tr></thead><tbody>{rows.map((c)=><tr key={c.id}><th scope="row">{c.name}<small>{c.group}</small></th><td className="g-number">{c.waterMm?`${c.waterMm.min}–${c.waterMm.max}`:'Not reviewed'}</td><td><details><summary>Inspect evidence gaps</summary><p>N fixation/scavenging kg/ha: unreviewed. Root architecture: unreviewed. Nematode/fungal breaks: unreviewed. Local pH compatibility: unreviewed.</p><p>Review status: research-only. Global suitability: unvalidated.</p><Source id={c.sourceIds[0]} sources={sources}/></details></td></tr>)}{!rows.length&&<tr><td colSpan="3">No crops match these filters.</td></tr>}</tbody></table></div></div>;
}

export function EvidenceViews(){
  const evidence=useEvidence(),[view,setView]=useState('executive');
  if(!evidence.data)return <LoadState {...evidence}/>;
  const {trials,sources}=evidence.data;
  const value=(b)=> b.kind==='treatment-difference'?`${Number((b.treatment-b.comparator).toFixed(3))} ${b.unit} treatment difference`:b.kind==='reported-rate'?`${b.value} ${b.unit}`:'Not quantified';
  return <div className="global-ui g-panel mb-6"><header className="g-heading"><p className="g-eyebrow">EVIDENCE / TWO READING LEVELS</p><h3>What do the trials actually show?</h3><p>Study sites remain visible. A trial elsewhere is not a forecast for your field.</p></header><div className="flex flex-wrap gap-3" role="group" aria-label="Evidence reading level"><button className="g-button" aria-pressed={view==='executive'} onClick={()=>setView('executive')}>Executive Agronomy</button><button className="g-button" aria-pressed={view==='scientific'} onClick={()=>setView('scientific')}>Deep Scientific Trial Data</button></div><p className="g-notice">Dollar impact: unavailable. Local costs, prices and transferable yield effects are not established. Missing p-values and sample sizes are not invented.</p><div className="grid gap-4 lg:grid-cols-2">{trials.benchmarks.map((b)=><article className="g-check" key={b.id}><p className="g-eyebrow">{b.location}</p><h4>{b.metric}</h4><p className="g-number">{value(b)}</p><p>{b.treatmentLabel}{b.comparatorLabel?` versus ${b.comparatorLabel}`:''}</p><p className="g-support">{b.period} · {b.depth}</p>{view==='scientific'?<><p>{b.design}</p><p>Replicates: {b.sampleSize??'not extracted'} · p-value: not extracted</p><p>{b.sourceLocator}</p><p>{b.confidence} evidence confidence · research-only</p></>:<p>{b.kind==='treatment-difference'?'This is a difference between trial treatments, not a predicted change for your field.':b.kind==='reported-rate'?'This is the study’s reported annual carbon rate, not a SOM percentage-point gain.':'The available evidence does not support a numeric estimate here.'}</p>}<p>{b.limitation}</p><Source id={b.sourceId} sources={sources}/></article>)}</div></div>;
}

for(const [id,View] of [['globalPlanner',GlobalPlanner],['globalMatrix',GlobalCropMatrix],['evidenceViews',EvidenceViews]]){
  const node=document.getElementById(id);
  if(node)createRoot(node).render(<Boundary><View/></Boundary>);
}
