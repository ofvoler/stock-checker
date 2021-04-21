const key = "&token=c1vfbsa37fksb0c1kbi0";
var companyName = '';
var input;

// make an initial call to the API to see if the stock ticker is valid
// store the input so we can use it throughout functions
async function checkTicker() {
    document.getElementById("submit").focus();
    input = document.getElementById("symbolInput").value.toUpperCase()

    const nameAPIpath = "https://finnhub.io/api/v1/search?q=";

    fetch(nameAPIpath + input + key)
    .then(response => response.json())
    .then(data => {
        var tickerFound = false;

        // check if a ticker was entered
        if (input === "") {
            document.getElementById("error-code").innerHTML = input + "Please enter a ticker.";
            tickerFound = true;     // so the other error code doesn't print 
        }

        for (let j=0; j<data.count; j++) {
            // if our input matches a symbol exactly, get the stock data and graph it
            if (input === data.result[j].symbol) {
                tickerFound = true;
                companyName = data.result[j].description;
                getStockData();
                getPeers();
                graph();
            }
        }

        // if we didn't find a ticker that matches, print an error
        if (tickerFound === false) {
            document.getElementById("error-code").innerHTML = input + " is not a valid ticker.";
        }
    })
    .catch(error => {
        console.log(error);
    });
}

// get the stock data for this ticker
async function getStockData() {
    const dataAPIpath = "https://finnhub.io/api/v1/quote?symbol=";

    try {
        let response = await fetch(dataAPIpath + input + key)
        let data = await response.json();

        // display the descriptive elements in index.html that were hidden
        const elems = document.getElementsByClassName("stats-text");

        for (let i=0; i < elems.length; i++) {
            elems[i].style.display = "inline-block";
        }

        // set values with stock information from our call
        document.getElementById("error-code").innerHTML = "";
        document.getElementById("ticker-symbol").innerHTML = input;
        document.getElementById("ticker-name").innerHTML = companyName;
        document.getElementById("ticker-price").textContent = data.c;
        document.getElementById("ticker-prev-close").textContent = data.pc;
        document.getElementById("ticker-open").textContent = data.o;
        document.getElementById("ticker-high").textContent = data.h;
        document.getElementById("ticker-low").textContent = data.l;
    } catch (error) {
        console.log(error);
    }
}

// print out three similar companies to the current stock
async function getPeers() {
    const peerAPIpath = "https://finnhub.io/api/v1/stock/peers?symbol=";

    let response = await fetch(peerAPIpath + input + key);
    let data = await response.json();

    // find three peers, making sure we don't add the stock itself
    const peers = [];
    var currentPeer = 0;
    while (peers.length < 3) {
        const peer = data[currentPeer];
        if (peer !== input) {
            peers[peers.length] = peer;
        } 
        currentPeer++;
    }

    document.getElementById("similar-companies").innerHTML = "Similar Companies";
    document.getElementById("peer1").innerHTML = peers[0];
    document.getElementById("peer2").innerHTML = peers[1];
    document.getElementById("peer3").innerHTML = peers[2];    
}

// create a line chart with data from the last year
async function graph() {
    loading("true");
    const graphAPIpath = "https://finnhub.io/api/v1/stock/candle?symbol=";
    const options = "&resolution=D&from=1587497838&to=1618971368";

    var close = [];
    var day = [];

    const response = await fetch(graphAPIpath + input + options + key);   
    const data = await response.json(); 

    close = data.c, day = data.t;

    // format times from unix to regular date
    for (let num=0; num<day.length; num++) {
        const unix = day[num];
        const date = new Date(unix*1000);
        const formattedDate = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
        day[num] = formattedDate;
    }

    const trace = {
        x: day, y: close
    }

    const graphData = [trace];
    loading("false");
    Plotly.newPlot('chart', graphData);

    const button = document.getElementById("switch-chart");
    button.style.display = "inline-block";
    button.innerHTML = "See candlestick chart";
}

// create a candlestick chart with data from the last year
async function candleGraph() {
    loading("true");

    const graphAPIpath = "https://finnhub.io/api/v1/stock/candle?symbol=";
    const options = "&resolution=D&from=1587497838&to=1618971368";

    var x = [];
    var open = [];
    var high = [];
    var low = [];
    var close = [];

    const response = await fetch(graphAPIpath + input + options + key);   
    const data = await response.json(); 

    day = data.t, open = data.o, close = data.c, low = data.l, high = data.h;

    // format times from unix to regular date
    for (let num=0; num<day.length; num++) {
        const unix = day[num];
        const date = new Date(unix*1000);
        const formattedDate = (date.getMonth()+1) + "/" + date.getDate() + "/" + date.getFullYear();
        day[num] = formattedDate;
    }

    const trace = {
        x: day, close: close, high: high, low: low, open: open, 

        line: {color: 'rgba(31,119,180,1)'}, 
        increasing: {line: {color: '#008000'}}, 
        decreasing: {line: {color: '#800000'}}, 

        type: 'candlestick', xaxis: 'x', yaxis: 'y'
    };
      
    const graphData = [trace];
    
    const layout = {
    dragmode: 'zoom', 
    xaxis: { rangeslider: { visible: false } }
    };
      
    loading("false");
    document.getElementById("chart").innerHTML = "";
    Plotly.newPlot('chart', graphData, layout);
}

// Show the users that the current chart is loading
function loading(isLoading) {
    const chartDiv = document.getElementById("chart");
    if (isLoading === "true") {
        document.getElementById("switch-chart").style.display = "none";
        chartDiv.style.marginTop = "100px";
        chartDiv.innerHTML = "Loading chart...";
    } else {
        chartDiv.style.marginTop = "0px";
        chartDiv.innerHTML = "";
    }
}