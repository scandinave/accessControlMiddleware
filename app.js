/**
 * Copyright 15/08/2018 LE BARO Romain

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"),
to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute,
sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
"use strict";

const Common = require("./common");
class AccessControlMiddleware {

    /**
     * Enable a new accessControl middleware.
     * @param {*} options The list of options used to customize the middleware.
     * @param {*} options.secret The secret access token key used to sign the token.
     * @param {*} options.accessControl The AccesssControl instance.
     * @param {*} options.filter A filter function that will be used to filter findAll resources when user only have specific or dynamic authorization.
     * @param {*} options.tokenFormat The format of the token ( eg: Bearer, JWT)
     * @param {*} options.userKey The request param key used to store the user (default: user)
     * @param {*} options.usernameKey THe key of the request user object that hold the user name. (default: name)
     * @param {*} options.userIdKey THe key of the request user object that hold the user id. (default: id)
     * @param {*} options.transformUserName A function to apply on the AccessControl instance role name to handle role and user in it.( eg: prefix with -u)
     */
    constructor({secret, accessControl, filter, tokenFormat = "Bearer", userKey = "user", usernameKey = "name", userIdKey = "id",
        transformUserName} = {}) {
        this.secret = secret;
        this.accessControl = accessControl;
        this.userKey = userKey;
        this.usernameKey = usernameKey;
        this.userIdKey = userIdKey;
        this.tokenFormat = tokenFormat;
        this.transformUserName = transformUserName;
        if (Common.isFunction(filter)) {
            this.filter = filter;
        } else {
            throw new Error("You must define a filter function for user with specifics/dynamics authorizations that need to access list resources")
        }
    }


    /**
     * Method to proctect a route in expressJS
     * @param {Array} authorizations An array of authorizations(resource, action, context) to check
     */
    check(authorizations) {
        return (req, res, next) => {
            computeAuthorizations(authorizations, req, res, next)
        }
    }

    /**
     * Test if a user/role have a authorization to access a resource
     * @param {Object} params The parameter used to check
     * @param {Array} params.authorizations An array of authorizations(resource, action, context) to check
     * @param {HttpRequest} params.req The request
     * @param {HttpResponse} params.res The response
     */
    computeAuthorizations({authorizations, req, res, next} = {}) {
        let errors = [];
        let i = 0;
        let authorized = false;
        do {
            const authorization = authorizations[i];
            try {
                if (this.isAuthorized({resource: authorization.resource, action: authorization.action, context: authorization.context, req, res})) {
                    authorized = true;
                } else {
                    errors.push({resource: authorization.resource, action: authorization.action, context: authorization.context, err: "Insufficient privileges"});
                }
            } catch (err) {
                errors.push({resource: authorization.resource, action: authorization.action, context: authorization.context, err: err.message});
            } finally {
                i++;
            }
        } while (i < authorizations.length && authorized === false);
        if (authorized) {
            next();
        } else {
            res.status(403).send(errors);
        }
    }

    /**
     * Test if a user/role have a authorization to access a resource
     * @param {Object} params The parameter used to check
     * @param {String} params.resource The resource that will be accessed
     * @param {String} params.action The action on the resource being accessed
     * @param {HttpRequest} params.req The request
     * @param {HttpResponse} params.res The response
     * @return {Boolean} Return true if the user/role have the authorization, false otherwise
     */
    isAuthorized({resource, action, context, req, res} = {}) {
        let isAuthorize = false;
        let actions;
        try {
            actions = this.getActions(action);
        } catch (err) {
            throw new Error(err.message);
        }
        try {
            const payload = Common.verifyToken(req.headers.authorization, this.secret, this.tokenFormat);
            const permission = this.accessControl.can(this.transformUserName(this.getUserName(payload)));
            if (this.hasRelatedToken(req.body)) {
                if (this.checkRelated({payload, token: req.body.token, resource})) {
                    isAuthorize = true;
                }
            } else if (this.isMultipleResources(context)) {
                if (this.hasGeneric(permission, actions, resource)) {
                    isAuthorize = true
                } else if (this.hasOwn(permission, actions, resource)) {
                    // User must have access to an filtered list if it have access to some item of the list.
                    isAuthorize = true;
                    this.filter(req, permission, resource, actions.own);
                }
            } else {
                if (this.hasGeneric(permission, actions, resource)) {
                    isAuthorize = true
                } else if (this.hasOwn(permission, actions, resource)) {
                    if (this.isSpecific(context) && this.checkSpecific(context.type, req[context.source][context.key], payload.resources)) {
                        isAuthorize = true
                    }
                    else if (this.checkDynamic(req[context.source][context.key], payload[resource])) {
                        isAuthorize = true
                    }
                }
            }
            if (isAuthorize) {
                res.permission = permission[actions.any](resource);
                return true;
            }
            return false;
        } catch (err) {
            throw new Error(err.message);
        }
    }

    /**
     * Return the user name extract from the request object
     * @param {HttpRequest} req The request object
     * @return {String} The user name.
     */
    getUserName(req) {
        return req[this.userKey][this.usernameKey];
    }

    /**
     * Check if the authorisation is a specific authorization or a dynamic
     * @param {Object} context The context of the authorization
     * @return {Boolean} return true if the authorization is specific, false if it is dynamic.
     */
    isSpecific(context) {
        return Common.isNotEmpty(context.type);
    }

    /**
     * Check that the user have correct the dynamic authorization (eg: Association make by a foreign key in database) in it's access token. This make possible authorizations like "user can access it's profil".
     * @param {String} fkey The primary key of the resource of the route protected
     * @param {resources} resources The resources objects extract from the user accessToken
     * @return {Boolean} True if the resource is find inside resources object, False otherwise
     */
    checkDynamic(fkey, resources) {
        return resources.find(resource => resource.id === fkey) !== undefined;
    }

    /**
     * Check that the user have the correct specific authorization in it's access token
     * @param {String} type The resource type of the route protected
     * @param {String} fkey The primary key of the resource of the route protected
     * @param {resources} resources The resources objects extract from the user accessToken
     * @return {Boolean} True if the resource is find inside resources object, False otherwise
     */
    checkSpecific(type, fkey, resources) {
        return resources.find(resource => resource.fkey === fkey && resource.type === type) !== undefined;
    }

    /**
     * Check if the user have a generic permission correspondind to the action and resource wanted.
     * @param {AccessControl.query} permission
     * @param {Object} actions Object that contains generic/specific actions that correspond to the action wanted
     * @param {String} resource The resource wanted
     * @return {Boolean} True if the user have generic permission, false otherwise.
     */
    hasGeneric(permission, actions, resource) {
        return this.hasPermission(permission, actions.any, resource);
    }

    /**
     * Check if the use have a specific permission correspondind to the action and resource wanted.
     * @param {AccessControl.query} permission
     * @param {Object} actions Object that contains generic/specific actions that correspond to the action wanted
     * @param {String} resource The resource wanted
     * @return {Boolean} True if the user have specific permission, false otherwise.
     */
    hasOwn(permission, actions, resource) {
        return this.hasPermission(permission, actions.own, resource);
    }



    /**
     * Check if the client send a resource related token that cause the request
     * to bypass others checks.
     * @param body The request body.
     * @return True if a related token is present in the request body, false otherwise
     */
    hasRelatedToken(body) {
        if (Common.isNotDefined(body)) {
            throw new Error("Missing parameter : body");
        }
        return Common.isNotEmpty(body.token);
    }

    /**
     * Check the resource related token to ensure the client can access the resource.
     *
     */
    checkRelated({payload, token, resource} = {}) {
        let countError = 0;
        if (Common.isEmpty(token)) {
            countError++;
        }
        if (Common.isEmpty(resource)) {
            countError += 2;
        }
        switch (countError) {
            case 1:
                throw new Error("Missing parameter : token");
            case 2:
                throw new Error("Missing parameter : resource");
            case 3:
                throw new Error("Missing parameters : token, resource");
            default:
                const payloadRelated = Common.verifyToken(token, "MySecret", "JWT")
                return payloadRelated.data.resource === resource && payload[this.userKey][this.userIdKey] === payloadRelated.data[this.userKey];
        }

    }

    /**
     * Return true if the access is wanted to a set of resources or a specifics resources.
     * @param context The context of the request. Can be empty for multiple resources (eg: findAll)
     * @return True if a context is present and false otherwise.
     */
    isMultipleResources(context = {}) {
        return Common.isEmpty(context);
    }

    /**
     * Check that a permission is valid.
     * @param {*} permission The objectionJS permissionObject
     * @param {*} action The action/posession to check
     * @param {*} resource The resource to validate.
     * @return {boolean} True if the permission is valid , false otherwise.
     */
    hasPermission(permission, action, resource) {
        return permission[action] && permission[action](resource) && permission[action](resource).granted;
    }

    /**
     * Get AccessControl action base on string action.
     * @param {string} action The string to convert to AccessControl actions.
     */
    getActions(action) {
        const actions = {};
        switch (action) {

            case "create":
                actions.any = "createAny";
                actions.own = "createOwn";
                break;

            case "update":
                actions.any = "updateAny";
                actions.own = "updateOwn";
                break;


            case "read":
                actions.any = "readAny";
                actions.own = "readOwn";
                break;


            case "delete":
                actions.any = "deleteAny";
                actions.own = "deleteOwn";
                break;

            default:
                throw new Error("Invalid action");
        }

        return actions;
    }

}

module.exports = AccessControlMiddleware;
