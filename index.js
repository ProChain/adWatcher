//testing nodemon 24MAR18 at 2119
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
var cmd = require("node-cmd");
var http = require('http');
var https = require('https');


var key = fs.readFileSync('adwatcher.key');
var cert = fs.readFileSync( 'primary.crt' );
var ca = fs.readFileSync( 'intermediate.crt' );

var options = {
  key: key,
  cert: cert,
  ca: ca
};

var http = require('http');
http.createServer(app).listen(80);

var https = require('https');
https.createServer(options, app).listen(443);

var forceSsl = require('express-force-ssl');

app.use(forceSsl);

//app.set('port', (process.env.PORT || 7777));

require('events').EventEmitter.defaultMaxListeners = Infinity;

//ssl verification
app.get('/.well-known/acme-challenge/xrrR-rYkdlbr0NhgIvs9mKKKNF5UkYGYEHSoKocc4HE',function (req, res){
    res.send("xrrR-rYkdlbr0NhgIvs9mKKKNF5UkYGYEHSoKocc4HE.PThdngPVfGwq_KDu37deNclIbvsyZ4Q2OExU66Y7Jq4")
    
});

app.get('/',function (req, res) {
    console.log("Home page loaded.")
    
    //generate invoice for donations
    cmd.get(
        'cd ~/gocode/bin/ && ./lncli addinvoice 50',
        function(err, data, stderr){
            var add = JSON.parse(data)
            console.log('Donation pay_req: ',add.pay_req)

            //display newly generated invoices everytime the page loads with qr code(still working on qr code gerneration)
            res.send(html+''+ '<br><h4 id="note1">Please pay 50 sat invoice to donate, then click "support" to verify.</h4><p id="invoice">'+add.pay_req+'</p><a href="https://adwatcher.hopto.org/skip/' +add.pay_req + '/"'+'><img id="support" src="https://pre00.deviantart.net/b38e/th/pre/i/2015/181/f/3/youtube_support_button__donation_button__by_koolgoldfinch-d8zf3if.png"></img></a><!--Hide the pay button until user watches for a minute --><script>function readyToPay() {$("#paid").show("slow");};$("#paid").hide(); window.setTimeout(readyToPay, 30000);</script>');
       }); 
    });
  
 app.get('/nodeInfo', function (req, res){
   
    //generate channel balance          
    cmd.get(
        'cd ~/gocode/bin/ && ./lncli channelbalance',
        function(err, data, stderr){
            var cb = JSON.parse(data)
            console.log('Channel Balnce: ',cb.balance);

            var chanBalance = cb.balance
  
    //get number of peers
    cmd.get(
        'cd ~/gocode/bin/ && ./lncli listpeers',
        function(err, data, stderr){
            var lp = JSON.parse(data)
            console.log('Peers: ',lp.peers.length);

            var peeps = lp.peers.length


    res.send(reqPage+'<br></h4 id="note1"><br><h4>Peers: ' + peeps  + '<br><h4 id="note1">Channel Balance: '+ chanBalance + '</h4><br><input type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div> <iframe id="video" width="1200" height="600" src="https://lightning.engineering/technology.html"></iframe>');
     });
    });
  });
   
 //handle skip ad or donate request by checking for payment
app.get('/skip/:Invoice/',function (req, res) {
    var data = req.params;
    var invoice = data.Invoice;
    
     cmd.get(
        'cd ~/gocode/bin/ && ./lncli listinvoices',
        function(err, data, stderr){
            var li = JSON.parse(data)
            console.log('Invoices: ', li.invoices)

        for (i=0;i<li.invoices.length;i++){
            var rpr = li.invoices[i]["payment_request"];
            var settled = li.invoices[i]["settled"];
            console.log(rpr + ' ' + settled);
            if (invoice == rpr && settled == true) {
                console.log('Paid invoice: ', rpr);
                res.send(reqPage + '<h2 id="note1">Congrats! You just gained access to data on the server that you would not have access to had you not paid a live invoice from me. Of course this transaction requires no account signups or third parties. This is what is known as a "pay wall" and has various implications regarding the monetization of the internet through microtransactions. Follow the white rabbit...</h2><script>window.setTimeout(function reload() {window.location.assign("https://en.wikipedia.org/wiki/Altruism")}, 30000); </script>');
            } else if (invoice == rpr && settled == false) {
                console.log('Unpaid invoice: ', rpr);
                res.send(reqPage + '<h2 id="note1">Invoice not paid! (T_T)</h2><script>window.setTimeout(function reload() {window.location.assign("https://en.wikipedia.org/wiki/Selfishness")}, 3000); </script>');
            }
          }
        });
      });

//end skip ad handling


//handle blank request 
app.get('/request/',function (req, res) {
    res.send(reqPage + '<h2 id="note1">Error. Blank request.</h2><br><input id="back" type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');  
});
 
//handle all other requests
app.get('/request/:Payment/',function (req, res) {
    var data = req.params;var pay_req = data.Payment;console.log(pay_req);
    cmd.get('cd ~/gocode/bin/ && ./lncli decodepayreq '+pay_req,
           function(err, data, stderr){
                if(err){
                    console.log("Bad payment request")
                    res.send(reqPage + '<h2 id="note1">'+'"'+"Could not process your request!"+'"'+'</h2><br><input type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');
                } else if(JSON.parse(data).num_satoshis>500) {
                      console.log("Illegal request. More than 500 sats")
                      res.send(reqPage + '<h2 id="note1">'+'"'+"Request must be <500 sats!"+'"'+'</h2><br><input type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');
                } else if (JSON.parse(data).num_satoshis<=500) {
                      cmd.get( 'cd ~/gocode/bin/ && ./lncli sendpayment --pay_req='+pay_req,
                             function(err, data, stderr){
                                if(err){
                                    console.log("Something went wrong...")
                                    res.send(reqPage + '<h2 id="note1">'+'"'+"Could not process your request!"+'"'+'</h2><br><input type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');
                                } else {
                                    var sp = JSON.parse(data)
                                    console.log('Send Payment: ' + sp.payment_preimage); 
                                    cmd.get('cd ~/gocode/bin/ && ./lncli listpayments',
                                           function(err, data, stderr){
                                               var listpay = JSON.parse(data)
                                               console.log('Payments: ', listpay.payments )
                                               var recent = listpay.payments.length-1;var hash = listpay.payments[recent].payment_hash
                                               var date = listpay.payments[recent].creation_date;var ts = moment.unix(date).format("lll"); 
                                               console.log('ListPayments: ' + hash);
                                               if(sp.payment_preimage == listpay.payments[recent].payment_preimage){
                                                   res.send(reqPage+'<br><h4 id="note1">Sent payment!</h4><br><h4>Payment Hash: '+ hash + '<br><h4 id="note1">Timestamp: '+ ts  +  '</h4><br><input id="back" type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');
                                                   } else {
                                                       console.log("Invalid payment request.");
                                                       res.send(reqPage + '<h2 id="note1">'+'"'+"Could not process your request!"+'"'+'</h2><br><input type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');                
     }});}});}});}); 




