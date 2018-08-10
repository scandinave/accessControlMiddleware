class AccessControlMiddleware {

    constructor() {

    }

    check() {
        //const userAuthorizations = ...;
        if (this.hasRelatedToken()) {
            this.checkRelated();
        } else if (this.isMultipleResources()) {
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
     */
    hasRelatedToken() {

    }

    /**
     * Return true if the access is wanted to a set of resources or a specifics resources.
     */
    isMultipleResources() {

    }

    getUserAuthorizationType() {

    }

}