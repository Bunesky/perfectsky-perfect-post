console.log("PerfectSky Perfect Post script loaded.");

const statusEl = document.getElementById("status");
const statsEl = document.getElementById("stats");
const perfectEl = document.getElementById("perfect");

// Trending feed (MIT published)
const API_URL =
  "https://public.api.bsky.app/xrpc/app.bsky.feed.getFeed?feed=" +
  encodeURIComponent("at://did:plc:jlyxq2frdkpnkwhzldvmjlrv/app.bsky.feed.generator/aaadxgnfze66k");

init();

async function init() {
  try {
    statusEl.textContent = "Loading Bluesky feed...";

    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("HTTP Error " + response.status);

    const data = await response.json();
    if (!data.feed || data.feed.length === 0)
      throw new Error("Feed returned empty");

    // CORRECCIÓN IMPORTANTE:
    // getFeed devuelve item.post YA COMPLETO
    const posts = data.feed.map(item => item.post);

    const stats = analyze(posts);

    statsEl.textContent = generateStats(stats);
    perfectEl.textContent = generatePerfectPost(stats);

    statusEl.textContent = "Done";

  } catch (error) {
    console.error(error);
    statusEl.textContent = "Error loading feed";
    statsEl.textContent = "Could not analyze feed.\n\n" + error.message;
    perfectEl.textContent = "";
  }
}

function analyze(posts) {
  let totalChars = 0;
  let totalWords = 0;
  let totalHashtags = 0;

  let withImage = 0;
  let withVideo = 0;
  let noMedia = 0;
  let withLinks = 0;

  let replies = 0;
  let originals = 0;
  let quotes = 0;

  for (const post of posts) {
    const text = post.record.text || "";

    totalChars += text.length;

    const words = text.trim().split(/\s+/).filter(Boolean);
    totalWords += words.length;

    // Regex corregido
    const hashtags = text.match(/#[a-zA-Z][a-zA-Z0-9_]+/g) || [];
    totalHashtags += hashtags.length;

    const embedType = post.embed?.$type || "";

    if (embedType.includes("images")) withImage++;
    else if (embedType.includes("video")) withVideo++;
    else noMedia++;

    const hasLink =
      text.includes("http://") ||
      text.includes("https://") ||
      embedType.includes("external");

    if (hasLink) withLinks++;

    if (post.reply) replies++;
    else if (embedType.includes("record")) quotes++;
    else originals++;
  }

  const total = posts.length;

  return {
    total,
    avgChars: Math.round(totalChars / total),
    avgWords: Math.round(totalWords / total),
    avgHashtags: (totalHashtags / total).toFixed(2), // ← CORREGIDO
    imagePct: Math.round((withImage / total) * 100),
    videoPct: Math.round((withVideo / total) * 100),
    noMediaPct: Math.round((noMedia / total) * 100),
    linksPct: Math.round((withLinks / total) * 100),
    repliesPct: Math.round((replies / total) * 100),
    originalsPct: Math.round((originals / total) * 100),
    quotesPct: Math.round((quotes / total) * 100),
  };
}

function generateStats(s) {
  return `
-----------------------------------------
|   Style Analysis                      |
-----------------------------------------

Results:
• Posts analyzed: ${s.total}
• Avg characters: ${s.avgChars}
• Avg words: ${s.avgWords}
• Avg hashtags: ${s.avgHashtags}
• % with image: ${s.imagePct}%
• % with video: ${s.videoPct}%
• % without media: ${s.noMediaPct}%
• % with links: ${s.linksPct}%
• % replies: ${s.repliesPct}%
• % originals: ${s.originalsPct}%
• % quotes: ${s.quotesPct}%
`;
}

function generatePerfectPost(s) {
  let lines = [];

  lines.push("Perfect Post of the Day:");
  lines.push(`• ${s.avgChars} characters`);
  lines.push(`• ${s.avgWords} words`);

  if (s.imagePct >= 50) lines.push("• Image: yes");
  if (s.videoPct >= 50) lines.push("• Video: yes");
  if (s.linksPct >= 50) lines.push("• Links: yes");
  if (parseFloat(s.avgHashtags) >= 1) lines.push("• Hashtags: yes");

  return lines.join("\n");
}
