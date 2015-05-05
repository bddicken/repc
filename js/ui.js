
var i = 0;
var duration = 750;
var tree_roots;
var allData = {};

var margin = {top: 20, right: 20, bottom: 30, left: 60};

var getTreeWidth   = function() { return ($(window).width()/100)*68; }
var getTreeHeight  = function() { return $(window).height() - margin.top - margin.bottom - 90; }
var getPanelWidth  = function() { return ($(window).width()/100)*29; }
var getPanelHeight = function() { return $(window).height() - margin.top - margin.bottom - 90; }

var tree = d3.layout.tree()
    .size([getTreeHeight() - 30, getTreeWidth()]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var svg = d3.select("#word-tree")
      .style("border-style", "solid")
      .style("border-color", "#888")
      .style("border-width", "4px")
      .style("display", "inline-block")
    .append("svg")
      .attr("id", "tree-vis")
      .attr("width", getTreeWidth() + "px")
      .attr("height",getTreeHeight() + "px")
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

d3.select("#selectable")
      .style("width", (getPanelWidth() - 30) + "px") 
      .style("height", (getPanelHeight() - 250) + "px");

d3.select("#scores")
      .style("width", (getPanelWidth() - 30) + "px")
      .style("height", 220 + "px")

var sidebar = d3.select("#side-bar")
      .style("width", getPanelWidth() + "px")
      .style("height", getPanelHeight())
      .style("border-style", "solid")
      .style("border-color", "DarkSlateBlue")
      .style("border-width", "3px")
      .style("border-width", "2px")
      .style("display", "block");

var initTree = function(relations) {
  
  // clear old tree
  var node = svg.selectAll("g.node").remove();
  var link = svg.selectAll("path.link").remove();

  tree_roots = [];
  tree_roots.push(relations);
  tree_roots[0].x0 = getTreeHeight() / 2;
  tree_roots[0].y0 = 0;

  // collapse nodes
  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  // compute sizes for each node
  function setNodeSizes(d) {
    if (d.children && d.children.length > 0) {
      var size = 0;
      for (var i in d.children) {
        size += setNodeSizes(d.children[i]);
      }
      d.size = size;
      return size;
    }
    else {
      d.size = 0;
      return 1;
    }
  }

  tree_roots[0].size = setNodeSizes(tree_roots[0]);
  tree_roots[0].children.forEach(collapse);
  update(tree_roots[0]);
}

var processDataPreSave = function(data) {
    for (var i in data) { 
        cleanBeforeSave(data[i]);
    }
}

var processDataPostSave = function(data) {
    for (var i in data) { 
        cleanAfterSave(data[i]);
    }
}

d3.select("#export").on("click", function() {
    
    processDataPreSave(allData);
    console.save(allData, "rel.json"); 
    processDataPostSave(allData);
    
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
      .attr("width", getTreeWidth() + "px")
      .attr("height", getTreeHeight() + "px")

  // Compute the new tree layout.
  var nodes = tree.nodes(tree_roots[tree_roots.length-1]).reverse(),
      links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 280; });
  
  var labelScale = null;
  var labelScale = d3.scale.linear()
      .domain([0, tree_roots[tree_roots.length-1].size])
      .range([12, 35]);

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
 
  var initTypeButton = function(selection) {
      selection
          .attr("width", 18)
          .attr("height", 18)
          .style("opacity", 0.7)
          .on("mouseover", function(d) { d3.select(this).style("opacity", 1.0); })
          .on("mouseout", function(d) { d3.select(this).style("opacity", 0.7); });
  }

  nodeEnter.append("rect")
      .attr("class", "green")
      .style("fill", "LightGreen")
      .attr("x", 15)
      .attr("y", -9)
      .on("click", function(d) { updateTree(d,"pos"); })
      .call(initTypeButton);

  nodeEnter.append("rect")
      .attr("class", "yellow")
      .style("fill", "Khaki")
      .attr("x", 33)
      .attr("y", -9)
      .on("click", function(d) { updateTree(d,"unk"); })
      .call(initTypeButton);

  nodeEnter.append("rect")
      .attr("class", "red")
      .style("fill", "LightCoral")
      .attr("x", 51)
      .attr("y", -9)
      .on("click", function(d) { updateTree(d,"neg"); })
      .call(initTypeButton);

  nodeEnter.append("text")
      .attr("class", "node-label")
      .attr("x", function(d) { return 75; })
      .attr("dy", ".35em")
      .attr("font-size", function(d) { 
        return labelScale(d.size) + "px";
      })
      .attr("text-anchor", function(d) { return "start"; })
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1e-6)
      .on("click", rootUpdate);
  
  nodeEnter.append("text")
      .attr("x", function(d) { return -(16+((d.size + "").length *6)); })
      .attr("y", function(d) { return -3; })
      .attr("dy", ".55em")
      .attr("font-size", "12px")
      .attr("text-anchor", "start")
      .text(function(d) { return d.size; });

  // Transition nodes to their new position.
  var nodeUpdate = node.transition()
      .duration(duration)
      .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

  nodeUpdate.select(".node-handle")
      .attr("r", 9)
      .style("fill", function(d) {
                 if (d.type == "pos") { return "LightGreen"; }
            else if (d.type == "neg") { return "LightCoral"; }
            else                      { return "Khaki"; }
      })
  
  nodeUpdate.select(".node-label")
      .style("text-align", "middle")
      .attr("x", 75)
      .attr("text-anchor", "start")
      .attr("font-size", function(d) { 
        return labelScale(d.size) + "px";
      })
      .style("fill-opacity", 1)
      .attr("dy", ".30em");

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

// Get ancestor path
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

function updateCurentTree() {
  update(tree_roots[tree_roots.length-1]);
}

$(window).resize(function() {
  tree.size([getTreeHeight() - 30, getTreeWidth()]);
  d3.select("#tree-vis")
    .attr("width", getTreeWidth() + "px")
    .attr("height", getTreeHeight());
  d3.select("#side-bar")
    .style("width", getPanelWidth() + "px")
    .style("height", getPanelHeight());
  d3.select("#selectable")
    .style("width", (getPanelWidth() - 30) + "px")
    .style("height", (getPanelHeight() - 250) + "px");
  d3.select("#scores")
    .style("width", (getPanelWidth() - 30) + "px")
    .style("height", 220 + "px")
  update(tree_roots[tree_roots.length-1]);
});

var initInterfaceWithData = function(data) {
    var relation_types = Object.keys(data);

    if (relation_types.length < 1) { 
        alert("no relationships found in input file");
        return;
    }

    // Setup the list of relationships
    d3.select("#selectable").html("");
    d3.select("#selectable")
        .selectAll("selectable-items")
        .data(relation_types).enter()
        .append("li")
        .attr("value", function(d) { return d; })
        .attr("class", "ui-widget-content")
        .html(function(d) { return d; });
    
    initTree(data[relation_types[0]]);
}

d3.json("./resource/bio_links.json", function(error, data) {
    allData = data;
    initInterfaceWithData(data);
});

