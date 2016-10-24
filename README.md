# PerfMeter

### Work In Progress | User discretion avised! 

How to install:

1. Download or clone the repo: `git clone https://github.com/spite/PerfMeter.git`
2. Open `chrome://extensions` and make sure `Developer Mode` checkbox is ticked
3. Click `Load unpacked extension` and select the folder you've downloaded the repo to
4. Open a page with WebGL
5. Open DevTools
6. Go to PerfMeter tab
7. Hit `Reload` to instrument the tab

### About the library

Even though this is intended as a Chrome Extension -and in the future, via de Web Extensions, a Firefox one-, the instrumentation library itself (`src/lib.js`) is designed so it can be used in other browsers. 
