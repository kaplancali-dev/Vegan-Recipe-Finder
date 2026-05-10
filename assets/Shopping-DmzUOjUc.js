import{g as I,n as h,c as m,f as S,d,s as H,$ as L,b as $,e as C,j as G}from"./index-BuS7S9YM.js";import{f as D,G as F}from"./matching-CORBVs3T.js";import{o as Y}from"./RecipeDetail-B6ERpZMN.js";import"./supabase-DaN4is7k.js";let T=[];function y(){const t=$("shopChecked");return new Set(Array.isArray(t)?t:[])}function j(t){m("shopChecked",[...t])}function Z(t){T=t||[],q(),N(),H(["shopList","shopChecked","shopRecipes","ingredients","staples"],"shopping",N)}function q(){const t=L("#clearShopBtn");t&&t.addEventListener("click",()=>{const i=$("shopRecipes"),r=$("shopList");!i.length&&!r.length||(m("shopRecipes",[]),m("shopList",[]),m("shopChecked",[]),S(),d("Clean slate — list wiped"))});const s=L("#shareShopBtn");s&&s.addEventListener("click",()=>{z()})}function z(){const{recipeCards:t,manualItems:s}=_();if(!t.length&&!s.length){d("Nothing to share yet — queue some recipes first");return}const i=y(),r="HARVEST Shopping List",a=[];if(t.forEach(({title:l,missing:o})=>{const f=o.filter(c=>!i.has(h(c))),e=o.filter(c=>i.has(h(c)));let p=`🍽 ${l}`;f.length&&(p+=`
`+f.map(c=>`  • ${c}`).join(`
`)),e.length&&(p+=`
`+e.map(c=>`  ✓ ${c}`).join(`
`)),a.push(p)}),s.length){const l=s.filter(e=>!i.has(h(e))),o=s.filter(e=>i.has(h(e)));let f="🛒 Additional Items";l.length&&(f+=`
`+l.map(e=>`  • ${e}`).join(`
`)),o.length&&(f+=`
`+o.map(e=>`  ✓ ${e}`).join(`
`)),a.push(f)}const n=a.join(`

`);navigator.share?navigator.share({title:r,text:`${r}

${n}`}).catch(()=>{}):navigator.clipboard.writeText(`${r}

${n}`).then(()=>{d("Copied — send it to whoever's driving")}).catch(()=>{d("Clipboard said no — try again")})}function O(t,s){if(!s.length){d("You already have everything — go cook!");return}const i=y(),r=s.filter(o=>!i.has(h(o))),a=s.filter(o=>i.has(h(o)));let n=`🍽 ${t}`;r.length&&(n+=`
`+r.map(o=>`• ${o}`).join(`
`)),a.length&&(n+=`
`+a.map(o=>`✓ ${o}`).join(`
`));const l=`Shop for ${t}`;navigator.share?navigator.share({title:l,text:n}).catch(()=>{}):navigator.clipboard.writeText(n).then(()=>{d("Copied — go get the goods")}).catch(()=>{d("Clipboard said no — try again")})}function V(t){if(!t.length)return;const s=y(),i=t.filter(n=>!s.has(h(n))),r=t.filter(n=>s.has(h(n)));let a="🛒 Additional Items";i.length&&(a+=`
`+i.map(n=>`• ${n}`).join(`
`)),r.length&&(a+=`
`+r.map(n=>`✓ ${n}`).join(`
`)),navigator.share?navigator.share({title:"Shopping List",text:a}).catch(()=>{}):navigator.clipboard.writeText(a).then(()=>{d("Copied — go get the goods")}).catch(()=>{d("Clipboard said no — try again")})}function x(t){return G(t,F)}function _(){const t=$("shopRecipes"),s=$("shopList"),i=$("ingredients"),r=$("staples");let a=[];if(t.length){const n=t.map(l=>T.find(o=>o.id===l)).filter(Boolean);n.length&&(a=D({recipes:n,ingredients:i,staples:r}).map(o=>({id:o.id,title:o.title,missing:o.needNames?o.needNames.map(x):[],totalIngs:o.ing?o.ing.length:0,haveCount:o.ing?o.ing.length-(o.needNames?o.needNames.length:0):0})))}return{recipeCards:a,manualItems:s.map(x)}}function N(){const t=L("#shopList"),s=L("#shopEmpty"),i=L("#makeList");if(!t)return;i&&(i.innerHTML="");const{recipeCards:r,manualItems:a}=_(),n=y(),l=new Set;r.forEach(e=>e.missing.forEach(p=>l.add(h(p)))),a.forEach(e=>l.add(h(e)));let o=!1;for(const e of n)l.has(e)||(n.delete(e),o=!0);if(o&&j(n),!r.length&&!a.length){t.innerHTML="",s&&(s.hidden=!1);return}s&&(s.hidden=!0);let f="";if(r.forEach(({id:e,title:p,missing:c,totalIngs:b,haveCount:M})=>{const R=!c.length,B=c.length>0&&c.every(v=>n.has(h(v)));f+=`<div class="shop-recipe-card${R?" ready":""}${B?" all-checked":""}" data-shop-recipe="${e}">
      <div class="shop-recipe-header">
        <div class="shop-recipe-title-row">
          <a class="shop-recipe-title" href="#" data-open-recipe="${e}">${C(p)}</a>
          <div class="shop-recipe-actions">
            ${R?"":`<button class="icon-btn" data-share-recipe="${e}" title="Share">📤</button>`}
            <button class="icon-btn shop-recipe-delete-btn" data-delete-recipe="${e}" title="Remove recipe">&times;</button>
          </div>
        </div>
        <div class="shop-recipe-meta">
          ${R?'<span class="shop-recipe-ready">✓ You have everything!</span>':`<span class="shop-recipe-count">${c.length} ingredient${c.length!==1?"s":""} needed</span>`}
        </div>
      </div>
      ${c.length?`<div class="shop-recipe-items">
        ${c.map(v=>{const u=n.has(h(v));return`<div class="shop-item${u?" done":""}" data-shop-item="${C(v)}">
            <div class="shop-check">${u?"✓":""}</div>
            <span>${C(v)}</span>
          </div>`}).join("")}
      </div>`:""}
    </div>`}),a.length){const e=a.filter(c=>!n.has(h(c)));a.filter(c=>n.has(h(c)));const p=a.length>0&&e.length===0;f+=`<div class="shop-recipe-card${p?" all-checked":""}" data-shop-manual>
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
        ${a.map(c=>{const b=n.has(h(c));return`<div class="shop-item${b?" done":""}" data-shop-item="${C(c)}">
            <div class="shop-check">${b?"✓":""}</div>
            <span>${C(c)}</span>
            <button class="icon-btn shop-manual-remove" data-remove-manual="${C(c)}" title="Remove" style="margin-left:auto;font-size:0.75rem">&times;</button>
          </div>`}).join("")}
      </div>
    </div>`}t.innerHTML=f,t.onclick=e=>{const p=e.target.closest("[data-open-recipe]");if(p){e.preventDefault(),e.stopPropagation();const u=Number(p.dataset.openRecipe);Y(u);return}const c=e.target.closest("[data-delete-recipe]");if(c){e.stopPropagation();const u=Number(c.dataset.deleteRecipe),k=r.find(g=>g.id===u),w=new Set(k?k.missing:[]),E=T.find(g=>g.id===u);E&&E.ing&&E.ing.forEach(g=>w.add(g));const A=I("shopRecipes");m("shopRecipes",A.filter(g=>g!==u));const P=I("shopList")||[];m("shopList",P.filter(g=>!w.has(g))),S(),d("Off the list — one less thing");return}const b=e.target.closest("[data-share-recipe]");if(b){e.stopPropagation();const u=Number(b.dataset.shareRecipe),k=r.find(w=>w.id===u);k&&O(k.title,k.missing);return}const M=e.target.closest("[data-remove-manual]");if(M){e.stopPropagation(),J(M.dataset.removeManual);return}if(e.target.closest("[data-clear-manual]")){e.stopPropagation(),m("shopList",[]),S(),d("Extra items cleared");return}if(e.target.closest("[data-share-manual]")){e.stopPropagation(),V(a);return}const v=e.target.closest(".shop-item");v&&W(v.dataset.shopItem)}}function W(t){const s=y(),i=h(t);s.has(i)?s.delete(i):s.add(i),j(s)}function J(t){const s=I("shopList"),i=h(t),r=s.filter(n=>h(n)!==i);m("shopList",r);const a=y();a.has(i)&&(a.delete(i),j(a)),S()}function ee(t){const s=I("shopList"),i=new Set(s.map(h));let r=0;t.forEach(a=>{const n=h(a);n&&!i.has(n)&&(s.push(a),i.add(n),r++)}),r&&(m("shopList",s),S(),d(`${r} item${r>1?"s":""} added — happy shopping`))}export{ee as addToShopList,Z as initShopping};
