package com.jester.minidayz;

import android.annotation.SuppressLint;
import android.annotation.TargetApi;
import android.app.Activity;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.Point;
import android.os.Build;
import android.os.Bundle;
import android.view.RoundedCorner;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.window.OnBackInvokedCallback;
import android.window.OnBackInvokedDispatcher;

public final class MainActivity extends Activity {
    private static final String GAME_URL = "file:///android_asset/index.html";
    private WebView gameView;
    private Object backCallback;
    private ScreenInsets gameSafeArea = new ScreenInsets(0, 0, 0, 0);

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        configureWindow();

        gameView = createGameView();
        setContentView(gameView);
        registerBackNavigation();
        enterImmersiveMode();

        if (savedInstanceState == null) {
            gameView.loadUrl(GAME_URL);
        } else {
            gameView.restoreState(savedInstanceState);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private WebView createGameView() {
        WebView view = new WebView(this);
        view.setLayoutParams(new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        view.setBackgroundColor(Color.BLACK);
        view.setKeepScreenOn(true);
        view.setHorizontalScrollBarEnabled(false);
        view.setVerticalScrollBarEnabled(false);
        view.setOverScrollMode(View.OVER_SCROLL_NEVER);
        view.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView loadedView, String url) {
                refreshGameViewport();
            }
        });
        view.setWebChromeClient(new WebChromeClient());
        view.setOnApplyWindowInsetsListener((v, insets) -> {
            updateGameSafeArea(v, insets);
            return insets;
        });

        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(false);

        // Construct 2 loads data.js and media through same-origin file requests.
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setTextZoom(100);

