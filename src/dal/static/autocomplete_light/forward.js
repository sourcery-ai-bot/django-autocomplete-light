;(function($, yl) {
    yl.forwardHandlerRegistry = yl.forwardHandlerRegistry || {};

    yl.registerForwardHandler = function(name, handler) {
        yl.forwardHandlerRegistry[name] = handler;
    };

    yl.getForwardHandler = function(name) {
        return yl.forwardHandlerRegistry[name];
    };

    function getForwardStrategy(element) {
        var checkForCheckboxes = function() {
            var all = true;
            $.each(element, function(ix, e) {
                if ($(e).attr("type") !== "checkbox") {
                    all = false;
                }
            });
            return all;
        };

        if (element.length === 1 &&
                element.attr("type") === "checkbox" &&
                element.attr("value") === undefined) {
            // Single checkbox without 'value' attribute
            // Boolean field
            return "exists";
        } else if (element.length === 1 &&
                element.attr("multiple") !== undefined) {
            // Multiple by HTML semantics. E. g. multiple select
            // Multiple choice field
            return "multiple";
        } else if (checkForCheckboxes()) {
            // Multiple checkboxes or one checkbox with 'value' attribute.
            // Multiple choice field represented by checkboxes
            return "multiple";
        } else {
            // Other cases
            return "single";
        }
    }

    yl.getForwards = function(element) {
        var forwardElem,
            forwardList,
            prefix,
            forwardedData,
            divSelector,
            form;
        divSelector = "div.dal-forward-conf#dal-forward-conf-for-" +
                element.attr("id");
        form = element.length > 0 ? $(element[0].form) : $();

        forwardElem = form.find(divSelector).find('script');
        if (forwardElem.length === 0) {
            return;
        }
        try {
            forwardList = JSON.parse(forwardElem.text());
        } catch (e) {
            return;
        }

        if (!Array.isArray(forwardList)) {
            return;
        }

        prefix = $(element).getFormPrefix();
        forwardedData = {};

        $.each(forwardList, function(ix, f) {
            var getFieldValue = function(field) {
                var strategy = getForwardStrategy(field);
                var serializedField = field.serializeArray();

                var getSerializedFieldElementAt = function(index) {
                    // Return serializedField[index]
                    // or null if something went wrong
                    if (serializedField.length > index) {
                        return serializedField[index];
                    } else {
                        return null;
                    }
                };

                var getValueOf = function(elem) {
                    // Return elem.value
                    // or null if something went wrong
                    if (elem.hasOwnProperty("value") &&
                            elem.value !== undefined) {
                        return elem.value;
                    } else {
                        return null;
                    }
                };

                var getSerializedFieldValueAt = function (index) {
                    // Return serializedField[index].value
                    // or null if something went wrong
                    var elem = getSerializedFieldElementAt(index);
                    if (elem !== null) {
                        return getValueOf(elem);
                    } else {
                        return null;
                    }
                };

                if (strategy === "multiple") {
                    return serializedField.map(
                        function (item) { return getValueOf(item); }
                    );
                } else if (strategy === "exists") {
                    return serializedField.length > 0;
                } else {
                    return getSerializedFieldValueAt(0);
                }
            };
            if (f.type === "const") {
                forwardedData[f.dst] = f.val;
            } else if (f.type === "self") {
                var dstName;
                if (f.hasOwnProperty("dst")) {
                    dstName = f.dst;
                } else {
                    dstName = "self";
                }
                forwardedData[dstName] = getFieldValue($(element));
            } else if (f.type === "field") {
                var srcName,
                    dstName;
                srcName = f.src;
                if (f.hasOwnProperty("dst")) {
                    dstName = f.dst;
                } else {
                    dstName = srcName;
                }

                // First look for this field in the inline
                var fieldSelector = "[name=" + prefix + srcName + "]";
                var field = $(fieldSelector);
                if (!field.length) {
                    // As a fallback, look for it outside the inline
                    fieldSelector = "[name=" + srcName + "]";
                    field = $(fieldSelector);
                }
                forwardedData[dstName] = getFieldValue(field);
            } else if (f.type === "javascript") {
                var handler = yl.getForwardHandler(f.handler);
                forwardedData[f.dst] = handler(element, prefix);
            }
        });
        return JSON.stringify(forwardedData);
    };
})(yl.jQuery, yl);