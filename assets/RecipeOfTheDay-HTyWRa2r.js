import{s as c,$ as L,a as l,e as n,g as j,b as B,c as F,d as A}from"./index-jJSobQoh.js";import{f as O}from"./matching-D2vH7cXO.js";import{h as P,t as Y,a as x,o as E}from"./RecipeDetail-ByT8ym5m.js";import"./supabase-DaN4is7k.js";function _(s){let t=0;for(let i=0;i<s.length;i++)t=(t<<5)-t+s.charCodeAt(i)|0;return Math.abs(t)}const z=new Set(["Dessert","Baking","Snack","Breakfast","Smoothie"]);function V(s){const t=s.filter(a=>{var g;return a.img&&a.nut&&a.nut.pro>=20&&a.ing&&a.ing.length>=7&&a.ing.length<=15&&a.time&&a.time<=90&&!((g=a.cats)!=null&&g.some(M=>z.has(M)))});if(!t.length)return null;const i=new Date,$=`${i.getFullYear()}-${i.getMonth()+1}-${i.getDate()}`,f=_($)%t.length;return t[f]}let v=null;function U(s){v=V(s),v&&(r(),c("ingredients",r),c("staples",r),c("favorites",r),c("makelist",r),c("cookHistory",r))}function r(){const s=L("#rotdSpotlight");if(!s||!v)return;const t=v,i=l("ingredients"),$=l("staples"),f=new Set(l("favorites")),a=l("makelist"),g=l("cookHistory")||[],b=O({recipes:[t],ingredients:i,staples:$,selectedCats:[],allergies:new Set})[0]||{...t,pct:0,haveNames:[],needNames:t.ing||[]},N=f.has(t.id),R=a.includes(t.id),k=g.filter(e=>e.id===t.id),o=k.length?k[k.length-1]:null,d=t.nut||{},H=i.length>0?`<span class="rotd-match">${b.pct}% match</span>`:"",u=b.haveNames||[],m=b.needNames||[],y=u.length?`<strong>You have:</strong> ${u.slice(0,6).map(e=>n(e)).join(", ")}${u.length>6?` +${u.length-6} more`:""}`:"",S=m.length?`<strong>You need:</strong> ${m.slice(0,5).map(e=>n(e)).join(", ")}${m.length>5?` +${m.length-5} more`:""}`:"";let T="☐ I Made This";if(o){const e=new Date(typeof o=="string"?o:o.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),h=typeof o=="object"&&o.rating?" "+"★".repeat(o.rating):"";T=`✅ Made ${e}${h}`}s.innerHTML=`
    <div class="rotd-label">🌟 Recipe of the Day</div>
    <div class="rotd-card" data-recipe-id="${t.id}">
      <div class="rotd-img">
        <img loading="lazy" decoding="async" src="${n(t.img)}" alt="${n(t.title)}">
      </div>
      <div class="rotd-body">
        <div class="rotd-title">${n(t.title)} ${H}</div>
        <div class="rotd-site">${n(t.site||"")} · ${t.time?`${t.time} min`:""} · ${t.servings?`${t.servings} servings`:""} · ${t.ing.length} ingredients</div>
        <div class="rotd-nut">
          <div>${d.cal??"—"} <span>cal</span></div>
          <div>${d.pro??"—"}g <span>protein</span></div>
          <div>${d.carb??"—"}g <span>carbs</span></div>
          <div>${d.fat??"—"}g <span>fat</span></div>
          <div>${d.fib??"—"}g <span>fiber</span></div>
        </div>
        ${y||S?`<div class="rotd-ings">${y}${y&&S?"<br>":""}${S}</div>`:""}
        <div class="rotd-actions">
          ${t.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${n(t.url)}" data-recipe-title="${n(t.title)}" data-recipe-site="${n(t.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${R?" on":""}" data-make-id="${t.id}">${R?"✓ My Queue":"📌 My Queue"}</button>
          <button class="btn-sm btn-fav fav-btn${N?" on":""}" data-fav-id="${t.id}">${N?"❤️ Favorited":"🤍 Favorite"}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${t.id}">${T}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${t.id}" data-share-title="${n(t.title)}" data-share-url="${n(t.url||"")}">📤 Share</button>
        </div>
      </div>
    </div>
  `,s.hidden=!1,s.onclick=e=>{if(e.target.closest("[data-recipe-url]")||P(e))return;const h=e.target.closest(".fav-btn");if(h){e.stopPropagation(),Y(Number(h.dataset.favId));return}const I=e.target.closest(".make-btn");if(I){e.stopPropagation();const D=Number(I.dataset.makeId),p=j("makelist");p.includes(D)?(B("makelist",p.filter(Q=>Q!==D)),F("Removed from My Queue")):(p.push(D),B("makelist",p),F("Added to My Queue 📌")),A();return}const w=e.target.closest(".cook-btn");if(w){e.stopPropagation(),x(Number(w.dataset.cookId));return}const C=e.target.closest(".rotd-card");C&&E(Number(C.dataset.recipeId))}}export{U as initROTD};
