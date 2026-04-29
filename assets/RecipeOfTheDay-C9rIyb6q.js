import{s as p,$ as A,a as h,e as s,g as O,b as B,c as L,d as P,i as Y}from"./index-bk_sQ0UO.js";import{f as x}from"./matching-zj5xNC2q.js";import{g as E,s as _,f as z}from"./RecipeCard-61WGVRoe.js";import{h as G,t as U,a as V,o as W}from"./RecipeDetail-C9_HPR_k.js";import"./supabase-DaN4is7k.js";function q(n){let t=0;for(let a=0;a<n.length;a++)t=(t<<5)-t+n.charCodeAt(a)|0;return Math.abs(t)}const J=new Set(["Dessert","Baking","Snack","Breakfast","Smoothie"]);function K(n){const t=n.filter(i=>{var v;return i.img&&i.nut&&i.nut.pro>=20&&i.ing&&i.ing.length>=9&&i.ing.length<=15&&i.time&&i.time<=90&&!((v=i.cats)!=null&&v.some(T=>J.has(T)))});if(!t.length)return null;const a=new Date,$=`${a.getFullYear()}-${a.getMonth()+1}-${a.getDate()}`,y=q($)%t.length;return t[y]}let S=null;function nt(n){S=K(n),S&&(u(),p("ingredients",u),p("staples",u),p("favorites",u),p("makelist",u),p("cookHistory",u))}function u(){const n=A("#rotdSpotlight");if(!n||!S)return;const t=S,a=h("ingredients"),$=h("staples"),y=new Set(h("favorites")),i=h("makelist"),v=h("cookHistory")||[],D=x({recipes:[t],ingredients:a,staples:$,selectedCats:[],allergies:new Set})[0]||{...t,pct:0,haveNames:[],needNames:t.ing||[]},I=y.has(t.id),R=i.includes(t.id),w=v.filter(e=>e.id===t.id),r=w.length?w[w.length-1]:null,f=t.nut||{},Q=a.length>0?`<span class="rotd-match">${D.pct}% match</span>`:"",b=D.haveNames||[],k=D.needNames||[],C=[...a,...$];function F(e,c){const m=s(Y(e)),l=E(e),g=_(e);let o="";if(l&&(o+=` <em class="rotd-hint-gf">(GF: ${s(l)})</em>`),g&&(o+=` <em class="rotd-hint-sf">(Swap: ${s(g)})</em>`),c&&C.length){const d=z(e,C);d&&(o+=` <em class="rotd-hint-sub">(💡 try ${s(d)})</em>`)}return o?`<span class="${l?"rotd-ing-gf":g?"rotd-ing-sf":""}">${m}${o}</span>`:m}const M=b.length?`<strong>You have:</strong> ${b.slice(0,6).map(e=>F(e,!1)).join(", ")}${b.length>6?` +${b.length-6} more`:""}`:"",N=k.length?`<strong>You need:</strong> ${k.slice(0,5).map(e=>F(e,!0)).join(", ")}${k.length>5?` +${k.length-5} more`:""}`:"";let H="☐ I Made This";if(r){const e=new Date(typeof r=="string"?r:r.date).toLocaleDateString(void 0,{month:"numeric",day:"numeric"}),c=typeof r=="object"&&r.rating?" "+"★".repeat(r.rating):"";H=`✅ Made ${e}${c}`}n.innerHTML=`
    <div class="rotd-label">🌟 Recipe of the Day</div>
    <div class="rotd-card" data-recipe-id="${t.id}">
      <div class="rotd-img">
        <img loading="lazy" decoding="async" src="${s(t.img)}" alt="${s(t.title)}">
      </div>
      <div class="rotd-body">
        <div class="rotd-title">${s(t.title)} ${Q}</div>
        <div class="rotd-site">${s(t.site||"")} · ${t.time?`${t.time} min`:""} · ${t.servings?`${t.servings} servings`:""} · ${t.ing.length} ingredients</div>
        <div class="rotd-nut">
          <div>${f.cal??"—"} <span>cal</span></div>
          <div>${f.pro??"—"}g <span>protein</span></div>
          <div>${f.carb??"—"}g <span>carbs</span></div>
          <div>${f.fat??"—"}g <span>fat</span></div>
          <div>${f.fib??"—"}g <span>fiber</span></div>
        </div>
        ${M||N?`<div class="rotd-ings">${M}${M&&N?"<br>":""}${N}</div>`:""}
        <div class="rotd-actions">
          ${t.url?`<a href="#" class="btn-sm btn-link" data-recipe-url="${s(t.url)}" data-recipe-title="${s(t.title)}" data-recipe-site="${s(t.site||"")}">📖 View Instructions</a>`:""}
          <button class="btn-sm btn-shop make-btn${R?" on":""}" data-make-id="${t.id}">${R?"✓ My Queue":"📌 My Queue"}</button>
          <button class="btn-sm btn-fav fav-btn${I?" on":""}" data-fav-id="${t.id}">${I?"❤️ Favorited":"🤍 Favorite"}</button>
          <button class="btn-sm btn-cook cook-btn" data-cook-id="${t.id}">${H}</button>
          <button class="btn-sm btn-share share-btn" data-share-id="${t.id}" data-share-title="${s(t.title)}" data-share-url="${s(t.url||"")}">📤 Share</button>
        </div>
      </div>
    </div>
  `,n.hidden=!1,n.onclick=e=>{if(e.target.closest("[data-recipe-url]")||G(e))return;const c=e.target.closest(".fav-btn");if(c){e.stopPropagation(),U(Number(c.dataset.favId));return}const m=e.target.closest(".make-btn");if(m){e.stopPropagation();const o=Number(m.dataset.makeId),d=O("makelist");d.includes(o)?(B("makelist",d.filter(j=>j!==o)),L("Removed from My Queue")):(d.push(o),B("makelist",d),L("Added to My Queue 📌")),P();return}const l=e.target.closest(".cook-btn");if(l){e.stopPropagation(),V(Number(l.dataset.cookId));return}const g=e.target.closest(".rotd-card");g&&W(Number(g.dataset.recipeId))}}export{nt as initROTD};
