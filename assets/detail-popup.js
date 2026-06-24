/* ============================================
   家装方案详情大弹窗 detail-popup（重做版）
   API: window.openDetailPopup({
     kind: 'dream' | 'live',
     title, author, cover, desc, created,
     played, stars, likes, commentTotal,
     tag, featured
   })
   ============================================ */
(function () {
  'use strict';

  /* ---------- 切图路径（如缺失会用 SVG fallback） ---------- */
  var IMG = {
    likeCommentOff: 'assets/img/like-comment-off.png',
    likeCommentOn:  'assets/img/like-comment-on.png',
    likeBarOff:     'assets/img/like-bar-off.png',
    likeBarOn:      'assets/img/like-bar-on.png',
    starBarOff:     'assets/img/star-bar-off.png',
    starBarOn:      'assets/img/star-bar-on.png',
    badge:          'assets/img/detail-badge.png',
    btnRefresh:     'assets/img/btn-refresh.png',
    btnDots:        'assets/img/btn-dots.png'
  };

  /* ---------- SVG fallback（图缺失时用） ---------- */
  var SVG_FALLBACK = {
    likeCommentOff: '<svg viewBox="0 0 24 24" fill="none" stroke="#9A7641" stroke-width="2" stroke-linejoin="round"><path d="M7 11V20H4V11H7M7 11L11 3C12.5 3 13 4 13 5V9H18C19 9 20 10 19.5 11L17.5 19C17.2 19.6 16.6 20 16 20H7"/></svg>',
    likeCommentOn:  '<svg viewBox="0 0 24 24" fill="#E97756"><path d="M7 11V20H4V11H7M7 11L11 3C12.5 3 13 4 13 5V9H18C19 9 20 10 19.5 11L17.5 19C17.2 19.6 16.6 20 16 20H7"/></svg>',
    likeBarOff:     '<svg viewBox="0 0 24 24" fill="none" stroke="#B9854C" stroke-width="2" stroke-linejoin="round"><path d="M7 11V20H4V11H7M7 11L11 3C12.5 3 13 4 13 5V9H18C19 9 20 10 19.5 11L17.5 19C17.2 19.6 16.6 20 16 20H7"/></svg>',
    likeBarOn:      '<svg viewBox="0 0 24 24" fill="#E97756"><path d="M7 11V20H4V11H7M7 11L11 3C12.5 3 13 4 13 5V9H18C19 9 20 10 19.5 11L17.5 19C17.2 19.6 16.6 20 16 20H7"/></svg>',
    starBarOff:     '<svg viewBox="0 0 24 24" fill="none" stroke="#B9854C" stroke-width="2" stroke-linejoin="round"><polygon points="12,3 14.5,9 21,9.5 16,14 17.5,21 12,17.5 6.5,21 8,14 3,9.5 9.5,9"/></svg>',
    starBarOn:      '<svg viewBox="0 0 24 24" fill="#FFE600"><polygon points="12,3 14.5,9 21,9.5 16,14 17.5,21 12,17.5 6.5,21 8,14 3,9.5 9.5,9"/></svg>'
  };

  function imgWithFallback(srcKey, w, h) {
    var src = IMG[srcKey];
    var svg = SVG_FALLBACK[srcKey] || '';
    var size = (w && h) ? (' style="width:' + w + 'px;height:' + h + 'px"') : '';
    // 用 onerror 把 img 替换为 SVG span
    return '<img src="' + src + '" alt=""' + size +
      ' onerror="this.outerHTML=' + "'<span class=&quot;svg-fb&quot;" +
      (size ? ' style=&quot;display:inline-block;width:' + w + 'px;height:' + h + 'px&quot;' : '') +
      '>' + svg.replace(/"/g, '&quot;') + "'" + '">';
  }

  /* ---------- 通用 Toast（与社交页 showPageToast 同节奏/样式） ---------- */
  function showDetailToast(message) {
    var old = document.body.querySelector('.detail-toast');
    if (old) old.remove();
    var toast = document.createElement('div');
    toast.className = 'detail-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () { toast.classList.add('is-show'); }, 0);
    setTimeout(function () {
      toast.classList.remove('is-show');
      setTimeout(function () { toast.remove(); }, 180);
    }, 1600);
  }

  /* ---------- 评论 mock 数据 ---------- */
  var COMMENTS = [
    { name: 'DripDrip', text: 'Player comment, two lines. Highly recommended, super fun!', time: '2h ago', likes: 999, authorLiked: true, replyCount: 33 },
    { name: 'DripDrip', text: 'Player comment, two lines. Highly recommended, super fun! So good!', time: '2h ago', likes: 188 },
    { name: 'DripDrip', text: 'Player comment, two lines.', time: '3h ago', likes: 56 },
    { name: 'DripDrip', text: 'Player comment, two lines. Highly recommended, super fun!', time: '5h ago', likes: 8 },
    { name: 'DripDrip', text: 'Player comment, two lines.', time: 'Yesterday', likes: 3 }
  ];
  var REPLIES = Array.from({ length: 33 }, function (_, index) {
    return {
      name: 'DripDrip',
      text: 'Reply DripDrip: ' + (index % 2 ? 'Reply content, two lines.' : 'Thanks for sharing, this design is really interesting!'),
      time: index < 2 ? '2h ago' : (index < 8 ? '4h ago' : 'Yesterday'),
      likes: Math.max(0, 99 - index * 3),
      isReply: true
    };
  });

  /* ---------- 渲染评论项 ---------- */
  function renderComment(c, idx, hideReplyCount) {
    var prefix = c.isReply
      ? '<span class="cm-reply-prefix">Reply ' + c.name + ': </span>'
      : '';
    var text = c.isReply
      ? '<div class="cm-text">' + prefix + c.text.replace(/^Reply\s\S+: /, '') + '</div>'
      : '<div class="cm-text">' + c.text + '</div>';

    return [
      '<div class="cm-item" data-i="', idx, '">',
        '<div class="cm-avatar"></div>',
        '<div class="cm-body">',
          '<div class="cm-name">', c.name, '</div>',
          '<button class="cm-dots" data-act="cm-dots" data-i="', idx, '">···</button>',
          text,
          c.authorLiked ? '<span class="cm-author-liked">Author liked</span>' : '',
          '<div class="cm-meta">',
            '<span class="cm-time">', c.time, '</span>',
            '<button class="cm-reply-btn">Reply</button>',
            '<span class="cm-like-wrap">',
              '<button class="cm-like" data-on="0" data-act="cm-like">',
                imgWithFallback('likeCommentOff', 22, 22),
              '</button>',
              '<span class="cm-like-num">', c.likes, '</span>',
            '</span>',
          '</div>',
          (!hideReplyCount && c.replyCount ? '<button class="cm-reply99" data-act="open-replies" data-count="' + c.replyCount + '">' + c.replyCount + ' replies</button>' : ''),
        '</div>',
      '</div>'
    ].join('');
  }

  /* ---------- 渲染评论列表 ---------- */
  function renderList(comments) {
    return comments.map(function (comment, index) {
      return renderComment(comment, index, false);
    }).join('');
  }

  /* ---------- 主入口 ---------- */
  window.openDetailPopup = function (opts) {
    opts = opts || {};
    var title       = opts.title       || 'Dream Title 12 Chars Max';
    var author      = opts.author      || 'PlayerName123';
    var cover       = opts.cover       || 'assets/img/card-cover-dream.png';
    var desc        = opts.desc        || 'Dream world intro, two lines. Experience stunning visuals in ultra quality~';
    var created     = opts.created     || '2026-02-09';
    var played      = opts.played      || '9999';
    var stars       = opts.stars       || '9999';
    var likes       = opts.likes       || '9999';
    var commentTotal= opts.commentTotal|| 33;
    var tag         = opts.tag         || 'Play Tag';
    var featured    = opts.featured !== false;
    var ownContent  = opts.ownContent === true;
    var visibility  = opts.visibility || '';
    var visibilityLabels = { public: 'Public', friend: 'Friends Only', self: 'Private' };
    var privacyTag = visibilityLabels[visibility]
      ? '<span class="detail-privacy-tag ' + visibility + '">' + visibilityLabels[visibility] + '</span>'
      : '';

    // 移除已存在的弹窗
    var oldMask = document.querySelector('.modal-mask.detail-mask');
    if (oldMask) oldMask.remove();

    var mask = document.createElement('div');
    mask.className = 'modal-mask mask-60 detail-mask';
    mask.dataset.ownerActions = ownContent ? '1' : '0';
    mask.dataset.profileRestoreType = 'dream';
    mask.dataset.profileRestoreOptions = JSON.stringify({
      title: title,
      author: author,
      cover: cover,
      desc: desc,
      created: created,
      played: played,
      stars: stars,
      likes: likes,
      commentTotal: commentTotal,
      tag: tag,
      featured: featured,
      ownContent: ownContent,
      visibility: visibility
    });

    mask.innerHTML = [
      '<div class="detail-popup" role="dialog" aria-modal="true">',
        '<div class="detail-corner-btns">',
          '<button class="dc-btn dc-img dc-refresh" title="Refresh" data-act="refresh">',
            '<img src="', IMG.btnRefresh, '" alt="" onerror="this.parentNode.classList.add(\'fb\'); this.outerHTML=\'<svg viewBox=&quot;0 0 24 24&quot; fill=&quot;none&quot; stroke=&quot;#fff&quot; stroke-width=&quot;2.4&quot; stroke-linecap=&quot;round&quot;><path d=&quot;M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4&quot;/></svg>\'">',
          '</button>',
          '<button class="dc-btn dc-img dc-dots" title="More" data-act="corner-dots">',
            '<img src="', IMG.btnDots, '" alt="" onerror="this.parentNode.classList.add(\'fb\'); this.outerHTML=\'<svg viewBox=&quot;0 0 24 24&quot; fill=&quot;#fff&quot;><circle cx=&quot;6&quot; cy=&quot;12&quot; r=&quot;2&quot;/><circle cx=&quot;12&quot; cy=&quot;12&quot; r=&quot;2&quot;/><circle cx=&quot;18&quot; cy=&quot;12&quot; r=&quot;2&quot;/></svg>\'">',
          '</button>',
          '<button class="dc-btn dc-close" title="Close" data-act="close">',
            '<img src="assets/img/btn-close.png" alt="">',
          '</button>',
        '</div>',

        '<div class="detail-title"><span>', title, '</span>', privacyTag, '</div>',

        '<div class="detail-body">',
          // 左侧
          '<div class="detail-left">',
            '<div class="dl-card">',
              '<div class="dl-cover" style="background-image:url(\'', cover, '\')">',
                '<span class="dl-tag-left">', tag, '</span>',
                featured ? '<span class="dl-tag-featured">Featured</span>' : '',
              '</div>',
              '<div class="dl-author-row">',
                '<div class="dl-avatar"></div>',
                '<div class="dl-author-info">',
                  '<div class="dl-author-name">', author, '</div>',
                  '<div class="dl-author-time">Created: ', created, '</div>',
                '</div>',
                ownContent ? '' : '<button class="dl-follow" data-act="follow">Follow</button>',
              '</div>',
            '</div>',
            '<div class="dl-desc">', desc, '</div>',
          '</div>',

          // 右侧
          '<div class="detail-right">',
            // 列表视图
            '<div class="dr-view dr-list-view">',
              '<div class="dr-total"><b>', commentTotal, '</b> comments</div>',
              '<div class="dr-list">', renderList(COMMENTS), '</div>',
            '</div>',
            // 详情视图
            '<div class="dr-view dr-detail-view" hidden>',
              '<div class="dr-detail-head">',
                '<button class="dr-back" data-act="back-list">Comment Thread</button>',
              '</div>',
              '<div class="dr-detail-body">',
                renderComment(COMMENTS[0], 0, true),
                '<div class="dr-reply-sep" data-count="33">Total 33 replies</div>',
                renderList(REPLIES),
              '</div>',
            '</div>',
            // 输入框
            '<div class="dr-input-bar">',
              '<div class="dr-input-avatar"></div>',
              '<div class="dr-input-wrap">',
                '<input class="dr-input" type="text" maxlength="40" placeholder="Share your thoughts~" />',
                '<span class="dr-input-count" hidden>0/70</span>',
              '</div>',
            '</div>',
          '</div>',
        '</div>',

        // 底栏
        '<div class="detail-bottom">',
          '<div class="db-badge"><img src="', IMG.badge, '" alt="" onerror="this.style.display=\'none\'"></div>',
          '<div class="db-stats">',
            '<span class="db-stat">',
              '<span class="db-stat-label">Played</span>',
              '<span class="db-stat-num-row"><span class="db-stat-num">', played, '</span></span>',
            '</span>',
            '<button class="db-act" data-on="0" data-act="db-star" title="Favorite">',
              '<span class="db-stat-label">', imgWithFallback('starBarOff', 14, 14), 'Favorite</span>',
              '<span class="db-stat-num">', stars, '</span>',
            '</button>',
            '<button class="db-act" data-on="0" data-act="db-like" title="Like">',
              '<span class="db-stat-label">', imgWithFallback('likeBarOff', 14, 14), 'Like</span>',
              '<span class="db-stat-num">', likes, '</span>',
            '</button>',
          '</div>',
          '<div class="db-actions">',
            '<button class="btn-pill btn-create-blue" data-act="create">Create</button>',
            '<button class="btn-pill btn-enter-green" data-act="enter">Enter</button>',
          '</div>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(mask);
    bindEvents(mask);
    setupDetailScrollbar(mask);
    if (Number.isInteger(opts.focusCommentIndex)) {
      focusComment(mask, opts.focusCommentIndex);
      if (opts.autoReply) {
        setTimeout(function () {
          var item = mask.querySelector('.dr-list .cm-item[data-i="' + opts.focusCommentIndex + '"]');
          item?.querySelector('.cm-reply-btn')?.click();
          setTimeout(function () {
            focusComment(mask, opts.focusCommentIndex, false);
          }, 80);
        }, 180);
      }
    }

    // ESC 关闭
    var onEsc = function (e) {
      if (e.key === 'Escape') { closePopup(mask); document.removeEventListener('keydown', onEsc); }
    };
    document.addEventListener('keydown', onEsc);
  };

  function focusComment(mask, index, animateHighlight) {
    requestAnimationFrame(function () {
      var scroller = mask.querySelector('.dr-list');
      var item = scroller && scroller.querySelector('.cm-item[data-i="' + index + '"]');
      if (!scroller || !item) return;
      requestAnimationFrame(function () {
        var scrollerRect = window.layoutRect(scroller);
        var itemRect = window.layoutRect(item);
        scroller.scrollTop = Math.max(0, scroller.scrollTop + itemRect.top - scrollerRect.top);
        if (animateHighlight === false) return;
        item.classList.remove('cm-item-focus');
        void item.offsetWidth;
        item.classList.add('cm-item-focus');
        setTimeout(function () {
          item.classList.remove('cm-item-focus');
        }, 3000);
      });
    });
  }

  window.openLivePopup = function (opts) {
    opts = opts || {};
    var oldMask = document.querySelector('.modal-mask.live-mask');
    if (oldMask) oldMask.remove();

    var title = opts.title || 'Live Title 12 Chars Max';
    var cover = opts.cover || 'assets/img/card-cover-live.png';
    var tag = opts.tag || 'Play Tag';
    var featured = opts.featured !== false;
    var ownHistory = opts.ownHistory === true;
    var visibility = opts.visibility || '';
    var liveVisibilityLabels = { public: 'Public', friend: 'Fans Only', self: 'Private' };
    var livePrivacyTag = liveVisibilityLabels[visibility]
      ? '<span class="detail-privacy-tag ' + visibility + '">' + liveVisibilityLabels[visibility] + '</span>'
      : '';

    var mask = document.createElement('div');
    mask.className = 'modal-mask mask-60 live-mask';
    mask.dataset.profileRestoreType = 'live';
    mask.dataset.profileRestoreOptions = JSON.stringify({
      title: title,
      cover: cover,
      tag: tag,
      featured: featured,
      ownHistory: ownHistory,
      visibility: visibility
    });
    if (ownHistory) {
      mask.innerHTML = [
        '<div class="detail-popup live-popup live-popup--history" role="dialog" aria-modal="true">',
          '<div class="detail-corner-btns">',
            '<button class="dc-btn dc-img dc-refresh" title="Share" data-act="share-live"><img src="', IMG.btnRefresh, '" alt=""></button>',
            '<button class="dc-btn dc-close" title="Close" data-act="close"><img src="assets/img/btn-close.png" alt=""></button>',
          '</div>',
          '<div class="detail-title live-title"><span>', title, '</span>', livePrivacyTag, '</div>',
          '<div class="history-live-body">',
            '<div class="history-live-left">',
              '<div class="dl-card history-live-card">',
                '<div class="dl-cover history-live-cover" style="background-image:url(&quot;', cover, '&quot;)">',
                  '<span class="dl-tag-left">', tag, '</span>',
                  featured ? '<span class="dl-tag-featured">Featured</span>' : '',
                '</div>',
                '<div class="dl-author-row">',
                  '<div class="dl-avatar"></div>',
                  '<div class="dl-author-info">',
                    '<div class="dl-author-name">PlayerName123</div>',
                    '<div class="dl-author-time">Created: 2026-02-09</div>',
                  '</div>',
                '</div>',
              '</div>',
              '<p class="history-live-desc">About: Two lines. Experience stunning visuals in ultra quality~</p>',
              '<div class="history-live-meta">',
                '<span class="history-live-map">Map Name Here</span>',
                '<span class="history-live-capacity">Capacity: 6</span>',
              '</div>',
            '</div>',
            '<div class="history-live-right">',
              '<div class="history-live-time">',
                '<img src="assets/img/typcn_time.png" alt="">',
                '<div><span>Live Time</span><b>4h 32m</b><em>2026-02-09&nbsp;&nbsp;10:03～14:51</em></div>',
              '</div>',
              '<div class="history-live-stats">',
                historyStat('assets/img/history-participants.png', 'Participants', '67'),
                historyStat('assets/img/history-viewers.png', 'Viewers', '9999'),
                historyStat('assets/img/history-new-fans.png', 'New Fans', '143'),
                historyStat('assets/img/history-subscribers.png', 'Subscribers', '533'),
                historyStat('assets/img/history-likes.png', 'Likes', '8776'),
                historyStat('assets/img/history-comments.png', 'Comments', '244'),
              '</div>',
            '</div>',
          '</div>',
          '<img class="history-live-deco" src="assets/img/deco-owl-flower.png" alt="">',
        '</div>'
      ].join('');
    } else {
    mask.innerHTML = [
      '<div class="detail-popup live-popup" role="dialog" aria-modal="true">',
        '<div class="detail-corner-btns">',
          '<button class="dc-btn dc-img dc-refresh" title="Share" data-act="share-live"><img src="', IMG.btnRefresh, '" alt=""></button>',
          '<button class="dc-btn dc-img dc-dots" title="More" data-act="corner-dots"><img src="', IMG.btnDots, '" alt=""></button>',
          '<button class="dc-btn dc-close" title="Close" data-act="close"><img src="assets/img/btn-close.png" alt=""></button>',
        '</div>',
        '<div class="detail-title live-title">', title, '</div>',
        '<div class="live-body">',
          '<div class="live-left">',
            '<div class="dl-card live-card">',
              '<div class="dl-cover live-cover" style="background-image:url(&quot;', cover, '&quot;)">',
                '<span class="dl-tag-left">', tag, '</span>',
                featured ? '<span class="dl-tag-featured">Featured</span>' : '',
              '</div>',
              '<div class="dl-author-row">',
                '<div class="dl-avatar"></div>',
                '<div class="dl-author-info">',
                  '<div class="dl-author-name">PlayerName123</div>',
                  '<div class="dl-author-time">Created: 2026-02-09</div>',
                '</div>',
                '<button class="dl-follow" data-act="follow">Follow</button>',
              '</div>',
            '</div>',
          '</div>',
          '<div class="live-right">',
            '<div class="live-stats">',
              '<div class="live-stat"><img src="assets/img/typcn_time.png" alt=""><div><span>Live Duration</span><b>4h 32m</b></div></div>',
              '<div class="live-stat"><img src="assets/img/Frame 2119903832.png" alt=""><div><span>Watching</span><b>42,376</b></div></div>',
              '<div class="live-stat"><img src="assets/img/Frame 2119903833.png" alt=""><div><span>Playing</span><b>5/6</b></div></div>',
            '</div>',
            '<div class="live-copy">',
              '<p><b>About:</b> Two lines. Experience stunning visuals in ultra quality~</p>',
              '<p><b>Map:</b> Map Name Here</p>',
              '<p><b>Rules:</b> Rules text goes here repeated for demo layout purposes</p>',
            '</div>',
            '<img class="live-deco" src="assets/img/deco-owl-flower.png" alt="">',
          '</div>',
        '</div>',
        '<div class="live-bottom">',
          '<button class="btn-pill btn-create-blue" data-act="switch-live">Switch</button>',
          '<button class="btn-pill btn-enter-green" data-act="enter">Enter</button>',
        '</div>',
      '</div>'
    ].join('');
    }

    document.body.appendChild(mask);

    var popup = mask.querySelector('.live-popup');
    mask.onclick = function (e) {
      if (e.target === mask) closePopup(mask);
    };
    popup.onclick = function (e) {
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act;
      if (act === 'close') closePopup(mask);
      if (act === 'share-live') showSharePopup(mask, { cover: cover, shareCover: ownHistory ? 'assets/img/history-live-share.png' : '' });
      if (act === 'corner-dots') showCornerTip(popup, btn, ownHistory);
      if (act === 'follow') {
        btn.classList.toggle('is-on');
        var following = btn.classList.contains('is-on');
        btn.textContent = following ? 'Following' : 'Follow';
        showDetailToast(following ? 'Followed' : 'Unfollowed');
      }
    };
  };

  function historyStat(icon, label, value, tone) {
    return [
      '<div class="history-live-stat ', tone || '', '">',
        '<img src="', icon, '" alt="">',
        '<div><span>', label, '</span><b>', value, '</b>',
          '<small>Top <strong>99%</strong> of rooms</small>',
        '</div>',
      '</div>'
    ].join('');
  }

  window.openCreateDreamPopup = function (opts) {
    opts = opts || {};
    var draftCover = opts.cover || '';
    var oldMask = document.querySelector('.modal-mask.create-dream-mask');
    if (oldMask) oldMask.remove();

    var mask = document.createElement('div');
    mask.className = 'modal-mask mask-60 create-dream-mask';
    mask.innerHTML = [
      '<div class="detail-popup create-dream-popup" role="dialog" aria-modal="true">',
        '<button class="create-popup-close" type="button" data-act="close"><img src="assets/img/btn-close.png" alt=""></button>',
        '<div class="create-popup-title"><img src="assets/img/create-dream-title-icon.png" alt="">Create Design</div>',
        '<div class="create-popup-body">',
          '<div class="create-upload">',
            '<div class="create-upload-card', draftCover ? ' has-cover' : '', '"', draftCover ? ' style="background-image:url(\'' + draftCover + '\') !important"' : '', '>',
              draftCover
                ? '<button class="create-reselect-btn" type="button">Change Cover</button>'
                : '<div class="create-plus">+</div><div class="create-upload-text">Upload</div>',
            '</div>',
            '<input class="create-cover-input" type="file" accept="image/*" hidden>',
          '</div>',
          '<div class="create-form-panel">',
            '<label class="create-field create-field-title"><span>Title</span><input class="create-title-input" placeholder="Enter design title"><em>0/12</em></label>',
            '<label class="create-field create-field-textarea"><span>Description</span><div class="create-desc-box"><textarea class="create-desc-input" placeholder="Enter description"></textarea><em>0/40</em></div></label>',
            '<label class="create-field"><span>Play Mode</span><button type="button" class="create-select">Select<i></i></button></label>',
            '<div class="create-field"><span>Select Map</span><div class="create-pills"><button>Desk</button><button>Rainforest</button><button>Window Desk</button></div></div>',
            '<label class="create-field"><span>Max Players</span><button type="button" class="create-select">Select<i></i></button></label>',
            '<div class="create-field"><span>Privacy</span><div class="create-radios"><button class="active">Everyone</button><button>Friends</button><button>Private</button></div></div>',
          '</div>',
        '</div>',
        '<img class="create-deco" src="assets/img/create-popup-deco.png" alt="">',
        '<div class="create-popup-bottom">',
          '<button class="btn-mini btn-red" data-act="close">Cancel</button>',
          '<button class="btn-mini btn-green">Create</button>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(mask);
    mask.onclick = function (e) {
      if (e.target === mask) closePopup(mask);
    };
    mask.querySelectorAll('[data-act="close"]').forEach(function (btn) {
      btn.onclick = function () { closePopup(mask); };
    });
    mask.querySelectorAll('.create-radios button').forEach(function (btn) {
      btn.onclick = function () {
        mask.querySelectorAll('.create-radios button').forEach(function (item) { item.classList.remove('active'); });
        btn.classList.add('active');
      };
    });
    mask.querySelectorAll('.create-pills button').forEach(function (btn) {
      btn.onclick = function () {
        mask.querySelectorAll('.create-pills button').forEach(function (item) { item.classList.remove('active'); });
        btn.classList.add('active');
      };
    });
    var uploadCard = mask.querySelector('.create-upload-card');
    var coverInput = mask.querySelector('.create-cover-input');
    function selectCover() {
      coverInput?.click();
    }
    uploadCard?.addEventListener('click', function (e) {
      if (!draftCover && !e.target.closest('.create-reselect-btn')) selectCover();
    });
    mask.querySelector('.create-reselect-btn')?.addEventListener('click', function (e) {
      e.stopPropagation();
      selectCover();
    });
    coverInput?.addEventListener('change', function () {
      var file = coverInput.files && coverInput.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        draftCover = String(reader.result || '');
        uploadCard.classList.add('has-cover');
        uploadCard.style.setProperty('background-image', 'url("' + draftCover + '")', 'important');
        uploadCard.innerHTML = '<button class="create-reselect-btn" type="button">Change Cover</button>';
        uploadCard.querySelector('.create-reselect-btn').onclick = function (e) {
          e.stopPropagation();
          selectCover();
        };
      };
      reader.readAsDataURL(file);
    });
    mask.querySelectorAll('.create-select').forEach(function (btn) {
      btn.onclick = function () {
        var popup = mask.querySelector('.create-dream-popup');
        var field = btn.closest('.create-field');
        var scroller = popup.querySelector('.create-form-panel');
        var wasOpen = btn.classList.contains('open');
        // 先关闭已有下拉
        mask.querySelectorAll('.create-dropdown').forEach(function (d) { d.remove(); });
        mask.querySelectorAll('.create-select').forEach(function (s) { s.classList.remove('open'); });
        popup.querySelector('.create-select-mask')?.remove();
        if (wasOpen) return;

        var selectMask = document.createElement('div');
        selectMask.className = 'create-select-mask';
        popup.appendChild(selectMask);
        selectMask.onclick = function () {
          dropdown.remove();
          btn.classList.remove('open');
          selectMask.remove();
        };

        btn.classList.add('open');
        var dropdown = document.createElement('div');
        // portal 到弹窗，避免被右侧滚动容器(.create-form-panel)裁切
        dropdown.className = 'create-dropdown create-dropdown--portal';
        var current = btn.dataset.value || '';
        var options = ['Option 1', 'Option 2', 'Option 3'];
        dropdown.innerHTML = options.map(function (label) {
          var active = label === current ? ' class="active"' : '';
          var check = label === current ? '<span>✓</span>' : '';
          return '<button type="button"' + active + '>' + label + check + '</button>';
        }).join('');
        popup.appendChild(dropdown);

        // 菜单始终在选项条下方
        function positionDD() {
          var pr = window.layoutRect(popup);
          var br = window.layoutRect(btn);
          dropdown.style.left = (br.left - pr.left) + 'px';
          dropdown.style.width = br.width + 'px';
          dropdown.style.top = (br.bottom - pr.top + 8) + 'px';
        }
        positionDD();
        // 菜单可覆盖底部按钮，但不超出弹窗下边框；超出则上滑刚好放下
        if (scroller) {
          var pr0 = window.layoutRect(popup);
          var mr0 = window.layoutRect(dropdown);
          var overflow = mr0.bottom - (pr0.bottom - 12);
          if (overflow > 0.5) {
            scroller.scrollTo({ top: scroller.scrollTop + overflow, behavior: 'smooth' });
            setTimeout(positionDD, 220);
          }
          scroller.addEventListener('scroll', function reposition() {
            if (!dropdown.isConnected) { scroller.removeEventListener('scroll', reposition); return; }
            positionDD();
          }, { passive: true });
        }

        dropdown.querySelectorAll('button').forEach(function (item) {
          item.onclick = function (e) {
            e.stopPropagation();
            dropdown.querySelectorAll('button').forEach(function (x) { x.classList.remove('active'); x.querySelector('span')?.remove(); });
            item.classList.add('active');
            var value = item.textContent.replace('✓', '').trim();
            item.innerHTML = value + '<span>✓</span>';
            btn.textContent = value;
            btn.dataset.value = value;
            btn.appendChild(document.createElement('i'));
            btn.classList.remove('open');
            dropdown.remove();
            selectMask.remove();
          };
        });
      };
    });
    var titleInput = mask.querySelector('.create-title-input');
    var titleCount = mask.querySelector('.create-field-title em');
    var descInput = mask.querySelector('.create-desc-input');
    var descCount = mask.querySelector('.create-desc-box em');

    function updateCreateCounts() {
      if (titleInput && titleCount) {
        titleCount.textContent = titleInput.value.length + '/12';
        titleCount.classList.toggle('is-over', titleInput.value.length > 12);
      }
      if (descInput && descCount) {
        descCount.textContent = descInput.value.length + '/40';
        descCount.classList.toggle('is-over', descInput.value.length > 40);
      }
    }

    titleInput?.addEventListener('input', updateCreateCounts);
    descInput?.addEventListener('input', updateCreateCounts);
    updateCreateCounts();

    // 输入框聚焦时：若字段被上/下裁切，自动滚动，连同标题完整显示
    var dreamScroller = mask.querySelector('.create-form-panel');
    function revealDreamField(field) {
      if (!dreamScroller || !field) return;
      var sr = window.layoutRect(dreamScroller), fr = window.layoutRect(field);
      var delta = 0;
      if (fr.bottom > sr.bottom - 24) delta = fr.bottom - (sr.bottom - 24);
      else if (fr.top < sr.top + 22) delta = fr.top - (sr.top + 22);
      if (Math.abs(delta) >= 1) {
        dreamScroller.scrollTo({ top: dreamScroller.scrollTop + delta, behavior: 'smooth' });
      }
    }
    mask.querySelectorAll('.create-form-panel input, .create-form-panel textarea').forEach(function (el) {
      el.addEventListener('focus', function () { revealDreamField(el.closest('.create-field')); });
    });

    // 自定义滚动条滑块（样式/行为与创建直播间一致）
    (function () {
      var scroller = mask.querySelector('.create-form-panel');
      var popupEl = mask.querySelector('.create-dream-popup');
      if (!scroller || !popupEl) return;
      var thumb = document.createElement('span');
      thumb.className = 'create-form-scroll-thumb';
      popupEl.appendChild(thumb);
      var drag = { on: false, startY: 0, startScroll: 0 };
      function track() {
        var pr = window.layoutRect(popupEl), sr = window.layoutRect(scroller);
        return { top: sr.top - pr.top, height: sr.height };
      }
      function update() {
        var scrollMax = scroller.scrollHeight - scroller.clientHeight;
        if (scrollMax <= 1) { thumb.style.display = 'none'; return; }
        thumb.style.display = 'block';
        var pr = window.layoutRect(popupEl), sr = window.layoutRect(scroller);
        // 滑块贴在滚动区右边缘内侧 6px（绝对定位相对弹窗 padding 盒，需补上右内边距）
        thumb.style.right = ((pr.right - sr.right) + 6) + 'px';
        var tm = { top: sr.top - pr.top, height: sr.height };
        var thumbH = Math.max(58, Math.round(tm.height * scroller.clientHeight / scroller.scrollHeight));
        var movable = Math.max(1, tm.height - thumbH);
        thumb.style.height = thumbH + 'px';
        thumb.style.top = (tm.top + Math.round((scroller.scrollTop / scrollMax) * movable)) + 'px';
      }
      scroller.addEventListener('scroll', update);
      thumb.addEventListener('pointerdown', function (e) {
        e.preventDefault(); drag.on = true; drag.startY = e.clientY; drag.startScroll = scroller.scrollTop;
        thumb.setPointerCapture(e.pointerId);
      });
      thumb.addEventListener('pointermove', function (e) {
        if (!drag.on) return;
        var scrollMax = scroller.scrollHeight - scroller.clientHeight;
        var tm = track();
        var thumbH = Math.max(58, Math.round(tm.height * scroller.clientHeight / scroller.scrollHeight));
        var movable = Math.max(1, tm.height - thumbH);
        var z = window.viewportZoom();
        scroller.scrollTop = drag.startScroll + ((e.clientY - drag.startY) / z / movable) * scrollMax;
      });
      thumb.addEventListener('pointerup', function () { drag.on = false; });
      thumb.addEventListener('pointercancel', function () { drag.on = false; });
      requestAnimationFrame(update);
      setTimeout(update, 60);
    })();
  };

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.btn-create-dream');
    if (!btn) return;
    btn.onclick = function (e) {
      e.preventDefault();
      window.openCreateDreamPopup();
    };
    var img = btn.querySelector('img');
    btn.innerHTML = (img ? '<img src="assets/img/el_plus-sign.png" alt=""> ' : '') + 'Create Design';
  });

  function closePopup(mask) {
    mask.style.opacity = '0';
    setTimeout(function () { mask.remove(); }, 180);
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents(mask) {
    var popup = mask.querySelector('.detail-popup');
    var listView   = mask.querySelector('.dr-list-view');
    var detailView = mask.querySelector('.dr-detail-view');
    var activeReplySource = null;
    var inputReplyTarget = null;
    detailView.querySelectorAll('.dr-reply-sep ~ .cm-item').forEach(function (item) {
      item.classList.add('cm-base-reply');
    });

    // 蒙层点击关闭（点空白处）
    mask.addEventListener('click', function (e) {
      if (e.target === mask) closePopup(mask);
    });

    // 委托所有按钮
    popup.addEventListener('click', function (e) {
      var replyBtn = e.target.closest('.cm-reply-btn');
      if (replyBtn) {
        focusInput('reply', replyBtn.closest('.cm-item'));
        return;
      }
      var btn = e.target.closest('[data-act]');
      if (!btn) return;
      var act = btn.dataset.act;

      switch (act) {
        case 'close':
          closePopup(mask);
          break;

        case 'refresh':
          showSharePopup(mask);
          break;

        case 'corner-dots':
          showCornerTip(popup, btn, mask.dataset.ownerActions === '1');
          break;

        case 'cm-dots':
          showCommentTip(popup, btn);
          break;

        case 'follow':
          btn.classList.toggle('is-on');
          var followOn = btn.classList.contains('is-on');
          btn.textContent = followOn ? 'Following' : 'Follow';
          showDetailToast(followOn ? 'Followed' : 'Unfollowed');
          break;

        case 'open-replies':
          activeReplySource = btn.closest('.cm-item');
          var detailBody = detailView.querySelector('.dr-detail-body');
          var detailOriginal = detailBody.querySelector(':scope > .cm-item:first-child');
          var originalClone = activeReplySource.cloneNode(true);
          originalClone.querySelector('.cm-reply99')?.remove();
          originalClone.classList.remove('cm-item-focus');
          detailOriginal.replaceWith(originalClone);
          var openCount = Number(btn.dataset.count || parseInt(btn.textContent, 10) || 0);
          var openSep = detailBody.querySelector('.dr-reply-sep');
          openSep.dataset.count = String(openCount);
          openSep.textContent = 'Total ' + openCount + ' replies';
          var threadId = activeReplySource.dataset.i || '';
          detailBody.querySelectorAll('.cm-base-reply').forEach(function (item) {
            item.style.display = threadId === '0' ? '' : 'none';
          });
          detailBody.querySelectorAll('.cm-item-mine[data-thread]').forEach(function (item) {
            item.style.display = item.dataset.thread === threadId ? '' : 'none';
          });
          collapseInput();
          listView.hidden = true;
          detailView.hidden = false;
          break;

        case 'back-list':
          detailView.hidden = true;
          listView.hidden = false;
          break;

        case 'db-like':
          toggleLikeImg(btn, 'likeBar');
          break;

        case 'db-star':
          toggleLikeImg(btn, 'starBar');
          break;

        case 'cm-like':
          toggleLikeImg(btn, 'likeComment');
          break;

        case 'cancel-input':
          collapseInput();
          break;

        case 'send-comment':
          submitComment();
          break;

        case 'create':
          // 占位：可挂业务
          break;
        case 'enter':
          break;
      }
    });

    // 输入框 40 字限制 + 计数
    var input = popup.querySelector('.dr-input');
    if (input && input.tagName !== 'TEXTAREA') {
      var textarea = document.createElement('textarea');
      textarea.className = input.className;
      textarea.removeAttribute('maxlength');
      textarea.rows = 1;
      textarea.placeholder = 'Share your thoughts~';
      input.replaceWith(textarea);
      input = textarea;
    }
    var wrap  = popup.querySelector('.dr-input-wrap');
    var count = popup.querySelector('.dr-input-count');
    var bar = popup.querySelector('.dr-input-bar');
    var inputThumb = document.createElement('span');
    inputThumb.className = 'input-scroll-thumb';
    wrap.appendChild(inputThumb);
    var actions = document.createElement('div');
    actions.className = 'dr-input-actions';
    actions.hidden = true;
    actions.innerHTML = '<span class="dr-input-count">0/70</span><button class="dr-cancel" type="button" data-act="cancel-input">Cancel</button><button class="dr-send" type="button" data-act="send-comment">Send</button>';
    bar.appendChild(actions);
    if (count) count.remove();
    count = actions.querySelector('.dr-input-count');

    var inputMode = 'comment';

    // Counter: only show past 60 chars, limit 70, turns red past 70
    function updateCount() {
      var len = input.value.length;
      count.textContent = len + '/70';
      count.classList.toggle('is-over', len > 70);
      count.hidden = len <= 60;
    }

    function updateReplyCount(sourceItem, delta) {
      var source = sourceItem && sourceItem.closest('.dr-list') ? sourceItem : activeReplySource;
      if (!source) return 0;
      var button = source.querySelector('.cm-reply99');
      var countValue = button ? Number(button.dataset.count || parseInt(button.textContent, 10) || 0) : 0;
      countValue += delta;
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'cm-reply99';
        button.dataset.act = 'open-replies';
        source.querySelector('.cm-body')?.appendChild(button);
      }
      button.dataset.count = String(countValue);
      button.textContent = countValue + ' replies';
      if (source === activeReplySource || detailView.hidden === false) {
        var sep = detailView.querySelector('.dr-reply-sep');
        sep.dataset.count = String(countValue);
        sep.textContent = 'Total ' + countValue + ' replies';
      }
      return countValue;
    }

    function setInputHeight() {
      input.style.height = 'auto';
      var lineHeight = parseFloat(getComputedStyle(input).lineHeight) || 34;
      var minH = lineHeight + 28;
      var maxH = lineHeight * 4 + 22;
      var h = Math.min(Math.max(input.scrollHeight, minH), maxH);
      input.style.height = h + 'px';
      wrap.style.height = h + 'px';
      input.style.overflowY = input.scrollHeight > maxH ? 'auto' : 'hidden';
      updateInputThumb();
    }

    function updateInputThumb() {
      var total = input.scrollHeight;
      var visible = input.clientHeight;
      if (total <= visible + 1) {
        inputThumb.style.display = 'none';
        return;
      }
      inputThumb.style.display = 'block';
      var trackTop = 14;
      var trackH = Math.max(20, visible - 28);
      var thumbH = Math.max(28, trackH * visible / total);
      var maxScroll = total - visible;
      var top = trackTop + (input.scrollTop / maxScroll) * (trackH - thumbH);
      inputThumb.style.top = top + 'px';
      inputThumb.style.height = thumbH + 'px';
    }

    function expandInput(mode, sourceItem) {
      inputMode = mode || 'comment';
      bar.classList.add('is-expanded');
      wrap.classList.add('is-focus');
      actions.hidden = false;
      if (mode === 'reply' && !input.value) input.placeholder = 'Reply @DripDrip';
      if (mode !== 'reply' && !input.value) input.placeholder = 'Share your thoughts~';
      updateCount();
      setInputHeight();
      setInputHeight();
      input.focus();

      if (sourceItem) {
        setTimeout(function () {
          var scroller = sourceItem.closest('.dr-list, .dr-detail-body');
          if (!scroller) return;
          var sRect = window.layoutRect(scroller);
          var iRect = window.layoutRect(bar);
          var itemRect = window.layoutRect(sourceItem);
          var overlap = itemRect.bottom - iRect.top + 24;
          if (overlap > 0) scroller.scrollTop += overlap;
          if (itemRect.top < sRect.top) scroller.scrollTop -= (sRect.top - itemRect.top + 16);
        }, 0);
      }
    }

    function focusInput(mode, sourceItem) {
      if (bar.classList.contains('is-expanded')) {
        input.value = '';
        updateCount();
      }
      inputReplyTarget = mode === 'reply' ? sourceItem : null;
      expandInput(mode, sourceItem);
      if (mode === 'reply') input.placeholder = 'Reply @DripDrip';
    }

    function collapseInput() {
      input.value = '';
      input.placeholder = 'Share your thoughts~';
      input.style.height = '';
      wrap.style.height = '';
      wrap.classList.remove('is-focus');
      bar.classList.remove('is-expanded');
      actions.hidden = true;
      updateCount();
      inputMode = 'comment';
      inputReplyTarget = null;
      input.blur();
    }

    function submitComment() {
      var text = input.value.trim();
      if (!text) return;
      if (input.value.length > 70) {
        showToast('Over 70 characters~');
        return;
      }

      var scroller = popup.querySelector('.dr-view:not([hidden]) .dr-list, .dr-view:not([hidden]) .dr-detail-body');
      if (!scroller) return;
      var isDetailThread = scroller.classList.contains('dr-detail-body');
      var detailOriginal = isDetailThread ? scroller.querySelector(':scope > .cm-item:first-child') : null;
      var replyingToNestedReply = isDetailThread
        && inputMode === 'reply'
        && inputReplyTarget
        && inputReplyTarget !== detailOriginal;

      var item = document.createElement('div');
      item.className = 'cm-item cm-item-mine';
      var prefix = replyingToNestedReply ? '<span class="cm-reply-prefix">Reply to DripDrip: </span>' : '';
      item.innerHTML = [
        '<div class="cm-avatar"></div>',
        '<div class="cm-body">',
          '<div class="cm-name">Me</div>',
          '<button class="cm-dots" data-act="cm-dots">...</button>',
          '<div class="cm-text">', prefix, escapeHtml(text), '</div>',
          '<div class="cm-meta">',
            '<span class="cm-time">Just now</span>',
            '<button class="cm-reply-btn">Reply</button>',
            '<span class="cm-like-wrap">',
              '<button class="cm-like" data-on="0" data-act="cm-like">',
                imgWithFallback('likeCommentOff', 22, 22),
              '</button>',
              '<span class="cm-like-num">0</span>',
            '</span>',
          '</div>',
        '</div>'
      ].join('');

      if (inputMode === 'reply' && inputReplyTarget && inputReplyTarget.closest('.dr-list')) {
        var repliedItem = inputReplyTarget;
        var threadId = repliedItem.dataset.i || '';
        updateReplyCount(repliedItem, 1);
        item.dataset.thread = threadId;
        var detailBody = detailView.querySelector('.dr-detail-body');
        var detailSep = detailBody.querySelector('.dr-reply-sep');
        detailBody.insertBefore(item, detailSep.nextSibling);
        item.style.display = 'none';
        collapseInput();
        showToast('Reply posted');
        setTimeout(function () {
          scroller.scrollTop = Math.max(0, repliedItem.offsetTop - 18);
        }, 0);
        return;
      }

      var replySep = scroller.querySelector('.dr-reply-sep');
      if (replySep) {
        updateReplyCount(activeReplySource, 1);
        item.dataset.thread = activeReplySource?.dataset.i || '';
        scroller.insertBefore(item, replySep.nextSibling);
      } else {
        scroller.insertBefore(item, scroller.firstChild);
      }
      collapseInput();
      showToast(replySep ? 'Reply posted' : 'Comment posted');
      setTimeout(function () {
        if (replySep) {
          scroller.scrollTop = Math.max(0, replySep.offsetTop - 12);
        } else {
          scroller.scrollTop = 0;
        }
      }, 0);
    }

    function showToast(message) {
      var old = document.body.querySelector('.detail-toast');
      if (old) old.remove();
      var toast = document.createElement('div');
      toast.className = 'detail-toast';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(function () { toast.classList.add('is-show'); }, 0);
      setTimeout(function () {
        toast.classList.remove('is-show');
        setTimeout(function () { toast.remove(); }, 180);
      }, 1600);
    }

    function escapeHtml(str) {
      return str.replace(/[&<>"']/g, function (s) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
      });
    }

    input.addEventListener('focus', function () {
      if (!bar.classList.contains('is-expanded')) {
        expandInput(inputMode, inputReplyTarget);
      }
      wrap.classList.add('is-focus');
      updateCount();
    });
    input.addEventListener('blur', function () {
      wrap.classList.remove('is-focus');
      updateCount();
    });
    input.addEventListener('input', function () {
      // Allow over-70 input; the counter turns red instead of truncating.
      updateCount();
      setInputHeight();
    });
    input.addEventListener('scroll', updateInputThumb);

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && input.value.trim()) {
        e.preventDefault();
        submitComment();
      }
    });
  }

  /* ---------- tooltip：右上三个点 ---------- */
  function showCornerTip(popup, btn) {
    // 已存在则关闭
    var existing = popup.querySelector('.tip-mask');
    if (existing) { existing.remove(); popup.querySelector('.corner-tip')?.remove(); return; }

    var tipMask = document.createElement('div');
    tipMask.className = 'tip-mask';

    var tip = document.createElement('div');
    tip.className = 'corner-tip';
    tip.textContent = 'Report';

    // 位置：定位到 btn 下方
    var pRect = window.layoutRect(popup);
    var bRect = window.layoutRect(btn);
    tip.style.top = (bRect.bottom - pRect.top + 16) + 'px';
    tip.style.right = (pRect.right - bRect.right + 4) + 'px';
    // 翻转：尖角朝上指向按钮
    tip.style.setProperty('--ignored', '0');

    popup.appendChild(tipMask);
    popup.appendChild(tip);

    var close = function () {
      tipMask.remove();
      tip.remove();
    };
    tipMask.addEventListener('click', close);
    tip.addEventListener('click', close);
  }

  /* ---------- tooltip：评论里的三个点 ---------- */
  function showCommentTip(popup, btn) {
    var existing = popup.querySelector('.tip-mask');
    if (existing) { existing.remove(); popup.querySelector('.comment-tip')?.remove(); return; }

    var tipMask = document.createElement('div');
    tipMask.className = 'tip-mask';

    var tip = document.createElement('div');
    tip.className = 'comment-tip';
    tip.textContent = 'Report Comment';

    var pRect = window.layoutRect(popup);
    var bRect = window.layoutRect(btn);
    // 气泡放在三点的左上方
    tip.style.top  = (bRect.top - pRect.top - 56) + 'px';
    tip.style.left = (bRect.left - pRect.left - 130) + 'px';

    popup.appendChild(tipMask);
    popup.appendChild(tip);

    var close = function () { tipMask.remove(); tip.remove(); };
    tipMask.addEventListener('click', close);
    tip.addEventListener('click', close);
  }

  /* ---------- 点赞/收藏图片切换（img + 备份 SVG） ---------- */
  function toggleLikeImg(btn, kind) {
    var on = btn.dataset.on === '1';
    btn.dataset.on = on ? '0' : '1';

    var img = btn.querySelector('img');
    var span = btn.querySelector('.svg-fb');
    var srcKey = kind + (on ? 'Off' : 'On');

    if (img) {
      img.src = IMG[srcKey];
    } else if (span) {
      span.innerHTML = SVG_FALLBACK[srcKey];
    }

    // 同时把数字 +1/-1
    var likeWrap = btn.closest('.cm-like-wrap');
    var num = (likeWrap && likeWrap.querySelector('.cm-like-num')) || btn.querySelector('.db-stat-num');
    if (num) {
      var n = parseInt(num.textContent, 10) || 0;
      num.textContent = on ? (n - 1) : (n + 1);
    }
    // 数字颜色按状态切换（评论区Likes字默认褐色，激活后橙色）
    if (num && num.classList.contains('cm-like-num')) {
      num.style.color = on ? '' : 'var(--c-accent-red)';
    }
  }

  /* ---------- 卡片点击事件委托：仅家装方案（dream）打开弹窗 ----------
     直播间卡片暂不实现详情弹窗，点击直接忽略。 */
  document.addEventListener('click', function (e) {
    var card = e.target.closest('.card');
    if (!card) return;
    // 排除：删除按钮、tab、按钮区
    if (e.target.closest('button')) return;
    if (e.target.closest('.card-trash')) return;

    // 判断 dream / live：封面图文件名包含 card-cover-live 视为直播间
    var cover = card.querySelector('.card-cover');
    var coverImg = '';
    if (cover) {
      var bg = cover.style.backgroundImage || '';
      var m = bg.match(/url\(["']?([^"')]+)["']?\)/);
      if (m) coverImg = m[1];
    }
    if (card.classList.contains('card-draft')) {
      window.openCreateDreamPopup({
        cover: coverImg || 'assets/img/card-cover-dream.png'
      });
      return;
    }
    var title = (card.querySelector('.card-title, .card-title-bar .title, .title') || {}).textContent || 'Dream Title 12 Chars Max';
    var tag   = (card.querySelector('.card-tag-left') || {}).textContent || 'Play Tag';
    var featured = !!card.querySelector('.card-tag-featured');
    var ownContent = card.dataset.ownContent === 'true';
    var visibility = card.dataset.visibility || '';
    var isLive = /card-cover-live/.test(coverImg);
    if (isLive) {
      window.openLivePopup({
        title: 'Live Title 12 Chars Max',
        cover: coverImg || 'assets/img/card-cover-live.png',
        tag: tag.trim(),
        featured: featured
      });
      return;
    }
    if (isLive) return;                       // 直播间卡片不开此弹窗

    window.openDetailPopup({
      kind: 'dream',
      title: title.trim(),
      cover: coverImg || 'assets/img/card-cover-dream.png',
      tag: tag.trim(),
      featured: featured,
      ownContent: ownContent,
      visibility: visibility
    });
  });

  function showSharePopup(parentMask, opts) {
    var old = document.querySelector('.share-mask');
    if (old) old.remove();

    opts = opts || {};
    var cover = opts.shareCover || opts.cover || 'assets/img/Group 2119903810.png';
    var channels = [
      { label: 'Download', icon: 'assets/img/icon.png' },
      { label: 'ShareCode', icon: 'assets/img/icon-1.png' },
      { label: 'Facebook', icon: 'assets/img/Group 2119903741.png' },
      { label: 'WhatsApp', icon: 'assets/img/Group 2119903741-1.png' },
      { label: 'Instagram', icon: 'assets/img/Group 2119903741-2.png' },
      { label: 'X', icon: 'assets/img/Group 2119903742.png' },
      { label: 'Discord', icon: 'assets/img/Group 2119903743.png' }
    ];

    var mask = document.createElement('div');
    mask.className = 'share-mask';
    mask.innerHTML = [
      '<div class="share-panel" role="dialog" aria-modal="true">',
        '<button class="share-close" type="button" aria-label="Close"><img src="assets/img/btn_close_2k 3.png" alt=""></button>',
        '<div class="share-title">Share</div>',
        '<div class="share-card" style="background-image:url(&quot;', cover, '&quot;)"></div>',
        '<div class="share-channels">',
          channels.map(function (it) {
            return '<button class="share-channel" type="button"><img src="' + it.icon + '" alt=""><span>' + it.label + '</span></button>';
          }).join(''),
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(mask);
    mask.querySelector('.share-close').onclick = function () { mask.remove(); };
    mask.onclick = function (e) {
      if (e.target === mask) mask.remove();
    };
  }

  function showCornerTip(popup, btn, showOwnerActions) {
    var existing = popup.querySelector('.tip-mask');
    if (existing) { existing.remove(); popup.querySelector('.corner-tip')?.remove(); return; }

    var tipMask = document.createElement('div');
    tipMask.className = 'tip-mask';

    var tip = document.createElement('div');
    tip.className = 'corner-tip';
    tip.classList.toggle('corner-tip--report', !showOwnerActions);
    tip.innerHTML = showOwnerActions
      ? '<button type="button">Delete</button><button type="button">Edit</button>'
      : '<button type="button">Report</button>';

    var pRect = window.layoutRect(popup);
    var bRect = window.layoutRect(btn);
    popup.appendChild(tipMask);
    popup.appendChild(tip);
    var top = bRect.bottom - pRect.top + 12;
    var buttonCenter = bRect.left - pRect.left + bRect.width / 2;
    var tipWidth = tip.offsetWidth || (showOwnerActions ? 300 : 176);
    var left = Math.max(22, Math.min(pRect.width - tipWidth - 22, buttonCenter - tipWidth / 2));
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
    tip.style.setProperty('--tip-arrow-left', (buttonCenter - left) + 'px');

    var close = function () {
      tipMask.remove();
      tip.remove();
    };
    tipMask.addEventListener('click', close);
    tip.addEventListener('click', close);
  }

  function setupDetailScrollbar(mask) {
    var popup = mask.querySelector('.detail-popup');
    var right = mask.querySelector('.detail-right');
    if (!popup || !right) return;

    var thumb = document.createElement('div');
    thumb.className = 'detail-scroll-thumb';
    right.appendChild(thumb);

    function getScroller() {
      return mask.querySelector('.dr-view:not([hidden]) .dr-list, .dr-view:not([hidden]) .dr-detail-body');
    }

    function update() {
      var scroller = getScroller();
      if (!scroller) {
        thumb.style.display = 'none';
        return;
      }

      var visible = scroller.clientHeight;
      var total = scroller.scrollHeight;
      if (total <= visible) {
        thumb.style.display = 'none';
        return;
      }

      thumb.style.display = 'block';
      var trackTop = scroller.offsetTop;
      var trackH = scroller.clientHeight;
      var thumbH = Math.max(80, trackH * visible / total);
      var maxTop = trackH - thumbH;
      var maxScroll = total - visible;
      var top = trackTop + (scroller.scrollTop / maxScroll) * maxTop;

      thumb.style.top = top + 'px';
      thumb.style.height = thumbH + 'px';
    }

    right.addEventListener('scroll', update, true);
    popup.addEventListener('click', function () {
      setTimeout(update, 0);
      setTimeout(update, 80);
    });
    window.addEventListener('resize', update);
    setTimeout(update, 0);
    setTimeout(update, 120);
  }

  function showCommentTip(popup, btn) {
    var existing = popup.querySelector('.tip-mask');
    if (existing) { existing.remove(); popup.querySelector('.comment-tip')?.remove(); return; }

    var tipMask = document.createElement('div');
    tipMask.className = 'tip-mask';

    var tip = document.createElement('div');
    tip.className = 'comment-tip';
    tip.innerHTML = '<span>Delete</span><span>Report</span>';

    var pRect = window.layoutRect(popup);
    var bRect = window.layoutRect(btn);
    tip.style.top = (bRect.top - pRect.top - 48) + 'px';
    tip.style.left = (bRect.left - pRect.left - 320) + 'px';

    popup.appendChild(tipMask);
    popup.appendChild(tip);

    var close = function () {
      tipMask.remove();
      tip.remove();
    };
    tipMask.addEventListener('click', close);
    tip.addEventListener('click', close);
  }

  document.addEventListener('click', function (e) {
    var card = e.target.closest('.card');
    if (!card || e.target.closest('button')) return;

    var cover = card.querySelector('.card-cover');
    if (!cover) return;

    var bg = cover.style.backgroundImage || '';
    var m = bg.match(/url\(["']?([^"')]+)["']?\)/);
    var coverImg = m ? m[1] : '';
    if (!/card-cover-live/.test(coverImg)) return;

    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

    var titleEl = card.querySelector('.card-title, .card-title-bar .title, .title');
    var tagEl = card.querySelector('.card-tag-left');
    window.openLivePopup({
      title: (titleEl && titleEl.textContent.trim()) || 'Live Title 12 Chars Max',
      cover: coverImg || 'assets/img/card-cover-live.png',
      tag: (tagEl && tagEl.textContent.trim()) || 'Play Tag',
      featured: !!card.querySelector('.card-tag-featured'),
      ownHistory: card.dataset.ownLive === 'true',
      visibility: card.dataset.visibility || ''
    });
  }, true);

})();

