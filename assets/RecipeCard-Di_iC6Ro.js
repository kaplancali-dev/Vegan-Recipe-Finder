import{n as r,e as l,i as R,j as U}from"./index-U9jBq3Di.js";import{I as M,G as W,S as Y}from"./matching-BHlwsEnG.js";function z(t,e){const i=r(t);for(const n of e){const a=r(n),o=M[a];if(o&&o.some(s=>r(s)===i))return n}const c=M[i];if(c){for(const n of c)if(e.some(a=>r(a)===r(n)))return n}return null}function B(t){return t>=80?"hi":t>=40?"md":"lo"}const g=new Map;for(const[t,e]of Object.entries(W))g.set(r(t),e);function Q(t){const e=r(t),i=g.get(e);if(i)return i;let c=null,n=0;for(const[a,o]of g)e.includes(a)&&a.length>3&&a.length>n&&(c=o,n=a.length);return c}const m=new Map;for(const[t,e]of Object.entries(Y))m.set(r(t),e);function V(t){const e=r(t),i=m.get(e);if(i)return i;for(const[c,n]of m)if(e.includes(c)&&c.length>3)return n;return null}function T(t,e){const i=R(U(t)),c=Q(t),n=V(t),a=c?`<span class="gf-swap">GF: ${l(c)}</span>`:"",o=n?`<span class="sf-swap">Swap: ${l(n)} to cut sugar calories</span>`:"";return`<span class="${e}${c?" c-gluten":n?" c-sugar":""}">${l(i)}${a}${o}</span>`}function q(t,e={}){var w;const{showMatch:i=!0,isFavorite:c=!1,isOnMakeList:n=!1,cookedDates:a=[],userIngs:o=[]}=e,s=t,h=B(s.pct),x=s.img?" has-hero":"",C=s.img?`<div class="hero-wrap"><img loading="lazy" decoding="async" src="${l(s.img)}" alt="${l(s.title)}"></div>`:"",L=i&&s.pct!==void 0?`<span class="match-pill ${h}">${s.pct}%</span>`:"",j=s.time?`<span>⏱ ${s.time} min</span>`:"",I=s.servings?`<span>👤 ${s.servings} servings</span>`:"",u=s.nut||{},H=s.nut?`
    <div class="nut-row">
      <div class="nut-item"><span class="nut-val">${u.cal??"—"}</span><span class="nut-lbl">cal</span></div>
      <div class="nut-item"><span class="nut-val">${u.pro??"—"}g</span><span class="nut-lbl">protein</span></div>
      <div class="nut-item"><span class="nut-val">${u.carb??"—"}g</span><span class="nut-lbl">carbs</span></div>
      <div class="nut-item"><span class="nut-val">${u.fat??"—"}g</span><span class="nut-lbl">fat</span></div>
      <div class="nut-item"><span class="nut-val">${u.fib??"—"}g</span><span class="nut-lbl">fiber</span></div>
      <span class="nut-est">est. per serving</span>
    </div>`:"",k=s.cats||[],N=k.length?`<div class="card-cats">${k.map(d=>`<span class="card-cat">${l(d)}</span>`).join("")}</div>`:"",b=s.haveNames||[],v=s.needNames||[],D=b.length?`<div class="chip-label-sm">You have</div><div class="chips">${b.map(d=>T(d,"c-have")).join("")}</div>`:"",F=v.length?`<div class="chip-label-sm" style="margin-top:4px">You need</div><div class="chips">${v.map(d=>T(d,"c-need")).join("")}</div>`:"",S=v.length===1&&o.length?z(v[0],o):null,G=S?`<div class="sub-hint">💡 Try ${l(S)} instead of ${l(v[0])}</div>`:"",_=c?"❤️":"🤍",O=c?"Saved":"Favorite",A=n?"✓":"📌",E="Queue",p=a.length?a[a.length-1]:null;let f,$;if(p){const d=new Date(typeof p=="string"?p:p.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),y=typeof p=="object"?p.rating:0,P=y?" "+"★".repeat(y):"";f="✅",$=`${d}${P}`}else f="☐",$="Made";return`
    <article class="r-card ${h}${x}" data-recipe-id="${s.id}">
      ${C}
      <div class="card-body">
        <div class="r-top">
          <div class="r-main">
            <div class="r-title">${l(s.title)}</div>
            <div class="r-site">${l(s.site||"")}</div>
          </div>
          <div class="r-right">
            ${L}
          </div>
        </div>
        ${i?`<div class="bar-wrap"><div class="bar-bg"><div class="bar-fill" style="width:${s.pct??0}%"></div></div></div>`:""}
        <div class="r-meta">
          ${j}${I}
          <span>✅ ${b.length}/${((w=s.ing)==null?void 0:w.length)??0} ingredients</span>
        </div>
        ${H}
        ${N}
        ${D}
        ${F}
        ${G}
        <div class="r-actions">
          ${s.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${l(s.url)}" data-recipe-title="${l(s.title)}" data-recipe-site="${l(s.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop btn-stacked make-btn${n?" on":""}" data-make-id="${s.id}"><span class="btn-icon">${A}</span><span class="btn-lbl">${E}</span></button>
          <button class="btn-sm btn-fav btn-stacked fav-btn${c?" on":""}" data-fav-id="${s.id}" aria-label="Toggle favorite"><span class="btn-icon">${_}</span><span class="btn-lbl">${O}</span></button>
          <button class="btn-sm btn-cook btn-stacked cook-btn" data-cook-id="${s.id}"><span class="btn-icon">${f}</span><span class="btn-lbl">${$}</span></button>
          <button class="btn-sm btn-share btn-stacked share-btn" data-share-id="${s.id}" data-share-title="${l(s.title)}" data-share-url="${l(s.url||"")}"><span class="btn-icon">📤</span><span class="btn-lbl">Share</span></button>
        </div>
      </div>
    </article>
  `}function X(t,e,i={}){if(!t.length)return"";const c=i.makelist?new Set(i.makelist):new Set,n=i.cookHistory||[];return t.map(a=>{const o=n.filter(s=>s.id===a.id);return q(a,{...i,isFavorite:e.has(a.id),isOnMakeList:c.has(a.id),cookedDates:o})}).join("")}export{z as f,Q as g,X as r,V as s};
