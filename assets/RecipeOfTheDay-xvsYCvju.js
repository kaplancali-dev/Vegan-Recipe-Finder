import{s as u,$ as j,a as p,e as s,g as A,b as H,c as B,d as O,i as P}from"./index-BFPobQr6.js";import{f as Y}from"./matching-DKz-q9We.js";import{g as x,s as E}from"./RecipeCard-Cu9qPG7k.js";import{h as _,t as z,a as G,o as V}from"./RecipeDetail-aqt-c6E9.js";import"./supabase-DaN4is7k.js";function W(a){let t=0;for(let i=0;i<a.length;i++)t=(t<<5)-t+a.charCodeAt(i)|0;return Math.abs(t)}const q=new Set(["Dessert","Baking","Snack","Breakfast","Smoothie"]);function J(a){const t=a.filter(n=>{var m;return n.img&&n.nut&&n.nut.pro>=20&&n.ing&&n.ing.length>=7&&n.ing.length<=15&&n.time&&n.time<=90&&!((m=n.cats)!=null&&m.some(N=>q.has(N)))});if(!t.length)return null;const i=new Date,b=`${i.getFullYear()}-${i.getMonth()+1}-${i.getDate()}`,k=W(b)%t.length;return t[k]}let v=null;function et(a){v=J(a),v&&(d(),u("ingredients",d),u("staples",d),u("favorites",d),u("makelist",d),u("cookHistory",d))}function d(){const a=j("#rotdSpotlight");if(!a||!v)return;const t=v,i=p("ingredients"),b=p("staples"),k=new Set(p("favorites")),n=p("makelist"),m=p("cookHistory")||[],S=Y({recipes:[t],ingredients:i,staples:b,selectedCats:[],allergies:new Set})[0]||{...t,pct:0,haveNames:[],needNames:t.ing||[]},T=k.has(t.id),R=n.includes(t.id),y=m.filter(e=>e.id===t.id),r=y.length?y[y.length-1]:null,c=t.nut||{},L=i.length>0?`<span class="rotd-match">${S.pct}% match</span>`:"",f=S.haveNames||[],h=S.needNames||[];function I(e){const o=s(P(e)),l=x(e),g=E(e);return l?`<span class="rotd-ing-gf">${o} <em>(GF: ${s(l)})</em></span>`:g?`<span class="rotd-ing-sf">${o} <em>(Swap: ${s(g)})</em></span>`:o}const D=f.length?`<strong>You have:</strong> ${f.slice(0,6).map(I).join(", ")}${f.length>6?` +${f.length-6} more`:""}`:"",w=h.length?`<strong>You need:</strong> ${h.slice(0,5).map(I).join(", ")}${h.length>5?` +${h.length-5} more`:""}`:"";let C="☐ I Made This";if(r){const e=new Date(typeof r=="string"?r:r.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),o=typeof r=="object"&&r.rating?" "+"★".repeat(r.rating):"";C=`✅ Made ${e}${o}`}a.innerHTML=`
    <div class="rotd-label">🌟 Recipe of the Day</div>
    <div class="rotd-card" data-recipe-id="${t.id}">
      <div class="rotd-img">
        <img loading="lazy" decoding="async" src="${s(t.img)}" alt="${s(t.title)}">
      </div>
      <div class="rotd-body">
        <div class="rotd-title">${s(t.title)} ${L}</div>
        <div class="rotd-site">${s(t.site||"")} · ${t.time?`${t.time} min`:""} · ${t.servings?`${t.servings} servings`:""} · ${t.ing.length} ingredients</div>
        <div class="rotd-nut">
          <div>${c.cal??"—"} <span>cal</span></div>
          <div>${c.pro??"—"}g <span>protein</span></div>
          <div>${c.carb??"—"}g <span>carbs</span></div>
          <div>${c.fat??"—"}g <span>fat</span></div>
          <div>${c.fib??"—"}g <span>fiber</span></div>
        </div>
        ${D||w?`<div class="rotd-ings">${D}${D&&w?"<br>":""}${w}</div>`:""}
        <div class="rotd-actions">
          ${t.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${s(t.url)}" data-recipe-title="${s(t.title)}" data-recipe-site="${s(t.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${R?" on":""}" data-make-id="${t.id}">${R?"✓ My Queue":"📌 My Queue"}</button>
          <button class="btn-sm btn-fav fav-btn${T?" on":""}" data-fav-id="${t.id}">${T?"❤️ Favorited":"🤍 Favorite"}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${t.id}">${C}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${t.id}" data-share-title="${s(t.title)}" data-share-url="${s(t.url||"")}">📤 Share</button>
        </div>
      </div>
    </div>
  `,a.hidden=!1,a.onclick=e=>{if(e.target.closest("[data-recipe-url]")||_(e))return;const o=e.target.closest(".fav-btn");if(o){e.stopPropagation(),z(Number(o.dataset.favId));return}const l=e.target.closest(".make-btn");if(l){e.stopPropagation();const M=Number(l.dataset.makeId),$=A("makelist");$.includes(M)?(H("makelist",$.filter(Q=>Q!==M)),B("Removed from My Queue")):($.push(M),H("makelist",$),B("Added to My Queue 📌")),O();return}const g=e.target.closest(".cook-btn");if(g){e.stopPropagation(),G(Number(g.dataset.cookId));return}const F=e.target.closest(".rotd-card");F&&V(Number(F.dataset.recipeId))}}export{et as initROTD};
