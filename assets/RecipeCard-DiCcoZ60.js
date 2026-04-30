import{n as l,e as r,f as E,h as P}from"./index-BaTPcIjR.js";import{I as y,G as R,S as U}from"./matching-BeUiPW45.js";function Q(t,n){const e=l(t);for(const i of n){const a=l(i),o=y[a];if(o&&o.some(s=>l(s)===e))return i}const c=y[e];if(c){for(const i of c)if(n.some(a=>l(a)===l(i)))return i}return null}function W(t){return t>=80?"hi":t>=40?"md":"lo"}const h=new Map;for(const[t,n]of Object.entries(R))h.set(l(t),n);const M=new Set(["almond flour","oat flour","rice flour","coconut flour","chickpea flour","buckwheat flour","cassava flour","tapioca flour","brown rice flour","gluten-free flour","gf flour","cornstarch","arrowroot powder","arrowroot starch","potato starch","tapioca starch","corn tortilla","rice noodles","rice paper","rice paper wrappers","tamari","coconut aminos","gf breadcrumbs","gf panko","gf pasta"].map(l));function Y(t){const n=l(t);if(M.has(n))return null;for(const a of M)if(n.includes(a))return null;const e=h.get(n);if(e)return e;let c=null,i=0;for(const[a,o]of h)n.includes(a)&&a.length>3&&a.length>i&&(c=o,i=a.length);return c}const $=new Map;for(const[t,n]of Object.entries(U))$.set(l(t),n);function z(t){const n=l(t),e=$.get(n);if(e)return e;for(const[c,i]of $)if(n.includes(c)&&c.length>3)return i;return null}function L(t,n){const e=E(P(t)),c=Y(t),i=z(t),a=c?`<span class="gf-swap">GF: ${r(c)}</span>`:"",o=i?`<span class="sf-swap">${r(e)} swap: ${r(i)} to significantly reduce calories/carbs</span>`:"";return`<span class="${n}${c?" c-gluten":i?" c-sugar":""}">${r(e)}${a}${o}</span>`}function B(t,n={}){var w;const{showMatch:e=!0,isFavorite:c=!1,isOnMakeList:i=!1,cookedDates:a=[],userIngs:o=[]}=n,s=t,b=W(s.pct),C=s.img?" has-hero":"",T=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${r(s.img)}" alt="${r(s.title)}"></div>`:"",j=e&&s.pct!==void 0?`<span class="match-pill ${b}">${s.pct}%</span>`:"",x=s.time?`<span>⏱ ${s.time} min</span>`:"",F=s.servings?`<span>👤 ${s.servings} servings</span>`:"",p=s.nut||{},H=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${p.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${p.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${p.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${p.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${p.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",m=s.cats||[],I=m.length?`<div class="card-cats">${m.map(d=>`<span class="card-cat">${r(d)}</span>`).join("")}</div>`:"",v=s.haveNames||[],f=s.needNames||[],N=v.length?`<div class="chip-label-sm">You have</div><div class="chips">${v.map(d=>L(d,"c-have")).join("")}</div>`:"",_=f.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${f.map(d=>L(d,"c-need")).join("")}</div>`:"",k=f.length===1&&o.length?Q(f[0],o):null,D=k?`<div class="sub-hint">💡 Try ${r(k)} instead of ${r(f[0])}</div>`:"",G=c?"❤️ Favorited":"🤍 Favorite",O=i?"✓ My Queue":"📌 My Queue",u=a.length?a[a.length-1]:null;let g;if(u){const d=new Date(typeof u=="string"?u:u.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),S=typeof u=="object"?u.rating:0,A=S?" "+"★".repeat(S):"";g=`✅ Made ${d}${A}`}else g="☐ I Made This";return`
    <article class="r-card ${b}${C}" data-recipe-id="${s.id}">
      ${T}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${r(s.title)}</div>
            <div class="r-site">${r(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${j}
          </div>
        </div>
        ${e?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${x}${F}
          <span>✅ ${v.length}/${((w=s.ing)==null?void 0:w.length)??0} ingredients</span>
        </div>
        ${H}
        ${I}
        ${N}
        ${_}
        ${D}
        <div class="r-actions">
          ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${r(s.url)}" data-recipe-title="${r(s.title)}" data-recipe-site="${r(s.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${i?" on":""}" data-make-id="${s.id}">${O}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}">${g}</button>
          <button class="btn-sm btn-fav fav-btn${c?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${G}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${r(s.title)}" data-share-url="${r(s.url||"")}">📤 Share</button>
        </div>
      </div>
    </article>
  `}function J(t,n,e={}){if(!t.length)return"";const c=e.makelist?new Set(e.makelist):new Set,i=e.cookHistory||[];return t.map(a=>{const o=i.filter(s=>s.id===a.id);return B(a,{...e,isFavorite:n.has(a.id),isOnMakeList:c.has(a.id),cookedDates:o})}).join("")}export{Q as f,Y as g,J as r,z as s};
