# Sneakers Finder

Sneakers Finder is a web crawler that crawl over WeTheNew and StockX. The crawler scrapes all available shoes
on [WeTheNew](https://wethenew.com/) (SKU / Image URL / Price / Brand / Model) and then scrapes the price for the same
shoe on [StockX](https://stockx.com/) .<br/>
All the scrapped data is then used to be compared on a web interface to display where you can find each shoe at the
cheapest price. <br/>

![Homepage](https://image.noelshack.com/fichiers/2022/19/5/1652394387-sneakers-finder-homepage.jpg)

## Download and Installation

You need to write the following commands on the terminal screen so that you can run the project locally.

```sh
1. git clone https://git.ytrack.learn.ynov.com/APROVO/sneakers-finder.git
2. cd sneakers-finder
3. npm install
4. npm start
```

## Usage

The homepage of the web interface is available once a certain amount of shoes has been scrapped, the speed of scrapping
depends on your connection speed and the power of your computer. <br />
Once the homepage is available, you can totally browse on the web interface and make researches with the search
bar. <br />

### Search page

![Search page](https://image.noelshack.com/fichiers/2022/19/5/1652394992-sneakers-finder-search.png)

### Product page

On the product page you will find a picture of the shoe, the brand, the model, the lowest price and the SKU. <br/>
The sites where you can buy the shoes are sorted from cheapest to most expensive.
![Product page](https://image.noelshack.com/fichiers/2022/19/5/1652395020-sneakers-finder-product.png)
