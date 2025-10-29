// Simple smooth anchor handling (native CSS supports, but ensure older)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });
});

// Waitlist form UX
const form = document.getElementById('waitlist-form');
if (form) {
  form.addEventListener('submit', (e) => {
    // let it submit but show quick UI
    const btn = form.querySelector('button[type="submit"]');
    if (btn){ btn.disabled = true; btn.innerText = 'Joining…'; }
  });
}
