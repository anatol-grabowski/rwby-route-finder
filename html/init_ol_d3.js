//this function helps to avoid redrawing svg after map movement
//it has to be called after 'map.getPixelFromCoordinate' gets available
//returns scaleLonLat(lonlat) function that returns [x_px, y_px] for usage with d3
//prevent lines thickness from getting scaled through css: .map .d3-layer path { vector-effect: non-scaling-stroke; }
//usage example: 
//var s
//map.once('precompose', ()=>{ s=init_ol_d3(this); draw(); })
//var draw_route = d3.line().x((lonlat)=>{return s(lonlat)[0]}).y(...

function init_ol_d3(map) {
	d3.selectAll('#'+map.getTarget() + ' .d3-layer').remove()
	var g = d3.select('#'+map.getTarget() + ' .ol-viewport')
		.insert('div', 'canvas').classed('d3-layer', true) //div before gui for gui to work
		  .style('position', 'absolute')
		  .style('bottom', '0px')
		  .style('left', '0px')
		  .style('width', '100%')
		  .style('height', '100%')
		.append('svg')
		  .style('width', '100%')
		  .style('height', '100%')
		.append('g')
	var init00 = map.getPixelFromCoordinate(ol.proj.fromLonLat([0, 0]))
	var init11 = map.getPixelFromCoordinate(ol.proj.fromLonLat([1, 1]))
	var initScale = [init11[0]-init00[0], init11[1]-init00[1]]
	var curr00 = init00
	var rescale = [1, 1]

	map.on('postrender', function() { //retransform
		curr00 = map.getPixelFromCoordinate(ol.proj.fromLonLat([0, 0]))
		var curr11 = map.getPixelFromCoordinate(ol.proj.fromLonLat([1, 1]))
		var currScale = [curr11[0]-curr00[0], curr11[1]-curr00[1]]
		rescale = [currScale[0]/initScale[0], currScale[1]/initScale[1]]
		var retranslate = [curr00[0]-init00[0]*rescale[0], curr00[1]-init00[1]*rescale[1]]
		g.attr("transform", //p_curr = (p_init-O_init)*rescale + O_curr
			"translate(" + retranslate[0] + "," + retranslate[1] + ")" +
			" scale(" + rescale[0] + "," + rescale[1] + ")");
	})

	scaleLonLat = function(lonlat) { //p_init = (p_curr-O_curr)/rescale + O_init
		var p = map.getPixelFromCoordinate(ol.proj.fromLonLat(lonlat))
		p[0] = (p[0] - curr00[0])/rescale[0] + init00[0]
		p[1] = (p[1] - curr00[1])/rescale[1] + init00[1]
		return p
	}
	return scaleLonLat
}
