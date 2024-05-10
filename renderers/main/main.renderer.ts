import {readFile} from "fs/promises";
import {platform} from "os";
import {cwd} from "process";
import {join} from "path";
import {Settings} from "../settings/settings.renderer";
import {ElectronBlocker} from "@cliqz/adblocker-electron";
import fetch from "cross-fetch";

import {
    app,
    BrowserWindow,
    nativeImage,
    globalShortcut,
    Menu,
    ipcMain,
    session,
} from "electron";

export interface resolution {
    /** Screen width */
    width: number;
    /** Screen height */
    height: number;
}

interface windowParams {
    bounds: Electron.Rectangle;
    fullscreen: boolean;
    cursor: boolean;
}

export class Renderer {
    /** userAgent allowed by YouTube TV. */
    private readonly userAgent: string =
        "Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.24 (KHTML, like Gecko) Chrome/11.0.696.77 Large Screen Safari/534.24 GoogleTV/092754";

    /** Electron process */
    private window: BrowserWindow;

    /** Settings window */
    private settings: Settings | null;

    /** Cursor visibility flag. */
    private _cursor: boolean = false;

    /** YouTube TV url with path/params */
    private readonly _url: string = "https://www.youtube.com/tv?";

    /** JavaScript injection code */
    private jsic: string = "";

    /** JavaScript's injection title bar styles */
    private titleBar: string = "";

    constructor() {
        // Set app menu to null.
        Menu.setApplicationMenu(null);

        app
            .on("ready", () => {
                this.createWindow();

                try {
                    this.injectBlocker();
                } catch (error) {
                    console.error(error);
                }

                this.listenWindowMoveEvents();

                this.url = "__DFT__";

                this.window.webContents.on("dom-ready", () =>
                    this.injectJSCode.bind(this)
                );

                this.setAccelerators();

                if (platform() === "darwin") {
                    this.window.on("enter-full-screen", () => (this.fullScreen = true));
                    this.window.on("leave-full-screen", () => (this.fullScreen = false));
                }

                this.window.on("close", () => {
                    if (this.settings) {
                        this.settings.destroy();
                        this.settings = null;
                    }
                });
            })
            .on("window-all-closed", () => {
                app.quit();
            });
    }

    /** Create a new renderer window. */
    private createWindow() {
        this.window = new BrowserWindow({
            width: 1230,
            height: 720,
            titleBarStyle: platform() === "darwin" ? "hiddenInset" : "default",
            fullscreen: false,
            fullscreenable: true,
            title: "YouTube TV",
            backgroundColor: "#282828",
            icon: nativeImage.createFromPath(join(cwd(), "build", "icon.png")),
            webPreferences: {
                nodeIntegration: false,
                webSecurity: true,
                contextIsolation: false,
                backgroundThrottling: false,
                preload: join(__dirname, "preload.js"),
            },
        });


        process.nextTick(() => this.loadSettings());
    }

    /**
     * Inject a JavaScript code into the renderer process to patch events and add some features.
     * @param script Type of script to be injected.
     * */
    private async injectJSCode(script: "all" | "patchs" | "titlebar" = "all") {
        try {
            if (this.jsic === "") {
                this.jsic = await readFile(join(__dirname, "injection.js"), {
                    encoding: "utf8",
                });
            }

            if (platform() === "darwin" && this.titleBar === "") {
                this.titleBar = await readFile(join(__dirname, "titleBar.js"), {
                    encoding: "utf8",
                });
            }

            if (script === "all") {
                await this.window.webContents.executeJavaScript(this.jsic);
                platform() === "darwin"
                    ? await this.window.webContents.executeJavaScript(this.titleBar)
                    : false;
            } else if (script === "patchs") {
                await this.window.webContents.executeJavaScript(this.jsic);
            } else if (script === "titlebar") {
                platform() === "darwin"
                    ? await this.window.webContents.executeJavaScript(this.titleBar)
                    : false;
            }
        } catch (error) {
            debugger;
            // throw new Error(error as unknown as any);
        }
    }

