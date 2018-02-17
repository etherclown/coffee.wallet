
var BtcTestHandler = {
    name: "bitcoin-test",
    code: "BTC.TEST",
    longname: "Bitcoin TestNet",
    description:
      "via Bitcoin Wiki: The testnet is an alternative Bitcoin block chain, to be used for testing. " +
      "Testnet coins are separate and distinct from actual bitcoins, and are never supposed to have any value. " +
      "This allows application developers or bitcoin testers to experiment, without having to use real bitcoins or worrying about breaking the main bitcoin chain.",
    links: {
      "Bitcoin Wiki" : "https://en.bitcoin.it/wiki/Testnet",
      "Request TestNet coins" : "https://testnet.manu.backend.hamburg/faucet"
    },
    newPrivateKey: function() {
      return btcjs.newPrivKey(btcjs.networks.test);
    },
    addrFromPrivateKey: function(priv) {
      return btcjs.addrFromPriv(btcjs.networks.test, priv);
    },
    getBalance: function(addr, callback) {
      return btcjs.getBalance(btcjs.networks.test, addr, function (balance, pending) {callback((balance + pending) * 0.00000001)});
    },
    sendPayment: function(priv, receiver, amount) {

    }
}

var BtcHandler = {
    name: "bitcoin",
    code: "BTC",
    longname: "Bitcoin",
    description: "via Wikpedia: Bitcoin is a cryptocurrency and worldwide payment system. " +
      "It is the first decentralized digital currency, as the system works without a central bank or single administrator. " +
      "The network is peer-to-peer and transactions take place between users directly, without an intermediary. " +
      "These transactions are verified by network nodes through the use of cryptography and recorded in a public distributed ledger called a blockchain. " +
      "Bitcoin was invented by an unknown person or group of people under the name Satoshi Nakamoto and released as open-source software in 2009. ",
    links: {
      'bitcoin.org' : 'https://bitcoin.org/',
      'bitcoin.com' : 'https://bitcoin.com/'
    },
    newPrivateKey: function() {
      return btcjs.newPrivKey(btcjs.networks.btc);
    },
    addrFromPrivateKey: function(priv) {
      return btcjs.addrFromPriv(btcjs.networks.btc, priv);
    },
    getBalance: function(addr, callback) {
      return btcjs.getBalance(btcjs.networks.btc, addr, function (balance, pending) {callback((balance + pending) * 0.00000001)});
    }
}

var LtcHandler = {
    name: "litecoin",
    code: "LTC",
    longname: "Litecoin",
    description: "via litecoin.org: Litecoin is a peer-to-peer Internet currency that enables instant, near-zero cost payments to anyone in the world. " +
      "Litecoin is an open source, global payment network that is fully decentralized without any central authorities. " +
      "Mathematics secures the network and empowers individuals to control their own finances. " +
      "Litecoin features faster transaction confirmation times and improved storage efficiency than the leading math-based currency. " +
      "With substantial industry support, trade volume and liquidity, Litecoin is a proven medium of commerce complementary to Bitcoin.",
    links: {
      'litecoin.org' : 'https://litecoin.org/'
    },
    newPrivateKey: function() {
      return btcjs.newPrivKey(btcjs.networks.ltc);
    },
    addrFromPrivateKey: function(priv) {
      return btcjs.addrFromPriv(btcjs.networks.ltc, priv);
    },
    getBalance: function(addr, callback) {
      return btcjs.getBalance(btcjs.networks.ltc, addr, function (balance, pending) {callback((balance + pending) * 0.00000001)});
    }
}