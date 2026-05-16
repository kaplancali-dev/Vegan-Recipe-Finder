import{s as h,v as b,c as g}from"./index-Df4YATwT.js";import"./supabase-DaN4is7k.js";const y=3e4;let i=null,_=0;function v(){const e=document.createElement("div");return e.id="signInModal",e.className="sin-modal",e.hidden=!0,e.setAttribute("role","dialog"),e.setAttribute("aria-modal","true"),e.setAttribute("aria-labelledby","sinTitle"),e.innerHTML=`
    <div class="sin-modal__backdrop" data-sin-close></div>
    <div class="sin-modal__panel">
      <button class="sin-modal__close" data-sin-close aria-label="Close">×</button>

      <!-- Step 1: Email -->
      <div class="sin-step" data-sin-step="1">
        <h2 id="sinTitle" class="sin-modal__title">Welcome back.</h2>
        <p class="sin-modal__sub">Enter the email you used before. We'll send a 6-digit code to verify it's you.</p>
        <input
          class="sin-modal__input" id="sinEmail" type="email"
          placeholder="your@email.com"
          autocomplete="email" inputmode="email" spellcheck="false">
        <div class="sin-modal__error" id="sinEmailError" hidden></div>
        <button class="sin-modal__btn" id="sinSendBtn" type="button">Send code</button>
        <p class="sin-modal__newhere">
          New here? Just tap <strong>SHOW ME WHAT'S POSSIBLE</strong> instead.
        </p>
      </div>

      <!-- Step 2: Code -->
      <div class="sin-step" data-sin-step="2" hidden>
        <h2 class="sin-modal__title">Check your email.</h2>
        <p class="sin-modal__sub">
          We sent a 6-digit code to <strong id="sinEmailEcho">your email</strong>. Drop it in below.
        </p>
        <input
          class="sin-modal__input sin-modal__input--code" id="sinCode" type="text"
          placeholder="6-digit code" maxlength="8"
          inputmode="numeric" autocomplete="one-time-code">
        <div class="sin-modal__error" id="sinCodeError" hidden></div>
        <button class="sin-modal__btn" id="sinVerifyBtn" type="button">Verify</button>
        <button class="sin-modal__back" data-sin-back type="button">← Wrong email? Go back</button>
      </div>

      <!-- Step 3: Restoring -->
      <div class="sin-step" data-sin-step="3" hidden>
        <h2 class="sin-modal__title">Restoring your pantry…</h2>
        <p class="sin-modal__sub">One sec — pulling your saved data.</p>
        <div class="sin-modal__spinner" aria-hidden="true"></div>
      </div>
    </div>
  `,document.body.appendChild(e),S(e),e}function m(e){i&&(i.querySelectorAll("[data-sin-step]").forEach(n=>{n.hidden=Number(n.dataset.sinStep)!==e}),setTimeout(()=>{var n,s;e===1&&((n=i.querySelector("#sinEmail"))==null||n.focus()),e===2&&((s=i.querySelector("#sinCode"))==null||s.focus())},50))}function f(){i&&(i.hidden=!0),document.body.style.overflow=""}function l(e,n){if(!i)return;const s=i.querySelector("#"+e);s&&(s.textContent=n,s.hidden=!1)}function u(e){if(!i)return;const n=i.querySelector("#"+e);n&&(n.hidden=!0)}function S(e){e.addEventListener("click",t=>{t.target.closest("[data-sin-close]")&&f(),t.target.closest("[data-sin-back]")&&m(1)}),document.addEventListener("keydown",t=>{t.key==="Escape"&&i&&!i.hidden&&f()});const n=e.querySelector("#sinEmail"),s=e.querySelector("#sinSendBtn"),r=e.querySelector("#sinCode"),o=e.querySelector("#sinVerifyBtn");s.addEventListener("click",async()=>{u("sinEmailError");const t=n.value.trim();if(!t||!t.includes("@")||t.length<5){l("sinEmailError","That doesn't look like an email — try again.");return}const c=Date.now();if(c-_<y){const E=Math.ceil((y-(c-_))/1e3);l("sinEmailError",`Easy — wait ${E}s before trying again.`);return}s.disabled=!0;const p=s.textContent;s.textContent="Sending…";const{error:d}=await h(t);if(s.disabled=!1,s.textContent=p,d){l("sinEmailError","Couldn't send code — "+(d.message||"try again later"));return}_=Date.now();const a=e.querySelector("#sinEmailEcho");a&&(a.textContent=t),r.dataset.email=t,m(2)}),n.addEventListener("keydown",t=>{t.key==="Enter"&&s.click()}),n.addEventListener("input",()=>u("sinEmailError")),o.addEventListener("click",async()=>{u("sinCodeError");const t=r.value.trim(),c=r.dataset.email||"";if(!t||t.length<6){l("sinCodeError","Pop in the 6-digit code from your email.");return}o.disabled=!0;const p=o.textContent;o.textContent="Verifying…";const{error:d}=await b(c,t);if(d){o.disabled=!1,o.textContent=p,l("sinCodeError","That code didn't work — "+(d.message||"try again"));return}m(3);try{await new Promise(a=>setTimeout(a,250)),await g()}catch(a){console.warn("[SignInModal] cloudPull failed:",a)}try{localStorage.setItem("harvest_seen_landing","1")}catch{}window.location.reload()}),r.addEventListener("keydown",t=>{t.key==="Enter"&&o.click()}),r.addEventListener("input",()=>u("sinCodeError"))}function C(){i||(i=v()),i.hidden=!1,m(1)}export{C as showSignInModal};
