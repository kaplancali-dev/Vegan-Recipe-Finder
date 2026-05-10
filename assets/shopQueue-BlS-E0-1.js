import{n as l,e as c,h as W,i as z,g as L,c as C,f as B,d as J}from"./index-Do_BvPup.js";import{I as N,G as Q,S as K}from"./matching-CeYdx3G0.js";function V(a,t){const n=l(a);for(const i of t){const o=l(i),r=N[o];if(r&&r.some(p=>l(p)===n))return i}const e=N[n];if(e){for(const i of e)if(t.some(o=>l(o)===l(i)))return i}return null}function X(a){return a>=80?"hi":a>=40?"md":"lo"}const g=new Map;for(const[a,t]of Object.entries(Q))g.set(l(a),t);const T=new Set(["almond flour","oat flour","rice flour","coconut flour","chickpea flour","buckwheat flour","cassava flour","tapioca flour","brown rice flour","gluten-free flour","gf flour","cornstarch","arrowroot powder","arrowroot starch","potato starch","tapioca starch","corn tortilla","rice noodles","rice paper","rice paper wrappers","tamari","coconut aminos","gf breadcrumbs","gf panko","gf pasta","gf bread","gluten-free bread","gf naan","gf pita","gf buns","gf tortillas","corn tortillas","miso","white miso","red miso","yellow miso","light miso","miso paste","red lentil pasta","red lentil penne","red lentil penne pasta","lentil pasta","lentil penne","chickpea pasta","chickpea penne","brown rice pasta","brown rice penne","brown rice penne pasta","rice pasta","rice penne","edamame pasta","edamame spaghetti","black bean pasta","black bean spaghetti","quinoa pasta","buckwheat pasta","soba noodles"].map(l));function Z(a){const t=l(a);if(T.has(t))return null;for(const o of T)if(t.includes(o))return null;const n=g.get(t);if(n)return n;let e=null,i=0;for(const[o,r]of g)t.includes(o)&&o.length>3&&o.length>i&&(e=r,i=o.length);return e}const b=new Map;for(const[a,t]of Object.entries(K))b.set(l(a),t);const j=new Set(["maple syrup","maple","date syrup","molasses","coconut nectar"].map(l));function ss(a){const t=l(a);if(j.has(t))return null;for(const e of j)if(t.includes(e))return null;const n=b.get(t);if(n)return n;for(const[e,i]of b)if(t.includes(e)&&e.length>3)return i;return null}function A(a,t){const n=W(z(a)),e=Z(a),i=ss(a),o=e?`<span class="gf-swap">GF: ${c(e)}</span>`:"",r=i?`<span class="sf-swap">Lower-carb: ${c(i)}</span>`:"";return`<span class="${t}${e?" c-gluten":i?" c-sugar":""}">${c(n)}${o}${r}</span>`}function ts(a,t={}){var y;const{showMatch:n=!0,isFavorite:e=!1,isOnMakeList:i=!1,cookedDates:o=[],userIngs:r=[],hasNotes:p=!1}=t,s=a,m=X(s.pct),D=s.img?" has-hero":"",_=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${c(s.img)}" alt="${c(s.title)}"></div>`:"",x=n&&s.pct!==void 0?`<span class="match-pill ${m}">${s.pct}%</span>`:"",F=s.time?`<span>⏱ ${s.time} min</span>`:"",H=s.servings?`<span>👤 ${s.servings} servings</span>`:"",h=s.nut||{},I=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${h.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${h.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${h.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${h.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${h.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",$=s.cats||[],G=$.length?`<div class="card-cats">${$.map(d=>`<span class="card-cat">${c(d)}</span>`).join("")}</div>`:"",k=s.have&&s.have.length?s.have:s.haveNames||[],w=s.need&&s.need.length?s.need:s.needNames||[],O=s.haveNames||[],u=s.needNames||[],q=k.length?`<div class="chip-label-sm">You have</div><div class="chips">${k.map(d=>A(d,"c-have")).join("")}</div>`:"",E=w.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${w.map(d=>A(d,"c-need")).join("")}</div>`:"",S=u.length===1&&r.length?V(u[0],r):null,P=S?`<div class="sub-hint">💡 Try ${c(S)} instead of ${c(u[0])}</div>`:"",R=e?"❤️ Fav":"🤍 Fav",U=i?"✓ Make Soon":"📌 Make Soon",f=o.length?o[o.length-1]:null;let v;if(f){const d=new Date(typeof f=="string"?f:f.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),M=typeof f=="object"?f.rating:0,Y=M?" "+"★".repeat(M):"";v=`✅ Made ${d}${Y}`}else v="☐ Made It";return`
    <article class="r-card ${m}${D}" data-recipe-id="${s.id}">
      ${_}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${c(s.title)}${p?' <span class="notes-badge" title="You have notes on this recipe">📝</span>':""}</div>
            <div class="r-site">${c(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${x}
          </div>
        </div>
        ${n?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${F}${H}
          <span>✅ ${O.length}/${((y=s.ing)==null?void 0:y.length)??0} ingredients</span>
        </div>
        ${I}
        ${G}
        ${q}
        ${E}
        ${P}
        <div class="r-actions">
          <div class="r-actions-row r-actions-primary">
            ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${c(s.url)}" data-recipe-title="${c(s.title)}" data-recipe-site="${c(s.site||"")}">📖 Instructions</a>`:""}
            <button class="btn-sm btn-shop make-btn${i?" on":""}" data-make-id="${s.id}">${U}</button>
            ${u.length?`<button class="btn-sm btn-cart shop-queue-btn" data-shop-queue-id="${s.id}" data-shop-queue-missing="${c(JSON.stringify(u))}" aria-label="Add to Make Soon and shopping list">🛒 +${u.length}</button>`:""}
          </div>
          <div class="r-actions-row r-actions-secondary">
            <button class="btn-sm btn-cook cook-btn" data-cook-id="${s.id}" data-cook-title="${c(s.title)}">${v}</button>
            <button class="btn-sm btn-fav fav-btn${e?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite">${R}</button>
            <button class="btn-sm btn-share share-btn" data-share-id="${s.id}" data-share-title="${c(s.title)}" data-share-url="${c(s.url||"")}">📤 Share</button>
          </div>
        </div>
      </div>
    </article>
  `}function es(a,t,n={}){if(!a.length)return"";const e=n.makelist?new Set(n.makelist):new Set,i=n.cookHistory||[],o=n.notes||{};return a.map(r=>{const p=i.filter(s=>s.id===r.id);return ts(r,{...n,isFavorite:t.has(r.id),isOnMakeList:e.has(r.id),cookedDates:p,hasNotes:!!o[r.id]})}).join("")}function is(a,t=[]){const n=L("makelist")||[];if(n.includes(a)||(n.push(a),C("makelist",n)),t.length){const i=new Set(L("shopList")||[]);t.forEach(o=>i.add(o)),C("shopList",[...i])}B();const e=t.length;J(e?`Added to Make Soon · ${e} ingredient${e!==1?"s":""} to Shopping 🛒`:"Added to Make Soon 📌")}export{ss as a,V as f,Z as g,es as r,is as s};
