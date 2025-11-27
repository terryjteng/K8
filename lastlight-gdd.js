// Password gate (SHA-256 with fallback), no persistence, 12h timeout
// + Deck helpers (TOC, active section highlight, print, manual lock)

const PASSWORD_SHA256 = "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"; // sha256("12345")
const AUTO_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours
const PLAINTEXT_CODE = ""; // keep "" in production

// DOM
const lockScreen = document.getElementById("lockScreen");
const gddContent = document.getElementById("gddContent");
const form = document.getElementById("authForm");
const msg = document.getElementById("authMsg");
const lockBtn = document.getElementById("lockBtn");
const printBtn = document.getElementById("printBtn");
let timeoutHandle = null;

// Helpers
function cleanInput(s){ return (s||"").normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g,"").trim(); }
function startAutoTimeout(){ clearTimeout(timeoutHandle); timeoutHandle = setTimeout(()=>relock("Session timed out. Please re-enter the access code."), AUTO_TIMEOUT_MS); }
function unlock(){ lockScreen.classList.add("hidden"); gddContent.classList.remove("hidden"); msg.textContent=""; msg.style.color=""; startAutoTimeout(); initDeck(); }
function relock(info){ clearTimeout(timeoutHandle); gddContent.classList.add("hidden"); lockScreen.classList.remove("hidden"); msg.textContent = info || ""; msg.style.color=""; const i=document.getElementById("accessCode"); if(i) i.value=""; }

// SHA-256 with fallback for non-secure contexts
function rr(v,a){ return (v>>>a) | (v<<(32-a)); }
function sha256Fallback(t){ let m=Math.pow,M=m(2,32),l="length",i,j,r="",w=[],b=t[l]*8,h=sha256Fallback.h||[],k=sha256Fallback.k||[],p=k[l],c={}
  for(let d=2;p<64;d++){ if(!c[d]){ for(i=0;i<313;i+=d) c[i]=d; h[p]=(m(d,.5)*M)|0; k[p++]=(m(d,1/3)*M)|0 } }
  t+="\x80"; while(t[l]%64-56) t+="\x00"; for(i=0;i<t[l];i++){ j=t.charCodeAt(i); if(j>>8) return; w[i>>2]|=j<<((3-i)%4)*8 }
  w[w[l]]=((b/M)|0); w[w[l]]=b; for(j=0;j<w[l];){ let s=w.slice(j,j+=16),o=h; h=h.slice(0,8)
    for(i=0;i<64;i++){ let s15=s[i-15],s2=s[i-2],a=h[0],e=h[4]
      let t1=h[7]+(rr(e,6)^rr(e,11)^rr(e,25))+((e&h[5])^((~e)&h[6]))+k[i]+(s[i]=(i<16)?s[i]:((s[i-16]+(rr(s15,7)^rr(s15,18)^(s15>>>3))+s[i-7]+(rr(s2,17)^rr(s2,19)^(s2>>>10)))|0))
      let t2=(rr(a,2)^rr(a,13)^rr(a,22))+((a&h[1])|(a&h[2])|(h[1]&h[2])); h=[(t1+t2)|0].concat(h); h[4]=(h[4]+t1)|0 }
    for(i=0;i<8;i++) h[i]=(h[i]+o[i])|0 }
  for(i=0;i<8;i++) for(j=3;j+1;j--){ let q=(h[i]>>(j*8))&255; r+=((q<16)?0:"")+q.toString(16) } return r }
async function sha256(text){ if (window.crypto && window.crypto.subtle){ const e=new TextEncoder().encode(text); const b=await crypto.subtle.digest("SHA-256",e); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("") } return sha256Fallback(text) }

// Gate wire-up
document.addEventListener("DOMContentLoaded", ()=>{
  if (!lockScreen || !gddContent || !form) return;

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const input = document.getElementById("accessCode");
    let code = cleanInput(input?.value);
    if (!code) return;

    if (/^[a-f0-9]{64}$/i.test(code)){ msg.textContent="That looks like a hash. Enter the actual access code provided to you."; msg.style.color="salmon"; return; }

    try{
      if (PLAINTEXT_CODE && code===PLAINTEXT_CODE){ unlock(); return; }
      const hash = await sha256(code);
      if (hash === PASSWORD_SHA256) { unlock(); }
      else { msg.textContent="Incorrect code."; msg.style.color="salmon"; }
    }catch(err){
      console.error(err);
      msg.textContent="Unexpected error hashing the code. Refresh and try again.";
      msg.style.color="salmon";
    }
  });

  if (lockBtn){ lockBtn.addEventListener("click", ()=> relock("Locked. Enter the access code to continue.")); }
  if (printBtn){ printBtn.addEventListener("click", ()=> window.print()); }

  window.addEventListener("beforeunload", ()=> clearTimeout(timeoutHandle));
});

// Deck helpers
function initDeck(){
  const toc = document.getElementById("deckTOC");
  const slides = Array.from(document.querySelectorAll(".slide"));
  if (toc){
    slides.forEach(slide=>{
      const title = slide.getAttribute("data-title") || "Slide";
      const id = "s_" + title.toLowerCase().replace(/[^a-z0-9]+/g,"-");
      slide.id = id;
      const a = document.createElement("a"); a.href = `#${id}`; a.textContent = title; toc.appendChild(a);
    });
  }
  const items = toc ? Array.from(toc.querySelectorAll("a")) : [];
  const onScroll = ()=>{
    const y = window.scrollY + 140;
    let current = slides[0]?.id;
    for (const s of slides){ if (s.offsetTop <= y) current = s.id; else break; }
    items.forEach(a => a.setAttribute("aria-current", a.hash === "#"+current ? "true" : "false"));
  };
  document.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const year = document.getElementById("year"); if (year) year.textContent = new Date().getFullYear();
}
