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

// -------------------------------------------------------------
// UNIVERSAL MULTI-MODAL RAG TAXONOMY DATABASE (~250+ ENTITIES)
// -------------------------------------------------------------
const UNIVERSAL_TAG_DATABASE = [
  // -------------------------
  // 1. VOCALOID (Cat 4 & 3)
  // -------------------------
  { name: "kagamine_rin", category: 4, gender: 'female', post_count: 58200, copyright: "vocaloid", aliases: ["镜音铃", "镜音双子", "铃酱", "rin", "kagami_rin", "rin_kagamine", "kagaminerin"] },
  { name: "kagamine_len", category: 4, gender: 'male', post_count: 42100, copyright: "vocaloid", aliases: ["镜音连", "连酱", "len", "len_kagamine"] },
  { name: "hatsune_miku", category: 4, gender: 'female', post_count: 245000, copyright: "vocaloid", aliases: ["初音未来", "初音", "miku", "miku_hatsune", "初音ミク", "雪初音", "snow_miku"] },
  { name: "megurine_luka", category: 4, gender: 'female', post_count: 36000, copyright: "vocaloid", aliases: ["巡音露卡", "巡音流歌", "luka", "luka_megurine"] },
  { name: "kaito", category: 4, gender: 'male', post_count: 22000, copyright: "vocaloid", aliases: ["大哥", "kaito"] },
  { name: "meiko_(vocaloid)", category: 4, gender: 'female', post_count: 18000, copyright: "vocaloid", aliases: ["meiko", "大姐"] },
  { name: "vocaloid", category: 3, post_count: 310000, aliases: ["v家", "vocaloid系列"] },

  // -------------------------
  // 2. RE:ZERO (Cat 4 & 3)
  // -------------------------
  { name: "rem_(re:zero)", category: 4, gender: 'female', post_count: 61000, copyright: "re:zero_kara_hajimeru_isekai_seikatsu", aliases: ["雷姆", "蕾姆", "rem", "rem re:zero", "rem re0", "rem_(re_zero)", "レム"] },
  { name: "ram_(re:zero)", category: 4, gender: 'female', post_count: 24000, copyright: "re:zero_kara_hajimeru_isekai_seikatsu", aliases: ["拉姆", "ram", "ram re:zero", "ラム"] },
  { name: "emilia_(re:zero)", category: 4, gender: 'female', post_count: 31000, copyright: "re:zero_kara_hajimeru_isekai_seikatsu", aliases: ["爱蜜莉雅", "艾米莉亚", "emilia", "emilia re:zero"] },
  { name: "echidna_(re:zero)", category: 4, gender: 'female', post_count: 9800, copyright: "re:zero_kara_hajimeru_isekai_seikatsu", aliases: ["艾姬多娜", "强欲魔女", "echidna"] },
  { name: "beatrice_(re:zero)", category: 4, gender: 'female', post_count: 8500, copyright: "re:zero_kara_hajimeru_isekai_seikatsu", aliases: ["贝蒂", "碧翠丝", "beatrice"] },
  { name: "re:zero_kara_hajimeru_isekai_seikatsu", category: 3, post_count: 95000, aliases: ["re0", "从零开始的异世界生活", "re:zero"] },

  // -------------------------
  // 3. DATE A LIVE (Cat 4 & 3)
  // -------------------------
  { name: "tokisaki_kurumi", category: 4, gender: 'female', post_count: 28500, copyright: "date_a_live", aliases: ["时崎狂三", "狂三", "三三", "kurumi", "kurumi_tokisaki", "约战狂三", "约战 狂三"] },
  { name: "yatogami_tohka", category: 4, gender: 'female', post_count: 14200, copyright: "date_a_live", aliases: ["夜刀神十香", "十香", "tohka"] },
  { name: "tobiichi_origami", category: 4, gender: 'female', post_count: 9100, copyright: "date_a_live", aliases: ["鸢一折纸", "折纸", "origami"] },
  { name: "itsuka_kotori", category: 4, gender: 'female', post_count: 8800, copyright: "date_a_live", aliases: ["五河琴里", "琴里", "kotori"] },
  { name: "date_a_live", category: 3, post_count: 48000, aliases: ["约战", "约会大作战", "dal"] },

  // -------------------------
  // 4. GENSHIN IMPACT (Cat 4 & 3)
  // -------------------------
  { name: "furina_(genshin_impact)", category: 4, gender: 'female', post_count: 32000, copyright: "genshin_impact", aliases: ["芙宁娜", "水神", "芙芙", "furina", "focalors"] },
  { name: "raiden_shogun_(genshin_impact)", category: 4, gender: 'female', post_count: 51000, copyright: "genshin_impact", aliases: ["雷电将军", "雷神", "影", "raiden shogun", "ei"] },
  { name: "nahida_(genshin_impact)", category: 4, gender: 'female', post_count: 24000, copyright: "genshin_impact", aliases: ["纳西妲", "草神", "草王", "nahida"] },
  { name: "hu_tao_(genshin_impact)", category: 4, gender: 'female', post_count: 46000, copyright: "genshin_impact", aliases: ["胡桃", "堂主", "hutao", "hu tao"] },
  { name: "ganyu_(genshin_impact)", category: 4, gender: 'female', post_count: 41000, copyright: "genshin_impact", aliases: ["甘雨", "椰羊", "ganyu"] },
  { name: "kamisato_ayaka", category: 4, gender: 'female', post_count: 26000, copyright: "genshin_impact", aliases: ["神里绫华", "绫华", "ayaka"] },
  { name: "keqing_(genshin_impact)", category: 4, gender: 'female', post_count: 39000, copyright: "genshin_impact", aliases: ["刻晴", "阿晴", "keqing"] },
  { name: "zhongli_(genshin_impact)", category: 4, gender: 'male', post_count: 34000, copyright: "genshin_impact", aliases: ["钟离", "岩王帝君", "帝君", "zhongli"] },
  { name: "genshin_impact", category: 3, post_count: 420000, aliases: ["原神", "genshin", "ys"] },

  // -------------------------
  // 5. HONKAI: STAR RAIL (Cat 4 & 3)
  // -------------------------
  { name: "firefly_(honkai:_star_rail)", category: 4, gender: 'female', post_count: 28000, copyright: "honkai:_star_rail", aliases: ["流萤", "萨姆", "firefly"] },
  { name: "kafka_(honkai:_star_rail)", category: 4, gender: 'female', post_count: 22000, copyright: "honkai:_star_rail", aliases: ["卡芙卡", "妈妈", "kafka"] },
  { name: "march_7th_(honkai:_star_rail)", category: 4, gender: 'female', post_count: 19000, copyright: "honkai:_star_rail", aliases: ["三月七", "三月", "march 7th"] },
  { name: "acheron_(honkai:_star_rail)", category: 4, gender: 'female', post_count: 18000, copyright: "honkai:_star_rail", aliases: ["黄泉", "acheron"] },
  { name: "honkai:_star_rail", category: 3, post_count: 98000, aliases: ["崩坏星穹铁道", "星铁", "hsr"] },

  // -------------------------
  // 6. FATE SERIES (Cat 4 & 3)
  // -------------------------
  { name: "artoria_pendragon_(saber)", category: 4, gender: 'female', post_count: 67000, copyright: "fate/stay_night", aliases: ["saber", "阿尔托莉雅", "呆毛王", "吾王", "artoria", "altria"] },
  { name: "tohsaka_rin", category: 4, gender: 'female', post_count: 28000, copyright: "fate/stay_night", aliases: ["远坂凛", "凛", "rin tohsaka"] },
  { name: "matou_sakura", category: 4, gender: 'female', post_count: 16000, copyright: "fate/stay_night", aliases: ["间桐樱", "樱", "sakura matou"] },
  { name: "mash_kyrielight", category: 4, gender: 'female', post_count: 39000, copyright: "fate/grand_order", aliases: ["玛修", "学妹", "mash", "mashu"] },
  { name: "scathach_(fate)", category: 4, gender: 'female', post_count: 23000, copyright: "fate/grand_order", aliases: ["斯卡哈", "师匠", "scathach"] },
  { name: "fate/stay_night", category: 3, post_count: 140000, aliases: ["fate", "命运之夜", "fsn"] },
  { name: "fate/grand_order", category: 3, post_count: 210000, aliases: ["fgo", "命运冠位指定"] },

  // -------------------------
  // 7. FRIEREN & BOCCHI & EVA (Cat 4 & 3)
  // -------------------------
  { name: "frieren", category: 4, gender: 'female', post_count: 29000, copyright: "sousou_no_frieren", aliases: ["芙莉莲", "葬送的芙莉莲", "frieren"] },
  { name: "fern_(sousou_no_frieren)", category: 4, gender: 'female', post_count: 18000, copyright: "sousou_no_frieren", aliases: ["费伦", "肥伦", "fern"] },
  { name: "sousou_no_frieren", category: 3, post_count: 38000, aliases: ["葬送的芙莉莲", "芙莉莲作品"] },
  { name: "gotou_hitori", category: 4, gender: 'female', post_count: 22000, copyright: "bocchi_the_rock!", aliases: ["后藤一里", "波奇酱", "波奇", "bocchi", "hitori gotoh"] },
  { name: "ijichi_nijika", category: 4, gender: 'female', post_count: 11000, copyright: "bocchi_the_rock!", aliases: ["伊地知虹夏", "大天使", "nijika"] },
  { name: "yamada_ryo", category: 4, gender: 'female', post_count: 12000, copyright: "bocchi_the_rock!", aliases: ["山田凉", "凉", "ryo yamada"] },
  { name: "kita_ikuyo", category: 4, gender: 'female', post_count: 13500, copyright: "bocchi_the_rock!", aliases: ["喜多郁代", "喜多", "kita ikuyo"] },
  { name: "bocchi_the_rock!", category: 3, post_count: 42000, aliases: ["孤独摇滚", "btr"] },
  { name: "ayanami_rei", category: 4, gender: 'female', post_count: 28000, copyright: "neon_genesis_evangelion", aliases: ["绫波丽", "丽", "rei ayanami"] },
  { name: "asuka_langley_souryuu", category: 4, gender: 'female', post_count: 34000, copyright: "neon_genesis_evangelion", aliases: ["明日香", "惣流明日香", "asuka"] },
  { name: "neon_genesis_evangelion", category: 3, post_count: 58000, aliases: ["eva", "新世纪福音战士"] },

  // -------------------------
  // 8. ANIME COSTUMES & STYLES (Cat 0)
  // -------------------------
  { name: "wedding_dress", category: 0, post_count: 78000, aliases: ["婚纱", "白无垢", "结婚礼服", "wedding dress"] },
  { name: "swimsuit", category: 0, post_count: 210000, aliases: ["泳装", "比基尼", "水着", "swimsuit", "bikini"] },
  { name: "maid", category: 0, post_count: 140000, aliases: ["女仆", "女仆装", "maid"] },
  { name: "kimono", category: 0, post_count: 98000, aliases: ["和服", "浴衣", "yukata", "kimono"] },
  { name: "cheongsam", category: 0, post_count: 45000, aliases: ["旗袍", "cheongsam", "qipao"] },
  { name: "school_uniform", category: 0, post_count: 185000, aliases: ["水手服", "校服", "制服", "school uniform", "sailor uniform"] },
  { name: "cat_ears", category: 0, post_count: 115000, aliases: ["猫耳", "兽耳", "nekomimi", "cat ears"] },
  { name: "cyberpunk", category: 0, post_count: 15000, aliases: ["赛博朋克", "机能风", "机械", "cyberpunk", "cyber"] },
  { name: "full_body", category: 0, post_count: 450000, aliases: ["全身", "立绘", "全身立绘", "full_body", "standing"] },
  { name: "smile", category: 0, post_count: 980000, aliases: ["微笑", "笑容", "smile", "happy"] },
  { name: "night", category: 0, post_count: 120000, aliases: ["夜景", "星空", "夜晚", "night", "starry sky"] },
  { name: "winter", category: 0, post_count: 65000, aliases: ["雪景", "冬天", "雪", "winter", "snow"] },

  // -------------------------
  // 9. WORLD LANDMARKS & NATURE PHOTOGRAPHY (Cat 5)
  // -------------------------
  { name: "Eiffel Tower", category: 5, canonical_en: "Eiffel Tower", post_count: 85000, aliases: ["埃菲尔铁塔", "巴黎铁塔", "铁塔", "eiffel", "tour eiffel"], negatives: ["-telescope", "-ticket", "-stamp", "-souvenir", "-blueprint", "-coin", "-model"] },
  { name: "Mount Fuji", category: 5, canonical_en: "Mount Fuji", post_count: 92000, aliases: ["富士山", "富岳", "fuji", "fujisan", "mt fuji"], negatives: ["-stamp", "-coin", "-postcard", "-map"] },
  { name: "Great Wall of China", category: 5, canonical_en: "Great Wall of China", post_count: 68000, aliases: ["万里长城", "长城", "八达岭长城", "great wall", "great wall of china"], negatives: ["-stamp", "-ticket", "-coin", "-souvenir", "-map"] },
  { name: "Statue of Liberty", category: 5, canonical_en: "Statue of Liberty", post_count: 54000, aliases: ["自由女神像", "自由女神", "statue of liberty"], negatives: ["-stamp", "-souvenir", "-coin", "-postcard"] },
  { name: "Taj Mahal", category: 5, canonical_en: "Taj Mahal", post_count: 47000, aliases: ["泰姬陵", "taj mahal"], negatives: ["-stamp", "-ticket", "-coin", "-postcard"] },
  { name: "Pyramids of Giza", category: 5, canonical_en: "Pyramids of Giza", post_count: 61000, aliases: ["金字塔", "吉萨金字塔", "埃及金字塔", "pyramids", "giza pyramids"], negatives: ["-stamp", "-coin", "-map"] },
  { name: "Aurora Borealis", category: 5, canonical_en: "Aurora Borealis", post_count: 88000, aliases: ["极光", "北极光", "欧若拉", "aurora", "northern lights"], negatives: ["-diagram", "-map", "-stamp"] },
  { name: "Milky Way Galaxy", category: 5, canonical_en: "Milky Way Galaxy", post_count: 73000, aliases: ["银河", "银河系", "星空银河", "milky way"], negatives: ["-diagram", "-map", "-illustration"] },
  { name: "Colosseum", category: 5, canonical_en: "Colosseum", post_count: 39000, aliases: ["罗马斗兽场", "斗兽场", "colosseum", "colosseo"], negatives: ["-stamp", "-coin", "-ticket"] },
  { name: "Grand Canyon", category: 5, canonical_en: "Grand Canyon", post_count: 52000, aliases: ["大峡谷", "科罗拉多大峡谷", "grand canyon"], negatives: ["-map", "-diagram", "-stamp"] },
  { name: "Kyoto Fushimi Inari", category: 5, canonical_en: "Fushimi Inari-taisha", post_count: 43000, aliases: ["伏见稻荷大社", "千本鸟居", "京都鸟居", "fushimi inari"], negatives: ["-stamp", "-map"] },
  { name: "Hallstatt", category: 5, canonical_en: "Hallstatt", post_count: 29000, aliases: ["哈尔施塔特", "哈修塔特", "hallstatt"], negatives: ["-stamp", "-postcard"] },
  { name: "Santorini", category: 5, canonical_en: "Santorini", post_count: 41000, aliases: ["圣托里尼", "圣托里尼岛", "santorini", "oia"], negatives: ["-stamp", "-map", "-ferry"] },
  { name: "Matterhorn", category: 5, canonical_en: "Matterhorn", post_count: 36000, aliases: ["马特洪峰", "马特峰", "matterhorn"], negatives: ["-chocolate", "-wrapper", "-stamp"] },
  { name: "Yellowstone National Park", category: 5, canonical_en: "Yellowstone National Park", post_count: 44000, aliases: ["黄石公园", "黄石国家公园", "yellowstone"], negatives: ["-map", "-sign", "-stamp"] },
  { name: "Jiuzhaigou Valley", category: 5, canonical_en: "Jiuzhaigou Valley", post_count: 27000, aliases: ["九寨沟", "九寨沟国家公园", "jiuzhaigou"], negatives: ["-ticket", "-map", "-stamp"] },
  { name: "Zhangjiajie", category: 5, canonical_en: "Zhangjiajie", post_count: 23000, aliases: ["张家界", "天门山", "阿凡达山", "zhangjiajie"], negatives: ["-map", "-stamp"] },
  { name: "Sydney Opera House", category: 5, canonical_en: "Sydney Opera House", post_count: 38000, aliases: ["悉尼歌剧院", "sydney opera house"], negatives: ["-stamp", "-ticket", "-coin"] },
  { name: "Venice Canals", category: 5, canonical_en: "Grand Canal (Venice)", post_count: 35000, aliases: ["威尼斯水城", "威尼斯大运河", "venice", "grand canal"], negatives: ["-stamp", "-map", "-postcard"] },
  { name: "Big Ben", category: 5, canonical_en: "Big Ben", post_count: 31000, aliases: ["大本钟", "伊丽莎白塔", "big ben"], negatives: ["-stamp", "-coin", "-souvenir"] },

  // -------------------------
  // 10. FINE ART MASTERPIECES & ARTISTS (Cat 6)
  // -------------------------
  { name: "Water Lilies", category: 6, artist: "Claude Monet", post_count: 65000, aliases: ["睡莲", "莫奈 睡莲", "莫奈睡莲", "water lilies monet", "nympheas"], query_terms: ['"Claude Monet"', '"Water Lilies"'] },
  { name: "The Starry Night", category: 6, artist: "Vincent van Gogh", post_count: 98000, aliases: ["星空", "梵高 星空", "星夜", "starry night", "starry night van gogh"], query_terms: ['"Vincent van Gogh"', '"The Starry Night"'] },
  { name: "Sunflowers", category: 6, artist: "Vincent van Gogh", post_count: 54000, aliases: ["向日葵", "梵高 向日葵", "sunflowers van gogh"], query_terms: ['"Vincent van Gogh"', '"Sunflowers"'] },
  { name: "Almond Blossom", category: 6, artist: "Vincent van Gogh", post_count: 32000, aliases: ["盛开的杏花", "杏花 梵高", "梵高 杏花", "almond blossom"], query_terms: ['"Vincent van Gogh"', '"Almond Blossom"'] },
  { name: "The Great Wave off Kanagawa", category: 6, artist: "Katsushika Hokusai", post_count: 82000, aliases: ["神奈川冲浪里", "浮世绘 冲浪", "葛饰北斋 神奈川", "the great wave", "hokusai wave"], query_terms: ['"Great Wave off Kanagawa"'] },
  { name: "Mona Lisa", category: 6, artist: "Leonardo da Vinci", post_count: 91000, aliases: ["蒙娜丽莎", "达芬奇 蒙娜丽莎", "mona lisa"], query_terms: ['"Mona Lisa"', '"Leonardo da Vinci"'] },
  { name: "The Last Supper", category: 6, artist: "Leonardo da Vinci", post_count: 48000, aliases: ["最后的晚餐", "达芬奇 最后的晚餐", "the last supper"], query_terms: ['"The Last Supper"', '"Leonardo da Vinci"'] },
  { name: "Girl with a Pearl Earring", category: 6, artist: "Johannes Vermeer", post_count: 73000, aliases: ["戴珍珠耳环的少女", "珍珠耳环少女", "维米尔 少女", "girl with a pearl earring"], query_terms: ['"Girl with a Pearl Earring"'] },
  { name: "The Kiss", category: 6, artist: "Gustav Klimt", post_count: 62000, aliases: ["吻 克里姆特", "克里姆特 吻", "the kiss klimt"], query_terms: ['"Gustav Klimt"', '"The Kiss"'] },
  { name: "The Scream", category: 6, artist: "Edvard Munch", post_count: 58000, aliases: ["呐喊", "蒙克 呐喊", "the scream munch"], query_terms: ['"Edvard Munch"', '"The Scream"'] },
  { name: "The Birth of Venus", category: 6, artist: "Sandro Botticelli", post_count: 51000, aliases: ["维纳斯的诞生", "波提切利 维纳斯", "the birth of venus"], query_terms: ['"The Birth of Venus"', '"Botticelli"'] },
  { name: "Wanderer above the Sea of Fog", category: 6, artist: "Caspar David Friedrich", post_count: 37000, aliases: ["雾海上的旅人", "弗里德里希 雾海", "wanderer above the sea of fog"], query_terms: ['"Wanderer above the Sea of Fog"'] },
  { name: "The Persistence of Memory", category: 6, artist: "Salvador Dalí", post_count: 46000, aliases: ["记忆的永恒", "达利 软钟", "persistence of memory"], query_terms: ['"Persistence of Memory"', '"Dali"'] },
  { name: "The Creation of Adam", category: 6, artist: "Michelangelo", post_count: 42000, aliases: ["创世纪", "创造亚当", "米开朗基罗 创世纪", "the creation of adam"], query_terms: ['"The Creation of Adam"', '"Michelangelo"'] },
  { name: "The Night Watch", category: 6, artist: "Rembrandt", post_count: 35000, aliases: ["夜巡", "伦勃朗 夜巡", "the night watch rembrandt"], query_terms: ['"The Night Watch"', '"Rembrandt"'] },
  { name: "The Four Seasons", category: 6, artist: "Alphonse Mucha", post_count: 28000, aliases: ["穆夏 四季", "穆夏", "alphonse mucha"], query_terms: ['"Alphonse Mucha"'] }
];

