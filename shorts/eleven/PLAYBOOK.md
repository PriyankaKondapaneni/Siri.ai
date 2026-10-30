# 11:11 — Production Playbook

This file is the complete, standalone brief for making episodes of **11:11**, a vertical animated romance-thriller series for YouTube Shorts and Instagram Reels. A fresh Claude session with no memory can make the next episode from this file and this repository alone.

---

## Paste this to start a new session

> Make Episode **[N]** of my series **11:11**.
>
> First read `shorts/eleven/PLAYBOOK.md` in the repo `priyankakondapaneni/siri.ai` and follow every rule in it exactly. It holds the series bible, the approved style, voices, pipeline, quality bar and cost rules.
>
> - Work on the branch named in the session.
> - Write the script first and send it to me for approval before spending any API credit.
> - The quality must match Episode 1's final cut or be better. Never lower quality to save credits; save credits only the ways the playbook allows.
> - Keys are in `shorts/.env`; never print or commit them.
> - Deliver the MP4, a cover image and post copy, then commit and push.
>
> Story notes for this episode (optional): [your notes]

---

## 1. The quality bar (non-negotiable)

Every episode must look and sound like a professionally directed short film. Episode 1's final cut (`deliver/11-11-episode-01.mp4`) is the minimum.

### What the user approved
- **Art:** flat, hand-drawn webtoon style; see section 4.
- **Voices:** Drama 3 with natural, subtle emotion.
- **Look:** cinematic finishing.
- **Opening:** a hook in the first 2 seconds.
- **Pace:** brisk.
- **Length:** about 70 seconds.
- **Theme: slice of life.** The days feel warm and everyday (coffee, walks, small talk, little jokes, rain, the walk home). The thriller breaks through only at 11:11. Music in the day is warm piano and plucked guitar; dark music starts when the phone lights up.
- **Time flows, never jumps.** Every change of time or place is shown as time passing, not a hard skip of hours: a window going from night to dawn to dusk with the clock racing, a wall clock spinning while the café empties and the lights go out, street lights flickering on, a walk that dissolves into the next place. Use a dissolve or a time-lapse for every jump in time.
- **Action in every shot, however small.** No shot is a still picture with a camera push. Someone always moves: hands reach, things are picked up, broken, slid across a table, heads tilt, shoulders shake with a laugh, people lean in, look away, walk. Direct each beat like a film director: shot, reverse shot, insert, reaction.
- **A story, not one-liners.** The two of them talk to each other in scenes, with real back-and-forth. Narration only bridges. Mira's spoken lines are filmed over her shoulder or on Kabir's reaction (her art has no lip-sync mouth yet).
- **Voices with emotion, never robotic.** Record and assemble at natural speed (`"tempo": 1.0` in the script) with real pauses (`"cap": 0.45`, a 0.25–0.4 s reaction beat between dialogue lines). Give each line a direction with something to play (a nervous laugh, out of breath, voice breaking), kept natural.
- **Show, don't narrate.** If a beat can be acted on screen (a stolen bite, a laugh), cut the words and show it.

### Things the user rejected (never repeat)
- **Statue-like shots.** Characters standing still while only the camera moves.
- **Robotic voices.** The 1.08× time-stretch with tight 0.12 s gaps made the voices sound mechanical.
- **Hard jumps in time** with no sense of the hours passing.
- **Childish scrapbook styling.** No sticker borders around characters, no ransom-note or paper-scrap titles, no torn-paper captions, no yellow highlighter, no red marker circles, no stamps, no stop-motion jitter, no glitch effects.
- **Characters that look AI-made.** No glossy or painterly rendering, no hyper-detailed hair, no realistic faces.
- **Stick-figure arms.** Characters always have full, properly proportioned arms with sleeves and real hands.
- **A rushed voice.** Earlier takes sped to 1.1× with pauses slashed sounded bad.
- **Overacted emotion.** The user asked for natural delivery.
- **A slow opening with no hook.** The user said: "I'll scroll away."
- **A double mouth.** The code-drawn mouth patch must sit exactly on the drawn mouth. Verify it on a still.

