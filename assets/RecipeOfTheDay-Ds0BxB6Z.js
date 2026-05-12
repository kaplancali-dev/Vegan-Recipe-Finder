import{a as $,$ as x,b as k,e as n,g as U,c as P,d as E,f as V,h as Y,i as z}from"./index-2YtRyO1g.js";import{f as J}from"./matching-C8N7Q3yU.js";import{g as G,s as K,f as W}from"./RecipeCard-B2fw0W0s.js";import{g as X,h as Z,t as tt,s as st,a as et,o as nt}from"./RecipeDetail-CodZNkCF.js";import"./supabase-DaN4is7k.js";function at(i){let t=0;for(let e=0;e<i.length;e++)t=(t<<5)-t+i.charCodeAt(e)|0;return Math.abs(t)}const it=new Set(["Dessert","Baking","Snack","Breakfast","Smoothie"]),ot=new Set(["Lazy Cat Kitchen","Rainbow Plant Life","Pick Up Limes","Vegan Richa","Minimalist Baker","Loving It Vegan"]);function rt(i){const t=i.filter(a=>{var p;return a.img&&a.nut&&a.nut.pro>=20&&a.ing&&a.ing.length>=10&&a.ing.length<=15&&a.time&&a.time<=90&&!((p=a.cats)!=null&&p.some(S=>it.has(S)))});if(!t.length)return null;const e=t.filter(a=>a.site&&ot.has(a.site)),f=e.length>=30?e:t,m=new Date,w=`harvest-${m.getFullYear()}-${m.getMonth()+1}-${m.getDate()}`,I=at(w)%f.length;return f[I]}let y=null;function pt(i){if(y=rt(i),!y)return;j();let t=0;const e=()=>{cancelAnimationFrame(t),t=requestAnimationFrame(j)};$("ingredients",e),$("staples",e),$("favorites",e),$("makelist",e),$("cookHistory",e)}function j(){const i=x("#rotdSpotlight");if(!i||!y)return;const t=y,e=k("ingredients"),f=k("staples"),m=new Set(k("favorites")),w=k("makelist"),I=k("cookHistory")||[],p=J({recipes:[t],ingredients:e,staples:f,selectedCats:[],allergies:new Set})[0]||{...t,pct:0,haveNames:[],needNames:t.ing||[]},S=m.has(t.id),T=w.includes(t.id),M=I.filter(s=>s.id===t.id),l=M.length?M[M.length-1]:null,b=t.nut||{},O=e.length>0||f.length>0?`<span class="rotd-match">${p.pct}% match</span>`:"",L=p.haveNames||[],v=p.needNames||[],B=[...e,...f];function F(s,o){const r=n(Y(z(s))),h=G(s),g=K(s);let c="";if(h&&(c+=` <em class="rotd-hint-gf">(GF: ${n(h)})</em>`),g&&(c+=` <em class="rotd-hint-sf">(Lower-carb: ${n(g)})</em>`),o&&B.length){const d=W(s,B);d&&(c+=` <em class="rotd-hint-sub">(💡 try ${n(d)})</em>`)}return c?`<span class="${h?"rotd-ing-gf":g?"rotd-ing-sf":""}">${r}${c}</span>`:r}const D=L.length?`<span class="rotd-have"><strong>You have:</strong> ${L.map(s=>F(s,!1)).join(", ")}</span>`:"",N=v.length?`<span class="rotd-need"><strong>You need:</strong> ${v.map(s=>F(s,!0)).join(", ")}</span>`:"",C=(t.cats||[]).map(s=>`<span class="rotd-cat">${n(s)}</span>`).join(""),Q=[...t.ing||[]],H=new Set,R=[];for(const s of Q){const o=X(s);if(o&&o.benefits)for(const r of o.benefits)H.has(r)||(H.add(r),R.push(r))}const q=R.length?R.slice(0,5).map(s=>`<span class="rotd-benefit">✦ ${n(s)}</span>`).join(""):"";let A="☐ I Made This";if(l){const s=new Date(typeof l=="string"?l:l.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),o=typeof l=="object"&&l.rating?" "+"★".repeat(l.rating):"";A=`✅ Made ${s}${o}`}i.innerHTML=`
    <div class="rotd-label">🌟 Recipe of the Day</div>
    <div class="rotd-card" data-recipe-id="${t.id}">
      <div class="rotd-img">
        <img loading="lazy" decoding="async" src="${n(t.img)}" alt="${n(t.title)}">
      </div>
      <div class="rotd-body">
        <div class="rotd-top">
          <div class="rotd-title">${n(t.title)}</div>
          ${O}
        </div>
        <div class="rotd-site">${n(t.site||"")} · ${t.time?`${t.time} min`:""} · ${t.servings?`${t.servings} servings`:""} · ${t.ing.length} ingredients</div>
        <div class="rotd-nut">
          <div>${b.cal??"—"} <span>cal</span></div>
          <div>${b.pro??"—"}g <span>protein</span></div>
          <div>${b.carb??"—"}g <span>carbs</span></div>
          <div>${b.fat??"—"}g <span>fat</span></div>
          <div>${b.fib??"—"}g <span>fiber</span></div>
        </div>
        ${D||N?`<div class="rotd-ings">${D}${D&&N?"<br>":""}${N}</div>`:""}
        ${C?`<div class="rotd-cats">${C}</div>`:""}
        ${q?`<div class="rotd-benefits"><div class="rotd-benefits-label">🌿 Health Benefits</div>${q}</div>`:""}
        <div class="rotd-actions">
          ${t.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${n(t.url)}" data-recipe-title="${n(t.title)}" data-recipe-site="${n(t.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${T?" on":""}" data-make-id="${t.id}">${T?"✓ Make Soon":"📌 Make Soon"}</button>
          ${v.length?`<button class="btn-sm btn-cart shop-queue-btn" data-shop-queue-id="${t.id}" data-shop-queue-missing="${n(JSON.stringify(v))}" aria-label="Add to Make Soon and shopping list">🛒 +${v.length}</button>`:""}
          <button class="btn-sm btn-fav fav-btn${S?" on":""}" data-fav-id="${t.id}">${S?"❤️ Favorited":"🤍 Favorite"}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${t.id}">${A}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${t.id}" data-share-title="${n(t.title)}" data-share-url="${n(t.url||"")}">📤 Share</button>
        </div>
      </div>
    </div>
  `,i.hidden=!1,i.onclick=s=>{if(s.target.closest("[data-recipe-url]")||Z(s))return;const o=s.target.closest(".fav-btn");if(o){s.stopPropagation(),tt(Number(o.dataset.favId));return}const r=s.target.closest(".shop-queue-btn");if(r){s.stopPropagation();const d=Number(r.dataset.shopQueueId);let u=[];try{u=JSON.parse(r.dataset.shopQueueMissing||"[]")}catch{}st(d,u);return}const h=s.target.closest(".make-btn");if(h){s.stopPropagation();const d=Number(h.dataset.makeId),u=U("makelist");u.includes(d)?(P("makelist",u.filter(_=>_!==d)),E("Unqueued — maybe next week")):(u.push(d),P("makelist",u),E("Added to Make Soon 📌")),V();return}const g=s.target.closest(".cook-btn");if(g){s.stopPropagation(),et(Number(g.dataset.cookId),{title:g.dataset.cookTitle});return}if(s.target.closest(".rotd-actions"))return;const c=s.target.closest(".rotd-card");c&&nt(Number(c.dataset.recipeId))}}export{pt as initROTD};
