import{n as r,e as l,i as A,j as E}from"./index-C_QuPrPv.js";import{I as w,G as P,S as R}from"./matching-BgPx7oZp.js";function U(t,e){const i=r(t);for(const a of e){const n=r(a),o=w[n];if(o&&o.some(s=>r(s)===i))return a}const c=w[i];if(c){for(const a of c)if(e.some(n=>r(n)===r(a)))return a}return null}function Q(t){return t>=80?"hi":t>=40?"md":"lo"}const g=new Map;for(const[t,e]of Object.entries(P))g.set(r(t),e);function W(t){const e=r(t),i=g.get(e);if(i)return i;let c=null,a=0;for(const[n,o]of g)e.includes(n)&&n.length>3&&n.length>a&&(c=o,a=n.length);return c}const b=new Map;for(const[t,e]of Object.entries(R))b.set(r(t),e);function Y(t){const e=r(t),i=b.get(e);if(i)return i;for(const[c,a]of b)if(e.includes(c)&&c.length>3)return a;return null}function M(t,e){const i=A(E(t)),c=W(t),a=Y(t),n=c?`<span class="gf-swap">GF: ${l(c)}</span>`:"",o=a?`<span class="sf-swap">Swap: ${l(a)} to cut sugar calories</span>`:"";return`<span class="${e}${c?" c-gluten":a?" c-sugar":""}">${l(i)}${n}${o}</span>`}function z(t,e={}){var S;const{showMatch:i=!0,isFavorite:c=!1,isOnMakeList:a=!1,cookedDates:n=[],userIngs:o=[]}=e,s=t,h=Q(s.pct),L=s.img?" has-hero":"",C=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${l(s.img)}" alt="${l(s.title)}"></div>`:"",T=i&&s.pct!==void 0?`<span class="match-pill ${h}">${s.pct}%</span>`:"",j=s.time?`<span>⏱ ${s.time} min</span>`:"",x=s.servings?`<span>👤 ${s.servings} servings</span>`:"",p=s.nut||{},F=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${p.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${p.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${p.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${p.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${p.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",m=s.cats||[],H=m.length?`<div class="card-cats">${m.map(d=>`<span class="card-cat">${l(d)}</span>`).join("")}</div>`:"",f=s.haveNames||[],v=s.needNames||[],I=f.length?`<div class="chip-label-sm">You have</div><div class="chips">${f.map(d=>M(d,"c-have")).join("")}</div>`:"",N=v.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${v.map(d=>M(d,"c-need")).join("")}</div>`:"",k=v.length===1&&o.length?U(v[0],o):null,D=k?`<div class="sub-hint">💡 Try ${l(k)} instead of ${l(v[0])}</div>`:"",G=c?"❤️ Favorited":"🤍 Favorite",_=a?"✓ My Queue":"📌 My Queue",u=n.length?n[n.length-1]:null;let $;if(u){const d=new Date(typeof u=="string"?u:u.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),y=typeof u=="object"?u.rating:0,O=y?" "+"★".repeat(y):"";$=`✅ Made ${d}${O}`}else $="☐ I Made This";return`
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
        ${i?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${j}${x}
          <span>✅ ${f.length}/${((S=s.ing)==null?void 0:S.length)??0} ingredients</span>
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
  `}function q(t,e,i={}){if(!t.length)return"";const c=i.makelist?new Set(i.makelist):new Set,a=i.cookHistory||[];return t.map(n=>{const o=a.filter(s=>s.id===n.id);return z(n,{...i,isFavorite:e.has(n.id),isOnMakeList:c.has(n.id),cookedDates:o})}).join("")}export{U as f,W as g,q as r,Y as s};
