/**
 * PDFAnnotate v1.0.1
 * Author: Ravisha Heshan
 */

// /**
//  * @updatedby Tausif Iqbal and Vishal Rao
//  */
var PDFAnnotate = function(container_id, url, options = {}) {
	this.number_of_pages = 0;
	this.pages_rendered = 0;
	this.active_tool = 1; // 1 - Free hand, 2 - Text, 3 - Arrow, 4 - Rectangle
	this.fabricObjects = [];
	this.fabricObjectsData = [];
	this.color = '#000000';
	this.borderColor = '#000000';
	this.borderSize = 1;
	this.font_size = 16;
	this.active_canvas = 0;
	this.container_id = container_id;
	this.url = url;
	this.pageImageCompression = options.pageImageCompression
    ? options.pageImageCompression.toUpperCase()
    : "NONE";
	this.format;
	this.orientation;
	var inst = this;

	var loadingTask = pdfjsLib.getDocument(this.url);
	loadingTask.promise.then(function (pdf) {
		var scale = options.scale ? options.scale : 1.3;
	    inst.number_of_pages = pdf.numPages;

	    for (var i = 1; i <= pdf.numPages; i++) {
	        pdf.getPage(i).then(function (page) {

				if (typeof inst.format === 'undefined' ||
				typeof inst.orientation === 'undefined') {
				var originalViewport = page.getViewport({ scale: 1 });
				inst.format = [originalViewport.width, originalViewport.height];
				inst.orientation =
				  originalViewport.width > originalViewport.height ?
					'landscape' :
					'portrait';
			  }
	            var viewport = page.getViewport({scale: scale});
	            var canvas = document.createElement('canvas');
	            document.getElementById(inst.container_id).appendChild(canvas);
	            canvas.className = 'pdf-canvas';
	            canvas.height = viewport.height;
	            canvas.width = viewport.width;
	            context = canvas.getContext('2d');

	            var renderContext = {
	                canvasContext: context,
	                viewport: viewport
				};
	            var renderTask = page.render(renderContext);
	            renderTask.promise.then(function () {
	                $('.pdf-canvas').each(function (index, el) {
	                    $(el).attr('id', 'page-' + (index + 1) + '-canvas');
	                });
	                inst.pages_rendered++;
	                if (inst.pages_rendered == inst.number_of_pages) inst.initFabric();
	            });
	        });
	    }
	}, function (reason) {
	    console.error(reason);
	});

	this.initFabric = function () {
		var inst = this;
		let canvases = $('#' + inst.container_id + ' canvas')
	    canvases.each(function (index, el) {
	        var background = el.toDataURL("image/png");
	        var fabricObj = new fabric.Canvas(el.id, {
	            freeDrawingBrush: {
	                width: 1,
	                color: inst.color
	            }
	        });
			inst.fabricObjects.push(fabricObj);
			if (typeof options.onPageUpdated == 'function') {
				fabricObj.on('object:added', function() {
					var oldValue = Object.assign({}, inst.fabricObjectsData[index]);
					inst.fabricObjectsData[index] = fabricObj.toJSON()
					options.onPageUpdated(index + 1, oldValue, inst.fabricObjectsData[index]) 
				})
			}
	        fabricObj.setBackgroundImage(background, fabricObj.renderAll.bind(fabricObj));
	        $(fabricObj.upperCanvasEl).click(function (event) {
	            inst.active_canvas = index;
	            inst.fabricClickHandler(event, fabricObj);
			});
			fabricObj.on('after:render', function () {
				inst.fabricObjectsData[index] = fabricObj.toJSON()
				fabricObj.off('after:render')
			})

			if (index === canvases.length - 1 && typeof options.ready === 'function') {
				options.ready()
			}
		});
	}

	this.fabricClickHandler = function(event, fabricObj) {
		var inst = this;
	    if (inst.active_tool == 2) {
	        var text = new fabric.IText('Sample text', {
	            left: event.clientX - fabricObj.upperCanvasEl.getBoundingClientRect().left,
	            top: event.clientY - fabricObj.upperCanvasEl.getBoundingClientRect().top,
	            fill: inst.color,
	            fontSize: inst.font_size,
	            selectable: true
	        });
	        fabricObj.add(text);
	        inst.active_tool = 0;
	    }
	}
}

