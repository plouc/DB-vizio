$(document).ready(function() {

    $.getJSON('schema.json', function(data) {

        var savedState = $.totalStorage.getItem('cdm'),
            $schema = $('#schema'),
            tables = data.tables,
            relations = data.relations,
            $tables,
            $columns,
            $table,
            $field,
            zIndex = 100,
            linksByTable = {},
            linksByColumn = {};

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

        var columnToTable = function(columnId) {
            return columnId.substr(0, columnId.indexOf('.'));
        };

        var pathInstructionsFromNodes = function($a, $b) {

            var aPos = $a.offset(),
                bPos = $b.offset(),
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

            pathDef = 'M' + start.x + ',' + start.y +
                      'H' + mid.x   +
                      'V' + end.y   +
                      'H' + end.x;
            /*
            pathDef = 'M' + start.x + ',' + start.y +
                      'Q' + mid.x   + ',' + start.y + ' ' + mid.x + ',' + mid.y +
                      'Q' + mid.x   + ',' + end.y   + ' ' + end.x + ',' + end.y;
            */

            return pathDef;
        };

        var toggleColumns = function($tables, action) {
            var $columns = $tables.find('.columns');
            if (action == 'collapse' || ($columns.is(':visible') && action != 'expand')) {
                $columns.css('display', 'none');
                $tables.addClass('collapsed').find('.toggle').text('+');
                update();
            } else if (action == 'expand' || (!$columns.is(':visible') && action != 'collapse')) {
                $columns.css('display', 'block');
                $tables.removeClass('collapsed').find('.toggle').text('-');
                update();
            }
        };

        var saveState = function() {
            var state = {};
            $tables.each(function() {
                $table = $(this);
                state[$table.attr('id')] = {
                    'zIndex': $table.css('zIndex'),
                    'left': $table.css('left'),
                    'top': $table.css('top')
                };
            });
            $.totalStorage.setItem('cdm', state);
        };

        _.each(tables, function(table, i) {
            $table = $('<div class="table" id="' + table.name + '">' +
                '<h2>' + table.name + '<span class="toggle">-</span></h2>' +
                '<div class="columns"></div>' +
            '</div>');
            $table.css('zIndex', zIndex + i);

            $columns = $table.find('.columns');

            _.each(table.fields, function(field) {
                $field = $('<div class="field" id="' + field.id.replace('.', '--') + '">' +
                    '<h3>' + field.name + '</h3> ' +
                    '<span class="type">' + field.type + '</span>' +
                '</div>');
                $columns.append($field);
            });

            if (savedState !== null && savedState[table.name]) {
                $table.css({
                    'zIndex': savedState[table.name].zIndex,
                    'left': savedState[table.name].left,
                    'top': savedState[table.name].top
                });
            }

            $schema.append($table);
        });

        $tables = $('.table');
        $tables
            .on('mousedown', function() {
                var $higher = $tables.highestDepth(),
                    current = parseInt($(this).css('zIndex'), 10),
                    higher  = parseInt($higher.css('zIndex'), 10);
                if (current < higher) {
                    $(this).css('zIndex', higher);
                }
            })
            .draggable({
                handle: 'h2',
                drag: function(e) {
                    updateLinks(this.id);
                },
                stop: function(e) {
                    updateLinks(this.id);
                    update();
                }
            }).hover(function(e) {
                if (linksByTable[this.id]) {
                    _.each(linksByTable[this.id], function(linkMeta) {
                        linkMeta.$node.attr('class', 'highlight');
                    });
                }
            }, function(e) {
                if (linksByTable[this.id]) {
                    _.each(linksByTable[this.id], function(linkMeta) {
                        linkMeta.$node.attr('class', '');
                    });
                }
            });

        $tables.find('.toggle').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                toggleColumns($(this).parents('.table'));
            });

        $tables.find('h2').on('dblclick', function(e) {
                toggleColumns($(this).parents('.table'));
            });

        $('#collapse-all').on('click', function(e) {
            e.preventDefault();
            toggleColumns($tables, 'collapse');
        });
        $('#expand-all').on('click', function(e) {
            e.preventDefault();
            toggleColumns($tables, 'expand');
        });


        var updateLinks = function(tables) {
            tables = !_.isArray(tables) ? [tables] : tables;
            _.each(tables, function(table) {
                if (linksByTable[table]) {
                    linksMeta = linksByTable[table];
                    _.each(linksMeta, function(linkMeta) {
                        linkMeta.$node.attr('d', pathInstructionsFromNodes(
                            linkMeta.$source, linkMeta.$target
                        ));
                    });
                }
            });
        };


        var update = function () {
            saveState();
        };


        /**
         * Compute links
         */
        $('#svg').svg();
        var svg = $('#svg').svg('get'),
            $sourceColumn,
            sourceTable,
            $targetColumn,
            targetTable,
            link,
            linkMeta;

        _.each(relations, function(relation) {

            $sourceColumn = $('#' + relation.source.replace('.', '--'));
            $targetColumn = $('#' + relation.target.replace('.', '--'));

            if ($sourceColumn.length === 1 && $targetColumn.length === 1) {

                link = svg.path(pathInstructionsFromNodes($sourceColumn, $targetColumn));
                linkMeta = {
                    $source: $sourceColumn,
                    $target: $targetColumn,
                    $node:   $(link)
                };

                sourceTable = columnToTable(relation.source);
                targetTable = columnToTable(relation.target);

                if (!linksByTable[sourceTable]) {
                    linksByTable[sourceTable] = [];
                }
                linksByTable[sourceTable].push(linkMeta);

                if (!linksByColumn[relation.source.replace('.', '--')]) {
                    linksByColumn[relation.source.replace('.', '--')] = [];
                }
                linksByColumn[relation.source.replace('.', '--')].push(linkMeta);

                if (!linksByTable[targetTable]) {
                    linksByTable[targetTable] = [];
                }
                linksByTable[targetTable].push(linkMeta);

                if (!linksByColumn[relation.target.replace('.', '--')]) {
                    linksByColumn[relation.target.replace('.', '--')] = [];
                }
                linksByColumn[relation.target.replace('.', '--')].push(linkMeta);
            }
        });
    });
});
