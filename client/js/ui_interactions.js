$(function() {
    
    //$( "#tree" ).selectmenu();
    
    $("#tree").change(function(e) {
        var tree_file = e.target.value;
        d3.json(tree_file, function (error, data) {
            initTree(data);
        });
    });

});
