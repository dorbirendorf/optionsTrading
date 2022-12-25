import axios from "axios"
import  "dotenv/config"
import fs from "fs"
import chalk from "chalk"


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

    const date =  new Date (`${year}-${month+1}-${day+1}`)
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
        const res = await axios.get(`https://api.nasdaq.com/api/quote/${ticker}/option-chain?assetclass=stocks&fromdate=${todayStr}&todate=${maxExpDate}&excode=oprac&callput=${Optiontype}&money=out&type=all`)
        const rows = res.data?.data?.table?.rows || [];        
        const currentPrice  = parseFloat(res.data?.data?.lastTrade.split('$')[1].split('(')[0].trim());
        const miliSecInDay = 24*3600*1000;
        let chain = rows
        .filter( (row) => Optiontype=="put" ? (parseFloat(row.strike) <  parseFloat(maxStrikePrice)) && (row.p_Bid !== '--') :(parseFloat(row.strike) >  parseFloat(maxStrikePrice)) && (row.c_Bid !== '--') )
        .map(chainLink=>{
            const bid = Optiontype=="put" ? chainLink.p_Bid : chainLink.c_Bid
            const strikePrice = parseFloat(chainLink.strike); 
            const expDate = convertStringtoDate(chainLink.expiryDate)
            const expDateStr = expDate.toISOString().split('T')[0];
            const daysToExp = Math.ceil((expDate-today) / miliSecInDay );
            const PercentageFromStrike = calcPercentageFromCurrent(strikePrice,currentPrice);
            const ROI = calcROI(bid,strikePrice,daysToExp);
            return {ticker,currentPrice,strikePrice,expDateStr,bid,PercentageFromStrike,ROI}
        })
        .sort((a,b)=> b.ROI-a.ROI)

        
        return chain;
        
    }catch(e){
        console.log(e)
    }
}

export const getStockPrice = async (symbol)=>{
    const apikey = process.env.API_KEY;
    const endpoint = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apikey}`;
    const response = await axios.get(endpoint);

    const stockPrice = response.data["Global Quote"]["05. price"]
    return stockPrice
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