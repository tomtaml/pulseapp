const APP_VERSION = "0.4.0";
const JSON_HEADERS = {"content-type":"application/json; charset=utf-8","cache-control":"no-store, max-age=0"};
const MAX_BODY_BYTES = 24000;
const ALLOWED_VARIANTS = new Set(["fi-fleet","fi-citizen","uk-v2h"]);
const ALLOWED_GROUPS = new Set(["fleet_driver","dispatcher","fleet_manager","citizen","accessibility_representative","road_user","other"]);
const PII_KEYS = new Set([
  "name","full_name","first_name","last_name","email","phone","telephone","address","street_address","postal_address","postcode","zip",
  "social_security_number","employer","employer_name","company","company_name","organisation","organization","vehicle_id","vin","license_plate",
  "registration_number","gps","latitude","longitude","lat","long","location"
]);

function securityHeaders(response) {
  const h = new Headers(response.headers);
  h.set("X-Content-Type-Options","nosniff");
  h.set("X-Frame-Options","DENY");
  h.set("Referrer-Policy","no-referrer");
  h.set("Permissions-Policy","camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  h.set("Cross-Origin-Opener-Policy","same-origin");
  h.set("Cross-Origin-Resource-Policy","same-origin");
  h.set("Content-Security-Policy","default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; connect-src 'self' https://challenges.cloudflare.com; style-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});
}
function json(data,status=200){return securityHeaders(new Response(JSON.stringify(data),{status,headers:JSON_HEADERS}));}
function integerInRange(v,min,max){const n=Number(v);return Number.isInteger(n)&&n>=min&&n<=max?n:null;}
function avg(values){const n=values.map(Number).filter(Number.isFinite);return n.length?n.reduce((a,b)=>a+b,0)/n.length:null;}
function susScore(values){if(!Array.isArray(values)||values.length!==10)return null;const n=values.map(v=>integerInRange(v,1,5));if(n.some(v=>v===null))return null;return n.reduce((s,v,i)=>s+(i%2===0?v-1:5-v),0)*2.5;}
function safeString(v,max=1000){return typeof v==="string"?v.slice(0,max):"";}
function validLikert(v){return integerInRange(v,1,5)!==null;}
function scrubObject(value,depth=0){
  if(depth>6)return null;
  if(Array.isArray(value))return value.slice(0,50).map(v=>scrubObject(v,depth+1));
  if(value&&typeof value==="object"){
    const out={};
    for(const[k,v]of Object.entries(value)){
      if(PII_KEYS.has(String(k).toLowerCase()))continue;
      out[k]=scrubObject(v,depth+1);
    }
    return out;
  }
  if(typeof value==="string")return value.slice(0,1000);
  if(typeof value==="number")return Number.isFinite(value)?value:null;
  if(typeof value==="boolean"||value===null)return value;
  return null;
}

async function verifyTurnstile(env,token){
  if(!env.TURNSTILE_SECRET_KEY)return {success:env.ENVIRONMENT!=="production",action:"pulse-workshop-submit",hostname:"local"};
  if(!token||typeof token!=="string"||token.length>2048)return {success:false};
  const form=new FormData();
  form.append("secret",env.TURNSTILE_SECRET_KEY);
  form.append("response",token);
  form.append("idempotency_key",crypto.randomUUID());
  const res=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:form});
  if(!res.ok)return {success:false};
  const result=await res.json();
  if(!result.success)return result;
  if(result.action&&result.action!=="pulse-workshop-submit")return {...result,success:false};
  const expected=safeString(env.TURNSTILE_EXPECTED_HOSTNAME,253).trim().toLowerCase();
  if(expected&&safeString(result.hostname,253).toLowerCase()!==expected)return {...result,success:false};
  return result;
}

