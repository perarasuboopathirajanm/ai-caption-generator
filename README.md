# ✦ CaptionCraft — AI Caption Generator

Upload any photo, pick a platform and tone, and get ready-to-post social media captions with hashtags, written by Claude's vision model.

**[▶ Live demo](https://perarasuboopathirajanm.github.io/ai-caption-generator/)**

## Features

- 🖼️ **Drag & drop image upload**, auto-resized in the browser before sending
- 📱 **Platform-aware captions** for Instagram, LinkedIn, X and Facebook, each with the right length and style
- 🎭 **6 tones**: Friendly, Professional, Witty, Inspirational, Bold & salesy, Minimal
- #️⃣ Toggle **hashtags, emojis and call-to-action**
- 🧠 Every caption takes a **different angle** (story, question, one-liner, value)
- 📋 **One-click copy** per caption, or copy all
- 🧪 **Demo mode**, so you can see it work without an API key
- ⚡ **Zero dependencies, no build step**: plain HTML, CSS and JavaScript

## Quick start

```bash
git clone https://github.com/perarasuboopathirajanm/ai-caption-generator.git
cd ai-caption-generator
# open index.html in your browser, or serve it locally:
npx serve .
```

1. Get an API key from [console.anthropic.com](https://console.anthropic.com/)
2. Open **API settings** in the app and paste your key
3. Upload an image and click **Generate captions**

> 🔐 Your key is sent directly from your browser to the Anthropic API and is only saved locally if you tick "Remember key". For a public deployment, move the API call behind a small serverless function so the key stays on the server.

## How it works

1. The image is drawn onto a canvas, scaled to a maximum of 1568px, and encoded as base64 JPEG.
2. The app sends the image and a structured prompt to the Claude Messages API.
3. Claude returns JSON (`{ captions: [{ angle, text, hashtags }] }`), which is rendered as cards.

## Tech stack

`HTML` · `CSS` · `Vanilla JavaScript` · `Claude API (vision)`

## Roadmap

- [ ] Serverless proxy (Vercel / Cloudflare Workers) to hide the API key
- [ ] Brand voice presets
- [ ] Caption history
- [ ] Multi-image carousel captions

## License

MIT
