'use strict'

function handleOpenURL(url) {
  setTimeout(function() {
    //make sure data is loaded
    app.onDataLoaded(function(){
      app.handleUrlOpened(url);
    });
  }, 0);
}

var app = {
    // Application Constructor
    settings: Settings,
    data: Data,
    wallets: {},
    initialize: function() {
        var that = this;
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        document.getElementById('overlay').onclick = function(event){
          if (that.menuOpened) {
            that.closeMenu();
          }
        };
        this.tabWallets();
    },

    targetScroll: 0,

    scrollToTargetTimer: null,

    scrollToTarget : function(){

      var width = document.scrollingElement.offsetWidth;
      document.body.onscroll = null;
      var targetScroll = Math.floor(this.targetScroll * width);

      if (targetScroll > document.scrollingElement.scrollLeft) {
        document.scrollingElement.scrollLeft = Math.ceil(
          document.scrollingElement.scrollLeft + ((targetScroll - document.scrollingElement.scrollLeft) / 3));
      } else {
        document.scrollingElement.scrollLeft = Math.floor(
          document.scrollingElement.scrollLeft - ((document.scrollingElement.scrollLeft - targetScroll) / 3));
      }
      //console.log(document.scrollingElement.scrollLeft, targetScroll);
      if (document.scrollingElement.scrollLeft != targetScroll) {
        this.scrollToTargetTimer = setTimeout(this.scrollToTarget.bind(this), 10);
      } else {
        //temporary disable this feature:
        window.onresize = app.scrollToTarget.bind(app);
        document.body.onscroll = app.scrollToTarget.bind(app);
        /*
        var timer = null;
        document.body.onscroll = function(event){
          //console.log('scroll');
          if(app.scrollToTargetTimer !== null) {
              clearTimeout(app.scrollToTargetTimer);
          }
          if (timer !== null) {
              clearTimeout(timer);
          }
          timer = setTimeout(function() {
                var width = document.scrollingElement.offsetWidth;
                if (document.scrollingElement.scrollLeft < width) {
                  app.tabWallets();
                } else if (document.scrollingElement.scrollLeft < 2 * width) {
                  app.tabHistory();
                } else {
                  app.tabTools();
                }
          }, 50);
        };
        */
      }
    },

    setTabActive: function(n) {
      document.getElementById('swiper').classList.remove('tab0');
      document.getElementById('swiper').classList.remove('tab1');
      document.getElementById('swiper').classList.remove('tab2');
      document.getElementById('swiper').classList.add('tab' + n);

      for (var i = 0; i < document.getElementById('foot').children.length; i++) {
        if (i == n) {
          document.getElementById('foot').children[i].classList.add('active');
        } else {
          document.getElementById('foot').children[i].classList.remove('active');
        }
      }

    },
    tabWallets: function() {
      this.setTabActive(1);

      /*var width = document.scrollingElement.offsetWidth;
      document.body.onscroll = null;
      this.targetScroll = 1 / 2;
      this.scrollToTarget();*/
    },
    tabHistory: function() {
      this.setTabActive(0);
      /*
      this.targetScroll = 3 / 2;
      this.scrollToTarget();
      */
      this.reloadHistory();
    },
    tabTools: function() {
      this.setTabActive(2);
      /*
      var width = document.scrollingElement.offsetWidth;
      document.body.onscroll = null;
      this.targetScroll = 5 / 2;
      this.scrollToTarget();*/
    },
    reloadHistory: function() {
      Logger.getLogs(function(logs){
        document.getElementById('history').innerHTML = '';
        for (var i=0; i< logs.length; i++) {
          var li = document.createElement('li');
          li.classList.add('msg');
          li.classList.add(logs[i].severity);
          var html = logs[i].message;
          if ((typeof(html) == 'string') && ('coin' in logs[i]) && (logs[i].coin in allCoinApis) && ('explorerLinkTx' in allCoinApis[logs[i].coin])) {
            html = html.replace(/\<u\>\w+\<\/u\>/, function(match){
              var tx = match.substring(3, match.length-4);
              return '<a href="#" onclick="window.open(\'' + allCoinApis[logs[i].coin].explorerLinkTx(tx) + '\', \'_system\');">' + tx + '</a>';
            });
          }
          li.innerHTML = '<div class="ts">' + (new Date(logs[i].ts)).toUTCString()  + '</div><div>' + html + '</div>';
          //logs[i].coin
          document.getElementById('history').appendChild(li);
        }
        //console.log(logs);
      });
    },

    priceProvider: null,
    setPriceProvider: function(provider) {
      this.priceProvider = provider;
    },

    updateAllValues: function() {
      var totalOnline = 0;
      var totalOffline = 0;
      var orders = [];
      for (var key in app.wallets) {
        var walletOnline = app.wallets[key].updateOnlineValue();
        var walletOffline = app.wallets[key].updateOfflineValue();
        totalOnline += walletOnline;
        totalOffline += walletOffline;
        orders.push([key, walletOnline + walletOffline]);
      }
      orders.sort(function(a, b) {
          return a[1] - b[1];
      });
      for (var i = orders.length - 1; i >= 0; i--) {
          var row = app.wallets[orders[i][0]].row;
          row.parentNode.appendChild(row);
      }

      document.getElementById('grandTotal').innerHTML = formatMoney(totalOnline + totalOffline, app.priceProvider.getUnit());
      document.getElementById('totalOnline').innerHTML = formatMoney(totalOnline, app.priceProvider.getUnit());

    },

    updateMarketCap: function() {
      var that = this;
      var spinner = function(){
        document.getElementById('refresh').classList.toggle('spinning', that.spinning);
        if (that.spinning) {
          setTimeout(spinner, 1000);
        }
      };
      that.spinning = true;
      spinner();
      app.updateAllValues();
      this.priceProvider.updatePrices(function(){
        app.updateAllValues();
        app.spinning = false;
      });
    },

    menuOpened : false,

    toggleMenu: function() {
      if (this.menuOpened) {
        this.closeMenu();
      } else {
        this.openMenu();
      }
    },

    openMenu: function() {
      this.menuOpened = true;
      //this is calculated by js because of https://css-tricks.com/using-css-transitions-auto-dimensions/
      document.getElementById("menu").style.height = document.getElementById("menu").children[0].clientHeight + 'px';
      document.getElementById("overlay").classList.add('show');
      document.getElementById("container").classList.add('blur');
      document.getElementById("foot").classList.add('blur');
    },

    closeMenu: function() {
      this.menuOpened = false;
      document.getElementById("menu").style.height = '0';
      document.getElementById("overlay").classList.remove('show');
      document.getElementById("container").classList.remove('blur');
      document.getElementById("foot").classList.remove('blur');
    },

    showOneChildOf: function(parentId, childId) {
      var children = document.getElementById(parentId).childNodes;
      for (var c=0; c < children.length; c++) {
          if (children[c].nodeType != 3) {
            children[c].style.display = 'none';
          }
      }
      document.getElementById(childId).style.display = 'block';
    },

    setCurrentCoinIcon: function(img) {
      if (img) {
        var icons = document.getElementsByClassName("coinBig");
        for (var i = 0; i < icons.length; i++) {
            icons[i].src = img;
        }
      }
    },

    toggleAll: function(className, show) {
      var elements = document.getElementsByClassName(className);
      for (var i = 0; i < elements.length; i++) {
          elements[i].classList.toggle('hidden', !show);
      }
    },

    openForm: function(id, title, bgimg) {
      this.closeMenu();

      document.getElementById("container").classList.add('blur');
      document.getElementById("nav").classList.add('blur');
      document.getElementById("popupHead").classList.add('blur');
      document.getElementById("popupContent").classList.add('blur');

      document.getElementById('formPopup').classList.add('show');
      this.setCurrentCoinIcon(bgimg);
      this.showOneChildOf('formPopup', id);

    },

    openPopup: function(id, title, bgimg) {

      this.closeMenu();
      document.getElementById('popup').classList.add('show');

      this.setCurrentCoinIcon(bgimg);
      this.showOneChildOf('popupContent', id);

      document.getElementById('popupTitle').innerHTML = title;
      //document.getElementById('popupIcon').setAttribute('src', 'icons/' + icon + '.png');
    },

    closeForm: function() {
      document.getElementById("container").classList.remove('blur');
      document.getElementById("nav").classList.remove('blur');
      document.getElementById("popupHead").classList.remove('blur');
      document.getElementById("popupContent").classList.remove('blur');
      document.getElementById("formPopup").classList.remove('show');
    },

    closePopup: function() {
      document.getElementById("popup").classList.remove('show');
    },

    showExportPrivateKeyPopup: function(wallet) {
      app.authenticateBeforeContinue(
        'Export ' + wallet.handler.code + ' Private Key',
        'Are you sure you want to see your private key? It gives full access to your ' + wallet.handler.code + ' online wallet. '
        + 'Don\'t show it to any one. Don\'t take a screenshot.',
        function() {
          app.openForm('exportPrivateKeyPopup', wallet.handler.code + ' private key', 'coins/' + wallet.handler.icon + '.svg');
          document.getElementById('privateKeyValue').innerHTML = wallet.data.privateKey;
        }
      );
    },

    showImportPrivateKeyPopup: function(wallet) {
      app.openForm('importPrivateKeyPopup', 'import ' + wallet.handler.code + ' private key', 'coins/' + wallet.handler.icon + '.svg');
      app.importingWallet = wallet;
      document.getElementById('importPrivateKeyInput').value = '';
    },

    importPrivateKey: function(){
      var value = document.getElementById('importPrivateKeyInput').value
      //app.importingWallet
      //console.log(value);
      app.authenticateBeforeContinue(
        'Import ' + app.importingWallet.handler.code + ' Private Key',
        'Are You sure you want to import new private key? Current private key will be replaced. ' +
        'You might loose your funds if you havent make any backup.' ,
        function() {
          app.importingWallet.data.privateKey = value;
          app.importingWallet.data.addr = app.importingWallet.handler.addrFromPrivateKey(value);
          app.data.save();
          app.closeForm();
          app.importingWallet.refreshOnline();
        });
    },

    showExportKeysReminderIfRequired: function() {
      if (!this.settings.get('keyBackedUp', false)) {
        this.confirmBeforeContinue(
          'backup your keys',
          '<p>All your private keys are generated from a <b>12-word BIP39 phrase</b>. It is extremely important that you <b>backup</b> this phrase safely.</p>' +
          '<p>This reminder will keep showing up until you use <b>"backup wallets"</b> menu option.</p>',
          function(){}
        );
        return true;
      }
      return false;
    },

    exportAllKeys: function() {
      this.closeMenu();

      var mnemonicParts = app.data.wallets.bip39.mnemonic.split(' ');
      var mnemonicMessage = '<ol class="mnemonic">';
      for (var i =0; i<mnemonicParts.length; i++) {
        mnemonicMessage += '<li><span>' + mnemonicParts[i] + '</span></li>';
      }
      mnemonicMessage += '</ol>';

      app.authenticateBeforeContinue(
        'Backup Wallets',
        'On the next screen, you will see your 12-word BIP39 mnemonic passphrase. It might be used to recover your keys if you loose access to this device. <br/><ul>' +
        '<li>Don\'t show your mnemonic to anyone.</li>' +
        '<li>Do not take a screenshot.</li>' +
        '<li>Do not send it over unencrypted network.</li>' +
        '<li>Write it down and store in a secure location.</li></ul>',
        function() {
            app.confirmBeforeContinue(
              'your backup phrase',
              mnemonicMessage,
              function() {
                app.settings.set('keyBackedUp', true);
              },
              'backup&nbsp;made',
              'remind&nbsp;later'
            );
        }
      );
      //var text = JSON.stringify(app.data.wallets);
      //var url = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
      //cordova.plugins.clipboard.copy(text);
      //app.alertInfo('copied to clipboard');
    },

    importAllKeys: function() {
      this.closeMenu();
      var element = document.createElement('input');
      element.type = "file";
      document.body.appendChild(element);
      element.click();
      element.onchange = function(event){
        var fr = new FileReader();
        fr.onload = function(event) {
          alert(event.target.result);
        };
        fr.readAsText(event.target.files[0]);
        document.body.removeChild(element);
      };
    },

    removeCoin: function(wallet) {
      var key = wallet.handler.code;
      navigator.notification.confirm(
          'Are you sure you want to remove ' + key + ' coin? ' +
          '\nPrivate keys and offline wallets data will still be available in database and will be restored when you re-enable this coin.',
          function(buttonIndex) {
              if (buttonIndex == 1) {
                app.data.hideWallet(key, function(){
                  app.wallets[key].row.outerHTML = '';
                  delete app.wallets[key].row;
                  delete app.wallets[key];
                });
                app.closePopup();
              }
          },
          'Remove Coin',
          ['Remove','Cancel']
      );
    },

    createAdvancedOption: function(icon, text, callback) {
      var li = document.createElement('li');
      var button = document.createElement('button');
      var img = document.createElement("img");
      img.setAttribute('src', 'icons/' + icon + '.png');
      button.appendChild(img);
      button.appendChild(document.createTextNode(text));
      fastTap(button, callback);
      li.appendChild(button);
      return li;
    },
    doExchange: function() {
      var sellCoin = document.getElementById("exchangeSellCoin").value;
      var sellAmmount = app.wallets[sellCoin].handler.floatValueToSystemValue(parseFloat(document.getElementById("exchangeSellAmmount").value));
      var buyCoin = document.getElementById("exchangeBuyCoin").value;
      var fee = app.exchangeDefaultFees[sellCoin];
      var buyAmmount = document.getElementById("exchangeBuyAmmount").value;

      var displaySellAmount = app.wallets[sellCoin].handler.systemValueToDisplayValue(sellAmmount);
      changelly.createTransaction(
        sellCoin,
        buyCoin,
        app.wallets[sellCoin].handler.systemValueToFloatValue(sellAmmount),
        app.wallets[buyCoin].data.addr,
        function(ret){
          app.alertInfo('Changelly exchange id ' + ret.id + ' started.', sellCoin, ret);

          app.authenticateBeforeContinue(
            '<table class="transactionSummary">' +
            '<tr class="first"><td><img class="coinIcon" src="coins/' + app.wallets[sellCoin].handler.icon + '.svg"/></td><td><img style="width:65%" src="icons/sendglyph.png"/></td><td><img class="coinIcon" src="coins/' + app.wallets[buyCoin].handler.icon + '.svg"/></td></tr>' +
            '<tr class="second"><td>' + shortAmount(displaySellAmount, sellCoin, 13) + '</td><td></td><td>' + shortAmount(buyAmmount, buyCoin, 13) + '</td></tr>' +
            '</table>',
            '<table class="niceTable">' +
            '<tr><th colspan="2" style="width:26%;">changelly payinAddress:</th></tr><tr><td colspan="2">' + ret.payinAddress + '</td></tr>' +
            '<tr><th colspan="2">amount:</th></tr><tr><td style="width:50%;">' + displaySellAmount + ' ' + sellCoin + '</td><td>' + app.priceProvider.convert(app.wallets[sellCoin].handler.systemValueToFloatValue(sellAmmount), sellCoin) + '</td></tr>' +
            '<tr><th colspan="2">fee:</th></tr><tr><td>' + app.wallets[sellCoin].handler.getFeeDisplay(fee) + '</td><td>' + app.priceProvider.convert(app.wallets[sellCoin].handler.estimateFeeFloat(fee), sellCoin) + '</td></tr>' +
            '<tr><th colspan="2">estimated return:</th></tr><tr><td>' + (buyAmmount) + ' ' + buyCoin + '</td><td>' + app.priceProvider.convert(buyAmmount, buyCoin) + '</td></tr>' +
            '<tr><th colspan="2">changelly ID:</th></tr><tr><td colspan="2">' + ret.id + '</td></tr>' +
            '</table>'
            ,
            function(){
              app.wallets[sellCoin].handler.sendPayment(app.wallets[sellCoin].data.privateKey, ret.payinAddress, sellAmmount, fee);
              app.closePopup();
              setTimeout(function() { app.wallets[sellCoin].refreshOnline(); }, 2000);
              setTimeout(function() { app.alertInfo('Please refresh your ' + buyCoin + ' balance in few minutes.', buyCoin); }, 3000);
            }
          );
        }
      );
    },
    updateExchange: function() {
      var sellCoin = document.getElementById("exchangeSellCoin").value;
      var sellAmmount = document.getElementById("exchangeSellAmmount").value;
      var buyCoin = document.getElementById("exchangeBuyCoin").value;
      var fee = null;

      if (sellCoin) {
        if (sellCoin in app.exchangeDefaultFees) {
          fee = app.exchangeDefaultFees[sellCoin];
          document.getElementById("exchangeSellFee").textContent = app.wallets[sellCoin].handler.getFeeDisplay(fee);
        } else {
          document.getElementById("exchangeSellFee").textContent = 'pending...';
          var fees = app.wallets[sellCoin].handler.getFees(function(fees){
            app.exchangeDefaultFees[sellCoin] = fees[Math.floor((fees.length - 1) / 2)];
            app.updateExchange();
          });
        }
        //TODO system value
        document.getElementById("exchangeSellMax").textContent = app.wallets[sellCoin].data.balance - (fee === null ? 0 : app.wallets[sellCoin].handler.estimateFeeFloat(fee));
        document.getElementById("exchangeSellValue").innerHTML = app.priceProvider.convert(sellAmmount, sellCoin);
      } else {
        document.getElementById("exchangeSellMax").textContent = '';
        document.getElementById("exchangeSellValue").textContent = '';
        document.getElementById("exchangeSellFee").textContent = '';
      }

      var goodPair = sellCoin && buyCoin && (sellCoin != buyCoin);
      if (goodPair) {
        var minKey = sellCoin + '#' + buyCoin;
        if (minKey in app.exchangeMinAmmounts) {
          document.getElementById("exchangeSellMin").textContent = app.exchangeMinAmmounts[minKey];
        } else {
          document.getElementById("exchangeSellMin").textContent = '';
          changelly.getMinAmount(sellCoin, buyCoin, function(ret){
            app.exchangeMinAmmounts[minKey] = ret;
            document.getElementById("exchangeSellMin").textContent = app.exchangeMinAmmounts[minKey];
          });
        }
        /*changelly.getTransactions(buyCoin, app.wallets[buyCoin].data.addr, function(ret){
          console.log(ret);
        });*/
      } else {
        document.getElementById("exchangeSellMin").textContent = '';
      }

      if (goodPair && (sellAmmount > 0)) {
        changelly.getExchangeAmount(
          sellCoin,
          buyCoin,
          sellAmmount,
          function(ret){
            document.getElementById("exchangeBuyAmmount").value = ret;
            document.getElementById("exchangeBuyValue").innerHTML = app.priceProvider.convert(ret, buyCoin);
          }
        );
      } else {
        document.getElementById("exchangeBuyAmmount").value = 0;
        document.getElementById("exchangeBuyValue").textContent = '';
      }
      document.getElementById("exchangeButton").disabled = !(goodPair && (sellAmmount > 0) && (fee !== null));
    },

    getExchangeableCoins: function(callback) {
      changelly.getCurrencies(function(currencies){
        var ret = new Array();
        for (var i in currencies) {
          var key = currencies[i].toUpperCase();
          if (key in allCoinApis && 'sendPayment' in allCoinApis[key]) {
            ret.push(key);
          }
        }
        callback(ret);
      });
    },

    popupExchange: function(sellCoin, buyCoin) {
      this.exchangeDefaultFees = {};
      this.exchangeMinAmmounts = {};
      document.getElementById("exchangeSellAmmount").value = 0;
      this.openPopup('exchangePopup', 'Exchange');
      app.getExchangeableCoins(function(currencies){
        var available = {'':{'name': '- please select -'}};
        for (var i in currencies) {
          if (currencies[i] in app.wallets) {
            available[currencies[i]] = {'name': currencies[i]};
          }
        }
        (new Select(document.getElementById("exchangeSellCoin"))).setOptions(available, sellCoin);
        (new Select(document.getElementById("exchangeBuyCoin"))).setOptions(available, buyCoin);
        app.updateExchange();
      });
    },
    cancelSentViaMessage: function(coin, pk) {
      navigator.notification.confirm('Are you sure you want to CANCEL this? Recipients of message will no longer be able to redeem those coins.',
      function(){
        app.handleReceiveMessage(coin, pk);
      });
    },
    popupSendViaMessage: function() {
      this.openPopup('sendViaMessagePopup', 'Send via message');
      Logger.getLogs(function(logs){
        if (logs.length > 0){
          document.getElementById('sendViaMessageHistory').innerHTML = '';
          for (var i=0; i< logs.length; i++) {
            var tr = document.createElement('tr');
            var linkHtml = '<a href="#" onclick="app.cancelSentViaMessage(\'' + logs[i].data.coin + '\',\'' + logs[i].data.pk + '\');">CANCEL</a>';
            tr.innerHTML = '<td>' + (new Date(logs[i].ts)).toUTCString()  + '</td><td>'
            + logs[i].description + '</td><td>'
            + linkHtml +'</td>';
            document.getElementById('sendViaMessageHistory').appendChild(tr);
          }
        }
      }, 'sendasmessage');
      //coin shortcuts
      document.getElementById('sendViaMessageButtons').innerHTML = '';
      var empty = true;
      for (var coin in app.wallets){
        if (app.canSendViaMessage(app.wallets[coin].handler)) {
          if (app.wallets[coin].data.balance != 0 ) {
            empty = false;
            document.getElementById('sendViaMessageButtons').appendChild(new CoinButton(
              app.wallets[coin].handler,
              false,
              function(coin){
                app.popupSendSocial(app.wallets[coin.code]);
              }
            ));
          }
        }
      }
      if (empty) {
        document.getElementById('sendViaMessageButtons').innerHTML = 'You have no coins that can be sent via message.';
      }
    },
    canSendViaMessage: function(handler) {
      return ('newRandomPrivateKey' in handler) && (!('feeCoin' in handler));
    },
    popupCoinInfo: function(wallet) {
      this.openPopup('coinInfoPopup', wallet.handler.longname, 'coins/' + wallet.handler.icon + '.svg');
      var links = '<ul>';
      for (var name in wallet.handler.links) {
        links += '<li><a href="#" onclick="window.open(\'' + wallet.handler.links[name] + '\', \'_system\');">' + name + '</a></li>';
      }
      links += '</ul>';

      var advanced = document.createElement('ul');
      advanced.classList.add('advancedActions');
      var advancedWallet = wallet;

      if (app.canSendViaMessage(wallet.handler)) {
        advanced.appendChild(app.createAdvancedOption('message', 'send via message', function(){
          app.popupSendSocial(wallet);
        }));
      }

      if ('exchangeableCoinsCache' in app && (app.exchangeableCoinsCache.indexOf(wallet.handler.code) != -1)) {
        advanced.appendChild(app.createAdvancedOption('sell', 'sell coin', function(){
          app.popupExchange(wallet.handler.code, null);
        }));
        advanced.appendChild(app.createAdvancedOption('buy', 'buy coin', function(){
          app.popupExchange(null, wallet.handler.code);
        }));
      }

      if ('explorerLinkAddr' in wallet.handler) {
        advanced.appendChild(app.createAdvancedOption('link', 'explore history (external)', function(){
          window.open(wallet.handler.explorerLinkAddr(wallet.data.addr), '_system');
        }));
      }

      if ('sendPayment' in wallet.handler) {
        advanced.appendChild(app.createAdvancedOption('send', 'send all', function(){
          app.popupSendPayment(wallet, wallet.data.systemBalance);
        }));
      }


      //advanced.appendChild(app.createAdvancedOption('send', 'export private key', app.showExportPrivateKeyPopup.bind(app, advancedWallet)));
      //advanced.appendChild(app.createAdvancedOption('receive', 'import private key', app.showImportPrivateKeyPopup.bind(app, advancedWallet)));


      if (wallet.totalOffline + wallet.totalOnline <= 0) {
        advanced.appendChild(app.createAdvancedOption('remove', 'remove coin', app.removeCoin.bind(app, advancedWallet)));
      }

      //var coffeeSupport = ;
      var support = ('sendPayment' in wallet.handler) ?
      'Local wallet is supported for this coin. Your public address (generated from your BIP39 mnemonic) is:' +
      '<div style="width: 20%; padding: 5%; margin: 0 auto;">' + getCoinAddrIcon(wallet.handler, wallet.data.addr).outerHTML + '</div>'
      + '<strong>' + wallet.data.addr + '</strong>'
      : 'No support for local wallet for this coin.';

      document.getElementById('coinInfoDescription').innerHTML =
        '<h2>' + wallet.handler.longname + ' (' + wallet.handler.code + ')</h2>' +
        wallet.handler.description +
        '<div class="spacing stitch"></div>' +
        '<h3>links (external)</h3>' +
        links +
        '<h3>coffee wallet</h3>' + support;

      if (advanced.children.length > 0) {
          document.getElementById('coinInfoDescription').insertAdjacentHTML('beforeend','<h3>advanced options:</h3>');
          document.getElementById('coinInfoDescription').append(advanced);
      }
    },

    filterAddCoinPopup: function() {
      var query = document.getElementById('addCoinFilter').value.toUpperCase();
      //var onlySupportedRead = document.getElementById('addCoinOnlySupportedRead').checked;
      var includeTestCoins = (app.settings.get('enableTestCoins', false) == "true");
      var onlySupportedWrite = document.getElementById('addCoinOnlySupportedWrite').checked;
      var limit = 24;
      var allCoins = document.getElementById('allCoins');
      while (allCoins.firstChild) { allCoins.removeChild(allCoins.firstChild); }

      for (var i=0; i< allCoinApisByRank.length; i++){
        var coin = allCoinApisByRank[i];
        var show = coin._search.search(query) != -1;
        //if (onlySupportedRead) show = show && ('getBalance' in coin);
        if (onlySupportedWrite) show = show && ('sendPayment' in coin);
        if (!includeTestCoins) show = show && (!('testCoin' in coin) || (!coin.testCoin));
        if (show) {
          limit --;
          if (limit >= 0) {
            if (!('_button' in coin)) {
              allCoinApisByRank[i]._button = new CoinButton(
                coin,
                coin.code in app.data.wallets && app.data.wallets[coin.code].enabled,
                function(coin){
                  app.addOrActivateCoin(coin.code, function(){
                    coin._button.classList.add('active');
                  });
                  app.closePopup();
                });
            }
            allCoins.appendChild(coin._button);
          }
        }
      }
      if (limit == 24) {
        document.getElementById('moreCoins').innerHTML = 'No coins found for given query.';
      } else if (limit >= 0) {
        document.getElementById('moreCoins').innerHTML = '';
      } else {
        document.getElementById('moreCoins').innerHTML = '' + -limit + ' more coins matches.<br/> Please enter more specific query.';
      };
    },

    popupAddCoin: function() {
      this.openPopup('addCoinPopup', 'add cryptos');
      setTimeout(function(){
        if (typeof app.popupGenerated == 'undefined') {
          app.popupGenerated = true;
          document.getElementById('addCoinFilter').onkeyup = app.filterAddCoinPopup;
          document.getElementById('addCoinFilter').onchange = app.filterAddCoinPopup;
          //document.getElementById('addCoinOnlySupportedRead').onchange = app.filterAddCoinPopup;
          document.getElementById('addCoinOnlySupportedWrite').onchange = app.filterAddCoinPopup;
          for (var i=0; i< allCoinApisByRank.length; i++) {
            allCoinApisByRank[i]._search = (allCoinApisByRank[i].name + ' '+ allCoinApisByRank[i].code + ' ' + allCoinApisByRank[i].longname).toUpperCase();
          }
        }
        app.filterAddCoinPopup();
      }, 100);
    },

    popupHelp: function() {
        this.openPopup('helpPopup', 'Help');
    },
    popupFeedback: function() {
        this.openPopup('feedbackPopup', 'Feedback');
    },

    popupPriceSettings: function() {
        this.openPopup('priceSettingsPopup', 'Settings');

        this.priceProviderSelect.setValue(this.settings.get('priceProvider', 0));
        this.priceUnitSelect.setValue(this.settings.get('priceUnit', this.priceProvider.defaultUnit));

        document.getElementById('settingsEnableTestCoins').checked = (this.settings.get('enableTestCoins', false) == "true");

    },
    savePriceSettings: function() {
        this.closePopup();

        this.settings.set('enableTestCoins', document.getElementById('settingsEnableTestCoins').checked);

        this.settings.set('priceProvider', parseInt(this.priceProviderSelect.getValue()));
        this.setPriceProvider(allPriceProviders[this.settings.get('priceProvider')]);

        this.settings.set('priceUnit', this.priceUnitSelect.getValue());
        this.priceProvider.setUnit(this.settings.get('priceUnit'));

        this.updateMarketCap();
    },
    handleAnyQRCode: function(addr, args) {

      if ('escrowPrivateKey' in args) {
        return app.handleReceiveMessage(args.coinCode, args.escrowPrivateKey);
      }

      if (!args.coin) {
        this.alertError('unknown code');
        return;
      }

      this.alertInfo('detected ' + args.coin + ' address');
      for (var key in this.wallets) {
        if (this.wallets[key].handler.name == args.coin) {
          if ('sendPayment' in this.wallets[key].handler) {
            this.popupSendPayment(this.wallets[key]);
            this.pasteToSendForm(addr, args);
          } else {
            this.alertError('coin ' + args.coin + ' is not yet supported');
          }
          return;
        }
      }
      this.alertInfo('coin ' + args.coin + ' is not in your active wallets or is unknown');
    },

    pasteToSendForm: function(addr, args) {
      if (args.coin) {
        if (this.sendWallet.handler.name != args.coin) {
          this.alertInfo('Warning: This seems like a ' + args.coin + ' address but you are sending ' + this.sendWallet.handler.name + '!');
        }
      }
      document.getElementById('sendCoinAddr').value = addr;
      app.validateAddr('sendCoinAddr');

      if ('amount' in args && args.amount){
        document.getElementById('sendCoinAmount').value = parseFloat(args.amount);
        app.sendCoinUpdateValue();
        app.sendCoinValidateAmount();
      }
    },
    _parseTransactionText: function(text, callback) {
      if (text.startsWith('coffee:')) {
        var parts = text.split('/');
        if (parts.length != 4 || parts[0] != 'coffee:') {
          app.alertError('unknown format');
          return;
        }
        return callback(null, {
          coinCode : parts[2],
          escrowPrivateKey : parts[3]
        });
      }

      //check if text is a plain address or transaction info:
      //https://github.com/bitcoin/bips/blob/master/bip-0021.mediawiki#Simpler syntax
      var a = text.split('?', 2);
      var argsStr = (a.length > 1) ? a[1] : '';
      var addr = a[0];

      var args = {};

      var b = addr.split(':', 2);
      if (b.length >1) {
        args.coin = b[0];
        addr = b[1];
      }

      argsStr.split('&').forEach(function(e){
        var kp = e.split('=', 2);
        if (kp.length>1) args[kp[0]] = kp[1];
      });
      if ('r' in args) {
        app.alertInfo('BIP72 address found. quering for payment details...');

        var oReq = new XMLHttpRequest();
        oReq.open("GET", args.r);
        oReq.addEventListener("load", function(){
          var paymentRequest = JSON.parse(this.responseText);
          //console.log(paymentRequest);
          var coin = 'unknown';
          if (paymentRequest.currency == 'BTC' && paymentRequest.network == 'main') coin = 'bitcoin';
          if (paymentRequest.currency == 'BTC' && paymentRequest.network == 'test') coin = 'bitcoin-test';
          if (paymentRequest.currency == 'BCH' && paymentRequest.network == 'main') coin = 'bitcoin-cash';

          if (paymentRequest.outputs.length != 1) {
            app.alertError('payment requests with multiple outputs are not supported. sorry.');
          } else {
            callback(paymentRequest.outputs[0].address, {'coin': coin, 'amount': paymentRequest.outputs[0].amount / 100000000});
          }
        });
        oReq.setRequestHeader('Accept', 'application/payment-request');
        //oReq.setRequestHeader('Accept', 'application/bitcoin-paymentrequest');
        oReq.send();
      } else {
        callback(addr, args);
      }
    },
    pasteClipboard: function(callback) {
      var that = this;
      cordova.plugins.clipboard.paste(function(text){
        that._parseTransactionText(text, callback);
      });
    },
    scanQrCode: function(callback) {
      window.cordova.plugins.barcodeScanner.scan(
           function (result) {
             if (!result.canceled) {
               app._parseTransactionText(result.text, callback);
             }
          },
         function (error) {
             app.alertError("QR scan failed: " + error);
         },
         {
             preferFrontCamera : false, // iOS and Android
             showFlipCameraButton : true, // iOS and Android
             showTorchButton : true, // iOS and Android
             torchOn: true, // Android, launch with the torch switched on (if available)
             prompt : "Place addres or transaction barcode inside the scan area", // Android
         }
      );
    },

    popupOfflineAssets: function(wallet, idToUpdate) {

      document.getElementById('offlineAssets').innerHTML = '';
      for (var i=0; i<wallet.offlineWallets.length; i++) {
        var a = new Asset(wallet, i + 1, wallet.offlineWallets[i]);
        document.getElementById('offlineAssets').appendChild(a.row);
        if (typeof idToUpdate != 'undefined' && idToUpdate == i + 1) {
          a.refreshBalance();
        }
      }

      this.openPopup('offlineAssetsPopup', wallet.handler.code + ' assets', 'coins/' + wallet.handler.icon + '.svg');
      document.getElementById('addAddressButton').classList.toggle('hidden', !('getBalance' in wallet.handler));
      document.getElementById('newAddressButton').classList.toggle('hidden', !('newRandomPrivateKey' in wallet.handler));
      this.offlineAssetWallet = wallet;
    },

    pasteToField: function(field, addr, args) {
      document.getElementById(field).value = addr;
    },

    popupEditOfflineAsset: function(asset) {
      document.getElementById('addOfflineAssetAddr').value = asset.data.addr;
      app.validateAddr('addOfflineAssetAddr', true);

      document.getElementById('addOfflineAssetBalance').value = asset.data.balance;
      document.getElementById('addOfflineAssetComment').value = asset.data.comment;
      document.getElementById('addOfflineAssetAddrDiv').classList.toggle('hidden', asset.data.addr ? false : true);
      document.getElementById('addOfflineAssetBalanceDiv').classList.toggle('hidden', asset.data.addr);


      document.getElementById('addOfflineAssetPopupSave').innerHTML = 'save';
      this.editAsset = true;
      this.openForm('addOfflineAssetPopup', 'edit ' + asset.wallet.handler.code + ' asset', 'coins/' + app.offlineAssetWallet.handler.icon + '.svg');
    },

    popupAddOfflineAsset: function(type, value) {
      document.getElementById('addOfflineAssetAddr').value = (type == 'addr' ? value : '');
      app.validateAddr('addOfflineAssetAddr', true);

      document.getElementById('addOfflineAssetBalance').value = (type == 'balance' ? value : '');
      document.getElementById('addOfflineAssetComment').value = '';
      document.getElementById('addOfflineAssetAddrDiv').classList.toggle('hidden', type == 'balance');
      document.getElementById('addOfflineAssetBalanceDiv').classList.toggle('hidden', type == 'addr');

      document.getElementById('addOfflineAssetPopupSave').innerHTML = 'add';
      this.editAsset = false;
      this.openForm('addOfflineAssetPopup', 'add ' + this.offlineAssetWallet.handler.code + ' asset', 'coins/' + app.offlineAssetWallet.handler.icon + '.svg');
    },

    popupAddNewAddress: function() {

      var coinCode = app.offlineAssetWallet.handler.code;
      var coinName = app.offlineAssetWallet.handler.name;
      var randomPriv = app.offlineAssetWallet.handler.newRandomPrivateKey();
      var randomAddr = app.offlineAssetWallet.handler.addrFromPrivateKey(randomPriv);
      var randomPrivImg = this.generatePngWithQRCode(randomPriv, 350);
      var randomAddrImg = this.generatePngWithQRCode(coinName + ':' + randomAddr, 280);

      var html = '<html><h1>' + coinCode + ' wallet</h1>' +
        '<div style="text-align:right;"><h2>public key (address)</h2><img src="' + randomAddrImg + '"><h3>' + coinName + ':' + randomAddr + '</h3></div>'+
        '<hr/>' +
        '<h2>private key (secret)</h2><img src="' + randomPrivImg + '"><h3>' + randomPriv + '</h3>'+
        '<div style="position:absolute; bottom:0; right:0; text-align:right;">Share the public key to accept coins. <br/>Keep private key secret and safe. It allows your coins to be spent. <br/>Generated by Coffee Wallet ' + window.version + '</div>'+
        '</html>';

      function proceed(){
        app.data.addOfflineAsset(app.offlineAssetWallet.handler.code, {
          addr: randomAddr,
          balance: 0.0,
          systemBalance: 0,
          comment: 'paper wallet'
        });
        //refresh list
        app.popupOfflineAssets(app.offlineAssetWallet);
        app.confirmBeforeContinue('wallet created',
          '<strong>warning:</strong> Coffee Wallet <strong>does not</strong> store private keys for offlie assets! ' +
          'You should see pdf share/print options now, use this address <strong>only</strong> after making the pdf secure. ' +
          'You will be able to spend funds from this wallet as long as you will have access to its private key!',
          function(){}
        );
      }
      if (device.platform == 'browser') {
        //TODO print pdf in browser build
        console.log('priv:' + randomPriv);
        console.log('addr:' + randomAddr);
        console.log(html);
        app.alertInfo('wallet info printed to console');
        proceed();
      } else {
        pdf.fromData(html, {
              documentSize: 'A4',
              type: 'share',
              fileName: coinCode + '-wallet'
          })
          .then(function(stats){
            proceed();
          })
          .catch(function(err) {app.alertError('error generating pdf wallet ' + err)});
      }
    },

    saveOfflineAsset: function(){
      var data = {
        addr: document.getElementById('addOfflineAssetAddr').value,
        balance: parseFloat(document.getElementById('addOfflineAssetBalance').value) || 0.0,
        comment: document.getElementById('addOfflineAssetComment').value
      }

      if (!document.getElementById('addOfflineAssetAddrDiv').classList.contains('hidden')){
        if (!app.validateAddr('addOfflineAssetAddr')) {
          return false;
        }
      }
      var idToUpdate = 0;
      if (this.editAsset) {
        idToUpdate = activeAsset.id;
        this.data.updateOfflineAsset(activeAsset.wallet.handler.code, activeAsset.id, data);
      } else {
        idToUpdate = this.data.addOfflineAsset(this.offlineAssetWallet.handler.code, data);
      }
      this.closeForm();
      this.popupOfflineAssets(this.offlineAssetWallet, idToUpdate);
    },

    popupSendSocial: function(wallet) {
        this.popupSendPayment(wallet);
        this.toggleAll('normalSend', false);
        this.toggleAll('socialSend', true);
    },

    popupSendPayment: function(wallet, forceTotal) {
        app.openForm('sendPaymentPopup', 'send ' + wallet.handler.code, 'coins/' + wallet.handler.icon + '.svg');

        app.toggleAll('normalSend', true);
        app.toggleAll('socialSend', false);

        document.getElementById('sendCoinAddr').value = '';
        document.getElementById('sendCoinValue').value = '';

        //disable value edit for coins with no value
        document.getElementById('sendCoinValue').disabled = (this.priceProvider.getPrice(wallet.handler.code) == 0);
        document.getElementById('sendCoinAmount').value = '';
        document.getElementById('sendCoinAmount').readOnly = false;
        document.getElementById('sendCoinValue').readOnly = false;
        app.sendForceTotal = (typeof forceTotal == 'undefined') ? null : forceTotal;

        app.validateAddr('sendCoinAddr', true);
        app.sendCoinValidateAmount(true);

        document.getElementById('sendCoinName').innerHTML = wallet.handler.code;
        document.getElementById('sendFiatName').innerHTML = app.priceProvider.getUnit();
        app.sendWallet = wallet;

        app.sendFees = [];
        document.getElementById('sendCoinFee').rangeSlider.update({min: 0, max: 0, value: 0});
        app.sendCoinUpdateFee();

        if (app.sendForceTotal) {
          document.getElementById('sendCoinAmount').readOnly = true;
          document.getElementById('sendCoinValue').readOnly = true;
          document.getElementById('sendCoinAmount').value = app.sendWallet.handler.systemValueToDisplayValue(app.sendForceTotal);
          app.sendCoinUpdateValue();
          app.sendCoinValidateAmount();
        }

        wallet.handler.getFees(function(fees){
          document.getElementById('sendCoinFee').rangeSlider.update({min: 0, max: fees.length - 1, value: Math.floor((fees.length - 1) / 2)})
          app.sendFees = fees;
          app.sendCoinUpdateFee();
        });
    },

    validateAddr: function(element, focus) {
      var valid = false;
      var elem = document.getElementById(element);
      elem.parentElement.classList.remove('invalid');
      elem.parentElement.classList.remove('valid');
      elem.parentElement.lastElementChild.innerHTML = '';

      elem.parentElement.classList.toggle('filled', elem.value != '' || elem == document.activeElement);

      if (typeof focus == 'undefined') {

        valid = (element == 'addOfflineAssetAddr' ? app.offlineAssetWallet : this.sendWallet).handler.validateAddress(elem.value);

        elem.parentElement.classList.add(valid ? 'valid' : 'invalid');
        if (!valid) {
          elem.parentElement.lastElementChild.innerHTML = 'invalid address';
        }
      }
      return valid;
    },

    sendCoinValidateAmount: function(focus) {
      var valid = false;
      var amountElem = document.getElementById('sendCoinAmount');
      var valueElem = document.getElementById('sendCoinValue');
      valueElem.parentElement.lastElementChild.innerHTML = '';

      amountElem.parentElement.classList.remove('invalid');
      amountElem.parentElement.classList.remove('valid');
      valueElem.parentElement.classList.remove('invalid');
      valueElem.parentElement.classList.remove('valid');

      amountElem.parentElement.classList.toggle('filled', amountElem.value != '' || amountElem == document.activeElement || valueElem == document.activeElement);
      valueElem.parentElement.classList.toggle('filled', valueElem.value != '' || amountElem == document.activeElement || valueElem == document.activeElement);

      if (typeof focus == 'undefined') {
        valid = parseFloat(amountElem.value) > 0;
        amountElem.parentElement.classList.add(valid ? 'valid' : 'invalid');
        valueElem.parentElement.classList.add(valid ? 'valid' : 'invalid');
        if (!valid) {
          valueElem.parentElement.lastElementChild.innerHTML = 'invalid amount';
        }
      }
      return valid;

      //document.getElementById('sendCoinAmount').value = '';

    },

    sendCoinValidateFee: function() {
      if (this.sendFees && (document.getElementById('sendCoinFee').value in this.sendFees)) {
        return true;
      } else {
        app.alertError('please wait for fees update');
        return false;
      }
    },

    sendCoinUpdateFee: function(){
      if (this.sendFees && (document.getElementById('sendCoinFee').value in this.sendFees)) {
        var fee = this.sendFees[document.getElementById('sendCoinFee').value];
        if (app.sendForceTotal) {
          if ('feeCoin' in this.sendWallet.handler) {
            document.getElementById('sendCoinAmount').value = this.sendWallet.handler.systemValueToDisplayValue(
              app.sendForceTotal
            );
          } else {
            document.getElementById('sendCoinAmount').value = this.sendWallet.handler.systemValueToDisplayValue(
              this.sendWallet.handler.systemValuesDiff(app.sendForceTotal, this.sendWallet.handler.getFeeTotalCost(fee))
            );
          }
          app.sendCoinUpdateValue();
          app.sendCoinValidateAmount();
        }
        document.getElementById('feeAmount').innerHTML =
          this.sendWallet.handler.getFeeDisplay(fee) + '&nbsp;(' +
          this.priceProvider.convert(this.sendWallet.handler.estimateFeeFloat(fee), this.sendWallet.handler.code) + ')';
        document.getElementById('feeTime').innerHTML = fee[1] + 'min';
      } else {
        document.getElementById('feeAmount').innerHTML = 'unknown';
        document.getElementById('feeTime').innerHTML = 'unknown';
      }
    },

    sendCoinUpdateValue: function() {
      var src = document.getElementById('sendCoinAmount').value;
      document.getElementById('sendCoinValue').value =
        src == '' ? '' : (src * this.priceProvider.getPrice(this.sendWallet.handler.code));
    },

    sendCoinUpdateAmount: function() {
      var src = document.getElementById('sendCoinValue').value
      document.getElementById('sendCoinAmount').value =
         src == '' ? src : src / this.priceProvider.getPrice(this.sendWallet.handler.code);
    },
    alertError: function(html, coin, debug) {
      this._alertMessage(html, coin, 'error');
    },
    alertInfo: function(html, coin, debug) {
      this._alertMessage(html, coin, 'info');
    },
    alertSuccess: function(html, coin, debug) {
      this._alertMessage(html, coin, 'success');
    },

    _alertMessage: function(html, coin, type, debug) {
      Logger.log(type, coin, html, debug);
      this._alertMessagePopup(type, html);
    },

    _alertMessagePopup: function(type, html) {
      var msgDiv = document.createElement('div');
      msgDiv.classList.add('msg');
      msgDiv.classList.add(type);
      msgDiv.innerHTML = html;

      var closer = document.createElement("a");
      closer.classList.add('closer');
      var img = document.createElement("img");
      img.setAttribute('src', 'icons/close.png');
      closer.appendChild(img);
      fastTap(closer, function(){ document.getElementById('messages').removeChild(msgDiv); msgDiv = null; });

      msgDiv.appendChild(closer);
      document.getElementById('messages').appendChild(msgDiv);
      setTimeout(function(){ msgDiv && msgDiv.classList.add('fadingout'); }, 5000);
      setTimeout(function(){ msgDiv && document.getElementById('messages').removeChild(msgDiv); }, 7000);
    },

    _alertJsError: function(html) {
      this._alertMessagePopup('error', html);
    },

    cancelAuth: function() {
      document.getElementById('lockPopup').classList.add('hidden');
      this.onAuthCallback = null;
      this.onConfirmCallback = null;
    },
    confirmAuth: function() {
      document.getElementById('lockPopup').classList.add('hidden');
      if (this.onConfirmCallback != null) {
        var tmp = this.onConfirmCallback;
        this.onConfirmCallback = null;
        tmp();
      } else {
        var tmp = this.onAuthCallback;
        this.onAuthCallback = null;
        switch (device.platform) {
          case "Android":
            FingerprintAuth.isAvailable(function(){
              FingerprintAuth.encrypt(
                {
                  clientId: "coffee",
                  username: "user",
                  password: "__dummy"
                },
                function(){
                  app.alertSuccess("auth successfull");
                  tmp();
                }, function(err){
                  app.alertError("auth error: " + err);
                }
              );
            }, function(){
              tmp();
            });
            break;
          case "iOS":
            window.plugins.touchid.isAvailable(function(){
              window.plugins.touchid.verifyFingerprintWithCustomPasswordFallback(
                "Scan your fingerprint to confirm",
                function(){
                  app.alertSuccess("auth successfull");
                  tmp();
                }, function(err){
                  app.alertError("auth error: " + JSON.stringify(err));
                }
              );
            }, function(){
              tmp();
            });
            break;
          default:
            tmp();
            break;
        }
      }
    },
    authenticateBeforeContinue: function(title, message, callback) {
      this.onAuthCallback = callback;
      this.onConfirmCallback = null;
      document.getElementById('lockPopup').classList.remove('hidden');
      document.getElementById('lockPopupCancel').classList.remove('hidden');
      document.getElementById('lockPopupConfirmText').innerHTML = 'confirm';
      document.getElementById('lockPopupCancelText').innerHTML = 'cancel';
      document.getElementById('lockTitle').innerHTML = title;
      document.getElementById('lockMessage').innerHTML = message; // + '<br/>If your device supports fingerprint/face scanner you will be asked to authenticate.';
    },

    confirmBeforeContinue: function(title, message, callback, confirmText, cancelText) {
      this.onAuthCallback = null;
      this.onConfirmCallback = callback;
      document.getElementById('lockPopup').classList.remove('hidden');
      document.getElementById('lockPopupCancel').classList.toggle('hidden', typeof cancelText == 'undefined');
      document.getElementById('lockPopupConfirmText').innerHTML = (typeof confirmText != 'undefined') ? confirmText : 'confirm';
      document.getElementById('lockPopupCancelText').innerHTML = (typeof cancelText != 'undefined') ? cancelText : 'cancel';
      document.getElementById('lockTitle').innerHTML = title;
      document.getElementById('lockMessage').innerHTML = message;
    },

    generatePngWithQRCode: function(text, size) {
      var tmpElement = document.createElement('div');
      var qrcode = new QRCode(tmpElement, {
      	text: text,
      	width: size,
      	height: size,
      	colorDark : "#000000",
      	colorLight : "#ffffff"
      });
      return qrcode._oDrawing._elCanvas.toDataURL("image/png");
    },

    sendSocialPaymentCommit: function(coin, amount, fee) {

      var tmpPrivateKey = app.sendWallet.handler.newRandomPrivateKey();
      var tmpAddr = app.sendWallet.handler.addrFromPrivateKey(tmpPrivateKey);

      var receiveLink = coin + '/' + tmpPrivateKey; //'coffee://' +

      var displayAmount = app.sendWallet.handler.systemValueToDisplayValue(amount);

      var subject = displayAmount + ' ' + coin + ' for you!';
      var message = subject + '\n' +
        'To receive ' + displayAmount + ' ' + coin + ' go to:\n' +
        'https://wallet.coffee/receive#' + receiveLink;


      Logger.logTransaction('sendasmessage', 'sent ' + displayAmount + ' ' + coin + ' as message', {coin:coin, pk:tmpPrivateKey});

      app.alertInfo('Sending to blockchain escrow...');
      app.sendWallet.handler.sendPayment(app.sendWallet.data.privateKey, tmpAddr, amount, fee);
      app.closeForm();

      if (device.platform == 'browser') {
        app.alertInfo('share code printed to console');
        console.log(message);
        return;
      }
      window.plugins.socialsharing.shareWithOptions({
        message: message, // not supported on some apps (Facebook, Instagram)
        subject: subject, // fi. for email
        //url: url,
        //files: [this.generatePngWithQRCode(url, 256)],
        chooserTitle: 'Send via'
      }, function(result) {
        app.alertInfo('Done. Recipient will now be able to withdraw this transfer.');
        //result.completed // On Android apps mostly return false even while it's true
        //result.app // On Android result.app is currently empty. On iOS it's empty when sharing is cancelled (result.completed=false)
      }, function(msg) {
        app.alertError('Sharing failed with message: ' + msg);
      });
    },
    sendSocialPayment: function() {

      if (!(this.sendCoinValidateAmount() && this.sendCoinValidateFee())) {
        return;
      }

      var coin = this.sendWallet.handler.code;
      var fee = this.sendFees[document.getElementById('sendCoinFee').value];
      var amount = this.sendWallet.handler.floatValueToSystemValue(parseFloat(document.getElementById('sendCoinAmount').value));
      var displayAmount = app.sendWallet.handler.systemValueToDisplayValue(amount);

      this.confirmBeforeContinue(
        'Warning!',
        '<p>"Send via message" feature is designed only to send <b>tiny ammounts</b> beetween two <b>trusted</b> parties when the receiver does not have a wallet yet.</p>' +
        '<p>It is as safe as the sending medium is. For example, if you are sending via email, everyone that has access to contents of this email (including sender) will be able to withdraw money before the recipient.</p>' +
        '<ul>' +
        '<li>Send only tiny ammounts.</li>' +
        '<li>Advise the recipient to withdraw ASAP.</li>' +
        '<li>Send over encrypted medium if possible.</li>' +
        '<li>Advise the recipient to use regular transfers hereafter.</li>' +
        '</ul>'
        ,
        function(){
          app.authenticateBeforeContinue(
            '<table class="transactionSummary">' +
            '<tr class="first"><td><img class="coinIcon" src="coins/' + app.sendWallet.handler.icon + '.svg"/></td><td><img style="width:65%" src="icons/sendglyph.png"/></td><td><img style="width:100%" src="icons/messageglyph.png"/></td></tr>' +
            '<tr class="second"><td>' + shortAmount(displayAmount, coin, 13) + '</td><td></td><td></td></tr>' +
            '</table>',
            '<table class="niceTable">' +
            '<tr><th colspan="2">amount:</th></tr><tr><td style="width:50%;">' + displayAmount + ' ' + coin + '</td><td>' + app.priceProvider.convert(app.sendWallet.handler.systemValueToFloatValue(amount), coin) + '</td></tr>' +
            '<tr><th colspan="2">fee:</th></tr><tr><td>' + app.sendWallet.handler.getFeeDisplay(fee) + '</td><td>' + app.priceProvider.convert(app.sendWallet.handler.estimateFeeFloat(fee), coin) + '</td></tr>' +
            '</table>' +
            '<p>You will see your device share dialog in next step and will be able to select send medium.</p>'
            ,
            function(){
              app.sendSocialPaymentCommit(coin, amount, fee);
            }
          );
        }
      );
    },

    addOrActivateCoin: function(code, callback) {
      if (code in app.data.wallets && app.data.wallets[code].enabled) {
        app.wallets[code].setActive();
        callback();
      } else if (code in allCoinApis) {
        app.data.addWallet(allCoinApis[code], function(){
          if (app.data.wallets[code].enabled) {
            app.addWalletWidget(app.data.wallets[code]);
            app.wallets[code].setActive();
            callback();
          }
        });
      } else {
        app.alertError('unknown coin ' + coin);
      }
    },
    handleReceiveMessage: function(coin, privateKey) {
      this.addOrActivateCoin(coin, function(){
        var tmpAddr = app.wallets[coin].handler.addrFromPrivateKey(privateKey);
        app.wallets[coin].handler.getBalance(tmpAddr, function(balance, unconfirmed){
          var total = balance;
          if (total > 0) {
            app.alertInfo('Trying to transfer ' + app.wallets[coin].handler.systemValueToDisplayValue(total) + ' ' + coin + ' from escrow');
            if (unconfirmed > 0) {
              app.alertInfo('Warning: escrow transaction is not yet confirmed.');
            }

            setTimeout(function() {
              var fees = app.wallets[coin].handler.getFees(function(fees){
                app.alertInfo('updated fees');
                var defaultFee = fees[Math.floor((fees.length - 1) / 2)];
                setTimeout(function() {
                  app.wallets[coin].handler.sendPayment(
                    privateKey,
                    app.wallets[coin].data.addr,
                    app.wallets[coin].handler.systemValuesDiff(total, app.wallets[coin].handler.getFeeTotalCost(defaultFee)),
                    defaultFee
                  );
                  //TODO this is a temporary hack before the update loop/queue
                  for (var i=1; i<10; i++) {
                    setTimeout(function() { app.wallets[coin].refreshOnline(); }, 5000 * i * i);
                  }
                }, 1000);
              });
            }, 1000);

          } else {
            //TODO check by txses if this is empty or already withdrawn
            app.alertInfo('Escrow balance is empty. If this is a fresh transfer please try again in a minute.');
          }
        });
      });
    },

    handleUrlOpened: function(url) {
      var parts = url.split('/');
      if (parts.length != 4 || parts[0] != 'coffee:') {
        app.alertError('unknown url format');
        return;
      }
      app.handleReceiveMessage(parts[2], parts[3]);
    },

    onDataLoaded: function(callback) {
      if (typeof callback == 'undefined') {
        app.dataLoaded = true;
        if ('onDataLoadedCallback' in app) {
          app.onDataLoadedCallback();
        }
      } else {
        //TODO chain:
        if ('dataLoaded' in app && app.dataLoaded == true) {
          callback();
        } else {
          app.onDataLoadedCallback = callback;
        }
      }
    },

    sendPayment: function() {

      if (!(this.validateAddr('sendCoinAddr') && this.sendCoinValidateAmount() && this.sendCoinValidateFee())) {
        return;
      }

      var coin = this.sendWallet.handler.code;
      var fee = this.sendFees[document.getElementById('sendCoinFee').value];
      var addr = document.getElementById('sendCoinAddr').value;

      var systemAmount = 0;
      if (app.sendForceTotal) {
        if ('feeCoin' in app.sendWallet.handler) {
          systemAmount = app.sendForceTotal;
        } else {
          systemAmount = app.sendWallet.handler.systemValuesDiff(app.sendForceTotal, app.sendWallet.handler.getFeeTotalCost(fee));
        }
      } else {
        systemAmount = app.sendWallet.handler.floatValueToSystemValue(parseFloat(document.getElementById('sendCoinAmount').value));
      }
      var floatAmount = app.sendWallet.handler.systemValueToFloatValue(systemAmount);
      var displayAmount = app.sendWallet.handler.systemValueToDisplayValue(systemAmount);

      app.authenticateBeforeContinue(
        '<table class="transactionSummary">' +
        '<tr class="first"><td><img class="coinIcon" src="coins/' + app.sendWallet.handler.icon + '.svg"/></td><td><img style="width:65%" src="icons/sendglyph.png"/></td><td>' + getCoinAddrIcon(app.sendWallet.handler, addr).outerHTML + '</td></tr>' +
        '<tr class="second"><td>' + shortAmount(displayAmount, coin, 13) + '</td><td></td><td>' + shortAddr(addr, 13) + '</td></tr>' +
        '</table>',
        '<table class="niceTable">' +
        '<tr><th colspan="2" style="width:26%;">recipient:</th></tr><tr><td colspan="2">' + addr + '</td></tr>' +
        '<tr><th colspan="2">amount:</th></tr><tr><td style="width:50%;">' + displayAmount + ' ' + coin + '</td><td>' + this.priceProvider.convert(floatAmount, coin) + '</td></tr>' +
        '<tr><th colspan="2">fee:</th></tr><tr><td>' + app.sendWallet.handler.getFeeDisplay(fee) + '</td><td>' + app.priceProvider.convert(app.sendWallet.handler.estimateFeeFloat(fee), coin) + '</td></tr>' +
        '</table>'
        ,
        function(){
          app.sendWallet.handler.sendPayment(app.sendWallet.data.privateKey, addr, systemAmount, fee);
          app.closeForm();
        }
      );
    },
    copyReceiveCoinAddrToClp: function() {
        if (device.platform == 'browser') {
          //TODO copy to clip on browser
          console.log(document.getElementById('receiveCoinAddr').value);
        } else {
          cordova.plugins.clipboard.copy(document.getElementById('receiveCoinAddr').value);
        }
        app.alertInfo('copied addr to clipboard', app.receivingWallet.handler.code);
    },
    popupReceivePayment: function(wallet, addr) {
        this.openForm('receivePaymentPopup', 'receive ' + wallet.handler.code, 'coins/' + wallet.handler.icon + '.svg');
        document.getElementById('receiveCoinName').innerHTML = '';
        document.getElementById('receiveCoinAddr').value = '';
        document.getElementById('receiveCoinQrcode').innerHTML = '';

        if (addr == null) {
          document.getElementById('receiveCoinName').innerHTML = 'Your ' + wallet.handler.code + ' address is:';
        } else {
          document.getElementById('receiveCoinName').innerHTML = '' + wallet.handler.code + ' offline address:';
        }

        document.getElementById('receiveCoinAddr').value = (typeof addr == 'undefined' ? wallet.data.addr : addr);

        new QRCode(document.getElementById('receiveCoinQrcode'), {
          text: addr == null ? wallet.data.addr : addr,
          colorLight: '#f7f5f2',
          colorDark: '#463f3a'
        });

        this.receivingWallet = wallet;

        setTimeout(app.updateReceivingWallet, 3000);
    },

    updateReceivingWallet: function() {
      if (document.getElementById("formPopup").classList.contains('show')) {
        if (document.getElementById('receivePaymentPopup').style.display == 'block') {
          console.log('refresh');
          app.receivingWallet.refreshOnline(function(){
            setTimeout(app.updateReceivingWallet, 3000);
          });
        }
      }
    },

    addWalletWidget: function(data) {
      var w = new Wallet(data)
      document.getElementById('walletsList').appendChild(w.row);
      this.wallets[data.coin] = w;
    },
    saveVersion: function() {
      this.settings.set('appVersion', window.version);
    },
    showChangelogIfVersionUpdated: function() {
      var oldVersion = this.settings.get('appVersion', '0.1.7');
      if (oldVersion != window.version) {
        var changelist = '';
        for (var i in window.changelog) {
          if (versionCompare(window.changelog[i].version, oldVersion) != 1) break;
          changelist += '<b>version ' + window.changelog[i].version + '</b> ' + window.changelog[i].date + '<ul>';
          for (var j in window.changelog[i].changes) {
            changelist += '<li>' + window.changelog[i].changes[j] + '</li>';
          }
          changelist += '</ul>';
        }
        this.confirmBeforeContinue(
          'updated to ' + window.version,
          '<p>Your were running ' + oldVersion + ' previously. Below is a complete list of changes.</p>' +
          changelist,
          function(){}
        );
        return true;
      }
      return false;
    },

    flushUxHint: function(file) {
      document.getElementById("uxHint").innerHTML = '<img src="img/' + file + '.png"/>';
      document.getElementById('uxHint').classList.add('blink');
      setTimeout(function(){document.getElementById('uxHint').classList.remove('blink');}, 1000);
    },

    onDeviceReady: function() {

        this.setPriceProvider(allPriceProviders[this.settings.get('priceProvider', 0)]);
        this.priceProvider.setUnit(this.settings.get('priceUnit', this.priceProvider.defaultUnit));

        this.priceProviderSelect = new Select(document.getElementById("priceProvider"));
        this.priceUnitSelect = new Select(document.getElementById("priceUnit"));
        this.priceProviderSelect.onChange(function(value){
          //console.log(allPriceProviders, value);
          app.priceUnitSelect.setOptions(allPriceProviders[value].availableUnits, app.settings.get('priceUnit', app.priceProvider.defaultUnit));
        });
        this.priceProviderSelect.setOptions(allPriceProviders, this.settings.get('priceProvider', 0));

        this.data.load(function(){
            navigator.splashscreen.hide();

            if (!('bip39' in this.data.wallets)) {
              var mnemonic = btcjs.generateNewMnemonic();
              this.data.wallets.bip39 = {
                enabled : false,
                mnemonic: mnemonic,
                seedHex: btcjs.mnemonicToSeedHex(mnemonic)
              };
              app.confirmBeforeContinue(
                'Important Warning!',
                '<p>' +
                'Although Coffee Wallet has been built with extreme care, it comes with <b>absolutely no warranties</b> of any kind. ' +
                'This open source application uses third party providers to access blockchains. ' +
                'This application nor its creators does not provide financial services of any kind.' +
                '</p><p>' +
                'Please also have in mind the intended usage: ' +
                'Keep majority of your funds in a secured location (like a hardware wallet) and watch them using right hand side, portfolio column. ' +
                'Use left hand side, wallets column to store your "pocket money" that you can afford to lose in case your device gets hacked / stolen etc.' +
                '</p><p>' +
                'Please consider donating if you want to make this app better.' +
                '</p>',
                function() {
                  app.confirmBeforeContinue(
                    'New Wallet',
                    '<p>New random mnemonic was created. You can see it using "backup wallets" menu option.</p>' +
                    '<p>Backup this 12-word phrase because it is used in compilance with BIP39 to generate private keys for all your online wallets.</p>',
                    function() {
                      app.data.save();
                    }
                  );
                }
              );
            } else {
              app.showChangelogIfVersionUpdated() || app.showExportKeysReminderIfRequired();
            }
            app.saveVersion();

            for (var key in this.data.wallets) {
              if (this.data.wallets[key].enabled) {
                if (!(this.data.wallets[key].coin in allCoinApis)) {
                  app.alertError('coin ' + this.data.wallets[key].coin + ' is no longer supported. It will be disabled.');
                  this.data.wallets[key].enabled = false;
                } else {
                  this.addWalletWidget(this.data.wallets[key]);
                }
              }
            }
            app.onDataLoaded();
        }.bind(this));

        this.updateMarketCap();

        rangeSlider.create(document.getElementById('sendCoinFee'), {
            polyfill: true,
            vertical: false,
            min: 0,
            max: 100,
            step: 1,
            value: 50,
            borderRadius: 10,
        });

        document.getElementById('sendCoinFee').parentElement.addEventListener ("touchstart", function() {
          document.getElementById('sendCoinFee').focus();
        });

        app.getExchangeableCoins(function(list){app.exchangeableCoinsCache = list});

        Logger.log("info", null, "application started");
    },

};

app.initialize();
