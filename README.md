<p align="center">
    <a href="https://nekocap.com/" target="_blank" rel="noopener">
        <img src="https://user-images.githubusercontent.com/314281/102780389-cc03ed00-43d0-11eb-87c3-6d50a2ab5752.png" width="100" alt="NekoCap logo">
    </a>
</p>
<div align="center"><sub>Logo by <a href="https://twitter.com/Iceikory" target="_blank" rel="noopener">@Iceikory</a></sub></div>

<h1 align="center">NekoCap</h1>

<div align="center">

![Editor](docs/editor-screenshot.jpg)

![ASS captions](docs/ass-captions.jpg)

</div>

<div align="center">A browser extension for creating, uploading and viewing community created captions on video sharing sites such as YouTube, Vimeo and niconico.
<br/>
Get the extension:
<a href="https://chrome.google.com/webstore/detail/nekocap/gmopgnhbhiniibbiilmbjilcmgaocokj" target="_blank" rel="noopener">
        Chrome / Edge
</a>
<br/>
Website:
<a href="https://nekocap.com/" target="_blank" rel="noopener">
        NekoCap.com
</a>
</div>
<br/>

<div align="center"><font size="3">Join the Discord here:</font></div>
<div align="center">

[![Discord Chat](https://img.shields.io/discord/760819014514638888.svg)](https://discord.gg/xZ9YEXY5pd)

</div>

## Features

### Extension

- Built in caption editor accessible directly from supported video sharing sites
  - Custom caption positioning
  - Support for hotkeys from various editing software
  - Caption file export (SRT)
  - More to come
- Caption file loading (SRT, VTT, SBV, SSA, ASS supported)
- Caption upload
- Caption viewing
- Advanced Substation Alpha (SSA/ASS) caption rendering
- Caption rating system

### Website

- Captioned video search
- Captioner profiles
- Caption review page
- Captioner moderation tools (verify, reject)

## Setup for local development

1. Run `npm install`
1. Copy the contents of `.env.sample` to `.env` and fill in the details.
   - Firebase variables are used for auth
1. Run `npm run watch` to start the webpack dev server for both the extension
   and the NekoCap website
1. Go to `chrome://extensions` in Chrome and load the unpacked extension from
   the `dist/extension` folder
1. Go to `http://localhost:12341` to access the NekoCap website

### Adding fonts to be hosted from the NekoCap site for SSA/ASS rendering

1. Create a folder called `server-fonts` in the project root. (Webpack is
   configured to copy fonts there to the website's output directory)
1. Add woff2 webfonts that you want to serve from the website into that folder
1. Modify `src/common/substation-fonts.ts` to assign font names to the
   corresponding woff2 files in that folder.

### Creating a production build

1. Copy the contents of `.env.sample` to `.env.prod` and fill in the details.
   1. Add `PRODUCTION=1` to the end of the file.
1. Run `npm run build` to build both the extension and the website
   - Run `npm run build:ext` to build just the extension
   - Run `npm run build:web` to build just the website
1. The output will be in `dist/web` and `dist/extension`
   1.
   1. License information of utilized packages will be in \*.licenses.txt next
      to the output javascript

### If you want to build the NekoCap website Docker image

1. Follow step 1 in [Creating a production build](#creating-a-production-build)
1. Copy the contents of `Dockerfile.sample` to `Dockerfile` and change whatever
   is necessary.
1. Copy the nginx template `docker/default.conf.template` to
   `docker/default.conf` and change the configuration to suit your needs.
1. Run `docker build` with your desired options.

## Special thanks

Many great packages helped to bring this to life but extra kudos go to these
projects without which NekoCap would not have been the same:

- [SubtitleOctopus](https://github.com/Dador/JavascriptSubtitlesOctopus) - ASS
  rendering
- [React Hotkeys](https://github.com/greena13/react-hotkeys) - Easy to use
  hotkeys (use the latest Github build and not the outdated npm one)
- [subtitle.js](https://github.com/gsantiago/subtitle.js) - SRT and VTT parsing
- [ass-compiler](https://github.com/weizhenye/ass-compiler) - ASS parsing
