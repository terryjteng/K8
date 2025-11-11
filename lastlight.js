// Page-specific hooks can go here. Global nav behavior comes from main.js.
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
