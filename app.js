"use strict";
const Common = require("./common");
class AccessControlMiddleware {

    constructor(secret, accessControl) {
        this.secret = secret;
        this.accessControl = accessControl;
    }

    check({ resource, action, context } = {}) {
        return (req, res, next) => {
            const actions = this.getActions(action);
            const permission = this.accessControl.can(Common.computeUserName(user.name));
            if (this.hasRelatedToken(req.body)) {
                this.checkRelated();
            } else if (this.isMultipleResources(context)) {
                if (this.hasGeneric(permission, actions, resource)) {

                } else if (this.hasHybride(permission, actions, resource)) {
                    // User must have access to an filtered list if it have access to some item of the list.
                } else {
                    return res.status(403).send();
                }
            } else {
                if (this.hasGeneric(permission, actions, resource)) {

                } else if (this.hasHybride(permission, actions, resource)) {
                    this.checkDynamic();
                    this.checkSpecific();
                } else {
                    return res.status(403).send();
                }
            }
        }
    }

    /**
     * Check that the user have correct the dynamic authorization
     * in it's access token.
     */
    checkDynamic() {

    }

    /**
     * Checl that the user have the correct generic authorization.
     */
    hasGeneric(permission, actions, resource) {
        this.hasPermission(permission, actions.any, resource)
    }

    /**
     * Check that the user have the specific or dynamic authorization
     * in it's access token.
     */
    hasHybride(permission, actions, resource) {
        this.hasPermission(permission, actions.own, resource)
    }

    /**
     * Checl that the user have the correct specific authorization in it's access token
     */
    checkSpecific() {

    }

    /**
     * Check if the client send a resource related token that cause the request 
     * to bypass others checks.
     * @param body The request body.
     * @return True if a related token is present in the request body, false otherwise
     */
    hasRelatedToken(body) {
        if (Common.isEmpty(body)) {
            throw new Error("Missing parameter : body");
        }
        return Common.isNotEmpty(body.relatedToken);
    }

    /**
     * Check the resource related token to ensure the client can access the resource.
     * 
     */
    checkRelated({ token, resource } = {}) {
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
        return Common.isNotEmpty(context);
    }

    /**
     * @param AccessControl#query 
     */
    getUserAuthorizationType(authorization) {

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
                return next(new Error("invalid action"));
        }

        return actions;
    }

}

module.exports = AccessControlMiddleware;