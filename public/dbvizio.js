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
    this.$svgContainer.svg({
        settings: {
            width:  '100%',
            height: '100%'
        }
    });
    this.svg = this.$svgContainer.svg('get');

    this.links = [];

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
DBvizio.prototype.colToTable = function(columnId, sanitized) {

    var separator = sanitized === true ? '--' : '.';

    return columnId.substr(0, columnId.indexOf(separator));
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
 * Bring an elment to front using z-index
 *
 * @param $target
 * @param $elements
 */
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

    return this;
};

/**
 * Fix viewport width, problem with absolute positioning
 *
 * @return {*}
 */
DBvizio.prototype.fixViewport = function() {

    var $this, pos, right, bottom,
        rightBound  = 0,
        bottomBound = 0;

    this.$tables.each(function() {
        $this  = $(this);
        pos    = $this.position();
        right  = pos.left + $this.outerWidth();
        bottom = pos.top  + $this.outerHeight();
        if (right > rightBound) {
            rightBound = right;
        }
        if (bottom > bottomBound) {
            bottomBound = bottom;
        }
    });

    $('body').css({
        width:  rightBound  + 100,
        height: bottomBound + 100
    });

    return this;
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

    this.$tables = this.$container.find('.table');
    this.$tables
        .on('mousedown', function() {
            self.sendToFront($(this), self.$tables);
        })
        .draggable({
            handle: 'h2',
            drag: function(e) {
                self.fixViewport();
                self.updateLinks(this.id);
            },
            stop: function(e) {
                self.fixViewport();
                self.sendToFront($(this), self.$tables);
                self.updateLinks(this.id);
                self.saveState();
            }
        })
        .hover(function(e) {
            var links = self.getLinksForTable(this.id);
            _.each(links, function(link) {
                link.$svgPath.attr('class', 'highlight');
            });
        }, function(e) {
            var links = self.getLinksForTable(this.id);
            _.each(links, function(link) {
                link.$svgPath.attr('class', '');
            });
        });

    this.$tables.find('.toggle').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.toggleColumns($(this).parents('.table'));
    });

    this.$tables.find('h2').on('dblclick', function(e) {
        self.toggleColumns($(this).parents('.table'));
    });

    this.fixViewport();

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
        svgPath,
        linkMeta,
        sourceColumnId,
        targetColumnId,
        tablesLinksOrder  = {},
        columnsLinksOrder = {},
        columnsLinkCount  = {};

    _.each(this.relations, function(relation) {

        sourceColumnId = self.sanitizeColId(relation.source);
        targetColumnId = self.sanitizeColId(relation.target);

        $sourceColumn = $('#' + sourceColumnId);
        $targetColumn = $('#' + targetColumnId);

        if ($sourceColumn.length === 1 && $targetColumn.length === 1) {

            sourceTable = self.colToTable(relation.source);
            targetTable = self.colToTable(relation.target);

            svgPath = self.svg.path('');
            linkMeta = {
                $source: $sourceColumn,
                $target: $targetColumn,
                $node: $(svgPath)
            };

            link = new DBvizio.Link(
                $('#' + sourceTable),
                $sourceColumn,
                $('#' + targetTable),
                $targetColumn,
                $(svgPath)
            );
            self.links.push(link);


            if (!columnsLinksOrder[sourceColumnId]) {
                columnsLinksOrder[sourceColumnId] = {};
            }
            columnsLinksOrder[sourceColumnId][targetColumnId] = _.size(columnsLinksOrder[sourceColumnId]);

            if (!columnsLinksOrder[targetColumnId]) {
                columnsLinksOrder[targetColumnId] = {};
            }
            columnsLinksOrder[targetColumnId][sourceColumnId] = _.size(columnsLinksOrder[targetColumnId]);

            if (!tablesLinksOrder[sourceTable]) {
                tablesLinksOrder[sourceTable] = {};
            }

            if (!tablesLinksOrder[targetTable]) {
                tablesLinksOrder[targetTable] = {};
            }

            if (!columnsLinkCount[sourceColumnId]) {
                columnsLinkCount[sourceColumnId] = 0;
            }
            columnsLinkCount[sourceColumnId]++;

            if (!columnsLinkCount[targetColumnId]) {
                columnsLinkCount[targetColumnId] = 0;
            }
            columnsLinkCount[targetColumnId]++;
        }
    });

    _.each(this.links, function(link) {
        link.sourceColumnRelativeOrder = columnsLinksOrder[link.sourceColumn][link.targetColumn];
        link.sourceColumnLinkCount     = columnsLinkCount[link.sourceColumn];
        link.targetColumnRelativeOrder = columnsLinksOrder[link.targetColumn][link.sourceColumn];
        link.targetColumnLinkCount     = columnsLinkCount[link.targetColumn];
    });

    console.log(this.links);
    //console.log(columnsLinkCount);
    //console.log(columnsLinksOrder, tablesLinksOrder);

    return this;
};

