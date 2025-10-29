(function(){
  // Haversine distance (km)
  function dist(a,b){
    const toRad = d=>d*Math.PI/180;
    const R=6371, dLat=toRad(b.lat-a.lat), dLng=toRad(b.lng-a.lng);
    const s1=Math.sin(dLat/2), s2=Math.sin(dLng/2);
    const c=2*Math.asin(Math.sqrt(s1*s1 + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*s2*s2));
    return R*c;
  }
  function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }

  async function loadJSON(p){ const r=await fetch(p,{cache:'no-store'}); return r.ok? r.json():null; }

  window.LTMap = async function initMap(){
    const mapEl = document.getElementById('map');
    if(!mapEl) return;
    const Ls = window.L;
    const map = Ls.map('map',{ zoomControl:true }).setView([39.5,-98.35], 4);
    Ls.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const data = await loadJSON('/content/restaurants.json');
    const list = (data && data.restaurants) || [];
    const markers = [];
    list.forEach(r=>{
      const m = Ls.marker([r.lat, r.lng]).addTo(map);
      m.bindPopup(`<strong>${r.name}</strong><br>${r.address}<br/><a target="_blank" href="${r.url||'#'}">Website</a>`);
      m.restaurant = r;
      markers.push(m);
    });

    // Controls
    const results = document.getElementById('results');
    function renderList(items){
      results.innerHTML='';
      items.forEach(r=>{
        const card = el(`<div class="glass p-4 rounded-2xl border mb-3">
          <div class="text-sm opacity-70">${r.city}</div>
          <div class="text-lg font-semibold">${r.name}</div>
          <div class="opacity-80">${r.address}</div>
          <div class="text-xs opacity-70 mt-1">${(r.tags||[]).join(' • ')}</div>
          <div class="mt-2 flex gap-2">
            <a class="underline" target="_blank" href="${r.url||'#'}">Website</a>
            <a class="underline" target="_blank" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name+' '+r.address)}">Map</a>
          </div>
        </div>`);
        results.appendChild(card);
      });
    }
    renderList(list);

    // Search
    const q = document.getElementById('q');
    const citySel = document.getElementById('cityFilter');
    function applyFilters(){
      const term = (q.value||'').toLowerCase();
      const city = citySel.value || '';
      const filtered = list.filter(r=>{
        const t = [r.name, r.address, ...(r.tags||[])].join(' ').toLowerCase();
        const okTerm = !term || t.includes(term);
        const okCity = !city || r.city===city;
        return okTerm && okCity;
      });
      renderList(filtered);
      if(filtered[0]) map.setView([filtered[0].lat, filtered[0].lng], 12);
    }
    q && q.addEventListener('input', applyFilters);
    citySel && citySel.addEventListener('change', applyFilters);

    // Use cities.json to populate cityFilter
    fetch('/content/cities.json').then(r=>r.json()).then(d=>{
      const cs=(d&&d.cities)||[]; cs.forEach(c=>{
        const opt=document.createElement('option'); opt.value=c; opt.textContent=c;
        citySel && citySel.appendChild(opt);
      });
    });

    // GPS
    const nearBtn = document.getElementById('nearMe');
    nearBtn && nearBtn.addEventListener('click', ()=>{
      if(!navigator.geolocation) return alert('Geolocation not available');
      navigator.geolocation.getCurrentPosition(pos=>{
        const me = {lat: pos.coords.latitude, lng: pos.coords.longitude};
        map.setView([me.lat, me.lng], 13);
        const sorted = list.slice().sort((a,b)=> dist(me,{lat:a.lat,lng:a.lng}) - dist(me,{lat:b.lat,lng:b.lng}));
        renderList(sorted.slice(0,20));
      }, ()=>alert('Unable to get location'));
    });
  }

  // Reservation Inventory UI helpers
  window.LTInventory = async function initInv(){
    const data = await loadJSON('/content/reservations.json');
    const rest = await loadJSON('/content/restaurants.json');
    const rmap = new Map((rest.restaurants||[]).map(r=>[r.id, r]));
    const list = (data && data.reservations) || [];
    const tbody = document.getElementById('invRows');
    const filterSel = document.getElementById('invStatus');
    const citySel = document.getElementById('invCity');
    const search = document.getElementById('invSearch');

    function render(){
      const status = filterSel.value||'';
      const city = citySel.value||'';
      const term = (search.value||'').toLowerCase();
      tbody.innerHTML='';
      list.filter(x=>{
        const R = rmap.get(x.restaurant_id)||{};
        const okS = !status || x.status===status;
        const okC = !city || R.city===city;
        const t = `${R.name||''} ${R.address||''} ${x.confirmation||''} ${x.under_name||''}`.toLowerCase();
        const okT = !term || t.includes(term);
        return okS && okC && okT;
      }).forEach(x=>{
        const R = rmap.get(x.restaurant_id)||{name:'Unknown',address:''};
        const tr = document.createElement('tr');
        const dt = `${x.date} ${x.time}`;
        tr.innerHTML = `<td class="px-3 py-2">${R.name}</td>
                        <td class="px-3 py-2">${dt}</td>
                        <td class="px-3 py-2">${x.party}</td>
                        <td class="px-3 py-2">${x.status}</td>
                        <td class="px-3 py-2 text-xs">${x.confirmation||''}</td>
                        <td class="px-3 py-2">
                          <a class="underline text-champagne" target="_blank" href="/admin/#/collections/reservations/entries/${x.id}">Edit</a>
                          <button class="underline ml-3" data-ics='${JSON.stringify({title:R.name,date:x.date,time:x.time,dur:90,desc:"Reservation",loc:R.address})}'>ICS</button>
                          <a class="underline ml-3" target="_blank" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(R.name+' '+R.address)}">Map</a>
                        </td>`;
        tbody.appendChild(tr);
      });
    }
    // Populate cities
    const cs = (rest.cities||[]);
    const uniqueCities = new Set((rest.restaurants||[]).map(r=>r.city));
    uniqueCities.forEach(c=>{
      const o=document.createElement('option'); o.value=c; o.textContent=c; citySel.appendChild(o);
    });

    filterSel.addEventListener('change', render);
    citySel.addEventListener('change', render);
    search.addEventListener('input', render);
    render();

    // ICS generator
    tbody.addEventListener('click', (e)=>{
      const btn = e.target.closest('button[data-ics]'); if(!btn) return;
      const v = JSON.parse(btn.getAttribute('data-ics'));
      const start = new Date(`${v.date}T${v.time}:00`);
      const end = new Date(start.getTime() + (v.dur||90)*60000);
      function fmt(d){ return d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z'; }
      const ics = [
        'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Last Table//Inventory//EN',
        'BEGIN:VEVENT',
        `UID:lt-${start.getTime()}@lasttable.vip`,
        `DTSTAMP:${fmt(new Date())}`,
        `DTSTART:${fmt(start)}`,
        `DTEND:${fmt(end)}`,
        `SUMMARY:${v.title}`,
        `DESCRIPTION:${v.desc||''}`,
        `LOCATION:${v.loc||''}`,
        'END:VEVENT','END:VCALENDAR'
      ].join('\\r\\n');
      const blob = new Blob([ics], {type:'text/calendar'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'reservation.ics';
      a.click();
    });
  }
})();