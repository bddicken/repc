/**
 * Save js object to JSON file.
 */

(function(console){

    console.save = function(data, filename){

        if(!data) {
            console.error('Console.save: No data')
            return;
        }

        if(!filename) filename = 'console.json'

        if(typeof data === "object"){
            data = JSON.stringify(data, undefined, 1);
        }

        var blob = new Blob([data], {type: 'text/json'}),
        e    = document.createEvent('MouseEvents'),
        a    = document.createElement('a')

        a.download = filename
        a.href = window.URL.createObjectURL(blob)
        a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
        e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
        a.dispatchEvent(e)
    }
})(console);

/**
 * Load json file.
 */

if (window.File && window.FileReader && window.FileList && window.Blob) {
    window.onload = function() {
        var fileInput = document.getElementById('fileInput');

        fileInput.addEventListener('change', function(e) {
            var file = fileInput.files[0];
            var textType = /text.*/;
            //console.log(file.type);

            if (file.type.match(textType) || file.type == "") {
                var reader = new FileReader();

                reader.onload = function(e) {
                    var tree = JSON.parse(reader.result);
                    cleanAfterSave(tree);
                    initTree(tree);
                    initTree(tree);
                }

                reader.readAsText(file);    
            } else {
                alert("File not supported!");
            }
        });
    }
} else {
    alert('The File APIs are not fully supported in this browser.');
}

var bar = 70;
var side = 250;
var margin = {top: 20, right: 20, bottom: 30, left: 60};
var width =  $( window ).width();
var height =  $( window ).height() - bar - margin.top - margin.bottom;
    
var i = 0,
    duration = 750,
    tree_roots;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("#word-tree")
      .style("border-style", "solid")
      .style("border-color", "#888")
      .style("border-width", "4px")
      .style("display", "inline-block")
    .append("svg")
      .attr("id", "tree-vis")
      .attr("width", $( window ).width() - side)
      .attr("height", $( window ).height() - 90)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var sidebar = d3.select("#side-bar")
      .style("width", (side-45) + "px")
      .style("height", ($( window ).height() - 90) + "px")
      .style("border-style", "solid")
      .style("border-color", "DarkSlateBlue")
      .style("border-width", "3px")
      .style("border-width", "2px")
      .style("display", "inline-block");

var initTree = function(relations) {
  
  // clear old tree
  var node = svg.selectAll("g.node").remove();
  var link = svg.selectAll("path.link").remove();

  tree_roots = [];
  tree_roots.push(relations);
  tree_roots[0].x0 = height / 2;
  tree_roots[0].y0 = 0;

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  tree_roots[0].children.forEach(collapse);
  update(tree_roots[0]);
}

d3.json("./resource/relations.json", function(error, relations) {
  initTree(relations);
});

d3.select("#export").on("click", function() { 
    cleanBeforeSave(tree_roots[tree_roots.length-1]);
    console.save(tree_roots[tree_roots.length-1], "rel.json"); 
    cleanAfterSave(tree_roots[tree_roots.length-1]);
    update(tree_roots[tree_roots.length-1]);
});

function cleanAfterSave(d) {
  
  if(!d.children && !d._children) {
    return;
  }
  for (var i in d.children) {
    cleanAfterSave(d.children[i]);
  }
  
  if(d.children && d.childrenReplace == "replace") {
    d._children = d.children;
    d.children = null;
  }

  delete d.childrenReplace;
}

function cleanBeforeSave(d) {
  
  if(!d.children && !d._children) {
    delete d._children;
    delete d.parent;
    return;
  }
  
  if(d.children == null) {
    d.childrenReplace = "replace";
    d.children = d._children;
  }
    
  delete d._children;
  delete d.parent;

  for (var i in d.children) {
    cleanBeforeSave(d.children[i]);
  }
}

d3.select(self.frameElement).style("height", "800px");

