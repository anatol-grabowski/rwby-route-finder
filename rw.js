const fs = require('fs')
const request = require((process.env.TOT_NODE_MODULES || '') + 'request')
const urlencode = require((process.env.TOT_NODE_MODULES || '') + 'urlencode')
const denodeify = require((process.env.TOT_NODE_MODULES || '') + 'denodeify')
const cheerio = require((process.env.TOT_NODE_MODULES || '') + 'cheerio')

const request_get = denodeify(request.get)

var util = require('util');
var logFile = fs.createWriteStream('scraping.log', { flags: 'w' });
var logStdout = process.stdout;

console.log = function () {
  logFile.write(util.format.apply(null, arguments) + '\n');
  logStdout.write(util.format.apply(null, arguments) + '\n');
}
console.error = console.log;


;(async function() {
	let nodes = []
	//nodes = await getNodes()
	//fs.writeFileSync(__dirname + '/nodes.json', JSON.stringify(nodes, null, 2))
	nodes = JSON.parse(fs.readFileSync('nodes.json'))
	console.log('total nodes:', nodes.length)
	nodes = nodes.filter((el)=>{
		return (el.exp.substr(0, 2) == '21')
			//&& (el.otd == '001') 
			//&& (/Минская обл./.test(el.label_tail))
	})
	console.log('total nodes:', nodes.length)

	let threads = []
	threads = await getThreadsList(nodes)
	fs.writeFileSync('threadsList.json', JSON.stringify(threads, null, 2))
	//threads = JSON.parse(fs.readFileSync('threadsList.json'))
	console.log('total threads in list:', threads.length)
	//threads = threads.slice(365)
	await getThreads(threads)
	fs.writeFileSync('threads.json', JSON.stringify(threads, null, 2))
	//threads = JSON.parse(fs.readFileSync('threads.json'))
	console.log('total threads:', threads.length)

	threads = threads.filter((th)=>(th.train))
	console.log('trains:', threads.length)
}())



async function getNodes(t='') {
	function numToStr(n, s_len=1, alph='abcdefghijklmnopqrstuvwxyz') {
		let s = ''
		while (s.length < s_len) {
			s = alph[n % alph.length] + s
			n = Math.floor(n / alph.length)
		}
		return s
	}
	let alphabet = "абвгдеёжзийклмнопрстуфхцчшщъыьэюя"
					//+ "abcdefghijklmnopqrstuvwxyz"
					+ " -'\".,#№()+=*&@!?|~`[]{}:;<>$^"
					+ "1234567890"

	let nodes = []
	for (let i=0; i<alphabet.length; i++) {
		let term = t + numToStr(i, 1, alphabet)
		let url = 'http://rasp.rw.by/ru/ajax/autocomplete/search/?term='+ urlencode(term)
		let res = await request_get(url)
		let ns = JSON.parse(res.body)
		if (ns.length >= 300) ns = await getNodes(term)
		console.log(term+':', ns.length)
		ns.forEach((n)=>{
			if ( nodes.find((n_find)=>{return n_find.exp == n.exp}) ) return
			nodes.push(n)
		})
	}
	return nodes
}

async function getThreadsList(nodes, date) {
	async function getThreadsOnNode(node, date) {
		let url = 'http://rasp.rw.by/ru/station/?exp=' + urlencode(node.exp)
		if (date) url += '&date=' + date
		let res = await request_get(url)
		let $ = cheerio.load(res.body)
		let sch = $('.schedule_main .schedule_list .b-train .train_info')
		console.log(node.value+':', sch.length)

		let threads = []
		for (let i=0; i<sch.length; i++) {
			let thread = {}
			let trainId = sch.eq(i).find('.train_id').text()
			let href = sch.eq(i).find('.train_name a.train_text').attr('href')
			let ref = href.match(/([\?\&])((thread=)|(train=))([^&]*)/)
			if (ref[2] == 'thread=') thread.thread = ref[5]
			else thread.train = ref[5]
			threads.push(thread)
		}
		return threads
	}

	let threads = []
	for (let i=0; i<nodes.length; i++) {
		let thres = await getThreadsOnNode(nodes[i])
		thres.forEach((th)=>{
			let th_found = threads.find((th_find)=>{
				return th.thread ? th.thread == th_find.thread : th.train == th_find.train
			})
			if (th_found) return
			threads.push(th)
		})
	}
	return threads
}

async function getThreads(threads) {
	async function getThread(thread) {
		let url = 'http://rasp.rw.by/ru/train/?' 
		if (thread.thread) url += 'thread=' + urlencode(thread.thread)
		else url += 'train=' + urlencode(thread.train)
		let res = await request_get(url)
		let $ = cheerio.load(res.body)
		let sch = $('.schedule_main .schedule_list .b-train')
		console.log(url+':', sch.length)

		thread.days = $('.b-calendar .calendar_description').text().trim()
		thread.stops = []
		for (let i=0; i<sch.length; i++) {
			let stop = {}
			let spaces = /(\s*)/g
			let href = sch.eq(i).find('.train_info a.train_text').attr('href')
			let ref = href.match(/([\?\&])((ecp=)|(exp=))([^&]*)/)
			if (ref[2] == 'ecp=') stop.ecp = ref[5]
			else stop.exp = ref[5]
			let arrival = sch.eq(i).find('.train_end .train_end-time').text().trim()
			arrival = arrival.replace(spaces, '')
			if (arrival) stop.arrival = arrival
			let departure = sch.eq(i).find('.train_start .train_start-time').text().trim()
			departure = departure.replace(spaces, '')
			if (departure) stop.departure = departure
			thread.stops.push(stop)
		}
	}

	for (let i=0; i<threads.length; i++) {
		await getThread(threads[i])
	}
}