function validateCommon(body){
  if(!body||typeof body!=="object"||Array.isArray(body))return "Invalid request.";
  if(!ALLOWED_VARIANTS.has(body.variant))return "Unknown study variant.";
  if(!ALLOWED_GROUPS.has(body.participant_group))return "Unknown participant group.";
  if(!/^[A-Za-z0-9_-]{1,32}$/.test(body.workshop_code||""))return "Invalid workshop code.";
  if(!["fi","en"].includes(body.language))return "Invalid language.";
  if(body.consent_confirmed!==true)return "Research notice/consent acknowledgement is required.";
  if(body.prototype_disclaimer_confirmed!==true)return "Prototype disclaimer acknowledgement is required.";
  if(!Array.isArray(body.comprehension_items)||body.comprehension_items.length!==3||body.comprehension_items.some(v=>typeof v!=="boolean"))return "Three comprehension items are required.";
  if(susScore(body.sus_values)===null)return "Ten valid SUS responses are required.";
  return null;
}

function validate(body){
  const common=validateCommon(body); if(common)return common;
  if(body.variant==="fi-fleet"){
    const likerts=["alignment_clarity","constraint_clarity","preuse_v2g_acceptance","energy_flow_clarity","trust_reliability","trust_predictability","control_confidence","failure_recovery_confidence","wireless_use_intention","v2g_acceptance_under_guarantees"];
    if(likerts.some(k=>!validLikert(body[k])))return "Missing or invalid fleet scale response.";
    if(!["fleet_policy","dispatcher","driver","shared"].includes(body.constraint_owner))return "Invalid constraint owner.";
    if(!["driver_each","fleet_preapproved","dispatcher","automatic_override"].includes(body.v2g_authorisation))return "Invalid V2G authorisation.";
    if(!["retry","override","support","alternative"].includes(body.fault_decision))return "Invalid fault decision.";
    if(!["driver","dispatcher","automatic","fleet_policy"].includes(body.fault_owner))return "Invalid fault owner.";
    if(body.cycle_completed!==true)return "Virtual cycle must be completed.";
  } else {
    const trust=[body.trust_1,body.trust_2,body.trust_3];
    if(trust.some(v=>!validLikert(v)))return "Three valid trust responses are required.";
    for(const key of ["accessibility_understanding","wireless_acceptance","bidirectional_participation"]){if(!validLikert(body[key]))return `Invalid ${key}.`;}
  }
  return null;
}

function researchPayload(body,env){
  const clean=scrubObject(body);
  const base={
    app_version:safeString(clean.app_version,20)||APP_VERSION,
    variant:clean.variant,workshop_code:clean.workshop_code,participant_group:clean.participant_group,language:clean.language,
    winter_condition:["clear","snow","slush"].includes(clean.winter_condition)?clean.winter_condition:null,
    current_soc:integerInRange(clean.current_soc,5,100),minimum_soc:integerInRange(clean.minimum_soc,10,100),
    departure_time:/^([01]\d|2[0-3]):[0-5]\d$/.test(clean.departure_time||"")?clean.departure_time:null,
    dwell_minutes:integerInRange(clean.dwell_minutes,15,480),comprehension_items:clean.comprehension_items,
    sus_values:Array.isArray(clean.sus_values)?clean.sus_values.map(Number):[]
  };
  if(clean.variant==="fi-fleet")Object.assign(base,{
    alignment_method:["guided","auto"].includes(clean.alignment_method)?clean.alignment_method:null,
    alignment_clarity:integerInRange(clean.alignment_clarity,1,5),constraint_owner:clean.constraint_owner,
    constraint_clarity:integerInRange(clean.constraint_clarity,1,5),v2g_authorisation:clean.v2g_authorisation,
    preuse_v2g_acceptance:integerInRange(clean.preuse_v2g_acceptance,1,5),cycle_completed:clean.cycle_completed===true,
    cycle_overridden:clean.cycle_overridden===true,cycle_energy_to_vehicle:Number(clean.cycle_energy_to_vehicle)||null,
    cycle_energy_to_grid:Number(clean.cycle_energy_to_grid)||null,cycle_net_energy:Number(clean.cycle_net_energy)||null,
    energy_flow_clarity:integerInRange(clean.energy_flow_clarity,1,5),fault_decision:clean.fault_decision,fault_owner:clean.fault_owner,
    trust_reliability:integerInRange(clean.trust_reliability,1,5),trust_predictability:integerInRange(clean.trust_predictability,1,5),
    control_confidence:integerInRange(clean.control_confidence,1,5),failure_recovery_confidence:integerInRange(clean.failure_recovery_confidence,1,5),
    wireless_use_intention:integerInRange(clean.wireless_use_intention,1,5),v2g_acceptance_under_guarantees:integerInRange(clean.v2g_acceptance_under_guarantees,1,5)
  });
  else Object.assign(base,{
    alignment_clarity:integerInRange(clean.alignment_clarity,1,5),preuse_v2g_acceptance:integerInRange(clean.preuse_v2g_acceptance,1,5),
    energy_flow_clarity:integerInRange(clean.energy_flow_clarity,1,5),fault_decision:clean.fault_decision,
    trust_1:integerInRange(clean.trust_1,1,5),trust_2:integerInRange(clean.trust_2,1,5),trust_3:integerInRange(clean.trust_3,1,5),
    accessibility_understanding:integerInRange(clean.accessibility_understanding,1,5),wireless_acceptance:integerInRange(clean.wireless_acceptance,1,5),
    bidirectional_participation:integerInRange(clean.bidirectional_participation,1,5)
  });
  if(env.FREE_TEXT_ENABLED==="true")base.optional_note=safeString(clean.optional_note,500);
  return base;
}

