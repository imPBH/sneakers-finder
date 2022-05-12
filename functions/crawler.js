const puppeteer = require('puppeteer');
const fs = require("fs");

/* A function to sleep the program */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/* A function to scrap all the links of shoes on WeTheNew */
async function scrapWtn(URL, dataOut, idShoe) {
    let browser = await puppeteer.launch({headless: false});
    let page = await browser.newPage();
    await page.goto(URL, {
        waitUntil: 'load',
        // Remove the timeout
        timeout: 0
    });

    let scrap = await page.evaluate(() => {
        let dataArr = []
        let elements = document.getElementsByClassName('boost-pfs-filter-product-item boost-pfs-filter-product-item-grid boost-pfs-filter-grid-width-4 boost-pfs-filter-grid-width-mb-2 ');
        for (let element of elements) {
            let data = {
                brand: '',
                model: '',
                link: ''
            }

            let brand = element.getElementsByClassName('boost-pfs-filter-product-item-vendor');
            let model = element.getElementsByClassName('boost-pfs-filter-product-item-title');
            let link = element.getElementsByClassName('boost-pfs-filter-product-item-title')

            data.brand = brand[0].innerHTML
            data.model = model[0].innerHTML
            data.link = link[0].href
            dataArr.push(data)
        }
        return dataArr
    });

    for (let element of scrap) {
        dataOut.push({id: idShoe, info: element})
        idShoe++
    }

    await browser.close()

}

/* A function that crawls and scrap data on WeTheNew */
async function crawl_wtn(idShoe, failed_wtn) {
    fs.writeFileSync('./failed_wtn.json', "[]");
    fs.writeFileSync('./data.json', "{}");
    fs.writeFileSync('./sku.json', "{}");

    failed_wtn = []
    let data = [];

    let baseURL = 'https://wethenew.com/collections/all-sneakers?page='
    let pageNbr = 1
    let URL = baseURL + pageNbr

    let browser = await puppeteer.launch({headless: false});
    let page = await browser.newPage();
    await page.goto(URL, {
        waitUntil: 'load',
        // Remove the timeout
        timeout: 0
    });

    let lastPage = await page.evaluate(() => {
        let data = []
        let elements = document.getElementsByClassName('boost-pfs-filter-bottom-pagination boost-pfs-filter-bottom-pagination-default')

        elements = elements[0].getElementsByTagName('a')

        for (let element of elements) {
            data.push(element.href)
        }
        return data[data.length - 2]
    });

    await browser.close()

    while (URL !== lastPage) {
        await scrapWtn(URL, data, idShoe)
        pageNbr++
        URL = baseURL + pageNbr
    }
    await scrapWtn(URL, data, idShoe)

    fs.writeFileSync('./data.json', JSON.stringify(data));


    let skuChunks = chunkify(data, 7, true)
    let dataSku = {values: {}}
    for (let i = 0; i < skuChunks[0].length; i++) {
        let scrapping = [
            scrapShoeWtn(skuChunks[6], i, dataSku, failed_wtn),
            scrapShoeWtn(skuChunks[5], i, dataSku, failed_wtn),
            scrapShoeWtn(skuChunks[4], i, dataSku, failed_wtn),
            scrapShoeWtn(skuChunks[3], i, dataSku, failed_wtn),
            scrapShoeWtn(skuChunks[2], i, dataSku, failed_wtn),
            scrapShoeWtn(skuChunks[1], i, dataSku, failed_wtn),
            scrapShoeWtn(skuChunks[0], i, dataSku, failed_wtn)
        ]
        await Promise.all(scrapping).then(() => console.log(`Bunch [${i + 1}]/[${skuChunks[0].length}] done !`))
        fs.writeFileSync('./sku.json', JSON.stringify(dataSku));
    }

    await delay(5000)
    fs.writeFileSync('./sku.json', JSON.stringify(dataSku));
    console.log("First bunch of skus scrapped !")

    await delay(200)
    try {
        const failedSku = require('../failed_wtn.json')
        console.log("Starting failed skus")
        for (let shoe of failedSku) {
            await scrapShoeWtn(shoe, "url", dataSku)
            fs.writeFileSync('./sku.json', JSON.stringify(dataSku));
        }
        fs.writeFileSync('./sku.json', JSON.stringify(dataSku));
        console.log("Failed sku done !")
    } catch (err) {
        console.log("No failed skus !")
    }
    await delay(1000)
}

module.exports = {
    scrapWtn,
    crawl_wtn
}