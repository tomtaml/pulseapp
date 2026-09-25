const params = new URLSearchParams(location.search);
const variant = params.get("variant");
if (!variant || !["gr-prosumer", "uk-v2h"].includes(variant)) {
  const target = new URL("/v13-fleet.html", location.origin);
  target.search = location.search;
  target.searchParams.set("variant", "fi-fleet");
  for (const key of ["ops", "dev", "synthetic"]) target.searchParams.delete(key);
  location.replace(target.href);
} else {
  import("./v13-app.js");
}
