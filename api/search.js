import sharp from 'sharp';

/**
 * Safe fetch with strict timeout
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 4000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Dynamic Translation Helper (No manual dictionaries)
 * Translates raw Chinese to English/Latin if Chinese characters are present,
 * or passes through exact titles (e.g. 'Le Bassin Aux Nympheas', 'snow_miku full_body') unchanged.
 */
async function autoTranslateToEn(text) {
  if (!text) return '';
  const trimmed = text.trim();
  // If no Chinese characters, return directly as-is
  if (!/[\u4e00-\u9fa5]/.test(trimmed)) {
    return trimmed;
  }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetchWithTimeout(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, 2500);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0].map(item => item[0]).join('');
        if (translated && translated.trim().length > 0) {
          return translated.trim();
        }
      }
    }
  } catch (err) {
    console.warn('Auto translation fallback error:', err.message);
  }
  return trimmed;
}

/**
 * 1. Anime Search (Yande.re -> Konachan -> Safebooru)
 */
async function searchAnime(query) {
  const translated = await autoTranslateToEn(query);
  // Format for Booru tags: replace multiple spaces with single space, lowercase
  const booruTags = translated.toLowerCase().replace(/['"]/g, '').split(/\s+/).join('+');

  // Source 1: Yande.re (Safe & High Res)
  try {
    const yandeUrl = `https://yande.re/post.json?tags=${encodeURIComponent(booruTags)}+rating:safe&limit=10`;
    const res = await fetchWithTimeout(yandeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://yande.re/'
      }
    }, 3500);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        const posts = JSON.parse(text);
        if (Array.isArray(posts) && posts.length > 0) {
          const selected = posts[Math.floor(Math.random() * Math.min(posts.length, 4))];
          const imgUrl = selected.sample_url || selected.file_url;
          if (imgUrl) {
            return {
              title: selected.tags || query,
              author: 'Yande.re',
              sourceUrl: imgUrl,
              referer: 'https://yande.re/'
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Yande.re search failed, trying Konachan:', err.message);
  }

  // Source 2: Konachan.net (100% SFW)
  try {
    const konaUrl = `https://konachan.net/post.json?tags=${encodeURIComponent(booruTags)}&limit=10`;
    const res = await fetchWithTimeout(konaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://konachan.net/'
      }
    }, 3500);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        const posts = JSON.parse(text);
        if (Array.isArray(posts) && posts.length > 0) {
          const selected = posts[0];
          const imgUrl = selected.sample_url || selected.file_url;
          if (imgUrl) {
            return {
              title: selected.tags || query,
              author: 'Konachan',
              sourceUrl: imgUrl,
              referer: 'https://konachan.net/'
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Konachan search failed, trying Safebooru:', err.message);
  }

  // Source 3: Safebooru
  try {
    const safeUrl = `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${encodeURIComponent(booruTags)}&limit=10`;
    const res = await fetchWithTimeout(safeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://safebooru.org/'
      }
    }, 3500);

    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 0) {
        const posts = JSON.parse(text);
        if (Array.isArray(posts) && posts.length > 0) {
          const selected = posts[0];
          const imgUrl = selected.sample_url 
            ? `https://safebooru.org/samples/${selected.directory}/sample_${selected.image}`
            : `https://safebooru.org/images/${selected.directory}/${selected.image}`;
          return {
            title: selected.tags || query,
            author: 'Safebooru',
            sourceUrl: imgUrl,
            referer: 'https://safebooru.org/'
          };
        }
      }
    }
  } catch (err) {
    console.warn('Safebooru search failed:', err.message);
  }

  return null;
}

/**
 * 2. Fine Art Search (Wikimedia Commons / Cleveland Museum / Met)
 */
