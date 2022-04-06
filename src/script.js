const APIKEY = '5938SEBM9YJ7JVBMTJF3FIB8IAZHNPZPV4';
let ADR = '0x240Eb7B9Bde39819E05054EFeB412Ce55250898c';
//BTC ADR = 1wiz18xYmhRX6xStj2b9t1rwWX4GKUgpv
let URL_ETH_TRANSACTIONS = `https://api.etherscan.io/api?module=account&action=txlist&address=${ADR}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${APIKEY}`;
let URL_ETH_BALANCE = `https://api.etherscan.io/api?module=account&action=balance&address=${ADR}&tag=latest&apikey=${APIKEY}`;
let URL_ETH_PRICE = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=ETH&tsym=EUR&limit=1&toTs=`;

let URL_BTC_BALANCE_AND_TRANSACTIONS = `https://blockchain.info/rawaddr/${ADR}`;
let URL_BTC_PRICE = `https://min-api.cryptocompare.com/data/v2/histohour?fsym=BTC&tsym=EUR&limit=1&toTs=`;
let state = "Ethereum";


let rowData = [];
let columnDefs = [];
let gridOptions = {};
const input = document.querySelector("#exampleFormControlInput1");
const bitcoinButton = document.querySelector("#bitcoin_button");
const ethereumButton = document.querySelector("#ethereum_button");
const addressLabel = document.querySelector("#address_label");
const okButton = document.querySelector("#okButton");
const exportButton = document.querySelector("#exportButton")
const spinner = document.querySelector("#spinner");

const setGrid = () => {
    columnDefs = [
        { headerName: 'Date', field: "date", sortable: true, filter: true, editable: true},
        { headerName: 'Time', field: "time", sortable: true, filter: true, editable: true },
        { headerName: 'Value', field: "value", sortable: true, filter: true, editable: true },
        { headerName: 'Value In Euro', field: "valueInEuro" ,valueFormatter: (p) => `${Math.round(p.value * 100) / 100} €`, sortable: true, filter: true, editable: true },
        { headerName: 'Bought in euro', field: "buyEuro" ,valueFormatter: (p) => `${Math.round(p.value * 100) / 100} €`, sortable: true, filter: true, editable: true },
        { headerName: 'Bought in ETH', field: "buyETH" ,valueFormatter: (p) => `${p.value} ETH`, sortable: true, filter: true, editable: true },
        { headerName: 'IN/OUT', field: "inOrOut", sortable: true, filter: true, editable: true},
        { headerName: 'Profit/Loss', field: "profitLoss", valueFormatter: (p) => `${Math.round(p.value * 100) / 100} €`,sortable: true, filter: true, editable: true},
        { headerName: 'Txn Hash', field: "hash", sortable: true, filter: true, editable: true },
        { headerName: 'Txn Fee', field: "fee", valueFormatter: (p) => p.value + " ETH", sortable: true, filter: true, editable: true },
        { headerName: 'Fee in Euro', field: "feeInEuro", valueFormatter: (p) => `${Math.round(p.value * 100) / 100} €`, sortable: true, filter: true, editable: true },
    ];
    gridOptions = {
        pagination: true,
        columnDefs: columnDefs,
        rowData: rowData,
        defaultColDef: {
            resizable: true,
        },
    };
}

let getInputAndOutputValueInEuro = (data_transactions) => {
    var profit = 0
    var input = 0
    var output = 0
    data_transactions.map((it) => {
        if(it.inOrOut === "IN") {
            input += it.valueInEuro
        }else {
            output += it.valueInEuro
        }
        profit += it.inOrOut === "IN" ? it.valueInEuro : -it.valueInEuro
    })
    console.log(input, output, profit)
    return [input, output, profit]
}

let setValues = (input, output, profit) => {
    const input_label = document.querySelector('#input');
    const output_label = document.querySelector('#output');
    const profit_label = document.querySelector('#profit')
    
    input_label.innerHTML = `Input: ${Math.round(input * 100) / 100} €`;
    output_label.innerHTML = `Output: ${Math.round(output * 100) / 100} €`;
    profit_label.innerHTML = `Profit: ${Math.round(profit * 100) / 100} €`;
}

let setEthBalance = async (balance) => {
        const balance_label=document.querySelector('#account_balance');
        const balanceEth = gweiToEth(Number(balance));
        balance_label.innerHTML = `Balance: ${balanceEth} ETH (${await getCurrentPriceOEth(balanceEth) + '€'})`;
}

let getCurrentPriceOEth = async (ethBalance) => {
   const priceResponse =  await getEthPrice(new Date().getTime());
   return Math.round(priceResponse.Data.Data[0].close * ethBalance *100)/100;
};

let getEthPrice = async (timeStamp) => {
    const URL = `${URL_ETH_PRICE}${timeStamp}`;
    const response = await fetch(URL);
    return await response.json();
};

