//testing nodemon 04FEB18 at 1614
var grpc = require('grpc');
var fs = require('fs');
var express = require('express');
var app = express();
var lndCert = fs.readFileSync('/home/ubuntu/.lnd/tls.cert');
var credentials = grpc.credentials.createSsl(lndCert);
var lnrpcDescriptor = grpc.load('rpc.proto');
var lnrpc = lnrpcDescriptor.lnrpc;
var lightning = new lnrpc.Lightning('localhost:10009', credentials);
var html = (fs.readFileSync('main.html').toString());
var reqPage = (fs.readFileSync('request.html').toString());
var sleep = require('sleep');
var moment = require('moment'); 
var https = require('https');


require('events').EventEmitter.defaultMaxListeners = Infinity;


app.set('port', (process.env.PORT || 7777));

app.get('/',function (req, res) {
    console.log("Home page loaded.")
    
     //create invoice to allow skipping
     call = lightning.addInvoice({ 
        memo: "adwatcher",
        value: 50,
        }, function(err, response) {
            
            console.log('AddInvoice: ' + response.payment_request);
            
            //display newly generated invoices everytime the page loads with qr code(still working on qr code gerneration)
            res.send(html+''+ '<br><h4 id="note1">Please pay 50 sat invoice to donate, then click "support" to verify.</h4><p id="invoice">'+response.payment_request+'</p><a href="http://adwatcher.hopto.org:7777/skip/' +response.payment_request + '/"'+'><img id="support" src="https://pre00.deviantart.net/b38e/th/pre/i/2015/181/f/3/youtube_support_button__donation_button__by_koolgoldfinch-d8zf3if.png"></img></a><!--Hide the pay button until user watches for a minute --><script>function readyToPay() {$("#paid").show("slow");};$("#paid").hide(); window.setTimeout(readyToPay, 300000);</script>');
     });
});
  
 app.get('/nodeInfo', function (req, res){
   //generate current walletBalance
    call = lightning.walletBalance({
        witness_only: false,
    }, function(err, response) {
          console.log('WalletBalance: ' + response.total_balance);
          var balance = response.total_balance;
   
         //generate channel balance
     call = lightning.channelBalance({}, function(err, response) {
            console.log('ChannelBalance: ' + response.balance);
            var chanBalance = response.balance
  
            //get number of peers
  call = lightning.listPeers({}, function(err, response) {
    console.log('Peer Count: ' + '"' + response.peers.length + '"');
    var peeps = response.peers.length;

    res.send(reqPage+'<br></h4 id="note1"><br><h4>Peers: ' + peeps  + '<br><h4 id="note1">Channel Balance: '+ chanBalance + '</h4><br><input type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div> <iframe id="video" width="1200" height="600" src="http://rpubs.com/callmekurisu/lnd"></iframe>');
     });
    });
  });
});
   
 //handle skip ad or donate request by checking for payment
app.get('/skip/:Invoice/',function (req, res) {
    var data = req.params;
    var invoice = data.Invoice;

    call = lightning.listInvoices({
        pending_only: false,
    }, function(err, response) {

        for (i=0;i<response.invoices.length;i++){
            var rpr = response.invoices[i]["payment_request"];
            var settled = response.invoices[i]["settled"];
            console.log(rpr + ' ' + settled);
            if (invoice == rpr && settled == true) {
                console.log('Paid invoice: ', rpr);
                res.send(reqPage + '<h2 id="note1">Congrats! You just gained access to data on the server that you would not have access to had you not paid a live invoice from me. Of course this transaction requires no account signups or third parties. This is what is known as a "pay wall" and has various implications regarding the monetization of the internet through microtransactions. Follow the white rabbit...</h2><script>window.setTimeout(function reload() {window.location.assign("https://en.wikipedia.org/wiki/Altruism")}, 30000); </script>');
            } else if (invoice == rpr && settled == false) {
                console.log('Unpaid invoice: ', rpr);
                res.send(reqPage + '<h2 id="note1">Invoice not paid! (T_T)</h2><script>window.setTimeout(function reload() {window.location.assign("https://en.wikipedia.org/wiki/Selfishness")}, 3000); </script>');
            }
          }

      })
    });

//end skip ad handling


//handle blank request 
app.get('/request/',function (req, res) {
    res.send(reqPage + '<h2 id="note1">Error. Blank request.</h2><br><input id="back" type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');  
});
 
//handle all other requests
app.get('/request/:Payment/',function (req, res) {
    var data = req.params;
    var pay_req = data.Payment;
    console.log(pay_req);
    
  
    //send 1 satoshi payment if there is a valid invoice
    call = lightning.sendPaymentSync({ 
    amt: 5,
    payment_request: pay_req,
  }, function(err, response) {
    if (!err) {
        console.log('SendPaymentSync: ' + response.payment_route); 
        
         //give the API a few seconds to fetch valid payment info
        sleep.sleep(3);
        //send last payment data from listpayments array
        call = lightning.listPayments({}, function(err, response) {
            var recent = response.payments.length-1;
            var hash = response.payments[recent].payment_hash 
            var date = response.payments[recent].creation_date;
            var ts = moment.unix(date).format("lll");
            console.log('ListPayments: ' + hash);
            //pass listpayments API data to web app
            res.send(reqPage+'<br><h4 id="note1">Sent five satoshis!</h4><br><h4>Payment Hash: '+ hash + '<br><h4 id="note1">Timestamp: '+ ts  +  '</h4><br><input id="back" type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');
        
    });
    
    } else {
        console.log("Invalid payment request.");
        console.log(err)   
        res.send(reqPage + '<h2 id="note1">'+'"'+err+'"'+'</h2><br><input type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');
        
      
    }
    
  });
    

    
});


//hidden feature. I'm practicing building network graphs on my own
app.get('/graph/',function (req, res) {
    call = lightning.describeGraph({}, function(err, response) {
    console.log('DescribeGraph: ' + response);
    res.send(response)    
   });
});

  //live testing
    app.listen(7777, '0.0.0.0', function(err) {
  console.log("Started listening on %s", app.url);
});

  /*for running on localhost
    app.listen(5000, function(err) {
  console.log("Started listening on port 5000...");
});*/
