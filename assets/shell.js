/* ============================================
   Code Life PC · Shared Shell Script
   ============================================ */

const NAV_ITEMS = [
  { key:'recommend', label:'Featured', href:'index.html' },
  { key:'weekly',    label:'Weekly', href:'weekly.html' },
  { key:'dream',     label:'Designs', href:'dream.html' },
  { key:'rp',        label:'Live',  href:'rp.html' },
  { key:'mine',      label:'Mine',    href:'mine.html' },
  { key:'message',   label:'Messages', href:'message.html' },
];

const MESSAGE_DEFAULT_UNREAD = { like: 36, comment: 6, follow: 3, system: 12 };
let messageUnreadState = { ...MESSAGE_DEFAULT_UNREAD };
let mineNoticeTone = 'red';

function getMessageUnreadState() {
  return messageUnreadState;
}

function updateSidebarMessageDot() {
  const wrap = document.querySelector('.nav-item[data-key="message"] .nav-icon-wrap');
  if (!wrap) return;
  const hasUnread = Object.values(getMessageUnreadState()).some(count => count > 0);
  let dot = wrap.querySelector('.nav-message-dot');
  if (hasUnread && !dot) {
    dot = document.createElement('span');
    dot.className = 'nav-message-dot';
    dot.setAttribute('aria-label', 'Unread messages');
    wrap.appendChild(dot);
  } else if (!hasUnread && dot) {
    dot.remove();
  }
}

function updateSidebarMineDot() {
  const wrap = document.querySelector('.nav-item[data-key="mine"] .nav-icon-wrap');
  if (!wrap) return;
  let dot = wrap.querySelector('.nav-mine-dot');
  if (mineNoticeTone === 'none') {
    dot?.remove();
    return;
  }
  if (!dot) {
    dot = document.createElement('span');
    dot.className = 'nav-mine-dot';
    wrap.appendChild(dot);
  }
  dot.classList.toggle('is-green', mineNoticeTone === 'green');
  dot.setAttribute('aria-label', mineNoticeTone === 'red' ? 'Unread bookings' : 'Live preview');
}

window.setMineNoticeTone = function(tone) {
  mineNoticeTone = ['red', 'green', 'none'].includes(tone) ? tone : 'none';
  updateSidebarMineDot();
};

function setMessageUnreadState(state) {
  messageUnreadState = { ...state };
  updateSidebarMessageDot();
}

function renderSidebar(activeKey) {
  const html = NAV_ITEMS.map(n => `
    <a class="nav-item ${n.key === activeKey ? 'active' : ''}" data-key="${n.key}" href="${n.href}" title="${n.label}">
      <div class="nav-icon-wrap">
        <div class="icon-off" style="background-image:url('assets/icons/nav-${n.key}-off.png');"></div>
        <div class="icon-on"  style="background-image:url('assets/icons/nav-${n.key}-on.png');"></div>
      </div>
      <span class="nav-label">${n.label}</span>
    </a>
  `).join('');
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.innerHTML = html;
    updateSidebarMessageDot();
    updateSidebarMineDot();
  }
}

