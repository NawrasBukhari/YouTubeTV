<div align="center">
<img src="./build/icon.png" width=120px>

# **YouTube TV**
[![Downloads](https://img.shields.io/github/downloads/NawrasBukhari/YouTubeTV/total.svg?color=FF0000&label=Total%20downloads)](https://github.com/NawrasBukhari/YouTubeTV/releases/)
[![Downloads](https://img.shields.io/github/downloads/NawrasBukhari/YouTubeTV/2.4.5/total.svg?color=blue&label=2.4.5%20Downloads)](https://github.com/NawrasBukhari/YouTubeTV/releases/tag/v2.4.5)

Simple YouTube TV Client for desktop based on [electron](https://www.electronjs.org/). You can connect a compatible device such as a phone or computer with Google Chrome and send videos to the app for viewing, just like on ChromeCast or smart TVs with YouTube.

<img src="./readme/demo_player.png" width="600px">

</div><br>

## 🌎 Languages

This readme is available in the following languages:

- 🇺🇸 English

It implements a [DIAL](https://en.wikipedia.org/wiki/Discovery_and_Launch) server (based in [SSDP](https://en.wikipedia.org/wiki/Simple_Service_Discovery_Protocol)) to allow connection from devices that use this same protocol (limited to YouTube in this application).

Use the userAgent allowed by YouTube TV:
```
Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.77 Large Screen Safari/534.24 GoogleTV/092754
```
It can use ```npm start``` or else ```npx electron .``` .
If you already have electron installed globally, you can start the app with ```electron .```

## 📦 Builds
The project can be downloaded already built and ready to use. Available for Linux, macOS and Windows. On x86, x84 and ARM architectures.

| Platform      |   Architecture   |     Link     |
|---------------|:----------------:|:------------:|
| Windows       | x32/x64          | [Download](https://github.com/NawrasBukhari/YouTubeTV/releases/download/2.4.5/YouTube.TV.Setup.2.4.5.exe) |


[Last Build](https://github.com/NawrasBukhari/YouTubeTV/releases/latest)

## ⌨️ Key shortcuts
- Max. resolution config panel: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>
- Fullscreen: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd>.
- Developer Tools: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>f12</kbd>.
- Change cursor visibility: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>A</kbd>.

## ⚡️ Last changes [2.4.5]
### **2.4.5**
- Start window maximized
  
### **2.4.4**
- Strip '.lan' from friendly name
- Fix visibility change event overriding
- Disable nodeIntegration for YouTube renderer

### **2.4.3**
- Added ads-blocker.
- Changed hotkeys
