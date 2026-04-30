import{s as b,$ as Y,a as $,e,g as _,b as P,c as Q,d as x,i as z,j as U}from"./index-DLcE2rKm.js";import{f as G}from"./matching-CrT7Or1q.js";import{g as K,s as W,f as q}from"./RecipeCard-DQe75pku.js";import{g as J,h as X,t as Z,a as tt,o as st}from"./RecipeDetail-C9uDZy5z.js";import"./supabase-DaN4is7k.js";function et(a){let t=0;for(let i=0;i<a.length;i++)t=(t<<5)-t+a.charCodeAt(i)|0;return Math.abs(t)}const nt=new Set(["Dessert","Baking","Snack","Breakfast","Smoothie"]),at=new Set(["Lazy Cat Kitchen","Rainbow Plant Life","Pick Up Limes","Vegan Richa","Minimalist Baker","Loving It Vegan"]);function it(a){const t=a.filter(n=>{var f;return n.img&&n.nut&&n.nut.pro>=20&&n.ing&&n.ing.length>=10&&n.ing.length<=15&&n.time&&n.time<=90&&!((f=n.cats)!=null&&f.some(k=>nt.has(k)))});if(!t.length)return null;const i=t.filter(n=>n.site&&at.has(n.site)),m=i.length>=30?i:t,h=new Date,y=`harvest-${h.getFullYear()}-${h.getMonth()+1}-${h.getDate()}`,w=et(y)%m.length;return m[w]}let S=null;function gt(a){S=it(a),S&&(p(),b("ingredients",p),b("staples",p),b("favorites",p),b("makelist",p),b("cookHistory",p))}function p(){const a=Y("#rotdSpotlight");if(!a||!S)return;const t=S,i=$("ingredients"),m=$("staples"),h=new Set($("favorites")),y=$("makelist"),w=$("cookHistory")||[],f=G({recipes:[t],ingredients:i,staples:m,selectedCats:[],allergies:new Set})[0]||{...t,pct:0,haveNames:[],needNames:t.ing||[]},k=h.has(t.id),T=y.includes(t.id),I=w.filter(s=>s.id===t.id),d=I.length?I[I.length-1]:null,v=t.nut||{},A=i.length>0?`<span class="rotd-match">${f.pct}% match</span>`:"",N=f.haveNames||[],L=f.needNames||[],B=[...i,...m];function C(s,o){const r=e(z(U(s))),g=K(s),u=W(s);let c="";if(g&&(c+=` <em class="rotd-hint-gf">(GF: ${e(g)})</em>`),u&&(c+=` <em class="rotd-hint-sf">(Swap: ${e(u)})</em>`),o&&B.length){const l=q(s,B);l&&(c+=` <em class="rotd-hint-sub">(💡 try ${e(l)})</em>`)}return c?`<span class="${g?"rotd-ing-gf":u?"rotd-ing-sf":""}">${r}${c}</span>`:r}const R=N.length?`<strong>You have:</strong> ${N.map(s=>C(s,!1)).join(", ")}`:"",D=L.length?`<strong>You need:</strong> ${L.map(s=>C(s,!0)).join(", ")}`:"",H=(t.cats||[]).map(s=>`<span class="rotd-cat">${e(s)}</span>`).join(""),O=[...t.ing||[]],F=new Set,M=[];for(const s of O){const o=J(s);if(o&&o.benefits)for(const r of o.benefits)F.has(r)||(F.add(r),M.push(r))}const j=M.length?M.slice(0,5).map(s=>`<span class="rotd-benefit">✦ ${e(s)}</span>`).join(""):"";let E="☐ I Made This";if(d){const s=new Date(typeof d=="string"?d:d.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),o=typeof d=="object"&&d.rating?" "+"★".repeat(d.rating):"";E=`✅ Made ${s}${o}`}a.innerHTML=`
    <div class="rotd-label">🌟 Recipe of the Day</div>
    <div class="rotd-card" data-recipe-id="${t.id}">
      <div class="rotd-img">
        <img loading="lazy" decoding="async" src="${e(t.img)}" alt="${e(t.title)}">
      </div>
      <div class="rotd-body">
        <div class="rotd-title">${e(t.title)} ${A}</div>
        <div class="rotd-site">${e(t.site||"")} · ${t.time?`${t.time} min`:""} · ${t.servings?`${t.servings} servings`:""} · ${t.ing.length} ingredients</div>
        <div class="rotd-nut">
          <div>${v.cal??"—"} <span>cal</span></div>
          <div>${v.pro??"—"}g <span>protein</span></div>
          <div>${v.carb??"—"}g <span>carbs</span></div>
          <div>${v.fat??"—"}g <span>fat</span></div>
          <div>${v.fib??"—"}g <span>fiber</span></div>
        </div>
        ${R||D?`<div class="rotd-ings">${R}${R&&D?"<br>":""}${D}</div>`:""}
        ${H?`<div class="rotd-cats">${H}</div>`:""}
        ${j?`<div class="rotd-benefits"><div class="rotd-benefits-label">🌿 Health Benefits</div>${j}</div>`:""}
        <div class="rotd-actions">
          ${t.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${e(t.url)}" data-recipe-title="${e(t.title)}" data-recipe-site="${e(t.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${T?" on":""}" data-make-id="${t.id}">${T?"✓ My Queue":"📌 My Queue"}</button>
          <button class="btn-sm btn-fav fav-btn${k?" on":""}" data-fav-id="${t.id}">${k?"❤️ Favorited":"🤍 Favorite"}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${t.id}">${E}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${t.id}" data-share-title="${e(t.title)}" data-share-url="${e(t.url||"")}">📤 Share</button>
        </div>
      </div>
    </div>
  `,a.hidden=!1,a.onclick=s=>{if(s.target.closest("[data-recipe-url]")||X(s))return;const o=s.target.closest(".fav-btn");if(o){s.stopPropagation(),Z(Number(o.dataset.favId));return}const r=s.target.closest(".make-btn");if(r){s.stopPropagation();const c=Number(r.dataset.makeId),l=_("makelist");l.includes(c)?(P("makelist",l.filter(V=>V!==c)),Q("Removed from My Queue")):(l.push(c),P("makelist",l),Q("Added to My Queue 📌")),x();return}const g=s.target.closest(".cook-btn");if(g){s.stopPropagation(),tt(Number(g.dataset.cookId));return}const u=s.target.closest(".rotd-card");u&&st(Number(u.dataset.recipeId))}}export{gt as initROTD};
