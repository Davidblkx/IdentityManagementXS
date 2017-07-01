# WARNING: THIS IS AN WORK IN PROGRESS

# IdentityManagementXS
### A SAP Hana XS xsjslib to make it easy to use the SAP Cloud Platform Identity Authentication API

## How to enable SAP Cloud Platform Identity Authentication REST API

see [SAP Documentation](https://help.sap.com/viewer/6d6d63354d1242d185ab4830fc04feb1/Cloud/en-US/e6bb70d5e43c4ff89ff700beb82b25fe.html)

## Instalation

- Download last release of IdentityManagementXS.xsjslib
- Add it to your XS environment

## How to initialize it
```javascript
//Import it
$.import("my.package.path", "IdentityManagementXS");
// Set your destination file:
var myDestination = $.net.http.readDestination("my.package.path", "name");

//load lib
var iMXS = new $.my.package.path.IdentityManagementXS(myDestination);
```
