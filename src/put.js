
import {parsePutParams,getOptionQuote,printStockChains} from "./utils.js";

const {maxExpDate , stocksData} = parsePutParams();

const stocksChains =await Promise.all(stocksData.map(async stock =>await getOptionQuote(stock.symbol , maxExpDate , stock.maxStrikePrice,"put" )));

stocksChains.forEach(chain => printStockChains(chain));