    private injectBlocker() {
        ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
            blocker.enableBlockingInSession(session.defaultSession);
            blocker.enableBlockingInSession(session.fromPartition("persist:ytv"));
        });
    }

    public setMaxRes(params: { width: number; height: number; reload: boolean }) {
        const {width, height, reload} = params;

        this.localStorageQuery("set", "maxRes", {width, height});

        if (reload) {
            this.setResEmulator(width, height);
            this.window.webContents.reload();
        } else this.updateWindowParams();
    }

    /** Emulate a screen with assigned parameters */
    private setResEmulator(emuWidth: number = 3840, emuHeight: number = 2160) {
        // Delete all listeners.
        this.window.removeAllListeners("resize");

        // Add a listener to the window to recalculate the emulator.
        this.window.on("resize", () => {
            this.calcEmulatedDisplay(emuWidth, emuHeight);
            this.updateWindowParams();
        });

        // Initial calculation.
        this.calcEmulatedDisplay(emuWidth, emuHeight);
    }

    private calcEmulatedDisplay(emuWidth: number, emuHeight: number) {
        // Get the current screen size.
        const screenSize = this.window.getSize();

        // Calculate scale based on the ratio of emulated size to the current size.
        const scale = Math.min(screenSize[0] / emuWidth, screenSize[1] / emuHeight);

        // Calculate view size based on the scale.
        const viewSize = {
            width: screenSize[0] / scale,
            height: screenSize[1] / scale,
        };

        // Set the device emulation.
        this.window.webContents.disableDeviceEmulation();
        this.window.webContents.enableDeviceEmulation({
            screenSize: {width: emuWidth, height: emuHeight},
            viewSize: viewSize,
            scale: scale,
            screenPosition: "mobile",
            viewPosition: {x: 0.5, y: 0.5},
            deviceScaleFactor: 0,
        });
    }

    /**
     * Listen keyboard shortcuts to perform some actions.
     */
    private setAccelerators() {
        globalShortcut.register("ctrl+shift+s", () => {
            if (this.settings) {
                this.settings.destroy();
                this.settings = null;
            } else {
                this.settings = new Settings();
            }
        });

        globalShortcut.register("ctrl+shift+f", () => {
            this.fullScreen = !this.window.isFullScreen();
        });

        globalShortcut.register("ctrl+shift+f12", () => {
            this.window.webContents.toggleDevTools();
        });

        globalShortcut.register("ctrl+shift+r", () => {
            this.window.webContents.reload();
        });

        globalShortcut.register("ctrl+shift+a", () => (this.cursor = null));

        globalShortcut.register("ctrl+shift+q", () => {
            this.window.close();
        });

    }

    /**
     * Performs a query to the local storage of the renderer process.
     * @param type Query type.
     * @param key Key of the object to be stored in the localStorage.
     * @param value Value to be set for the given key.
     */
    public async localStorageQuery(
        type: "set",
        key: string,
        value: any
    ): Promise<any>;
    public async localStorageQuery(type: "delete", key: any): Promise<any>;
    public async localStorageQuery(type: "get", key: any): Promise<any>;
    public async localStorageQuery(type: "clear"): Promise<any>;
    public async localStorageQuery(type: "raw", data: string): Promise<any>;
    public async localStorageQuery(
        type: "get" | "set" | "delete" | "clear" | "raw",
        key?: string,
        value?: any,
        data?: string
    ): Promise<any> {
        if (
            type === "get" ||
            type === "set" ||
            type === "delete" ||
            type === "clear" ||
            type === "raw"
        ) {
            let query = "localStorage.";

            if (type === "get") query += `getItem('${key}')`;
            else if (type === "set") {
                if (typeof value === "object") value = `'${JSON.stringify(value)}'`;
                query += `setItem('${key}', ${value})`;
            } else if (type === "delete") query += `removeItem('${key}')`;
            else if (type === "clear") query += "clear()";
            else if (type === "raw") query = data as string;

            const unresolvedQuery = this.window.webContents.executeJavaScript(query);

            if (type === "get") {
                try {
                    const resolver = await unresolvedQuery;
                    const parsed = JSON.parse(resolver);
                    return Promise.resolve(parsed);
                } catch (error) {
                    return unresolvedQuery;
                }
            } else return unresolvedQuery;
        } else return Promise.reject("unknown query type");
    }

    private listenWindowMoveEvents() {
        this.window.on("moved", () => {
            this.updateWindowParams();
        });
    }

    private getWindowParams() {
        const bounds = this.window.getBounds();
        const fullscreen = this.window.isFullScreen();
        const cursor = this._cursor;

        return {bounds, fullscreen, cursor} as windowParams;
    }

    private updateWindowParams() {
        const params = this.getWindowParams();
        this.localStorageQuery("set", "windowParams", params);
    }

    private loadSettings() {
        this.localStorageQuery("get", "windowParams").then((data: windowParams) => {
            this.window.setBounds(data.bounds);
            this.window.fullScreen = data.fullscreen;
            this.cursor = data.cursor;

            this.window.on("resized", () => {
                this.updateWindowParams();
            });
        });

        this.localStorageQuery("get", "maxRes")
            .then((data: resolution) => {
                // If the user has not set a resolution, set the default one.
                if (!data) this.setResEmulator();
                else {
                    if (data.width && data.height)
                        this.setResEmulator(data.width, data.height);
                    else this.setResEmulator();
                }
            })
            .catch(() => {
                // If the data is invalid or not available, set the default resolution.
                this.setResEmulator(3840, 2160);
            });
    }

    /**
     * Load new user connection **and reload the renderer process**.\
     * If value is '\_\_DFT\_\_', the default YouTube TV url will be loaded.
     * */
    public set url(value: string) {
        let url = value;
        if (typeof value !== "string") return;
        if (value.length < 1) return;
        if (value === "__DFT__") url = "";

        this.window
            .loadURL(this._url + url, {userAgent: this.userAgent})
            .then(() => {
                this.injectJSCode();
            })
            .catch(async () => {
                ipcMain.once("restored", () => {
                    this.url = value;
                });

                await this.injectJSCode("titlebar");
                const offline = await readFile(join(__dirname, "offline_banner.js"), {
                    encoding: "utf8",
                });
                await this.window.webContents.executeJavaScript(offline);
            });
    }

    public set urlByDial(value: string) {
        if (typeof value !== "string") return;
        if (value.length < 1) return;

        this.window.fullScreen = true;

        this.window.webContents
            .loadURL(this._url + value, {userAgent: this.userAgent})
            .then(() => {
                this.injectJSCode();
            })
            // This should never happen...
            .catch(async () => {
                ipcMain.once("restored", () => {
                    this.urlByDial = value;
                });

                await this.injectJSCode("titlebar");
                const offline = await readFile(join(__dirname, "offline_banner.js"), {
                    encoding: "utf8",
                });
                await this.window.webContents.executeJavaScript(offline);
            });
    }

    public set fullScreen(value: boolean | null) {
        if (value === null) {
            this.fullScreen = !this.window.isFullScreen();
            return;
        } else {
            if (typeof value !== "boolean") return;
            this.window.fullScreen = value;
            this.updateWindowParams();
        }
    }

    /** Toggle cursor visibility */
    public set cursor(value: boolean | null) {
        if (typeof value !== "boolean") this._cursor = !this._cursor;
        else this._cursor = value;

        if (this._cursor) {
            this.window.webContents.insertCSS("html {cursor: default;}");
        } else if (!this._cursor) {
            this.window.webContents.insertCSS("html {cursor: none;}");
        } else {
            this.window.webContents.insertCSS("html {cursor: none;}");
        }

        this.updateWindowParams();
    }

}
