import sharp from 'sharp';

/**
 * Common Chinese to Booru Tag mapping for Anime Search
 */
const ANIME_TAG_MAP = {
  '雪初音': 'snow_miku',
  '初音未来': 'hatsune_miku',
  '初音': 'hatsune_miku',
  '全身': 'full_body',
  '立绘': 'full_body standing',
  '横屏': 'landscape',
  '壁纸': 'landscape',
  '蕾姆': 'rem_(re:zero)',
  '拉姆': 'ram_(re:zero)',
  '明日香': 'asuka_langley_soryu',
  '绫波丽': 'ayanami_rei',
  '芙莉莲': 'frieren',
  '远坂凛': 'tohsaka_rin',
  '阿尔托莉雅': 'artoria_pendragon_(all)',
  '吾王': 'artoria_pendragon_(all)',
  'saber': 'artoria_pendragon_(all)',
  '可莉': 'klee_(genshin_impact)',
  '纳西妲': 'nahida_(genshin_impact)',
  '雷电将军': 'raiden_shogun_(genshin_impact)',
  '刻晴': 'keqing_(genshin_impact)',
  '甘雨': 'ganyu_(genshin_impact)',
  '胡桃': 'hu_tao_(genshin_impact)',
  '原神': 'genshin_impact',
  '明日方舟': 'arknights',
  '星穹铁道': 'honkai:_star_rail',
  '流萤': 'firefly_(honkai:_star_rail)',
  '黄泉': 'acheron_(honkai:_star_rail)',
  '水彩': 'watercolor_(medium)',
  '和服': 'kimono',
  '水手服': 'sailor_suit',
  '校服': 'school_uniform',
  '女仆': 'maid',
  '吉他': 'guitar',
  '星空': 'starry_sky',
  '月亮': 'moon',
  '樱花': 'cherry_blossoms',
  '雪景': 'snow'
};

/**
 * Common Chinese to English mappings for Fine Art and Artists
 */
const ART_MAP = {
  '莫奈': 'Claude Monet',
  '梵高': 'Vincent van Gogh',
  '达芬奇': 'Leonardo da Vinci',
  '毕加索': 'Pablo Picasso',
  '葛饰北斋': 'Katsushika Hokusai',
  '浮世绘': 'Ukiyo-e',
  '日出印象': 'Impression Sunrise',
  '睡莲': 'Water Lilies',
  '星空': 'The Starry Night',
  '向日葵': 'Sunflowers',
  '神奈川冲浪里': 'The Great Wave off Kanagawa',
  '戴珍珠耳环的少女': 'Girl with a Pearl Earring',
  '维米尔': 'Johannes Vermeer',
  '克里姆特': 'Gustav Klimt',
  '吻': 'The Kiss Gustav Klimt',
  '千里江山图': 'Wang Ximeng',
  '富春山居图': 'Huang Gongwang',
  '国画': 'Chinese traditional painting',
  '山水画': 'Chinese landscape painting'
};

/**
 * Translate Chinese keywords to appropriate search tags
 */
function translateQuery(query, category) {
  let q = query.trim();
  
  if (category === 'anime') {
    let tags = [];
    for (const [cn, en] of Object.entries(ANIME_TAG_MAP)) {
      if (q.includes(cn)) {
        tags.push(en);
        q = q.replace(new RegExp(cn, 'g'), ' ');
      }
    }
    const remaining = q.trim().replace(/\s+/g, '_');
    if (remaining) tags.push(remaining);
    return tags.join('+');
  }

  if (category === 'art') {
    for (const [cn, en] of Object.entries(ART_MAP)) {
      if (q.includes(cn)) {
        return en;
      }
    }
  }

  return query;
}

/**
 * 1. Anime Search (Safebooru API)
 */
async function searchAnime(query) {
  try {
    const translated = translateQuery(query, 'anime');
    const tags = `${translated}+rating:general`;
    const url = `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&tags=${encodeURIComponent(tags)}&limit=25`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'E-Paper-Image-Service/1.0' }
    });

    if (res.ok) {
      const posts = await res.json();
      if (Array.isArray(posts) && posts.length > 0) {
        const selected = posts[Math.floor(Math.random() * Math.min(posts.length, 5))];
        const imageUrl = `https://safebooru.org/images/${selected.directory}/${selected.image}`;
        return {
          title: selected.tags || query,
          author: 'Safebooru Community',
          sourceUrl: imageUrl,
          width: selected.width,
          height: selected.height
        };
      }
    }
  } catch (err) {
    console.warn('Safebooru search failed:', err);
  }
  return null;
}

