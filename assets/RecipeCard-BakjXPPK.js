import{n as l,e as r,f as R,h as U}from"./index-DGsDTrVo.js";import{I as L,G as Y,S as Q}from"./matching-B5AR_5pH.js";function W(a,t){const n=l(a);for(const i of t){const o=l(i),c=L[o];if(c&&c.some(d=>l(d)===n))return i}const e=L[n];if(e){for(const i of e)if(t.some(o=>l(o)===l(i)))return i}return null}function z(a){return a>=80?"hi":a>=40?"md":"lo"}const m=new Map;for(const[a,t]of Object.entries(Y))m.set(l(a),t);const M=new Set(["almond flour","oat flour","rice flour","coconut flour","chickpea flour","buckwheat flour","cassava flour","tapioca flour","brown rice flour","gluten-free flour","gf flour","cornstarch","arrowroot powder","arrowroot starch","potato starch","tapioca starch","corn tortilla","rice noodles","rice paper","rice paper wrappers","tamari","coconut aminos","gf breadcrumbs","gf panko","gf pasta","gf bread","gluten-free bread","gf naan","gf pita","gf buns","gf tortillas","corn tortillas","miso","white miso","red miso","yellow miso","light miso","miso paste"].map(l));function B(a){const t=l(a);if(M.has(t))return null;for(const o of M)if(t.includes(o))return null;const n=m.get(t);if(n)return n;let e=null,i=0;for(const[o,c]of m)t.includes(o)&&o.length>3&&o.length>i&&(e=c,i=o.length);return e}const b=new Map;for(const[a,t]of Object.entries(Q))b.set(l(a),t);const C=new Set(["maple syrup","maple","date syrup","molasses","coconut nectar"].map(l));function q(a){const t=l(a);if(C.has(t))return null;for(const e of C)if(t.includes(e))return null;const n=b.get(t);if(n)return n;for(const[e,i]of b)if(t.includes(e)&&e.length>3)return i;return null}function N(a,t){const n=R(U(a)),e=B(a),i=q(a),o=e?`<span class="gf-swap">GF: ${r(e)}</span>`:"",c=i?`<span class="sf-swap">${r(n)} swap: ${r(i)} to significantly reduce calories/carbs</span>`:"";return`<span class="${t}${e?" c-gluten":i?" c-sugar":""}">${r(n)}${o}${c}</span>`}function J(a,t={}){var S;const{showMatch:n=!0,isFavorite:e=!1,isOnMakeList:i=!1,cookedDates:o=[],userIngs:c=[],hasNotes:d=!1}=t,s=a,$=z(s.pct),T=s.img?" has-hero":"",j=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${r(s.img)}" alt="${r(s.title)}"></div>`:"",_=n&&s.pct!==void 0?`<span class="match-pill ${$}">${s.pct}%</span>`:"",x=s.time?`<span>⏱ ${s.time} min</span>`:"",F=s.servings?`<span>👤 ${s.servings} servings</span>`:"",f=s.nut||{},H=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${f.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${f.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${f.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${f.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${f.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",k=s.cats||[],I=k.length?`<div class="card-cats">${k.map(u=>`<span class="card-cat">${r(u)}</span>`).join("")}</div>`:"",g=s.haveNames||[],v=s.needNames||[],D=g.length?`<div class="chip-label-sm">You have</div><div class="chips">${g.map(u=>N(u,"c-have")).join("")}</div>`:"",G=v.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${v.map(u=>N(u,"c-need")).join("")}</div>`:"",w=v.length===1&&c.length?W(v[0],c):null,O=w?`<div class="sub-hint">💡 Try ${r(w)} instead of ${r(v[0])}</div>`:"",A=e?"❤️ Fav":"🤍 Fav",E=i?"✓ Queue":"📌 Queue",p=o.length?o[o.length-1]:null;let h;if(p){const u=new Date(typeof p=="string"?p:p.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),y=typeof p=="object"?p.rating:0,P=y?" "+"★".repeat(y):"";h=`✅ Made ${u}${P}`}else h="☐ Made It";return`
    <article class="r-card ${$}${T}" data-recipe-id="${s.id}">
      ${j}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${r(s.title)}${d?' <span class="notes-badge" title="You have notes on this recipe">📝</span>':""}</div>
            <div class="r-site">${r(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${_}
          </div>
        </div>
        ${n?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${x}${F}
          <span>✅ ${g.length}/${((S=s.ing)==null?void 0:S.length)??0} ingredients</span>
        </div>
        ${H}
        ${I}
        ${D}
        ${G}
        ${O}
        <div class="r-actions">
          ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${r(s.url)}" data-recipe-title="${r(s.title)}" data-recipe-site="${r(s.site||"")}">📖 Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${i?" on":""}" data-make-id="${s.id}">${E}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}" data-cook-title="${r(s.title)}">${h}</button>
          <button class="btn-sm btn-fav fav-btn${e?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${A}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${r(s.title)}" data-share-url="${r(s.url||"")}">📤 Share</button>
        </div>
      </div>
    </article>
  `}function X(a,t,n={}){if(!a.length)return"";const e=n.makelist?new Set(n.makelist):new Set,i=n.cookHistory||[],o=n.notes||{};return a.map(c=>{const d=i.filter(s=>s.id===c.id);return J(c,{...n,isFavorite:t.has(c.id),isOnMakeList:e.has(c.id),cookedDates:d,hasNotes:!!o[c.id]})}).join("")}export{W as f,B as g,X as r,q as s};
