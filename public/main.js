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
            $groupTablePick = $('#group-table-pick');

        dbviz.buildTables()
             .fetchSavedState()
             .buildLinks()
             .updateLinks()
             .fixViewport();

        var dialog = new Dialog($('#dialog'));

        var renderGroupTables = function(group, $wrapper) {

            $wrapper.html('');

            var tables = group.getTableNames();

            if (tables.length > 0) {
                _.each(tables, function(table) {
                    $wrapper.append('<li>' +
                        '<span>' +
                            table + '<span class="remove">x</span>' +
                        '</span>' +
                    '</li>');
                });
            }
        };

        var groupTablePick = function(id) {

            var group = dbviz.getGroup(id),
                $select;

            dialog.setContent($groupTablePick.html());

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
                group.add($table);
                renderGroupTables(group, $groupTables);
                dialog.center();
                dbviz.saveState();
            });

            dialog.open().center();
        };

        var addGroupCmd = function(id) {
            var $group = $('<span class="group">' + id + '</span>');
            $group.on('click', function() {
                groupTablePick(id);
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
                }
            });
        });
    });
});
