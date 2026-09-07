/**
 * Interactive Web Dashboard & Online Test Tool
 */
export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Paper Visual Hub | 墨水屏视觉与原画检索服务</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #4F46E5;
      --primary-hover: #4338CA;
      --bg: #F8FAFC;
      --card-bg: #FFFFFF;
      --text: #1E293B;
      --text-light: #64748B;
      --border: #E2E8F0;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #EEF2FF 0%, #F1F5F9 100%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem 1rem;
    }
    .container {
      width: 100%;
      max-width: 760px;
      background: var(--card-bg);
      border-radius: 20px;
      padding: 2.5rem 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.8);
    }
    .header { text-align: center; margin-bottom: 1.5rem; }
    .header h1 { font-size: 1.75rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .header p { color: var(--text-light); font-size: 0.92rem; line-height: 1.5; }
    .nav-tabs { display: flex; gap: 8px; margin-bottom: 1.5rem; border-bottom: 2px solid var(--border); padding-bottom: 8px; }
    .tab-btn { background: none; border: none; font-size: 0.95rem; font-weight: 600; padding: 8px 16px; border-radius: 8px; cursor: pointer; color: var(--text-light); transition: all 0.2s; }
    .tab-btn.active { background: #EEF2FF; color: var(--primary); }
    .card { background: #F8FAFC; border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.4rem; }
    .input-row { display: flex; gap: 8px; }
    input[type="text"], select {
      width: 100%; padding: 10px 14px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 0.95rem; background: white; transition: border-color 0.2s;
    }
    input[type="text"]:focus, select:focus { border-color: var(--primary); outline: none; }
    .btn {
      background: var(--primary); color: white; border: none; padding: 12px 20px; font-size: 0.95rem; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap;
    }
    .btn:hover { background: var(--primary-hover); transform: translateY(-1px); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .quick-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
    .tag { font-size: 0.75rem; background: #EEF2FF; color: var(--primary); border: 1px solid #C7D2FE; padding: 3px 8px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
    .tag:hover { background: #E0E7FF; }
    .result-box { display: none; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px dashed var(--border); }
    .preview-img { max-width: 100%; height: auto; border-radius: 10px; border: 2px solid #CBD5E1; box-shadow: 0 4px 12px rgba(0,0,0,0.1); display: block; margin: 12px 0; background: #000; }
    .meta-badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
    .badge { font-size: 0.78rem; font-weight: 600; padding: 4px 10px; border-radius: 6px; background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
    .code-box { background: #1E293B; color: #38BDF8; padding: 10px 14px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; word-break: break-all; margin-top: 6px; display: flex; align-items: center; justify-content: space-between; }
    .copy-btn { background: #334155; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; cursor: pointer; }
    .copy-btn:hover { background: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🖼️ E-Paper Visual Hub</h1>
      <p>10.1寸 1600×1200 全彩墨水屏专属 · 原画检索与图像转码中心</p>
    </div>

    <div class="nav-tabs">
      <button class="tab-btn active" onclick="switchTab('search')">🎨 智能原画检索 (名画/摄影/二次元)</button>
      <button class="tab-btn" onclick="switchTab('transform')">⚡ 任意图片转码 (URL直转)</button>
    </div>

    <!-- Tab 1: Image Search -->
    <div id="tabSearch">
      <div class="card">
        <div class="form-group">
          <label>🔍 原画搜索关键词 (支持中文/英文/画师/角色名)</label>
          <div class="input-row">
            <input type="text" id="searchQuery" value="雪初音 全身" placeholder="输入搜索词，如：雪初音 / 莫奈 睡莲 / 富士山...">
            <button class="btn" id="btnSearch" onclick="testSearch()">🔍 检索并渲染</button>
          </div>
          <div class="quick-tags">
            <span style="font-size:0.75rem; color:var(--text-light); line-height:22px;">推荐体验：</span>
            <span class="tag" onclick="setSearchSample('雪初音 全身', 'anime')">雪初音 (全身动漫原画)</span>
            <span class="tag" onclick="setSearchSample('莫奈 睡莲', 'art')">莫奈《睡莲》 (公版名画)</span>
            <span class="tag" onclick="setSearchSample('梵高 星空', 'art')">梵高《星空》 (大都会名画)</span>
            <span class="tag" onclick="setSearchSample('cyberpunk street', 'photo')">赛博朋克街道 (4K摄影)</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group" style="margin-bottom:0;">
            <label>分类板块</label>
            <select id="searchCategory">
              <option value="auto" selected>🤖 自动识别分类 (Auto)</option>
              <option value="anime">🌸 动漫二次元原画 (Safebooru)</option>
              <option value="art">🏛️ 世界公版名画 (Museum Access)</option>
              <option value="photo">📷 现代高清摄影 (Unsplash / Wiki)</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0;">
            <label>色彩调校</label>
            <select id="searchSat">
              <option value="1.15" selected>E6 墨水屏色彩增强 (+15%)</option>
              <option value="1.0">标准原始色彩 (100%)</option>
              <option value="1.3">超高对比饱和度 (+30%)</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Transform -->
    <div id="tabTransform" style="display:none;">
      <div class="card">
        <div class="form-group">
          <label for="urlInput">🌐 任意图片 URL 地址 (WebP / PNG / 渐进式JPG / 必应壁纸等)</label>
          <div class="input-row">
            <input type="text" id="urlInput" value="https://cn.bing.com/th?id=OHR.BimmahSinkhole_ZH-CN8767936100_1920x1080.jpg" placeholder="输入图片直链...">
            <button class="btn" id="btnTransform" onclick="testTransform()">⚡ 转换测试</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Result View -->
    <div class="result-box" id="resultBox">
      <div class="meta-badges" id="metaBadges"></div>
      <img id="previewImage" class="preview-img" alt="墨水屏预览">
      <div class="form-group">
        <label>🔗 ESP32-S3 / 小智设备调用端点：</label>
        <div class="code-box">
          <span id="endpointUrl"></span>
          <button class="copy-btn" onclick="copyUrl()">复制链接</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    let currentTab = 'search';

    function switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      if (tab === 'search') {
        document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
        document.getElementById('tabSearch').style.display = 'block';
        document.getElementById('tabTransform').style.display = 'none';
      } else {
        document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
        document.getElementById('tabSearch').style.display = 'none';
        document.getElementById('tabTransform').style.display = 'block';
      }
      document.getElementById('resultBox').style.display = 'none';
    }

    function setSearchSample(q, cat) {
      document.getElementById('searchQuery').value = q;
      document.getElementById('searchCategory').value = cat;
      testSearch();
    }

    async function testSearch() {
      const q = document.getElementById('searchQuery').value.trim();
      const cat = document.getElementById('searchCategory').value;
      const sat = document.getElementById('searchSat').value;
      if (!q) return alert('请输入搜索关键词');

      const btn = document.getElementById('btnSearch');
      btn.disabled = true;
      btn.textContent = '⏳ 检索并处理中...';

      const endpoint = `${window.location.origin}/api/search?q=${encodeURIComponent(q)}&category=${cat}&w=1600&h=1200&sat=${sat}`;
      renderResult(endpoint, btn, '🔍 检索并渲染');
    }

    async function testTransform() {
      const url = document.getElementById('urlInput').value.trim();
      if (!url) return alert('请输入图片 URL');

      const btn = document.getElementById('btnTransform');
      btn.disabled = true;
      btn.textContent = '⏳ 转换中...';

      const endpoint = `${window.location.origin}/api/transform?url=${encodeURIComponent(url)}&w=1600&h=1200&fit=cover`;
      renderResult(endpoint, btn, '⚡ 转换测试');
    }

    function renderResult(endpoint, btn, origText) {
      const img = document.getElementById('previewImage');
      const t0 = performance.now();

      img.onload = () => {
        const ms = Math.round(performance.now() - t0);
        document.getElementById('resultBox').style.display = 'block';
        document.getElementById('endpointUrl').textContent = endpoint;
        document.getElementById('metaBadges').innerHTML = `
          <span class="badge">🎯 分辨率: 1600 × 1200</span>
          <span class="badge">🚀 响应耗时: ${ms} ms</span>
          <span class="badge">⚡ 格式: Baseline JPEG (ESP32-S3 原生直解)</span>
        `;
        btn.disabled = false;
        btn.textContent = origText;
      };

      img.onerror = () => {
        alert('加载或处理失败，请检查参数');
        btn.disabled = false;
        btn.textContent = origText;
      };

      img.src = endpoint;
    }

    function copyUrl() {
      const text = document.getElementById('endpointUrl').textContent;
      navigator.clipboard.writeText(text);
      alert('已复制调用链接到剪贴板！');
    }
  </script>
</body>
</html>`);
}
