$(document).ready(function() {

    $.getJSON('schema.json', function(data) {

        var dbviz = new DBvizio(
            data.tables,
            data.relations,
            $('#schema > div'),
            $('#svg')
        );

        var $createGroup = $('#create-group'),
            $groupCreation = $('#group-creation'),
            $groupRemoval = $('#group-removal'),
            $groupTablePick = $('#group-table-pick');

        dbviz.buildTables()
             .fetchSavedState()
             .buildLinks()
             .renderLinks()
             .renderGroups()
             .fixViewport();

        var dialog = new Dialog($('#dialog'));

        var renderGroupTables = function(group, $wrapper) {

            $wrapper.html('');

            var tables = group.getTableNames(),
                $table;

            if (tables.length > 0) {
                _.each(tables, function(table) {
                    $table = $('<li>' +
                        '<span>' +
                            table + '<span class="remove">x</span>' +
                        '</span>' +
                    '</li>');

                    $table.find('.remove').on('click', function(e) {
                        $table.remove();
                        group.remove(table).render();
                        dbviz.saveState();
                    });

                    $wrapper.append($table);
                });
            }
        };

        var groupTablePick = function(id) {

            var group = dbviz.getGroup(id),
                $select;

            dialog.setContent($groupTablePick.html());

            dialog.$el.find('.title').text(id);

            $select = dialog.$el.find('select');
            _.each(dbviz.getTableNames(), function(tableName) {
                $select.append('<option value="' + tableName + '">' + tableName + '</option>')
            });

            var $groupTables = dialog.$el.find('.group-tables');
            renderGroupTables(group, $groupTables);

            dialog.$el.find('.cancel').on('click', function() {
                dialog.close();
            });

            dialog.$el.find('.valid').on('click', function() {
                var table = $select.val(),
                    $table = $('#' + table);
                group.add($table).render();
                renderGroupTables(group, $groupTables);
                dialog.center();
                dbviz.saveState();
            });

            dialog.open().center();
        };

        var addGroupCmd = function(id) {
            var $group = $('<span class="group">' +
                id + '<span class="remove">x</span>' +
            '</span>');
            $group.on('click', function() {
                groupTablePick(id);
            });
            $group.find('.remove').on('click', function(e) {
                e.stopPropagation();
                dialog.setContent($groupRemoval.html());

                dialog.$el.find('strong').text(id);

                dialog.$el.find('.cancel').on('click', function() {
                    dialog.close();
                });

                dialog.$el.find('.valid').on('click', function() {
                    $group.remove();
                    dbviz.removeGroup(id)
                         .saveState();
                    dialog.close();
                });

                dialog.open().center();
            });
            $createGroup.after($group);
        };

        _.each(dbviz.groups, function(group, groupId) {
            addGroupCmd(groupId);
        });

        var addGroup = function(id) {
            dbviz.addGroup(id).saveState();
            addGroupCmd(id);
        };

        $('#collapse-all').on('click', function(e) {
            e.preventDefault();
            dbviz.toggleColumns('*', 'collapse');
        });
        $('#expand-all').on('click', function(e) {
            e.preventDefault();
            dbviz.toggleColumns('*', 'expand');
        });


        $createGroup.on('click', function(e) {
            e.preventDefault();

            dialog.setContent($groupCreation.html())
                  .open()
                  .center();

            var $input = dialog.$el.find('input[type="text"]');

            $input.focus();

            dialog.$el.find('.cancel').on('click', function() {
                dialog.close();
            });

            dialog.$el.find('.valid').on('click', function() {
                var groupId = $input.val();
                if (groupId === '') {
                    dialog.$el.prepend('<p class="error">Group id can not be empty</p>');
                } else if (dbviz.hasGroup(groupId)) {
                    dialog.$el.prepend('<p class="error">Group <strong>' + groupId + '</strong> already exists</p>');
                } else {
                    dialog.$el.find('.error').remove();
                    addGroup(groupId);
                    dialog.close();
                    groupTablePick(groupId);
                }
            });
        });

        var map = new DBvizio.Map($('#map'), $('body'));
        map.addElements(dbviz.$tables)
           .render();
    });
});
