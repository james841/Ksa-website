// Kept apart from lib/lite.ts (a client module) so the server layout can inline it.
/** Tiny script for <head>: sets <html data-lite> before the page paints. */
export const liteBootScript = `try{var v=localStorage.getItem("ksa-lite"),c=navigator.connection||{};if(v==="1"||(v!=="0"&&(c.saveData||c.effectiveType==="2g"||c.effectiveType==="slow-2g")))document.documentElement.setAttribute("data-lite","")}catch(e){}`;
