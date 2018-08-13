"use strict";
const jwt = require("jsonwebtoken");
/**
 * Common function to used inside other classes.
 */
class Common {
    /**
       * Check if an elem is empty. This method check for null or undefined value.
       * If elem is an array, also check for size greater than 0.
       * @param {*} elem The elem to check.
       * @return {boolean} true if, the elem is empty, false otherwise.
       */
    static isEmpty(elem) {
        if (Array.isArray(elem) && Object.keys(elem).length === 0) {
            return true;
        }

        if (elem instanceof Object && Object.keys(elem).length === 0) {
            return true;
        }

        return typeof elem === "undefined" || elem === null || elem === "";
    }

    /**
     * Check if an elem null or undefined.
     * @param {*} elem The elem to check.
     * @return {boolean} true if, the elem is defined, false otherwise.
     */
    static isDefined(elem) {
        return !this.isNotDefined(elem);
    }

    /**
     * Check if an elem null or undefined.
     * @param {*} elem The elem to check.
     * @return {boolean} true if, the elem is defined, false otherwise.
     */
    static isNotDefined(elem) {
        return typeof elem === "undefined" || elem === null || elem === "";
    }

    /**
    * Check if an elem is not empty. This method check for null or undefined value.
    * If elem is an array, also check for size greater than 0.
    * @param {*} elem The elem to check.
    * @return {boolean} true if, the elem is not empty, false otherwise.
    */
    static isNotEmpty(elem) {
        return !Common.isEmpty(elem);
    }

    /**
   * Verify hat the resource token is valid
   * @param {string} token The token to verify
   * @param {string} secret The secret used to sign the token
   * @param {string} format The token format (eg: JWT, Bearer ...)
   * @return {Object} The decode token data
   */
    static verifyToken(token, secret, format) {
        if (token.startsWith(format)) {
            token = token.slice(format.length + 1);
        }
        try {
            return jwt.verify(token, secret);

        } catch (err) {
            throw new Error(err);
        }
    }

    /**
    * Prefix the user name to avoid collision with role name in accessControl object.
    * @param {string} name The name of the user.
    * @return {string} The prefixed user name.
    */
    static computeUserName(name) {
        return `u-${name}`;
    }
}

module.exports = Common;
