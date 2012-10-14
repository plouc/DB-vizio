/**
 * DBvizio constructor
 *
 * @param tables
 * @param relations
 * @param $container
 * @param $svgContainer
 * @constructor
 */
var DBvizio = function(tables, relations, $container, $svgContainer) {

    this.tables    = tables;
    this.relations = relations;

    this.$container    = $container;
    this.$svgContainer = $svgContainer;
    this.$svgContainer.svg();
    this.svg = this.$svgContainer.svg('get');

    this.linksByTable  = {};
    this.linksByColumn = {};

    this.pathMode = 'square';

    this.$tables = $([]);

    this.storageId = 'dbvizio';
    this.savedState = null;
};

/**
 * Return table name for a given column id
 * user.id -> user
 *
 * @param columnId
 * @return {String}
 */
DBvizio.prototype.colToTable = function(columnId) {
    return columnId.substr(0, columnId.indexOf('.'));
};

/**
 * Remove dots from column id
 * user.id -> user--id
 *
 * @param columnId
 * @return {*}
 */
DBvizio.prototype.sanitizeColId = function(columnId) {
    return columnId.replace('.', '--');
};

/**
 * Compute path definition from 2 (jQuery) dom elements
 *
 * @param $a
 * @param $b
 * @return {*}
 */
DBvizio.prototype.pathDefFromNodes = function($a, $b) {

    var aPos = $a.offset(),
        bPos = $b.offset(),
        aLinkCount = 0,
        bLinkCount = 0,
        aWidth, bWidth,
        aHeight, bHeight,
        start, mid, end,
        pathDef,
        tmp;

    if (bPos.left < aPos.left) {
        tmp = aPos;
        aPos = bPos;
        bPos = tmp;

        tmp = $a;
        $a = $b;
        $b = tmp;
    }

    aWidth  = $a.outerWidth();
    aHeight = $a.outerHeight();
    bWidth  = $b.outerWidth();
    bHeight = $b.outerHeight();

    if ($a.is('h2')) {
        if (this.linksByTable[$a.parents('.table').attr('id')]) {
            aLinkCount = this.linksByTable[$a.parents('.table').attr('id')].length;
        }
    } else {
        //console.log(linksByColumn);
        //aLinkCount = linksByColumn[$a.attr('id')].length;
    }
    //console.log(aLinkCount);

    if ($b.is('h2')) {

    } else {

    }

    start = {
        x:  aPos.left,
        xx: aPos.left + aWidth,
        y:  aPos.top + aHeight / 2
    };
    end = {
        x:  bPos.left,
        xx: bPos.left + bWidth,
        y:  bPos.top + bHeight / 2
    };
    if (end.x > start.x + aWidth) {
        start.x = start.x + aWidth;
    }

    mid = {
        x: start.x + (end.x - start.x) / 2,
        y: start.y + (end.y - start.y) / 2
    };
    if (start.xx >= end.x) {
        mid.x = start.x - 20;
    }

    //console.log('x:' + start.x + ' y:' + start.y + ', x:' + mid.x + ' y:' + mid.y + ', x:' + end.x + ' y:' + end.y);

    if (this.pathMode === 'square') {
        pathDef = 'M' + start.x + ',' + start.y +
                  'H' + mid.x   +
                  'V' + end.y   +
                  'H' + end.x;
    } else if (this.pathMode === 'round') {
        pathDef = 'M' + start.x + ',' + start.y +
                  'Q' + mid.x   + ',' + start.y + ' ' + mid.x + ',' + mid.y +
                  'Q' + mid.x   + ',' + end.y   + ' ' + end.x + ',' + end.y;
    } else {
        throw new Error('invalid path mode :' + this.pathMode);
    }

    return pathDef;
};

DBvizio.prototype.sendToFront = function($target, $elements) {

    var group = $.makeArray($elements).sort(function(a,b) {
    	return (parseInt($(a).css('zIndex'),10) || 0) - (parseInt($(b).css('zIndex'),10) || 0);
    });
    if (!group.length) {
        return;
    }

    var min = parseInt(group[0].style.zIndex) || 0;
    $(group).each(function(i) {
    	this.style.zIndex = min + i;
    });

    $target.css('zIndex', min + group.length);

    /*
    var zIndex,
        $element,
        $highest = null,
        highest = 1;

    $elements.each(function() {

        $element = $(this);
        zIndex = $element.css('zIndex');

        if (zIndex !== 'auto') {
            if (zIndex > highest) {
                $highest = $element;
                highest = zIndex;
            }
        }

        console.log(highest);
        //console.log($(this).css('zIndex'));
    });

    $element.css('zIndex', highest);

    $.fn.highestDepth = function() {
        var $highest = null, highest = 0, zIndex;
        this.each(function() {
            zIndex = parseInt($(this).css('zIndex'), 10);
            if (zIndex > highest) {
                $highest = $(this);
                highest  = zIndex;
            }
        });
        return $highest;
    };
    */
};

/**
 *
 * @return {*}
 */
