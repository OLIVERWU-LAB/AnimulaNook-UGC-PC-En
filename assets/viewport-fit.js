/* ============================================
   视口自适应缩放
   --------------------------------------------
   整套 UI 是按 1920×1080 固定画布、固定 px 绘制的。
   桌面浏览器会忽略 <meta viewport width=1920>，布局视口 = 实际窗口宽度，
   于是窗口窄于 1920 时（如 MacBook 默认分辨率）组件过大、布局挤压。

   方案：把整块画布按「窗口宽 / 1920」等比缩放（等价于自动浏览器缩放）。
   - 上限内：等比缩小，刚好铺满窗口宽度，布局与 1920 下完全一致。
   - 用 CSS `zoom` 而非 transform：会参与回流，position:fixed 的 .app 与
     动态追加到 body 的弹窗都会一并缩放，无需补偿宽高或居中。

   缩放上限按平台区分：
   - Windows / 大屏：上限 1.0 —— 窗口 ≥1920 保持 1:1，4K 显示效果不变。
   - macOS（多为 Retina 笔记本，逻辑分辨率偏小，如 16" 默认 1728 宽）：
     按宽度铺满会显得偏大，上限设为 0.8 —— 等价于浏览器 80% 的观感
     （.app 内部获得更多逻辑宽度，组件相对更小、更通透）。
   ============================================ */
(function () {
  var DESIGN_WIDTH = 1920;
  var MIN_ZOOM = 0.4;            // 极窄窗口下的下限，避免缩到不可用

  // Mac（含 Apple Silicon，navigator.platform 仍报 "MacIntel"）检测
  var isMac = /Mac/i.test(navigator.platform || '') ||
              /Mac OS X/i.test(navigator.userAgent || '');
  var MAX_ZOOM = isMac ? 0.8 : 1;

  function applyZoom() {
    var z = window.innerWidth / DESIGN_WIDTH;
    if (z > MAX_ZOOM) z = MAX_ZOOM;   // 上限：Mac 0.8 / 其他 1.0
    if (z < MIN_ZOOM) z = MIN_ZOOM;
    document.documentElement.style.zoom = String(z);
  }

  applyZoom();                   // 在 <head> 内同步执行，首帧前即生效，避免闪烁

  var raf = 0;
  window.addEventListener('resize', function () {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(applyZoom);
  });

  /* ----------------------------------------------------------------
     供 JS 定位逻辑使用的工具：
     getBoundingClientRect() 返回的是经 html zoom 缩放后的「视觉像素」，
     而写回 style.left/top/width（及 scrollTop）按「布局像素」解释。
     在 zoom≠1 时二者不一致会导致下拉/气泡定位偏移（Mac 上尤为明显）。
     layoutRect() 把视觉像素换算回布局像素，定位算式与常量即可保持不变。
     ---------------------------------------------------------------- */
  window.viewportZoom = function () {
    var z = parseFloat(getComputedStyle(document.documentElement).zoom);
    return z > 0 ? z : 1;
  };

  window.layoutRect = function (el) {
    var z = window.viewportZoom();
    var r = el.getBoundingClientRect();
    return {
      left:   r.left / z,
      top:    r.top / z,
      right:  r.right / z,
      bottom: r.bottom / z,
      width:  r.width / z,
      height: r.height / z
    };
  };
})();
