// CaptionCraft — AI caption generator (vanilla JS, no build step)
const $ = (id) => document.getElementById(id);

const state = { image: null, mediaType: null, platform: "Instagram" };
const KEY_STORE = "captioncraft_key";

// ---------- setup ----------
$("year").textContent = new Date().getFullYear();
try {
  const saved = localStorage.getItem(KEY_STORE);
  if (saved) { $("apiKey").value = saved; $("remember").checked = true; }
} catch (_) { /* storage unavailable */ }

// ---------- image upload ----------
const drop = $("drop");
$("file").addEventListener("change", (e) => e.target.files[0] && loadImage(e.target.files[0]));
["dragenter", "dragover"].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add("over"); }));
["dragleave", "drop"].forEach((ev) =>
  drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove("over"); }));
drop.addEventListener("drop", (e) => {
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith("image/")) loadImage(f);
});

// Resize to max 1568px (Claude's recommended size) and re-encode as JPEG.
function loadImage(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const max = 1568;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      const dataUrl = c.toDataURL("image/jpeg", 0.88);
      state.image = dataUrl.split(",")[1];
      state.mediaType = "image/jpeg";
      $("preview").src = dataUrl;
      $("preview").hidden = false;
      $("dropEmpty").hidden = true;
      $("go").disabled = false;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

// ---------- platform chips ----------
$("platform").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll("#platform .chip").forEach((c) => c.classList.remove("on"));
  chip.classList.add("on");
  state.platform = chip.dataset.v;
});

// ---------- prompt ----------
function buildPrompt() {
  const opts = {
    platform: state.platform,
    tone: $("tone").value,
    count: Number($("count").value),
    context: $("context").value.trim(),
    hashtags: $("hashtags").checked,
    emojis: $("emojis").checked,
    cta: $("cta").checked,
  };
  const limits = {
    Instagram: "up to ~150 words, line breaks welcome",
    LinkedIn: "60-180 words, a strong first line hook, professional insight",
    "X (Twitter)": "under 270 characters including hashtags",
    Facebook: "40-120 words, conversational",
  };
  return {
    opts,
    text: `You are an expert social media copywriter.
Look closely at the image and write ${opts.count} distinct captions for ${opts.platform}.

Requirements:
- Tone: ${opts.tone}
- Length: ${limits[opts.platform]}
- Emojis: ${opts.emojis ? "use a few, naturally" : "do not use any"}
- Hashtags: ${opts.hashtags ? "5-10 relevant hashtags per caption, mixing broad and niche" : "none"}
- Call to action: ${opts.cta ? "end each caption with a clear call to action" : "optional"}
${opts.context ? `- Context from the user: ${opts.context}` : ""}
- Each caption should take a different angle (e.g. story, question, punchy one-liner, value/insight).

Respond with ONLY valid JSON, no markdown fences, in this shape:
{"captions":[{"angle":"short label","text":"caption text without hashtags","hashtags":["#tag"]}]}`,
  };
}

// ---------- call Claude ----------
async function generate() {
  const key = $("apiKey").value.trim();
  if (!key) {
    $("settings").open = true;
    $("apiKey").focus();
    return showError("Add your Anthropic API key in API settings (or try the demo).");
  }
  try {
    if ($("remember").checked) localStorage.setItem(KEY_STORE, key);
    else localStorage.removeItem(KEY_STORE);
  } catch (_) {}

  const { text, opts } = buildPrompt();
  showError(null);
  showLoading(opts.count);
  $("go").disabled = true;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: $("model").value.trim() || "claude-sonnet-4-5",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: state.mediaType, data: state.image } },
            { type: "text", text },
          ],
        }],
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Request failed (${res.status})`);
    const raw = data.content.map((b) => b.text || "").join("");
    const json = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));
    render(json.captions || []);
  } catch (err) {
    resetOut();
    showError(err.message || "Something went wrong.");
  } finally {
    $("go").disabled = !state.image;
  }
}

// ---------- demo mode ----------
const DEMO = [
  { angle: "Story", text: "Some mornings start slow. This one started with golden light, fresh coffee and a plan. ☕✨\n\nWhat's the first thing you do to set the tone for your day?", hashtags: ["#morningroutine", "#coffeelover", "#slowliving", "#goldenhour", "#dailyinspo"] },
  { angle: "Punchy", text: "Fuel first. Hustle second. ⚡", hashtags: ["#coffeetime", "#mondaymotivation", "#productivity", "#grind"] },
  { angle: "Question", text: "Be honest — how many cups does it take before you're a functioning human? 👀 Drop your number below 👇", hashtags: ["#coffeeaddict", "#relatable", "#butfirstcoffee", "#community"] },
  { angle: "Value", text: "3 small habits that changed my mornings:\n1. Phone stays off for the first 30 mins\n2. Water before coffee\n3. One clear goal for the day\n\nSave this for tomorrow. 📌", hashtags: ["#habits", "#selfimprovement", "#morningmotivation", "#wellness", "#tips"] },
];
function runDemo() {
  showError(null);
  if (!state.image) {
    $("preview").src = "data:image/svg+xml;utf8," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3b1f0f"/><stop offset="1" stop-color="#d98b3a"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><circle cx="400" cy="270" r="110" fill="#f3e6d3"/><circle cx="400" cy="270" r="85" fill="#5a3418"/><path d="M510 240 q60 0 60 40 t-60 40" stroke="#f3e6d3" stroke-width="18" fill="none"/><text x="400" y="90" fill="#fff" font-family="sans-serif" font-size="28" text-anchor="middle" opacity=".85">demo image: morning coffee</text></svg>`);
    $("preview").hidden = false;
    $("dropEmpty").hidden = true;
  }
  showLoading(4);
  setTimeout(() => render(DEMO), 900);
}

// ---------- rendering ----------
function showLoading(n) {
  $("out").innerHTML = Array.from({ length: n }, () => '<div class="skeleton"></div>').join("");
  $("copyAll").hidden = true;
}
function resetOut() {
  $("out").innerHTML = '<div class="placeholder"><p>Your captions will appear here.</p></div>';
  $("copyAll").hidden = true;
}
function fullText(c) {
  return [c.text, (c.hashtags || []).join(" ")].filter(Boolean).join("\n\n");
}
function render(captions) {
  const out = $("out");
  out.innerHTML = "";
  captions.forEach((c, i) => {
    const el = document.createElement("article");
    el.className = "cap";
    el.style.animationDelay = `${i * 70}ms`;
    const chars = fullText(c).length;
    el.innerHTML = `
      <div class="cap-top"><span class="tag"></span><button class="copy">Copy</button></div>
      <p></p>
      ${c.hashtags?.length ? '<div class="tags"></div>' : ""}
      <div class="meta">${chars} characters</div>`;
    el.querySelector(".tag").textContent = c.angle || `Option ${i + 1}`;
    el.querySelector("p").textContent = c.text;
    if (c.hashtags?.length) el.querySelector(".tags").textContent = c.hashtags.join(" ");
    el.querySelector(".copy").onclick = () => copy(fullText(c));
    out.appendChild(el);
  });
  $("copyAll").hidden = !captions.length;
  $("copyAll").onclick = () => copy(captions.map(fullText).join("\n\n———\n\n"));
}

function copy(text) {
  navigator.clipboard.writeText(text).then(() => {
    $("toast").classList.add("show");
    setTimeout(() => $("toast").classList.remove("show"), 1200);
  });
}
function showError(msg) {
  $("error").hidden = !msg;
  $("error").textContent = msg || "";
}

$("go").addEventListener("click", generate);
$("demo").addEventListener("click", runDemo);
