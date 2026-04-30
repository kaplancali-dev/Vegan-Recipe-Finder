import{s as L,$ as S,a as v,b as g,d as R,c as d,n as l,e as b,g as B,f as x}from"./index-DLcE2rKm.js";import{f as N,G as P}from"./matching-CrT7Or1q.js";import{o as H}from"./RecipeDetail-C9uDZy5z.js";import"./supabase-DaN4is7k.js";let T=[];function y(){const t=v("shopChecked");return new Set(Array.isArray(t)?t:[])}function j(t){g("shopChecked",[...t])}function O(t){T=t||[],G(),k(),L("shopList",k),L("shopChecked",k),L("shopRecipes",k),L("ingredients",k),L("staples",k)}function G(){const t=S("#clearShopBtn");t&&t.addEventListener("click",()=>{const i=v("shopRecipes"),r=v("shopList");!i.length&&!r.length||(g("shopRecipes",[]),g("shopList",[]),g("shopChecked",[]),R(),d("Shopping List cleared"))});const s=S("#shareShopBtn");s&&s.addEventListener("click",()=>{D()})}function D(){const{recipeCards:t,manualItems:s}=_();if(!t.length&&!s.length){d("Shopping List is empty");return}const i=y(),r="HARVEST Shopping List",a=[];if(t.forEach(({title:p,missing:o})=>{const u=o.filter(c=>!i.has(l(c))),e=o.filter(c=>i.has(l(c)));let h=`🍽 ${p}`;u.length&&(h+=`
`+u.map(c=>`  • ${c}`).join(`
`)),e.length&&(h+=`
`+e.map(c=>`  ✓ ${c}`).join(`
`)),a.push(h)}),s.length){const p=s.filter(e=>!i.has(l(e))),o=s.filter(e=>i.has(l(e)));let u="🛒 Additional Items";p.length&&(u+=`
`+p.map(e=>`  • ${e}`).join(`
`)),o.length&&(u+=`
`+o.map(e=>`  ✓ ${e}`).join(`
`)),a.push(u)}const n=a.join(`

`);navigator.share?navigator.share({title:r,text:`${r}

${n}`}).catch(()=>{}):navigator.clipboard.writeText(`${r}

${n}`).then(()=>{d("Shopping List copied to clipboard!")}).catch(()=>{d("Could not copy — try manually")})}function z(t,s){if(!s.length){d("All ingredients ready!");return}const i=y(),r=s.filter(o=>!i.has(l(o))),a=s.filter(o=>i.has(l(o)));let n=`🍽 ${t}`;r.length&&(n+=`
`+r.map(o=>`• ${o}`).join(`
`)),a.length&&(n+=`
`+a.map(o=>`✓ ${o}`).join(`
`));const p=`Shop for ${t}`;navigator.share?navigator.share({title:p,text:n}).catch(()=>{}):navigator.clipboard.writeText(n).then(()=>{d("Copied to clipboard!")}).catch(()=>{d("Could not copy — try manually")})}function F(t){if(!t.length)return;const s=y(),i=t.filter(n=>!s.has(l(n))),r=t.filter(n=>s.has(l(n)));let a="🛒 Additional Items";i.length&&(a+=`
`+i.map(n=>`• ${n}`).join(`
`)),r.length&&(a+=`
`+r.map(n=>`✓ ${n}`).join(`
`)),navigator.share?navigator.share({title:"Shopping List",text:a}).catch(()=>{}):navigator.clipboard.writeText(a).then(()=>{d("Copied to clipboard!")}).catch(()=>{d("Could not copy — try manually")})}function E(t){return x(t,P)}function _(){const t=v("shopRecipes"),s=v("shopList"),i=v("ingredients"),r=v("staples");let a=[];if(t.length){const n=t.map(p=>T.find(o=>o.id===p)).filter(Boolean);n.length&&(a=N({recipes:n,ingredients:i,staples:r}).map(o=>({id:o.id,title:o.title,missing:o.needNames?o.needNames.map(E):[],totalIngs:o.ing?o.ing.length:0,haveCount:o.ing?o.ing.length-(o.needNames?o.needNames.length:0):0})))}return{recipeCards:a,manualItems:s.map(E)}}function k(){const t=S("#shopList"),s=S("#shopEmpty"),i=S("#makeList");if(!t)return;i&&(i.innerHTML="");const{recipeCards:r,manualItems:a}=_(),n=y(),p=new Set;r.forEach(e=>e.missing.forEach(h=>p.add(l(h)))),a.forEach(e=>p.add(l(e)));let o=!1;for(const e of n)p.has(e)||(n.delete(e),o=!0);if(o&&j(n),!r.length&&!a.length){t.innerHTML="",s&&(s.hidden=!1);return}s&&(s.hidden=!0);let u="";if(r.forEach(({id:e,title:h,missing:c,totalIngs:$,haveCount:M})=>{const I=!c.length,A=c.length>0&&c.every(f=>n.has(l(f)));u+=`<div class="shop-recipe-card${I?" ready":""}${A?" all-checked":""}" data-shop-recipe="${e}">
      <div class="shop-recipe-header">
        <div class="shop-recipe-title-row">
          <a class="shop-recipe-title" href="#" data-open-recipe="${e}">${b(h)}</a>
          <div class="shop-recipe-actions">
            ${I?"":`<button class="icon-btn" data-share-recipe="${e}" title="Share">📤</button>`}
            <button class="icon-btn shop-recipe-delete-btn" data-delete-recipe="${e}" title="Remove recipe">&times;</button>
          </div>
        </div>
        <div class="shop-recipe-meta">
          ${I?'<span class="shop-recipe-ready">✓ You have everything!</span>':`<span class="shop-recipe-count">${c.length} ingredient${c.length!==1?"s":""} needed</span>`}
        </div>
      </div>
      ${c.length?`<div class="shop-recipe-items">
        ${c.map(f=>{const m=n.has(l(f));return`<div class="shop-item${m?" done":""}" data-shop-item="${b(f)}">
            <div class="shop-check">${m?"✓":""}</div>
            <span>${b(f)}</span>
          </div>`}).join("")}
      </div>`:""}
    </div>`}),a.length){const e=a.filter(c=>!n.has(l(c)));a.filter(c=>n.has(l(c)));const h=a.length>0&&e.length===0;u+=`<div class="shop-recipe-card${h?" all-checked":""}" data-shop-manual>
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
    </div>`}t.innerHTML=u,t.onclick=e=>{const h=e.target.closest("[data-open-recipe]");if(h){e.preventDefault(),e.stopPropagation();const m=Number(h.dataset.openRecipe);H(m);return}const c=e.target.closest("[data-delete-recipe]");if(c){e.stopPropagation();const m=Number(c.dataset.deleteRecipe),C=B("shopRecipes");g("shopRecipes",C.filter(w=>w!==m)),R(),d("Removed from list");return}const $=e.target.closest("[data-share-recipe]");if($){e.stopPropagation();const m=Number($.dataset.shareRecipe),C=r.find(w=>w.id===m);C&&z(C.title,C.missing);return}const M=e.target.closest("[data-remove-manual]");if(M){e.stopPropagation(),W(M.dataset.removeManual);return}if(e.target.closest("[data-clear-manual]")){e.stopPropagation(),g("shopList",[]),R(),d("Additional items cleared");return}if(e.target.closest("[data-share-manual]")){e.stopPropagation(),F(a);return}const f=e.target.closest(".shop-item");f&&V(f.dataset.shopItem)}}function V(t){const s=y(),i=l(t);s.has(i)?s.delete(i):s.add(i),j(s)}function W(t){const s=B("shopList"),i=l(t),r=s.filter(n=>l(n)!==i);g("shopList",r);const a=y();a.has(i)&&(a.delete(i),j(a)),R()}function Q(t){const s=B("shopList"),i=new Set(s.map(l));let r=0;t.forEach(a=>{const n=l(a);n&&!i.has(n)&&(s.push(a),i.add(n),r++)}),r&&(g("shopList",s),R(),d(`Added ${r} item${r>1?"s":""} to shopping list`))}export{Q as addToShopList,O as initShopping};
