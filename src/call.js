import {
    getOptionQuote,
    filterStockChainWithPricesOnly,
    callRoi,
    printStockChains,
    parseCallParams
} from "./utils.js";



const {maxExpDate , stocksData} = parseCallParams();

let resultArr = []
for(const stockData of stocksData ){
    const [stockOptionsChain,StockCurrentPrice] = await getOptionQuote(stockData.symbol , maxExpDate , stockData.maxStrikePrice,"call" )
    const filteredStockOptionsChain = filterStockChainWithPricesOnly(stockOptionsChain,"call",stockData.maxStrikePrice)

    resultArr = resultArr.concat(callRoi(filteredStockOptionsChain,StockCurrentPrice,stockData.symbol))
}
printStockChains(resultArr)

