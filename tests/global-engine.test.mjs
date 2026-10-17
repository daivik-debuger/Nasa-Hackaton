import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolveGlobalZone,assessGlobalField,waterBudget,validateGlobalCatalog} from '../src/engine/global-engine.js';
const catalog=JSON.parse(await readFile(new URL('../data/global-crops.json',import.meta.url)));
const sources=JSON.parse(await readFile(new URL('../data/sources.json',import.meta.url))).sources;
const input={latitude:0,longitude:0,elevationM:'',koppen:'',irrigation:'unknown',texture:'',ph:'',som:'',annualRainMm:'',sequence:['maize','bean','wheat']};
test('global matrix has 30+ distinct source-linked references without invented traits',()=>{
  assert.ok(catalog.crops.length>=30);
  assert.deepEqual(validateGlobalCatalog(catalog,new Set(sources.map(s=>s.id))),[]);
});
test('coordinates across continents never select a country-specific crop or infer a climate',()=>{
  for(const [latitude,longitude]of [[41,-93],[-15,-47],[14,2],[28,77],[-31,117],[48,31],[0,0],[-90,180]]){
    const r=assessGlobalField({...input,latitude,longitude},catalog);
    assert.equal(r.zone.koppen,null);assert.deepEqual(r.zone.lenses,[]);
    assert.equal(r.recommendedSequence,null);assert.equal(r.predictedYield,null);
    assert.deepEqual(r.crops.map(c=>c.id),input.sequence);
  }
});
test('invalid and missing coordinates are rejected while zero is valid',()=>{
  for(const latitude of ['',null,true,NaN,91])assert.throws(()=>resolveGlobalZone({...input,latitude}));
  assert.equal(resolveGlobalZone(input).lat,0);
});
test('climate lenses depend on explicit class and irrigation, not longitude',()=>{
  assert.deepEqual(resolveGlobalZone({...input,koppen:'BSk'}).lenses,['dryland']);
  assert.deepEqual(resolveGlobalZone({...input,koppen:'Am',irrigation:'irrigated'}).lenses,['tropical','irrigated']);
  assert.deepEqual(resolveGlobalZone({...input,koppen:'Cfb'}).lenses,['temperate']);
  assert.deepEqual(resolveGlobalZone({...input,koppen:'EF'}).lenses,['cold-limited']);
  assert.throws(()=>resolveGlobalZone({...input,koppen:'Iowa'}));
  assert.equal(resolveGlobalZone({...input,koppen:'Am'}).classificationStatus,'user-supplied-unverified');
});
test('one SOM value is not a trend and missing soil data stay missing',()=>{
  const a=assessGlobalField(input,catalog);assert.equal(a.soil.som,null);
  const b=assessGlobalField({...input,som:0,ph:7},catalog);assert.equal(b.soil.som,0);
  assert.match(b.checks.find(c=>c.id==='soil').text,/not a trend/);
  assert.throws(()=>assessGlobalField({...input,ph:15},catalog));
  assert.throws(()=>assessGlobalField({...input,texture:'unknown invented class'},catalog));
});
test('sequence changes produce review questions, not N credits or disease guarantees',()=>{
  const r=assessGlobalField({...input,sequence:['maize','maize','bean']},catalog);
  assert.ok(r.checks.some(c=>c.id==='repeat-crop'));
  assert.ok(r.checks.some(c=>c.id==='nitrogen'));
  assert.ok(r.crops.every(c=>c.nFixationKgHa===null&&c.diseaseBreak===null));
  assert.throws(()=>assessGlobalField({...input,sequence:['invented']},catalog));
});
test('water arithmetic requires every seasonal input; missing is not zero',()=>{
  assert.equal(waterBudget({seasonEtcMm:500,effectiveRainMm:300}).uncoveredEtMm,null);
  assert.equal(waterBudget({seasonEtcMm:500,effectiveRainMm:300,netIrrigationMm:100}).uncoveredEtMm,100);
  assert.equal(waterBudget({seasonEtcMm:500,effectiveRainMm:600,netIrrigationMm:0}).uncoveredEtMm,0);
  assert.throws(()=>waterBudget({seasonEtcMm:-1}));
});
test('catalog validator rejects false approval, unknown sources and unsupported numbers',()=>{
  for(const edit of [c=>c.humanApproved=true,c=>c.nFixationKgHa=28,c=>c.sourceIds=['fake'],c=>c.waterMm.min=99999]){
    const bad=structuredClone(catalog);edit(bad.crops[0]);
    assert.ok(validateGlobalCatalog(bad,new Set(sources.map(s=>s.id))).length);
  }
});
test('global layers reference registered sources and do not claim planned services are connected',async()=>{
  const layers=JSON.parse(await readFile(new URL('../data/global-layers.json',import.meta.url))).layers;
  for(const layer of layers)assert.ok(sources.some(s=>s.id===layer.sourceId));
  assert.deepEqual(layers.filter(l=>l.status==='integrated').map(l=>l.id),['power']);
});
