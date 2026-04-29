import{s as m,$ as E,a as h,e,g as _,b as A,c as O,d as z,i as G,j as U}from"./index-BgiYPnmk.js";import{f as V}from"./matching-M4Jpp9qG.js";import{g as W,s as q,f as J}from"./RecipeCard-Bg7j57Qi.js";import{g as K,h as X,t as Z,a as tt,o as st}from"./RecipeDetail-BP3QqhUd.js";import"./supabase-DaN4is7k.js";function et(n){let t=0;for(let a=0;a<n.length;a++)t=(t<<5)-t+n.charCodeAt(a)|0;return Math.abs(t)}const nt=new Set(["Dessert","Baking","Snack","Breakfast","Smoothie"]);function at(n){const t=n.filter(i=>{var $;return i.img&&i.nut&&i.nut.pro>=20&&i.ing&&i.ing.length>=9&&i.ing.length<=15&&i.time&&i.time<=90&&!(($=i.cats)!=null&&$.some(M=>nt.has(M)))});if(!t.length)return null;const a=new Date,v=`harvest-${a.getFullYear()}-${a.getMonth()+1}-${a.getDate()}`,k=et(v)%t.length;return t[k]}let b=null;function ft(n){b=at(n),b&&(u(),m("ingredients",u),m("staples",u),m("favorites",u),m("makelist",u),m("cookHistory",u))}function u(){const n=E("#rotdSpotlight");if(!n||!b)return;const t=b,a=h("ingredients"),v=h("staples"),k=new Set(h("favorites")),i=h("makelist"),$=h("cookHistory")||[],S=V({recipes:[t],ingredients:a,staples:v,selectedCats:[],allergies:new Set})[0]||{...t,pct:0,haveNames:[],needNames:t.ing||[]},N=k.has(t.id),T=i.includes(t.id),y=$.filter(s=>s.id===t.id),d=y.length?y[y.length-1]:null,p=t.nut||{},P=a.length>0?`<span class="rotd-match">${S.pct}% match</span>`:"",R=S.haveNames||[],H=S.needNames||[],B=[...a,...v];function C(s,o){const r=e(G(U(s))),f=W(s),g=q(s);let c="";if(f&&(c+=` <em class="rotd-hint-gf">(GF: ${e(f)})</em>`),g&&(c+=` <em class="rotd-hint-sf">(Swap: ${e(g)})</em>`),o&&B.length){const l=J(s,B);l&&(c+=` <em class="rotd-hint-sub">(💡 try ${e(l)})</em>`)}return c?`<span class="${f?"rotd-ing-gf":g?"rotd-ing-sf":""}">${r}${c}</span>`:r}const w=R.length?`<strong>You have:</strong> ${R.map(s=>C(s,!1)).join(", ")}`:"",D=H.length?`<strong>You need:</strong> ${H.map(s=>C(s,!0)).join(", ")}`:"",j=(t.cats||[]).map(s=>`<span class="rotd-cat">${e(s)}</span>`).join(""),Y=[...t.ing||[]],F=new Set,I=[];for(const s of Y){const o=K(s);if(o&&o.benefits)for(const r of o.benefits)F.has(r)||(F.add(r),I.push(r))}const L=I.length?I.slice(0,5).map(s=>`<span class="rotd-benefit">✦ ${e(s)}</span>`).join(""):"";let Q="☐ I Made This";if(d){const s=new Date(typeof d=="string"?d:d.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),o=typeof d=="object"&&d.rating?" "+"★".repeat(d.rating):"";Q=`✅ Made ${s}${o}`}n.innerHTML=`
    <div class="rotd-label">🌟 Recipe of the Day</div>
    <div class="rotd-card" data-recipe-id="${t.id}">
      <div class="rotd-img">
        <img loading="lazy" decoding="async" src="${e(t.img)}" alt="${e(t.title)}">
      </div>
      <div class="rotd-body">
        <div class="rotd-title">${e(t.title)} ${P}</div>
        <div class="rotd-site">${e(t.site||"")} · ${t.time?`${t.time} min`:""} · ${t.servings?`${t.servings} servings`:""} · ${t.ing.length} ingredients</div>
        <div class="rotd-nut">
          <div>${p.cal??"—"} <span>cal</span></div>
          <div>${p.pro??"—"}g <span>protein</span></div>
          <div>${p.carb??"—"}g <span>carbs</span></div>
          <div>${p.fat??"—"}g <span>fat</span></div>
          <div>${p.fib??"—"}g <span>fiber</span></div>
        </div>
        ${w||D?`<div class="rotd-ings">${w}${w&&D?"<br>":""}${D}</div>`:""}
        ${j?`<div class="rotd-cats">${j}</div>`:""}
        ${L?`<div class="rotd-benefits"><div class="rotd-benefits-label">🌿 Health Benefits</div>${L}</div>`:""}
        <div class="rotd-actions">
          ${t.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${e(t.url)}" data-recipe-title="${e(t.title)}" data-recipe-site="${e(t.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${T?" on":""}" data-make-id="${t.id}">${T?"✓ My Queue":"📌 My Queue"}</button>
          <button class="btn-sm btn-fav fav-btn${N?" on":""}" data-fav-id="${t.id}">${N?"❤️ Favorited":"🤍 Favorite"}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${t.id}">${Q}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${t.id}" data-share-title="${e(t.title)}" data-share-url="${e(t.url||"")}">📤 Share</button>
        </div>
      </div>
    </div>
  `,n.hidden=!1,n.onclick=s=>{if(s.target.closest("[data-recipe-url]")||X(s))return;const o=s.target.closest(".fav-btn");if(o){s.stopPropagation(),Z(Number(o.dataset.favId));return}const r=s.target.closest(".make-btn");if(r){s.stopPropagation();const c=Number(r.dataset.makeId),l=_("makelist");l.includes(c)?(A("makelist",l.filter(x=>x!==c)),O("Removed from My Queue")):(l.push(c),A("makelist",l),O("Added to My Queue 📌")),z();return}const f=s.target.closest(".cook-btn");if(f){s.stopPropagation(),tt(Number(f.dataset.cookId));return}const g=s.target.closest(".rotd-card");g&&st(Number(g.dataset.recipeId))}}export{ft as initROTD};
