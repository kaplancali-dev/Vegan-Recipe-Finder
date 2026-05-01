import{n as l,e as o,f as P,h as R}from"./index-DEHqofFI.js";import{I as y,G as U,S as Q}from"./matching-DXBQRYDj.js";function W(a,t){const e=l(a);for(const r of t){const n=l(r),c=y[n];if(c&&c.some(s=>l(s)===e))return r}const i=y[e];if(i){for(const r of i)if(t.some(n=>l(n)===l(r)))return r}return null}function Y(a){return a>=80?"hi":a>=40?"md":"lo"}const m=new Map;for(const[a,t]of Object.entries(U))m.set(l(a),t);const M=new Set(["almond flour","oat flour","rice flour","coconut flour","chickpea flour","buckwheat flour","cassava flour","tapioca flour","brown rice flour","gluten-free flour","gf flour","cornstarch","arrowroot powder","arrowroot starch","potato starch","tapioca starch","corn tortilla","rice noodles","rice paper","rice paper wrappers","tamari","coconut aminos","gf breadcrumbs","gf panko","gf pasta","gf bread","gluten-free bread","gf naan","gf pita","gf buns","gf tortillas","corn tortillas","miso","white miso","red miso","yellow miso","light miso","miso paste"].map(l));function z(a){const t=l(a);if(M.has(t))return null;for(const n of M)if(t.includes(n))return null;const e=m.get(t);if(e)return e;let i=null,r=0;for(const[n,c]of m)t.includes(n)&&n.length>3&&n.length>r&&(i=c,r=n.length);return i}const h=new Map;for(const[a,t]of Object.entries(Q))h.set(l(a),t);const L=new Set(["maple syrup","maple","date syrup","molasses","coconut nectar"].map(l));function B(a){const t=l(a);if(L.has(t))return null;for(const i of L)if(t.includes(i))return null;const e=h.get(t);if(e)return e;for(const[i,r]of h)if(t.includes(i)&&i.length>3)return r;return null}function C(a,t){const e=P(R(a)),i=z(a),r=B(a),n=i?`<span class="gf-swap">GF: ${o(i)}</span>`:"",c=r?`<span class="sf-swap">${o(e)} swap: ${o(r)} to significantly reduce calories/carbs</span>`:"";return`<span class="${t}${i?" c-gluten":r?" c-sugar":""}">${o(e)}${n}${c}</span>`}function V(a,t={}){var k;const{showMatch:e=!0,isFavorite:i=!1,isOnMakeList:r=!1,cookedDates:n=[],userIngs:c=[]}=t,s=a,b=Y(s.pct),T=s.img?" has-hero":"",j=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${o(s.img)}" alt="${o(s.title)}"></div>`:"",_=e&&s.pct!==void 0?`<span class="match-pill ${b}">${s.pct}%</span>`:"",x=s.time?`<span>⏱ ${s.time} min</span>`:"",F=s.servings?`<span>👤 ${s.servings} servings</span>`:"",p=s.nut||{},H=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${p.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${p.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${p.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${p.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${p.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",$=s.cats||[],I=$.length?`<div class="card-cats">${$.map(u=>`<span class="card-cat">${o(u)}</span>`).join("")}</div>`:"",v=s.haveNames||[],f=s.needNames||[],N=v.length?`<div class="chip-label-sm">You have</div><div class="chips">${v.map(u=>C(u,"c-have")).join("")}</div>`:"",D=f.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${f.map(u=>C(u,"c-need")).join("")}</div>`:"",w=f.length===1&&c.length?W(f[0],c):null,G=w?`<div class="sub-hint">💡 Try ${o(w)} instead of ${o(f[0])}</div>`:"",O=i?"❤️ Favorited":"🤍 Favorite",A=r?"✓ My Queue":"📌 My Queue",d=n.length?n[n.length-1]:null;let g;if(d){const u=new Date(typeof d=="string"?d:d.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),S=typeof d=="object"?d.rating:0,E=S?" "+"★".repeat(S):"";g=`✅ Made ${u}${E}`}else g="☐ I Made This";return`
    <article class="r-card ${b}${T}" data-recipe-id="${s.id}">
      ${j}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${o(s.title)}</div>
            <div class="r-site">${o(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${_}
          </div>
        </div>
        ${e?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${x}${F}
          <span>✅ ${v.length}/${((k=s.ing)==null?void 0:k.length)??0} ingredients</span>
        </div>
        ${H}
        ${I}
        ${N}
        ${D}
        ${G}
        <div class="r-actions">
          ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${o(s.url)}" data-recipe-title="${o(s.title)}" data-recipe-site="${o(s.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${r?" on":""}" data-make-id="${s.id}">${A}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}">${g}</button>
          <button class="btn-sm btn-fav fav-btn${i?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${O}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${o(s.title)}" data-share-url="${o(s.url||"")}">📤 Share</button>
        </div>
      </div>
    </article>
  `}function K(a,t,e={}){if(!a.length)return"";const i=e.makelist?new Set(e.makelist):new Set,r=e.cookHistory||[];return a.map(n=>{const c=r.filter(s=>s.id===n.id);return V(n,{...e,isFavorite:t.has(n.id),isOnMakeList:i.has(n.id),cookedDates:c})}).join("")}export{W as f,z as g,K as r,B as s};