DBvizio.prototype.buildTables = function() {

    var self = this,
        $table,
        $columns;

    _.each(this.tables, function(table, i) {
        $table = $('<div class="table" id="' + table.name + '">' +
            '<h2>' + table.name + '<span class="toggle">-</span></h2>' +
            '<div class="columns"></div>' +
        '</div>');

        $columns = $table.find('.columns');

        _.each(table.fields, function(field) {
            $field = $('<div class="field" id="' + field.id.replace('.', '--') + '">' +
                '<h3>' + field.name + '</h3> ' +
                '<span class="type">' + field.type + '</span>' +
            '</div>');
            $columns.append($field);
        });

        if (self.savedState !== null && self.savedState[table.name]) {
            $table.css({
                'zIndex': self.savedState[table.name].zIndex,
                'left':   self.savedState[table.name].left,
                'top':    self.savedState[table.name].top
            });
            if (self.savedState[table.name].collapsed === true) {
                self.toggleColumns($table, 'collapse', false);
            }
        }

        self.$container.append($table);
    });

    self.$tables = this.$container.find('.table');
    self.$tables
        .on('mousedown', function() {
            self.sendToFront($(this), self.$tables);
            /*
            var $higher = $tables.highestDepth(),
                current = parseInt($(this).css('zIndex'), 10),
                higher  = parseInt($higher.css('zIndex'), 10);
            if (current < higher) {
                $(this).css('zIndex', higher);
            }
            */
        })
        //.resizable()
        .draggable({
            handle: 'h2',
            drag: function(e) {
                self.updateLinks(this.id);
            },
            stop: function(e) {
                self.sendToFront($(this), self.$tables);
                self.updateLinks(this.id);
                self.saveState();
            }
        })
        .hover(function(e) {
            if (self.linksByTable[this.id]) {
                _.each(self.linksByTable[this.id], function(linkMeta) {
                    linkMeta.$node.attr('class', 'highlight');
                });
            }
        }, function(e) {
            if (self.linksByTable[this.id]) {
                _.each(self.linksByTable[this.id], function(linkMeta) {
                    linkMeta.$node.attr('class', '');
                });
            }
        });

    self.$tables.find('.toggle').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.toggleColumns($(this).parents('.table'));
    });

    self.$tables.find('h2').on('dblclick', function(e) {
        self.toggleColumns($(this).parents('.table'));
    });

    return this;
};

/**
 * Append links for each relation
 *
 * @return {*}
 */
DBvizio.prototype.buildLinks = function() {

    var self = this,
        $sourceColumn,
        sourceTable,
        $targetColumn,
        targetTable,
        link,
        linkMeta;

    _.each(this.relations, function(relation) {

        $sourceColumn = $('#' + self.sanitizeColId(relation.source));
        $targetColumn = $('#' + self.sanitizeColId(relation.target));

        if ($sourceColumn.length === 1 && $targetColumn.length === 1) {

            link = self.svg.path('');
            linkMeta = {
                $source: $sourceColumn,
                $target: $targetColumn,
                $node:   $(link)
            };

            sourceTable = self.colToTable(relation.source);
            targetTable = self.colToTable(relation.target);

            if (!self.linksByTable[sourceTable]) {
                self.linksByTable[sourceTable] = [];
            }
            self.linksByTable[sourceTable].push(linkMeta);

            if (!self.linksByColumn[self.sanitizeColId(relation.source)]) {
                self.linksByColumn[self.sanitizeColId(relation.source)] = [];
            }
            self.linksByColumn[self.sanitizeColId(relation.source)].push(linkMeta);

            if (!self.linksByTable[targetTable]) {
                self.linksByTable[targetTable] = [];
            }
            self.linksByTable[targetTable].push(linkMeta);

            if (!self.linksByColumn[self.sanitizeColId(relation.target)]) {
                self.linksByColumn[self.sanitizeColId(relation.target)] = [];
            }
            self.linksByColumn[self.sanitizeColId(relation.target)].push(linkMeta);
        }
    });

    return this;
};

/**
 * Update link positions for the given table(s)
 *
 * @param tables
 * @return {*}
 */
DBvizio.prototype.updateLinks = function(tables) {

    var self = this;

    tables = tables === undefined ? _.pluck(this.tables, 'name') : tables;
    tables = !_.isArray(tables) ? [tables] : tables;

    _.each(tables, function(table) {
        if (self.linksByTable[table]) {
            _.each(self.linksByTable[table], function(linkMeta) {
                linkMeta.$node.attr('d', self.pathDefFromNodes(
                    linkMeta.$source.is(':visible') ?
                    linkMeta.$source : linkMeta.$source.parents('.table').find('h2'),
                    linkMeta.$target.is(':visible') ?
                    linkMeta.$target : linkMeta.$target.parents('.table').find('h2')
                ));
            });
        }
    });

    return this;
};

/**
 *
 * @param $tables
 * @param action
 * @param update
 */
DBvizio.prototype.toggleColumns = function($tables, action, update) {

    $tables = $tables === '*' ? this.$tables : $tables;

    update = update === undefined ? true : update;

    var self = this;
        $columns = $tables.find('.columns');

    if (action == 'collapse' || ($columns.is(':visible') && action != 'expand')) {
        $columns.css('display', 'none');
        $tables.addClass('collapsed').find('.toggle').text('+');
    } else if (action == 'expand' || (!$columns.is(':visible') && action != 'collapse')) {
        $columns.css('display', 'block');
        $tables.removeClass('collapsed').find('.toggle').text('-');
    }

    if (update === true) {
        $tables.each(function() {
            self.updateLinks(this.id);
        });
        this.saveState();
    }
};

/**
 * Save current application state
 * nodes position, state (collapsed/expanded), depth
 *
 * @return {*}
 */
DBvizio.prototype.saveState = function() {

    var state = {},
        $table;

    this.$tables.each(function() {
        $table = $(this);
        state[$table.attr('id')] = {
            'zIndex':    $table.css('zIndex'),
            'left':      $table.css('left'),
            'top':       $table.css('top'),
            'collapsed': $table.hasClass('collapsed')
        };
    });
    $.totalStorage.setItem(this.storageId, state);

    return this;
};

/**
 * Get saved applicatiob state
 *
 * @return {*}
 */
DBvizio.prototype.fetchSavedState = function() {
    this.savedState = $.totalStorage.getItem(this.storageId);

    return this;
};