/* 从客态主页返回后，恢复进入前打开的家装方案或直播间详情。 */
(function () {
  function restoreProfileSourcePopup() {
    var raw = sessionStorage.getItem('profileSourcePopup');
    if (!raw) return;

    var state;
    try {
      state = JSON.parse(raw);
    } catch (error) {
      sessionStorage.removeItem('profileSourcePopup');
      return;
    }

    if (!state || state.returnPath !== location.pathname + location.search) return;
    if (document.querySelector('.modal-mask.detail-mask, .modal-mask.live-mask')) {
      sessionStorage.removeItem('profileSourcePopup');
      return;
    }

    sessionStorage.removeItem('profileSourcePopup');
    setTimeout(function () {
      if (state.type === 'live' && window.openLivePopup) {
        window.openLivePopup(state.options || {});
      } else if (state.type === 'dream' && window.openDetailPopup) {
        window.openDetailPopup(state.options || {});
      }
    }, 0);
  }

  window.addEventListener('pageshow', restoreProfileSourcePopup);
})();
(function enhanceCreateDescScroll() {
  function setup(box) {
    if (!box || box.dataset.createScrollReady === '1') return;
    const textarea = box.querySelector('textarea');
    if (!textarea) return;
    box.dataset.createScrollReady = '1';

    function applyNormalPlusOneLineHeight() {
      const style = getComputedStyle(textarea);
      const probe = document.createElement('textarea');
      probe.value = '测\n测';
      probe.style.position = 'absolute';
      probe.style.left = '-9999px';
      probe.style.top = '-9999px';
      probe.style.visibility = 'hidden';
      probe.style.width = '1000px';
      probe.style.height = 'auto';
      probe.style.padding = '0';
      probe.style.border = '0';
      probe.style.overflow = 'hidden';
      probe.style.fontFamily = style.fontFamily;
      probe.style.fontSize = style.fontSize;
      probe.style.fontWeight = style.fontWeight;
      probe.style.fontStyle = style.fontStyle;
      probe.style.letterSpacing = style.letterSpacing;
      probe.style.lineHeight = 'normal';
      document.body.appendChild(probe);
      const twoLineHeight = probe.scrollHeight;
      probe.value = '测';
      const oneLineHeight = probe.scrollHeight;
      probe.remove();
      const normalLineHeight = Math.max(oneLineHeight, twoLineHeight - oneLineHeight);
      if (normalLineHeight > 0) {
        textarea.style.setProperty('line-height', `${normalLineHeight + 1}px`, 'important');
      }
    }

    textarea.style.removeProperty('line-height');

    const thumb = document.createElement('span');
    thumb.className = 'create-desc-scroll-thumb';
    box.appendChild(thumb);

    const state = { dragging: false, startY: 0, startScroll: 0 };
    const trackTop = 20;
    const trackBottom = 48;

    function updateThumb() {
      const scrollMax = textarea.scrollHeight - textarea.clientHeight;
      const trackHeight = Math.max(44, box.clientHeight - trackTop - trackBottom);
      if (scrollMax <= 1) {
        thumb.style.opacity = '0';
        thumb.style.height = '0px';
        return;
      }
      const thumbHeight = Math.max(44, Math.round(trackHeight * textarea.clientHeight / textarea.scrollHeight));
      const movable = Math.max(1, trackHeight - thumbHeight);
      const top = trackTop + Math.round((textarea.scrollTop / scrollMax) * movable);
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateY(${top}px)`;
      thumb.style.opacity = '.95';
    }

    textarea.addEventListener('scroll', updateThumb);
    function keepCaretLineVisible() {
      const maxScrollTop = Math.max(0, textarea.scrollHeight - textarea.clientHeight);
      textarea.scrollTop = maxScrollTop;
    }

    textarea.addEventListener('input', () => requestAnimationFrame(() => {
      if (textarea === document.activeElement) {
        keepCaretLineVisible();
        setTimeout(keepCaretLineVisible, 0);
      }
      updateThumb();
    }));
    thumb.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      state.dragging = true;
      state.startY = event.clientY;
      state.startScroll = textarea.scrollTop;
      thumb.setPointerCapture(event.pointerId);
    });
    thumb.addEventListener('pointermove', (event) => {
      if (!state.dragging) return;
      const scrollMax = textarea.scrollHeight - textarea.clientHeight;
      const trackHeight = Math.max(44, box.clientHeight - trackTop - trackBottom);
      const thumbHeight = Math.max(44, Math.round(trackHeight * textarea.clientHeight / textarea.scrollHeight));
      const movable = Math.max(1, trackHeight - thumbHeight);
      textarea.scrollTop = state.startScroll + ((event.clientY - state.startY) / movable) * scrollMax;
    });
    thumb.addEventListener('pointerup', () => {
      state.dragging = false;
    });
    thumb.addEventListener('pointercancel', () => {
      state.dragging = false;
    });

    requestAnimationFrame(updateThumb);
  }

  function scan(root = document) {
    root.querySelectorAll('.create-desc-box').forEach(setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => scan());
  } else {
    scan();
  }
  new MutationObserver(() => scan()).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();

