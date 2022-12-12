# AuRo
A *Chrome Extension* to pick an audio output device for HTML5 audio and video elements.

In 0.0.3 saving deviceId for a domain became possible.

## How it works
The extension patches HTML5 audio and video .play() method and manipulates the `sinkId` in order to switch to the desired audio output device.
It also does not and will never work with AudioContext cause setSinkId() is not implemented for it.
To not overhead every page with script injection sometimes it requires to pause/play media on initialization.

**Note** that the API requires a successful call to `getUserMedia()` for every site with audio sinks that
need to be manipulated.

## Build
To get a production build, you can run:

```shell
npm run build
```

To get a development build, you can run:

```shell
npm run watch
```

The main difference is that `watch` will automatically turn on verbose logging and setup the necessary machinery to
automatically reload the extension whenever a change is made in the code.

No matter the type of build you pick, you will have to load the `dist` folder as an unpacked extension in your browser.

## Links
[Chrome Store](https://chrome.google.com/webstore/detail/auro-audio-output-device/hglnindfakmbhhkldompfjeknfapaceh)
[GitHub](https://github.com/ish-/AuRo)
