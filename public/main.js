$(document).ready(function() {

    $.getJSON('schema.json', function(data) {

        var dbviz = new DBvizio(
            data.tables,
            data.relations,
            $('#schema > div'),
            $('#svg')
        );

        dbviz.fetchSavedState()
             .buildTables()
             .buildLinks()
             .updateLinks();

        $('#collapse-all').on('click', function(e) {
            e.preventDefault();
            dbviz.toggleColumns('*', 'collapse');
        });
        $('#expand-all').on('click', function(e) {
            e.preventDefault();
            dbviz.toggleColumns('*', 'expand');
        });
    });
});
