console.log("PerfectSky Perfect Post script loaded.");

const statusEl = document.getElementById("status");
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

    const posts = data.feed;

    const stats = analyze(posts);

    perfectEl.textContent = generatePerfectPost(stats);

    statusEl.textContent = "Done";

  } catch (error) {
    console.error(error);
    statusEl.textContent = "Error loading feed";
    perfectEl.textContent = "Could not calculate perfect post.\n\n" + error.message;
  }
}

function analyze(posts) {
  let totalChars = 0;
  let totalWords = 0;
  let totalHashtags = 0;

  let withImage = 0;
  let withVideo = 0;
  let withLinks = 0;

  for (const item of posts) {
    const post = item.post;
    const text = post.record.text || "";

    totalChars += text.length;

    const words = text.trim().split(/\s+/).filter(Boolean);
    totalWords += words.length;

    const hashtags = text.match(/#\w+/g) || [];
    totalHashtags += hashtags.length;

    const embedType = post.embed?.$type || "";

    if (embedType.includes("images")) withImage++;
    if (embedType.includes("video")) withVideo++;

    const hasLink =
      text.includes("http://") ||
      text.includes("https://") ||
      embedType.includes("external");

    if (hasLink) withLinks++;
  }

  const total = posts.length;

  return {
    avgChars: Math.round(totalChars / total),
    avgWords: Math.round(totalWords / total),
    avgHashtags: totalHashtags / total,
    imagePct: Math.round((withImage / total) * 100),
    videoPct: Math.round((withVideo / total) * 100),
    linksPct: Math.round((withLinks / total) * 100),
  };
}

function generatePerfectPost(stats) {
  let lines = [];

  lines.push("Perfect Post of the Day:");
  lines.push(`• ${stats.avgChars} characters`);
  lines.push(`• ${stats.avgWords} words`);

  if (stats.imagePct >= 50) lines.push("• Image: yes");
  if (stats.videoPct >= 50) lines.push("• Video: yes");
  if (stats.linksPct >= 50) lines.push("• Links: yes");
  if (stats.avgHashtags >= 0.5) lines.push("• Hashtags: yes");

  return lines.join("\n");
}
