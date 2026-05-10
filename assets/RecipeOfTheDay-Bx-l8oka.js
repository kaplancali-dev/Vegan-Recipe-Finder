import{a as v,$ as U,b,e as n,g as V,c as P,d as j,f as Y,h as q,i as z}from"./index-XUWx7_0p.js";import{f as G}from"./matching-DN1tcyX1.js";import{g as K,s as Q,f as W}from"./RecipeCard-TdQnTZKj.js";import{g as J,h as X,t as Z,a as tt,o as et}from"./RecipeDetail-CndGhQxH.js";import"./supabase-DaN4is7k.js";function st(i){let t=0;for(let s=0;s<i.length;s++)t=(t<<5)-t+i.charCodeAt(s)|0;return Math.abs(t)}const nt=new Set(["Dessert","Baking","Snack","Breakfast","Smoothie"]),at=new Set(["Lazy Cat Kitchen","Rainbow Plant Life","Pick Up Limes","Vegan Richa","Minimalist Baker","Loving It Vegan"]);function it(i){const t=i.filter(a=>{var p;return a.img&&a.nut&&a.nut.pro>=20&&a.ing&&a.ing.length>=10&&a.ing.length<=15&&a.time&&a.time<=90&&!((p=a.cats)!=null&&p.some($=>nt.has($)))});if(!t.length)return null;const s=t.filter(a=>a.site&&at.has(a.site)),f=s.length>=30?s:t,m=new Date,S=`harvest-${m.getFullYear()}-${m.getMonth()+1}-${m.getDate()}`,y=st(S)%f.length;return f[y]}let k=null;function ft(i){if(k=it(i),!k)return;A();let t=0;const s=()=>{cancelAnimationFrame(t),t=requestAnimationFrame(A)};v("ingredients",s),v("staples",s),v("favorites",s),v("makelist",s),v("cookHistory",s)}function A(){const i=U("#rotdSpotlight");if(!i||!k)return;const t=k,s=b("ingredients"),f=b("staples"),m=new Set(b("favorites")),S=b("makelist"),y=b("cookHistory")||[],p=G({recipes:[t],ingredients:s,staples:f,selectedCats:[],allergies:new Set})[0]||{...t,pct:0,haveNames:[],needNames:t.ing||[]},$=m.has(t.id),M=S.includes(t.id),w=y.filter(e=>e.id===t.id),d=w.length?w[w.length-1]:null,h=t.nut||{},_=s.length>0||f.length>0?`<span class="rotd-match">${p.pct}% match</span>`:"",T=p.haveNames||[],L=p.needNames||[],N=[...s,...f];function F(e,o){const r=n(q(z(e))),l=K(e),u=Q(e);let c="";if(l&&(c+=` <em class="rotd-hint-gf">(GF: ${n(l)})</em>`),u&&(c+=` <em class="rotd-hint-sf">(Lower-carb: ${n(u)})</em>`),o&&N.length){const g=W(e,N);g&&(c+=` <em class="rotd-hint-sub">(💡 try ${n(g)})</em>`)}return c?`<span class="${l?"rotd-ing-gf":u?"rotd-ing-sf":""}">${r}${c}</span>`:r}const I=T.length?`<span class="rotd-have"><strong>You have:</strong> ${T.map(e=>F(e,!1)).join(", ")}</span>`:"",D=L.length?`<span class="rotd-need"><strong>You need:</strong> ${L.map(e=>F(e,!0)).join(", ")}</span>`:"",B=(t.cats||[]).map(e=>`<span class="rotd-cat">${n(e)}</span>`).join(""),x=[...t.ing||[]],C=new Set,R=[];for(const e of x){const o=J(e);if(o&&o.benefits)for(const r of o.benefits)C.has(r)||(C.add(r),R.push(r))}const H=R.length?R.slice(0,5).map(e=>`<span class="rotd-benefit">✦ ${n(e)}</span>`).join(""):"";let E="☐ I Made This";if(d){const e=new Date(typeof d=="string"?d:d.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),o=typeof d=="object"&&d.rating?" "+"★".repeat(d.rating):"";E=`✅ Made ${e}${o}`}i.innerHTML=`
    <div class="rotd-label">🌟 Recipe of the Day</div>
    <div class="rotd-card" data-recipe-id="${t.id}">
      <div class="rotd-img">
        <img loading="lazy" decoding="async" src="${n(t.img)}" alt="${n(t.title)}">
      </div>
      <div class="rotd-body">
        <div class="rotd-top">
          <div class="rotd-title">${n(t.title)}</div>
          ${_}
        </div>
        <div class="rotd-site">${n(t.site||"")} · ${t.time?`${t.time} min`:""} · ${t.servings?`${t.servings} servings`:""} · ${t.ing.length} ingredients</div>
        <div class="rotd-nut">
          <div>${h.cal??"—"} <span>cal</span></div>
          <div>${h.pro??"—"}g <span>protein</span></div>
          <div>${h.carb??"—"}g <span>carbs</span></div>
          <div>${h.fat??"—"}g <span>fat</span></div>
          <div>${h.fib??"—"}g <span>fiber</span></div>
        </div>
        ${I||D?`<div class="rotd-ings">${I}${I&&D?"<br>":""}${D}</div>`:""}
        ${B?`<div class="rotd-cats">${B}</div>`:""}
        ${H?`<div class="rotd-benefits"><div class="rotd-benefits-label">🌿 Health Benefits</div>${H}</div>`:""}
        <div class="rotd-actions">
          ${t.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${n(t.url)}" data-recipe-title="${n(t.title)}" data-recipe-site="${n(t.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${M?" on":""}" data-make-id="${t.id}">${M?"✓ Make Soon":"📌 Make Soon"}</button>
          <button class="btn-sm btn-fav fav-btn${$?" on":""}" data-fav-id="${t.id}">${$?"❤️ Favorited":"🤍 Favorite"}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${t.id}">${E}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${t.id}" data-share-title="${n(t.title)}" data-share-url="${n(t.url||"")}">📤 Share</button>
        </div>
      </div>
    </div>
  `,i.hidden=!1,i.onclick=e=>{if(e.target.closest("[data-recipe-url]")||X(e))return;const o=e.target.closest(".fav-btn");if(o){e.stopPropagation(),Z(Number(o.dataset.favId));return}const r=e.target.closest(".make-btn");if(r){e.stopPropagation();const c=Number(r.dataset.makeId),g=V("makelist");g.includes(c)?(P("makelist",g.filter(O=>O!==c)),j("Unqueued — maybe next week")):(g.push(c),P("makelist",g),j("Added to Make Soon 📌")),Y();return}const l=e.target.closest(".cook-btn");if(l){e.stopPropagation(),tt(Number(l.dataset.cookId),{title:l.dataset.cookTitle});return}if(e.target.closest(".rotd-actions"))return;const u=e.target.closest(".rotd-card");u&&et(Number(u.dataset.recipeId))}}export{ft as initROTD};