async function handleSubmit(request,env){
  if(env.COLLECTION_ENABLED!=="true")return json({ok:false,error:"Collection is disabled until ethics/deployment approval."},503);
  if(!env.DB)return json({ok:false,error:"Research database is not configured."},503);
  if(!(request.headers.get("content-type")||"").toLowerCase().includes("application/json"))return json({ok:false,error:"JSON required."},415);
  const raw=await request.text();
  if(new TextEncoder().encode(raw).byteLength>MAX_BODY_BYTES)return json({ok:false,error:"Submission too large."},413);
  let body;try{body=JSON.parse(raw);}catch{return json({ok:false,error:"Malformed JSON."},400);}
  const problem=validate(body);if(problem)return json({ok:false,error:problem},400);
  const turnstile=await verifyTurnstile(env,body.turnstile_token);if(!turnstile.success)return json({ok:false,error:"Human verification failed. Please retry."},403);
  const clean=researchPayload(body,env);
  const comprehension=clean.comprehension_items.filter(Boolean).length;
  const sus=susScore(clean.sus_values);
  const trust=clean.variant==="fi-fleet"?avg([clean.trust_reliability,clean.trust_predictability,clean.control_confidence,clean.failure_recovery_confidence]):avg([clean.trust_1,clean.trust_2,clean.trust_3]);
  const accessibility=clean.variant==="fi-fleet"?null:clean.accessibility_understanding;
  const wireless=clean.variant==="fi-fleet"?clean.wireless_use_intention:clean.wireless_acceptance;
  const bidirectional=clean.variant==="fi-fleet"?clean.v2g_acceptance_under_guarantees:clean.bidirectional_participation;
  const id=crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO submissions (id,app_version,variant,workshop_code,participant_group,language,comprehension_score,sus_completed,sus_score,trust_score,accessibility_understanding,wireless_acceptance,bidirectional_participation,payload_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(id,clean.app_version,clean.variant,clean.workshop_code,clean.participant_group,clean.language,comprehension,1,sus,trust,accessibility,wireless,bidirectional,JSON.stringify(clean)).run();
  return json({ok:true,submission_id:id});
}

export default {async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==="/api/config"&&request.method==="GET")return json({collection_enabled:env.COLLECTION_ENABLED==="true",free_text_enabled:env.FREE_TEXT_ENABLED==="true",turnstile_site_key:env.TURNSTILE_SITE_KEY||null,environment:env.ENVIRONMENT||"unknown",app_version:APP_VERSION});
  if(url.pathname==="/api/health"&&request.method==="GET")return json({ok:true,version:APP_VERSION,collection_enabled:env.COLLECTION_ENABLED==="true"});
  if(url.pathname==="/api/submit"&&request.method==="POST")return handleSubmit(request,env);
  if(url.pathname.startsWith("/api/"))return json({ok:false,error:"Not found."},404);
  return securityHeaders(await env.ASSETS.fetch(request));
}};
