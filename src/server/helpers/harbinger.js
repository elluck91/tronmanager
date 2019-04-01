var axios = require('axios');

class Harbinger {

    constructor() {

    }

    alertTronForce(healthReport) {
        console.log('Alerting Tron Froce')
        const message = this.composeMessage(healthReport);

        let config = {
          headers: {
              "Content-Type": "application/json; charset=utf-8"
          }
        }
        let url = 'https://oapi.dingtalk.com/robot/send?access_token=f1ec332a3e05f6e22da579a51e9c4f80fef41f9f5cd8db2ff3dfcbf62ccf0cca'
        axios.post(url, {
            "msgtype": "markdown",
            "markdown": {
                "title": 'WARNING: TronFroce!',
                "text": message
             }
        }, config)
          .then(function (response) {
            console.log(response);
          })
          .catch(function (error) {
            console.log(error);
        });
        //bearNewsOnDingTalk(message);
        //sendMailPigeon(message);
    }

    composeMessage(healthReport) {
        let message = "";

        message += '### ' + healthReport['node_type'] + ` named \'`
                + healthReport['node_name'] + '\' is sick!\n\n';

        for (let property of Object.keys(healthReport)) {
            message += property + ": " + healthReport[property] + "\n\n";
        }

        return message;
    }
}

module.exports = new Harbinger();
