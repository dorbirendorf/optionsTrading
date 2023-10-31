import axios from "axios"
import  "dotenv/config"
import fs from "fs"
import chalk from "chalk"
import fetch from "node-fetch"

export const calcROI = (optionPrice,targetPrice,daysToExp,lavrage=0.1,commission=0) => {
    const cost = targetPrice * lavrage + commission ;
    const profit = optionPrice  ;
    const timesInYear = 365 / (daysToExp+2);
    const ROI = (profit * timesInYear) / cost;
    return ROI
}

export const calcPercentageFromCurrent = (targetPrice,currentPrice) => ((targetPrice-currentPrice)/currentPrice)

export const printStockChains = (chain)=>{
    console.log(`\nname   current  strike   exp-date    bid    diff       roi \n_______________________________________________________________`)
    chain.forEach(link=>{
        const {ticker,currentPrice,strikePrice,expDateStr,bid,PercentageFromStrike,ROI} = link
        console.log(`${ticker} , ${currentPrice} , ${strikePrice} , ${expDateStr} , ${bid} , ${PercentageFromStrike>0? chalk.green((PercentageFromStrike*100).toFixed(3)):chalk.red((PercentageFromStrike*100).toFixed(3))}%  , ${ROI>0? chalk.green((ROI*100).toFixed(3)):chalk.red((ROI*100).toFixed(3))}% `)
    })
}

export const convertStringtoDate = (stringDate) =>{

    const today = new Date();
    const currMonth = today.getMonth();
    const currYear = today.getFullYear()


    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    const [monthName,dayStr] = stringDate.split(' ');
    const day = parseInt(dayStr);
    const month = monthNames.indexOf(monthName);
    const year = month >= currMonth ? currYear : currYear + 1

    const date =  new Date (`${year}-${month+1}-${day}`)
    date.setUTCHours(0,0,0,0)
    return date

}


export const parsePutParams = () =>{

    const date = new Date(Date.now());
    date.setDate(date.getDate() + 45);
    const maxExpDate = date.toISOString().split('T')[0];

    const dataFromFile = fs.readFileSync(process.cwd() +`/data/put.txt`,"utf-8").split("\n") ;
    const stocksData = dataFromFile.map((row)=>{
        let [s,p] = row.split(",")
        return {"symbol":s,"maxStrikePrice":parseFloat(p).toFixed(2)}
    }).filter(stock => stock.maxStrikePrice && stock.symbol);

    return {maxExpDate,stocksData};
}

export const getOptionQuote = async (ticker,maxExpDate,maxStrikePrice,Optiontype)=>{
    try{
        const today = new Date(Date.now())
        const todayStr = today.toISOString().split('T')[0];
        const url = `https://api.nasdaq.com/api/quote/${ticker}/option-chain?assetclass=stocks&fromdate=${todayStr}&todate=${maxExpDate}&excode=oprac&callput=${Optiontype}&money=out&type=all`
        const res = await fetch(url, {
            headers: {
              "accept-language": "*",
              "user-agent": "node", 
            },
          }).then(res => res.json());
        const rows = res.data?.table?.rows || [];
        const currentPrice  = parseFloat(res.data?.lastTrade.split('$')[1].split('(')[0].trim());
        console.log(`currentPrice is ${currentPrice} , got ${rows.length} rows`);
        return [rows,currentPrice];
    }catch(e){
        console.log(e)
    }
}


export const putRoi = (chain,currentPrice,ticker) => {
    const miliSecInDay = 24*3600*1000
    const today = new Date(Date.now())
    const res = chain.map(chainLink=>{
    const bid = chainLink.p_Bid
    const strikePrice = parseFloat(chainLink.strike);
    const expDate = convertStringtoDate(chainLink.expiryDate)
    const expDateStr = expDate.toISOString().split('T')[0];
    const daysToExp = Math.ceil((expDate-today) / miliSecInDay );
    const PercentageFromStrike = calcPercentageFromCurrent(strikePrice,currentPrice);
    const ROI = calcROI(bid,strikePrice,daysToExp);
    return {ticker,currentPrice,strikePrice,expDateStr,bid,PercentageFromStrike,ROI}
})
.sort((a,b)=> b.ROI-a.ROI)


return res;
}

