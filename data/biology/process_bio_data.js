//
// parse bio YAML data in the resource/ dir.
//
// Pass in "generated_rules.yml" using the --yaml argument.
// JSON output goes to stdout.
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


var rels = {};

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

var addPathToTree = function(path, tree_root, level) {
    var key = path[0];
    
    if (level == 0) {
        if (!(key in rels)) {
            rels[key] = {
                "name": key, 
                "type": "unk", 
                "children": [],
                "children_map": {}
            };
        }
        path.shift();
        addPathToTree(path, rels[key], level+1);
    } else {
        if (path.length == 0) { return 1; }
        if ( !(key in tree_root.children_map) ) {
            tree_root.children_map[key] = {
                "name": key, 
                "type": "unk", 
                "children": [],
                "children_map": {}
            };
        }
        path.shift();
        addPathToTree(path, tree_root.children_map[key], level+1);
    }
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

        addPathToTree(path, undefined, 0);

    } catch (e) {
        console.log(e);
        failCount++;
    }
}


for (var i in rels) { postprocessTree(rels[i]); }

if (failCount > 0) { console.log("Failed on " + failCount + " elements."); }
console.log(JSON.stringify(rels, undefined, 2));