function update(source) {
    
    d3.select("#tree-vis")
      .attr("width", $( window ).width() - side)
      .attr("height", $( window ).height() - 90)
  
  var labelScale = d3.scale.linear()
      .domain([0, tree_roots[tree_roots.length-1].size])
      .range([12, 50]);

  // Compute the new tree layout.
  var nodes = tree.nodes(tree_roots[tree_roots.length-1]).reverse(),
      links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 280; });

  // Update the nodes…

  var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        return "" + 
            "<strong>Path:</strong> <span style='color:red'>" + getAncestorPath(d) + "</span>" +
            "</br>" +
            "<strong>Path Length:</strong> <span style='color:red'>" + getAncestorPathLength(d) + "</span>";
      });

  svg.call(tip);

  var node = svg.selectAll("g.node")
  .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; });
  
  nodeEnter.append("circle")
      .attr("class", "node-root-select")
      .attr("r", 4)
      .attr("x", 15)
      .attr("y", -9)
      .style("fill", function(d) { 
            return "black";
      })
      .on("click", rootUpdate);

  nodeEnter.append("circle")
      .attr("class", "node-handle")
      .attr("r", 1e-6)
      .style("fill", function(d) {
                 if (d.type == "pos") { return "LightGreen"; }
            else if (d.type == "unk") { return "Khaki"; }
            else if (d.type == "neg") { return "LightCoral"; }
            return "black";
      })
      .on("click", click)
      .on('mouseover', tip.show)
      .on('mouseout', tip.hide);
  
  nodeEnter.append("rect")
      .attr("class", "green")
      .style("fill", "LightGreen")
      .attr("width", 18)
      .attr("height", 18)
      .attr("x", 15)
      .attr("y", -9)
      .style("opacity", 0.7)
      .on("mouseover", function(d) { d3.select(this).style("opacity", 1.0); })
      .on("mouseout", function(d) { d3.select(this).style("opacity", 0.7); })
      .on("click", function(d) { console.log("pos"); updateTree(d,"pos"); })

  nodeEnter.append("rect")
      .attr("class", "yellow")
      .style("fill", "Khaki")
      .attr("width", 18)
      .attr("height", 18)
      .attr("x", 33)
      .attr("y", -9)
      .style("opacity", 0.7)
      .on("mouseover", function(d) { d3.select(this).style("opacity", 1.0); })
      .on("mouseout", function(d) { d3.select(this).style("opacity", 0.7); })
      .on("click", function(d) { console.log("unk"); updateTree(d,"unk"); })

  nodeEnter.append("rect")
      .attr("class", "red")
      .style("fill", "LightCoral")
      .attr("width", 18)
      .attr("height", 18)
      .attr("x", 51)
      .attr("y", -9)
      .style("opacity", 0.7)
      .on("mouseover", function(d) { d3.select(this).style("opacity", 1.0); })
      .on("mouseout", function(d) { d3.select(this).style("opacity", 0.7); })
      .on("click", function(d) { console.log("neg"); updateTree(d,"neg"); })

  nodeEnter.append("text")
      .attr("x", function(d) { return 75; })
      .attr("dy", ".35em")
      .attr("font-size", function(d) { 
        //return Math.ceil(Math.log(d.size+1))*15 + "px"; 
        return labelScale(d.size) + "px";
      })
      .attr("text-anchor", function(d) { return "start"; })
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1e-6);
  
  nodeEnter.append("text")
      .attr("x", function(d) { return -(26+((d.size + "").length *6)); })
      .attr("y", function(d) { return -3; })
      .attr("dy", ".55em")
      .attr("font-size", "12px")
      .attr("text-anchor", "start")
      .text(function(d) { return d.size; });

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
  
  nodeUpdate.select(".node-root-select")
      .attr("r", 4)
      .attr("cx", -16)
      .attr("cy", 0)
      .style("fill", function(d) { return"black";})

  nodeUpdate.select(".node-handle")
      .attr("r", 9)
      .style("fill", function(d) {
                 if (d.type == "pos") { return "LightGreen"; }
            else if (d.type == "neg") { return "LightCoral"; }
            else                      { return "Khaki"; }
      })

  nodeUpdate.select("text")
      .attr("font", function(d) { 
          if ('size' in d) {
              return Math.ceil(Math.log(d.size+1))*15 + "px";
          }
          return 12 + "px"; 
      })
      .style("fill-opacity", 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
      .remove();

  nodeExit.select(".node-handle")
      .attr("r", 1e-6);

  nodeExit.select("text")
      .attr("font-size", function(d) { return 50; })
      .style("fill-opacity", 1e-6);

  // Update the links…
  var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      });

  // Transition links to their new position.
  link.transition()
      .duration(duration)
      .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
      .duration(duration)
      .attr("d", function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

//
function rootUpdate(d) {
  var top_root = tree_roots[tree_roots.length-1];
  if (d == top_root) {
      if (tree_roots.length > 1) {
          tree_roots.pop();
      } else {
          alert("already at root!");
      }
  } else {
      tree_roots.push(d);
  }
  update(tree_roots[tree_roots.length-1]);
}


// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}

// Get ancestor path length
function getAncestorPathLength(d) {
  if(d.parent) { return getAncestorPathLength(d.parent) + 1; }
  return 1;
}

// Gat ancestor path
function getAncestorPath(d) {
  if(d.parent) { return getAncestorPath(d.parent) + " ~ " + d.name; }
  return d.name;
}

// Update children type on click.
function updateTree(d, type) {
  d.type = type;
  for (var i in d._children) {
    updateTree(d._children[i], type);
  }
  for (var i in d.children) {
    updateTree(d.children[i], type);
  }
  update(d);
}

$( window ).resize(function() {
  width = $( window ).width() - side;
  height = $( window ).height() - bar - margin.top - margin.bottom;
  tree.size([height, width]);
  d3.select("#tree-vis")
    .attr("width", width )
    .attr("height", height );
  d3.select("#side-bar")
    .style("height", function(d) { return ($( window ).height() - 90) + "px"; });
  update(tree_roots[tree_roots.length-1]);
});

