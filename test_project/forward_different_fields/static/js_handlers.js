$(document).ready(function() {
    yl.registerForwardHandler("const42", function () {
        return 42;
    });

    yl.registerForwardHandler("reverse_name", function(elem, prefix) {
        // First look for this field in the inline
        var fieldSelector = "[name=" + prefix + "name" + "]";
        var field = $(fieldSelector);
        if (!field.length) {
            // As a fallback, look for it outside the inline
            fieldSelector = "[name=" + "name" + "]";
            field = $(fieldSelector);
        }

        var name = field.val();
        return name.split("").reverse().join("");
    });
});
