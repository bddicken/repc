
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
        var fileInput = document.getElementById('import');

        fileInput.addEventListener('change', function(e) {
            var file = fileInput.files[0];
            var textType = /text.*/;
            //console.log(file.type);

            if (file.type.match(textType) || file.type == "") {
                var reader = new FileReader();

                reader.onload = function(e) {
                    var data = JSON.parse(reader.result);
                    allData = data;
                    processDataPostSave(allData);
                    allData = data;
                    initInterfaceWithData(data);
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

