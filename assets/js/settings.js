(function(){
  async function loadSettings(){
    try{
      const r = await fetch('/content/settings.json', {cache:'no-store'});
      if(!r.ok) return null;
      return await r.json();
    }catch(e){ return null; }
  }
  function setIf(el, attr, val){ if(el && val){ el.setAttribute(attr, val); } }
  function setTextIf(sel, val){ const el=document.querySelector(sel); if(el && val){ el.textContent=val; } }
  function replaceAnalyticsDomain(val){
    if(!val) return;
    // Replace data-domain on plausible script if present
    document.querySelectorAll('script[src*="plausible.io"]').forEach(s=>{
      s.setAttribute('data-domain', val);
    });
  }
  function applyContactEmail(val){
    if(!val) return;
    document.querySelectorAll('a[href^="mailto:"]').forEach(a=>{
      a.setAttribute('href', 'mailto:'+val);
      if(a.textContent.match(/@/)) a.textContent = val;
    });
  }
  function applyTurnstile(sitekey){
    if(!sitekey) return;
    document.querySelectorAll('.cf-turnstile').forEach(div=>div.setAttribute('data-sitekey', sitekey));
  }
  function applyForms({waitlist_form_action, partner_form_action, apps_script_url}){
    const wl = document.getElementById('waitlist-form');
    const pf = document.getElementById('partner-form');
    if(wl && waitlist_form_action){ wl.setAttribute('action', waitlist_form_action); }
    if(pf && partner_form_action){ pf.setAttribute('action', partner_form_action); }
    if(wl && apps_script_url){ wl.setAttribute('data-apps-script', apps_script_url); }
    if(pf && apps_script_url){ pf.setAttribute('data-apps-script', apps_script_url); }
  }
  function togglePortal(show){
    const link = document.querySelector('a[href="/portal/index.html"]');
    if(link && !show){ link.style.display='none'; }
  }
  loadSettings().then(s=>{
    if(!s) return;
    replaceAnalyticsDomain(s.analytics_domain);
    applyContactEmail(s.contact_email);
    applyTurnstile(s.turnstile_sitekey);
    applyForms(s);
    togglePortal(!!s.show_portal);
    // Update canonical/og:url if site_url exists
    if(s.site_url){
      const link = document.querySelector('link[rel="canonical"]');
      if(link){ link.setAttribute('href', s.site_url); }
      const og = document.querySelector('meta[property="og:url"]');
      if(og){ og.setAttribute('content', s.site_url); }
    }
  });
})();

(function(){
  async function fetchJSON(p){ try{ const r = await fetch(p, {cache:'no-store'}); if(!r.ok) return null; return await r.json(); }catch(e){ return null; } }
  function applyTheme(t){
    if(!t) return;
    const r = document.documentElement.style;
    const c = (t.colors||{});
    if(c.background) r.setProperty('--lt-bg', c.background);
    if(c.text) r.setProperty('--lt-text', c.text);
    if(c.primary) r.setProperty('--lt-primary', c.primary);
    if(c.accent) r.setProperty('--lt-accent', c.accent);
    if(c.muted) r.setProperty('--lt-muted', c.muted);
    if(c.border) r.setProperty('--lt-border', c.border);
    const f = (t.fonts||{});
    if(f.heading) document.documentElement.style.setProperty('--lt-heading', f.heading);
    if(f.body) document.documentElement.style.setProperty('--lt-body', f.body);
  }
  function injectAnnouncement(text){
    if(!text) return;
    if(document.querySelector('[data-annc]')) return;
    const bar = document.createElement('div');
    bar.setAttribute('data-annc','');
    bar.style.background = 'var(--lt-muted, rgba(255,255,255,.06))';
    bar.style.borderBottom = '1px solid var(--lt-border, rgba(255,255,255,.10))';
    bar.style.padding = '10px 16px';
    bar.style.position = 'sticky';
    bar.style.top = '0';
    bar.style.zIndex = '50';
    bar.innerHTML = '<div style="max-width:1200px;margin:0 auto;opacity:.9;font-size:14px">'+text+'</div>';
    document.body.prepend(bar);
  }
  function applyMaintenance(enabled){
    if(!enabled) return;
    if (location.pathname.startsWith('/admin')) return;
    const wrap = document.createElement('div');
    wrap.style.minHeight='100vh';
    wrap.style.display='grid';
    wrap.style.placeItems='center';
    wrap.innerHTML = '<div style="text-align:center"><h1 style="font-family:var(--lt-heading);font-size:48px;margin-bottom:12px">We’ll be right back</h1><p style="opacity:.8;max-width:520px">We’re making updates. Please check again soon.</p></div>';
    document.body.innerHTML='';
    document.body.appendChild(wrap);
  }
  async function boot(){
    const t = await fetchJSON('/content/theme.json'); applyTheme(t);
    const f = await fetchJSON('/content/flags.json');
    if(f){
      if(f.announcement_enabled) injectAnnouncement(f.announcement_text||'');
      if(f.maintenance_mode) applyMaintenance(true);
      if(f.beta_code_required){
        try{
          const ok = sessionStorage.getItem('lt_beta_ok')==='1';
          if(!ok){
            const input = prompt('Enter beta access code:');
            if(input === (f.beta_code_value||'')){ sessionStorage.setItem('lt_beta_ok','1'); }
            else { document.body.innerHTML = '<div style="display:grid;min-height:100vh;place-items:center"><div>Invalid code.</div></div>'; return; }
          }
        }catch(_){}
      }
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

  window.LT_SETTINGS = window.LT_SETTINGS || {};
  (async function(){
    try{
      const r = await fetch('/content/settings.json', {cache:'no-store'});
      if(!r.ok) return;
      const s = await r.json();
      window.LT_SETTINGS = s;
    }catch(e){}
  })();
