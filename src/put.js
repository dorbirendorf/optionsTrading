import {
    parsePutParams,
    getOptionQuote,
    filterStockChainWithPricesOnly,
    putRoi,
    printStockChains,
    calcMaxStrikePrice
} from "./utils.js";

//Don't show me options with exp date the is more than X days from today
const MAX_DAYS_TO_EXP = 7


const stocksInputData = parsePutParams();

const maxExpDate = new Date(Date.now() + MAX_DAYS_TO_EXP * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

let resultArr = []
for(const stockInputRow of stocksInputData ){
    const [stockOptionsChain,currentPrice] = await getOptionQuote(stockInputRow.symbol , maxExpDate , stockInputRow.maxStrikePrice,"put" );



    const filteredStockOptionsChain = filterStockChainWithPricesOnly(stockOptionsChain,"put",calcMaxStrikePrice(stockInputRow.maxStrikePrice,currentPrice))

    console.log(`found ${filteredStockOptionsChain.length} put options for ${stockInputRow.symbol} with bid prices.`);

    resultArr = resultArr.concat(putRoi(filteredStockOptionsChain,currentPrice,stockInputRow.symbol))
}
    printStockChains(resultArr)