PDFAnnotate.prototype.enableSelector = function () {
	var inst = this;
	inst.active_tool = 0;
	if (inst.fabricObjects.length > 0) {
	    $.each(inst.fabricObjects, function (index, fabricObj) {
	        fabricObj.isDrawingMode = false;
	    });
	}
	return false;  // changes made
}

PDFAnnotate.prototype.enablePencil = function () {
	var inst = this;
	inst.active_tool = 1;
	if (inst.fabricObjects.length > 0) {
	    $.each(inst.fabricObjects, function (index, fabricObj) {
	        fabricObj.isDrawingMode = true;
	    });
	}
	return false;  // changes made
}

PDFAnnotate.prototype.enableAddText = function () {
	var inst = this;
	inst.active_tool = 2;
	if (inst.fabricObjects.length > 0) {
	    $.each(inst.fabricObjects, function (index, fabricObj) {
	        fabricObj.isDrawingMode = false;
	    });
	}
	return false;  // changes made
}

PDFAnnotate.prototype.enableRectangle = function () {
	var inst = this;
	var fabricObj = inst.fabricObjects[inst.active_canvas];
	inst.active_tool = 4;
	if (inst.fabricObjects.length > 0) {
		$.each(inst.fabricObjects, function (index, fabricObj) {
			fabricObj.isDrawingMode = false;
		});
	}

	var rect = new fabric.Rect({
		width: 100,
		height: 100,
		fill: inst.color,
		stroke: inst.borderColor,
		strokeSize: inst.borderSize
	});
	fabricObj.add(rect);
	return false;
}

PDFAnnotate.prototype.deleteSelectedObject = function () {
	var inst = this;
	var activeObject = inst.fabricObjects[inst.active_canvas].getActiveObject();
	if (activeObject)
	{
	    if (confirm('Are you sure ?')) inst.fabricObjects[inst.active_canvas].remove(activeObject);
	}
	return false;
}


  PDFAnnotate.prototype.savePdf = function (fileName) {
    pdf.serializePdf(function (string) {
      var value = JSON.stringify(JSON.parse(string), null, 4);
	  var xmlhttp = new XMLHttpRequest();
	  xmlhttp.open("POST", "upload.php", true);
	  xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	  xmlhttp.onreadystatechange = function() {

		if (this.status ==200 && this.readyState ==4  ) {
			alert("file has been saved");
		}
		else if (this.status !=200 ) {
			alert("Not able to save the file");
		}

	  };
	  xmlhttp.send("id=" + value + "&contextid=" + contextid + "&attemptid="+attemptid + "&filename=" + filename + "&furl=" + furl);
    });
};


PDFAnnotate.prototype.serializePdf = function (callback) {
	var inst = this;
	var pageAnnotations=[];
	for (let i = 0; i < this.fabricObjects.length; i++) {
	  pageAnnotations.push([]);
	}
	inst.fabricObjects.forEach(function (fabricObject,index) {
	  fabricObject.clone(function (fabricObjectCopy) {
		fabricObjectCopy.setBackgroundImage(null);
		fabricObjectCopy.setBackgroundColor('');
		if(fabricObjectCopy._objects.length !== 0)
		{
		pageAnnotations[index].push(fabricObjectCopy);
		}
		if (index+1 === inst.fabricObjects.length) {
		  var data = {
			page_setup: {
			  format: inst.format,
			  orientation: inst.orientation,
			},
			pages: pageAnnotations,
		  };
		  callback(JSON.stringify(data));
		}
	  });
	});
	var data = {
	  page_setup: {
		format: inst.format,
		orientation: inst.orientation,
	  },
	  pages: pageAnnotations,
	};
	
  };

PDFAnnotate.prototype.setColor = function (color) {
	var inst = this;
	inst.color = color;
	$.each(inst.fabricObjects, function (index, fabricObj) {
        fabricObj.freeDrawingBrush.color = color;
    });
	return false;
}

PDFAnnotate.prototype.setBorderColor = function (color) {
	var inst = this;
	inst.borderColor = color;
	return false;
}

PDFAnnotate.prototype.setFontSize = function (size) {
	this.font_size = size;
	return false;
}