/**
 * 2. Fine Art Search (Art Institute of Chicago API)
 */
async function searchFineArt(query) {
  try {
    const cleanQuery = translateQuery(query, 'art');
    const url = `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(cleanQuery)}&query[term][is_public_domain]=true&fields=id,title,artist_title,image_id&limit=10`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'E-Paper-Image-Service/1.0' }
    });

    if (res.ok) {
      const data = await res.json();
      const items = (data.data || []).filter(item => item.image_id);
      if (items.length > 0) {
        const selected = items[0];
        const imageUrl = `https://www.artic.edu/iiif/2/${selected.image_id}/full/1680,/0/default.jpg`;
        return {
          title: selected.title,
          author: selected.artist_title || 'Unknown Master',
          sourceUrl: imageUrl
        };
      }
    }
  } catch (err) {
    console.warn('Art Institute search failed:', err);
  }

  // Fallback to Metropolitan Museum of Art Open Access
  try {
    const metSearchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&hasImages=true`;
    const resMet = await fetch(metSearchUrl);
    if (resMet.ok) {
      const metData = await resMet.json();
      if (metData.objectIDs && metData.objectIDs.length > 0) {
        const objId = metData.objectIDs[0];
        const objRes = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${objId}`);
        if (objRes.ok) {
          const objData = await objRes.json();
          if (objData.primaryImage) {
            return {
              title: objData.title,
              author: objData.artistDisplayName || 'Met Museum Collection',
              sourceUrl: objData.primaryImage
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Met Museum search failed:', err);
  }

  return null;
}

/**
 * 3. Modern Photography Search (Wikimedia)
 */
async function searchPhoto(query) {
  try {
    const wikiSearchUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query + ' filetype:bitmap')}&gsrlimit=5&prop=imageinfo&iiprop=url|size&format=json`;
    const res = await fetch(wikiSearchUrl, {
      headers: { 'User-Agent': 'E-Paper-Image-Service/1.0' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages);
        for (const page of pages) {
          if (page.imageinfo && page.imageinfo[0] && page.imageinfo[0].url) {
            return {
              title: page.title,
              author: 'Wikimedia Commons',
              sourceUrl: page.imageinfo[0].url
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('Photo search failed:', err);
  }
  return null;
}

/**
 * 4. Fallback: High Quality AI Generation (Pollinations FLUX)
 */
function getAIFallback(query, category) {
  let prompt = query;
  if (category === 'anime') {
    prompt = `masterpiece, official art, 1girl, ${query}, clean lineart, vibrant anime wallpaper, high quality, 4:3 aspect ratio`;
  } else if (category === 'art') {
    prompt = `masterpiece, classic oil painting, ${query}, museum quality, elegant brush strokes, warm natural lighting, 4:3 aspect ratio`;
  } else {
    prompt = `award winning professional photography, ${query}, 8k resolution, crisp details, 4:3 aspect ratio`;
  }
  return {
    title: `AI Generated: ${query}`,
    author: 'FLUX.1 AI',
    sourceUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1600&height=1200&model=flux&nologo=true&seed=42`
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
      usage: '/api/search?q=snow_miku&category=anime&w=1600&h=1200'
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
      if (searchQuery.includes('初音') || searchQuery.includes('miku') || searchQuery.includes('二次元') || searchQuery.includes('动漫')) {
        selectedCat = 'anime';
      } else if (searchQuery.includes('莫奈') || searchQuery.includes('梵高') || searchQuery.includes('油画') || searchQuery.includes('名画') || searchQuery.includes('国画')) {
        selectedCat = 'art';
      } else {
        selectedCat = 'anime';
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
      searchResult = getAIFallback(searchQuery, selectedCat);
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

    const imgResponse = await fetch(searchResult.sourceUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': searchResult.sourceUrl
      }
    });

    if (!imgResponse.ok) {
      throw new Error(`Failed to download image from source: HTTP ${imgResponse.status}`);
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
