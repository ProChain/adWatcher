//testing nodemon 27JAN18 at 1026
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
     res.send(html);
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

    res.send(reqPage+'<br></h4><br><h4>Peers: ' + peeps  + '<br><h4>Channel Balance: '+ chanBalance + '</h4><br><input type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div> <iframe id="video" width="1200" height="600" src="http://explorer.acinq.co/#/n/03de1abc27663967f60872cdfab58c8fe26b07ffd5f06e31be2748753e2b40c362"></iframe>');
     });
    });
  });
});
    
app.get('/request/',function (req, res) {
    res.send(reqPage + '<h2>Error. Blank request.</h2><br><input type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');  
});
 
app.get('/request/:Payment/',function (req, res) {
    var data = req.params;
    var pay_req = data.Payment;
    console.log(pay_req);
    
  
    //send 1 satoshi payment if there is a valid invoice
    call = lightning.sendPaymentSync({ 
    amt: 1,
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
            res.send(reqPage+'<br><h4>Sent one satoshi!</h4><br><h4>Payment Hash: '+ hash + '<br><h4>Timestamp: '+ ts  +  '</h4><br><input type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');
        
    });
    
    } else {
        console.log("Invalid payment request.");
        console.log(err)   
        res.send(reqPage + '<h2>'+'"'+err+'"'+'</h2><br><input type="button" value="Go Back" onclick="goBack()" class="btn-primary btn"></body></div>');
        
      
    }
    
  });
    

    
});

  //live testing
    app.listen(7777, '172.31.44.124', function(err) {
  console.log("Started listening on %s", app.url);
});
  
  /*for running on localhost
    app.listen(5000, function(err) {
  console.log("Started listening on port 5000...");
});*/