let getBtcPrice = async (timeStamp) => {
    const URL = `${URL_BTC_PRICE}${timeStamp}`;
    const response = await fetch(URL);
    return await response.json();
}

let calcPriceThen = (data, gData, i) => {
    const price = parseFloat(data["Data"]["Data"][1]["close"]);
    const euro = gweiToEth(gData["result"][i]["value"]) * price;
    return euro;
};

let fetchEthBalance = async () => {
    let response_balance = await fetch(URL_ETH_BALANCE)
    const response = await response_balance.json();
    return response.result;
} 

let fetchEthData = async () => {
    const response_transactions = await fetch(URL_ETH_TRANSACTIONS);
    const data_transactions = await response_transactions.json();

    

    const gridResult = [];
    
    let boughtEuroSoFar = 0;
    for(let i=0; i<data_transactions.result.length; i++){
        const ethPrices = await getEthPrice(data_transactions.result[i].timeStamp);
        

        if(ethPrices.Data.Data){
            const timestamp = data_transactions.result[i].timeStamp;
            const val = data_transactions.result[i].value;
            data_transactions.result[i].price = ethPrices.Data.Data[1].close;
            let valueInEuro = data_transactions.result[i].price * gweiToEth(data_transactions.result[i].value);
            data_transactions.result[i].valueInEuro = valueInEuro;

            let inOUT = inOrOut(data_transactions.result[i].to);
            data_transactions.result[i].inOrOut = inOUT;

            let profitLoss = inOUT == "OUT" ? data_transactions.result[i].valueInEuro - boughtEuroSoFar : "-";
            
            data_transactions.result[i].profitLoss = profitLoss;
            
            
            
            if(inOUT == "OUT") {
                valueInEuro = -valueInEuro;
            }
            boughtEuroSoFar += valueInEuro;
            data_transactions.result[i].fee = data_transactions.result[i].gasPrice * data_transactions.result[i].gasUsed;
            data_transactions.result[i].feeInEuro = data_transactions.result[i].price * gweiToEth(data_transactions.result[i].fee);
            data_transactions.result[i].time =  new Date(Number(timestamp * 1000)).toISOString().split('T')[1].split('.')[0];
            data_transactions.result[i].date =  new Date(Number(timestamp * 1000)).toISOString().split('T')[0];
            data_transactions.result[i].value = (gweiToEth(val)) + " ETH";
            data_transactions.result[i].fee = (data_transactions.result[i].fee / Math.pow(10, 18));
            
            data_transactions.result[i].buyEuro = boughtEuroSoFar;
            data_transactions.result[i].buyETH = gweiToEth(Math.pow(10, 18));
            gridResult.push(data_transactions.result[i]);
        }
    };
    let values = getInputAndOutputValueInEuro(gridResult);
    setValues(values[0], values[1], values[2])
    setGrid();
    showGrid(gridResult);
}
let fetchBtcData = async () => {

    const response_transactions = await fetch(URL_BTC_BALANCE_AND_TRANSACTIONS);
    const data_transactions = await response_transactions.json();


    let gridResult = [];

    for(let i = 0; i < data_transactions.length; i++) {
        let row = [];
        const timestamp = data_transactions.txs[i].time;
        const btcPrices = await getBtcPrice(timestamp);

        if(btcPrices.Data.Data) {
            row.result[i].timestamp = timestamp;
            let toValue = 0;
            let outputs = data_transactions.txs[i].out;
            for(let j = 0; j < outputs.length; j++) {
                if(outputs[j].addr === ADR) {
                    toValue += outputs[j].value;
                }
            }
            let fromValue = 0;
            let inputs = data_transactions.txs[i].inputs;
            for(let j = 0; j < inputs.length; j++) {
                if (inputs[j].addr === ADR) {
                    fromValue += inputs[j].value;
                }
            }

            row.result[i].inOrOut = toValue - fromValue > 0 ? "IN" : "OUT";
            row.result[i].value = toValue - fromValue;
            let price = btcPrices.Data.Data[1].close;
            row.result[i].valueInEuro = price * satoshiToBtc(value);
            row.result[i].hash = data_transactions.txs[i].hash;
            let fee = satoshiToBtc(data_transactions.txs[i].fee);
            row.result[i].fee = fee;
            row.result[i].feeInEuro = price * fee;
            gridResult.push(row.result[i]);
           
        }
    }
    
    setGrid();
    showGrid(gridResult);
} 

let showGrid = (ethPrices) => {
    toggleSpinner();

    // let the grid know which columns and what data to use
    gridOptions.rowData = ethPrices;
    // lookup the container we want the Grid to use
    const eGridDiv = document.querySelector('#myGrid');
    
    // create the grid passing in the div to use together with the columns & data we want to use
    new agGrid.Grid(eGridDiv, gridOptions);

}