export const putCherry = (chain,currentPrice,ticker) => {
        const miliSecInDay = 24*3600*1000
        const today = new Date(Date.now())
         chain = chain.map(chainLink=>{
            const bid = chainLink.p_Bid
            const strikePrice = parseFloat(chainLink.strike);
            const expDate = convertStringtoDate(chainLink.expiryDate)
            const expDateStr = expDate.toISOString().split('T')[0];
            const daysToExp = Math.ceil((expDate-today) / miliSecInDay );
            const PercentageFromStrike = calcPercentageFromCurrent(strikePrice,currentPrice);
            const ROI = calcROI(bid,strikePrice,daysToExp);
            return {...chainLink,ticker,currentPrice,strikePrice,expDateStr,bid,PercentageFromStrike,ROI}
        })
        const cherries = chain.filter((item,idx)=>{
            return (
                idx>0  &&
                chain[idx].expiryDate === chain[idx-1].expiryDate &&
                Math.abs(chain[idx].PercentageFromStrike) < Math.abs(chain[idx-1].PercentageFromStrike) &&
                parseFloat(chain[idx].p_Bid) > parseFloat(chain[idx-1].p_Bid) )
        })
    return cherries.sort((a,b)=> b.ROI-a.ROI)

}
export const callRoi = (chain,currentPrice,ticker) => {
    const miliSecInDay = 24*3600*1000
    const today = new Date(Date.now())
    const res = chain.map(chainLink=>{
        const bid = chainLink.c_Bid
        const strikePrice = parseFloat(chainLink.strike);
        const expDate = convertStringtoDate(chainLink.expiryDate)
        const expDateStr = expDate.toISOString().split('T')[0];
        const daysToExp = Math.ceil((expDate-today) / miliSecInDay );
        const PercentageFromStrike = calcPercentageFromCurrent(strikePrice,currentPrice);
        const ROI = calcROI(bid,strikePrice,daysToExp);
        return {ticker,currentPrice,strikePrice,expDateStr,bid,PercentageFromStrike,ROI}
    })
        .sort((a,b)=> b.ROI-a.ROI)


    return res;
}

export const filterStockChainWithPricesOnly = (stockChain, Optiontype, maxStrikePrice) => {
   return  stockChain.filter(
       (row) =>
           Optiontype=="put" ?
           (parseFloat(row.strike) <  parseFloat(maxStrikePrice)) && (row.p_Bid !== '--') :
           (parseFloat(row.strike) >  parseFloat(maxStrikePrice)) && (row.c_Bid !== '--') )
}


/*
not in use for now, has failing when used alot
 */
export const getStockPrice = async (symbol)=>{
    try{
        const apikey = process.env.API_KEY;
        const endpoint = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apikey}`;
        const response = await axios.get(endpoint);

        const stockPrice = response.data["Global Quote"]["05. price"]
        return parseFloat(stockPrice).toFixed(2)
    }catch (e) {
        console.log(e);
    }
}

export const parseCallParams = () =>{

    let dataFromFile = fs.readFileSync(process.cwd() +`/data/call.txt`,"utf-8").split("\n")
    const daysToExp = parseInt(dataFromFile[0]);
    dataFromFile.shift();

    const date = new Date(Date.now());
    date.setDate(date.getDate() + daysToExp);
    const maxExpDate = date.toISOString().split('T')[0];

    let stocksData = dataFromFile.map((row)=>{
        console.log(row)
        let [s,p] = row.split(",")

        return {"symbol":s,"minPercentageChange":parseFloat(p)}
    }).filter(stock => stock.minPercentageChange && stock.symbol);

    return {maxExpDate,stocksData};
}


