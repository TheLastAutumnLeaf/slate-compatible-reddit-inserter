A simple Chrome extension that lets you type a meme name in the Reddit comment box and replaces it with the matching meme image.

## What it does

Instead of searching for a meme, downloading it, and then uploading it in a comment, you can just type the trigger word and press space. The extension will replace it with the meme PNG automatically.

## Features

- Works inside Reddit comment boxes
- Supports trigger based meme replacement
- Replaces typed text with meme images
- Simple options page to manage meme triggers
- Saves your custom meme list locally

## How it works

1. Type a meme trigger in the Reddit comment box
2. Press space
3. The extension detects the trigger
4. The text gets replaced with the matching meme image

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Turn on Developer mode
4. Click Load unpacked
5. Select the project folder

## Usage

After installing the extension, go to Reddit and open a comment box. Type the meme name you set in the extension and press space. The image will appear in place of the text.

## Files

- `manifest.json` - Extension config
- `content.js` - Main logic for detecting triggers in Reddit comments
- `background.js` - Background service worker
- `popup.js` - Popup logic
- `options.js` - Options page logic
- `memes.json` - Meme trigger data

## Notes

This project was built to make meme commenting faster and easier on Reddit. It is made for Reddit's comment editor structure and may need updates if Reddit changes its editor in the future.

## License

ALL RIGHTS RESERVED
