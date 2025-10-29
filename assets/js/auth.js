
(function(){
  // Ensure widget loaded
  function ready(fn){ if(document.readyState!=='loading') fn(); else document.addEventListener('DOMContentLoaded', fn); }

  function ensureButtons(){
    let hdr = document.querySelector('header .max-w-6xl, header .container, header');
    if(!hdr) return;
    if(document.getElementById('lt-auth')) return;
    const wrap = document.createElement('div');
    wrap.id = 'lt-auth';
    wrap.className = 'flex items-center gap-2';
    wrap.innerHTML = '<button id="lt-login" class="btn-primary text-xs px-3 py-2">Login</button><button id="lt-logout" class="btn-primary text-xs px-3 py-2" style="display:none">Logout</button>';
    // place on the right of nav if possible
    const nav = hdr.querySelector('nav');
    if(nav && nav.parentElement){ nav.parentElement.appendChild(wrap); }
    else { hdr.appendChild(wrap); }
  }

  function setAdminVisibility(isAdmin){
    document.querySelectorAll('[data-admin-only]').forEach(el => {
      el.style.display = isAdmin ? '' : 'none';
    });
  }

  function handleUser(user){
    const loginBtn = document.getElementById('lt-login');
    const logoutBtn = document.getElementById('lt-logout');
    const roles = (user && user.app_metadata && user.app_metadata.roles) || [];
    const isAdmin = roles.includes('admin');

    if(loginBtn && logoutBtn){
      if(user){ loginBtn.style.display='none'; logoutBtn.style.display=''; }
      else{ loginBtn.style.display=''; logoutBtn.style.display='none'; }
    }
    setAdminVisibility(!!isAdmin);

    // Redirect on login to dashboards
    if(user){
      if(isAdmin){
        if(location.pathname !== '/admin/' && !location.pathname.startsWith('/admin/')){
          // only redirect if not already in admin route
          // Use hash route for CMS direct links
          location.href = '/admin/';
        }
      }else{
        if(location.pathname !== '/dashboard.html'){
          location.href = '/dashboard.html';
        }
      }
    }
  }

  ready(function(){
    ensureButtons();
    const id = window.netlifyIdentity;
    const loginBtn = document.getElementById('lt-login');
    const logoutBtn = document.getElementById('lt-logout');

    if(loginBtn){
      loginBtn.addEventListener('click', function(){
        if(window.netlifyIdentity){ window.netlifyIdentity.open('login'); }
      });
    }
    if(logoutBtn){
      logoutBtn.addEventListener('click', function(){
        if(window.netlifyIdentity){ window.netlifyIdentity.logout(); }
      });
    }

    function init(){
      const user = id && id.currentUser ? id.currentUser() : null;
      handleUser(user);
    }

    if(id){
      id.on('init', user => handleUser(user));
      id.on('login', user => handleUser(user));
      id.on('logout', () => handleUser(null));
      id.init();
    }else{
      // No identity widget loaded; hide admin-only
      setAdminVisibility(false);
    }
  });
})();
