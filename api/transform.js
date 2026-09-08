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

  // 0. Optional Token Authentication Check (Protects private instances from abuse)
  const authSecret = process.env.AUTH_SECRET;
  if (authSecret && authSecret.length > 0) {
    const token = req.query.token || req.query.key || req.headers['x-auth-token'];
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

    if (token !== authSecret && bearerToken !== authSecret) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid token',
        message: 'This transformer instance has authentication enabled. Please provide a valid ?token= or deploy your own instance.'
      });
    }
  }

  const { url, w, h, fit, q, format, rot, rotate } = req.query;

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
  const rotParam = (rot || rotate || 'auto').toLowerCase();

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
    const meta = await sharp(inputBuffer, { failOnError: false }).metadata();
    const isExifSwapped = meta.orientation && meta.orientation >= 5;
    const effectiveWidth = isExifSwapped ? (meta.height || 1000) : (meta.width || 1000);
    const effectiveHeight = isExifSwapped ? (meta.width || 1000) : (meta.height || 1000);
    const isPortrait = effectiveHeight > effectiveWidth;

    let rotateAngle = null;
    if (rotParam === '90' || rotParam === '180' || rotParam === '270') {
      rotateAngle = parseInt(rotParam, 10);
    } else if (rotParam === 'auto' || rotParam === '1' || rotParam === 'true') {
      if (isPortrait) {
        rotateAngle = 90; // Auto-rotate portrait 90 degrees clockwise for landscape e-paper
      }
    }

    let pipeline = sharp(inputBuffer, { failOnError: false });
    if (rotateAngle !== null) {
      pipeline = pipeline.rotate(rotateAngle);
    } else {
      pipeline = pipeline.rotate(); // auto-orient according to EXIF
    }

    pipeline = pipeline.resize({
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
    res.setHeader('X-Image-Rotated', isRotated ? '90' : '0');
    res.setHeader('X-Original-Dimensions', `${meta.width || 0}x${meta.height || 0}`);

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
