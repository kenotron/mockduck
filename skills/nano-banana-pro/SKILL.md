---
name: nano-banana-pro
description: >
  Use this skill when the user wants to generate UI mockup images, analyze existing
  designs or screenshots, iterate on a design with image-to-image generation,
  combine images side-by-side for comparison, or produce an AI-annotated comparison
  image. Calls the nano-banana CLI via npx.
allowed-tools: Bash, Read, Write
---

# nano-banana-pro

You have access to the `nano-banana` CLI via npx. It wraps Google Gemini for image
generation, vision analysis, and image compositing.

## Setup Check

First verify the API key is available:

```bash
echo ${GEMINI_API_KEY:+set} || echo "NOT SET"
```

If not set, tell the user:
> Please export your Gemini API key before running:
> ```
> export GEMINI_API_KEY="your-key-here"
> ```
> Get one free at https://aistudio.google.com/apikey

## Running Commands

The tool is invoked via npx — no install needed:

```bash
GEMINI_API_KEY=$GEMINI_API_KEY npx nano-banana-pro <command> [options]
```

Progress messages go to stderr. The output file path is printed to stdout.

> **Tip:** If the user has installed globally (`npm i -g nano-banana-pro`), use
> `nano-banana` directly instead of `npx nano-banana-pro` — it's faster.

---

## Commands

### `generate` — Text → Image

Generate an image from a text description.

```bash
npx nano-banana-pro generate \
  "a dark-mode login form with email and password fields" \
  --output outputs/login.png
```

| Argument | Required | Description |
|---|---|---|
| `<prompt>` | ✓ | Natural language description |
| `--output <path>` | ✓ | Where to save the PNG |

---

### `analyze` — Image → Text

Analyze an image and return a detailed description. Use before generating to
understand existing designs.

```bash
npx nano-banana-pro analyze outputs/login.png \
  --prompt "What UI components are present? What framework would best implement this?"
```

| Argument | Required | Description |
|---|---|---|
| `<image-path>` | ✓ | PNG or JPEG to analyze |
| `--prompt <text>` | — | Specific question (default: "Describe this image in detail.") |

Returns text to stdout.

---

### `generate-from` — Reference Image + Prompt → New Image

Generate a new image using an existing image as visual reference. Use for iteration.

```bash
npx nano-banana-pro generate-from outputs/login.png \
  "add a 'Sign in with Google' button and a forgot password link" \
  --output outputs/login-v2.png
```

| Argument | Required | Description |
|---|---|---|
| `<image-path>` | ✓ | Reference image |
| `<prompt>` | ✓ | What to change or add |
| `--output <path>` | ✓ | Where to save the result |

---

### `combine` — Side-by-Side Composite (No AI)

Combine 2 or 3 images into a single PNG laid out left-to-right. Pure image
manipulation — no API calls, no cost, instant.

```bash
# Two images
npx nano-banana-pro combine \
  outputs/login.png outputs/login-v2.png \
  --output outputs/comparison.png

# Three images with wider gap
npx nano-banana-pro combine \
  outputs/v1.png outputs/v2.png outputs/v3.png \
  --output outputs/all-versions.png --gap 32
```

| Argument | Required | Description |
|---|---|---|
| `<img1> <img2> [img3]` | ✓ | 2 or 3 image paths |
| `--output <path>` | ✓ | Output PNG path |
| `--gap <px>` | — | Pixel gap between images (default: 16) |

---

### `overlay` — Combine + Gemini Annotated Image

Combines 2–3 images side-by-side, then asks Gemini to **generate a new annotated
version** — with arrows, labels, highlights, or other visual annotations drawn
directly onto the image.

```bash
npx nano-banana-pro overlay \
  outputs/login.png outputs/login-v2.png \
  --prompt "Draw red arrows to every UI change between left and right. Label each change." \
  --output outputs/annotated-diff.png

# Three-way with labels
npx nano-banana-pro overlay \
  outputs/v1.png outputs/v2.png outputs/v3.png \
  --prompt "Label each column 'v1', 'v2', 'v3'. Highlight what improved each iteration." \
  --output outputs/iteration-review.png --gap 24
```

| Argument | Required | Description |
|---|---|---|
| `<img1> <img2> [img3]` | ✓ | 2 or 3 image paths |
| `--prompt <text>` | ✓ | Annotation instruction for Gemini |
| `--output <path>` | ✓ | Output PNG path |
| `--gap <px>` | — | Gap between images before combining (default: 16) |

---

## Recommended Mockup Workflow

```
1. generate       → create initial mockup from a description
2. analyze        → understand its structure, pick an implementation approach
3. generate-from  → iterate: refine based on user feedback
4. combine        → create a before/after comparison (no AI cost)
5. overlay        → produce an annotated diff for review or handoff
```

**Full example:**
```bash
NB="npx nano-banana-pro"

$NB generate "a SaaS dashboard with collapsible sidebar" --output outputs/v1.png
$NB analyze outputs/v1.png --prompt "list every UI component visible"
$NB generate-from outputs/v1.png "add dark mode toggle, make sidebar collapsible" --output outputs/v2.png
$NB combine outputs/v1.png outputs/v2.png --output outputs/before-after.png
$NB overlay outputs/v1.png outputs/v2.png \
  --prompt "Circle and label every element that changed between left and right" \
  --output outputs/review.png
```
