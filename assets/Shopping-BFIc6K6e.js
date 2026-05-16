import{g as E,n as h,f as m,i as L,h as f,a as H,$ as S,d as $,e as C,l as G}from"./index-BZffy32_.js";import{f as D,G as F}from"./matching-DIvwFwim.js";import{o as Y}from"./RecipeDetail-CbwHSmFK.js";import"./supabase-DaN4is7k.js";import"./InstallCardDesktop-DVxK9suI.js";let T=[];function y(){const t=$("shopChecked");return new Set(Array.isArray(t)?t:[])}function j(t){m("shopChecked",[...t])}function ee(t){T=t||[],q(),x(),H(["shopList","shopChecked","shopRecipes","ingredients","staples"],"shopping",x)}function q(){const t=S("#clearShopBtn");t&&t.addEventListener("click",()=>{const o=$("shopRecipes"),c=$("shopList");!o.length&&!c.length||(m("shopRecipes",[]),m("shopList",[]),m("shopChecked",[]),L(),f("Clean slate — list wiped"))});const s=S("#shareShopBtn");s&&s.addEventListener("click",()=>{z()})}function z(){const{recipeCards:t,manualItems:s}=_();if(!t.length&&!s.length){f("Nothing to share yet — queue some recipes first");return}const o=y(),c="HARVEST Shopping List",a=[];if(t.forEach(({title:p,missing:r})=>{const d=r.filter(i=>!o.has(h(i))),e=r.filter(i=>o.has(h(i)));let l=`🍽 ${p}`;d.length&&(l+=`
`+d.map(i=>`  • ${i}`).join(`
`)),e.length&&(l+=`
`+e.map(i=>`  ✓ ${i}`).join(`
`)),a.push(l)}),s.length){const p=s.filter(e=>!o.has(h(e))),r=s.filter(e=>o.has(h(e)));let d="🛒 Additional Items";p.length&&(d+=`
`+p.map(e=>`  • ${e}`).join(`
`)),r.length&&(d+=`
`+r.map(e=>`  ✓ ${e}`).join(`
`)),a.push(d)}const n=a.join(`

`);navigator.share?navigator.share({title:c,text:`${c}

${n}`}).catch(()=>{}):navigator.clipboard.writeText(`${c}

${n}`).then(()=>{f("Copied — send it to whoever's driving")}).catch(()=>{f("Clipboard said no — try again")})}function O(t,s){if(!s.length){f("You already have everything — go cook!");return}const o=y(),c=s.filter(r=>!o.has(h(r))),a=s.filter(r=>o.has(h(r)));let n=`🍽 ${t}`;c.length&&(n+=`
`+c.map(r=>`• ${r}`).join(`
`)),a.length&&(n+=`
`+a.map(r=>`✓ ${r}`).join(`
`));const p=`Shop for ${t}`;navigator.share?navigator.share({title:p,text:n}).catch(()=>{}):navigator.clipboard.writeText(n).then(()=>{f("Copied — go get the goods")}).catch(()=>{f("Clipboard said no — try again")})}function V(t){if(!t.length)return;const s=y(),o=t.filter(n=>!s.has(h(n))),c=t.filter(n=>s.has(h(n)));let a="🛒 Additional Items";o.length&&(a+=`
`+o.map(n=>`• ${n}`).join(`
`)),c.length&&(a+=`
`+c.map(n=>`✓ ${n}`).join(`
`)),navigator.share?navigator.share({title:"Shopping List",text:a}).catch(()=>{}):navigator.clipboard.writeText(a).then(()=>{f("Copied — go get the goods")}).catch(()=>{f("Clipboard said no — try again")})}function B(t){return G(t,F)}function _(){const t=$("shopRecipes"),s=$("shopList"),o=$("ingredients"),c=$("staples");let a=[];const n=new Set;if(t.length){const r=t.map(d=>T.find(e=>e.id===d)).filter(Boolean);if(r.length){const d=D({recipes:r,ingredients:o,staples:c});a=d.map(e=>({id:e.id,title:e.title,missing:e.needNames?e.needNames.map(B):[],totalIngs:e.ing?e.ing.length:0,haveCount:e.ing?e.ing.length-(e.needNames?e.needNames.length:0):0})),d.forEach(e=>{(e.needNames||[]).forEach(l=>{n.add(l),n.add(B(l))}),(e.ing||[]).forEach(l=>n.add(l))})}}const p=s.filter(r=>!n.has(r)).map(B);return{recipeCards:a,manualItems:p}}function x(){const t=S("#shopList"),s=S("#shopEmpty"),o=S("#makeList");if(!t)return;o&&(o.innerHTML="");const{recipeCards:c,manualItems:a}=_(),n=y(),p=new Set;c.forEach(e=>e.missing.forEach(l=>p.add(h(l)))),a.forEach(e=>p.add(h(e)));let r=!1;for(const e of n)p.has(e)||(n.delete(e),r=!0);if(r&&j(n),!c.length&&!a.length){t.innerHTML="",s&&(s.hidden=!1);return}s&&(s.hidden=!0);let d="";if(c.forEach(({id:e,title:l,missing:i,totalIngs:b,haveCount:I})=>{const R=!i.length,N=i.length>0&&i.every(v=>n.has(h(v)));d+=`<div class="shop-recipe-card${R?" ready":""}${N?" all-checked":""}" data-shop-recipe="${e}">
      <div class="shop-recipe-header">
        <div class="shop-recipe-title-row">
          <a class="shop-recipe-title" href="#" data-open-recipe="${e}">${C(l)}</a>
          <div class="shop-recipe-actions">
            ${R?"":`<button class="icon-btn" data-share-recipe="${e}" title="Share">📤</button>`}
            <button class="icon-btn shop-recipe-delete-btn" data-delete-recipe="${e}" title="Remove recipe">&times;</button>
          </div>
        </div>
        <div class="shop-recipe-meta">
          ${R?'<span class="shop-recipe-ready">✓ You have everything!</span>':`<span class="shop-recipe-count">${i.length} ingredient${i.length!==1?"s":""} needed</span>`}
        </div>
      </div>
      ${i.length?`<div class="shop-recipe-items">
        ${i.map(v=>{const u=n.has(h(v));return`<div class="shop-item${u?" done":""}" data-shop-item="${C(v)}">
            <div class="shop-check">${u?"✓":""}</div>
            <span>${C(v)}</span>
          </div>`}).join("")}
      </div>`:""}
    </div>`}),a.length){const e=a.filter(i=>!n.has(h(i)));a.filter(i=>n.has(h(i)));const l=a.length>0&&e.length===0;d+=`<div class="shop-recipe-card${l?" all-checked":""}" data-shop-manual>
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
        ${a.map(i=>{const b=n.has(h(i));return`<div class="shop-item${b?" done":""}" data-shop-item="${C(i)}">
            <div class="shop-check">${b?"✓":""}</div>
            <span>${C(i)}</span>
            <button class="icon-btn shop-manual-remove" data-remove-manual="${C(i)}" title="Remove" style="margin-left:auto;font-size:0.75rem">&times;</button>
          </div>`}).join("")}
      </div>
    </div>`}t.innerHTML=d,t.onclick=e=>{const l=e.target.closest("[data-open-recipe]");if(l){e.preventDefault(),e.stopPropagation();const u=Number(l.dataset.openRecipe);Y(u);return}const i=e.target.closest("[data-delete-recipe]");if(i){e.stopPropagation();const u=Number(i.dataset.deleteRecipe),k=c.find(g=>g.id===u),w=new Set(k?k.missing:[]),M=T.find(g=>g.id===u);M&&M.ing&&M.ing.forEach(g=>w.add(g));const A=E("shopRecipes");m("shopRecipes",A.filter(g=>g!==u));const P=E("shopList")||[];m("shopList",P.filter(g=>!w.has(g))),L(),f("Off the list — one less thing");return}const b=e.target.closest("[data-share-recipe]");if(b){e.stopPropagation();const u=Number(b.dataset.shareRecipe),k=c.find(w=>w.id===u);k&&O(k.title,k.missing);return}const I=e.target.closest("[data-remove-manual]");if(I){e.stopPropagation(),J(I.dataset.removeManual);return}if(e.target.closest("[data-clear-manual]")){e.stopPropagation(),m("shopList",[]),L(),f("Extra items cleared");return}if(e.target.closest("[data-share-manual]")){e.stopPropagation(),V(a);return}const v=e.target.closest(".shop-item");v&&W(v.dataset.shopItem)}}function W(t){const s=y(),o=h(t);s.has(o)?s.delete(o):s.add(o),j(s)}function J(t){const s=E("shopList"),o=h(t),c=s.filter(n=>h(n)!==o);m("shopList",c);const a=y();a.has(o)&&(a.delete(o),j(a)),L()}function te(t){const s=E("shopList"),o=new Set(s.map(h));let c=0;t.forEach(a=>{const n=h(a);n&&!o.has(n)&&(s.push(a),o.add(n),c++)}),c&&(m("shopList",s),L(),f(`${c} item${c>1?"s":""} added — happy shopping`))}export{te as addToShopList,ee as initShopping};
