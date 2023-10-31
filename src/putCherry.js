import {
    parsePutParams,
    getOptionQuote,
    getStockPrice,
    filterStockChainWithPricesOnly,
    putRoi,
    printStockChains,
    putCherry
} from "./utils.js";



const {maxExpDate , stocksData} = parsePutParams();

let resultArr = []
for(const stockData of stocksData ){
    const [stockOptionsChain,StockCurrentPrice] = await getOptionQuote(stockData.symbol , maxExpDate , stockData.maxStrikePrice,"put" );
    const filteredStockOptionsChain = filterStockChainWithPricesOnly(stockOptionsChain,"put",stockData.maxStrikePrice)

    resultArr = resultArr.concat(putCherry(filteredStockOptionsChain,StockCurrentPrice,stockData.symbol))
}
    printStockChains(resultArr)


