const crawler = require('./functions/crawler.js')

const express = require('express')
const app = express()

let idShoe = 1
let failed_wtn = []
let failed_sx = []

crawler.crawl_wtn(idShoe, failed_wtn)
	.then(() => crawler.stockx(failed_sx))

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.listen(8080, () => {
    console.log("Server up and running on port 8080")
})