### How to verify
- Before any full render, render review stills at every shot (`node render.mjs stills build/review t1 t2 …`).
- Build a contact sheet (`contact.py`), look at it, and fix problems.
- After the final render, check:
  - the duration;
  - the loudness: −14 LUFS integrated, true peak no higher than −1 dBTP before AAC;
  - that subtitles never cover faces or the phone;
  - that no shot shows an empty edge.

## 2. Series bible

**Premise:** Every night at 11:11, Mira gets a voice message from a stranger, and everything he says comes true. The stranger is Kabir. When she meets him in person, he doesn't know her. His messages are coming from the future, and in his last one he said: *"In seven days… I don't make it."* Each episode is one day of the countdown.

**Episode 1 ended at "Six days left."** Episode N should end with "N−1 … days left" counting down, unless the user says otherwise. Every episode ends on a cliffhanger line and an end card: "11:11", "X DAYS LEFT", "TO BE CONTINUED".

### Characters
**Mira** (heroine, narrator, early 20s)
- Very pretty.
- Long dark wavy hair, warm amber-brown eyes, a small coral flower hair clip.
- Outfit: cornflower-blue dress and a chunky red knit scarf, or a cream sleep top at night.
- Narrates in first person, past tense, short sentences.

**Kabir** (hero, mid 20s)
- Very handsome.
- Messy black hair, dark intense eyes.
- Outfit: charcoal wool coat over a black turtleneck, and a vintage leather-strap watch stopped at 11:11.
- Speaks in voice notes (heard through a phone) and live in person.

**Stranger on the train:** a middle-aged man in a grey flat cap and dark coat, slightly creepy. Add other characters as the story needs, in the same style.

### Story rules
- Every episode needs a hook line, a mystery clue, a romantic beat, a danger beat, and a cliffhanger.
- Nothing 18+.
- Keep it catchy, thrilling, romantic and easy to follow in one viewing.

## 3. Script format and rules

`episodes/NN/script.json` holds `model: "drama-3"`, `voices` (section 5) and `lines`. Each line has:
- `id`, `who` (`mira`/`kabir`/other), and `kind`:
  - `narr`: Mira's narration;
  - `note`: a voice message, played through a phone EQ, captioned by the phone UI or in italic subtitles;
  - `live`: spoken on screen, lip-synced.
- `text`: one short bracketed direction, then the words. Spell numbers out for the voice (`eleven eleven`, `eight-oh-two`).
- optional `show`: the display text with digits (`11:11`, `8:02`).

**Extra line options:**
- `to`: the hook's end word index, exclusive, so the hook stops before the end of the source take.
- `gap`: seconds of silence before a line, overriding the default. On `h0` it sets the lead-in; keep it near 0.06 s so the voice starts on the first frame. Use it for a dramatic beat, such as the 1.8 s silence before "his watch started ticking".
- A `note` line can be in either voice. Mira's voice notes go through the phone EQ too.

