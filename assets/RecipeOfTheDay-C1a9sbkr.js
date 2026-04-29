import{s as c,$ as H,a as l,e as n,g as N,b as M,c as w,d as Q}from"./index-B7RSgme_.js";import{f as L}from"./matching-D77SOAVP.js";import{h as A,t as F,a as O,o as P}from"./RecipeDetail-CxY_POHw.js";import"./supabase-DaN4is7k.js";function x(s){let t=0;for(let a=0;a<s.length;a++)t=(t<<5)-t+s.charCodeAt(a)|0;return Math.abs(t)}const E=new Set(["Dessert","Baking","Snack","Breakfast","Smoothie"]);function _(s){const t=s.filter(i=>{var u;return i.img&&i.nut&&i.nut.pro>=20&&i.ing&&i.ing.length>=7&&!((u=i.cats)!=null&&u.some(h=>E.has(h)))});if(!t.length)return null;const a=new Date,m=`${a.getFullYear()}-${a.getMonth()+1}-${a.getDate()}`,v=x(m)%t.length;return t[v]}let f=null;function q(s){f=_(s),f&&(r(),c("ingredients",r),c("staples",r),c("favorites",r),c("makelist",r),c("cookHistory",r))}function r(){const s=H("#rotdSpotlight");if(!s||!f)return;const t=f,a=l("ingredients"),m=l("staples"),v=new Set(l("favorites")),i=l("makelist"),u=l("cookHistory")||[],I=L({recipes:[t],ingredients:a,staples:m,selectedCats:[],allergies:new Set})[0]||{...t,pct:0,needNames:t.ing||[]},k=v.has(t.id),y=i.includes(t.id),b=u.filter(e=>e.id===t.id),o=b.length?b[b.length-1]:null,d=t.nut||{},C=a.length>0?`<span>${I.pct}% match</span>`:"";let S="☐ I Made This";if(o){const e=new Date(typeof o=="string"?o:o.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),p=typeof o=="object"&&o.rating?" "+"★".repeat(o.rating):"";S=`✅ Made ${e}${p}`}s.innerHTML=`
    <div class="rotd-label">🌟 Recipe of the Day</div>
    <div class="rotd-card" data-recipe-id="${t.id}">
      <div class="rotd-img">
        <img loading="lazy" decoding="async" src="${n(t.img)}" alt="${n(t.title)}">
      </div>
      <div class="rotd-body">
        <div class="rotd-title">${n(t.title)}</div>
        <div class="rotd-site">${n(t.site||"")}</div>
        <div class="rotd-meta">
          ${t.time?`<span>⏱ ${t.time} min</span>`:""}
          ${t.servings?`<span>👤 ${t.servings} srv</span>`:""}
          <span>🥘 ${t.ing.length} ingredients</span>
          ${C}
        </div>
        <div class="rotd-nut">
          <div>${d.cal??"—"} <span>cal</span></div>
          <div>${d.pro??"—"}g <span>protein</span></div>
          <div>${d.carb??"—"}g <span>carbs</span></div>
          <div>${d.fat??"—"}g <span>fat</span></div>
          <div>${d.fib??"—"}g <span>fiber</span></div>
        </div>
        <div class="rotd-actions">
          ${t.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${n(t.url)}" data-recipe-title="${n(t.title)}" data-recipe-site="${n(t.site||"")}">📖 View</a>`:""}
          <button class="btn-sm btn-shop make-btn${y?" on":""}" data-make-id="${t.id}">${y?"✓ Queued":"📌 Queue"}</button>
          <button class="btn-sm btn-fav fav-btn${k?" on":""}" data-fav-id="${t.id}">${k?"❤️":"🤍"}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${t.id}">${S}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${t.id}" data-share-title="${n(t.title)}" data-share-url="${n(t.url||"")}">📤</button>
        </div>
      </div>
    </div>
  `,s.hidden=!1,s.onclick=e=>{if(e.target.closest("[data-recipe-url]")||A(e))return;const p=e.target.closest(".fav-btn");if(p){e.stopPropagation(),F(Number(p.dataset.favId));return}const D=e.target.closest(".make-btn");if(D){e.stopPropagation();const $=Number(D.dataset.makeId),g=N("makelist");g.includes($)?(M("makelist",g.filter(B=>B!==$)),w("Removed from My Queue")):(g.push($),M("makelist",g),w("Added to My Queue 📌")),Q();return}const R=e.target.closest(".cook-btn");if(R){e.stopPropagation(),O(Number(R.dataset.cookId));return}const T=e.target.closest(".rotd-card");T&&P(Number(T.dataset.recipeId))}}export{q as initROTD};
