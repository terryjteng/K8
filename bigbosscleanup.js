// Minor polish: sticky shadow on bar + year
const bar = document.querySelector('.kb-bar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 8) bar?.classList.add('is-scrolled');
  else bar?.classList.remove('is-scrolled');
});

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
