import{s as b,$ as V,a as $,e,g as Y,b as j,c as Q,d as _,f as z,h as A}from"./index-XSSTU-eJ.js";import{f as q}from"./matching-CBVxZvN6.js";import{g as G,s as K,f as W}from"./RecipeCard-CXpnw4Q6.js";import{g as J,h as X,t as Z,a as tt,o as st}from"./RecipeDetail-jpAlHnNO.js";import"./supabase-DaN4is7k.js";function et(a){let t=0;for(let i=0;i<a.length;i++)t=(t<<5)-t+a.charCodeAt(i)|0;return Math.abs(t)}const nt=new Set(["Dessert","Baking","Snack","Breakfast","Smoothie"]),at=new Set(["Lazy Cat Kitchen","Rainbow Plant Life","Pick Up Limes","Vegan Richa","Minimalist Baker","Loving It Vegan"]);function it(a){const t=a.filter(n=>{var u;return n.img&&n.nut&&n.nut.pro>=20&&n.ing&&n.ing.length>=10&&n.ing.length<=15&&n.time&&n.time<=90&&!((u=n.cats)!=null&&u.some(k=>nt.has(k)))});if(!t.length)return null;const i=t.filter(n=>n.site&&at.has(n.site)),f=i.length>=30?i:t,m=new Date,y=`harvest-${m.getFullYear()}-${m.getMonth()+1}-${m.getDate()}`,w=et(y)%f.length;return f[w]}let S=null;function ft(a){S=it(a),S&&(h(),b("ingredients",h),b("staples",h),b("favorites",h),b("makelist",h),b("cookHistory",h))}function h(){const a=V("#rotdSpotlight");if(!a||!S)return;const t=S,i=$("ingredients"),f=$("staples"),m=new Set($("favorites")),y=$("makelist"),w=$("cookHistory")||[],u=q({recipes:[t],ingredients:i,staples:f,selectedCats:[],allergies:new Set})[0]||{...t,pct:0,haveNames:[],needNames:t.ing||[]},k=m.has(t.id),M=y.includes(t.id),I=w.filter(s=>s.id===t.id),d=I.length?I[I.length-1]:null,v=t.nut||{},x=i.length>0||f.length>0?`<span class="rotd-match">${u.pct}% match</span>`:"",N=u.haveNames||[],L=u.needNames||[],B=[...i,...f];function C(s,o){const r=e(z(A(s))),l=G(s),p=K(s);let c="";if(l&&(c+=` <em class="rotd-hint-gf">(GF: ${e(l)})</em>`),p&&(c+=` <em class="rotd-hint-sf">(${r} swap: ${e(p)} to significantly reduce calories/carbs)</em>`),o&&B.length){const g=W(s,B);g&&(c+=` <em class="rotd-hint-sub">(💡 try ${e(g)})</em>`)}return c?`<span class="${l?"rotd-ing-gf":p?"rotd-ing-sf":""}">${r}${c}</span>`:r}const D=N.length?`<span class="rotd-have"><strong>You have:</strong> ${N.map(s=>C(s,!1)).join(", ")}</span>`:"",R=L.length?`<span class="rotd-need"><strong>You need:</strong> ${L.map(s=>C(s,!0)).join(", ")}</span>`:"",H=(t.cats||[]).map(s=>`<span class="rotd-cat">${e(s)}</span>`).join(""),O=[...t.ing||[]],F=new Set,T=[];for(const s of O){const o=J(s);if(o&&o.benefits)for(const r of o.benefits)F.has(r)||(F.add(r),T.push(r))}const E=T.length?T.slice(0,5).map(s=>`<span class="rotd-benefit">✦ ${e(s)}</span>`).join(""):"";let P="☐ I Made This";if(d){const s=new Date(typeof d=="string"?d:d.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),o=typeof d=="object"&&d.rating?" "+"★".repeat(d.rating):"";P=`✅ Made ${s}${o}`}a.innerHTML=`
    <div class="rotd-label">🌟 Recipe of the Day</div>
    <div class="rotd-card" data-recipe-id="${t.id}">
      <div class="rotd-img">
        <img loading="lazy" decoding="async" src="${e(t.img)}" alt="${e(t.title)}">
      </div>
      <div class="rotd-body">
        <div class="rotd-top">
          <div class="rotd-title">${e(t.title)}</div>
          ${x}
        </div>
        <div class="rotd-site">${e(t.site||"")} · ${t.time?`${t.time} min`:""} · ${t.servings?`${t.servings} servings`:""} · ${t.ing.length} ingredients</div>
        <div class="rotd-nut">
          <div>${v.cal??"—"} <span>cal</span></div>
          <div>${v.pro??"—"}g <span>protein</span></div>
          <div>${v.carb??"—"}g <span>carbs</span></div>
          <div>${v.fat??"—"}g <span>fat</span></div>
          <div>${v.fib??"—"}g <span>fiber</span></div>
        </div>
        ${D||R?`<div class="rotd-ings">${D}${D&&R?"<br>":""}${R}</div>`:""}
        ${H?`<div class="rotd-cats">${H}</div>`:""}
        ${E?`<div class="rotd-benefits"><div class="rotd-benefits-label">🌿 Health Benefits</div>${E}</div>`:""}
        <div class="rotd-actions">
          ${t.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${e(t.url)}" data-recipe-title="${e(t.title)}" data-recipe-site="${e(t.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${M?" on":""}" data-make-id="${t.id}">${M?"✓ My Queue":"📌 My Queue"}</button>
          <button class="btn-sm btn-fav fav-btn${k?" on":""}" data-fav-id="${t.id}">${k?"❤️ Favorited":"🤍 Favorite"}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${t.id}">${P}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${t.id}" data-share-title="${e(t.title)}" data-share-url="${e(t.url||"")}">📤 Share</button>
        </div>
      </div>
    </div>
  `,a.hidden=!1,a.onclick=s=>{if(s.target.closest("[data-recipe-url]")||X(s))return;const o=s.target.closest(".fav-btn");if(o){s.stopPropagation(),Z(Number(o.dataset.favId));return}const r=s.target.closest(".make-btn");if(r){s.stopPropagation();const c=Number(r.dataset.makeId),g=Y("makelist");g.includes(c)?(j("makelist",g.filter(U=>U!==c)),Q("Unqueued — maybe next week")):(g.push(c),j("makelist",g),Q("Queued — this week is looking good 📌")),_();return}const l=s.target.closest(".cook-btn");if(l){s.stopPropagation(),tt(Number(l.dataset.cookId),{title:l.dataset.cookTitle});return}if(s.target.closest(".rotd-actions"))return;const p=s.target.closest(".rotd-card");p&&st(Number(p.dataset.recipeId))}}export{ft as initROTD};
