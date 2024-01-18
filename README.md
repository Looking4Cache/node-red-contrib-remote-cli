# Remote-RED CLI

With the Remote-RED CLI you can automate the installation of Remote-RED.
It is possible to create a Remote Access node and it´s corresponding config
node. They will be activated against the Remote-RED servers. Additional you can
create new App-Install QR Codes for existing instances.

The purpose of this CLI is to configure Remote-RED while factory processes
of IoT devices.


## Requirements

You need a installation of the Remote-RED nodes (node-red-contrib-remote) on
your local Node-RED and access to the HTTP Admin API of Node-RED.


## Usage

Install the CLI:
    npm i -g red-contrib-remote-cli

Get the help:
    red-contrib-remote-cli --help

Get the help about configuring Remote RED:
    red-contrib-remote-cli configure --help

Example:
    red-contrib-remote-cli configure --flowname RemoteAccess --name RemoteAccess --region de


## Contact

You will find more information on [www.remote-red-com](https://www.remote-red.com). You can contact me by mail through info@remote-red.com.
