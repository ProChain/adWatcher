
var fs = require('fs');
var lndCert = fs.readFileSync("/home/ubuntu/.lnd/tls.cert");
var grpc = require('grpc')
var credentials = grpc.credentials.createSsl(lndCert);
var lnrpcDescriptor = grpc.load("rpc.proto");
var lnrpc = lnrpcDescriptor.lnrpc;
var lightning = new lnrpc.Lightning('localhost:10009', credentials); 
call = lightning.walletBalance({ 
    witness_only: false,
  }, function(err, response) {
    console.log('WalletBalance: ' + response.total_balance);
    console.log(err)
  });

call = lightning.listPeers({}, function(err, response) {
 
    console.log('ListPeers: ' + '"'+ response.peers.length + '"');
  });


