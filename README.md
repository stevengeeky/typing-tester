# Typing Tester

A typing tester inspired by 10fastfingers. Includes a native bot.

## What it does

Open `index.html` in a browser. No build step, no server, no dependencies.

- The current word is highlighted and every character colours as you type: green
  when it matches, red and underlined when it does not. Space submits the word.
- Live speed while you type: **WPM** (correct keystrokes), **raw** (every
  keystroke) and **accuracy** (keystrokes that were right the first time).
- Pick the test length: 15, 30, 60 or 120 seconds. Your choice is remembered.
- At the end you get a results screen with a chart of WPM over the test, the
  words you missed and what you typed instead, and your last ten runs with a
  personal best per test length. History lives in your browser's `localStorage`
  only; there is a button to clear it.
- **Tab** or **Esc** restarts at any time. The input is focused on load, so you
  can just start typing.
- Works at phone width.
- The built-in word list (`scripts/words.js`, 351 common everyday words) can be
  replaced by uploading your own plain-text list, one word after another
  separated by spaces. If `words.js` fails to load, the original short list in
  `scripts/main.js` is used.
- The **Auto-Type** checkbox turns on the bot, which types the words for you.
  Bot runs show up in history but never count as a personal best.

## Files

- `index.html` - the page
- `scripts/main.js` - the tester, the bot and the upload
- `scripts/words.js` - the default word list
- `styles/main.css` - the styles