**The hook line** is line `h0`, the first line. It reuses a powerful line from later in the same episode, without spoiling the final cliffhanger. Use `take` (the source line id) and `from` (the first word's index in that take), so it costs nothing extra. Example: `{ "id": "h0", "who": "kabir", "kind": "note", "take": "k6", "from": 6, "text": "Don't fall in love with me.", "show": "Don't fall in love with me." }`

**Directions are short and subtle,** two to six words: `[quiet, intimate, as if telling you a secret]`, `[calm, serious]`, `[quiet, hurt]`, `[urgent but controlled, low]`, `[almost a whisper]`. Use at most one direction at the start of a line and at most one mid-line change. Never stack dramatic directions, and avoid bracketed sound effects unless one is truly needed.

**Length:** about 15–18 lines, 140–170 words of voice. The target is 65–72 s total, including a 1.8 s end card.

**Send the script to the user for approval before spending credit.**

## 4. Visual style and art

### Style
- The art follows the user's webtoon reference (`assets/art/source/STYLE.png` for characters, `STYLEBG.png` for rooms).
- Characters: flat colours, thin slightly uneven black ink lines, big dark glossy eyes with two highlights, a tiny nose, simple mouths, proper arms and hands.
- Backgrounds: soft, muted pastel webtoon rooms.

### The art library
Always reuse it first. It lives in `assets/art/v2/`; `gen/` holds the originals and `cut/` the transparent cut-outs.

**Mira:**
- `M1`: café, coffee cup, happy
- `M2`: in bed with phone, night
- `M3`: coffee spill, startled
- `M4`: seated on train, tense
- `M5`: street, frightened, wind
- `M6`: close-up, stunned, looking up
- `M7`: close-up, crying, sleep top, phone

**Kabir:**
- `K2`: lunging, reaching out
- `K3`: close-up, serious
- `K4`: close-up, polite puzzled smile
- `K5`: wrist and watch, blank dial; hands are drawn in code

**Other:**
- `S1`: the train stranger

**Backgrounds:**
- `B1`: bedroom at night (clock at 0.31, 0.553; lamp at 0.19, 0.45; window at x 0.57–1, y 0–0.4)
- `B2`: café (blank wall clock at 0.8, 0.142, radius 0.085 of the width)
- `B3`: train aisle (horizon 0.375)
- `B4`: street crosswalk at dusk (red light at 0.594, 0.146; vanishing point at 0.594, 0.52)
- `B5`: bed sheets close-up (backdrop for phone shots)

**Added in Episodes 2–8** (all in `assets/art/v2/`):
- Mira:
  - `M8`: street, hopeful, bag strap
  - `M9`: café table, shy smile, chin on hand
  - `M10`: hand over mouth, shocked
  - `M11`: fallen on wet ground in the rain
- Kabir:
  - `K6`: café table, laughing
  - `K7`: coffee-soaked
  - `K8`: at night, phone light on his face
  - `K9`: holding his phone out
  - `K10`: looking down at a photo
  - `K11`: lunging to push someone clear, in the rain
- Two-shots:
  - `MK1`: sitting side by side on a ledge
  - `MK2`: on the floor, her head on his shoulder
  - `MK3`: hurt in the rain, Mira holding his face (her hand hides his mouth)
- Inserts:
  - `H1`: their hands holding
  - `A1`: photo of Arjun (Kabir's brother)
  - `F1`: memory/flashback of Mira on the bridge (used full-frame with a sepia filter)
  - `C1`: full-frame café table, both their hands on the last cookie (registered in `BGS`; his watch at 0.89, 0.574, radius 0.039 of the width, is painted back to a blank dial stopped at 11:11 in code)
- Backgrounds:
  - `B6`: metro platform
  - `B7`: rooftop at night
  - `B8`: old bridge in the rain (lamps at 0.127, 0.27; 0.31, 0.4; 0.39, 0.47)
  - `B9`: Kabir's apartment (floor lamp at 0.757, 0.27)

**Identity references** for new images: `source/CM4.png` (Mira) and `source/CK4.png` (Kabir). For a two-shot, use refs `["STYLE", "CM4", "CK4"]` with the `MK1` style string in `art2.json`.

**Lessons from generating new art:**
- Always add "IMPORTANT: the background must be completely plain flat light grey, with no scenery at all." Without it, the model sometimes paints a full scene that can't be cut out.
- Say the expression outright (for example "frightened, mouth closed, absolutely NOT smiling"). Grins are the model's default.
- For any character who will talk on screen, ask for "mouth closed" so the code-drawn mouth has a clean place to go.
- Register every new cut-out in `CUTS` and every background in `BGS` in `src/art.js`, or the page fails with "reading 'height'".

### New art (only when the story truly needs a new pose or place)
- Add jobs to `art2.json`. Characters use refs `["STYLE", "CM4"]` or `["STYLE", "CK4"]`; backgrounds use `["STYLEBG"]`.
- Use the exact style strings already in `art2.json`. The character style includes the "do NOT draw stick-figure line arms" rule, a plain flat light grey background, and the waist-up or close-up framing.
- Always restate the outfit and "warm amber-brown eyes" for Mira.
- Generate: `NODE_USE_ENV_PROXY=1 node imagegen.mjs NAME` (defaults to `art2.json` and `assets/art/v2/gen`)
  - This uses `gpt-image-2` at `quality: "medium"`, which the user approved.
  - Run at most 4 jobs in parallel.
- Cut out: `python cutout.py assets/art/v2/gen/X.png assets/art/v2/cut/X.png --flat`. Use `--tol 7` when the character wears cream or pale colours.
- Check the cut-out on magenta. If a face or hands were keyed out, lower `--tol`.
- Face landmarks for blinks and mouths: run `python faces.py review.jpg NEW1 NEW2` (it adds to the existing `faces.json`). Then check the boxes on a still and fix `assets/art/v2/faces.json` by hand where detection missed (normalized `[cx, cy, w, h]` for eyes, `mouth` for talkers).
- Look at every new image. If it breaks the style (glossy look, stick arms, wrong face or outfit), regenerate it. Quality beats the cost of one more image.

## 5. Voices (Fish Audio, Drama 3)

- **Model:** `drama-3`. It must be sent as the `model` header; `lib-fish.mjs` does this. A missing header silently falls back to s2.1-pro.
- **Mira:** Sheila, `f3a2b90078d54a65af4b95f63bc7798e`.
- **Kabir:** Adrian, `bf322df2096a46f18c579d0baa36f41d`.
- **New characters:** run a short audition first (`audition.mjs` pattern, about $0.01) and let the user choose.
- **Generate at speed 1.0:** `NODE_USE_ENV_PROXY=1 node eleven/narrate.mjs NN 3`, run from `shorts/`. This makes 3 takes per line, checks each with ASR (`transcribe-1-pro`) for word errors, and picks the best one.
  - Fish allows one request at a time; never run TTS calls in parallel (429).
  - The `.asr.json` transcripts are committed but the `.wav` takes are not. If takes are re-recorded, narrate re-transcribes any take newer than its transcript; a stale transcript gives wrong timing and a false 0% word error.
- **Assemble:** `node eleven/assemble.mjs NN`, run from `shorts/`.
  - From Episode 2's recut on, scripts set `"tempo": 1.0` (natural speed); the old 1.08 default sounded robotic. Fit the length by trimming words, not by speeding up.
  - `CAP` and `GAP` keep pauses tight but natural (defaults: in-line pauses capped at 0.26 s; 0.12 s between lines; 0.42 s before voice notes for the phone buzz).
  - Do not use Fish's `speed` above 1.0, and do not slash pauses further.
- **Spend guard:** `shorts/budget.json` sets a credit floor, and every paid call checks the wallet first. The user's Fish cap for the project is $4.

## 6. Picture: the film engine

The page is `index.html`, plus `src/*.js`: core, paper, ink, svgpath, kit, type, art, fx, film, the episode's `timing.js` and `envelope.js`, then cues, phone, scenes and main. It renders deterministically at 1080×1920, 30 fps.

- `src/cues.js`: the cue sheet, pinned to words. It holds scene starts, sound-effect times, ambience beds and music sections.
- `src/scenes.js`: the shot list. Each `shot(start, end, look, fn, transition)` cuts on a word.
- `src/main.js`: the compositor. It applies grades, dissolves, bloom, vignette, grain and subtitles.
- `src/film.js`:
  - `PP.grade` with looks `night`, `phone`, `morning`, `train`, `dusk`, `danger`, `dark`, `cold`;
  - `PP.bloom`, `PP.handheld`, `PP.flare`;
  - subtitles (Inter; voice notes in italics);
  - `PP.spaced` for title type.
- `src/art.js`:
  - `PP.drawCut` handles borderless characters with `shadow`, `rim` light, key `light`, `tint`, `breath`, wind `sway` and face `state`;
  - `PP.drawBg` and `PP.drawBgDepth` (2.5D parallax bands) clamp the camera so frame edges are never empty;
  - blinks and mouths are painted over the art in code.
- `src/phone.js`: a realistic phone UI. The voice-note waveform follows the real voice, and the transcript types out word by word.

**For a new episode:** keep the engine and copy Episode 2's layout (Episode 1 predates it and lives in `src/cues.js` and `src/scenes.js`):
- `episodes/NN/script.json`, then `timing.json`/`timing.js` from assemble and `envelope.js` from the audio tools.
- `episodes/NN/cues.js`: the episode's cue sheet. The audio tools pick it up automatically. Sections and effects are optional; use only what the episode needs.
- `episodes/NN/scenes.js`: the shot list, built with `const K = PP.shotKit(C, T)` from `src/shots.js`. The kit holds `char`, `bedroom`, `phoneShot`, `foreground`, `clockHands`, `onCut`, `lerpCam`, `word`, `line`, `msg` and `shot`. Finish with `PP.SHOTS = K.S`.
- `index-NN.html`: a copy of `index-02.html` with the episode number changed. Render with `PAGE=index-NN.html node render.mjs …`.
- Register new cut-outs in `CUTS` in `src/art.js`.

Don't rewrite the engine for each episode.

### Direction rules
- **The hook (0–2.5 s):** a cold-open flash-forward of 3–4 quick shots (about 0.5 s each), under the `h0` line. Use the most charged images from the episode: the voice note glowing red, an eye close-up, danger, a tear. Start instantly, then smash-cut with a low hit into the story's first shot.
- **Shot grammar:** a wide to set each new place, then medium shots, then close-ups for feeling. Use extreme-close-up inserts for clues (clock, phone, watch, red light) and over-the-shoulder framing for conversations, with a blurred foreground shoulder. Use match cuts where possible; Episode 1 matched the clock's 11:11 to the watch's 11:11.
- **Cutting:** cut on the spoken word. Shots average 1.5–3 s; keep anything over about 4 s alive with a camera push. Use hard cuts by default, dissolves (0.35 s) only for time jumps, and a hard cut to black on the cliffhanger. The title card ("11:11 · EPISODE N · TITLE") goes after the first narration beat, about 1 s, thin Inter 200 with a glow.
- **Camera:** smooth eased pushes, with no stepped or stop-motion motion. Use handheld only in tension, a white flash at impacts, and speed lines only in action beats.
- **Light:** every shot uses `shadow` and `rim` on characters, a blurred background for close-ups, and a scene grade. Keep night skin readable: keep cool tints on faces light (around 0.08), never wash faces blue or grey.
- **Characters:** they blink. Use `blink: false` on eye-focused shots. Characters who speak live use `talk: true` and need a correct `mouth` box. Breathing is on by default; use wind sway for outdoor drama.
- **Text:** use subtitles only (white Inter 600, 52 px, soft shadow), with a phrase of about 26 characters at most and no trailing one-word phrases. Voice-note lines appear in italics. Hide them while the phone is on screen, because the phone shows the words.
- **Endings:** the end card is about 1.8 s: "11:11", "X DAYS LEFT" in red, "TO BE CONTINUED".
- **Big type instead of a subtitle:** when a shot shows a time or word in large type ("6:40", "11:10", "11:12"), set `K.F.noSubs = true` in that shot so the subtitle doesn't repeat it.
- **Phone options** (via `phoneShot` or `PP.phone`):
  - `banner` start time, `bannerTitle`, `bannerText`, `bannerHold` (news alerts, numbers);
  - `header` and `sub` (the chat header);
  - `emptyText` (for example an empty "Sent" folder);
  - `clock`;
  - `msg(id, { time, urgent })` for a voice-note bubble.
- **Testing face boxes:** before rendering, check each new eye and mouth box by drawing it on a gridded crop. The automatic detection often misses Kabir's eyes, which sit under his bangs.

## 7. Sound

- Run the audio tools from `shorts/eleven/`: `node audio/score.mjs NN && node audio/sfx.mjs NN && node audio/mix.mjs NN && node audio/envelope.mjs NN`.
- The score, sound effects and beds are synthesized in code, at no cost.
- The cue sheet's `sfx`, `beds` and `music` sections drive them. Give the hook a buzz, a heartbeat, a whoosh and a low hit at the smash cut, with music section `hook` (silence under the hook).
- `c.hush = [[from, to, dB]]` in the cue sheet lets the music fall away under a held moment (Episode 2's fingertips). Effects added for Episode 2: `crunch` (a cookie snapped in half).
- Assemble ends each line where the voice actually stops, not where the transcript says, so a short last word can't clip the line.
- The mix sends Kabir's voice notes through a phone EQ, ducks the music under the voice, and masters to −14 LUFS with a true peak of −1.2 dBTP or lower.

## 8. Render and deliver

1. Review stills and a contact sheet, then fix problems. Usually 1–2 rounds.
2. Run `node render.mjs video build/epNN/video.mp4`. It takes about 7–8 minutes, so run it in the background.
3. Mux the audio:

   ```
   ffmpeg -i build/epNN/video.mp4 -i build/epNN/mix.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 256k -ar 48000 -shortest -movflags +faststart deliver/11-11-episode-NN.mp4
   ```

4. Make the cover: the most dramatic hook frame (`ffmpeg -ss <t> … -frames:v 1 deliver/…-cover.jpg`).
5. Write the post copy (`deliver/POST.md` pattern): a title with #shorts, a 3–4 line caption ending in "Part N+1 tomorrow at 11:11", a pinned-comment question, and hashtags.
6. Send the MP4, the cover and the post copy to the user. Report the spend. Commit and push. Never commit `.env`; `build/` and `*.wav` takes are gitignored.

## 9. Cost rules (cheap without lowering quality)

| Item | Typical cost per episode | How |
|---|---|---|
| Voice (Drama 3) | ~$0.04 at the $10/M-byte promo; ~$0.20 after Nov 12, 2026 ($50/M bytes) | 3 takes per line, ~1.3 KB script. The hook reuses a take. |
| ASR checks | a few cents | One per take; needed for word timing and lip-sync. |
| New images | $0 to ~$0.40 | Reuse the library. Make a new image only for a new place or pose (~$0.06–0.08 each at medium). Do expressions, blinks, mouths, clocks, phone screens, watch hands, weather and lighting in code. |
| Music, effects, animation, grading | $0 | All code. |

**Savings that are allowed:**
- Reusing art.
- Doing work in code.
- Fewer review rounds, by checking small contact sheets.
- Reusing takes for the hook.
- Free generation in the ChatGPT app when the user offers to do it (give them exact prompts from `art2.json`).

**Savings that are never allowed:**
- Low image quality.
- Skipping the ASR check.
- Speeding up voices beyond 1.08×.
- Fewer than 3 takes per line.
- Skipping review stills.
- Shipping an image that breaks the style.

## 10. Environment notes

- Outbound requests go through a proxy. Node needs `NODE_USE_ENV_PROXY=1`. The allowed hosts include api.fish.audio, docs.fish.audio and api.openai.com.
- A Python venv with numpy, scipy, opencv-contrib and Pillow is needed for `cutout.py`, `faces.py` and `contact.py`. Recreate it if missing: `python3 -m venv venv && venv/bin/pip install numpy scipy opencv-contrib-python-headless pillow`.
- Playwright Chromium is preinstalled; `render.mjs` uses it.
- Inter fonts are in `assets/fonts/`.
- The keys are `FISH_API_KEY` and `OPENAI_API_KEY` in `shorts/.env`. If they're missing, ask the user to add them.
