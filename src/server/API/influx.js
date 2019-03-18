require('dotenv').config({ path: '../.env' })
const Influx = require('influx');

const influx = new Influx.InfluxDB({
   host: process.env.COLLECTD_DB_IP,
   database: process.env.COLLECTD_DB_NAME,
   port: process.env.COLLECTD_DB_PORT
});

influx.query(`
    select * from cpu_value
    limit 10
  `).then(result => {
    console.log(result)
  }).catch(err => {
    console.log(err.stack)
  })
