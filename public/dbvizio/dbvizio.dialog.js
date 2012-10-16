var Dialog = function($el) {
    this.$el = $el;
};

Dialog.prototype.setContent = function(content) {
    this.$el.html(content);

    return this;
};

Dialog.prototype.open = function() {
    this.$el.show(0);

    return this;
};

Dialog.prototype.close = function(content) {
    this.$el.hide(0).html('');

    return this;
};

Dialog.prototype.center = function() {
    this.$el.css({
        'marginTop':  '-' + (this.$el.outerHeight() / 2) + 'px',
        'marginLeft': '-' + (this.$el.outerWidth()  / 2) + 'px'
    });

    return this;
};