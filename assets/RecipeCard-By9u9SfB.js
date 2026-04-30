import{n as r,e as l,i as A,j as E}from"./index-DPRQ6WNS.js";import{I as y,G as P,S as R}from"./matching-CyKcmVpv.js";function U(t,e){const i=r(t);for(const n of e){const a=r(n),o=y[a];if(o&&o.some(s=>r(s)===i))return n}const c=y[i];if(c){for(const n of c)if(e.some(a=>r(a)===r(n)))return n}return null}function Q(t){return t>=80?"hi":t>=40?"md":"lo"}const g=new Map;for(const[t,e]of Object.entries(P))g.set(r(t),e);function W(t){const e=r(t),i=g.get(e);if(i)return i;let c=null,n=0;for(const[a,o]of g)e.includes(a)&&a.length>3&&a.length>n&&(c=o,n=a.length);return c}const b=new Map;for(const[t,e]of Object.entries(R))b.set(r(t),e);function Y(t){const e=r(t),i=b.get(e);if(i)return i;for(const[c,n]of b)if(e.includes(c)&&c.length>3)return n;return null}function L(t,e){const i=A(E(t)),c=W(t),n=Y(t),a=c?`<span class="gf-swap">GF: ${l(c)}</span>`:"",o=n?`<span class="sf-swap">Swap: ${l(n)} to cut sugar calories</span>`:"";return`<span class="${e}${c?" c-gluten":n?" c-sugar":""}">${l(i)}${a}${o}</span>`}function z(t,e={}){var S;const{showMatch:i=!0,isFavorite:c=!1,isOnMakeList:n=!1,cookedDates:a=[],userIngs:o=[]}=e,s=t,h=Q(s.pct),M=s.img?" has-hero":"",C=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${l(s.img)}" alt="${l(s.title)}"></div>`:"",j=i&&s.pct!==void 0?`<span class="match-pill ${h}">${s.pct}%</span>`:"",T=s.time?`<span>⏱ ${s.time} min</span>`:"",x=s.servings?`<span>👤 ${s.servings} servings</span>`:"",p=s.nut||{},H=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${p.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${p.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${p.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${p.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${p.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",m=s.cats||[],N=m.length?`<div class="card-cats">${m.map(d=>`<span class="card-cat">${l(d)}</span>`).join("")}</div>`:"",f=s.haveNames||[],v=s.needNames||[],D=f.length?`<div class="chip-label-sm">You have</div><div class="chips">${f.map(d=>L(d,"c-have")).join("")}</div>`:"",G=v.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${v.map(d=>L(d,"c-need")).join("")}</div>`:"",k=v.length===1&&o.length?U(v[0],o):null,I=k?`<div class="sub-hint">💡 Try ${l(k)} instead of ${l(v[0])}</div>`:"",_=c?"❤️":"🤍",F=n?"✓ Queue":"📌 Queue",u=a.length?a[a.length-1]:null;let $;if(u){const d=new Date(typeof u=="string"?u:u.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),w=typeof u=="object"?u.rating:0,O=w?" "+"★".repeat(w):"";$=`✅ ${d}${O}`}else $="☐ Made";return`
    <article class="r-card ${h}${M}" data-recipe-id="${s.id}">
      ${C}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${l(s.title)}</div>
            <div class="r-site">${l(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${j}
          </div>
        </div>
        ${i?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${T}${x}
          <span>✅ ${f.length}/${((S=s.ing)==null?void 0:S.length)??0} ingredients</span>
        </div>
        ${H}
        ${N}
        ${D}
        ${G}
        ${I}
        <div class="r-actions">
          ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${l(s.url)}" data-recipe-title="${l(s.title)}" data-recipe-site="${l(s.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${n?" on":""}" data-make-id="${s.id}">${F}</button>
          <button class="btn-sm btn-fav fav-btn${c?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${_}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}">${$}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${l(s.title)}" data-share-url="${l(s.url||"")}">📤 Share</button>
        </div>
      </div>
    </article>
  `}function q(t,e,i={}){if(!t.length)return"";const c=i.makelist?new Set(i.makelist):new Set,n=i.cookHistory||[];return t.map(a=>{const o=n.filter(s=>s.id===a.id);return z(a,{...i,isFavorite:e.has(a.id),isOnMakeList:c.has(a.id),cookedDates:o})}).join("")}export{U as f,W as g,q as r,Y as s};
