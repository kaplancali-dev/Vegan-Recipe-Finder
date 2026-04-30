import{n as d,e as o,i as U,j as B}from"./index-DfczM7L7.js";import{I as j,G as Q,S as W}from"./matching-CSpnI4cl.js";import{g as Y}from"./RecipeDetail-DbYMitT_.js";function z(t,e){const i=d(t);for(const n of e){const a=d(n),l=j[a];if(l&&l.some(s=>d(s)===i))return n}const c=j[i];if(c){for(const n of c)if(e.some(a=>d(a)===d(n)))return n}return null}function V(t){return t>=80?"hi":t>=40?"md":"lo"}const h=new Map;for(const[t,e]of Object.entries(Q))h.set(d(t),e);function q(t){const e=d(t),i=h.get(e);if(i)return i;let c=null,n=0;for(const[a,l]of h)e.includes(a)&&a.length>3&&a.length>n&&(c=l,n=a.length);return c}const k=new Map;for(const[t,e]of Object.entries(W))k.set(d(t),e);function J(t){const e=d(t),i=k.get(e);if(i)return i;for(const[c,n]of k)if(e.includes(c)&&c.length>3)return n;return null}function C(t,e){const i=U(B(t)),c=q(t),n=J(t),a=c?`<span class="gf-swap">GF: ${o(c)}</span>`:"",l=n?`<span class="sf-swap">Swap: ${o(n)} to cut sugar calories</span>`:"";return`<span class="${e}${c?" c-gluten":n?" c-sugar":""}">${o(i)}${a}${l}</span>`}function K(t,e={}){var L;const{showMatch:i=!0,isFavorite:c=!1,isOnMakeList:n=!1,cookedDates:a=[],userIngs:l=[]}=e,s=t,S=V(s.pct),I=s.img?" has-hero":"",T=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${o(s.img)}" alt="${o(s.title)}"></div>`:"",H=i&&s.pct!==void 0?`<span class="match-pill ${S}">${s.pct}%</span>`:"",x=s.time?`<span>⏱ ${s.time} min</span>`:"",F=s.servings?`<span>👤 ${s.servings} servings</span>`:"",v=s.nut||{},N=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${v.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${v.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${v.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${v.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${v.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",y=s.cats||[],D=y.length?`<div class="card-cats">${y.map(r=>`<span class="card-cat">${o(r)}</span>`).join("")}</div>`:"",G=s.ing||[],w=new Set,b=[];for(const r of G){const p=Y(r);if(p&&p.benefits)for(const g of p.benefits)w.has(g)||(w.add(g),b.push(g))}const _=b.length?`<div class="card-benefits">${b.slice(0,3).map(r=>`<span class="card-benefit">✦ ${o(r)}</span>`).join("")}</div>`:"",$=s.haveNames||[],f=s.needNames||[],O=$.length?`<div class="chip-label-sm">You have</div><div class="chips">${$.map(r=>C(r,"c-have")).join("")}</div>`:"",A=f.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${f.map(r=>C(r,"c-need")).join("")}</div>`:"",M=f.length===1&&l.length?z(f[0],l):null,E=M?`<div class="sub-hint">💡 Try ${o(M)} instead of ${o(f[0])}</div>`:"",P=c?"❤️ Favorited":"🤍 Favorite",R=n?"✓ My Queue":"📌 My Queue",u=a.length?a[a.length-1]:null;let m;if(u){const r=new Date(typeof u=="string"?u:u.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),p=typeof u=="object"?u.rating:0,g=p?" "+"★".repeat(p):"";m=`✅ Made ${r}${g}`}else m="☐ I Made This";return`
    <article class="r-card ${S}${I}" data-recipe-id="${s.id}">
      ${T}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${o(s.title)}</div>
            <div class="r-site">${o(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${H}
          </div>
        </div>
        ${i?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${x}${F}
          <span>✅ ${$.length}/${((L=s.ing)==null?void 0:L.length)??0} ingredients</span>
        </div>
        ${N}
        ${D}
        ${_}
        ${O}
        ${A}
        ${E}
        <div class="r-actions">
          ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${o(s.url)}" data-recipe-title="${o(s.title)}" data-recipe-site="${o(s.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${n?" on":""}" data-make-id="${s.id}">${R}</button>
          <button class="btn-sm btn-fav fav-btn${c?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${P}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}">${m}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${o(s.title)}" data-share-url="${o(s.url||"")}">📤 Share</button>
        </div>
      </div>
    </article>
  `}function ts(t,e,i={}){if(!t.length)return"";const c=i.makelist?new Set(i.makelist):new Set,n=i.cookHistory||[];return t.map(a=>{const l=n.filter(s=>s.id===a.id);return K(a,{...i,isFavorite:e.has(a.id),isOnMakeList:c.has(a.id),cookedDates:l})}).join("")}export{z as f,q as g,ts as r,J as s};
