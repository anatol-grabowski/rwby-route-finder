const fs = require('fs')
const iconv = require((process.env.TOT_NODE_MODULES || '') + 'iconv-lite')

let in_filename = process.argv[2]
let in_encoding = process.argv[3]
let out_filename = process.argv[4]
let out_encoding = process.argv[5] || 'utf8'
console.log('Converting ' + in_filename + '['+in_encoding+'] to ' + out_filename + '['+out_encoding+']...')
infile = fs.readFileSync(in_filename)
outfile = iconv.encode(iconv.decode(infile, in_encoding), out_encoding)
fs.writeFileSync(out_filename, outfile)
console.log('done')

