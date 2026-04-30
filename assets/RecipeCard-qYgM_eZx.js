import{n as l,e as c,f as P,h as R}from"./index-BEdDk24S.js";import{I as y,G as U,S as Q}from"./matching-Ca6MRDtC.js";function W(a,t){const e=l(a);for(const r of t){const n=l(r),o=y[n];if(o&&o.some(s=>l(s)===e))return r}const i=y[e];if(i){for(const r of i)if(t.some(n=>l(n)===l(r)))return r}return null}function Y(a){return a>=80?"hi":a>=40?"md":"lo"}const h=new Map;for(const[a,t]of Object.entries(U))h.set(l(a),t);const M=new Set(["almond flour","oat flour","rice flour","coconut flour","chickpea flour","buckwheat flour","cassava flour","tapioca flour","brown rice flour","gluten-free flour","gf flour","cornstarch","arrowroot powder","arrowroot starch","potato starch","tapioca starch","corn tortilla","rice noodles","rice paper","rice paper wrappers","tamari","coconut aminos","gf breadcrumbs","gf panko","gf pasta"].map(l));function z(a){const t=l(a);if(M.has(t))return null;for(const n of M)if(t.includes(n))return null;const e=h.get(t);if(e)return e;let i=null,r=0;for(const[n,o]of h)t.includes(n)&&n.length>3&&n.length>r&&(i=o,r=n.length);return i}const m=new Map;for(const[a,t]of Object.entries(Q))m.set(l(a),t);const L=new Set(["maple syrup","maple","date syrup","molasses","coconut nectar"].map(l));function B(a){const t=l(a);if(L.has(t))return null;for(const i of L)if(t.includes(i))return null;const e=m.get(t);if(e)return e;for(const[i,r]of m)if(t.includes(i)&&i.length>3)return r;return null}function C(a,t){const e=P(R(a)),i=z(a),r=B(a),n=i?`<span class="gf-swap">GF: ${c(i)}</span>`:"",o=r?`<span class="sf-swap">${c(e)} swap: ${c(r)} to significantly reduce calories/carbs</span>`:"";return`<span class="${t}${i?" c-gluten":r?" c-sugar":""}">${c(e)}${n}${o}</span>`}function V(a,t={}){var w;const{showMatch:e=!0,isFavorite:i=!1,isOnMakeList:r=!1,cookedDates:n=[],userIngs:o=[]}=t,s=a,$=Y(s.pct),T=s.img?" has-hero":"",j=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${c(s.img)}" alt="${c(s.title)}"></div>`:"",_=e&&s.pct!==void 0?`<span class="match-pill ${$}">${s.pct}%</span>`:"",x=s.time?`<span>⏱ ${s.time} min</span>`:"",F=s.servings?`<span>👤 ${s.servings} servings</span>`:"",p=s.nut||{},H=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${p.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${p.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${p.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${p.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${p.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",b=s.cats||[],I=b.length?`<div class="card-cats">${b.map(u=>`<span class="card-cat">${c(u)}</span>`).join("")}</div>`:"",v=s.haveNames||[],f=s.needNames||[],N=v.length?`<div class="chip-label-sm">You have</div><div class="chips">${v.map(u=>C(u,"c-have")).join("")}</div>`:"",D=f.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${f.map(u=>C(u,"c-need")).join("")}</div>`:"",k=f.length===1&&o.length?W(f[0],o):null,G=k?`<div class="sub-hint">💡 Try ${c(k)} instead of ${c(f[0])}</div>`:"",O=i?"❤️ Favorited":"🤍 Favorite",A=r?"✓ My Queue":"📌 My Queue",d=n.length?n[n.length-1]:null;let g;if(d){const u=new Date(typeof d=="string"?d:d.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),S=typeof d=="object"?d.rating:0,E=S?" "+"★".repeat(S):"";g=`✅ Made ${u}${E}`}else g="☐ I Made This";return`
    <article class="r-card ${$}${T}" data-recipe-id="${s.id}">
      ${j}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${c(s.title)}</div>
            <div class="r-site">${c(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${_}
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
        ${D}
        ${G}
        <div class="r-actions">
          ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${c(s.url)}" data-recipe-title="${c(s.title)}" data-recipe-site="${c(s.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${r?" on":""}" data-make-id="${s.id}">${A}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}">${g}</button>
          <button class="btn-sm btn-fav fav-btn${i?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${O}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${c(s.title)}" data-share-url="${c(s.url||"")}">📤 Share</button>
        </div>
      </div>
    </article>
  `}function K(a,t,e={}){if(!a.length)return"";const i=e.makelist?new Set(e.makelist):new Set,r=e.cookHistory||[];return a.map(n=>{const o=r.filter(s=>s.id===n.id);return V(n,{...e,isFavorite:t.has(n.id),isOnMakeList:i.has(n.id),cookedDates:o})}).join("")}export{W as f,z as g,K as r,B as s};
