import {parsePutParams, getOptionQuote, getStockPrice, filterStockChain, putRoi, printStockChains} from "./utils.js";



const {maxExpDate , stocksData} = parsePutParams();

let resultArr = []
for(const stockData of stocksData ){
    const [stockOptionsChain,currentPrice] = await getOptionQuote(stockData.symbol , maxExpDate , stockData.maxStrikePrice,"put" );
    const filteredStockOptionsChain = filterStockChain(stockOptionsChain,"put",stockData.maxStrikePrice)

    resultArr = resultArr.concat(putRoi(filteredStockOptionsChain,currentPrice,stockData.symbol))
}
    printStockChains(resultArr)


