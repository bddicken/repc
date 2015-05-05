
$(function() {

    $("#tree").selectmenu({
      change : function(e) {
        var tree_file = e.target.value;
        d3.json(tree_file, function (error, data) {
            allData = data;
            initInterfaceWithData(data);
        });
      }
    });
    
    $("#about").button().click(function() {
        window.location = "./about.html";
    });
    
    $("#export").button();
    
    $("#test").button();

    $( "#selectable" ).selectable({
        selected : function(event, ui) {
            var key = $(ui.selected).html();
            initTree(allData[key]);
        }
    });
    
});
