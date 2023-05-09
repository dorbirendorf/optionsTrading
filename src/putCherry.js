import {
    parsePutParams,
    getOptionQuote,
    getStockPrice,
    filterStockChain,
    putRoi,
    printStockChains,
    putCherry
} from "./utils.js";



const {maxExpDate , stocksData} = parsePutParams();

let resultArr = []
for(const stockData of stocksData ){
    const [stockOptionsChain,StockCurrentPrice] = await Promise.all([
        getOptionQuote(stockData.symbol , maxExpDate , stockData.maxStrikePrice,"put" ),
        getStockPrice(stockData.symbol)
        ])
    const filteredStockOptionsChain = filterStockChain(stockOptionsChain,"put",stockData.maxStrikePrice)

    resultArr = resultArr.concat(putCherry(filteredStockOptionsChain,StockCurrentPrice,stockData.symbol))
}
    printStockChains(resultArr)


