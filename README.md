# 🖼️ E-Paper Image Transformer

> 🚀 **High-performance Serverless Image Transformation Engine for E-Paper Displays & Microcontrollers (ESP32 / Raspberry Pi / Arduino)**  
> 基于 **Vercel Serverless Functions + Edge Middleware + Sharp (C++ libvips)** 构建的超高性能开源图像实时转码与裁剪服务。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcyhcyhgo%2Fepaper-image-service&env=AUTH_SECRET&envDescription=Optional%20access%20token%20to%20protect%20your%20instance%20from%20unauthorized%20abuse)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)

---

## 💡 为什么需要本服务？(Why is this needed?)

嵌入式单片机（如 ESP32-S3、ESP32、ESP8266）受限于片上 SRAM/PSRAM 内存容量与算力：
1. **无法直接解码复杂格式**：绝大多数单片机硬件 JPEG 解码器（如 `tjpgd`）仅支持标准 **基线式（Baseline/Sequential）JPEG**，遇到现代网络常见的 **WebP、PNG、渐进式 JPEG (Progressive JPG)、AVIF、GIF** 会直接报错崩溃。
2. **大图内存溢出 (OOM)**：直接拉取 4K/原图在单片机内存中缩放极易耗尽内存。

本项目将图像的**抓取、防盗链伪装、等比缩放、居中裁切、格式转换**全部转移到云端 Serverless 算力完成，并在毫秒级内向单片机输出专用的 **1600×1200 标准基线式 JPEG 流**。

---

## ✨ 核心特性 (Features)

- ⚡ **毫秒级极速响应**：基于底层 libvips 纯 C/C++ 图像流水线，15~30ms 内完成高精图像的缩放与重编码。
- 📦 **硬件级基线式输出**：严格生成 `progressive: false` 标准 Baseline JPEG，ESP32 可进行流式 MCU 行缓冲实时解码，内存占用趋近于 0。
- 🔒 **边缘级鉴权与防刷盾 (Edge Middleware)**：
  - 支持配置 `AUTH_SECRET` 环境变量开启私有鉴权。
  - 未授权请求在 **Vercel Global Edge CDN 边缘层（<0.1ms）瞬间拦截并阻断**，不消耗 Serverless 算力和内存配额。
- 🛡️ **防盗链智能伪装**：自动跟随 301/302/307 重定向，模拟真实浏览器 User-Agent，畅通抓取各大图源与必应每日壁纸。
- 🌐 **全球边缘缓存 (Edge Caching)**：自动配置全球 CDN 缓存，同一张图片二次访问耗时趋近于 0。
- 🎨 **内置可视化测试台**：部署完成后直接访问根域名即可打开 Web 交互式调试面板与端点生成器。

---

## 🚀 1分钟快速部署 (Quick Deployment)

### 方式 1：一键免费部署到 Vercel（推荐）

点击下方按钮一键 Fork 本项目并部署至您的专属 Vercel 免费账号中：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fcyhcyhgo%2Fepaper-image-service&env=AUTH_SECRET&envDescription=Optional%20access%20token%20to%20protect%20your%20instance%20from%20unauthorized%20abuse)

> 💡 **鉴权保护提示**：部署时可自选是否填写 `AUTH_SECRET` 环境变量：
> - **私有防护模式**：填入您自定义的访问密码（如 `my_secret_token_123`），只有携带该 Token 的请求才被允许处理。
> - **开放共享模式**：直接留空，实例对任何人均可公开使用。

---

### 方式 2：Vercel CLI 命令行部署

```bash
# 1. 克隆仓库
git clone https://github.com/cyhcyhgo/epaper-image-service.git
cd epaper-image-service

# 2. 安装 Vercel CLI 并一键部署
npm install -g vercel
vercel
vercel --prod
```

---

## 🛠️ API 接口参数规范 (API Reference)

### 端点：`GET /api/transform`

| 参数名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `url` | string | **必填** | 目标原始图片的完整直链（支持 WebP / PNG / JPG / AVIF 等） |
| `token` / `key` | string | 可选 | 访问令牌（当实例配置了 `AUTH_SECRET` 时必填） |
| `w` | number | `1600` | 目标图像宽度（像素） |
| `h` | number | `1200` | 目标图像高度（像素） |
| `fit` | string | `cover` | 裁剪模式：`cover`（居中裁剪铺满）、`contain`（等比缩放留白） |
| `q` | number | `90` | JPEG 质量因子（10~100） |
| `format` | string | `jpg` | 输出格式：`jpg`（基线式 JPEG）或 `png` |

#### 调用示例 (Request Examples)：

- **标准调用**：
  ```text
  https://your-domain.com/api/transform?url=https://example.com/photo.webp&w=1600&h=1200&fit=cover&q=90
  ```
- **带私有 Token 鉴权调用**：
  ```text
  https://your-domain.com/api/transform?url=https://example.com/photo.webp&token=your_secret_token
  ```

---

## 📱 ESP32 墨水屏固件配置指南

在墨水屏 Web 终端（`http://192.168.4.1` 或局域网 IP）的 **系统设置 ➔ 高级网络与服务设置** 中配置：

1. 勾选 **【启用图像转换服务】**。
2. 填写服务端点模板：
   - 无密码实例：
     ```text
     https://your-domain.com/api/transform?url=%s
     ```
   - 带密码私有实例：
     ```text
     https://your-domain.com/api/transform?url=%s&token=your_secret_token
     ```
3. 点击 **【⚡ 测试转换效果】** 验证连通性与转码质量，确认无误后点击 **【保存配置】**。

---

## 📄 开源许可证 (License)

本项目采用 [MIT License](LICENSE) 许可证开源，欢迎自由克隆、修改与二次分发。
