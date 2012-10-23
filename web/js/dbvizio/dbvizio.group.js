/**
 * @constructor
 */
DBvizio.Group = function(id, $tables, $svgRect) {

    this.id = id;
    this.$tables = {};
    this.$svgRect = $svgRect;
    this.offset = 10;

    var self = this;

    if (_.isObject($tables)) {
        _.each($tables, function(table) {
            self.add($(table));
        });
    }
};

/**
 *
 * @return {Array}
 */
DBvizio.Group.prototype.getTableNames = function() {
    return _.keys(this.$tables);
};

/**
 *
 * @param $table
 * @return {DBvizio.Group}
 */
DBvizio.Group.prototype.add = function($table) {
    this.$tables[$table.attr('id')] = $table;

    return this;
};

/**
 *
 * @param $table
 * @return {DBvizio.Group}
 */
DBvizio.Group.prototype.remove = function($table) {

    var tableId = _.isString($table) ? $table : $table.attr('id');

    delete this.$tables[tableId];

    return this;
};

/**
 *
 * @return {DBvizio.Group}
 */
DBvizio.Group.prototype.render = function() {

    var self = this,
        ePos,
        eTop, eRight, eBottom, eLeft,
        top = null, right = null, bottom = null, left = null;

    _.each(this.$tables, function($table, id) {
        ePos    = $table.position();
        eTop    = ePos.top;
        eRight  = ePos.left + $table.outerWidth();
        eBottom = ePos.top  + $table.outerHeight();
        eLeft   = ePos.left;

        if (top === null || eTop < top) {
            top = eTop;
        }
        if (right === null || eRight > right) {
            right = eRight;
        }
        if (bottom === null || eBottom > bottom) {
            bottom = eBottom;
        }
        if (left === null || eLeft < left) {
            left = eLeft;
        }
    });

    top    = top    - this.offset;
    right  = right  + this.offset;
    bottom = bottom + this.offset;
    left   = left   - this.offset;

    this.$svgRect.attr({
        transform: 'translate(' + left + ',' + top + ')',
        width:  right  - left,
        height: bottom - top,
        rx: 5,
        ry: 5
    });

    //console.log(_.size(this.$tables), top, right, bottom, left);

    return this;
};