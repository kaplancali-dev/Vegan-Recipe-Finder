import{n as r,e as l,i as _,j as O}from"./index-BgiYPnmk.js";import{I as y,G as A,S as E}from"./matching-M4Jpp9qG.js";function P(t,e){const i=r(t);for(const n of e){const a=r(n),o=y[a];if(o&&o.some(s=>r(s)===i))return n}const c=y[i];if(c){for(const n of c)if(e.some(a=>r(a)===r(n)))return n}return null}function R(t){return t>=80?"hi":t>=40?"md":"lo"}const $=new Map;for(const[t,e]of Object.entries(A))$.set(r(t),e);function U(t){const e=r(t),i=$.get(e);if(i)return i;let c=null,n=0;for(const[a,o]of $)e.includes(a)&&a.length>3&&a.length>n&&(c=o,n=a.length);return c}const b=new Map;for(const[t,e]of Object.entries(E))b.set(r(t),e);function Q(t){const e=r(t),i=b.get(e);if(i)return i;for(const[c,n]of b)if(e.includes(c)&&c.length>3)return n;return null}function w(t,e){const i=_(O(t)),c=U(t),n=Q(t),a=c?`<span class="gf-swap">GF: ${l(c)}</span>`:"",o=n?`<span class="sf-swap">Swap: ${l(n)} to cut sugar calories</span>`:"";return`<span class="${e}${c?" c-gluten":n?" c-sugar":""}">${l(i)}${a}${o}</span>`}function W(t,e={}){var k;const{showMatch:i=!0,isFavorite:c=!1,isOnMakeList:n=!1,cookedDates:a=[],userIngs:o=[]}=e,s=t,h=R(s.pct),M=s.img?" has-hero":"",L=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${l(s.img)}" alt="${l(s.title)}"></div>`:"",T=i&&s.pct!==void 0?`<span class="match-pill ${h}">${s.pct}%</span>`:"",C=s.time?`<span>⏱ ${s.time} min</span>`:"",j=s.servings?`<span>👤 ${s.servings} servings</span>`:"",u=s.nut||{},x=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${u.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${u.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${u.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${u.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${u.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",f=s.haveNames||[],p=s.needNames||[],F=f.length?`<div class="chip-label-sm">You have</div><div class="chips">${f.map(v=>w(v,"c-have")).join("")}</div>`:"",H=p.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${p.map(v=>w(v,"c-need")).join("")}</div>`:"",m=p.length===1&&o.length?P(p[0],o):null,I=m?`<div class="sub-hint">💡 Try ${l(m)} instead of ${l(p[0])}</div>`:"",N=c?"❤️ Favorited":"🤍 Favorite",D=n?"✓ My Queue":"📌 My Queue",d=a.length?a[a.length-1]:null;let g;if(d){const v=new Date(typeof d=="string"?d:d.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),S=typeof d=="object"?d.rating:0,G=S?" "+"★".repeat(S):"";g=`✅ Made ${v}${G}`}else g="☐ I Made This";return`
    <article class="r-card ${h}${M}" data-recipe-id="${s.id}">
      ${L}
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
          ${C}${j}
          <span>✅ ${f.length}/${((k=s.ing)==null?void 0:k.length)??0} ingredients</span>
        </div>
        ${x}
        ${F}
        ${H}
        ${I}
        <div class="r-actions">
          ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${l(s.url)}" data-recipe-title="${l(s.title)}" data-recipe-site="${l(s.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${n?" on":""}" data-make-id="${s.id}">${D}</button>
          <button class="btn-sm btn-fav fav-btn${c?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${N}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}">${g}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${l(s.title)}" data-share-url="${l(s.url||"")}">📤 Share</button>
        </div>
      </div>
    </article>
  `}function B(t,e,i={}){if(!t.length)return"";const c=i.makelist?new Set(i.makelist):new Set,n=i.cookHistory||[];return t.map(a=>{const o=n.filter(s=>s.id===a.id);return W(a,{...i,isFavorite:e.has(a.id),isOnMakeList:c.has(a.id),cookedDates:o})}).join("")}export{P as f,U as g,B as r,Q as s};
