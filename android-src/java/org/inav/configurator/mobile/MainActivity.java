package org.inav.configurator.mobile;

import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // App-lokale Plugins registrieren (VOR super.onCreate)
        registerPlugin(UsbSerialPlugin.class);
        registerPlugin(NativeDemoPlugin.class);
        registerPlugin(FileDialogPlugin.class);
        super.onCreate(savedInstanceState);

        // Use the CSS device viewport; the Android stylesheet handles layout.
        WebSettings s = getBridge().getWebView().getSettings();
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(false);
        s.setTextZoom(100);
        s.setSupportZoom(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);

        // Der Configurator parst die Electron-Version aus dem User-Agent
        // (configurator_main.js: userAgent.match(/Electron\/.../)[1]) —
        // ohne diesen Zusatz crasht der Tab-Aufbau mit "null[1]".
        s.setUserAgentString(s.getUserAgentString() + " Electron/0.0.0-android");
    }
}
