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
  <title>E-Paper Image Transformer | 墨水屏图像转换服务</title>
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
      max-width: 720px;
      background: var(--card-bg);
      border-radius: 20px;
      padding: 2.5rem 2rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.8);
    }
    .header { text-align: center; margin-bottom: 2rem; }
    .header h1 { font-size: 1.75rem; font-weight: 700; color: var(--primary); margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .header p { color: var(--text-light); font-size: 0.92rem; line-height: 1.5; }
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
      <h1>🖼️ E-Paper Image Transformer</h1>
      <p>10.1寸 1600×1200 彩色墨水屏专属 Serverless 图像格式转换与裁剪引擎</p>
    </div>

    <div class="card">
      <div class="form-group">
        <label for="urlInput">🌐 测试图片 URL 地址 (支持 WebP / PNG / 渐进式JPG / 必应壁纸等)</label>
        <div class="input-row">
          <input type="text" id="urlInput" value="https://cn.bing.com/th?id=OHR.BimmahSinkhole_ZH-CN8767936100_1920x1080.jpg" placeholder="输入图片直链...">
          <button class="btn" id="btnTest" onclick="testTransform()">⚡ 转换测试</button>
        </div>
        <div class="quick-tags">
          <span style="font-size:0.75rem; color:var(--text-light); line-height:22px;">常用示例：</span>
          <span class="tag" onclick="setSample(1)">必应每日高清壁纸</span>
          <span class="tag" onclick="setSample(2)">动漫 4K (WebP格式)</span>
          <span class="tag" onclick="setSample(3)">透明通道 PNG</span>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div class="form-group" style="margin-bottom:0;">
          <label>目标分辨率 (Width × Height)</label>
          <select id="resSelect">
            <option value="1600x1200" selected>1600 × 1200 (E6 墨水屏黄金比例)</option>
            <option value="1200x1600">1200 × 1600 (竖屏展示模式)</option>
            <option value="800x600">800 × 600 (缩略图轻量模式)</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label>适配模式 (Fit Mode)</label>
          <select id="fitSelect">
            <option value="cover" selected>智能居中裁切铺满 (Center Cover)</option>
            <option value="contain">等比缩放留白 (Contain)</option>
          </select>
        </div>
      </div>

      <div class="form-group" style="margin-top: 12px; margin-bottom: 0;">
        <label for="tokenInput">🔒 访问令牌 / Token (可选，私有鉴权实例填写)</label>
        <input type="text" id="tokenInput" placeholder="若部署时配置了 AUTH_SECRET 环境变量请在此输入，未开启请留空" style="font-size:0.85rem;" oninput="updateTemplateUrl()">
      </div>
    </div>

    <div id="resultBox" class="result-box">
      <h3 style="font-size:0.95rem; font-weight:700; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
        ✅ 转换成功 (标准基线式 Baseline JPEG)
      </h3>
      <div class="meta-badges">
        <span class="badge" id="badgeSize">大小: 计算中...</span>
        <span class="badge" id="badgeTime">耗时: 0ms</span>
        <span class="badge" id="badgeRes">分辨率: 1600×1200</span>
      </div>

      <img id="previewImg" class="preview-img" src="" alt="Transformed Preview">

      <div style="margin-top:1rem;">
        <label style="font-size:0.8rem; font-weight:600; color:var(--text-light);">📱 ESP32 墨水屏配置端点模板：</label>
        <div class="code-box">
          <span id="endpointUrl"></span>
          <button class="copy-btn" onclick="copyEndpoint()">📋 复制</button>
        </div>
      </div>
    </div>
  </div>

  <script>
    function setSample(idx) {
      const samples = {
        1: 'https://cn.bing.com/th?id=OHR.BimmahSinkhole_ZH-CN8767936100_1920x1080.jpg',
        2: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=2000&q=80',
        3: 'https://upload.wikimedia.org/wikipedia/commons/4/47/PNG_transparency_demonstration_1.png'
      };
      if (samples[idx]) {
        document.getElementById('urlInput').value = samples[idx];
        testTransform();
      }
    }

    function updateTemplateUrl() {
      const resVal = document.getElementById('resSelect').value.split('x');
      const fit = document.getElementById('fitSelect').value;
      const token = document.getElementById('tokenInput').value.trim();
      let template = window.location.origin + '/api/transform?url=%s&w=' + resVal[0] + '&h=' + resVal[1] + '&fit=' + fit + '&q=90';
      if (token) {
        template += '&token=' + encodeURIComponent(token);
      }
      document.getElementById('endpointUrl').textContent = template;
    }

    async function testTransform() {
      const url = document.getElementById('urlInput').value.trim();
      if (!url) return alert('请输入图片地址！');

      const btn = document.getElementById('btnTest');
      const resVal = document.getElementById('resSelect').value.split('x');
      const fit = document.getElementById('fitSelect').value;
      const token = document.getElementById('tokenInput').value.trim();

      btn.disabled = true;
      btn.textContent = '⏳ 正在云端转码...';

      let apiUrl = window.location.origin + '/api/transform?url=' + encodeURIComponent(url) + '&w=' + resVal[0] + '&h=' + resVal[1] + '&fit=' + fit + '&q=90';
      if (token) {
        apiUrl += '&token=' + encodeURIComponent(token);
      }

      const t0 = performance.now();
      try {
        const resp = await fetch(apiUrl);
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({ error: 'HTTP ' + resp.status }));
          throw new Error(errData.error || errData.message || ('HTTP ' + resp.status));
        }
        const blob = await resp.blob();
        const elapsed = Math.round(performance.now() - t0);

        document.getElementById('badgeSize').textContent = '大小: ' + Math.round(blob.size / 1024) + ' KB';
        document.getElementById('badgeTime').textContent = '响应耗时: ' + elapsed + 'ms';
        document.getElementById('badgeRes').textContent = '输出: ' + resVal[0] + '×' + resVal[1] + ' (基线式 JPG)';

        const previewImg = document.getElementById('previewImg');
        if (previewImg.src && previewImg.src.startsWith('blob:')) {
          URL.revokeObjectURL(previewImg.src);
        }
        previewImg.src = URL.createObjectURL(blob);

        updateTemplateUrl();
        document.getElementById('resultBox').style.display = 'block';
      } catch (err) {
        alert('转码失败: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '⚡ 转换测试';
      }
    }

    function copyEndpoint() {
      const text = document.getElementById('endpointUrl').textContent;
      navigator.clipboard.writeText(text).then(() => alert('已复制 ESP32 端点模板到剪贴板！'));
    }

    window.onload = function() {
      updateTemplateUrl();
    };
  </script>
</body>
</html>`);
}
