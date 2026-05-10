import{g as I,n as l,c as m,f as L,d,s as N,$ as y,b as v,e as b,j as _}from"./index-BmSFaMIJ.js";import{f as A,G as P}from"./matching-CrdY7zsB.js";import{o as H}from"./RecipeDetail-JA7nNWuZ.js";import"./supabase-DaN4is7k.js";let T=[];function k(){const t=v("shopChecked");return new Set(Array.isArray(t)?t:[])}function M(t){m("shopChecked",[...t])}function K(t){T=t||[],G(),E(),N(["shopList","shopChecked","shopRecipes","ingredients","staples"],"shopping",E)}function G(){const t=y("#clearShopBtn");t&&t.addEventListener("click",()=>{const i=v("shopRecipes"),r=v("shopList");!i.length&&!r.length||(m("shopRecipes",[]),m("shopList",[]),m("shopChecked",[]),L(),d("Clean slate — list wiped"))});const s=y("#shareShopBtn");s&&s.addEventListener("click",()=>{D()})}function D(){const{recipeCards:t,manualItems:s}=x();if(!t.length&&!s.length){d("Nothing to share yet — queue some recipes first");return}const i=k(),r="HARVEST Shopping List",a=[];if(t.forEach(({title:h,missing:o})=>{const f=o.filter(c=>!i.has(l(c))),e=o.filter(c=>i.has(l(c)));let p=`🍽 ${h}`;f.length&&(p+=`
`+f.map(c=>`  • ${c}`).join(`
`)),e.length&&(p+=`
`+e.map(c=>`  ✓ ${c}`).join(`
`)),a.push(p)}),s.length){const h=s.filter(e=>!i.has(l(e))),o=s.filter(e=>i.has(l(e)));let f="🛒 Additional Items";h.length&&(f+=`
`+h.map(e=>`  • ${e}`).join(`
`)),o.length&&(f+=`
`+o.map(e=>`  ✓ ${e}`).join(`
`)),a.push(f)}const n=a.join(`

`);navigator.share?navigator.share({title:r,text:`${r}

${n}`}).catch(()=>{}):navigator.clipboard.writeText(`${r}

${n}`).then(()=>{d("Copied — send it to whoever's driving")}).catch(()=>{d("Clipboard said no — try again")})}function F(t,s){if(!s.length){d("You already have everything — go cook!");return}const i=k(),r=s.filter(o=>!i.has(l(o))),a=s.filter(o=>i.has(l(o)));let n=`🍽 ${t}`;r.length&&(n+=`
`+r.map(o=>`• ${o}`).join(`
`)),a.length&&(n+=`
`+a.map(o=>`✓ ${o}`).join(`
`));const h=`Shop for ${t}`;navigator.share?navigator.share({title:h,text:n}).catch(()=>{}):navigator.clipboard.writeText(n).then(()=>{d("Copied — go get the goods")}).catch(()=>{d("Clipboard said no — try again")})}function Y(t){if(!t.length)return;const s=k(),i=t.filter(n=>!s.has(l(n))),r=t.filter(n=>s.has(l(n)));let a="🛒 Additional Items";i.length&&(a+=`
`+i.map(n=>`• ${n}`).join(`
`)),r.length&&(a+=`
`+r.map(n=>`✓ ${n}`).join(`
`)),navigator.share?navigator.share({title:"Shopping List",text:a}).catch(()=>{}):navigator.clipboard.writeText(a).then(()=>{d("Copied — go get the goods")}).catch(()=>{d("Clipboard said no — try again")})}function B(t){return _(t,P)}function x(){const t=v("shopRecipes"),s=v("shopList"),i=v("ingredients"),r=v("staples");let a=[];if(t.length){const n=t.map(h=>T.find(o=>o.id===h)).filter(Boolean);n.length&&(a=A({recipes:n,ingredients:i,staples:r}).map(o=>({id:o.id,title:o.title,missing:o.needNames?o.needNames.map(B):[],totalIngs:o.ing?o.ing.length:0,haveCount:o.ing?o.ing.length-(o.needNames?o.needNames.length:0):0})))}return{recipeCards:a,manualItems:s.map(B)}}function E(){const t=y("#shopList"),s=y("#shopEmpty"),i=y("#makeList");if(!t)return;i&&(i.innerHTML="");const{recipeCards:r,manualItems:a}=x(),n=k(),h=new Set;r.forEach(e=>e.missing.forEach(p=>h.add(l(p)))),a.forEach(e=>h.add(l(e)));let o=!1;for(const e of n)h.has(e)||(n.delete(e),o=!0);if(o&&M(n),!r.length&&!a.length){t.innerHTML="",s&&(s.hidden=!1);return}s&&(s.hidden=!0);let f="";if(r.forEach(({id:e,title:p,missing:c,totalIngs:$,haveCount:R})=>{const S=!c.length,j=c.length>0&&c.every(u=>n.has(l(u)));f+=`<div class="shop-recipe-card${S?" ready":""}${j?" all-checked":""}" data-shop-recipe="${e}">
      <div class="shop-recipe-header">
        <div class="shop-recipe-title-row">
          <a class="shop-recipe-title" href="#" data-open-recipe="${e}">${b(p)}</a>
          <div class="shop-recipe-actions">
            ${S?"":`<button class="icon-btn" data-share-recipe="${e}" title="Share">📤</button>`}
            <button class="icon-btn shop-recipe-delete-btn" data-delete-recipe="${e}" title="Remove recipe">&times;</button>
          </div>
        </div>
        <div class="shop-recipe-meta">
          ${S?'<span class="shop-recipe-ready">✓ You have everything!</span>':`<span class="shop-recipe-count">${c.length} ingredient${c.length!==1?"s":""} needed</span>`}
        </div>
      </div>
      ${c.length?`<div class="shop-recipe-items">
        ${c.map(u=>{const g=n.has(l(u));return`<div class="shop-item${g?" done":""}" data-shop-item="${b(u)}">
            <div class="shop-check">${g?"✓":""}</div>
            <span>${b(u)}</span>
          </div>`}).join("")}
      </div>`:""}
    </div>`}),a.length){const e=a.filter(c=>!n.has(l(c)));a.filter(c=>n.has(l(c)));const p=a.length>0&&e.length===0;f+=`<div class="shop-recipe-card${p?" all-checked":""}" data-shop-manual>
      <div class="shop-recipe-header">
        <div class="shop-recipe-title-row">
          <span class="shop-recipe-title" style="cursor:default">Additional Items</span>
          <div class="shop-recipe-actions">
            <button class="icon-btn" data-share-manual title="Share">📤</button>
            <button class="icon-btn shop-recipe-delete-btn" data-clear-manual title="Clear all">&times;</button>
          </div>
        </div>
        <div class="shop-recipe-meta">
          <span class="shop-recipe-count">${a.length} item${a.length!==1?"s":""}</span>
        </div>
      </div>
      <div class="shop-recipe-items">
        ${a.map(c=>{const $=n.has(l(c));return`<div class="shop-item${$?" done":""}" data-shop-item="${b(c)}">
            <div class="shop-check">${$?"✓":""}</div>
            <span>${b(c)}</span>
            <button class="icon-btn shop-manual-remove" data-remove-manual="${b(c)}" title="Remove" style="margin-left:auto;font-size:0.75rem">&times;</button>
          </div>`}).join("")}
      </div>
    </div>`}t.innerHTML=f,t.onclick=e=>{const p=e.target.closest("[data-open-recipe]");if(p){e.preventDefault(),e.stopPropagation();const g=Number(p.dataset.openRecipe);H(g);return}const c=e.target.closest("[data-delete-recipe]");if(c){e.stopPropagation();const g=Number(c.dataset.deleteRecipe),C=I("shopRecipes");m("shopRecipes",C.filter(w=>w!==g)),L(),d("Off the list — one less thing");return}const $=e.target.closest("[data-share-recipe]");if($){e.stopPropagation();const g=Number($.dataset.shareRecipe),C=r.find(w=>w.id===g);C&&F(C.title,C.missing);return}const R=e.target.closest("[data-remove-manual]");if(R){e.stopPropagation(),z(R.dataset.removeManual);return}if(e.target.closest("[data-clear-manual]")){e.stopPropagation(),m("shopList",[]),L(),d("Extra items cleared");return}if(e.target.closest("[data-share-manual]")){e.stopPropagation(),Y(a);return}const u=e.target.closest(".shop-item");u&&q(u.dataset.shopItem)}}function q(t){const s=k(),i=l(t);s.has(i)?s.delete(i):s.add(i),M(s)}function z(t){const s=I("shopList"),i=l(t),r=s.filter(n=>l(n)!==i);m("shopList",r);const a=k();a.has(i)&&(a.delete(i),M(a)),L()}function Q(t){const s=I("shopList"),i=new Set(s.map(l));let r=0;t.forEach(a=>{const n=l(a);n&&!i.has(n)&&(s.push(a),i.add(n),r++)}),r&&(m("shopList",s),L(),d(`${r} item${r>1?"s":""} added — happy shopping`))}export{Q as addToShopList,K as initShopping};
