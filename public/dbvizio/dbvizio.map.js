/**
 *
 * @param $el
 * @param $viewport
 * @param $elements
 * @constructor
 */
DBvizio.Map = function($el, $viewport, $elements) {

    this.$el       = $el;
    this.$viewport = $viewport;
    this.$elements = $elements || $();

};

/**
 *
 * @param $element
 * @return {*}
 */
DBvizio.Map.prototype.addElements = function($elements) {

    this.$elements = $elements;

    return this;
};

/**
 *
 * @param $element
 * @return {*}
 */
DBvizio.Map.prototype.removeElement = function($element) {
    this.$elements.each(function() {
        // todo
    });

    return this;
};

/**
 *
 * @return {*}
 */
DBvizio.Map.prototype.render = function() {

    var oPos    = this.$viewport.offset(),
        oTop    = oPos.top,
        oLeft   = oPos.left,
        oWidth  = this.$viewport.outerWidth(),
        oHeight = this.$viewport.outerHeight(),
        dWidth  = this.$el.outerWidth(),
        dHeight = this.$el.outerHeight(),
        widthBasedScale  = dWidth / oWidth,
        heightBasedScale = dHeight / oHeight,
        scale;

    if (widthBasedScale <= heightBasedScale) {
        scale = widthBasedScale;
    } else {
        scale = heightBasedScale;
    }

    this.$el.html('');

    var self = this;

    var $element, pos, $div;

    this.$elements.each(function() {
        $element = $(this);
        pos = $element.offset();
        $div = $('<div/>').css({
            top:  pos.top * scale,
            left: pos.left * scale,
            width: $element.outerWidth() * scale,
            height: $element.outerHeight() * scale
        });
        self.$el.append($div);
    });

    this.$el.append($('<div class="area"/>').css({
        width:  $(window).width()  * scale,
        height: $(window).height() * scale
    }));


    return this;
};