function renderTopRow(opts = {}) {
  const {
    showFilter = true,
    showSort   = true,
    showSearch = true,
    showHistory = false,
    sortLabel  = 'Latest',
  } = opts;

  const top = document.querySelector('.top-row');
  if (!top) return;

  const home = `
    <div class="system-title">
      <span class="home-icon" aria-hidden="true">
        <img src="assets/img/icon-home.png" alt="">
      </span>
      <span>Designs &amp; Live</span>
    </div>
    <div class="spacer"></div>
  `;

  const groupParts = [];
  if (showFilter) {
    groupParts.push(`
      <button class="topbar-btn btn-filter" id="filterBtn" title="Filter">
        <img src="assets/img/btn-filter-default.png" alt="Filter">
      </button>
    `);
  }
  if (showSort) {
    groupParts.push(`
      <button class="topbar-btn sort-dropdown" id="sortBtn" title="Sort">
        <span id="sortLabel">${sortLabel}</span>
        <span class="caret"></span>
      </button>
    `);
  }
  if (showSort && showSearch) {
    groupParts.push('<span class="combo-divider"></span>');
  }
  if (showSearch) {
    groupParts.push(`
      <div class="topbar-btn search-box" id="searchBox">
        <svg class="icon-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7"></circle>
          <line x1="21" y1="21" x2="16.5" y2="16.5"></line>
        </svg>
        <input type="text" placeholder="Search" readonly>
      </div>
    `);
  }

  const group = groupParts.length
    ? `<div class="toolbar-group">${groupParts.join('')}</div>`
    : '';

  const history = showHistory ? `
    <button class="history-entry" onclick="location.href='history.html'" title="History">
      <span class="ic"></span>
      <span>History</span>
    </button>
  ` : '';

  const close = `
    <button class="topbar-btn btn-close" title="Close">
      <img src="assets/img/btn-close.png" alt="Close">
    </button>
  `;

  top.innerHTML = home + group + history + close;

  // 搜索框点击 → 进入搜索页
  const sb = document.getElementById('searchBox');
  if (sb) sb.onclick = () => location.href = 'search.html';

  // 筛选按钮：仅触发弹窗，图标状态由 modal 内部控制
  const fb = document.getElementById('filterBtn');
  if (fb) {
    fb.onclick = () => {
      if (typeof window.openFilter === 'function') window.openFilter();
    };
  }

  // 排序按钮点击展开下拉
  const sBtn = document.getElementById('sortBtn');
  if (sBtn) sBtn.onclick = (e) => {
    e.stopPropagation();
    if (typeof window.openSortPanel === 'function') window.openSortPanel(sBtn);
  };
}

/* ============================================
   渲染卡片
   ============================================ */
function renderCard(it) {
  const stats = it.kind === 'live'
    ? `
      <div class="card-stats">
        <span class="stat">Online 9999</span>
        <span class="stat-right">
          <span class="stat"><img src="assets/img/stat-people.png" alt=""> ${it.online || '0/6'}</span>
        </span>
      </div>
    `
    : `
      <div class="card-stats">
        <span class="stat">Playing ${it.current ?? 9999}</span>
        <span class="stat-right">
          <span class="stat"><img src="assets/img/stat-like.png" alt=""> ${it.likes ?? 9999}</span>
          <span class="stat"><img src="assets/img/stat-star.png" alt=""> ${it.stars ?? 9999}</span>
        </span>
      </div>
    `;

  const titleBar = it.author
    ? `
      <div class="card-title-bar">
        <div class="avatar"></div>
        <div>
          <div class="title">${it.title}</div>
          <div class="author-row">${it.author}</div>
        </div>
      </div>
    `
    : `
      <div class="card-title-bar">
        <div class="avatar"></div>
        <div class="title">${it.title}</div>
      </div>
    `;

  return `
    <article class="card ${it.author ? 'with-author' : ''}">
      <div class="card-cover" style="background-image:url('${it.cover}');">
        <div class="card-tag-left">${it.label || 'Play Tag'}</div>
        ${stats}
      </div>
      <div class="card-tag-featured">Featured</div>
      ${titleBar}
    </article>
  `;
}

function makeMixedCards(n = 9) {
  return Array.from({ length: n }, (_, i) => i % 2 === 0
    ? { kind:'live',  cover:'assets/img/card-cover-live.png',  online:'0/6', title:'Live Title 12 Chars Max' }
    : { kind:'dream', cover:'assets/img/card-cover-dream.png', current:9999, likes:9999, stars:9999, title:'Design Title 12 Chars Max' }
  );
}

function makeDreamCards(n = 9) {
  return Array.from({ length: n }, () => ({
    kind:'dream', cover:'assets/img/card-cover-dream.png',
    current:9999, likes:9999, stars:9999, title:'Design Title 12 Chars Max'
  }));
}

function makeLiveCards(n = 9, withAuthor = false) {
  return Array.from({ length: n }, (_, i) => ({
    kind:'live', cover:'assets/img/card-cover-live.png',
    online:'0/6', title:'Dream Title 12 Chars Max',
    author: withAuthor ? (i % 3 === 0 ? 'AuthorName123' : 'Author') : null
  }));
}

/* ============================================
   自定义滚动条
   ============================================ */