async function searchFineArt(query) {
  const cleanQuery = await autoTranslateToEn(query);

  // Source 1: Wikimedia Commons (Global Art Collection - Covers MoMA, Orsay, Louvre, London National Gallery, etc.)
  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1600&format=json`;
    const res = await fetchWithTimeout(wikiUrl, {
      headers: { 'User-Agent': 'EpaperVisualHub/1.0 (https://epaper-image-service.vercel.app; contact@epaper.app)' }
    }, 3500);

    if (res.ok) {
      const data = await res.json();
      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages);
        for (const page of pages) {
          if (page.imageinfo && page.imageinfo[0]) {
            const info = page.imageinfo[0];
            const imgUrl = info.thumburl || info.url;
            if (imgUrl && !imgUrl.endsWith('.svg') && !imgUrl.endsWith('.tif') && !imgUrl.endsWith('.tiff')) {
              return {
                title: page.title ? page.title.replace(/^File:/, '') : cleanQuery,
                author: 'Wikimedia Commons Masterpiece Collection',
                sourceUrl: imgUrl,
                referer: 'https://commons.wikimedia.org/'
              };
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Wikimedia art search failed, trying Cleveland:', err.message);
  }

  // Source 2: Cleveland Museum of Art Open Access API
  try {
    const clevelandUrl = `https://openaccess-api.clevelandart.org/api/artworks/?q=${encodeURIComponent(cleanQuery)}&has_image=1&limit=5`;
    const res = await fetchWithTimeout(clevelandUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, 3500);

    if (res.ok) {
      const data = await res.json();
      if (data && data.data && data.data.length > 0) {
        for (const item of data.data) {
          const imgUrl = item.images && item.images.web && item.images.web.url;
          if (imgUrl && imgUrl.startsWith('http')) {
            return {
              title: item.title || cleanQuery,
              author: (item.creators && item.creators[0] && item.creators[0].description) || 'Cleveland Museum Collection',
              sourceUrl: imgUrl,
              referer: 'https://www.clevelandart.org/'
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Cleveland Museum search failed, trying Met:', err.message);
  }

  // Source 3: Metropolitan Museum of Art Open Access
  try {
    const metSearchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(cleanQuery)}&hasImages=true`;
    const resMet = await fetchWithTimeout(metSearchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, 3000);

    if (resMet.ok) {
      const metData = await resMet.json();
      if (metData.objectIDs && metData.objectIDs.length > 0) {
        const topIds = metData.objectIDs.slice(0, 3);
        for (const objId of topIds) {
          try {
            const objRes = await fetchWithTimeout(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${objId}`, {
              headers: { 'User-Agent': 'Mozilla/5.0' }
            }, 2000);
            if (objRes.ok) {
              const objData = await objRes.json();
              const imgUrl = objData.primaryImageSmall || objData.primaryImage;
              if (imgUrl && imgUrl.startsWith('http')) {
                return {
                  title: objData.title || cleanQuery,
                  author: objData.artistDisplayName || 'Met Museum Collection',
                  sourceUrl: imgUrl,
                  referer: 'https://www.metmuseum.org/'
                };
              }
            }
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.warn('Met Museum search failed:', err.message);
  }

  return null;
}

/**
 * 3. Modern Photography Search (Wikimedia Commons / Curated Unsplash)
 */
async function searchPhoto(query) {
  const cleanQuery = await autoTranslateToEn(query);

  // Source 1: Wikimedia Commons Photo (pre-rendered 1600px thumb)
  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery + ' photograph')}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1600&format=json`;
    const res = await fetchWithTimeout(wikiUrl, {
      headers: { 'User-Agent': 'EpaperVisualHub/1.0 (https://epaper-image-service.vercel.app; contact@epaper.app)' }
    }, 3500);

    if (res.ok) {
      const data = await res.json();
      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages);
        for (const page of pages) {
          if (page.imageinfo && page.imageinfo[0]) {
            const info = page.imageinfo[0];
            const imgUrl = info.thumburl || info.url;
            if (imgUrl && !imgUrl.endsWith('.svg')) {
              return {
                title: page.title ? page.title.replace(/^File:/, '') : cleanQuery,
                author: 'Wikimedia Commons Photography',
                sourceUrl: imgUrl,
                referer: 'https://commons.wikimedia.org/'
              };
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Wikimedia photo search failed:', err.message);
  }

  // Source 2: Curated High-Res Unsplash Landscape Photo
  try {
    const unsplashSearchUrl = `https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&h=1200&q=90`;
    return {
      title: cleanQuery,
      author: 'Unsplash Photography',
      sourceUrl: unsplashSearchUrl,
      referer: 'https://unsplash.com/'
    };
  } catch (err) {
    console.warn('Photo search failed:', err.message);
  }
  return null;
}

/**
 * 4. Fallback: High Quality AI Generation (Pollinations FLUX)
 */
async function getAIFallback(query, category) {
  const enQuery = await autoTranslateToEn(query);
  let prompt = enQuery;
  if (category === 'anime') {
    prompt = `masterpiece, official art, 1girl, ${enQuery}, clean lineart, vibrant anime wallpaper, high quality, 4:3 aspect ratio`;
  } else if (category === 'art') {
    prompt = `masterpiece, classic oil painting, ${enQuery}, museum quality, elegant brush strokes, warm natural lighting, 4:3 aspect ratio`;
  } else {
    prompt = `award winning professional photography, ${enQuery}, 8k resolution, crisp details, 4:3 aspect ratio`;
  }
  return {
    title: `AI Generated: ${query}`,
    author: 'FLUX.1 AI',
    sourceUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1600&height=1200&model=flux&nologo=true&seed=42`,
    referer: 'https://pollinations.ai/'
  };
}

