///<reference path='..\xsjs.d.ts' />

// IdentityManagementXS
// A SAP Hana XS xsjslib to make it easy to use the SAP Cloud Platform Identity Authentication API
// LICENSE: Apache-2.0

/**
 * @typedef Result
 * @prop {boolean} success
 * @prop {Object|string|UserInfo} value
 */

/**
 * @typedef UserInfo
 * @prop {string} internalId
 * @prop {string} nameId
 * @prop {string} email
 * @prop {string} firstName
 * @prop {string} lastName
 * @prop {boolean} status
 */

/**
 * @typedef NewUserDetails
 * @prop {string} name_id
 * @prop {string} email
 * @prop {boolean} send_email
 * @prop {string|undefined} user_profile_id
 * @prop {string|undefined} login_name
 * @prop {string|undefined} first_name
 * @prop {string|undefined} last_name
 * @prop {string|undefined} language
 * @prop {string|undefined} valid_from
 * @prop {string|undefined} valid_to
 * @prop {string|undefined} source_url
 * @prop {string|undefined} target_url
 * @prop {string|undefined} spCustomAttribute1
 * @prop {string|undefined} spCustomAttribute2
 * @prop {string|undefined} spCustomAttribute3
 * @prop {string|undefined} spCustomAttribute4
 * @prop {string|undefined} spCustomAttribute5
 */

/**
 * @typedef XMLEntry
 * @prop {string} name
 * @prop {string} value
 *  
 */


/**
 * process an UserInfo
 * 
 * @param {xsjs.web.WebEntityResponse} response
 * @param {string} insternalId
 * @returns {UserInfo|Object}
 */
function processUserInfo(response, internalId){
    
    var info = {};

    var data = parseUserInfoXML(response);
    for(var i in data){
        info[data[i].name] = data[i].value.trim();
    }

    info.internalId = internalId;

    return info;
}

/**
 * Process the xml response
 * 
 * @param {xsjs.web.WebEntityResponse} response
 * @returns {XMLEntry[]}
 */
function parseUserInfoXML(response){

    var items = [];

    var parser = new $.util.SAXParser();

    parser.startElementHandler = function(name, attr){
        if(name === "user"){
            return;
        }

        items.push({
            name: name,
            value: ""
        });
    };

    parser.characterDataHandler = function(s){
        var item = items[items.length - 1];
        if(item === undefined){
            return;
        }
        item.value = item.value + s;
    };

    parser.parse(response.body);

    return items;

}

/**
 * Fail message generator for invalid arguments
 * 
 * @param {string} argName 
 * @param {string} argType 
 * @returns {Result}
 */
function invalidArg(argName, argType){

    var message = "Invalid argument value for " + argName;
    message += ". Was expected an " + argType;

    return {
        success: false,
        value: message
    };
}

/**
 * add closing tags
 * 
 * @param {string} xml 
 * @returns 
 */
function fixInvalidXMLTags(xml){

    var data = "";

    while(xml.length > 0){

        var pos = xml.indexOf("<input");
        if(pos === -1) { break; }
        
        data += xml.substring(0, pos);
        xml = xml.substring(pos);

        pos = xml.indexOf(">");
        if(pos === -1) { break; }

        pos++;
        data += xml.substring(0, pos);
        if(data.lastIndexOf("/>") !== data.length - 2){
            data += "</input>";
        }
        xml = xml.substring(pos);

    }

    data += xml;

    return data;
}

/**
 * Process the xml response
 * 
 * @param {string} xml
 * @returns {XMLEntry[]}
 */
function parseKeyValueFromHtml(xml){

    var data = [];

    var parser = new $.util.SAXParser();

    parser.startElementHandler = function(name, attr){
        if(name === "user"){
            return;
        }

        data.push({
            name: name,
            value: attr
        });
    };

    parser.characterDataHandler = function(s){
        return;
    };

    parser.parse(xml);

    return data;
}

