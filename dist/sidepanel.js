/*! For license information please see sidepanel.js.LICENSE.txt */
(()=>{function t(e){return t="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},t(e)}function e(){"use strict";e=function(){return r};var n,r={},o=Object.prototype,a=o.hasOwnProperty,i=Object.defineProperty||function(t,e,n){t[e]=n.value},c="function"==typeof Symbol?Symbol:{},s=c.iterator||"@@iterator",u=c.asyncIterator||"@@asyncIterator",l=c.toStringTag||"@@toStringTag";function f(t,e,n){return Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{f({},"")}catch(n){f=function(t,e,n){return t[e]=n}}function p(t,e,n,r){var o=e&&e.prototype instanceof w?e:w,a=Object.create(o.prototype),c=new R(r||[]);return i(a,"_invoke",{value:j(t,n,c)}),a}function h(t,e,n){try{return{type:"normal",arg:t.call(e,n)}}catch(t){return{type:"throw",arg:t}}}r.wrap=p;var d="suspendedStart",v="suspendedYield",y="executing",g="completed",m={};function w(){}function E(){}function b(){}var L={};f(L,s,(function(){return this}));var x=Object.getPrototypeOf,S=x&&x(x(A([])));S&&S!==o&&a.call(S,s)&&(L=S);var k=b.prototype=w.prototype=Object.create(L);function O(t){["next","throw","return"].forEach((function(e){f(t,e,(function(t){return this._invoke(e,t)}))}))}function _(e,n){function r(o,i,c,s){var u=h(e[o],e,i);if("throw"!==u.type){var l=u.arg,f=l.value;return f&&"object"==t(f)&&a.call(f,"__await")?n.resolve(f.__await).then((function(t){r("next",t,c,s)}),(function(t){r("throw",t,c,s)})):n.resolve(f).then((function(t){l.value=t,c(l)}),(function(t){return r("throw",t,c,s)}))}s(u.arg)}var o;i(this,"_invoke",{value:function(t,e){function a(){return new n((function(n,o){r(t,e,n,o)}))}return o=o?o.then(a,a):a()}})}function j(t,e,r){var o=d;return function(a,i){if(o===y)throw Error("Generator is already running");if(o===g){if("throw"===a)throw i;return{value:n,done:!0}}for(r.method=a,r.arg=i;;){var c=r.delegate;if(c){var s=U(c,r);if(s){if(s===m)continue;return s}}if("next"===r.method)r.sent=r._sent=r.arg;else if("throw"===r.method){if(o===d)throw o=g,r.arg;r.dispatchException(r.arg)}else"return"===r.method&&r.abrupt("return",r.arg);o=y;var u=h(t,e,r);if("normal"===u.type){if(o=r.done?g:v,u.arg===m)continue;return{value:u.arg,done:r.done}}"throw"===u.type&&(o=g,r.method="throw",r.arg=u.arg)}}}function U(t,e){var r=e.method,o=t.iterator[r];if(o===n)return e.delegate=null,"throw"===r&&t.iterator.return&&(e.method="return",e.arg=n,U(t,e),"throw"===e.method)||"return"!==r&&(e.method="throw",e.arg=new TypeError("The iterator does not provide a '"+r+"' method")),m;var a=h(o,t.iterator,e.arg);if("throw"===a.type)return e.method="throw",e.arg=a.arg,e.delegate=null,m;var i=a.arg;return i?i.done?(e[t.resultName]=i.value,e.next=t.nextLoc,"return"!==e.method&&(e.method="next",e.arg=n),e.delegate=null,m):i:(e.method="throw",e.arg=new TypeError("iterator result is not an object"),e.delegate=null,m)}function P(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function N(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function R(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(P,this),this.reset(!0)}function A(e){if(e||""===e){var r=e[s];if(r)return r.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var o=-1,i=function t(){for(;++o<e.length;)if(a.call(e,o))return t.value=e[o],t.done=!1,t;return t.value=n,t.done=!0,t};return i.next=i}}throw new TypeError(t(e)+" is not iterable")}return E.prototype=b,i(k,"constructor",{value:b,configurable:!0}),i(b,"constructor",{value:E,configurable:!0}),E.displayName=f(b,l,"GeneratorFunction"),r.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===E||"GeneratorFunction"===(e.displayName||e.name))},r.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,b):(t.__proto__=b,f(t,l,"GeneratorFunction")),t.prototype=Object.create(k),t},r.awrap=function(t){return{__await:t}},O(_.prototype),f(_.prototype,u,(function(){return this})),r.AsyncIterator=_,r.async=function(t,e,n,o,a){void 0===a&&(a=Promise);var i=new _(p(t,e,n,o),a);return r.isGeneratorFunction(e)?i:i.next().then((function(t){return t.done?t.value:i.next()}))},O(k),f(k,l,"Generator"),f(k,s,(function(){return this})),f(k,"toString",(function(){return"[object Generator]"})),r.keys=function(t){var e=Object(t),n=[];for(var r in e)n.push(r);return n.reverse(),function t(){for(;n.length;){var r=n.pop();if(r in e)return t.value=r,t.done=!1,t}return t.done=!0,t}},r.values=A,R.prototype={constructor:R,reset:function(t){if(this.prev=0,this.next=0,this.sent=this._sent=n,this.done=!1,this.delegate=null,this.method="next",this.arg=n,this.tryEntries.forEach(N),!t)for(var e in this)"t"===e.charAt(0)&&a.call(this,e)&&!isNaN(+e.slice(1))&&(this[e]=n)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(t){if(this.done)throw t;var e=this;function r(r,o){return c.type="throw",c.arg=t,e.next=r,o&&(e.method="next",e.arg=n),!!o}for(var o=this.tryEntries.length-1;o>=0;--o){var i=this.tryEntries[o],c=i.completion;if("root"===i.tryLoc)return r("end");if(i.tryLoc<=this.prev){var s=a.call(i,"catchLoc"),u=a.call(i,"finallyLoc");if(s&&u){if(this.prev<i.catchLoc)return r(i.catchLoc,!0);if(this.prev<i.finallyLoc)return r(i.finallyLoc)}else if(s){if(this.prev<i.catchLoc)return r(i.catchLoc,!0)}else{if(!u)throw Error("try statement without catch or finally");if(this.prev<i.finallyLoc)return r(i.finallyLoc)}}}},abrupt:function(t,e){for(var n=this.tryEntries.length-1;n>=0;--n){var r=this.tryEntries[n];if(r.tryLoc<=this.prev&&a.call(r,"finallyLoc")&&this.prev<r.finallyLoc){var o=r;break}}o&&("break"===t||"continue"===t)&&o.tryLoc<=e&&e<=o.finallyLoc&&(o=null);var i=o?o.completion:{};return i.type=t,i.arg=e,o?(this.method="next",this.next=o.finallyLoc,m):this.complete(i)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),m},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var n=this.tryEntries[e];if(n.finallyLoc===t)return this.complete(n.completion,n.afterLoc),N(n),m}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var n=this.tryEntries[e];if(n.tryLoc===t){var r=n.completion;if("throw"===r.type){var o=r.arg;N(n)}return o}}throw Error("illegal catch attempt")},delegateYield:function(t,e,r){return this.delegate={iterator:A(t),resultName:e,nextLoc:r},"next"===this.method&&(this.arg=n),m}},r}function n(t,e,n,r,o,a,i){try{var c=t[a](i),s=c.value}catch(t){return void n(t)}c.done?e(s):Promise.resolve(s).then(r,o)}function r(t){return function(){var e=this,r=arguments;return new Promise((function(o,a){var i=t.apply(e,r);function c(t){n(i,o,a,c,s,"next",t)}function s(t){n(i,o,a,c,s,"throw",t)}c(void 0)}))}}document.addEventListener("DOMContentLoaded",(function(){var t=document.querySelectorAll(".tab"),n=document.querySelectorAll(".tab-content"),o=null,a="EUR";function i(){return(i=r(e().mark((function t(){var n,r;return e().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,fetch("https://api.exchangerate-api.com/v4/latest/EUR");case 3:return n=t.sent,t.next=6,n.json();case 6:r=t.sent,o=r.rates,console.log("Exchange rates loaded:",o),t.next=14;break;case 11:t.prev=11,t.t0=t.catch(0),console.error("Error fetching exchange rates:",t.t0);case 14:case"end":return t.stop()}}),t,null,[[0,11]])})))).apply(this,arguments)}function c(t,e){return new Intl.NumberFormat(void 0,{style:"currency",currency:e}).format(t)}!function(){i.apply(this,arguments)}(),navigator.geolocation&&navigator.geolocation.getCurrentPosition(function(){var t=r(e().mark((function t(n){var r,o;return e().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,fetch("https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=".concat(n.coords.latitude,"&longitude=").concat(n.coords.longitude));case 3:return r=t.sent,t.next=6,r.json();case 6:o=t.sent,a={UK:"GBP",SE:"SEK",FR:"EUR",BE:"EUR",NL:"EUR",DE:"EUR",IT:"EUR",ES:"EUR"}[o.countryCode]||"EUR",console.log("Detected user currency:",a),t.next=15;break;case 12:t.prev=12,t.t0=t.catch(0),console.error("Error detecting user location:",t.t0);case 15:case"end":return t.stop()}}),t,null,[[0,12]])})));return function(e){return t.apply(this,arguments)}}()),t.forEach((function(e){e.addEventListener("click",(function(){t.forEach((function(t){return t.classList.remove("active")})),n.forEach((function(t){return t.classList.remove("active")})),e.classList.add("active");var r=e.dataset.tab;document.getElementById(r).classList.add("active")}))}));var s=document.querySelector(".product-info"),u=s.querySelector(".loading"),l=s.querySelector(".content");chrome.runtime.onMessage.addListener((function(t,e,n){"UPDATE_PRODUCT_INFO"===t.type&&function(t){var e,n;if(u.classList.add("hidden"),t){var r,i=function(t,e,n){if(!o||e===n)return t;var r="EUR"===e?t:t/o[e];return"EUR"===n?r:r*o[n]}(t.price,t.currency,a),s=t.currency!==a?'<div class="original-price">('.concat(c(t.price,t.currency),")</div>"):"";l.innerHTML='\n      <div class="product-details">\n        <h3 class="product-title">'.concat(t.title,'</h3>\n        <div class="product-meta">\n          <div class="price-info">\n            <span class="label">Current Price:</span>\n            <span class="price">').concat(c(i,a),"</span>\n            ").concat(s,'\n          </div>\n          <div class="marketplace-info">\n            <span class="label">Marketplace:</span>\n            <span class="marketplace">Amazon ').concat(t.marketplace,'</span>\n          </div>\n          <div class="product-id">\n            <span class="label">ASIN:</span>\n            <span class="asin">').concat(t.asin,'</span>\n          </div>\n          <div class="shipping-status ').concat((r=null===(e=t.shippingAvailability)||void 0===e?void 0:e.canShip,!0===r?"shipping-available":!1===r?"shipping-unavailable":"shipping-unknown"),'">\n            <span class="label">Shipping:</span>\n            <span class="status">').concat((null===(n=t.shippingAvailability)||void 0===n?void 0:n.message)||"Unknown","</span>\n          </div>\n        </div>\n      </div>\n    ")}else l.innerHTML='\n        <div class="no-product">\n          <p>No Amazon product detected</p>\n          <p class="hint">Visit an Amazon product page to start comparing prices</p>\n        </div>\n      '}(t.data)})),u.classList.remove("hidden")}))})();