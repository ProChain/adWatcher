
var fs = require('fs');
var lndCert = fs.readFileSync("/home/ubuntu/.lnd/tls.cert");
var grpc = require('grpc')
var credentials = grpc.credentials.createSsl(lndCert);
var lnrpcDescriptor = grpc.load("rpc.proto");
var lnrpc = lnrpcDescriptor.lnrpc;
var lightning = new lnrpc.Lightning('localhost:10009', credentials); 

var QRCode = require('qrcode')
 
QRCode.toDataURL('test pay_req', function (err, url) {
  console.log(url)
});

call = lightning.walletBalance({ 
    witness_only: false,
  }, function(err, response) {
    console.log('WalletBalance: ' + response.total_balance);
    console.log(err)
  });

call = lightning.listPeers({}, function(err, response) {
 
    console.log('ListPeers: ' + '"'+ response.peers.length + '"');
  });

    
     //create invoice to allow skipping
     call = lightning.addInvoice({ 
        memo: "adwatcher",
        value: 10,
        }, function(err, response) {
            
            console.log('AddInvoice: ' + JSON.stringify(response));
            console.log(err)
            //display newly generated invoices everytime the page loads with qr code
            });
