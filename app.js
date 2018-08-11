"use strict";
const Common = require("./common");
class AccessControlMiddleware {

    constructor(secret) {
        this.secret = secret;
    }

    check({ context } = {}) {
        return (req, res, next) => {
            //const userAuthorizations = ...;
            if (this.hasRelatedToken(req.body)) {
                this.checkRelated();
            } else if (this.isMultipleResources(context)) {
                switch (this.getUserAuthorizationType()) {
                    case "generic":
                        this.checkGeneric();
                        break;
                    case "dynamic":
                        this.checkHybride();
                        break;
                    case "specific":
                        this.checkHybride();
                        break;
                    default:
                        break;
                }
            } else {
                switch (this.getUserAuthorizationType()) {
                    case "generic":
                        this.checkGeneric();
                        break;
                    case "dynamic":
                        this.checkDynamic();
                        break;
                    case "specific":
                        this.checkSpecific();
                        break;
                    default:
                        break;
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
     * Checl that the user have the correct genereic authorization in it' access token.
     */
    checkGeneric() {

    }

    /**
     * Check that the user have the specific or dynamic authorization
     * in it's access token.
     */
    checkHybride() {

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

    getUserAuthorizationType() {

    }

}

module.exports = AccessControlMiddleware;