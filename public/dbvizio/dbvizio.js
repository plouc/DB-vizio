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

    this.svgGroup = this.svg.group({
        transform: 'translate(0 40)'
    });

    this.links  = [];
    this.groups = {};

    this.pathMode = 'square';

    this.$tables = $([]);

    this.storageId = 'dbvizio';
    this.savedState = null;
};

DBvizio.prototype.getTableNames = function() {

    var tableNames = [];

    this.$tables.each(function() {
        tableNames.push(this.id);
    });

    return tableNames;
};

/**
 *
 * @param id
 * @param $tables
 * @return {DBvizio}
 */
DBvizio.prototype.addGroup = function(id, $tables) {
    if (this.hasGroup(id) === true) {
        throw new Error('Group with id "' + id + '" already exists');
    }

    var svgRect  = this.svg.rect(this.svgGroup);
        $svgRect = $(svgRect);

    $svgRect.attr('class', 'group');

    this.groups[id] = new DBvizio.Group(id, $tables, $svgRect);

    return this;
};

/**
 *
 * @param id
 * @return {DBvizio}
 */
DBvizio.prototype.removeGroup = function(id) {
    if (this.hasGroup(id) === false) {
        throw new Error('Group with id "' + id + '" does not exists');
    }

    this.groups[id].$svgRect.remove();

    delete this.groups[id];

    return this;
};

/**
 * @param id
 * @return {Boolean}
 */
DBvizio.prototype.hasGroup = function(id) {
    return !!this.groups[id];
};

/**
 *
 * @param id
 * @return {DBvizio}
 */
DBvizio.prototype.getGroup = function(id) {
    if (!this.groups[id]) {
        throw new Error('No group found for id "' + id + '"');
    }

    return this.groups[id];
};

/**
 *
 * @return {DBvizio}
 */
DBvizio.prototype.renderGroups = function() {
    _.each(this.groups, function(group) {
        group.render();
    });

    return this;
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
 * @return {String}
 */
DBvizio.prototype.sanitizeColId = function(columnId) {
    return columnId.replace('.', '--');
};

/**
 * Bring an elment to front using z-index
 *
 * @param $target
 * @param $elements
 * @return {DBvizio}
 */
DBvizio.prototype.sendToFront = function($target, $elements) {

    var group = $.makeArray($elements).sort(function(a,b) {
    	return (parseInt($(a).css('zIndex'),10) || 0) - (parseInt($(b).css('zIndex'),10) || 0);
    });
    if (!group.length) {
        return this;
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
 * @return {DBvizio}
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
 * @return {DBvizio}
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

        self.$container.append($table);
    });

    this.$tables = this.$container.find('.table');
    this.$tables
        .on('mousedown', function() {
            self.sendToFront($(this), self.$tables);
        })
        .draggable({
            handle: 'h2',
            addClasses: false,
            drag: function(e) {
                self.fixViewport()
                    .renderLinks(this.id)
                    .renderGroups();
            },
            stop: function(e) {
                self.fixViewport()
                    .sendToFront($(this), self.$tables)
                    .renderLinks(this.id)
                    .saveState()
                    .renderGroups();
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
 * @return {DBvizio}
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

    //console.log(this.links);
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
 * @return {DBvizio}
 */
DBvizio.prototype.renderLinks = function(tables) {

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
 * @return {DBvizio}
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
            self.renderLinks(this.id)
                .renderGroups();
        });
        this.saveState();
    }

    return this;
};

/**
 * Save current application state
 * nodes position, state (collapsed/expanded), depth
 *
 * @return {DBvizio}
 */
DBvizio.prototype.saveState = function() {

    var state = {
            tables: {},
            groups: {}
        },
        $table;

    this.$tables.each(function() {
        $table = $(this);
        state.tables[$table.attr('id')] = {
            'zIndex':    $table.css('zIndex'),
            'left':      $table.css('left'),
            'top':       $table.css('top'),
            'collapsed': $table.hasClass('collapsed')
        };
    });

    _.each(this.groups, function(group, groupId) {
        state.groups[groupId] = group.getTableNames();
    });

    //console.log('saving', state.groups);

    $.totalStorage.setItem(this.storageId, state);

    return this;
};

/**
 * Get saved applicatiob state
 *
 * @return {DBvizio}
 */
DBvizio.prototype.fetchSavedState = function() {

    this.savedState = $.totalStorage.getItem(this.storageId);

    var self = this;

    if (this.savedState) {

        if (this.savedState.groups) {
            _.each(this.savedState.groups, function(tables, groupId) {
                var $tables = [],
                    $table;
                //console.log(groupId, 'fetched tables', tables);
                _.each(tables, function(table) {
                    $table = $('#' + table);
                    $tables.push($table);
                });
                self.addGroup(groupId, $tables);
            });
        }

        if (this.savedState.tables) {
            _.each(this.savedState.tables, function(state, table) {
                var $table = $('#' +table);
                $table.css({
                    'zIndex': state.zIndex,
                    'left':   state.left,
                    'top':    state.top
                });
                if (state.collapsed === true) {
                    self.toggleColumns($table, 'collapse', false);
                }
            });
        }
    }

    return this;
};