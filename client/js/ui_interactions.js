$(function() {
    
    $("#tree").selectmenu({
      change : function(e) {
        var tree_file = e.target.value;
        d3.json(tree_file, function (error, data) {
            initTree(data);
        });
      }
    });
    
    $("#about").button().click(function() {
        window.location = "./about.html";
    });
    
    $("#export").button();
    
    $("#test").button();
    
});
