const APIKEY = '5938SEBM9YJ7JVBMTJF3FIB8IAZHNPZPV4';
const ADR = '0x240Eb7B9Bde39819E05054EFeB412Ce55250898c';
const URL = `https://api.etherscan.io/api?module=account&action=txlist&address=${ADR}&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=${APIKEY}`;

showDataGrid();

async function showDataGrid() {
    const response = await fetch(URL);
    const data = await response.json();
    // waits until the request completes...
    //console.log(data)
    //document.write(JSON.stringify(data));
    const columnDefs = [
        { headerName:'Date', field:  "timeStamp", valueFormatter:(p)=> new Date(Number(p.value * 1000)).toISOString().split('T')[0], sortable: true, filter: true },
        { headerName:'Time', field:  "timeStamp", valueFormatter:(p)=> new Date(Number(p.value * 1000)).toISOString().split('T')[1].split('.')[0], sortable: true, filter: true},
        { headerName:'Value', field: "value", valueFormatter:(p) =>(p.value / Math.pow(10, 18)) + " Ether",sortable: true, filter: true, editable: true },
        { headerName:'IN/OUT', field:  "to", valueFormatter:(p)=>p.value.toLowerCase() === ADR.toLowerCase()?'IN':'OUT', sortable: true, filter: true},
        { headerName:'Txn Hash', field: "hash",sortable: true, filter: true, editable: true },
        { headerName:'Txn Fee', field: "gasPrice",valueFormatter:(p) =>(p.value / Math.pow(10, 18)) + " Ether", sortable: true, filter: true },
        ];

    // specify the data
    const rowData = data.result;

    // let the grid know which columns and what data to use
    const gridOptions = {
        pagination: true,
        columnDefs: columnDefs,
        rowData: rowData,
        defaultColDef : {
            resizable: true,
        },
        };

    // lookup the container we want the Grid to use
    const eGridDiv = document.querySelector('#myGrid');

    // create the grid passing in the div to use together with the columns & data we want to use
    new agGrid.Grid(eGridDiv, gridOptions);


}