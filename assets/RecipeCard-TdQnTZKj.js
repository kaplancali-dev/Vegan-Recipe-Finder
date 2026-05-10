import{n as l,e as c,h as Y,i as W}from"./index-XUWx7_0p.js";import{I as L,G as q,S as z}from"./matching-DN1tcyX1.js";function B(t,a){const n=l(t);for(const i of a){const o=l(i),r=L[o];if(r&&r.some(p=>l(p)===n))return i}const e=L[n];if(e){for(const i of e)if(a.some(o=>l(o)===l(i)))return i}return null}function J(t){return t>=80?"hi":t>=40?"md":"lo"}const g=new Map;for(const[t,a]of Object.entries(q))g.set(l(t),a);const N=new Set(["almond flour","oat flour","rice flour","coconut flour","chickpea flour","buckwheat flour","cassava flour","tapioca flour","brown rice flour","gluten-free flour","gf flour","cornstarch","arrowroot powder","arrowroot starch","potato starch","tapioca starch","corn tortilla","rice noodles","rice paper","rice paper wrappers","tamari","coconut aminos","gf breadcrumbs","gf panko","gf pasta","gf bread","gluten-free bread","gf naan","gf pita","gf buns","gf tortillas","corn tortillas","miso","white miso","red miso","yellow miso","light miso","miso paste","red lentil pasta","red lentil penne","red lentil penne pasta","lentil pasta","lentil penne","chickpea pasta","chickpea penne","brown rice pasta","brown rice penne","brown rice penne pasta","rice pasta","rice penne","edamame pasta","edamame spaghetti","black bean pasta","black bean spaghetti","quinoa pasta","buckwheat pasta","soba noodles"].map(l));function K(t){const a=l(t);if(N.has(a))return null;for(const o of N)if(a.includes(o))return null;const n=g.get(a);if(n)return n;let e=null,i=0;for(const[o,r]of g)a.includes(o)&&o.length>3&&o.length>i&&(e=r,i=o.length);return e}const m=new Map;for(const[t,a]of Object.entries(z))m.set(l(t),a);const C=new Set(["maple syrup","maple","date syrup","molasses","coconut nectar"].map(l));function Q(t){const a=l(t);if(C.has(a))return null;for(const e of C)if(a.includes(e))return null;const n=m.get(a);if(n)return n;for(const[e,i]of m)if(a.includes(e)&&e.length>3)return i;return null}function T(t,a){const n=Y(W(t)),e=K(t),i=Q(t),o=e?`<span class="gf-swap">GF: ${c(e)}</span>`:"",r=i?`<span class="sf-swap">Lower-carb: ${c(i)}</span>`:"";return`<span class="${a}${e?" c-gluten":i?" c-sugar":""}">${c(n)}${o}${r}</span>`}function V(t,a={}){var y;const{showMatch:n=!0,isFavorite:e=!1,isOnMakeList:i=!1,cookedDates:o=[],userIngs:r=[],hasNotes:p=!1}=a,s=t,b=J(s.pct),j=s.img?" has-hero":"",D=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${c(s.img)}" alt="${c(s.title)}"></div>`:"",_=n&&s.pct!==void 0?`<span class="match-pill ${b}">${s.pct}%</span>`:"",x=s.time?`<span>⏱ ${s.time} min</span>`:"",F=s.servings?`<span>👤 ${s.servings} servings</span>`:"",f=s.nut||{},H=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${f.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${f.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${f.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${f.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${f.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",$=s.cats||[],I=$.length?`<div class="card-cats">${$.map(d=>`<span class="card-cat">${c(d)}</span>`).join("")}</div>`:"",k=s.have&&s.have.length?s.have:s.haveNames||[],w=s.need&&s.need.length?s.need:s.needNames||[],G=s.haveNames||[],v=s.needNames||[],O=k.length?`<div class="chip-label-sm">You have</div><div class="chips">${k.map(d=>T(d,"c-have")).join("")}</div>`:"",A=w.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${w.map(d=>T(d,"c-need")).join("")}</div>`:"",S=v.length===1&&r.length?B(v[0],r):null,E=S?`<div class="sub-hint">💡 Try ${c(S)} instead of ${c(v[0])}</div>`:"",P=e?"❤️ Fav":"🤍 Fav",R=i?"✓ Make Soon":"📌 Make Soon",u=o.length?o[o.length-1]:null;let h;if(u){const d=new Date(typeof u=="string"?u:u.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),M=typeof u=="object"?u.rating:0,U=M?" "+"★".repeat(M):"";h=`✅ Made ${d}${U}`}else h="☐ Made It";return`
    <article class="r-card ${b}${j}" data-recipe-id="${s.id}">
      ${D}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${c(s.title)}${p?' <span class="notes-badge" title="You have notes on this recipe">📝</span>':""}</div>
            <div class="r-site">${c(s.site||"")}</div>
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
        ${A}
        ${E}
        <div class="r-actions">
          ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${c(s.url)}" data-recipe-title="${c(s.title)}" data-recipe-site="${c(s.site||"")}">📖 Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${i?" on":""}" data-make-id="${s.id}">${R}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}" data-cook-title="${c(s.title)}">${h}</button>
          <button class="btn-sm btn-fav fav-btn${e?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${P}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${c(s.title)}" data-share-url="${c(s.url||"")}">📤 Share</button>
        </div>
      </div>
    </article>
  `}function ss(t,a,n={}){if(!t.length)return"";const e=n.makelist?new Set(n.makelist):new Set,i=n.cookHistory||[],o=n.notes||{};return t.map(r=>{const p=i.filter(s=>s.id===r.id);return V(r,{...n,isFavorite:a.has(r.id),isOnMakeList:e.has(r.id),cookedDates:p,hasNotes:!!o[r.id]})}).join("")}export{B as f,K as g,ss as r,Q as s};
