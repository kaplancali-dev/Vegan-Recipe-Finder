import{n as l,e as o,h as Y,i as W}from"./index-DBIQLQaT.js";import{I as L,G as z,S as B}from"./matching-DQF_p81P.js";function J(t,a){const n=l(t);for(const i of a){const e=l(i),c=L[e];if(c&&c.some(p=>l(p)===n))return i}const r=L[n];if(r){for(const i of r)if(a.some(e=>l(e)===l(i)))return i}return null}function K(t){return t>=80?"hi":t>=40?"md":"lo"}const b=new Map;for(const[t,a]of Object.entries(z))b.set(l(t),a);const N=new Set(["almond flour","oat flour","rice flour","coconut flour","chickpea flour","buckwheat flour","cassava flour","tapioca flour","brown rice flour","gluten-free flour","gf flour","cornstarch","arrowroot powder","arrowroot starch","potato starch","tapioca starch","corn tortilla","rice noodles","rice paper","rice paper wrappers","tamari","coconut aminos","gf breadcrumbs","gf panko","gf pasta","gf bread","gluten-free bread","gf naan","gf pita","gf buns","gf tortillas","corn tortillas","miso","white miso","red miso","yellow miso","light miso","miso paste","red lentil pasta","red lentil penne","red lentil penne pasta","lentil pasta","lentil penne","chickpea pasta","chickpea penne","brown rice pasta","brown rice penne","brown rice penne pasta","rice pasta","rice penne","edamame pasta","edamame spaghetti","black bean pasta","black bean spaghetti","quinoa pasta","buckwheat pasta","soba noodles"].map(l));function Q(t){const a=l(t);if(N.has(a))return null;for(const e of N)if(a.includes(e))return null;const n=b.get(a);if(n)return n;let r=null,i=0;for(const[e,c]of b)a.includes(e)&&e.length>3&&e.length>i&&(r=c,i=e.length);return r}const m=new Map;for(const[t,a]of Object.entries(B))m.set(l(t),a);const C=new Set(["maple syrup","maple","date syrup","molasses","coconut nectar"].map(l));function V(t){const a=l(t);if(C.has(a))return null;for(const r of C)if(a.includes(r))return null;const n=m.get(a);if(n)return n;for(const[r,i]of m)if(a.includes(r)&&r.length>3)return i;return null}function X(t){return t.replace(/\b\w/g,a=>a.toUpperCase())}function T(t,a,n){const r=Y(W(t)),i=Q(t),e=V(t),c=i?`<span class="gf-swap">GF: ${o(i)}</span>`:"",p=e?`<span class="sf-swap">Lower-carb: ${o(e)}</span>`:"",s=n?`<span class="allergy-swap">${o(X(n.allergen))} allergy: use your ${o(n.substitute)}</span>`:"";return`<span class="${a}${n?" c-allergen":i?" c-gluten":e?" c-sugar":""}">${o(r)}${c}${p}${s}</span>`}function Z(t,a={}){var S;const{showMatch:n=!0,isFavorite:r=!1,isOnMakeList:i=!1,cookedDates:e=[],userIngs:c=[],hasNotes:p=!1}=a,s=t,v=K(s.pct),_=s.img?" has-hero":"",j=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${o(s.img)}" alt="${o(s.title)}"></div>`:"",D=n&&s.pct!==void 0?`<span class="match-pill ${v}">${s.pct}%</span>`:"",x=s.time?`<span>⏱ ${s.time} min</span>`:"",F=s.servings?`<span>👤 ${s.servings} servings</span>`:"",g=s.nut||{},H=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${g.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${g.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${g.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${g.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${g.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",$=s.cats||[],I=$.length?`<div class="card-cats">${$.map(d=>`<span class="card-cat">${o(d)}</span>`).join("")}</div>`:"",k=s.have&&s.have.length?s.have:s.haveNames||[],w=s.need&&s.need.length?s.need:s.needNames||[],A=s.haveNames||[],u=s.needNames||[],G=s.allergenSwaps||{},O=k.length?`<div class="chip-label-sm">You have</div><div class="chips">${k.map(d=>T(d,"c-have",G[d])).join("")}</div>`:"",q=w.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${w.map(d=>T(d,"c-need")).join("")}</div>`:"",y=u.length===1&&c.length?J(u[0],c):null,U=y?`<div class="sub-hint">💡 Try ${o(y)} instead of ${o(u[0])}</div>`:"",E=r?"❤️ Fav":"🤍 Fav",P=i?"✓ Make Soon":"📌 Make Soon",f=e.length?e[e.length-1]:null;let h;if(f){const d=new Date(typeof f=="string"?f:f.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),M=typeof f=="object"?f.rating:0,R=M?" "+"★".repeat(M):"";h=`✅ Made ${d}${R}`}else h="☐ Made It";return`
    <article class="r-card ${v}${_}" data-recipe-id="${s.id}">
      ${j}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${o(s.title)}${p?' <span class="notes-badge" title="You have notes on this recipe">📝</span>':""}</div>
            <div class="r-site">${o(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${D}
          </div>
        </div>
        ${n?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${x}${F}
          <span>✅ ${A.length}/${((S=s.ing)==null?void 0:S.length)??0} ingredients</span>
        </div>
        ${H}
        ${I}
        ${O}
        ${q}
        ${U}
        <div class="r-actions">
          <div class="r-actions-row r-actions-primary">
            ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${o(s.url)}" data-recipe-title="${o(s.title)}" data-recipe-site="${o(s.site||"")}">📖 Instructions</a>`:""}
            <button class="btn-sm btn-shop make-btn${i?" on":""}" data-make-id="${s.id}">${P}</button>
            ${u.length?`<button class="btn-sm btn-cart shop-queue-btn" data-shop-queue-id="${s.id}" data-shop-queue-missing="${o(JSON.stringify(u))}" aria-label="Add to Make Soon and shopping list">🛒 +${u.length}</button>`:""}
          </div>
          <div class="r-actions-row r-actions-secondary">
            <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}" data-cook-title="${o(s.title)}">${h}</button>
            <button class="btn-sm btn-fav fav-btn${r?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${E}</button>
            <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${o(s.title)}" data-share-url="${o(s.url||"")}">📤 Share</button>
          </div>
        </div>
      </div>
    </article>
  `}function ts(t,a,n={}){if(!t.length)return"";const r=n.makelist?new Set(n.makelist):new Set,i=n.cookHistory||[],e=n.notes||{};return t.map(c=>{const p=i.filter(s=>s.id===c.id);return Z(c,{...n,isFavorite:a.has(c.id),isOnMakeList:r.has(c.id),cookedDates:p,hasNotes:!!e[c.id]})}).join("")}export{J as f,Q as g,ts as r,V as s};
