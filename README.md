# Sneakers Finder

Sneakers Finder is a web crawler that crawls over WeTheNew and StockX. The crawler scrapes all available shoes
on [WeTheNew](https://wethenew.com/) (SKU / Image URL / Price / Brand / Model) and then scrapes the price for the same
shoe on [StockX](https://stockx.com/) .<br/>
All the scrapped data is then used to be compared on a web interface to display where you can find each shoe at the
cheapest price. <br/>

![Homepage](https://user-images.githubusercontent.com/59230262/216298568-f6fd165f-1541-4b7f-be96-a5532f6a30cc.png)

## Download and Installation

You need to write the following commands on the terminal screen so that you can run the project locally.

```sh
1. git clone https://git.ytrack.learn.ynov.com/APROVO/sneakers-finder.git
2. cd sneakers-finder
3. npm install
4. npm start
```

## Usage

The application is running on [localhost:3000](http://localhost:3000)

The homepage of the web interface is available once a certain amount of shoes has been scrapped, the speed of scrapping
depends on your connection speed and the power of your computer. <br />
Once the homepage is available, you can totally browse on the web interface and make researches with the search
bar. <br />

### Search page

![Search page](https://user-images.githubusercontent.com/59230262/216298709-8a79883b-6bd6-4e4b-bf2b-38253a8f1eb7.png)

### Product page

On the product page you will find a picture of the shoe, the brand, the model, the lowest price and the SKU. <br/>
The sites where you can buy the shoes are sorted from cheapest to most expensive.
![Product page](https://user-images.githubusercontent.com/59230262/216298813-ec6dfd73-7e2a-4555-90a1-d80571c24f19.png)
