(function () {
    "use strict";

    var nativeParse = JSON.parse;
    var NativeXMLHttpRequest = window.XMLHttpRequest;
    var fontSizePattern = /(?:^|\s)\d+(?:\.\d+)?pt(?:\s|$)/i;

    // Construct requests the project with responseType="json", which bypasses
    // the page's JSON.parse function. Force only data.js/data.json through the
    // text path so the compatibility transform below can update its text flags.
    if (typeof Proxy === "function" && NativeXMLHttpRequest) {
        function CompatibleXMLHttpRequest() {
            var request = new NativeXMLHttpRequest();
            var isProjectRequest = false;

            return new Proxy(request, {
                get: function (target, property) {
                    if (property === "open") {
                        return function (method, url) {
                            isProjectRequest = /(?:^|\/)data\.(?:js|json)(?:[?#]|$)/i.test(String(url));
                            return target.open.apply(target, arguments);
                        };
                    }

                    var value = Reflect.get(target, property, target);
                    return typeof value === "function" ? value.bind(target) : value;
                },
                set: function (target, property, value) {
                    if (isProjectRequest && property === "responseType" && value === "json") {
                        value = "text";
                    }

                    return Reflect.set(target, property, value, target);
                }
            });
        }

        CompatibleXMLHttpRequest.prototype = NativeXMLHttpRequest.prototype;
        window.XMLHttpRequest = CompatibleXMLHttpRequest;
    }

    function isCharacterWrappedTextProperties(value) {
        return Array.isArray(value)
            && value.length === 9
            && typeof value[0] === "string"
            && typeof value[1] === "number"
            && typeof value[2] === "string"
            && fontSizePattern.test(value[2])
            && typeof value[3] === "string"
            && value[7] === 1;
    }

    function enableWholeWordWrapping(projectData) {
        var pending = [projectData];

        while (pending.length) {
            var value = pending.pop();

            if (!value || typeof value !== "object") {
                continue;
            }

            if (isCharacterWrappedTextProperties(value)) {
                value[7] = 0;
                continue;
            }

            if (Array.isArray(value)) {
                for (var index = 0; index < value.length; index++) {
                    pending.push(value[index]);
                }
            } else {
                for (var key in value) {
                    if (Object.prototype.hasOwnProperty.call(value, key)) {
                        pending.push(value[key]);
                    }
                }
            }
        }

        return projectData;
    }

    JSON.parse = function (text, reviver) {
        var parsed = nativeParse.call(JSON, text, reviver);

        if (parsed && parsed.project) {
            enableWholeWordWrapping(parsed);
            window.XMLHttpRequest = NativeXMLHttpRequest;
        }

        return parsed;
    };
}());
