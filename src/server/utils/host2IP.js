var mappings = {
   /*
    *  || FULL NODES ||
    */

   // Oregon
   'oreg-main-1': {
      type: 'fullnode',
      region: 'oregon',
      ip: '34.216.166.116'
   },
   'oreg-main-2': {
      type: 'fullnode',
      region: 'oregon',
      ip: '52.26.49.89'
   },
   'oreg-main-3': {
      type: 'fullnode',
      region: 'oregon',
      ip: '54.188.41.116'
   },
   'oreg-main-4': {
      type: 'fullnode',
      region: 'oregon',
      ip: '34.217.88.135'
   },
   // Singapore
   'sing-main-1': {
      type: 'fullnode',
      region: 'singapore',
      ip: '54.251.149.19'
   },
   'sing-main-2': {
      type: 'fullnode',
      region: 'singapore',
      ip: '54.169.252.226'
   },
   'sing-main-3': {
      type: 'fullnode',
      region: 'singapore',
      ip: '13.250.103.227'
   },
   'sing-main-4': {
      type: 'fullnode',
      region: 'singapore',
      ip: '13.250.107.244'
   },
   // Frankfurt
   'fran-main-1': {
      type: 'fullnode',
      region: 'frankfurt',
      ip: '3.120.34.68'
   },
   'fran-main-2': {
      type: 'fullnode',
      region: 'frankfurt',
      ip: '3.122.60.103'
   },
   'fran-main-3': {
      type: 'fullnode',
      region: 'frankfurt',
      ip: '3.121.237.238'
   },

   /*
    * PROXY NODES
    */
   'oreg-main-proxy-1': {
      type: 'proxy',
      region: 'oregon',
      ip: '34.219.12.246'
   },
   'sing-main-proxy-1': {
      type: 'proxy',
      region: 'singapore',
      ip: '54.255.154.127'
   },
   'fran-main-proxy-1': {
      type: 'proxy',
      region: 'frankfurt',
      ip: '3.121.201.198'
   },

   /*
    * EVENTRON
    */

   // OREGON
   'oreg-main-eventron-1': {
      type: 'eventron',
      region: 'oregon',
      ip: '54.245.212.141'
   },
   'oreg-main-eventron-2': {
      type: 'eventron',
      region: 'oregon',
      ip: '54.188.191.71'
   },
   'oreg-main-eventron-3': {
      type: 'eventron',
      region: 'oregon',
      ip: '34.220.195.31'
   },
   'oreg-main-eventron-4': {
      type: 'eventron',
      region: 'oregon',
      ip: '54.245.135.75'
   },
   'oreg-main-eventron-5': {
      type: 'eventron',
      region: 'oregon',
      ip: '54.212.202.31'
   },
   'oreg-main-eventron-6': {
      type: 'eventron',
      region: 'oregon',
      ip: '34.210.102.56'
   },

   // SINGAPORE
   'sing-main-eventron-1': {
      type: 'eventron',
      region: 'singapore',
      ip: '54.169.110.2'
   },
   'sing-main-eventron-2': {
      type: 'eventron',
      region: 'singapore',
      ip: '13.229.55.148'
   },
   'sing-main-eventron-3': {
      type: 'eventron',
      region: 'singapore',
      ip: '54.169.65.163'
   },
   'sing-main-eventron-4': {
      type: 'eventron',
      region: 'singapore',
      ip: '54.255.192.219'
   },
   'sing-main-eventron-5': {
      type: 'eventron',
      region: 'singapore',
      ip: '13.250.38.69'
   },
   'sing-main-eventron-6': {
      type: 'eventron',
      region: 'singapore',
      ip: '13.229.128.69'
   },

   // FRANKFURT
   'fran-main-eventron-1': {
      type: 'eventron',
      region: 'frankfurt',
      ip: '3.122.114.199'
   },
   'fran-main-eventron-2': {
      type: 'eventron',
      region: 'frankfurt',
      ip: '35.156.59.43'
   },
   'fran-main-eventron-3': {
      type: 'eventron',
      region: 'frankfurt',
      ip: '54.93.110.228'
   },
   'fran-main-eventron-4': {
      type: 'eventron',
      region: 'frankfurt',
      ip: '18.185.50.100'
   },

   /*
    * BLOCKPARSER
    */
   'oreg-main-blockparser': {
      type: 'blockparser',
      region: 'oregon',
      ip: '52.37.143.154'
   },
   'sing-main-blockparser': {
      type: 'blockparser',
      region: 'singapore',
      ip: '52.221.218.116'
   },
   'fran-main-blockparser': {
      type: 'blockparser',
      region: 'frankfurt',
      ip: '35.158.117.231'
   }

};

module.exports = function getIP(hostname) {
   let ip = mappings[hostname];

   if (!ip) {
      return {type: 'unknown', region: 'unknown', ip: hostname};
   }
   return ip;
}
