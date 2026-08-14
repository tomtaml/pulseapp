// v1.3.3 utility stability shim.
// The legacy utility renderer rebuilds the full dashboard every 2 s. Keep its
// initial render and manual refresh behavior, but slow only that named refresh
// interval. The small shared-clock control continues polling independently.
const nativeSetInterval=window.setInterval.bind(window);
window.setInterval=(fn,delay,...args)=>{
  const ms=Number(delay);
  if(ms===2000&&typeof fn==='function'&&fn.name==='refresh')return nativeSetInterval(fn,10000,...args);
  return nativeSetInterval(fn,delay,...args);
};