function setupScrollbar() {
  const area = document.getElementById('cardsArea');
  const bar  = document.getElementById('scrollbar');
  const thumb = document.getElementById('scrollThumb');
  if (!area || !bar || !thumb) return;

  function updateThumb() {
    const visible = area.clientHeight;
    const total   = area.scrollHeight;
    if (total <= visible) {
      bar.style.display = 'none';
      return;
    }
    bar.style.display = 'block';
    const barH = bar.clientHeight;
    const thumbH = Math.max(40, barH * (visible / total));
    const maxScroll = total - visible;
    const top = (area.scrollTop / maxScroll) * (barH - thumbH);
    thumb.style.height = thumbH + 'px';
    thumb.style.top = top + 'px';
  }

  area.addEventListener('scroll', updateThumb, { passive: true });
  window.addEventListener('resize', updateThumb);
  setTimeout(updateThumb, 100);
  setTimeout(updateThumb, 600);
  updateThumb();

  let dragging = false, startY = 0, startTop = 0;
  thumb.addEventListener('mousedown', (e) => {
    dragging = true;
    startY = e.clientY;
    startTop = parseFloat(thumb.style.top || 0);
    thumb.classList.add('dragging');
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    const barH = bar.clientHeight;
    const thumbH = thumb.offsetHeight;
    const newTop = Math.max(0, Math.min(barH - thumbH, startTop + dy));
    const total = area.scrollHeight;
    const visible = area.clientHeight;
    const ratio = newTop / (barH - thumbH);
    area.scrollTop = ratio * (total - visible);
  });
  document.addEventListener('mouseup', () => {
    if (dragging) {
      dragging = false;
      thumb.classList.remove('dragging');
      document.body.style.userSelect = '';
    }
  });
}

/* ============================================
   排序下拉面板（通用）- 修复：state 闭包 + 关闭后能再次打开
   ============================================ */
function buildSortPanel(items, currentLabel) {
  const state = { panel: null, mask: null, items, currentLabel };

  function close() {
    state.panel?.remove();
    state.mask?.remove();
    state.panel = null;
    state.mask  = null;
    document.getElementById('sortBtn')?.classList.remove('open');
  }

  window.openSortPanel = function(anchor) {
    // 已打开 → 关闭
    if (state.panel) { close(); return; }

    document.getElementById('sortBtn')?.classList.add('open');
    state.mask = document.createElement('div');
    state.mask.className = 'dropdown-mask';
    state.mask.onclick = close;
    document.body.appendChild(state.mask);

    state.panel = document.createElement('div');
    state.panel.className = 'sort-panel';
    state.panel.innerHTML = state.items.map(it => `
      <div class="sort-item ${it.label === state.currentLabel ? 'active' : ''}" data-label="${it.label}">${it.label}</div>
    `).join('');
    document.body.appendChild(state.panel);

    // 定位
    const r = window.layoutRect(anchor);   // 用布局像素，避免 zoom 下偏移
    state.panel.style.left = (r.left) + 'px';
    state.panel.style.top  = (r.bottom + 8) + 'px';
    state.panel.style.minWidth = r.width + 'px';

    state.panel.querySelectorAll('.sort-item').forEach(el => {
      el.onclick = () => {
        state.currentLabel = el.dataset.label;
        // 文案 = "选项 + 排序"，让按钮宽度变化但稳定
        const lbl = document.getElementById('sortLabel');
        if (lbl) lbl.textContent = state.currentLabel + ' Sort';
        close();
      };
    });
  };
}

/* ============================================
   通用 confirm 弹窗
   showConfirm(title, desc, [{label, cls, cb}], maskOpacity?)
   ============================================ */
window.showConfirm = function(title, desc, actions, maskOpacity = 60) {
  const mask = document.createElement('div');
  mask.className = 'modal-mask mask-' + maskOpacity;

  const popup = document.createElement('div');
  popup.className = 'confirm-popup';
  popup.onclick = (e) => e.stopPropagation();
  popup.innerHTML = `
    <div class="confirm-title">${title}</div>
    <div class="confirm-desc">${desc}</div>
    <div class="confirm-actions"></div>
  `;
  const actionsBox = popup.querySelector('.confirm-actions');
  actions.forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'btn-mini ' + (a.cls || 'btn-green');
    btn.textContent = a.label;
    btn.onclick = () => {
      mask.remove();
      a.cb && a.cb();
    };
    actionsBox.appendChild(btn);
  });

  mask.appendChild(popup);
  mask.onclick = () => mask.remove();
  document.body.appendChild(mask);
};

/* 复用详情弹窗的 Toast 样式与节奏 */
window.showPageToast = function(message, host) {
  const old = document.body.querySelector('.page-toast');
  if (old) old.remove();

  const toast = document.createElement('div');
  toast.className = 'detail-toast page-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('is-show'), 0);
  setTimeout(() => {
    toast.classList.remove('is-show');
    setTimeout(() => toast.remove(), 180);
  }, 1600);
};