/**
 * Get links related to given table
 *
 * @param tableName
 * @return {Array}
 */
DBvizio.prototype.getLinksForTable = function(tableName) {

    var links = [];

    _.each(this.links, function(link) {
        if (link.sourceTable === tableName || link.targetTable === tableName) {
            links.push(link);
        }
    });

    return links;
};

/**
 * Update link positions for the given table(s)
 *
 * @param tables
 * @return {*}
 */
DBvizio.prototype.updateLinks = function(tables) {

    var self = this,
        links,
        processed = {};

    tables = tables === undefined ? _.pluck(this.tables, 'name') : (!_.isArray(tables) ? [tables] : tables);

    _.each(tables, function(table) {
        links = self.getLinksForTable(table);
        _.each(links, function(link) {
            if (!processed[link.id]) {
                link.draw();
                processed[link.id] = true;
            }
        });
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



/**
 * DBvizio.Link constructor
 *
 * @param $sourceTable
 * @param $sourceColumn
 * @param $targetTable
 * @param $targetColumn
 * @param $svgPath
 * @constructor
 */
DBvizio.Link = function($sourceTable, $sourceColumn,
                        $targetTable, $targetColumn,
                        $svgPath) {

    this.$sourceTable              = $sourceTable;
    this.sourceTable               = $sourceTable.attr('id');
    this.$sourceColumn             = $sourceColumn;
    this.sourceColumn              = $sourceColumn.attr('id');
    this.sourceColumnRelativeOrder = 0;
    this.sourceColumnLinkCount     = 0;
    this.$targetTable              = $targetTable;
    this.targetTable               = $targetTable.attr('id');
    this.$targetColumn             = $targetColumn;
    this.targetColumn              = $targetColumn.attr('id');
    this.targetColumnRelativeOrder = 0;
    this.targetColumnLinkCount     = 0;
    this.$svgPath                  = $svgPath;

    this.id = this.sourceColumn + '->' + this.targetColumn;

    this.mode = 'square';
};

DBvizio.Link.prototype.draw = function() {
    this.$svgPath.attr('d', this.computePath());
};

/**
 * Compute path definition from 2 (jQuery) dom elements
 *
 * @return {*}
 */
DBvizio.Link.prototype.computePath = function() {

    var $a, $b,
        aPos, bPos,
        aWidth, bWidth,
        aHeight, bHeight,
        start, mid, end,
        aHeightMult = 0.5,
        bHeightMult = 0.5,
        pathDef,
        tmp;

    if (this.$sourceColumn.is(':visible')) {
        $a = this.$sourceColumn;
        aHeightMult = ++this.sourceColumnRelativeOrder / ++this.sourceColumnLinkCount;
    } else {
        $a = this.$sourceTable.find('h2');
    }

    if (this.$targetColumn.is(':visible')) {
        $b = this.$targetColumn;
        bHeightMult = ++this.targetColumnRelativeOrder / this.targetColumnLinkCount;
    } else {
        $b = this.$targetTable.find('h2');
    }

    //console.log(aHeightMult, bHeightMult);

    aPos = $a.offset();
    bPos = $b.offset();

    if (bPos.left < aPos.left) {
        tmp = $a;
        $a = $b;
        $b = tmp;

        tmp = aPos;
        aPos = bPos;
        bPos = tmp;

        tmp = aHeightMult;
        aHeightMult = bHeightMult;
        bHeightMult = tmp;
    }

    aWidth  = $a.outerWidth();
    aHeight = $a.outerHeight();
    bWidth  = $b.outerWidth();
    bHeight = $b.outerHeight();

    //console.log(aHeight, aHeightMult, aHeight * aHeightMult, bHeight, bHeightMult, bHeight * bHeightMult);

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

    if (this.mode === 'square') {
        pathDef = 'M' + start.x + ',' + start.y +
                  'H' + mid.x   +
                  'V' + end.y   +
                  'H' + end.x;
    } else if (this.mode === 'round') {
        pathDef = 'M' + start.x + ',' + start.y +
                  'Q' + mid.x   + ',' + start.y + ' ' + mid.x + ',' + mid.y +
                  'Q' + mid.x   + ',' + end.y   + ' ' + end.x + ',' + end.y;
    } else {
        throw new Error('invalid path mode :' + this.pathMode);
    }

    return pathDef;
};