/**
 * 
 * 
 * @param {xsjs.web.TupelList} list 
 * @returns {Object}
 */
function loadTupplets(list){

    var data = {};
    for (var i = 0; i < list.length; i++) {
        data[list[i].name] = list[i].value;
    }

    return data;
}

/**
 * 
 * Represents an  IdentityManagementXS instance
 * 
 * @constructor
 * @param {xsjs.net.http.Destination} identityPlatformDestination basic ssl destination for https://<tenant ID>.accounts.ondemand.com
 * @param {xsjs.net.http.Destination} authIdentityPlatform ssl dest for https://<tenant ID>.accounts.ondemand.com/service/users
 */
var IdentityManagementXS = function(identityPlatformDestination, authIdentityPlatform){
    this._basic = identityPlatformDestination;
    this._destination = authIdentityPlatform;
};


/**
 * Get user info using the user internal id
 * 
 * @param {string} userIdentityId the user id as: https://<tenant ID>.accounts.ondemand.com/service/users/<userIdentityId>
 * @returns {Result}
 */
IdentityManagementXS.prototype.getUserInfo = function(userIdentityId){

    var req = new $.web.WebRequest($.net.http.GET, "/" + userIdentityId);
    req.headers.set("Content-Type", "application/xml");
    req.headers.set("X-Requested-With", "XMLHttpRequest");

    var client = new $.net.http.Client();

    client.request(req, this._destination);
    var response  = client.getResponse();

    if(response.status !== 200 || response.body === undefined){
        return {
            success: false,
            value: "invalid user id"
        };
    }

    return {
        success: true,
        value: processUserInfo(response, userIdentityId)
    };
};

/**
 * search for an user by name id
 * 
 * @param {string} nameId 
 * @param {string|undefined} sProviderName optional
 * @return {Result}
 */
IdentityManagementXS.prototype.searchUser = function(nameId, sProviderName){

    var client = new $.net.http.Client();
    
    var params = "?name_id=" + nameId;
    if(typeof sProviderName === "string"){
        params += "&sp_name=" + sProviderName;
    }

    var req = new $.web.WebRequest($.net.http.GET, params);
    client.request(req, this._destination);

    var response = client.getResponse();
    var location = response.headers.get("location");

    if(response.status !== 301 || location === undefined){
        return {
            success: false,
            value: "Can't find user: " + nameId
        };
    }

    var internalId = location.substring(location.lastIndexOf("/") + 1);

    return this.getUserInfo(internalId);

};

/**
 * Search by name id for each user in array
 * 
 * @param {string[]} nameIdsArray 
 * @returns {Result[]}
 */
IdentityManagementXS.prototype.searchUsers = function(nameIdsArray){
    var res = [];

    for(var i in nameIdsArray){
        res.push(this.searchUser(nameIdsArray[i], undefined));
    }

    return res;
};

/**
 * Creates a new user
 * if send_email is false, the activation link is returned
 * 
 * @param {NewUserDetails} userDetails
 * @returns {Result}
 */
IdentityManagementXS.prototype.createNewUser = function(userDetails){

    if(typeof userDetails.name_id !== "string"){
        return invalidArg("name_id", "string");
    }

    if(typeof userDetails.email !== "string"){
        return invalidArg("email", "string");
    }

    if(typeof userDetails.send_email !== "boolean"){
        return invalidArg("send_email", "boolean");
    }

    var client = new $.net.http.Client();
    
    var req = new $.web.WebRequest($.net.http.POST, "");
    req.headers.set("Content-Type", "application/x-www-form-urlencoded");

    for(var name in userDetails){
        req.parameters.set(name, "" + userDetails[name]);
    }

    client.request(req, this._destination);
    var resp = client.getResponse();
    
    if(resp.status !== 201){
        return {
            success: false,
            value: resp.body ? resp.body.asString() : "Error creating user, status: " + resp.status
        };
    }

    var message = resp.body ? JSON.parse(resp.body.asString()) : "User will recive a activation link by email";

    return {
        success: true,
        value: message
    };

};

