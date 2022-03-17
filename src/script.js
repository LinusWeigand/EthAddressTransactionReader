const APIKEY = '5938SEBM9YJ7JVBMTJF3FIB8IAZHNPZPV4';
const ADR = '0x240Eb7B9Bde39819E05054EFeB412Ce55250898c';
const URL_ETHERSCAN = `https://api.etherscan.io/api?module=account&action=txlist&address=${ADR}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${APIKEY}`;

fetchData();


async function getEthPrice(timeStamp, gData) {
    //604800 seconds -> 7 days
    const URL_CRYPTOCOMPARE = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=ETH&tsym=EUR&limit=1&toTs=${timeStamp}`
    const response = await fetch(URL_CRYPTOCOMPARE);
    return await response.json();
}

calcPriceThen = (data, gData, i) => {
    const price = parseFloat(data["Data"]["Data"][1]["close"]);
    const euro = gweiToEth(gData["result"][i]["value"]) * price;
    return euro;
}


async function fetchData() {
    const response = await fetch(URL_ETHERSCAN);
    const data = await response.json();
    const ethPrices = [];
    
    for(let i=0; i<data.result.length; i++){
        const ethResp = await getEthPrice(data.result[i].timeStamp, data);
        if(ethResp.Data.Data){
            data.result[i].price = ethResp.Data.Data[1].close;
            data.result[i].valueInEuro = data.result[i].price * gweiToEth(data.result[i].value)
            data.result[i].fee = data.result[i].gasPrice * data.result[i].gasUsed
            data.result[i].feeInEuro = data.result[i].price * gweiToEth(data.result[i].fee)
            ethPrices.push(data.result[i]);
        }
    };
     
    showGrid(ethPrices);

}

const showGrid = (ethPrices) => {

    console.log(ethPrices)
    const columnDefs = [
        { headerName: 'Date', field: "timeStamp", valueFormatter: (p) => new Date(Number(p.value * 1000)).toISOString().split('T')[0], sortable: true, filter: true },
        { headerName: 'Time', field: "timeStamp", valueFormatter: (p) => new Date(Number(p.value * 1000)).toISOString().split('T')[1].split('.')[0], sortable: true, filter: true, editable: true },
        { headerName: 'Value', field: "value", valueFormatter: (p) => (gweiToEth(p.value)) + " ETH", sortable: true, filter: true, editable: true },
        { headerName: 'Value In Euro', field: "valueInEuro" ,valueFormatter: (p) => `${Math.round(p.value * 100) / 100} €`, sortable: true, filter: true, editable: true },
     //   { headerName: 'Value in Eur', field: "timeStamp", valueFormatter: (i)=>ethPrices[i], sortable: true, filter: true, editable: true },
        { headerName: 'IN/OUT', field: "to", valueFormatter: (p) => p.value.toLowerCase() === ADR.toLowerCase() ? 'IN' : 'OUT', sortable: true, filter: true },
        { headerName: 'Txn Hash', field: "hash", sortable: true, filter: true, editable: true },
        { headerName: 'Txn Fee', field: "fee", valueFormatter: (p) => (p.value / Math.pow(10, 18)) + " ETH", sortable: true, filter: true, editable: true },
        { headerName: 'Fee in Euro', field: "feeInEuro", valueFormatter: (p) => `${Math.round(p.value * 100) / 100} €`, sortable: true, filter: true },
    ];

    const rowData = ethPrices;
    // let the grid know which columns and what data to use
    const gridOptions = {
        pagination: true,
        columnDefs: columnDefs,
        rowData: rowData,
        defaultColDef: {
            resizable: true,
        },

    };

    // lookup the container we want the Grid to use
    const eGridDiv = document.querySelector('#myGrid');

    // create the grid passing in the div to use together with the columns & data we want to use
    new agGrid.Grid(eGridDiv, gridOptions);

}

async function test() {
    return 1
}

function gweiToEth(gwei) {
    return gwei / Math.pow(10, 18)
}