import {parsePutParams, getOptionQuote, getStockPrice, filterStockChainWithPricesOnly, putRoi, printStockChains} from "./utils.js";



const {maxExpDate , stocksData} = parsePutParams();

let resultArr = []
for(const stockData of stocksData ){
    const [stockOptionsChain,currentPrice] = await getOptionQuote(stockData.symbol , maxExpDate , stockData.maxStrikePrice,"put" );
    const filteredStockOptionsChain = filterStockChainWithPricesOnly(stockOptionsChain,"put",stockData.maxStrikePrice)

    console.log(`found ${filteredStockOptionsChain.length} put options for ${stockData.symbol} with bid prices.`);

    resultArr = resultArr.concat(putRoi(filteredStockOptionsChain,currentPrice,stockData.symbol))
}
    printStockChains(resultArr)