/* 直播卡片一级页统一文案 */
makeMixedCards = function(n = 9) {
  return Array.from({ length: n }, (_, i) => i % 2 === 0
    ? { kind:'live',  cover:'assets/img/card-cover-live.png',  online:'0/6', title:'Live Title 12 Chars Max' }
    : { kind:'dream', cover:'assets/img/card-cover-dream.png', current:9999, likes:9999, stars:9999, title:'Design Title 12 Chars Max' }
  );
};

makeLiveCards = function(n = 9, withAuthor = false) {
  return Array.from({ length: n }, (_, i) => ({
    kind:'live',
    cover:'assets/img/card-cover-live.png',
    online:'0/6',
    title:'Live Title 12 Chars Max',
    author: withAuthor ? (i % 3 === 0 ? 'AuthorName123' : 'Author') : null
  }));
};

function normalizeLiveCardTitles(root = document) {
  root.querySelectorAll('.card').forEach(card => {
    const cover = card.querySelector('.card-cover');
    const title = card.querySelector('.card-title, .card-title-bar .title, .title');
    if (!cover || !title) return;
    if (/card-cover-live/.test(cover.style.backgroundImage || '')) {
      if (title.textContent.trim() !== 'Live Title 12 Chars Max') {
        title.textContent = 'Live Title 12 Chars Max';
      }
    }
  });
}

/* 三列瀑布流：每批五行（15 张），接近底部显示三点 Loading 后追加。 */
window.setupPagedCardGrid = function(options) {
  const grid = options.grid;
  const area = options.area || document.getElementById('cardsArea');
  const items = options.items || [];
  const render = options.render || renderCard;
  const batchSize = options.batchSize || 15;
  const delay = options.delay || 600;
  if (!grid || !area) return null;

  let rendered = 0;
  let loading = false;
  let loader = area.querySelector('.card-grid-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.className = 'card-grid-loader';
    loader.hidden = true;
    loader.innerHTML = '<span></span><span></span><span></span>';
    area.appendChild(loader);
  }

  function appendBatch() {
    const next = items.slice(rendered, rendered + batchSize);
    grid.insertAdjacentHTML('beforeend', next.map(render).join(''));
    rendered += next.length;
    area.dispatchEvent(new Event('scroll'));
  }

  function loadMore() {
    if (loading || rendered >= items.length) return;
    loading = true;
    loader.hidden = false;
    setTimeout(() => {
      appendBatch();
      loader.hidden = true;
      loading = false;
    }, delay);
  }

  function onScroll() {
    const distance = area.scrollHeight - area.clientHeight - area.scrollTop;
    if (distance < 180) loadMore();
  }

  grid.innerHTML = '';
  appendBatch();
  area.addEventListener('scroll', onScroll, { passive: true });
  return {
    loadMore,
    destroy() { area.removeEventListener('scroll', onScroll); },
    get rendered() { return rendered; }
  };
};

document.addEventListener('DOMContentLoaded', () => {
  normalizeLiveCardTitles();
  let liveTitleTimer = null;
  const liveTitleObserver = new MutationObserver(() => {
    clearTimeout(liveTitleTimer);
    liveTitleTimer = setTimeout(() => normalizeLiveCardTitles(), 60);
  });
  liveTitleObserver.observe(document.body, { childList: true, subtree: true });
});

/* 所有内容作者头像统一进入客态主页。使用捕获阶段，避免同时触发卡片详情。 */
document.addEventListener('click', function(event) {
  var avatar = event.target.closest(
    '.card-title-bar .avatar, .dl-avatar, .cm-avatar, .msg-av, .msg-av-stack, ' +
    '.live-now-card__author .av, .appointment-row > .av, .social-row .av'
  );
  if (!avatar) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  var sourceMask = avatar.closest('.modal-mask[data-profile-restore-type]');
  if (sourceMask) {
    var options = {};
    try {
      options = JSON.parse(sourceMask.dataset.profileRestoreOptions || '{}');
    } catch (error) {
      options = {};
    }
    sessionStorage.setItem('profileSourcePopup', JSON.stringify({
      returnPath: location.pathname + location.search,
      type: sourceMask.dataset.profileRestoreType,
      options: options
    }));
  }
  location.href = 'guest-profile.html';
}, true);