        return view;
    }

    private void configureWindow() {
        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(Color.TRANSPARENT);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams attributes = window.getAttributes();
            attributes.layoutInDisplayCutoutMode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
                    ? WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
                    : WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(attributes);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.setNavigationBarDividerColor(Color.TRANSPARENT);
        }
    }

    private void enterImmersiveMode() {
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.setDecorFitsSystemWindows(false);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.systemBars());
                controller.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            window.getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }

        refreshGameViewport();
    }

    private void refreshGameViewport() {
        if (gameView == null) {
            return;
        }

        gameView.requestLayout();
        gameView.evaluateJavascript(
                "window.MiniDayZScreen && (window.MiniDayZScreen.setInsets("
                        + gameSafeArea.left + ","
                        + gameSafeArea.top + ","
                        + gameSafeArea.right + ","
                        + gameSafeArea.bottom + "), window.MiniDayZScreen.refresh());",
                null);
    }

    private void updateGameSafeArea(View view, WindowInsets windowInsets) {
        gameSafeArea = readSafeArea(view, windowInsets);
        view.post(this::refreshGameViewport);
    }

    private ScreenInsets readSafeArea(View view, WindowInsets windowInsets) {
        ScreenInsets safeArea = new ScreenInsets(0, 0, 0, 0);

        // Gesture insets are the most reliable content boundary on modern curved
        // displays, including devices whose rounded-corner radius is reported as 0.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            safeArea = ScreenInsets.union(safeArea, Api30DisplayGeometry.read(windowInsets));
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            safeArea = ScreenInsets.union(safeArea, Api29GestureGeometry.read(windowInsets));
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            safeArea = ScreenInsets.union(safeArea, Api31RoundedCorners.read(view, windowInsets));
        }

        // Camera cutout bounds are deliberately excluded. Only waterfall geometry
        // is read below, so the requested left-side camera remains full bleed.
        return safeArea;
    }

    private void registerBackNavigation() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            backCallback = Api33BackNavigation.register(this, this::handleBackNavigation);
        }
    }

    private void handleBackNavigation() {
        if (gameView != null && gameView.canGoBack()) {
            gameView.goBack();
        } else {
            moveTaskToBack(true);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            enterImmersiveMode();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (gameView != null) {
            gameView.onResume();
        }
        enterImmersiveMode();
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        enterImmersiveMode();
        gameView.post(this::refreshGameViewport);
    }

    @Override
    protected void onPause() {
        if (gameView != null) {
            gameView.onPause();
        }
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        gameView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    @SuppressLint("GestureBackNavigation")
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        handleBackNavigation();
    }

    @Override
    protected void onDestroy() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && backCallback != null) {
            Api33BackNavigation.unregister(this, backCallback);
            backCallback = null;
        }

        if (gameView != null) {
            gameView.destroy();
            gameView = null;
        }
        super.onDestroy();
    }

    @TargetApi(Build.VERSION_CODES.TIRAMISU)
    private static final class Api33BackNavigation {
        private Api33BackNavigation() {
        }

        static Object register(Activity activity, Runnable handler) {
            OnBackInvokedCallback callback = handler::run;
            activity.getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                    OnBackInvokedDispatcher.PRIORITY_DEFAULT,
                    callback);
            return callback;
        }

        static void unregister(Activity activity, Object callback) {
            activity.getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback(
                    (OnBackInvokedCallback) callback);
        }
    }

    private static final class ScreenInsets {
        final int left;
        final int top;
        final int right;
        final int bottom;

        ScreenInsets(int left, int top, int right, int bottom) {
            this.left = left;
            this.top = top;
            this.right = right;
            this.bottom = bottom;
        }

        static ScreenInsets union(ScreenInsets first, ScreenInsets second) {
            return new ScreenInsets(
                    Math.max(first.left, second.left),
                    Math.max(first.top, second.top),
                    Math.max(first.right, second.right),
                    Math.max(first.bottom, second.bottom));
        }
    }

    @TargetApi(Build.VERSION_CODES.Q)
    private static final class Api29GestureGeometry {
        private Api29GestureGeometry() {
        }

        static ScreenInsets read(WindowInsets windowInsets) {
            Insets gestures = windowInsets.getSystemGestureInsets();
            Insets mandatory = windowInsets.getMandatorySystemGestureInsets();
            return new ScreenInsets(
                    Math.max(gestures.left, mandatory.left),
                    Math.max(gestures.top, mandatory.top),
                    Math.max(gestures.right, mandatory.right),
                    Math.max(gestures.bottom, mandatory.bottom));
        }
    }

    @TargetApi(Build.VERSION_CODES.R)
    private static final class Api30DisplayGeometry {
        private Api30DisplayGeometry() {
        }

        static ScreenInsets read(WindowInsets windowInsets) {
            Insets gestures = windowInsets.getInsetsIgnoringVisibility(
                    WindowInsets.Type.systemGestures()
                            | WindowInsets.Type.mandatorySystemGestures());
            Insets waterfall = windowInsets.getDisplayCutout() == null
                    ? Insets.NONE
                    : windowInsets.getDisplayCutout().getWaterfallInsets();
            return new ScreenInsets(
                    Math.max(gestures.left, waterfall.left),
                    Math.max(gestures.top, waterfall.top),
                    Math.max(gestures.right, waterfall.right),
                    Math.max(gestures.bottom, waterfall.bottom));
        }
    }

    @TargetApi(Build.VERSION_CODES.S)
    private static final class Api31RoundedCorners {
        private Api31RoundedCorners() {
        }

        static ScreenInsets read(View view, WindowInsets insets) {
            int width = view.getWidth();
            int height = view.getHeight();
            int left = 0;
            int top = 0;
            int right = 0;
            int bottom = 0;

            RoundedCorner[] corners = {
                    insets.getRoundedCorner(RoundedCorner.POSITION_TOP_LEFT),
                    insets.getRoundedCorner(RoundedCorner.POSITION_TOP_RIGHT),
                    insets.getRoundedCorner(RoundedCorner.POSITION_BOTTOM_RIGHT),
                    insets.getRoundedCorner(RoundedCorner.POSITION_BOTTOM_LEFT)
            };

            for (int index = 0; index < corners.length; index++) {
                RoundedCorner corner = corners[index];
                if (corner == null || corner.getRadius() <= 0) {
                    continue;
                }

                Point center = corner.getCenter();
                if (index == 0 || index == 3) {
                    left = Math.max(left, center.x);
                } else {
                    right = Math.max(right, width - center.x);
                }

                if (index == 0 || index == 1) {
                    top = Math.max(top, center.y);
                } else {
                    bottom = Math.max(bottom, height - center.y);
                }
            }

            return new ScreenInsets(left, top, right, bottom);
        }
    }
}
