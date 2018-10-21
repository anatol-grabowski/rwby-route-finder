const fs = require('fs')
const request = require((process.env.TOT_NODE_MODULES || '') + 'request')
const urlencode = require((process.env.TOT_NODE_MODULES || '') + 'urlencode')
const denodeify = require((process.env.TOT_NODE_MODULES || '') + 'denodeify')

const request_get = denodeify(request.get)


let sta_arr = []
let res300 = 0
//getStations()

async function getStations(t='') {
	function numToStr(n, s_len=1, alph='abcdefghijklmnopqrstuvwxyz') {
		let s = ''
		while (s.length < s_len) {
			s = alph[n % alph.length] + s
			n = Math.floor(n / alph.length)
		}
		return s
	}
	let alphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя- 1234567890'

	for (let i=0; i<32; i++) {
		let term = t + numToStr(i, 1, alphabet)
		let url = 'http://rasp.rw.by/ru/ajax/autocomplete/search/?term='+ urlencode(term)
		let res = await request_get({url: url})
		let stations = JSON.parse(res.body)
		let old_len = sta_arr.length
		stations.forEach((sta)=>{
			if (sta_arr.find( (el)=>{return el.exp == sta.exp} )) return
			sta_arr.push(sta)
		})
		console.log(term+':', stations.length)
		console.log('stations:',sta_arr.length, ', added:', sta_arr.length - old_len)
		if (stations.length >= 300) { 
			res300++
			await getStations(term)
		}
	}
	console.log('total stations:', sta_arr.length, ', res300:', res300)
	fs.writeFileSync(__dirname + '/sta_arr.json', JSON.stringify(sta_arr))
}

sta_arr = JSON.parse(fs.readFileSync('sta_arr.json'))
console.log(sta_arr[0])

