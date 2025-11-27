// corebound-gdd.js
// PASSWORD GATE (working build with fallback) + deck helpers (TOC, print, active section)

const PASSWORD_SHA256 = "5994471abb01112afcc18159f6cc74b4f511b99806da59b3caf5a9c173cacfc5"; // sha256("12345")
const AUTO_TIMEOUT_MS = 12 * 60 * 60 * 1000; // 12 hours
const PLAINTEXT_CODE = ""; // keep "" in production

// ---- DOM ----
const lockScreen = document.getElementById("lockScreen");
const gddContent = document.getElementById("gddContent");
const form = document.getElementById("authForm");
const msg = document.getElementById("authMsg");
const lockBtn = document.getElementById("lockBtn");
const printBtn = document.getElementById("printBtn");
let timeoutHandle = null;

// ---- Helpers ----
function cleanInput(s){ return (s||"").normalize("NFKC").replace(/[\u200B-\u200D\uFEFF]/g,"").trim(); }
function startAutoTimeout(){
  clearTimeout(timeoutHandle);
  timeoutHandle = setTimeout(()=>{ relock("Session timed out. Please re-enter the access code."); }, AUTO_TIMEOUT_MS);
}
function unlock(){
  lockScreen.classList.add("hidden");
  gddContent.classList.remove("hidden");
  msg.textContent = ""; msg.style.color = "";
  startAutoTimeout();
  initDeck();
}
function relock(info){
  clearTimeout(timeoutHandle);
  gddContent.classList.add("hidden");
  lockScreen.classList.remove("hidden");
  msg.textContent = info || ""; msg.style.color = "";
  const input = document.getElementById("accessCode"); if (input) input.value = "";
}

// SHA-256 (WebCrypto with fallback)
function rightRotate(v,a){ return (v>>>a) | (v<<(32-a)); }
function sha256Fallback(ascii){
  let mathPow=Math.pow,maxWord=mathPow(2,32),l="length",i,j,result="",words=[],asciiBitLength=ascii[l]*8,hash=sha256Fallback.h||[],k=sha256Fallback.k||[],primeCounter=k[l],isComposite={}
  for(let candidate=2;primeCounter<64;candidate++){ if(!isComposite[candidate]){ for(i=0;i<313;i+=candidate){ isComposite[i]=candidate } hash[primeCounter]=(mathPow(candidate,.5)*maxWord)|0; k[primeCounter++]=(mathPow(candidate,1/3)*maxWord)|0 } }
  ascii+="\x80"; while(ascii[l]%64-56) ascii+="\x00"
  for(i=0;i<ascii[l];i++){ j=ascii.charCodeAt(i); if(j>>8) return; words[i>>2]|=j<<((3-i)%4)*8 }
  words[words[l]]=((asciiBitLength/maxWord)|0); words[words[l]]=asciiBitLength
  for(j=0;j<words[l];){ let w=words.slice(j,j+=16),oldHash=hash; hash=hash.slice(0,8)
    for(i=0;i<64;i++){ let w15=w[i-15],w2=w[i-2],a=hash[0],e=hash[4]
      let t1=hash[7]+(rightRotate(e,6)^rightRotate(e,11)^rightRotate(e,25))+((e&hash[5])^((~e)&hash[6]))+k[i]+(w[i]=(i<16)?w[i]:((w[i-16]+(rightRotate(w15,7)^rightRotate(w15,18)^(w15>>>3))+w[i-7]+(rightRotate(w2,17)^rightRotate(w2,19)^(w2>>>10)))|0))
      let t2=(rightRotate(a,2)^rightRotate(a,13)^rightRotate(a,22))+((a&hash[1])|(a&hash[2])|(hash[1]&hash[2]))
      hash=[(t1+t2)|0].concat(hash); hash[4]=(hash[4]+t1)|0
    }
    for(i=0;i<8;i++){ hash[i]=(hash[i]+oldHash[i])|0 }
  }
  for(i=0;i<8;i++){ for(j=3;j+1;j--){ let b=(hash[i]>>(j*8))&255; result+=((b<16)?0:"")+b.toString(16) } }
  return result
}
async function sha256(text){
  if (window.crypto && window.crypto.subtle){
    const enc=new TextEncoder().encode(text);
    const buf=await crypto.subtle.digest("SHA-256",enc);
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,"0")).join("");
  }
  return sha256Fallback(text);
}

// ---- Gate wire-up ----
document.addEventListener("DOMContentLoaded", ()=>{
  if (!lockScreen || !gddContent || !form) return;

  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const input = document.getElementById("accessCode");
    let code = cleanInput(input?.value);
    if (!code) return;

    if (/^[a-f0-9]{64}$/i.test(code)){
      msg.textContent = "That looks like a hash. Enter the actual access code provided to you.";
      msg.style.color = "salmon";
      return;
    }
    try{
      if (PLAINTEXT_CODE && code===PLAINTEXT_CODE){ unlock(); return; }
      const hash = await sha256(code);
      if (hash === PASSWORD_SHA256){ unlock(); }
      else { msg.textContent = "Incorrect code."; msg.style.color="salmon"; }
    }catch(err){
      console.error(err);
      msg.textContent = "Unexpected error hashing the code. Refresh and try again.";
      msg.style.color="salmon";
    }
  });

  window.addEventListener("beforeunload", ()=> clearTimeout(timeoutHandle));
});

// ---- Deck helpers: TOC, active section, print ----
function initDeck(){
  const toc = document.getElementById("deckTOC");
  const slides = Array.from(document.querySelectorAll(".slide"));
  if (toc){
    slides.forEach(slide=>{
      const title = slide.getAttribute("data-title") || "Slide";
      const id = "s_" + title.toLowerCase().replace(/[^a-z0-9]+/g,"-");
      slide.setAttribute("id", id);
      const a = document.createElement("a");
      a.href = `#${id}`; a.textContent = title;
      toc.appendChild(a);
    });
  }

  // highlight current section on scroll
  const items = toc ? Array.from(toc.querySelectorAll("a")) : [];
  const map = new Map(slides.map(s => [s.id, s]));
  const onScroll = ()=>{
    const y = window.scrollY + 140; // offset for header
    let currentId = slides[0]?.id;
    for (const s of slides){
      if (s.offsetTop <= y) currentId = s.id;
      else break;
    }
    items.forEach(a => a.setAttribute("aria-current", a.hash === "#"+currentId ? "true" : "false"));
  };
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // print/export
  const printBtn = document.getElementById("printBtn");
  if (printBtn){ printBtn.addEventListener("click", ()=> window.print()); }
  const year = document.getElementById("year"); if (year) year.textContent = new Date().getFullYear();
}

// Manual lock button (wired after unlock)
if (lockBtn){ lockBtn.addEventListener("click", ()=> relock("Locked. Enter the access code to continue.")); }
