const APIKEY = '5938SEBM9YJ7JVBMTJF3FIB8IAZHNPZPV4';
let ADR = '0x240Eb7B9Bde39819E05054EFeB412Ce55250898c';
let URL_ETHERSCAN = `https://api.etherscan.io/api?module=account&action=txlist&address=${ADR}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${APIKEY}`;

let rowData = [];
const input = document.querySelector("#exampleFormControlInput1");

const columnDefs = [
    { headerName: 'Date', field: "timeStamp", valueFormatter: (p) => new Date(Number(p.value * 1000)).toISOString().split('T')[0], sortable: true, filter: true },
    { headerName: 'Time', field: "timeStamp", valueFormatter: (p) => new Date(Number(p.value * 1000)).toISOString().split('T')[1].split('.')[0], sortable: true, filter: true, editable: true },
    { headerName: 'Value', field: "value", valueFormatter: (p) => (gweiToEth(p.value)) + " ETH", sortable: true, filter: true, editable: true },
    { headerName: 'Value In Euro', field: "valueInEuro" ,valueFormatter: (p) => `${Math.round(p.value * 100) / 100} €`, sortable: true, filter: true, editable: true },
    { headerName: 'IN/OUT', field: "to", valueFormatter: (p) => p.value.toLowerCase() === ADR.toLowerCase() ? 'IN' : 'OUT', sortable: true, filter: true },
    { headerName: 'Txn Hash', field: "hash", sortable: true, filter: true, editable: true },
    { headerName: 'Txn Fee', field: "fee", valueFormatter: (p) => (p.value / Math.pow(10, 18)) + " ETH", sortable: true, filter: true, editable: true },
    { headerName: 'Fee in Euro', field: "feeInEuro", valueFormatter: (p) => `${Math.round(p.value * 100) / 100} €`, sortable: true, filter: true },
];

const gridOptions = {
    pagination: true,
    columnDefs: columnDefs,
    rowData: rowData,
    defaultColDef: {
        resizable: true,
    },
};
input.addEventListener("keyup", (e)=> {
    console.log(input.value)
})

const button = document.querySelector("#okButton")
button.addEventListener("mousedown", (e) => {
    console.log('event:mouseDown')
    toggleSpinner();
    gridOptions.api && gridOptions.api.destroy();
    if(isAddress(input.value)) {
        ADR = input.value
        URL_ETHERSCAN = `https://api.etherscan.io/api?module=account&action=txlist&address=${ADR}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${APIKEY}`;
        fetchData();
    }else {
        toggleSpinner();
        alert('not a valid eth adress');
        //const errorMessageParagraph = document.querySelector('#errorMessage');
        //errorMessageParagraph.innerHTML = 'not a valid eth address';
    }
})

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
    toggleSpinner();
    console.log(ethPrices)

    // let the grid know which columns and what data to use
    gridOptions.rowData = ethPrices;
    // lookup the container we want the Grid to use
    const eGridDiv = document.querySelector('#myGrid');
    
    // create the grid passing in the div to use together with the columns & data we want to use
    new agGrid.Grid(eGridDiv, gridOptions);

}

toggleSpinner = () => {
    const spinner = document.querySelector('#spinner');
    if(spinner.style.display === 'block') {
        spinner.style.display = 'none';
    } else {
        spinner.style.display = 'block';
    }
}

async function test() {
    return 1
}

function gweiToEth(gwei) {
    return gwei / Math.pow(10, 18)
}

/**
 * Checks if the given string is an address
 *
 * @method isAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
*/
var isAddress = function (address) {
    if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
        // check if it has the basic requirements of an address
        return false;
    } else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) {
        // If it's all small caps or all all caps, return true
        return true;
    } else {
        // Otherwise check each case
        return isChecksumAddress(address);
    }
};

/**
 * Checks if the given string is a checksummed address
 *
 * @method isChecksumAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
*/
var isChecksumAddress = function (address) {
    // Check each case
    address = address.replace('0x','');
    var addressHash = keccak256(address.toLowerCase());
    for (var i = 0; i < 40; i++ ) {
        // the nth letter should be uppercase if the nth digit of casemap is 1
        if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
            return false;
        }
    }
    return true;
};