/**
 * Activates an user using the activation link
 * 
 * @param {string} activationLink 
 * @param {string} password 
 * @returns {Result}
 */
IdentityManagementXS.prototype.activateUser = function(activationLink, password){

    var sapIdentityUrl = "https://<tenantId>.accounts.ondemand.com";

    //------ Resquest fase 1 --------------

    var url = activationLink.replace(sapIdentityUrl, "");

    var client = new $.net.http.Client();
    var req = new $.web.WebRequest($.net.http.GET, url);
    
    client.request(req, this._basic);
    
    var res = client.getResponse();

    if(res.status !== 302){
        return {
            success: false,
            value: "Error loading request for: " + activationLink
        };
    }

    //------ Resquest fase 2 --------------

    var location = res.headers.get("location");
    url = location.replace(sapIdentityUrl, "");
    req = new $.web.WebRequest($.net.http.GET, url);

    client.request(req, this._basic);
    res = client.getResponse();

    if(res.status !== 200){
        return {
            success: false,
            value: loadTupplets(res.headers)
        };
    }

    //------ Parse form URL --------------

    var form = res.body.asString();
    form = form.substring(form.indexOf("<form "));
    form = form.substring(0, form.indexOf("form>") + 5);
    form = form.replace("\n\r", "").replace("\r", "").replace("\n", "");
    form = fixInvalidXMLTags(form);

    var data = [];

    try{
        data = parseKeyValueFromHtml(form);
    } catch(e) {
        return {
            success: false,
            value: data
        };
    }

    //------ Build post params --------------
    var requiredFields = ["utf8", "authenticity_token", "method", "idpSSOEndpoint", "SAMLRequest",
                          "RelayState", "uidSpid", "xsrfProtection"];
    var formEntries = [];
    var action = "";

    for(var i in data){
        var item = data[i];

        if(item.name === "form" && item.value && item.value.action){
            action = item.value.action;
            continue;
        }

        if(item.name === "input" && item.value && requiredFields.indexOf(item.value.name) !== -1){
            formEntries.push({
                name: item.value.name,
                value: item.value.value
            });
        }
    }

    if(action === ""){
        return {
            success: false,
            value: data
        };
    }

    req = new $.web.WebRequest($.net.http.POST, action);

    var cookie = res.headers.get("set-cookie");

    if(Array.isArray(cookie)){
        for(var x = 0; x < cookie.length; x++){
            req.headers.set("set-cookie", cookie[x]);
        }
    } else if(typeof cookie === "string"){
        req.headers.set("set-cookie", cookie);
    }

    req.headers.set("Content-Type", "application/x-www-form-urlencoded");
    req.headers.set("Referer", location);

    for(var p in formEntries){
        var entry = formEntries[p];
        req.parameters.set(entry.name, entry.value);
    }

    req.parameters.set("password", password);
    req.parameters.set("passwordConfirm", password);

    //------ Post activation request --------------

    client.request(req, this._basic);
    res = client.getResponse();

    var message = res.status === 200 ? "User activated" : loadTupplets(res.headers);

    return {
        success: res.status === 200,
        value: message
    };

};

/**
 * Creates a new user
 * if send_email is false, the activation link is returned
 * 
 * @param {NewUserDetails} userDetails
 * @param {string} password
 * @returns {Result}
 */
IdentityManagementXS.prototype.createAndActivateNewUser = function(userDetails, password){
    userDetails.send_email = false;

    var r = this.createNewUser(userDetails);

    if(!r.success){
        return r;
    }

    var activationLink = r.value.activationLink;
    if(!activationLink){
        return {
            success: false,
            value: r.value
        };
    }

    return this.activateUser(activationLink, password);
};