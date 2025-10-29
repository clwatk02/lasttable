(function(){
  function setupForm(selector){
    const form = document.querySelector(selector);
    if(!form) return;
    const appsScriptURL = form.getAttribute('data-apps-script'); // optional
    form.addEventListener('submit', function(e){
      if(appsScriptURL){
        try{
          const fd = new FormData(form);
          fetch(appsScriptURL, { method:'POST', body: fd, mode:'no-cors' }).catch(()=>{});
        }catch(_){}
      }
    });
  }
  setupForm('#waitlist-form');
  setupForm('#partner-form');
})();

(function(){
  function setupForm(selector, kind){
    const form = document.querySelector(selector);
    if(!form) return;
    const appsScriptURL = form.getAttribute('data-apps-script'); // optional
    form.addEventListener('submit', function(e){
      const fd = new FormData(form);
      // Optional Apps Script mirror
      if(appsScriptURL){
        try{ fetch(appsScriptURL, { method:'POST', body: fd, mode:'no-cors' }).catch(()=>{}); }catch(_){}
      }
      // Optional EmailJS
      setTimeout(()=>{
        try{
          const S = window.LT_SETTINGS || {};
          if(S.emailjs_public_key && S.emailjs_service_id){
            if(!window.emailjs){
              var s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js';
              s.onload = function(){ emailjs.init(S.emailjs_public_key); sendEmails(); };
              document.head.appendChild(s);
            } else { sendEmails(); }
            function sendEmails(){
              try{
                const data = Object.fromEntries(fd.entries());
                // Admin email
                if(S.emailjs_template_id_admin){
                  emailjs.send(S.emailjs_service_id, S.emailjs_template_id_admin, Object.assign({kind: kind||'form'}, data)).catch(()=>{});
                }
                // User email
                if(S.emailjs_template_id_user && data.email){
                  emailjs.send(S.emailjs_service_id, S.emailjs_template_id_user, Object.assign({kind: kind||'form'}, data)).catch(()=>{});
                }
              }catch(_){}
            }
          }
        }catch(_){}
      }, 200);
    });
  }
  setupForm('#waitlist-form','waitlist');
  setupForm('#partner-form','partner');
  setupForm('#press-form','press');
  setupForm('#interest','interest');
  setupForm('#claim-form','claim');
})();
// ---- Audit / webhook helper ----
function ltAudit(eventName, payload){
  try{
    const S = window.LT_SETTINGS || {};
    if(!S.audit_webhook_url) return;
    fetch(S.audit_webhook_url, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({event:eventName, ts:new Date().toISOString(), payload})
    }).catch(()=>{});
  }catch(_){}
}

// Map form fields into unified structure for EmailJS variables
function mapVars(kind, data){
  const base = { kind, ts: new Date().toISOString() };
  const map = {};
  for(const [k,v] of Object.entries(data)){ map[k]=v; }
  // normalize likely fields
  map.city = map.city || map.City || '';
  map.email = map.email || map.Email || '';
  map.name = map.name || map.fullname || map.FullName || '';
  map.restaurant = map.restaurant || map.Restaurant || '';
  map.party = map.party || map.Party || '';
  map.date = map.date || map.Date || '';
  map.time = map.time || map.Time || '';
  return Object.assign(base, map);
}