/**
 * Universal Multi-Entity RAG Engine
 */
class MultiEntityRAGEngine {
  constructor(corpus) {
    this.corpus = corpus;
    this.aliasMap = new Map();
    this.initAliasMap();
  }

  initAliasMap() {
    this.corpus.forEach(item => {
      this.aliasMap.set(item.name.toLowerCase(), item);
      this.aliasMap.set(item.name.replace(/_/g, ' ').toLowerCase(), item);
      if (item.aliases) {
        item.aliases.forEach(alias => {
          this.aliasMap.set(alias.toLowerCase().trim(), item);
        });
      }
    });
  }

  levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  tokenizeQuery(query) {
    const segments = query
      .trim()
      .split(/[\s+,、和与跟x×&]+/i)
      .map(s => s.trim())
      .filter(Boolean);
    return segments.length > 0 ? segments : [query.trim()];
  }

  searchSegment(seg) {
    const clean = seg.toLowerCase();
    if (this.aliasMap.has(clean)) {
      return [{ item: this.aliasMap.get(clean), matchType: 'exact_alias', score: 10.0 }];
    }

    const hits = [];
    this.corpus.forEach(item => {
      let score = 0;
      const targetName = item.name.toLowerCase();
      const targetClean = targetName.replace(/_/g, ' ');
      const aliases = (item.aliases || []).map(a => a.toLowerCase());

      if (targetClean === clean || aliases.includes(clean)) {
        score += 8.0;
      } else if (targetClean.includes(clean) || aliases.some(a => a.includes(clean))) {
        score += 4.0;
      } else if (clean.length >= 3) {
        const dist = this.levenshtein(clean, targetClean);
        if (dist <= 2) {
          score += (3.0 - dist);
        }
      }

      if (score > 0) {
        const finalScore = score + Math.log10(item.post_count || 1) * 0.2;
        hits.push({ item, score: finalScore });
      }
    });

    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, 3);
  }

  processQuery(rawQuery) {
    const segments = this.tokenizeQuery(rawQuery);
    const charSlots = [];
    const copyrightSlots = [];
    const generalSlots = [];
    const landmarkSlots = [];
    const artSlots = [];

    segments.forEach(seg => {
      const hits = this.searchSegment(seg);
      if (hits.length > 0) {
        const top = hits[0].item;
        if (top.category === 4 && !charSlots.some(c => c.name === top.name)) {
          charSlots.push(top);
        } else if (top.category === 3 && !copyrightSlots.some(c => c.name === top.name)) {
          copyrightSlots.push(top);
        } else if (top.category === 0 && !generalSlots.some(g => g.name === top.name)) {
          generalSlots.push(top);
        } else if (top.category === 5 && !landmarkSlots.some(l => l.name === top.name)) {
          landmarkSlots.push(top);
        } else if (top.category === 6 && !artSlots.some(a => a.name === top.name)) {
          artSlots.push(top);
        }
      }
    });

    // Determine domain category automatically
    let detectedDomain = 'auto';
    if (artSlots.length > 0) {
      detectedDomain = 'art';
    } else if (landmarkSlots.length > 0) {
      detectedDomain = 'photo';
    } else if (charSlots.length > 0 || copyrightSlots.length > 0 || generalSlots.length > 0) {
      detectedDomain = 'anime';
    }

    // Smart anime quantifiers
    const charNames = charSlots.map(c => c.name);
    const generalNames = generalSlots.map(g => g.name);

    let quantifier = '';
    if (charSlots.length === 1) {
      if (!generalNames.includes('solo')) {
        quantifier = 'solo';
      }
    } else if (charSlots.length === 2) {
      const allFemale = charSlots.every(c => c.gender === 'female');
      const allMale = charSlots.every(c => c.gender === 'male');
      if (allFemale) quantifier = '2girls';
      else if (allMale) quantifier = '2boys';
      else quantifier = '1girl 1boy';
    } else if (charSlots.length >= 3) {
      quantifier = 'multiple_girls';
    }

    const finalTokens = [...charNames];
    if (quantifier) finalTokens.push(quantifier);
    finalTokens.push(...generalNames);

    const booruQuery = finalTokens.length > 0 ? finalTokens.join(' ') : rawQuery.trim().replace(/\s+/g, '+');

    return {
      charSlots,
      copyrightSlots,
      generalSlots,
      landmarkSlots,
      artSlots,
      detectedDomain,
      quantifier,
      booruQuery
    };
  }
}

