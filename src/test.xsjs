///<reference path='..\xsjs.d.ts' />

var packagePath = "<PackagePath>";

function loadPath(path){
    var elem = $;
    var attr = path.split(".");

    for(var i in attr){
        elem = elem[attr[i]];
    }

    return elem;
}

$.import(packagePath, "IdentityManagementXS");
var IdentityMXS = loadPath(packagePath + ".IdentityManagementXS");
//Remember destination file must be in same path that the xsjslib
var dest = $.net.http.readDestination(packagePath, "template");

var manager = new IdentityMXS.IdentityManagementXS(dest);

var r = manager.searchUser("myID");

$.response.contentType = " application/json";
$.response.setBody(JSON.stringify(r));