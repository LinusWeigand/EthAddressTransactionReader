const APIKEY = '5938SEBM9YJ7JVBMTJF3FIB8IAZHNPZPV4';
let ADR = '0x240Eb7B9Bde39819E05054EFeB412Ce55250898c';
let URL_ETHERSCAN_TRANSACTIONS = `https://api.etherscan.io/api?module=account&action=txlist&address=${ADR}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${APIKEY}`;
let URL_ETHERSCAN_ACCOUNT_BALANCE = `https://api.etherscan.io/api?module=account&action=balance&address=${ADR}&tag=latest&apikey=${APIKEY}`;
let PRICE_TIME = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=ETH&tsym=EUR&limit=1&toTs=`;

let rowData = [];
const input = document.querySelector("#exampleFormControlInput1");

const columnDefs = [
    { headerName: 'Date', field: "date", sortable: true, filter: true },
    { headerName: 'Time', field: "time", sortable: true, filter: true, editable: true },
    { headerName: 'Value', field: "value", sortable: true, filter: true, editable: true },
    { headerName: 'Value In Euro', field: "valueInEuro" ,valueFormatter: (p) => `${Math.round(p.value * 100) / 100} €`, sortable: true, filter: true, editable: true },
    { headerName: 'IN/OUT', field: "to", valueFormatter: (p) => inOrOut(p.value), sortable: true, filter: true },
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
})

const okButton = document.querySelector("#okButton")
okButton.addEventListener("mousedown", async (e) => {
    toggleSpinner();
    gridOptions.api && gridOptions.api.destroy();
    var address = input.value.trim()
    if(isAddress(address)) {    
        balance = await fetchBalance();
        ADR = address
        URL_ETHERSCAN_TRANSACTIONS = `https://api.etherscan.io/api?module=account&action=txlist&address=${ADR}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${APIKEY}`;
        URL_ETHERSCAN_ACCOUNT_BALANCE = `https://api.etherscan.io/api?module=account&action=balance&address=${ADR}&tag=latest&apikey=${APIKEY}`;
        fetchData();
        setBalance(balance);
        
    }else {
        toggleSpinner();
        alert('Not a valid eth address!');
        //const errorMessageParagraph = document.querySelector('#errorMessage');
        //errorMessageParagraph.innerHTML = 'not a valid eth address';
    }
})
const exportButton = document.querySelector("#exportButton")
exportButton.addEventListener("mousedown", (e) => {
    gridOptions.api && gridOptions.api.exportDataAsCsv();
})

const getInputAndOutputValueInEuro = (data_transactions) => {
    var profit = 0
    var input = 0
    var output = 0
    data_transactions.map((it) => {
        if(inOrOut(it.to) === "IN") {
            input += it.valueInEuro
        }else {
            output += it.valueInEuro
        }
        profit += inOrOut(it.to) === "IN" ? it.valueInEuro : -it.valueInEuro
    })
    console.log(input, output, profit)
    return [input, output, profit]
}

const setValues = (input, output, profit) => {
    const input_label = document.querySelector('#input');
    const output_label = document.querySelector('#output');
    const profit_label = document.querySelector('#profit')
    
    input_label.innerHTML = `Input: ${Math.round(input * 100) / 100} €`;
    output_label.innerHTML = `Output: ${Math.round(output * 100) / 100} €`;
    profit_label.innerHTML = `Profit: ${Math.round(profit * 100) / 100} €`;
}

const setBalance = async (balance) => {
        const balance_label=document.querySelector('#account_balance');
        const balanceEth = gweiToEth(Number(balance));
        balance_label.innerHTML = `Balance: ${balanceEth} ETH (${await getCurrentPriceOEth(balanceEth) + '€'})`;
}

getCurrentPriceOEth = async (ethBalance) => {
   const priceResponse =  await getEthPrice(new Date().getTime());
   return Math.round(priceResponse.Data.Data[0].close * ethBalance *100)/100;
};



async function getEthPrice(timeStamp) {
    //604800 seconds -> 7 days
    const URL_CRYPTOCOMPARE = `${PRICE_TIME}${timeStamp}`
    const response = await fetch(URL_CRYPTOCOMPARE);
    return await response.json();
}

calcPriceThen = (data, gData, i) => {
    const price = parseFloat(data["Data"]["Data"][1]["close"]);
    const euro = gweiToEth(gData["result"][i]["value"]) * price;
    return euro;
}

const fetchBalance = async () => {
    let response_balance = await fetch(URL_ETHERSCAN_ACCOUNT_BALANCE)
    const response = await response_balance.json();
    return response.result;
 
} 


async function fetchData() {
    const response_transactions = await fetch(URL_ETHERSCAN_TRANSACTIONS);
    const data_transactions = await response_transactions.json();

    

    const ethPrices = [];
    
    
    for(let i=0; i<data_transactions.result.length; i++){
        const ethResp = await getEthPrice(data_transactions.result[i].timeStamp, data_transactions);
        if(ethResp.Data.Data){
            const timestamp = data_transactions.result[i].timeStamp;
            const val = data_transactions.result[i].value;
            data_transactions.result[i].price = ethResp.Data.Data[1].close;
            data_transactions.result[i].valueInEuro = data_transactions.result[i].price * gweiToEth(data_transactions.result[i].value);
            data_transactions.result[i].fee = data_transactions.result[i].gasPrice * data_transactions.result[i].gasUsed;
            data_transactions.result[i].feeInEuro = data_transactions.result[i].price * gweiToEth(data_transactions.result[i].fee);
            data_transactions.result[i].time =  new Date(Number(timestamp * 1000)).toISOString().split('T')[1].split('.')[0];
            data_transactions.result[i].date =  new Date(Number(timestamp * 1000)).toISOString().split('T')[0];
            data_transactions.result[i].value = (gweiToEth(val)) + " ETH";
            ethPrices.push(data_transactions.result[i]);
        }
    };
    let values = getInputAndOutputValueInEuro(ethPrices);
    setValues(values[0], values[1], values[2])

    showGrid(ethPrices);
    return 1
    
}

const showGrid = (ethPrices) => {
    toggleSpinner();

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


function gweiToEth(gwei) {
    return gwei / Math.pow(10, 18)
}

const inOrOut = (to) => {
    return to.toLowerCase() === ADR.toLowerCase() ? 'IN' : 'OUT';
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