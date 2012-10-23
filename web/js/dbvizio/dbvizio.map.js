/**
 *
 * @param $el
 * @param $viewport
 * @param $elements
 * @constructor
 */
DBvizio.Map = function($el, $viewport, $elements) {

    this.$el       = $el;
    this.$area     = $el.find('.area');
    this.$wrapper  = $el.find('.content');
    this.$viewport = $viewport;
    this.$elements = $elements || $();

    this.scale = 0;

    var self = this;

    this.$area.draggable({
        containment: this.$wrapper,
        drag: function() {
            var pos = self.$area.offset();
            $(window).scrollTop(pos.top / self.scale);
            $(window).scrollLeft(pos.left / self.scale);
        },
        stop: function() {

        }
    });
};

/**
 *
 * @param $element
 * @return {DBvizio.Map}
 */
DBvizio.Map.prototype.addElements = function($elements) {

    this.$elements = $elements;

    return this;
};

/**
 *
 * @param $element
 * @return {DBvizio.Map}
 */
DBvizio.Map.prototype.removeElement = function($element) {
    this.$elements.each(function() {
        // todo
    });

    return this;
};

/**
 *
 * @return {DBvizio.Map}
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
        heightBasedScale = dHeight / oHeight;

    if (widthBasedScale <= heightBasedScale) {
        this.scale = widthBasedScale;
    } else {
        this.scale = heightBasedScale;
    }

    this.$wrapper.html('');

    var self = this;

    var $element, pos, $div;

    this.$elements.each(function() {
        $element = $(this);
        pos = $element.offset();
        $div = $('<div/>').css({
            top:  pos.top  * self.scale,
            left: pos.left * self.scale,
            width: $element.outerWidth()   * self.scale,
            height: $element.outerHeight() * self.scale
        });
        self.$wrapper.append($div);
    });

    this.$area.css({
        width:  $(window).width()  * this.scale,
        height: $(window).height() * this.scale
    });


    return this;
};