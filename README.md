# PerfMeter

### Work In Progress | User discretion avised! 

How to install:

1. Download or clone the repo: `git clone https://github.com/spite/PerfMeter.git`
2. Go to `/src`, run `npm install`, then `npm run build`
3. Open `chrome://extensions` and make sure `Developer Mode` checkbox is ticked
4. Click `Load unpacked extension` and select the folder you've downloaded the repo to
5. Open a page with WebGL
6. Open DevTools
7. Go to PerfMeter tab
8. Hit `Reload` to instrument the tab

### About the library

Even though this is intended as a Chrome Extension -and in the future, via de Web Extensions, a Firefox one-, the instrumentation library itself (`src/lib.js`) is designed so it can be used in other browsers. 
