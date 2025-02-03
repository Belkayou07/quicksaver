(()=>{"use strict";const e={"amazon.com.au":{currency:"AUD",language:"en-AU",region:"Australia"},"amazon.com.be":{currency:"EUR",language:"nl-BE",region:"Belgium"},"amazon.com.br":{currency:"BRL",language:"pt-BR",region:"Brazil"},"amazon.ca":{currency:"CAD",language:"en-CA",region:"Canada"},"amazon.cn":{currency:"CNY",language:"zh-CN",region:"China"},"amazon.eg":{currency:"EGP",language:"ar-EG",region:"Egypt"},"amazon.fr":{currency:"EUR",language:"fr-FR",region:"France"},"amazon.de":{currency:"EUR",language:"de-DE",region:"Germany"},"amazon.in":{currency:"INR",language:"en-IN",region:"India"},"amazon.it":{currency:"EUR",language:"it-IT",region:"Italy"},"amazon.co.jp":{currency:"JPY",language:"ja-JP",region:"Japan"},"amazon.com.mx":{currency:"MXN",language:"es-MX",region:"Mexico"},"amazon.nl":{currency:"EUR",language:"nl-NL",region:"Netherlands"},"amazon.pl":{currency:"PLN",language:"pl-PL",region:"Poland"},"amazon.sa":{currency:"SAR",language:"ar-SA",region:"Saudi Arabia"},"amazon.sg":{currency:"SGD",language:"en-SG",region:"Singapore"},"amazon.es":{currency:"EUR",language:"es-ES",region:"Spain"},"amazon.se":{currency:"SEK",language:"sv-SE",region:"Sweden"},"amazon.com.tr":{currency:"TRY",language:"tr-TR",region:"Turkey"},"amazon.ae":{currency:"AED",language:"ar-AE",region:"UAE"},"amazon.co.uk":{currency:"GBP",language:"en-GB",region:"United Kingdom"},"amazon.com":{currency:"USD",language:"en-US",region:"United States"}};class a{constructor(){this.rates={},this.lastUpdate=0,this.UPDATE_INTERVAL=36e5,this.initializeDefaultRates()}static getInstance(){return a.instance||(a.instance=new a),a.instance}initializeDefaultRates(){this.rates={EUR:1,USD:1.09,GBP:.85,JPY:158,AUD:1.65,CAD:1.46,CHF:.93,CNY:7.82,INR:90.5,BRL:5.35,MXN:18.5,PLN:4.33,SEK:11.3,TRY:33.2,AED:4,SAR:4.1,SGD:1.46,EGP:33.6}}async updateRates(){try{const e=Date.now();if(e-this.lastUpdate<this.UPDATE_INTERVAL)return;this.initializeDefaultRates(),this.lastUpdate=e,await chrome.storage.local.set({exchangeRates:this.rates,lastRatesUpdate:this.lastUpdate})}catch(e){console.error("Error updating exchange rates:",e);const{exchangeRates:a,lastRatesUpdate:t}=await chrome.storage.local.get(["exchangeRates","lastRatesUpdate"]);a&&(this.rates=a,this.lastUpdate=t)}}async convert(e,a,t){if(await this.updateRates(),a===t)return e;const r="EUR"===a?e:e/(this.rates[a]||1),n="EUR"===t?r:r*(this.rates[t]||1);return Math.round(100*n)/100}async getRate(e,a){if(await this.updateRates(),e===a)return 1;const t=this.rates[e]||1;return(this.rates[a]||1)/t}getSupportedCurrencies(){return Object.keys(this.rates)}}class t{constructor(){this.cache=new Map,this.pricePatterns=[/"price":\s*"?(\d+[.,]\d{2})"?/,/"priceAmount":\s*"?(\d+[.,]\d{2})"?/,/"priceTotal":\s*\{\s*"text":\s*"[^"]*?(\d+[.,]\d{2})"?/,/data-price="(\d+[.,]\d{2})"/,/data-a-price-whole[^>]+>(\d+)<[^>]+>([.,]\d{2})</],this.currencyConverter=a.getInstance()}async comparePrice(a){console.log("Starting price comparison for product:",a);const r=Object.keys(e).filter((e=>e!==a.marketplace)).map((e=>{const r=`${a.asin}-${e}`,n=this.cache.get(r);return n&&Date.now()-n.timestamp<t.CACHE_DURATION?(console.log("Using cached data for",e),Promise.resolve(n.data)):this.fetchWithRetry(a.asin,e)})),n=(await Promise.all(r.map((e=>Promise.race([e,new Promise((e=>setTimeout((()=>e(null)),t.TIMEOUT)))]))))).filter((e=>null!==e));console.log("Valid results:",n.length);const c=(await Promise.all(n.map((async e=>({...e,convertedPrice:await this.currencyConverter.convert(e.currentPrice,e.currency,a.currency)}))))).sort(((e,a)=>(e.convertedPrice||1/0)-(a.convertedPrice||1/0))),o=c[0],s=o?a.currentPrice-o.convertedPrice:0;return{original:a,alternatives:c,bestPrice:o||null,priceDifference:s,lastUpdated:Date.now()}}async fetchWithRetry(e,a,r=0){try{const n=await this.fetchFromMarketplace(e,a);if(!n&&r<t.MAX_RETRIES)return console.log(`Retrying ${a}, attempt ${r+1}`),await new Promise((e=>setTimeout(e,t.RETRY_DELAY))),this.fetchWithRetry(e,a,r+1);if(n){const t=`${e}-${a}`;this.cache.set(t,{data:n,timestamp:Date.now()}),console.log("Fetched and cached data for",a)}return n}catch(e){return console.error(`Error in fetchWithRetry for ${a}:`,e),null}}async fetchFromMarketplace(a,t){try{const r=e[t],n=`https://www.${t}/dp/${a}`;console.log("Fetching from marketplace:",t,n);const c=await fetch(n,{headers:{Accept:"text/html","Accept-Language":r.language,"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"},credentials:"omit"});if(!c.ok)return console.log("Failed to fetch from",t,c.status),null;const o=await c.text();let s=null;for(const e of this.pricePatterns){const a=o.match(e);if(a){s=3===a.length?parseFloat(`${a[1]}.${a[2].replace(",",".")}`):parseFloat(a[1].replace(",","."));break}}if(!s)return console.log("No price found for",t),null;const i=/"product-title"[^>]*>([^<]+)<|productTitle"[^>]*>([^<]+)</,l=o.match(i),g={asin:a,title:l?(l[1]||l[2]).trim():"",currentPrice:s,currency:r.currency,marketplace:t,url:n};return console.log("Successfully extracted product from",t,g),g}catch(e){return console.error(`Error fetching from ${t}:`,e),null}}}t.TIMEOUT=8e3,t.RETRY_DELAY=1e3,t.MAX_RETRIES=1,t.CACHE_DURATION=18e5;const r=new t,n=new Map,c=18e5;chrome.runtime.onMessage.addListener(((a,t,o)=>(console.log("Background script received message:",a),(async()=>{try{switch(a.type){case"COMPARE_PRICES":{console.log("Processing price comparison for:",a.payload);const t=a.payload;if(!t||!t.asin||!t.marketplace)throw new Error("Invalid product data received");const s=await async function(e){const{[`comparison-${e.asin}`]:a}=await chrome.storage.local.get(`comparison-${e.asin}`);return a&&Date.now()-a.timestamp<c?(console.log("Using cached comparison"),a.data):null}(t);if(s)return o(s),void async function(a){const t=Object.keys(e).filter((e=>e!==a.marketplace)).map((async e=>{try{const t=`${a.asin}-${e}`,o=n.get(t);if(o&&Date.now()-o.timestamp<c)return o.data;const s=await r.fetchFromMarketplace(a.asin,e);return s&&n.set(t,{data:s,timestamp:Date.now()}),s}catch(a){return console.error(`Error preloading price for ${e}:`,a),null}}));await Promise.all(t)}(t);const i=await r.comparePrice(t);if(console.log("Comparison result:",i),!i||!i.alternatives)throw new Error("Invalid comparison result");await chrome.storage.local.set({[`comparison-${t.asin}`]:{data:i,timestamp:Date.now()}}),o(i);break}case"UPDATE_SETTINGS":console.log("Updating settings:",a.payload),await chrome.storage.local.set({settings:a.payload}),o({success:!0});break;case"GET_EXCHANGE_RATES":{const{exchangeRates:e}=await chrome.storage.local.get("exchangeRates");(!e||Date.now()-e.timestamp>36e5)&&await async function(){try{const e=await fetch("https://api.exchangerate-api.com/v4/latest/USD"),a=await e.json();await chrome.storage.local.set({exchangeRates:{rates:a.rates,timestamp:Date.now()}})}catch(e){console.error("Failed to preload exchange rates:",e)}}(),o({success:!0,rates:e?.rates||{}});break}default:console.warn("Unknown message type:",a.type),o({error:"Unknown message type"})}}catch(e){console.error("Error in background script:",e),o({error:e instanceof Error?e.message:"An unexpected error occurred",success:!1})}})(),!0))),chrome.alarms.create("checkPrices",{periodInMinutes:30}),chrome.alarms.create("cleanupCache",{periodInMinutes:60}),chrome.alarms.onAlarm.addListener((async e=>{if("checkPrices"===e.name)try{const{savedProducts:e}=await chrome.storage.local.get("savedProducts");if(!e)return;for(const a of e){if(!a||!a.marketplace||!a.asin){console.error("Invalid saved product:",a);continue}const e=await r.comparePrice(a);e.priceDifference>0&&chrome.notifications.create({type:"basic",iconUrl:"assets/icon128.png",title:"Price Drop Alert!",message:`The price for ${a.title} has dropped by ${e.priceDifference.toFixed(2)} ${a.currency}`})}}catch(e){console.error("Error checking prices:",e instanceof Error?e.message:"Unknown error")}else if("cleanupCache"===e.name)for(const[e,a]of n.entries())Date.now()-a.timestamp>c&&n.delete(e)})),chrome.action.onClicked.addListener((async e=>{e.id&&await chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:!0})})),chrome.runtime.onInstalled.addListener((async()=>{await chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:!0})}))})();
//# sourceMappingURL=background.js.map