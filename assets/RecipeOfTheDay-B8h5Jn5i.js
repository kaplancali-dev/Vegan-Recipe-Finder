import{s as m,$ as O,a as h,e,g as P,b as L,c as Q,d as Y,i as x}from"./index-BCc194U1.js";import{f as E}from"./matching-Bfyf2qdo.js";import{g as _,s as z,f as G}from"./RecipeCard-D9KkQuF4.js";import{h as U,t as V,a as W,o as q}from"./RecipeDetail-gh64BnjE.js";import"./supabase-DaN4is7k.js";function J(a){let t=0;for(let n=0;n<a.length;n++)t=(t<<5)-t+a.charCodeAt(n)|0;return Math.abs(t)}const K=new Set(["Dessert","Baking","Snack","Breakfast","Smoothie"]);function X(a){const t=a.filter(i=>{var $;return i.img&&i.nut&&i.nut.pro>=20&&i.ing&&i.ing.length>=9&&i.ing.length<=15&&i.time&&i.time<=90&&!(($=i.cats)!=null&&$.some(M=>K.has(M)))});if(!t.length)return null;const n=new Date,v=`harvest-${n.getFullYear()}-${n.getMonth()+1}-${n.getDate()}`,k=J(v)%t.length;return t[k]}let b=null;function it(a){b=X(a),b&&(g(),m("ingredients",g),m("staples",g),m("favorites",g),m("makelist",g),m("cookHistory",g))}function g(){const a=O("#rotdSpotlight");if(!a||!b)return;const t=b,n=h("ingredients"),v=h("staples"),k=new Set(h("favorites")),i=h("makelist"),$=h("cookHistory")||[],S=E({recipes:[t],ingredients:n,staples:v,selectedCats:[],allergies:new Set})[0]||{...t,pct:0,haveNames:[],needNames:t.ing||[]},N=k.has(t.id),T=i.includes(t.id),y=$.filter(s=>s.id===t.id),r=y.length?y[y.length-1]:null,f=t.nut||{},j=n.length>0?`<span class="rotd-match">${S.pct}% match</span>`:"",I=S.haveNames||[],R=S.needNames||[],C=[...n,...v];function F(s,d){const p=e(x(s)),l=_(s),u=z(s);let o="";if(l&&(o+=` <em class="rotd-hint-gf">(GF: ${e(l)})</em>`),u&&(o+=` <em class="rotd-hint-sf">(Swap: ${e(u)})</em>`),d&&C.length){const c=G(s,C);c&&(o+=` <em class="rotd-hint-sub">(💡 try ${e(c)})</em>`)}return o?`<span class="${l?"rotd-ing-gf":u?"rotd-ing-sf":""}">${p}${o}</span>`:p}const D=I.length?`<strong>You have:</strong> ${I.map(s=>F(s,!1)).join(", ")}`:"",w=R.length?`<strong>You need:</strong> ${R.map(s=>F(s,!0)).join(", ")}`:"",H=(t.cats||[]).map(s=>`<span class="rotd-cat">${e(s)}</span>`).join("");let B="☐ I Made This";if(r){const s=new Date(typeof r=="string"?r:r.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),d=typeof r=="object"&&r.rating?" "+"★".repeat(r.rating):"";B=`✅ Made ${s}${d}`}a.innerHTML=`
    <div class="rotd-label">🌟 Recipe of the Day</div>
    <div class="rotd-card" data-recipe-id="${t.id}">
      <div class="rotd-img">
        <img loading="lazy" decoding="async" src="${e(t.img)}" alt="${e(t.title)}">
      </div>
      <div class="rotd-body">
        <div class="rotd-title">${e(t.title)} ${j}</div>
        <div class="rotd-site">${e(t.site||"")} · ${t.time?`${t.time} min`:""} · ${t.servings?`${t.servings} servings`:""} · ${t.ing.length} ingredients</div>
        <div class="rotd-nut">
          <div>${f.cal??"—"} <span>cal</span></div>
          <div>${f.pro??"—"}g <span>protein</span></div>
          <div>${f.carb??"—"}g <span>carbs</span></div>
          <div>${f.fat??"—"}g <span>fat</span></div>
          <div>${f.fib??"—"}g <span>fiber</span></div>
        </div>
        ${D||w?`<div class="rotd-ings">${D}${D&&w?"<br>":""}${w}</div>`:""}
        ${H?`<div class="rotd-cats">${H}</div>`:""}
        <div class="rotd-actions">
          ${t.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${e(t.url)}" data-recipe-title="${e(t.title)}" data-recipe-site="${e(t.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${T?" on":""}" data-make-id="${t.id}">${T?"✓ My Queue":"📌 My Queue"}</button>
          <button class="btn-sm btn-fav fav-btn${N?" on":""}" data-fav-id="${t.id}">${N?"❤️ Favorited":"🤍 Favorite"}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${t.id}">${B}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${t.id}" data-share-title="${e(t.title)}" data-share-url="${e(t.url||"")}">📤 Share</button>
        </div>
      </div>
    </div>
  `,a.hidden=!1,a.onclick=s=>{if(s.target.closest("[data-recipe-url]")||U(s))return;const d=s.target.closest(".fav-btn");if(d){s.stopPropagation(),V(Number(d.dataset.favId));return}const p=s.target.closest(".make-btn");if(p){s.stopPropagation();const o=Number(p.dataset.makeId),c=P("makelist");c.includes(o)?(L("makelist",c.filter(A=>A!==o)),Q("Removed from My Queue")):(c.push(o),L("makelist",c),Q("Added to My Queue 📌")),Y();return}const l=s.target.closest(".cook-btn");if(l){s.stopPropagation(),W(Number(l.dataset.cookId));return}const u=s.target.closest(".rotd-card");u&&q(Number(u.dataset.recipeId))}}export{it as initROTD};
