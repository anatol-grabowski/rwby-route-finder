const fs = require('fs')

let sta_arr = fs.readFileSync('sta_arr.json')
let stations = fs.readFileSync('stations.json')

sta_arr = JSON.parse(sta_arr)
stations = JSON.parse(stations)

console.log(sta_arr.length)
console.log(stations.length)

let sta_fil = sta_arr.filter((sta)=>{
	let sta_found = stations.find((sta_find)=>{return sta_find.exp == sta.exp})
	if (!sta_found)
		console.log(sta)
	return !sta_found
})
console.log(sta_fil.length)
