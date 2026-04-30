import{n as r,e as l,f as A,h as E}from"./index-ur2qLyK4.js";import{I as w,G as P,S as R}from"./matching-Ccq4w3-5.js";function U(t,i){const n=r(t);for(const a of i){const e=r(a),o=w[e];if(o&&o.some(s=>r(s)===n))return a}const c=w[n];if(c){for(const a of c)if(i.some(e=>r(e)===r(a)))return a}return null}function Q(t){return t>=80?"hi":t>=40?"md":"lo"}const g=new Map;for(const[t,i]of Object.entries(P))g.set(r(t),i);function W(t){const i=r(t),n=g.get(i);if(n)return n;let c=null,a=0;for(const[e,o]of g)i.includes(e)&&e.length>3&&e.length>a&&(c=o,a=e.length);return c}const b=new Map;for(const[t,i]of Object.entries(R))b.set(r(t),i);function Y(t){const i=r(t),n=b.get(i);if(n)return n;for(const[c,a]of b)if(i.includes(c)&&c.length>3)return a;return null}function M(t,i){const n=A(E(t)),c=W(t),a=Y(t),e=c?`<span class="gf-swap">GF: ${l(c)}</span>`:"",o=a?`<span class="sf-swap">${l(n)} swap: ${l(a)} to significantly reduce calories/carbs</span>`:"";return`<span class="${i}${c?" c-gluten":a?" c-sugar":""}">${l(n)}${e}${o}</span>`}function z(t,i={}){var y;const{showMatch:n=!0,isFavorite:c=!1,isOnMakeList:a=!1,cookedDates:e=[],userIngs:o=[]}=i,s=t,h=Q(s.pct),L=s.img?" has-hero":"",C=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${l(s.img)}" alt="${l(s.title)}"></div>`:"",T=n&&s.pct!==void 0?`<span class="match-pill ${h}">${s.pct}%</span>`:"",j=s.time?`<span>⏱ ${s.time} min</span>`:"",x=s.servings?`<span>👤 ${s.servings} servings</span>`:"",p=s.nut||{},F=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${p.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${p.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${p.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${p.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${p.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",m=s.cats||[],H=m.length?`<div class="card-cats">${m.map(d=>`<span class="card-cat">${l(d)}</span>`).join("")}</div>`:"",f=s.haveNames||[],v=s.needNames||[],I=f.length?`<div class="chip-label-sm">You have</div><div class="chips">${f.map(d=>M(d,"c-have")).join("")}</div>`:"",N=v.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${v.map(d=>M(d,"c-need")).join("")}</div>`:"",k=v.length===1&&o.length?U(v[0],o):null,D=k?`<div class="sub-hint">💡 Try ${l(k)} instead of ${l(v[0])}</div>`:"",G=c?"❤️ Favorited":"🤍 Favorite",_=a?"✓ My Queue":"📌 My Queue",u=e.length?e[e.length-1]:null;let $;if(u){const d=new Date(typeof u=="string"?u:u.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),S=typeof u=="object"?u.rating:0,O=S?" "+"★".repeat(S):"";$=`✅ Made ${d}${O}`}else $="☐ I Made This";return`
    <article class="r-card ${h}${L}" data-recipe-id="${s.id}">
      ${C}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${l(s.title)}</div>
            <div class="r-site">${l(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${T}
          </div>
        </div>
        ${n?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${j}${x}
          <span>✅ ${f.length}/${((y=s.ing)==null?void 0:y.length)??0} ingredients</span>
        </div>
        ${F}
        ${H}
        ${I}
        ${N}
        ${D}
        <div class="r-actions">
          ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${l(s.url)}" data-recipe-title="${l(s.title)}" data-recipe-site="${l(s.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${a?" on":""}" data-make-id="${s.id}">${_}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}">${$}</button>
          <button class="btn-sm btn-fav fav-btn${c?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${G}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${l(s.title)}" data-share-url="${l(s.url||"")}">📤 Share</button>
        </div>
      </div>
    </article>
  `}function q(t,i,n={}){if(!t.length)return"";const c=n.makelist?new Set(n.makelist):new Set,a=n.cookHistory||[];return t.map(e=>{const o=a.filter(s=>s.id===e.id);return z(e,{...n,isFavorite:i.has(e.id),isOnMakeList:c.has(e.id),cookedDates:o})}).join("")}export{U as f,W as g,q as r,Y as s};
