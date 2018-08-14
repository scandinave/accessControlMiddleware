"use strict";
const Common = require("./common");
class AccessControlMiddleware {

    constructor(secret, accessControl, tokenFormat = "Bearer", userKey = "user", usernameKey = "name") {
        this.secret = secret;
        this.accessControl = accessControl;
        this.userKey = userKey;
        this.usernameKey = usernameKey;
        this.tokenFormat = tokenFormat
    }


    check({resource, action, context} = {}) {
        return (req, res, next) => {
            this.isAuthorized(resource, action, context, req, res, next);
        }
    }

    isAuthorized({resource, action, context, req, res, next} = {}) {
        let isAuthorize = false;
        let actions;
        try {
            actions = this.getActions(action);
        } catch (err) {
            return res.status(403).send(err);
        }
        try {
            const payload = Common.verifyToken(req.headers.authorization, this.secret, this.tokenFormat);
            const permission = this.accessControl.can(Common.computeUserName(this.getUserName(payload)));
            if (this.hasRelatedToken(req.body)) {
                this.checkRelated();
            } else if (this.isMultipleResources(context)) {
                if (this.hasGeneric(permission, actions, resource)) {
                    isAuthorize = true
                } else if (this.hasOwn(permission, actions, resource)) {
                    // User must have access to an filtered list if it have access to some item of the list.
                    isAuthorize = true
                }
            } else {
                if (this.hasGeneric(permission, actions, resource)) {
                    isAuthorize = true
                } else if (this.hasOwn(permission, actions, resource)) {
                    if (this.isSpecific(context) && this.checkSpecific(context.type, context.fkey, payload.resources)) {
                        isAuthorize = true
                    }
                    else if (this.checkDynamic(context.fkey, payload[resource])) {
                        isAuthorize = true
                    }
                }
            }
            if (isAuthorize) {
                res.permission = permission[actions.any](resource);
                return next();
            }
            return res.status(403).send(err);
        }  catch (err) {
            return res.status(403).send(err);
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
        return Common.isNotEmpty(body.relatedToken);
    }

    /**
     * Check the resource related token to ensure the client can access the resource.
     *
     */
    checkRelated({token, resource} = {}) {
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
                const payload = Common.verifyToken(token, "MySecret", "JWT")
                return payload.grants.resource === resource;
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
