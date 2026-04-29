import{n as r,e as o,i as _}from"./index-BCc194U1.js";import{I as S,G as O,S as A}from"./matching-Bfyf2qdo.js";function E(t,a){const e=r(t);for(const n of a){const c=r(n),l=S[c];if(l&&l.some(s=>r(s)===e))return n}const i=S[e];if(i){for(const n of i)if(a.some(c=>r(c)===r(n)))return n}return null}function P(t){return t>=80?"hi":t>=40?"md":"lo"}const w=new Map;for(const[t,a]of Object.entries(O))w.set(r(t),a);function R(t){return w.get(r(t))||null}const g=new Map;for(const[t,a]of Object.entries(A))g.set(r(t),a);function U(t){const a=r(t),e=g.get(a);if(e)return e;for(const[i,n]of g)if(a.includes(i)&&i.length>3)return n;return null}function y(t,a){const e=_(t),i=R(t),n=U(t),c=i?`<span class="gf-swap">GF: ${o(i)}</span>`:"",l=n?`<span class="sf-swap">Swap: ${o(n)} to cut sugar calories</span>`:"";return`<span class="${a}${i?" c-gluten":n?" c-sugar":""}">${o(e)}${c}${l}</span>`}function Q(t,a={}){var h;const{showMatch:e=!0,isFavorite:i=!1,isOnMakeList:n=!1,cookedDates:c=[],userIngs:l=[]}=a,s=t,b=P(s.pct),M=s.img?" has-hero":"",L=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${o(s.img)}" alt="${o(s.title)}"></div>`:"",T=e&&s.pct!==void 0?`<span class="match-pill ${b}">${s.pct}%</span>`:"",C=s.time?`<span>⏱ ${s.time} min</span>`:"",j=s.servings?`<span>👤 ${s.servings} servings</span>`:"",u=s.nut||{},F=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${u.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${u.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${u.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${u.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${u.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",f=s.haveNames||[],p=s.needNames||[],H=f.length?`<div class="chip-label-sm">You have</div><div class="chips">${f.map(v=>y(v,"c-have")).join("")}</div>`:"",I=p.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${p.map(v=>y(v,"c-need")).join("")}</div>`:"",m=p.length===1&&l.length?E(p[0],l):null,N=m?`<div class="sub-hint">💡 Try ${o(m)} instead of ${o(p[0])}</div>`:"",x=i?"❤️ Favorited":"🤍 Favorite",D=n?"✓ My Queue":"📌 My Queue",d=c.length?c[c.length-1]:null;let $;if(d){const v=new Date(typeof d=="string"?d:d.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),k=typeof d=="object"?d.rating:0,G=k?" "+"★".repeat(k):"";$=`✅ Made ${v}${G}`}else $="☐ I Made This";return`
    <article class="r-card ${b}${M}" data-recipe-id="${s.id}">
      ${L}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${o(s.title)}</div>
            <div class="r-site">${o(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${T}
          </div>
        </div>
        ${e?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${C}${j}
          <span>✅ ${f.length}/${((h=s.ing)==null?void 0:h.length)??0} ingredients</span>
        </div>
        ${F}
        ${H}
        ${I}
        ${N}
        <div class="r-actions">
          ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${o(s.url)}" data-recipe-title="${o(s.title)}" data-recipe-site="${o(s.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${n?" on":""}" data-make-id="${s.id}">${D}</button>
          <button class="btn-sm btn-fav fav-btn${i?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${x}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}">${$}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${o(s.title)}" data-share-url="${o(s.url||"")}">📤 Share</button>
        </div>
      </div>
    </article>
  `}function z(t,a,e={}){if(!t.length)return"";const i=e.makelist?new Set(e.makelist):new Set,n=e.cookHistory||[];return t.map(c=>{const l=n.filter(s=>s.id===c.id);return Q(c,{...e,isFavorite:a.has(c.id),isOnMakeList:i.has(c.id),cookedDates:l})}).join("")}export{E as f,R as g,z as r,U as s};