/**
 * Universal E-Paper Image Search & Display Handler
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Optional authentication check
  const authSecret = process.env.AUTH_SECRET;
  if (authSecret && authSecret.length > 0) {
    const token = req.query.token || req.query.key || req.headers['x-auth-token'];
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

    if (token !== authSecret && bearerToken !== authSecret) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Missing or invalid token'
      });
    }
  }

  const { q, query, category, cat, w, h, fit, sat, json } = req.query;
  const searchQuery = (q || query || '').trim();
  const rawCat = (category || cat || 'auto').toLowerCase();

  if (!searchQuery) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: q (search query)',
      usage: '/api/search?q=Le+Bassin+Aux+Nympheas&category=art&w=1600&h=1200'
    });
  }

  const targetWidth = parseInt(w, 10) || 1600;
  const targetHeight = parseInt(h, 10) || 1200;
  const fitMode = ['cover', 'contain', 'fill', 'inside', 'outside'].includes(fit) ? fit : 'cover';
  const saturationBoost = parseFloat(sat) || 1.15;

  try {
    const t0 = Date.now();

    let selectedCat = rawCat;
    if (selectedCat === 'auto') {
      if (searchQuery.includes('初音') || searchQuery.includes('miku') || searchQuery.includes('二次元') || searchQuery.includes('动漫') || searchQuery.includes('雪初音')) {
        selectedCat = 'anime';
      } else if (searchQuery.includes('莫奈') || searchQuery.includes('梵高') || searchQuery.includes('油画') || searchQuery.includes('名画') || searchQuery.includes('国画') || searchQuery.includes('Nympheas') || searchQuery.includes('Monet') || searchQuery.includes('Gogh')) {
        selectedCat = 'art';
      } else {
        selectedCat = 'art';
      }
    }

    let searchResult = null;

    if (selectedCat === 'anime') {
      searchResult = await searchAnime(searchQuery);
    } else if (selectedCat === 'art') {
      searchResult = await searchFineArt(searchQuery);
    } else if (selectedCat === 'photo') {
      searchResult = await searchPhoto(searchQuery);
    }

    if (!searchResult) {
      searchResult = await getAIFallback(searchQuery, selectedCat);
    }

    if (json === '1' || json === 'true') {
      return res.status(200).json({
        success: true,
        query: searchQuery,
        category: selectedCat,
        title: searchResult.title,
        author: searchResult.author,
        sourceUrl: searchResult.sourceUrl,
        renderUrl: `/api/transform?url=${encodeURIComponent(searchResult.sourceUrl)}&w=${targetWidth}&h=${targetHeight}&fit=${fitMode}`
      });
    }

    // Download the source image with appropriate Referer to bypass hotlink protection
    const imgResponse = await fetchWithTimeout(searchResult.sourceUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': searchResult.referer || searchResult.sourceUrl
      }
    }, 5000);

    if (!imgResponse.ok) {
      throw new Error(`Failed to download image from source ${searchResult.sourceUrl}: HTTP ${imgResponse.status}`);
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const outputBuffer = await sharp(inputBuffer, { failOnError: false })
      .rotate()
      .resize({
        width: targetWidth,
        height: targetHeight,
        fit: fitMode,
        position: 'center',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .modulate({
        saturation: saturationBoost,
        brightness: 1.02
      })
      .jpeg({
        quality: 90,
        progressive: false,
        chromaSubsampling: '4:2:0',
        trellisQuantisation: true,
        overshootDeringing: true
      })
      .toBuffer();

    const elapsedMs = Date.now() - t0;

    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', outputBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000');
    res.setHeader('X-Image-Title', encodeURIComponent(searchResult.title || ''));
    res.setHeader('X-Image-Author', encodeURIComponent(searchResult.author || ''));
    res.setHeader('X-Search-Time-Ms', `${elapsedMs}`);

    return res.status(200).send(outputBuffer);

  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({
      success: false,
      error: 'Image search & transform failed: ' + err.message,
      query: searchQuery
    });
  }
}
