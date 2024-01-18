#!/usr/bin/env node

const yargs = require("yargs");
const axios = require("axios");
const fs = require("fs");
const chalk = require("chalk");

yargs
.command({
  command: 'registerapp',
  describe: 'Register a app to an already created instance. Generates a QR Code and a deeplink.',
  builder: yargs => {
    yargs.positional('instancehash', {
      describe: 'The instancehash',
      type: 'string'
    })
    yargs.positional('instanceauth', {
      describe: 'The instanceauth',
      type: 'string'
    })
    yargs.positional('server', {
      describe: 'Server to connect',
      type: 'string'
    })
    yargs.positional('name', {
      describe: 'Visible name in the app',
      default: 'Node-RED UI',
      type: 'string'
    })
    yargs.positional('host', {
      describe: 'Host of Node-RED',
      default: 'localhost',
      type: 'string'
    })
    yargs.positional('localport', {
      describe: 'Port of Node-RED',
      default: '1880',
      type: 'string'
    })
    yargs.positional('baseurl', {
      describe: 'Base URL of Node-RED',
      default: '/ui',
      type: 'string'
    })
  },
  handler: argv => {
    const data = {
      'instancehash': argv.instancehash,
      'instanceauth': argv.instanceauth,
      'server': argv.server,
      'name': argv.name,
      'host': argv.host,
      'localport': argv.localport,
      'baseurl': argv.baseurl
    }

    console.log(chalk.black.bgGreen.bold('  registerapp  '))
    console.log(data)

    axios.post(`${argv.url}/contrib-remote/registerApp`, data)
    .then(response => {
      if (response.data.error === undefined) {
        // Show QR Code and Deeplink
        writeResult(responseFlow)

        // Store png
        writeQRCodeAsPNG(responseFlow)
      } else {
        console.log("ERROR: " + response.data.error);
      }
    })
    .catch((error) => {
      console.log("ERROR: " + error);
    })
  }
})
.command({
  command: 'configure',
  describe: 'Registers an instance of Remote-RED to a server. Generates a QR Code and a deeplink. Adds a Remote Access Node to Node-RED.',
  builder: yargs => {
    yargs.positional('customerhash', {
      describe: 'If you are a customer of the bussiness tier, please apply your customerhash.',
      default: '',
      type: 'string'
    })
    yargs.positional('server', {
      describe: 'The server to be used directly. A server can also be selected automatically by specifying "region".',
      default: '',
      type: 'string'
    })
    yargs.positional('region', {
      describe: 'The region of the server. Possible values: us, de, sg',
      default: '',
      type: 'string'
    })
    yargs.positional('flowname', {
      describe: 'The name of the flow to create.',
      type: 'string'
    })
    yargs.positional('name', {
      describe: 'Visible name in the app.',
      default: 'Node-RED UI',
      type: 'string'
    })
    yargs.positional('host', {
      describe: 'Host of Node-RED',
      default: 'localhost',
      type: 'string'
    })
    yargs.positional('localprotocol', {
      describe: 'Protocol of Node-RED (http or https)',
      default: 'http',
      type: 'string'
    })
    yargs.positional('localport', {
      describe: 'Port of Node-RED',
      default: '1880',
      type: 'string'
    })
    yargs.positional('baseurl', {
      describe: 'Base URL of Node-RED',
      default: '/ui',
      type: 'string'
    })
    yargs.positional('jsonoutput', {
      describe: 'Output all data as JSON',
      default: false,
      type: 'boolean'
    })
  },
  handler: argv => {
    if (!argv.jsonoutput) console.log(chalk.black.bgGreen.bold('  configure  '))

    // Call API for a instacehash and a instanceauth
    let isServer = true;
    let serverOrRegion = argv.server;
    if (argv.server === '') {
      isServer = false;
      serverOrRegion = argv.region;
    }
    axios.get(`${argv.url}/contrib-remote/requestInstanceHash/${serverOrRegion}`)
    .then(response => {
      if (response.data.error === undefined) {
        // Register app
        const dataRegApp = {
          'instancehash': response.data.instancehash,
          'instanceauth': response.data.instanceauth,
          'server': response.data.server,
          'name': argv.name,
          'host': argv.host,
          'localport': argv.localport,
          'baseurl': argv.baseurl
        }
        axios.post(`${argv.url}/contrib-remote/registerApp`, dataRegApp)
        .then(responseRegApp => {
          if (responseRegApp.data.error === undefined) {
            // Create flow template
            const data = {
              'flowid': makeid(16),
              'accessnodeid': makeid(16),
              'confignodeid': makeid(16),
              'flowname': argv.flowname,
              'nodename': argv.name,
              'host': argv.host,
              'protocol': argv.localprotocol,
              'port': argv.localport,
              'baseurl': argv.baseurl,
              'instancehash': response.data.instancehash,
              'instanceauth': response.data.instanceauth,
              'server': response.data.server,
              'region': argv.region,
              'customerhash': argv.customerhash
            }
            const template = `{"id":"${data.flowid}","label":"${data.flowname}","disabled":false,"info":"","nodes":[{"id":"${data.accessnodeid}","type":"remote-access","confignode":"${data.confignodeid}","name":"${data.nodename}","verbose":0,"x":120,"y":60,"z":""}],"configs":[{"id":"${data.confignodeid}","type":"remote-config","name":"${data.nodename}","host":"${data.host}","protocol":"${data.protocol}","port":"${data.port}","baseurl":"${data.baseurl}","instancehash":"${data.instancehash}","server":"${data.server}","region":"${data.region}","credentials":{"instanceauth":"${data.instanceauth}"}}]}`;

            // Create flow using RED Admin API
            axios.post(`${argv.url}/flow`, JSON.parse(template))
            .then(responseFlow => {
              if (argv.jsonoutput) {
                const output = {
                  'status': 'OK',
                  'flowid': data.flowid,
                  'accessnodeid': data.accessnodeid,
                  'confignodeid': data.confignodeid,
                  'qrcode': responseRegApp.data.qrcode,
                  'link': responseRegApp.data.link,
                }
                console.log(output);
              } else {
                // Log node id´s
                console.log('');
                console.log(chalk.black.bgGreen.bold('  Node-RED flow and node id´s:  '));
                console.log('Flow ID: ' + data.flowid);
                console.log('Remote-RED Access Node ID: ' + data.accessnodeid);
                console.log('Remote-RED Config Node ID: ' + data.confignodeid);

                // Show QR Code and Deeplink
                writeResult(responseRegApp);
              }

              // Store png
              writeQRCodeAsPNG(responseRegApp);
            })
            .catch((error) => {
              console.log("ERROR on flow: " + error);
            })
          } else {
            console.log("ERROR on registerApp: " + responseRegApp.data.error);
          }
        })
        .catch((error) => {
          console.log("ERROR on registerApp: " + error);
        })
      } else {
        console.log("ERROR on requestInstanceHash: " + response.data.error);
      }
    })
    .catch((error) => {
      console.log("ERROR on requestInstanceHash: " + error);
    })
  }
})
.option("u", { alias: "url", describe: "Base URL of Node-RED", type: "string", demandOption: false, default: "http://localhost:1880" })
.parse()

// Creates a id
function makeid(length) {
  var result           = '';
  var characters       = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// Prints the QR Code and the deeplink.
function writeResult(response) {
  // Show in console
  console.log('');
  console.log(chalk.black.bgGreen.bold('  QRCode to connect app:  '));
  console.log(response.data.qrcode);
  console.log('');
  console.log(chalk.black.bgGreen.bold('  Link to connect app:  '));
  console.log(response.data.link);
  console.log('');
  console.log(chalk.black.bgGreen.bold('  Storning QRCode as remotered.png  '));
}

// Writes the png.
function writeQRCodeAsPNG(response) {
  let base64Image = response.data.qrcode.split(';base64,').pop();
  fs.writeFile('remotered.png', base64Image, {encoding: 'base64'}, function(err) {
  });
}
