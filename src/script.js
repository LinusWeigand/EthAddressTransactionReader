const APIKEY = '5938SEBM9YJ7JVBMTJF3FIB8IAZHNPZPV4';
const ADR = '0x240Eb7B9Bde39819E05054EFeB412Ce55250898c';
const URL_ETHERSCAN = `https://api.etherscan.io/api?module=account&action=txlist&address=${ADR}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${APIKEY}`;
var i = 0

fetchData();


async function getEthPrice(timeStamp, gData) {
    //604800 seconds -> 7 days
    const URL_CRYPTOCOMPARE = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=ETH&tsym=EUR&limit=1&toTs=${timeStamp}`
    const response = await fetch(URL_CRYPTOCOMPARE);
    return await response.json();
}

calcPrice = (data, gData) => {
    const price = parseFloat(data["Data"]["Data"][1]["close"]);
    console.log('data',gData)
    const euro = gweiToEth(gData["result"][i++]["value"]) * price;
    console.log('price',price);
    console.log('euro',euro);

    return price;
}


async function fetchData() {
    const response = await fetch(URL_ETHERSCAN);
    const data = await response.json();
    const ethPrices = [];
    
    for(let i=0; i<data.result.length; i++){
        const ethResp = await getEthPrice(data.result[i].timeStamp, data);
        if(ethResp.Data.Data){
            data.result[i].price = ethResp.Data.Data[0].close;
            ethPrices.push(data.result[i]);
        }
    };
     
    showGrid(ethPrices);

}

const showGrid = (ethPrices) => {

    const columnDefs = [
        { headerName: 'Date', field: "timeStamp", valueFormatter: (p) => new Date(Number(p.value * 1000)).toISOString().split('T')[0], sortable: true, filter: true },
        { headerName: 'Time', field: "timeStamp", valueFormatter: (p) => new Date(Number(p.value * 1000)).toISOString().split('T')[1].split('.')[0], sortable: true, filter: true, editable: true },
        { headerName: 'Value', field: "value", valueFormatter: (p) => (gweiToEth(p.value)) + " Ether", sortable: true, filter: true, editable: true },
        { headerName: 'PreisThen', field: "price", sortable: true, filter: true, editable: true },
     //   { headerName: 'Value in Eur', field: "timeStamp", valueFormatter: (i)=>ethPrices[i], sortable: true, filter: true, editable: true },
        { headerName: 'IN/OUT', field: "to", valueFormatter: (p) => p.value.toLowerCase() === ADR.toLowerCase() ? 'IN' : 'OUT', sortable: true, filter: true },
        { headerName: 'Txn Hash', field: "hash", sortable: true, filter: true, editable: true },
        { headerName: 'Txn Fee', field: "gasPrice", valueFormatter: (p) => (p.value / Math.pow(10, 18)) + " Ether", sortable: true, filter: true },
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