const uv12=new URLSearchParams(location.search);
const uv12Workshop=(uv12.get("workshop")||"TAMPERE-S4").replace(/[^A-Za-z0-9_-]/g,"").slice(0,32)||"TAMPERE-S4";
const uv12Fi=()=>document.documentElement.lang==="fi";
const uv12Esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
const uv12State=s=>uv12Fi()?({DOCKING:"Saapuminen / telakoituminen",ALIGNING:"Kohdistus",READY:"Valmis lataukseen",CHARGING:"Lataus",V2G_AVAILABLE:"V2G-jousto saatavilla",V2G_ACTIVE:"V2G aktiivinen",RECHARGING:"Jälkilataus",READY_TO_DEPART:"Lähtövalmis",FAULT:"Häiriö",OVERRIDDEN:"Ohitettu"}[s]||s):({DOCKING:"Docking",ALIGNING:"Aligning",READY:"Ready to charge",CHARGING:"Charging",V2G_AVAILABLE:"V2G available",V2G_ACTIVE:"V2G active",RECHARGING:"Recharging",READY_TO_DEPART:"Ready to depart",FAULT:"Fault",OVERRIDDEN:"Overridden"}[s]||s);

async function uv12Render(){
  try{
    const r=await fetch(`/api/charging/utility-summary?workshop=${encodeURIComponent(uv12Workshop)}`,{cache:"no-store",credentials:"same-origin"});if(!r.ok)return;const d=await r.json();if(!d.registry_connected)return;
    const badge=document.getElementById("viewBadge");if(badge)badge.textContent="Utility / aggregator v1.2 shared registry";
    const safe=document.getElementById("safetyBadge");if(safe)safe.textContent="Shared mock · read-only";
    const dash=document.getElementById("dashboard");if(!dash)return;let panel=document.getElementById("v12OperationalDetails");if(!panel){panel=document.createElement("section");panel.id="v12OperationalDetails";panel.className="panel";dash.append(panel);}
    const rows=(d.sessions||[]).map(s=>`<tr><td><strong>${uv12Esc(s.session_ref)}</strong><br><small>${uv12Esc(uv12Fi()?s.archetype_label_fi:s.archetype_label_en)}</small></td><td>${uv12Esc(uv12State(s.state))}</td><td>${Number(s.soc_percent||0).toFixed(0)}%</td><td>${Number(s.route_need_soc_percent||0).toFixed(0)}%</td><td><strong>${Number(s.protected_soc_percent||0).toFixed(0)}%</strong></td><td>${Number(s.route_km||0).toFixed(0)} km</td><td>${Number(s.dwell_minutes||0).toFixed(0)} min</td><td>${Number(s.v2g_window_minutes||0).toFixed(0)} min</td></tr>`).join("");
    panel.innerHTML=`<div class="section-head"><div><h2>${uv12Fi()?"QR-istuntojen operatiivinen vaihtelu":"Operational variation in QR sessions"}</h2><p>${uv12Fi()?"Reitti- ja SoC-arvot ovat satunnaistettuja työpajaprofiileja. Kenttäpilotissa ne korvataan ajoneuvon ja ajojärjestelyn todellisilla rajoilla.":"Route and SoC values are randomized workshop profiles. In the field pilot they will be replaced by real vehicle and dispatch constraints."}</p></div><span class="badge">${(d.sessions||[]).length} ${uv12Fi()?"jaettua istuntoa":"shared sessions"}</span></div>${rows?`<div class="table-wrap"><table><thead><tr><th>${uv12Fi()?"Istunto / profiili":"Session / profile"}</th><th>${uv12Fi()?"Tila":"State"}</th><th>SoC</th><th>${uv12Fi()?"Reittitarve":"Route need"}</th><th>${uv12Fi()?"Suojattu":"Protected"}</th><th>${uv12Fi()?"Reitti":"Route"}</th><th>${uv12Fi()?"Pysähdys":"Dwell"}</th><th>V2G</th></tr></thead><tbody>${rows}</tbody></table></div>`:`<p>${uv12Fi()?"Ei vielä QR-istuntoja. Avaa kuljettajan testilinkki parametrilla ops=1.":"No QR sessions yet. Open the driver test link with ops=1."}</p>`}`;
  }catch{}
}
setInterval(uv12Render,2000);setTimeout(uv12Render,400);
