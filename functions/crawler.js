const puppeteer = require('puppeteer');
const fs = require("fs");

/* A function to sleep the program */
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

/* A function that splits a given Array into n arrays*/
function chunkify(a, n, balanced) {

    if (n < 2)
        return [a];

    let len = a.length,
        out = [],
        i = 0,
        size;

    if (len % n === 0) {
        size = Math.floor(len / n);
        while (i < len) {
            out.push(a.slice(i, i += size));
        }
    } else if (balanced) {
        while (i < len) {
            size = Math.ceil((len - i) / n--);
            out.push(a.slice(i, i += size));
        }
    } else {

        n--;
        size = Math.floor(len / n);
        if (len % size === 0)
            size--;
        while (i < size * n) {
            out.push(a.slice(i, i += size));
        }
        out.push(a.slice(size * n));

    }

    return out;
}

/* A function to scrap the brand, the model, the sku and the price of a shoe on WeTheNew */
async function scrapShoeWtn(chunk, index, dataOut, failed_wtn) {
    if (chunk[index] === undefined) {
        return
    }
    let url = ""
    if (index === "url") {
        url = chunk[index]
    } else {
        url = chunk[index].info.link
    }


    let browser = await puppeteer.launch({headless: false});
    try {
        let page = await browser.newPage();
        await page.goto(url, {
            waitUntil: 'load',
            // Remove the timeout
            timeout: 60000
        });

        let scrapSku = await page.evaluate(() => {
            let dataArr = []

            let elements = document.getElementsByClassName("select");
            elements = elements[0].getElementsByTagName("select");
            elements = elements[elements.length - 1].getElementsByTagName("option");


            for (let sku of elements) {
                if (sku.getAttribute('data-sku') !== "") {
                    dataArr.push(sku.getAttribute('data-sku'))
                }
            }
            return dataArr
        });

        let scrapPrice = await page.evaluate(() => {
            let elements = document.getElementsByTagName("scalapay-widget")
            let price = elements[0].getAttribute("amount")

            return parseInt(price)
        });

        let scrapImg = await page.evaluate(() => {
            let elements = document.getElementsByClassName("image__container");
            elements = elements[0].getElementsByTagName("img")
            let image = elements[0].getAttribute("src")

            return image.slice(2)
        })

        let scrapBrand = await page.evaluate(() => {
            let elements = document.getElementsByClassName("vendor")
            let brand = elements[0].innerText
            return brand
        })

        let scrapModel = await page.evaluate(() => {
            let elements = document.getElementsByName("twitter:title")
            elements = elements[0]
            let model = elements.getAttribute("content")

            return model
        })
        await delay(2000)
        const uniqueArr = [...new Set(scrapSku)];
        if (uniqueArr[0] === "") {
            console.log("empty sku")
            uniqueArr[0] = await page.evaluate(() => {

                let elements = document.getElementsByClassName("none lazyloaded");
                elements = elements[0].getAttribute("alt")
                let sku = elements.match(/(?<=- ).+/g)
                return sku[0].trim()
            })
        }

        if (uniqueArr[0] === null) {
            uniqueArr[0] = await page.evaluate(() => {
                let elements = document.getElementsByName("twitter:description")
                elements = elements[0].getAttribute("content")
                let sku = elements.match(/(?<=SKU : ).+(?=Date)/g)
                return sku[0].trim()
            })
        }
        for (let sku of uniqueArr) {
            dataOut.values[sku] = {
                brand: scrapBrand,
                model: scrapModel,
                image: scrapImg,
                wethenew: {link: url, price: scrapPrice}
            }
            console.log(`Success ! sku = ${sku} url = ${url} price = ${scrapPrice}`)
        }
    } catch (err) {
        console.log(`Oops, error for URL = ${url}, error = ${err}`)
        failed_wtn.push({url: url, reason: err})
        fs.writeFileSync('./failed_wtn.json', JSON.stringify(failed_wtn));

    } finally {
        await browser.close()
    }
}

/* A function to scrap the price of a shoe on StockX */
async function scrapShoeStockX(sku, index, dataOut, failed_sx) {

    if (sku[index] === undefined) {
        return
    }

    let browser = await puppeteer.launch({headless: false});
    let page = await browser.newPage();

    let searched_sku = sku[index].replace("-", "")
    let baseURL = "https://stockx.com/fr-fr/search?s="
    try {
        await page.goto(baseURL + searched_sku, {
            waitUntil: 'load',
            // Remove the timeout
            timeout: 60000
        });

        let shoeUrl = await page.evaluate(() => {
            let resultsCount = document.querySelector("#browse-wrapper > div.chakra-container.css-bu55a7 > div > div.css-c8gdzb > div.css-b1ilzc > div > div:nth-child(1) > div > p > b")
            resultsCount = resultsCount.innerHTML
            resultsCount = parseInt(resultsCount)

            if (resultsCount === 0) {
                return 0
            }

            let baseUrl = "https://stockx.com"
            let elements = document.getElementsByClassName('css-1dh562i');
            elements = elements[0].getElementsByTagName("a")

            let url = elements[0].getAttribute("href")

            return baseUrl + url
        });
        if (shoeUrl === 0) {
            console.log(`No result found for ${sku[index]}`)
        } else {
            let price = await page.evaluate(() => {
                let elements = document.getElementsByClassName('chakra-text css-9ryi0c');
                elements = elements[0].innerText
                let scrappedPrice = elements.slice(0, -2)
                scrappedPrice = scrappedPrice.replace(/\s/g, "")
                return parseInt(scrappedPrice)
            });
            console.log(`StockX infos for ${sku[index]} : URL = ${shoeUrl} price = ${price}`)
            dataOut.values[sku[index]]["stockx"] = {"link": shoeUrl, "price": price}
        }
    } catch (err) {
        console.log(`Oops, error for sku = ${sku[index]}, error = ${err}`)
        failed_sx.push({"sku": sku[index], reason: err})
        fs.writeFileSync('./failed_sx.json', JSON.stringify(failed_sx));
    } finally {
        await browser.close()
    }
}

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
    delay,
    chunkify,
    scrapShoeWtn,
    scrapShoeStockX,
    scrapWtn,
    crawl_wtn
}