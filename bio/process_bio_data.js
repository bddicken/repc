//
// parse bio YAML data in the resource/ dir.
//

var program     = require('commander');
var YAML        = require('yamljs');

program
  .version('0.0.1')
  .option('-y, --yaml <fileName>', 'yaml file')
  .parse(process.argv);

if (!program.yaml) {
    console.log("must specify all arguments.");
}
 
inputData = YAML.load(program.yaml);

var root = {  
    "name": "ROOT", 
    "type": "unk", 
    "size": 0,
    "children": [],
    "children_map": {}
};

var postprocessTree = function(tree_root) {

    // Non-Leaf case
    if (Object.keys(tree_root.children_map).length > 0) {
        for (var i in tree_root.children_map) {
            postprocessTree(tree_root.children_map[i]);
        }
    }
    
    // Capy from map into array
    for (var i in tree_root.children_map) {
        tree_root.children.push(tree_root.children_map[i]);
    }

    // Delete array
    delete tree_root.children_map;
}

var addPathToTree = function(path, tree_root) {
    if (path.length == 0) { return 1; }
    var key = path[0];
    if ( !(key in tree_root.children_map) ) {
        tree_root.children_map[key] = {
            "name": key, 
            "type": "unk", 
            "size": 0,
            "children": [],
            "children_map": {}
        };
    }
    path.shift();
    var size = addPathToTree(path, tree_root.children_map[key]);
    tree_root.size += size;
    return size;
}

var failCount = 0;

for (var i in inputData) {
    try {
        var datum = inputData[i];
        var pattern = datum.pattern;
        var pattern_split = pattern.split("\n");
        
        var path_info = pattern_split[1].split(" = ");
        var path_a = path_info[0];
        var path_b = path_info[1].split(" ");
        var path = JSON.parse(JSON.stringify(path_b)); 
        path.unshift(path_a);
        
        var lemmas = pattern_split[0].split("= ")[1].split(" ");

        //console.log("e" + i + " = " + lemmas);
        //console.log("  b = " + path_a);
        //console.log("  a = " + path_b);
        //console.log("  p = " + path.length);
        //console.log("=----");

        addPathToTree(path, root);

    } catch (e) {
        console.log(e);
        failCount++;
    }
}

postprocessTree(root);

if (failCount > 0) { console.log("Failed on " + failCount + " elements."); }
console.log(JSON.stringify(root, undefined, 2));


