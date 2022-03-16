const URL = "https://api.etherscan.io/api?module=account&action=txlist&address=0x240Eb7B9Bde39819E05054EFeB412Ce55250898c&startblock=0&endblock=99999999&page=1&offset=100&sort=asc&apikey=YourApiKeyToken";

showDataGrid();

async function showDataGrid() {
    const response = await fetch(URL);
    const data = await response.json();
    // waits until the request completes...
    //console.log(data)
    //document.write(JSON.stringify(data));
    const columnDefs = [
        { field: "blockNumber", sortable: true, filter: true },
        { field:  "timestamp", valueFormatter:(v)=>new Date(v), sortable: true, filter: true },
        { field: "hash",sortable: true, filter: true },
        { field: "value",sortable: true, filter: true },
        { field: "gas",sortable: true, filter: true },
        { field: "gasPrice",sortable: true, filter: true },
        { field: "gasUsed",sortable: true, filter: true },
        ];

    // specify the data
    const rowData = data.result;

    // let the grid know which columns and what data to use
    const gridOptions = {
        pagination: true,
        columnDefs: columnDefs,
        rowData: rowData
        };

    // lookup the container we want the Grid to use
    const eGridDiv = document.querySelector('#myGrid');

    // create the grid passing in the div to use together with the columns & data we want to use
    new agGrid.Grid(eGridDiv, gridOptions);

}