const ragEngine = new MultiEntityRAGEngine(UNIVERSAL_TAG_DATABASE);

/**
 * 1. Anime Search (RAG Enhanced Safebooru -> Pixiv Lolicon -> Yande.re)
 */
async function searchAnime(query, ragResult) {
  const booruTags = (ragResult && ragResult.booruQuery) ? ragResult.booruQuery : query;
  console.log(`[Anime RAG Grounding] Input: "${query}" ➔ Tag Query: "${booruTags}"`);

  // Source 1: Safebooru (Accurate SFW Database - Random Selection from Top Pool)
  try {
    const safeUrl = `https://safebooru.org/index.php?page=dapi&s=post&q=index&json=1&limit=30&tags=${encodeURIComponent(booruTags)}`;
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
          const validPosts = posts.filter(p => p.image && !p.image.endsWith('.mp4') && !p.image.endsWith('.webm'));
          const pool = validPosts.length > 0 ? validPosts : posts;
          const selected = pool[Math.floor(Math.random() * pool.length)];

          let imgUrl = '';
          if (selected.file_url && typeof selected.file_url === 'string' && selected.file_url.startsWith('http')) {
            imgUrl = selected.file_url;
          } else if (selected.sample_url && typeof selected.sample_url === 'string' && selected.sample_url.startsWith('http')) {
            imgUrl = selected.sample_url;
          } else {
            imgUrl = `https://safebooru.org/images/${selected.directory}/${selected.image}`;
          }
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
    console.warn('Safebooru search failed, trying Pixiv/Yande:', err.message);
  }

  // Source 2: Pixiv Lolicon Open CDN (SFW Masterpieces - Random Selection)
  try {
    const cleanKw = (ragResult && ragResult.charSlots && ragResult.charSlots.length > 0)
      ? ragResult.charSlots.map(c => c.name.replace(/_\(.*\)/, '').replace(/_/g, ' ')).join(' ')
      : query;
    const loliUrl = `https://api.lolicon.app/setu/v2?r18=0&keyword=${encodeURIComponent(cleanKw)}&num=12`;
    const res = await fetchWithTimeout(loliUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    }, 3500);

    if (res.ok) {
      const data = await res.json();
      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const selected = data.data[Math.floor(Math.random() * data.data.length)];
        const imgUrl = selected.urls.original || selected.urls.regular;
        if (imgUrl) {
          return {
            title: selected.title || query,
            author: `Pixiv (画师: ${selected.author})`,
            sourceUrl: imgUrl,
            referer: 'https://i.pixiv.re/'
          };
        }
      }
    }
  } catch (err) {
    console.warn('Pixiv search failed, trying Yande.re:', err.message);
  }

  // Source 3: Yande.re (Safe & High Res - Random Selection)
  try {
    const yandeUrl = `https://yande.re/post.json?tags=${encodeURIComponent(booruTags.replace(/\s+/g, '+'))}+rating:safe&limit=20`;
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
          const selected = posts[Math.floor(Math.random() * posts.length)];
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
    console.warn('Yande.re search failed:', err.message);
  }

  return null;
}