let toggleSpinner = () => {
    if(spinner.style.display === 'block') {
        spinner.style.display = 'none';
    } else {
        spinner.style.display = 'block';
    }
}

let gweiToEth = (gwei) => {
    return gwei / Math.pow(10, 18);
}

let satoshiToBtc = (satoshis) => {
    return satoshis / Math.pow(10, 8);
}

let inOrOut = (to) => {
    return to.toLowerCase() === ADR.toLowerCase() ? 'IN' : 'OUT';
}

let bitcoinButtonAddEventListener = () => {
    bitcoinButton.addEventListener("mousedown", (e) => {
        state = "Bitcoin";
        bitcoinButton.className = "btn btn-primary";
        ethereumButton.className = "btn btn-secondary";
        addressLabel.innerHTML = "Bitcoin Address:";
    });
}

let ethereumButtonAddEventListener = () => {
    ethereumButton.addEventListener("mousedown", (e) => {
        state = "Ethereum";
        bitcoinButton.className = "btn btn-secondary";
        ethereumButton.className = "btn btn-primary";
        addressLabel.innerHTML = "Ethereum Address:";
    });
}

let okButtonAddEventListener = () => {
    okButton.addEventListener("mousedown", async (e) => {
        toggleSpinner();
        gridOptions.api && gridOptions.api.destroy();
        ADR = input.value.trim()
        
        switch(state) {
            case "Ethereum": {
                if(isEthereumAddress(ADR)) {    
                    balance = await fetchEthBalance();
                    URL_ETH_TRANSACTIONS = `https://api.etherscan.io/api?module=account&action=txlist&address=${ADR}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${APIKEY}`;
                    URL_ETH_BALANCE = `https://api.etherscan.io/api?module=account&action=balance&address=${ADR}&tag=latest&apikey=${APIKEY}`;
                    fetchEthData();
                    setEthBalance(balance);
                }else {
                    toggleSpinner();
                    alert('Not a valid eth address!');
                }
                break;
            }
            default: {
                //No Btc address validation yet
                URL_BTC_BALANCE_AND_TRANSACTIONS = `https://blockchain.info/rawaddr/${ADR}`;
                fetchBtcData();
                break;
            }
        }

        
    })
}

let exportButtonAddEventListener = () => {
    exportButton.addEventListener("mousedown", (e) => {
        gridOptions.api && gridOptions.api.exportDataAsCsv();
    })
}

/**
 * Checks if the given string is an address
 *
 * @method isAddress
 * @param {String} address the given HEX adress
 * @return {Boolean}
*/
let isEthereumAddress = function (address) {
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
let isChecksumAddress = function (address) {
    // Check each case
    address = address.replace('0x','');
    let addressHash = keccak256(address.toLowerCase());
    for (let i = 0; i < 40; i++ ) {
        // the nth letter should be uppercase if the nth digit of casemap is 1
        if ((parseInt(addressHash[i], 16) > 7 && address[i].toUpperCase() !== address[i]) || (parseInt(addressHash[i], 16) <= 7 && address[i].toLowerCase() !== address[i])) {
            return false;
        }
    }
    return true;
};

let isBitcoinAddress = (address) => {
    var decoded = base58_decode(address);     
    if (decoded.length != 25) return false;
    var cksum = decoded.substr(decoded.length - 4); 
    var rest = decoded.substr(0, decoded.length - 4);  
    var good_cksum = hex2a(sha256_digest(hex2a(sha256_digest(rest)))).substr(0, 4);
    if (cksum != good_cksum) return false;
    return true;
}

let base58_decode = (string) => {
  var table = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  var table_rev = new Array();
  var i;
  for (i = 0; i < 58; i++) {
    table_rev[table[i]] = int2bigInt(i, 8, 0);
  } 
  var l = string.length;
  var long_value = int2bigInt(0, 1, 0);  
  var num_58 = int2bigInt(58, 8, 0);
  var c;
  for(i = 0; i < l; i++) {
    c = string[l - i - 1];
    long_value = add(long_value, mult(table_rev[c], Math.pow(num_58, i)));
  }
  var hex = bigInt2str(long_value, 16);  
  var str = hex2a(hex); 
  var nPad;
  for (nPad = 0; string[nPad] == table[0]; nPad++);  
  var output = str;
  if (nPad > 0) output = repeat("\0", nPad) + str;
  return output;
}

let hex2a = (hex) => {
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

let repeat = (s, n) => {
    var a = [];
    while(a.length < n){
        a.push(s);
    }
    return a.join('');
}

bitcoinButtonAddEventListener();
ethereumButtonAddEventListener();
okButtonAddEventListener();
exportButtonAddEventListener();