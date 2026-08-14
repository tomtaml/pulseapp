const p132=new URLSearchParams(location.search);
const enabled132=(p132.get('variant')||'fi-fleet')==='fi-fleet'&&p132.get('ops')==='1';
if(enabled132){
  const workshop=(p132.get('workshop')||'DEMO').replace(/[^A-Za-z0-9_-]/g,'').slice(0,32)||'DEMO';
  const storageKey=`pulse-ops-v12:${workshop}`;
  if(sessionStorage.getItem(storageKey)){
    fetch(`/api/charging/utility-summary?workshop=${encodeURIComponent(workshop)}`,{cache:'no-store',credentials:'same-origin'})
      .then(r=>r.ok?r.json():null)
      .then(d=>{
        if(d?.utility_clock?.complete===true){
          sessionStorage.removeItem(storageKey);
          location.reload();
        }
      })
      .catch(()=>{});
  }
}
