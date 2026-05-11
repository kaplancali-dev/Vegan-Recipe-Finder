import{n as l,e as r,h as U,i as Y}from"./index-tNNSFioG.js";import{I as L,G as W,S as z}from"./matching-DoUT_YLD.js";function B(t,a){const n=l(t);for(const i of a){const o=l(i),c=L[o];if(c&&c.some(p=>l(p)===n))return i}const e=L[n];if(e){for(const i of e)if(a.some(o=>l(o)===l(i)))return i}return null}function J(t){return t>=80?"hi":t>=40?"md":"lo"}const g=new Map;for(const[t,a]of Object.entries(W))g.set(l(t),a);const N=new Set(["almond flour","oat flour","rice flour","coconut flour","chickpea flour","buckwheat flour","cassava flour","tapioca flour","brown rice flour","gluten-free flour","gf flour","cornstarch","arrowroot powder","arrowroot starch","potato starch","tapioca starch","corn tortilla","rice noodles","rice paper","rice paper wrappers","tamari","coconut aminos","gf breadcrumbs","gf panko","gf pasta","gf bread","gluten-free bread","gf naan","gf pita","gf buns","gf tortillas","corn tortillas","miso","white miso","red miso","yellow miso","light miso","miso paste","red lentil pasta","red lentil penne","red lentil penne pasta","lentil pasta","lentil penne","chickpea pasta","chickpea penne","brown rice pasta","brown rice penne","brown rice penne pasta","rice pasta","rice penne","edamame pasta","edamame spaghetti","black bean pasta","black bean spaghetti","quinoa pasta","buckwheat pasta","soba noodles"].map(l));function K(t){const a=l(t);if(N.has(a))return null;for(const o of N)if(a.includes(o))return null;const n=g.get(a);if(n)return n;let e=null,i=0;for(const[o,c]of g)a.includes(o)&&o.length>3&&o.length>i&&(e=c,i=o.length);return e}const b=new Map;for(const[t,a]of Object.entries(z))b.set(l(t),a);const C=new Set(["maple syrup","maple","date syrup","molasses","coconut nectar"].map(l));function Q(t){const a=l(t);if(C.has(a))return null;for(const e of C)if(a.includes(e))return null;const n=b.get(a);if(n)return n;for(const[e,i]of b)if(a.includes(e)&&e.length>3)return i;return null}function T(t,a){const n=U(Y(t)),e=K(t),i=Q(t),o=e?`<span class="gf-swap">GF: ${r(e)}</span>`:"",c=i?`<span class="sf-swap">Lower-carb: ${r(i)}</span>`:"";return`<span class="${a}${e?" c-gluten":i?" c-sugar":""}">${r(n)}${o}${c}</span>`}function V(t,a={}){var y;const{showMatch:n=!0,isFavorite:e=!1,isOnMakeList:i=!1,cookedDates:o=[],userIngs:c=[],hasNotes:p=!1}=a,s=t,m=J(s.pct),j=s.img?" has-hero":"",D=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${r(s.img)}" alt="${r(s.title)}"></div>`:"",_=n&&s.pct!==void 0?`<span class="match-pill ${m}">${s.pct}%</span>`:"",x=s.time?`<span>⏱ ${s.time} min</span>`:"",F=s.servings?`<span>👤 ${s.servings} servings</span>`:"",v=s.nut||{},H=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${v.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${v.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${v.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${v.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${v.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",$=s.cats||[],I=$.length?`<div class="card-cats">${$.map(d=>`<span class="card-cat">${r(d)}</span>`).join("")}</div>`:"",k=s.have&&s.have.length?s.have:s.haveNames||[],w=s.need&&s.need.length?s.need:s.needNames||[],G=s.haveNames||[],u=s.needNames||[],O=k.length?`<div class="chip-label-sm">You have</div><div class="chips">${k.map(d=>T(d,"c-have")).join("")}</div>`:"",q=w.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${w.map(d=>T(d,"c-need")).join("")}</div>`:"",S=u.length===1&&c.length?B(u[0],c):null,A=S?`<div class="sub-hint">💡 Try ${r(S)} instead of ${r(u[0])}</div>`:"",E=e?"❤️ Fav":"🤍 Fav",P=i?"✓ Make Soon":"📌 Make Soon",f=o.length?o[o.length-1]:null;let h;if(f){const d=new Date(typeof f=="string"?f:f.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),M=typeof f=="object"?f.rating:0,R=M?" "+"★".repeat(M):"";h=`✅ Made ${d}${R}`}else h="☐ Made It";return`
    <article class="r-card ${m}${j}" data-recipe-id="${s.id}">
      ${D}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${r(s.title)}${p?' <span class="notes-badge" title="You have notes on this recipe">📝</span>':""}</div>
            <div class="r-site">${r(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${_}
          </div>
        </div>
        ${n?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${x}${F}
          <span>✅ ${G.length}/${((y=s.ing)==null?void 0:y.length)??0} ingredients</span>
        </div>
        ${H}
        ${I}
        ${O}
        ${q}
        ${A}
        <div class="r-actions">
          <div class="r-actions-row r-actions-primary">
            ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${r(s.url)}" data-recipe-title="${r(s.title)}" data-recipe-site="${r(s.site||"")}">📖 Instructions</a>`:""}
            <button class="btn-sm btn-shop make-btn${i?" on":""}" data-make-id="${s.id}">${P}</button>
            ${u.length?`<button class="btn-sm btn-cart shop-queue-btn" data-shop-queue-id="${s.id}" data-shop-queue-missing="${r(JSON.stringify(u))}" aria-label="Add to Make Soon and shopping list">🛒 +${u.length}</button>`:""}
          </div>
          <div class="r-actions-row r-actions-secondary">
            <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}" data-cook-title="${r(s.title)}">${h}</button>
            <button class="btn-sm btn-fav fav-btn${e?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${E}</button>
            <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${r(s.title)}" data-share-url="${r(s.url||"")}">📤 Share</button>
          </div>
        </div>
      </div>
    </article>
  `}function ss(t,a,n={}){if(!t.length)return"";const e=n.makelist?new Set(n.makelist):new Set,i=n.cookHistory||[],o=n.notes||{};return t.map(c=>{const p=i.filter(s=>s.id===c.id);return V(c,{...n,isFavorite:a.has(c.id),isOnMakeList:e.has(c.id),cookedDates:p,hasNotes:!!o[c.id]})}).join("")}export{B as f,K as g,ss as r,Q as s};
