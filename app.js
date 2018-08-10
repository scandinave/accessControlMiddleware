class AccessControlMiddleware {

    constructor() {

    }

    check() {
        const userAuthorizations = ...;
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
}