/**
 * 2. Fine Art Search (RAG Grounded Wikimedia Commons / Cleveland Museum)
 */
async function searchFineArt(query, ragResult) {
  let wikiSearchSyntax = '';
  if (ragResult && ragResult.artSlots && ragResult.artSlots.length > 0) {
    const art = ragResult.artSlots[0];
    if (art.query_terms && art.query_terms.length > 0) {
      wikiSearchSyntax = `${art.query_terms.join(' ')} filetype:bitmap`;
    } else {
      wikiSearchSyntax = `"${art.artist || ''}" "${art.name}" filetype:bitmap`.trim();
    }
  } else {
    wikiSearchSyntax = `"${query}" filetype:bitmap`;
  }

  console.log(`[Art RAG Grounding] Input: "${query}" ➔ Wikimedia Search: "${wikiSearchSyntax}"`);

  // Source 1: Wikimedia Commons Masterpiece Collection (Random Selection)
  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(wikiSearchSyntax)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1600&format=json`;
    const res = await fetchWithTimeout(wikiUrl, {
      headers: {
        'User-Agent': 'EpaperVisualHubBot/1.0 (https://epaper-image-service.vercel.app; admin@maza-ai.com)'
      }
    }, 4000);

    if (res.ok) {
      const data = await res.json();
      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages);
        const validPages = pages.filter(page => {
          if (page.imageinfo && page.imageinfo[0]) {
            const info = page.imageinfo[0];
            const imgUrl = info.thumburl || info.url;
            return imgUrl && !imgUrl.endsWith('.svg') && !imgUrl.endsWith('.tif') && !imgUrl.endsWith('.tiff');
          }
          return false;
        });

        if (validPages.length > 0) {
          const selectedPage = validPages[Math.floor(Math.random() * validPages.length)];
          const info = selectedPage.imageinfo[0];
          const imgUrl = info.thumburl || info.url;
          return {
            title: selectedPage.title ? selectedPage.title.replace(/^File:/, '') : query,
            author: (ragResult && ragResult.artSlots && ragResult.artSlots[0] && ragResult.artSlots[0].artist) || 'Wikimedia Commons Masterpiece Collection',
            sourceUrl: imgUrl,
            referer: 'https://commons.wikimedia.org/'
          };
        }
      }
    }
  } catch (err) {
    console.warn('Wikimedia art search failed, trying Cleveland:', err.message);
  }

  // Source 2: Cleveland Museum of Art Open Access API
  try {
    const cleanKw = (ragResult && ragResult.artSlots && ragResult.artSlots[0]) ? ragResult.artSlots[0].name : query;
    const clevelandUrl = `https://openaccess-api.clevelandart.org/api/artworks/?q=${encodeURIComponent(cleanKw)}&has_image=1&limit=8`;
    const res = await fetchWithTimeout(clevelandUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
    }, 3500);

    if (res.ok) {
      const data = await res.json();
      if (data && data.data && data.data.length > 0) {
        const validItems = data.data.filter(item => item.images && item.images.web && item.images.web.url && item.images.web.url.startsWith('http'));
        if (validItems.length > 0) {
          const item = validItems[Math.floor(Math.random() * validItems.length)];
          return {
            title: item.title || query,
            author: (item.creators && item.creators[0] && item.creators[0].description) || 'Cleveland Museum Collection',
            sourceUrl: item.images.web.url,
            referer: 'https://www.clevelandart.org/'
          };
        }
      }
    }
  } catch (err) {
    console.warn('Cleveland Museum search failed:', err.message);
  }

  return null;
}

