const express = require('express')
const app = express()
const puppeteer = require('puppeteer');
const fs = require('fs');


function crawl_wtn() {
    let data = [];

    (async () => {
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
        await page.screenshot({path: 'screenshot.png'})
        let acceptCookies = "#didomi-notice-agree-button"
        await page.click(acceptCookies)

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
            await scrapWtn(URL, data)
            pageNbr++
            URL = baseURL + pageNbr
        }
        await scrapWtn(URL, data)

        fs.writeFile('data.json', JSON.stringify(data), {flag: 'w'}, err => {
            if (err) {
                console.error(err);
            }
            console.log("Success !")
        });
    })();
}

async function scrapWtn(URL, dataOut) {
    let idShoe = 1
    let browser = await puppeteer.launch({headless: false});
    let page = await browser.newPage();
    await page.goto(URL, {
        waitUntil: 'load',
        // Remove the timeout
        timeout: 0
    });
    let acceptCookies = "#didomi-notice-agree-button"
    await page.click(acceptCookies)

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

crawl_wtn()

app.get('/', (req, res) => {
    res.send('Hello World')
})

app.listen(8080, () => {
    console.log("Server up and running on port 8080")
})