# E-Paper Image Transformer (墨水屏专属图像转换服务)

🚀 基于 **Vercel Serverless Functions** 与 **Sharp (C++ libvips)** 构建的超高性能图像实时转码与裁剪服务。

专为 **10.1寸 1600×1200 Spectra 6 彩色墨水屏** 及单片机嵌入式设备量身定制，解决 ESP32 无法直接解码 WebP、PNG、渐进式 JPEG 等格式的问题。

---

## ✨ 核心特性

- ⚡ **毫秒级极速响应**：基于底层 libvips 纯 C/C++ 图像处理流水线，15~30ms 内完成 4K 图像的缩放与转码。
- 📦 **标准基线式输出**：强制输出标准 **Baseline JPEG (`progressive: false`)**，单片机（ESP32 `tjpgd`）可流式行缓冲直接解码，杜绝 OOM 内存溢出。
- 🛡️ **防盗链智能伪装**：自动跟随 301/302 重定向，内置常用浏览器 User-Agent，畅通抓取各大图源与必应每日壁纸。
- 🌐 **全球边缘加速**：自动继承 Vercel Edge CDN 缓存，同一张图片二次访问耗时趋近于 0。
- 🎨 **在线可视化控制台**：直接访问部署后的根域名即可打开在线交互测试台。

---

## 🛠️ API 接口说明

### 端点：`GET /api/transform`

| 参数 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `url` | string | **必填** | 目标原始图片的完整 URL 直链 |
| `w` | number | `1600` | 目标图像宽度（像素） |
| `h` | number | `1200` | 目标图像高度（像素） |
| `fit` | string | `cover` | 裁剪模式：`cover`（居中裁剪铺满）、`contain`（等比缩放留白） |
| `q` | number | `90` | JPEG 质量因子（10~100） |
| `format`| string | `jpg` | 输出格式：`jpg`（基线式 JPEG）或 `png` |

#### 调用示例：
```text
https://your-project.vercel.app/api/transform?url=https://cn.bing.com/th?id=OHR.BimmahSinkhole_ZH-CN8767936100_1920x1080.jpg&w=1600&h=1200&fit=cover&q=90
```

---

## 📱 ESP32 墨水屏配置指南

1. 进入墨水屏 Web 控制端（`http://192.168.4.1` 或局域网 IP）。
2. 在 **系统设置 ➔ 高级网络与服务设置**：
   - 勾选 **启用图像转换服务**。
   - 填写转换端点模板：
     ```text
     https://your-project.vercel.app/api/transform?url=%s
     ```
3. 点击 **【⚡ 测试转换效果】**，验证通过后点击 **保存配置** 即可。

---

## 🚀 部署指南

### 方式 1：GitHub 自动关联部署（推荐）
1. 将本项目推送到您的 GitHub 仓库：`https://github.com/cyhcyhgo/epaper-image-service.git`
2. 打开 [Vercel 控制台 (Dashboard)](https://vercel.com/dashboard)，点击 **Add New... ➔ Project**。
3. 导入 `epaper-image-service` 仓库并点击 **Deploy**，等待 30 秒即可上线。

### 方式 2：Vercel CLI 命令行部署
```bash
npm install -g vercel
vercel
vercel --prod
```
