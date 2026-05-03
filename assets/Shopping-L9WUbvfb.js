import{g as B,n as l,b as m,d as R,c as d,s as L,$ as S,a as v,e as b,i as _}from"./index-XSSTU-eJ.js";import{f as A,G as P}from"./matching-CBVxZvN6.js";import{o as H}from"./RecipeDetail-jpAlHnNO.js";import"./supabase-DaN4is7k.js";let x=[];function C(){const t=v("shopChecked");return new Set(Array.isArray(t)?t:[])}function E(t){m("shopChecked",[...t])}function K(t){x=t||[],G(),k(),L("shopList",k),L("shopChecked",k),L("shopRecipes",k),L("ingredients",k),L("staples",k)}function G(){const t=S("#clearShopBtn");t&&t.addEventListener("click",()=>{const i=v("shopRecipes"),r=v("shopList");!i.length&&!r.length||(m("shopRecipes",[]),m("shopList",[]),m("shopChecked",[]),R(),d("Clean slate — list wiped"))});const s=S("#shareShopBtn");s&&s.addEventListener("click",()=>{D()})}function D(){const{recipeCards:t,manualItems:s}=N();if(!t.length&&!s.length){d("Nothing to share yet — queue some recipes first");return}const i=C(),r="HARVEST Shopping List",a=[];if(t.forEach(({title:h,missing:o})=>{const f=o.filter(c=>!i.has(l(c))),e=o.filter(c=>i.has(l(c)));let p=`🍽 ${h}`;f.length&&(p+=`
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

${n}`).then(()=>{d("Copied — send it to whoever's driving")}).catch(()=>{d("Clipboard said no — try again")})}function Y(t,s){if(!s.length){d("You already have everything — go cook!");return}const i=C(),r=s.filter(o=>!i.has(l(o))),a=s.filter(o=>i.has(l(o)));let n=`🍽 ${t}`;r.length&&(n+=`
`+r.map(o=>`• ${o}`).join(`
`)),a.length&&(n+=`
`+a.map(o=>`✓ ${o}`).join(`
`));const h=`Shop for ${t}`;navigator.share?navigator.share({title:h,text:n}).catch(()=>{}):navigator.clipboard.writeText(n).then(()=>{d("Copied — go get the goods")}).catch(()=>{d("Clipboard said no — try again")})}function q(t){if(!t.length)return;const s=C(),i=t.filter(n=>!s.has(l(n))),r=t.filter(n=>s.has(l(n)));let a="🛒 Additional Items";i.length&&(a+=`
`+i.map(n=>`• ${n}`).join(`
`)),r.length&&(a+=`
`+r.map(n=>`✓ ${n}`).join(`
`)),navigator.share?navigator.share({title:"Shopping List",text:a}).catch(()=>{}):navigator.clipboard.writeText(a).then(()=>{d("Copied — go get the goods")}).catch(()=>{d("Clipboard said no — try again")})}function T(t){return _(t,P)}function N(){const t=v("shopRecipes"),s=v("shopList"),i=v("ingredients"),r=v("staples");let a=[];if(t.length){const n=t.map(h=>x.find(o=>o.id===h)).filter(Boolean);n.length&&(a=A({recipes:n,ingredients:i,staples:r}).map(o=>({id:o.id,title:o.title,missing:o.needNames?o.needNames.map(T):[],totalIngs:o.ing?o.ing.length:0,haveCount:o.ing?o.ing.length-(o.needNames?o.needNames.length:0):0})))}return{recipeCards:a,manualItems:s.map(T)}}function k(){const t=S("#shopList"),s=S("#shopEmpty"),i=S("#makeList");if(!t)return;i&&(i.innerHTML="");const{recipeCards:r,manualItems:a}=N(),n=C(),h=new Set;r.forEach(e=>e.missing.forEach(p=>h.add(l(p)))),a.forEach(e=>h.add(l(e)));let o=!1;for(const e of n)h.has(e)||(n.delete(e),o=!0);if(o&&E(n),!r.length&&!a.length){t.innerHTML="",s&&(s.hidden=!1);return}s&&(s.hidden=!0);let f="";if(r.forEach(({id:e,title:p,missing:c,totalIngs:$,haveCount:I})=>{const w=!c.length,j=c.length>0&&c.every(u=>n.has(l(u)));f+=`<div class="shop-recipe-card${w?" ready":""}${j?" all-checked":""}" data-shop-recipe="${e}">
      <div class="shop-recipe-header">
        <div class="shop-recipe-title-row">
          <a class="shop-recipe-title" href="#" data-open-recipe="${e}">${b(p)}</a>
          <div class="shop-recipe-actions">
            ${w?"":`<button class="icon-btn" data-share-recipe="${e}" title="Share">📤</button>`}
            <button class="icon-btn shop-recipe-delete-btn" data-delete-recipe="${e}" title="Remove recipe">&times;</button>
          </div>
        </div>
        <div class="shop-recipe-meta">
          ${w?'<span class="shop-recipe-ready">✓ You have everything!</span>':`<span class="shop-recipe-count">${c.length} ingredient${c.length!==1?"s":""} needed</span>`}
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
    </div>`}t.innerHTML=f,t.onclick=e=>{const p=e.target.closest("[data-open-recipe]");if(p){e.preventDefault(),e.stopPropagation();const g=Number(p.dataset.openRecipe);H(g);return}const c=e.target.closest("[data-delete-recipe]");if(c){e.stopPropagation();const g=Number(c.dataset.deleteRecipe),y=B("shopRecipes");m("shopRecipes",y.filter(M=>M!==g)),R(),d("Off the list — one less thing");return}const $=e.target.closest("[data-share-recipe]");if($){e.stopPropagation();const g=Number($.dataset.shareRecipe),y=r.find(M=>M.id===g);y&&Y(y.title,y.missing);return}const I=e.target.closest("[data-remove-manual]");if(I){e.stopPropagation(),F(I.dataset.removeManual);return}if(e.target.closest("[data-clear-manual]")){e.stopPropagation(),m("shopList",[]),R(),d("Extra items cleared");return}if(e.target.closest("[data-share-manual]")){e.stopPropagation(),q(a);return}const u=e.target.closest(".shop-item");u&&z(u.dataset.shopItem)}}function z(t){const s=C(),i=l(t);s.has(i)?s.delete(i):s.add(i),E(s)}function F(t){const s=B("shopList"),i=l(t),r=s.filter(n=>l(n)!==i);m("shopList",r);const a=C();a.has(i)&&(a.delete(i),E(a)),R()}function Q(t){const s=B("shopList"),i=new Set(s.map(l));let r=0;t.forEach(a=>{const n=l(a);n&&!i.has(n)&&(s.push(a),i.add(n),r++)}),r&&(m("shopList",s),R(),d(`${r} item${r>1?"s":""} added — happy shopping`))}export{Q as addToShopList,K as initShopping};
