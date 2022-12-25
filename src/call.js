import {parsePutParams,getOptionQuote,printStockChains,getStockPrice as getStockQuote,parseCallParams} from "./utils.js";

 const {maxExpDate , stocksData} = parseCallParams();

await Promise.all(stocksData.map(async(stock)=>{
    stock.currPrice =await getStockQuote(stock.symbol)
}))
 const stocksChains =await Promise.all(stocksData.map(async stock =>await getOptionQuote(stock.symbol , maxExpDate , stock.currPrice *(1+(stock.minPercentageChange/100)) , "call" )));

 stocksChains.forEach(chain => printStockChains(chain));

