(function () {
    "use strict";

    var logoPath = "/images/main_menu_logo-sheet0.png";
    var cleanedLogos = new WeakMap();
    var nativeDrawImage = CanvasRenderingContext2D.prototype.drawImage;

    function isMainMenuLogo(source) {
        if (!(source instanceof HTMLImageElement) || !source.src) {
            return false;
        }

        try {
            return new URL(source.src, document.baseURI).pathname.endsWith(logoPath);
        } catch (error) {
            return source.src.indexOf("images/main_menu_logo-sheet0.png") !== -1;
        }
    }

    function withoutPlusSign(source) {
        if (!isMainMenuLogo(source)) {
            return source;
        }

        var cleaned = cleanedLogos.get(source);
        if (cleaned) {
            return cleaned;
        }

        cleaned = document.createElement("canvas");
        cleaned.width = source.naturalWidth;
        cleaned.height = source.naturalHeight;

        var context = cleaned.getContext("2d");
        nativeDrawImage.call(context, source, 0, 0);

        var imageData = context.getImageData(0, 0, cleaned.width, cleaned.height);
        var pixels = imageData.data;

        for (var index = 0; index < pixels.length; index += 4) {
            var red = pixels[index];
            var green = pixels[index + 1];
            var blue = pixels[index + 2];

            if (red > green * 2 && red > blue * 2) {
                pixels[index + 3] = 0;
            }
        }

        context.putImageData(imageData, 0, 0);

        cleanedLogos.set(source, cleaned);
        return cleaned;
    }

    CanvasRenderingContext2D.prototype.drawImage = function (source) {
        var args = Array.prototype.slice.call(arguments);
        args[0] = withoutPlusSign(source);
        return nativeDrawImage.apply(this, args);
    };

    function patchTextureUpload(contextType) {
        if (!contextType || !contextType.prototype) {
            return;
        }

        var nativeTexImage2D = contextType.prototype.texImage2D;
        contextType.prototype.texImage2D = function () {
            var args = Array.prototype.slice.call(arguments);

            for (var index = 0; index < args.length; index += 1) {
                if (isMainMenuLogo(args[index])) {
                    args[index] = withoutPlusSign(args[index]);
                    break;
                }
            }

            return nativeTexImage2D.apply(this, args);
        };
    }

    patchTextureUpload(window.WebGLRenderingContext);
    patchTextureUpload(window.WebGL2RenderingContext);
}());
