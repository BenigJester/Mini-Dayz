(function () {
    "use strict";

    var scheduledFrame = 0;
    var physicalInsets = { left: 0, top: 0, right: 0, bottom: 0 };

    function getViewportSize() {
        var viewport = window.visualViewport;
        var width = viewport ? viewport.width : window.innerWidth;
        var height = viewport ? viewport.height : window.innerHeight;

        return {
            width: Math.max(1, Math.round(width || document.documentElement.clientWidth)),
            height: Math.max(1, Math.round(height || document.documentElement.clientHeight))
        };
    }

    function resizeGame() {
        scheduledFrame = 0;

        var size = getViewportSize();
        if (typeof window.cr_sizeCanvas === "function" && window.cr_getC2Runtime()) {
            window.cr_sizeCanvas(size.width, size.height);
        }
    }

    function scheduleResize() {
        if (scheduledFrame) {
            window.cancelAnimationFrame(scheduledFrame);
        }

        scheduledFrame = window.requestAnimationFrame(function () {
            window.requestAnimationFrame(resizeGame);
        });
    }

    window.MiniDayZScreen = {
        refresh: scheduleResize,
        getInsets: function () {
            return {
                left: physicalInsets.left,
                top: physicalInsets.top,
                right: physicalInsets.right,
                bottom: physicalInsets.bottom
            };
        },
        setInsets: function (left, top, right, bottom) {
            physicalInsets.left = Math.max(0, Number(left) || 0);
            physicalInsets.top = Math.max(0, Number(top) || 0);
            physicalInsets.right = Math.max(0, Number(right) || 0);
            physicalInsets.bottom = Math.max(0, Number(bottom) || 0);
            scheduleResize();
        }
    };

    window.addEventListener("resize", scheduleResize, { passive: true });
    window.addEventListener("orientationchange", scheduleResize, { passive: true });
    window.addEventListener("pageshow", scheduleResize, { passive: true });

    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", scheduleResize, { passive: true });
        window.visualViewport.addEventListener("scroll", scheduleResize, { passive: true });
    }

    document.addEventListener("visibilitychange", function () {
        if (!document.hidden) {
            scheduleResize();
        }
    });

    scheduleResize();
}());
