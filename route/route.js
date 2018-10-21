//const TreeModel = require((process.env.TOT_NODE_MODULES || '') + 'tree-model')
let nodes = [
	{ n: 1 },		//     n2
	{ n: 2 },		//     |
	{ n: 3 },		// n1--n3
	{ n: 4 }		//   \ |
]					//    n4

let threads = [
	{ t: 1, stops: [ 
		{s:'t1n1', node:nodes[0]}, 
		{s:'t1n3', node:nodes[2]}, 
		{s:'t1n2', node:nodes[1]} ] },
	{ t: 2, stops: [ 
		{s:'t2n2', node:nodes[1]}, 
		{s:'t2n3', node:nodes[2]}, 
		{s:'t2n4', node:nodes[3]} ] },
	{ t: 3, stops: [ 
		{s:'t3n1', node:nodes[0]}, 
		{s:'t3n4', node:nodes[3]} ] }
]

threads.forEach((th)=>{								//four connections: T<->S<->N
	th.stops.forEach((th_s)=>{						//stops are in threads
		if (!th_s.node.stops) th_s.node.stops = []	//nodes are in stops
		th_s.node.stops.push(th_s)					//add stop to node
		th_s.thread = th							//add thread to stop
	})
})


console.log(nodes)
let routes = buildRoutes(nodes[0], nodes[3])
console.log(routes)

function buildRoutes(from, to) {
	let routes = []
	let tree = new TreeModel()
	let root = tree.parse({})
	from.stops.forEach((st)=>{ root.addChild(tree.parse({})).stop = st })
	root.walk((tn)=>{
		if (tn.isRoot()) return
		let stop = tn.stop
		if (stop.node == to) //route found
			return routes.push(tn.getPath().slice(1).map((el)=>el.stop))
		let next = stop.thread.stops[stop.thread.stops.indexOf(stop)+1]
		if (next && (next!=stop) && !tn.getPath().find((anc)=>{ return anc.stop == next }))
			tn.addChild(tree.parse({})).stop = next //add next stop on this thread

		if (tn.parent.isRoot()) return
		stop.node.stops.forEach((st)=>{ //add stops on other threads from this node
			if ( (st!=stop) && !tn.getPath().find((anc)=>{ return anc.stop == st }) )
				tn.addChild(tree.parse({})).stop = st
		})
	})
	return routes
}
