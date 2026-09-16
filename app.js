(function () {
  var C = window.DW_CONFIG;
  var db = supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY);
  var $ = function (s) { return document.querySelector(s); };

  function esc(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function handle(x) { return String(x || '').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?(x|twitter)\.com\//, '').replace(/\/$/, ''); }
  function liurl(u) { u = String(u || '').trim(); if (!u) return ''; return /^https?:/.test(u) ? u : 'https://' + u.replace(/^\/+/, ''); }

  /* ---------- wall ---------- */
  function render(stories) {
    var out = stories.map(function (s, i) {
      var links = '';
      if (s.x_handle) links += '<a href="https://x.com/' + esc(handle(s.x_handle)) + '" target="_blank" rel="noopener">𝕏 @' + esc(handle(s.x_handle)) + '</a>';
      if (s.linkedin) links += '<a href="' + esc(liurl(s.linkedin)) + '" target="_blank" rel="noopener">in</a>';
      var who = s.anonymous || !s.name ? 'Anonymous' : s.name;
      return '<article class="card">' +
        (s.year ? '<span class="rip">RIP ' + esc(s.year) + '</span>' : '') +
        '<span class="num">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<h3>' + esc(s.one_liner) + '</h3>' +
        (s.image_url ? '<img src="' + esc(s.image_url) + '" alt="" loading="lazy">' : '') +
        '<p>' + esc(s.reason) + '</p>' +
        '<div class="meta"><span class="who">' + esc(who) + '</span><span class="links">' + links + '</span></div>' +
        '</article>';
    }).join('');
    $('#cards').innerHTML = out || '<div class="empty">Nothing here yet. Be the first to lose publicly.</div>';
    $('#count').textContent = stories.length + (stories.length === 1 ? ' loss' : ' losses');
  }

  function loadWall() {
    db.from('stories').select('id,one_liner,reason,year,name,anonymous,x_handle,linkedin,image_url,created_at')
      .eq('status', 'approved').order('created_at', { ascending: false })
      .then(function (r) {
        if (r.error) { $('#cards').innerHTML = '<div class="empty">Couldn\'t load the wall. Try refreshing.</div>'; return; }
        render(r.data || []);
      });
  }
  loadWall();

  /* ---------- form ---------- */
  $('#f-why').addEventListener('input', function () { $('#cc').textContent = this.value.length; });
  $('#f-anon').addEventListener('change', function () { $('#f-name').disabled = this.checked; if (this.checked) $('#f-name').value = ''; });

  function compress(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 1200, sc = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error('compress')); }, 'image/jpeg', 0.82);
      };
      img.onerror = function () { reject(new Error('bad image')); };
      img.src = url;
    });
  }

  $('#send').onclick = async function () {
    var st = $('#fstatus');
    var one = $('#f-one').value.trim(), why = $('#f-why').value.trim();
    if (!one || !why) { st.textContent = 'Tell us what you failed at, and what happened. Everything else is optional.'; return; }
    var btn = this; btn.disabled = true; st.textContent = 'Sending…';
    try {
      var image_url = null;
      var file = $('#f-img').files[0];
      if (file) {
        var blob = await compress(file);
        if (blob.size > 2 * 1024 * 1024) throw new Error('Image is too big even after squeezing it. Try a smaller one.');
        var path = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
        var up = await db.storage.from('screenshots').upload(path, blob, { contentType: 'image/jpeg' });
        if (up.error) throw up.error;
        image_url = db.storage.from('screenshots').getPublicUrl(path).data.publicUrl;
      }
      var anon = $('#f-anon').checked;
      var ins = await db.from('stories').insert({
        one_liner: one, reason: why,
        year: $('#f-year').value.trim() || null,
        name: anon ? null : ($('#f-name').value.trim() || null),
        anonymous: anon,
        x_handle: handle($('#f-x').value) || null,
        linkedin: $('#f-li').value.trim() || null,
        image_url: image_url,
        status: 'pending'
      });
      if (ins.error) throw ins.error;
      $('#formwrap').style.display = 'none'; $('#sent').classList.add('show');
      st.textContent = '';
    } catch (e) {
      st.textContent = 'Hmm, that didn\'t work either. ' + (e.message || 'Try again in a bit.');
    }
    btn.disabled = false;
  };
  $('#again').onclick = function () {
    $('#formwrap').style.display = ''; $('#sent').classList.remove('show');
    ['#f-one', '#f-why', '#f-year', '#f-name', '#f-x', '#f-li', '#f-img'].forEach(function (i) { $(i).value = ''; });
    $('#f-anon').checked = false; $('#f-name').disabled = false; $('#cc').textContent = '0';
  };

  /* ---------- tip ---------- */
  $('#tipbtn').onclick = function () { $('#paycard').classList.toggle('show'); };
  $('#payclose').onclick = function () { $('#paycard').classList.remove('show'); };
})();
