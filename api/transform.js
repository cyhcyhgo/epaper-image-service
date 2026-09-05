import sharp from 'sharp';

/**
 * Serverless Image Transformation Endpoint
 * Converts any arbitrary image (WebP, PNG, Progressive JPG, AVIF, GIF, SVG)
 * into a standardized 1600x1200 Baseline JPEG optimized for ESP32 e-paper hardware decoders.
 */
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url, w, h, fit, q, format } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: url',
      usage: '/api/transform?url=https://example.com/image.jpg&w=1600&h=1200&fit=cover&q=90'
    });
  }

  const targetWidth = parseInt(w, 10) || 1600;
  const targetHeight = parseInt(h, 10) || 1200;
  const targetQuality = Math.min(100, Math.max(10, parseInt(q, 10) || 90));
  const fitMode = ['cover', 'contain', 'fill', 'inside', 'outside'].includes(fit) ? fit : 'cover';
  const outFormat = (format || 'jpg').toLowerCase();

  try {
    const t0 = Date.now();

    // 1. Fetch remote image with custom headers to prevent hotlinking blocks
    const response = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': url
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: `Upstream image fetch failed with HTTP ${response.status} (${response.statusText})`,
        targetUrl: url
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    if (!inputBuffer || inputBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Received empty response body from upstream image source'
      });
    }

    // 2. High-performance C++ libvips pipeline via Sharp
    let pipeline = sharp(inputBuffer, { failOnError: false })
      .rotate() // Auto-orient according to EXIF data
      .resize({
        width: targetWidth,
        height: targetHeight,
        fit: fitMode,
        position: 'center',
        background: { r: 255, g: 255, b: 255, alpha: 1 } // Pure white background for transparent images
      });

    let outputBuffer;
    let mimeType = 'image/jpeg';

    if (outFormat === 'png') {
      outputBuffer = await pipeline.png({ compressionLevel: 9 }).toBuffer();
      mimeType = 'image/png';
    } else {
      // Standard Baseline JPEG for ESP32 tjpgd MCU streaming
      outputBuffer = await pipeline
        .jpeg({
          quality: targetQuality,
          progressive: false, // Must be Baseline (sequential) JPEG
          chromaSubsampling: '4:2:0',
          trellisQuantisation: true,
          overshootDeringing: true,
          optimizeScans: false
        })
        .toBuffer();
      mimeType = 'image/jpeg';
    }

    const elapsedMs = Date.now() - t0;

    // 3. Response Headers with Vercel Global Edge CDN Caching
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', outputBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
    res.setHeader('X-Transform-Time-Ms', `${elapsedMs}`);
    res.setHeader('X-Image-Width', `${targetWidth}`);
    res.setHeader('X-Image-Height', `${targetHeight}`);

    return res.status(200).send(outputBuffer);
  } catch (err) {
    console.error('Transform error:', err);
    return res.status(500).json({
      success: false,
      error: 'Image transformation failed: ' + err.message,
      targetUrl: url
    });
  }
}
