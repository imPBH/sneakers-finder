const crawler = require('./functions/crawler.js')

const fs = require('fs');
const express = require('express')
const app = express()

let idShoe = 1
let failed_wtn = []
let failed_sx = []

app.use(express.static("public"));
app.set("views", "./views")
app.set("view engine", "ejs")

app.get("/", (req, res) => {
    let buffer = fs.readFileSync("./sku.json")
    let content = buffer.toString()
    let data = JSON.parse(content)
    res.render("index", {data: data})
})

app.get("/product", (req, res) => {
    let buffer = fs.readFileSync("./sku.json")
    let content = buffer.toString()
    let data = JSON.parse(content)
    res.render("product", {data: data, urlParam: req.query["s"]})
})

app.get("/search", (req, res) => {
    let data = crawler.search(req.query["s"])
    res.render("search", {data: data, urlParam: req.query["s"]})
})

crawler.crawl_wtn(idShoe, failed_wtn)
	.then(() => crawler.stockx(failed_sx))

app.listen(8080, () => {
    console.log("Server up and running on port 8080")
})