/**
 * 3. Modern Photography / Landmarks Search (RAG Grounded Wikimedia Commons)
 */
async function searchPhoto(query, ragResult) {
  let photoSearchSyntax = '';
  if (ragResult && ragResult.landmarkSlots && ragResult.landmarkSlots.length > 0) {
    const landmark = ragResult.landmarkSlots[0];
    const canonicalName = landmark.canonical_en || landmark.name;
    const negs = (landmark.negatives || []).join(' ');
    photoSearchSyntax = `"${canonicalName}" filetype:bitmap ${negs}`.trim();
  } else {
    photoSearchSyntax = `"${query}" filetype:bitmap -stamp -ticket -coin -diagram -map`;
  }

  console.log(`[Photo RAG Grounding] Input: "${query}" ➔ Wikimedia Search: "${photoSearchSyntax}"`);

  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(photoSearchSyntax)}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1600&format=json`;
    const res = await fetchWithTimeout(wikiUrl, {
      headers: {
        'User-Agent': 'EpaperVisualHubBot/1.0 (https://epaper-image-service.vercel.app; admin@maza-ai.com)'
      }
    }, 4000);

    if (res.ok) {
      const data = await res.json();
      if (data.query && data.query.pages) {
        const pages = Object.values(data.query.pages);
        const validPages = pages.filter(page => {
          if (page.imageinfo && page.imageinfo[0]) {
            const info = page.imageinfo[0];
            const imgUrl = info.thumburl || info.url;
            return imgUrl && !imgUrl.endsWith('.svg') && !imgUrl.endsWith('.tif') && !imgUrl.endsWith('.tiff');
          }
          return false;
        });

        if (validPages.length > 0) {
          const selectedPage = validPages[Math.floor(Math.random() * validPages.length)];
          const info = selectedPage.imageinfo[0];
          const imgUrl = info.thumburl || info.url;
          return {
            title: selectedPage.title ? selectedPage.title.replace(/^File:/, '') : query,
            author: 'Wikimedia Commons Photography',
            sourceUrl: imgUrl,
            referer: 'https://commons.wikimedia.org/'
          };
        }
      }
    }
  } catch (err) {
    console.warn('Wikimedia photo search failed:', err.message);
  }

  return null;
}

/**
 * 4. Fallback: High Quality AI Generation (Pollinations FLUX)
 */
async function getAIFallback(query, category) {
  let prompt = query;
  if (category === 'anime') {
    prompt = `masterpiece, official art, ${query}, clean lineart, vibrant anime wallpaper, high quality, 4:3 aspect ratio`;
  } else if (category === 'art') {
    prompt = `masterpiece, classic oil painting, ${query}, museum quality, elegant brush strokes, warm natural lighting, 4:3 aspect ratio`;
  } else {
    prompt = `award winning professional photography, ${query}, 8k resolution, crisp details, 4:3 aspect ratio`;
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');

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
      usage: '/api/search?q=埃菲尔铁塔&category=auto&w=1600&h=1200'
    });
  }

  const targetWidth = parseInt(w, 10) || 1600;
  const targetHeight = parseInt(h, 10) || 1200;
  const fitMode = ['cover', 'contain', 'fill', 'inside', 'outside'].includes(fit) ? fit : 'cover';
  const saturationBoost = parseFloat(sat) || 1.15;

  try {
    const t0 = Date.now();

    // Run Universal Multi-Modal RAG Engine
    const ragResult = ragEngine.processQuery(searchQuery);

    let selectedCat = rawCat;
    if (selectedCat === 'auto') {
      if (ragResult.detectedDomain !== 'auto') {
        selectedCat = ragResult.detectedDomain;
      } else {
        // Keyword heuristic fallback
        if (searchQuery.includes('莫奈') || searchQuery.includes('梵高') || searchQuery.includes('油画') || searchQuery.includes('名画') || searchQuery.includes('国画') || searchQuery.includes('画作') || searchQuery.includes('艺术')) {
          selectedCat = 'art';
        } else if (searchQuery.includes('铁塔') || searchQuery.includes('长城') || searchQuery.includes('风景') || searchQuery.includes('摄影') || searchQuery.includes('雪山') || searchQuery.includes('建筑') || searchQuery.includes('极光')) {
          selectedCat = 'photo';
        } else {
          selectedCat = 'anime';
        }
      }
    }

    let searchResult = null;

    if (selectedCat === 'anime') {
      searchResult = await searchAnime(searchQuery, ragResult);
    } else if (selectedCat === 'art') {
      searchResult = await searchFineArt(searchQuery, ragResult);
    } else if (selectedCat === 'photo') {
      searchResult = await searchPhoto(searchQuery, ragResult);
    }

    if (!searchResult) {
      searchResult = await getAIFallback(searchQuery, selectedCat);
    }

    if (json === '1' || json === 'true') {
      return res.status(200).json({
        success: true,
        query: searchQuery,
        category: selectedCat,
        detectedDomain: ragResult.detectedDomain,
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
    }, 6000);

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
    res.setHeader('X-Search-Category', selectedCat);
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

