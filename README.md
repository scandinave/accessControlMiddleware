# AccessControlMiddleware

Express Middleware for AccessControl library that support generics, specifics and dynamics permissions check.

[![Build Status](https://travis-ci.org/scandinave/accessControlMiddleware.svg?branch=dev)](https://travis-ci.org/scandinave/accessControlMiddleware)
[![npm version](https://img.shields.io/npm/v/@scandinave/accessControlMiddleware.svg?style=flat)](https://www.npmjs.com/package/@scandinave/access-control-middleware)
[![Coverage Status](https://coveralls.io/repos/github/scandinave/accessControlMiddleware/badge.svg?branch=dev)](https://coveralls.io/github/scandinave/accessControlMiddleware?branch=dev)
[![Licence](https://img.shields.io/npm/l/@scandinave/access-control-middleware.svg?style=flat)](https://img.shields.io/npm/l/@scandinave/access-control-middleware.svg?style=flat)

## Disclaimer

* This middleware is not part of the [AccessControl](https://github.com/onury/accesscontrol) library and it is not developped by the author of AccessControl. 
* This middleware was developped to be used in a REST architecture with the used of an access token and refresh token.

## Permission Type
* Generics : Permissions that applied to a list of resources.(eg: findAll)
* Specifics: Permissions that applied to a specific resource. (eg: find)
* Dynamics : Permissions that applied on a list of resources base on one context.(eg: findAllBy)

## How to use

* Install AccessControlMiddleware
```bash
npm install @scandinave/accessControlMiddleware
```

* Create a new instance of AccessControlMiddleware
```javascript
    // ac = ... Initialisation of the AccessControl instance.
    const acm = new AccessControlMiddleware({secret: "MySecret", accessControl: ac, filter: () => {}});
```

AccessControlMiddleware parameters are the following : 
* secret: The secret access token key used to sign the token.
* accessControl: The AccesssControl instance.
* filter: A filter function that will be used to filter findAll resources when user only have specific or dynamic authorization.
* tokenFormat: The format of the token ( eg: Bearer, JWT) (default: Bearer)
* userKey: The request param key used to store the user (default: user)
* usernameKey: THe key of the request user object that hold the user name. (default: name)
* userIdKey: THe key of the request user object that hold the user id. (default: id)
* transformUserName: A function to apply on the AccessControl instance roles name to handle role and user in it.( eg: prefix with -u)

### filter function 
As dynamics permissions is higthly couple with your application , AccessControlMiddleware can't handle its automaticaly. So you must tell it how to 
process this cases. For example, 
* if you want to handle the access off a user on it's profile you will check that the user accessing the user profile is really the owner of this profile by comparing the token user id with the resource user id. 
* if you want to handle access on a list of user posts, you will check that the ownerId attribut of the posts  will match the user token id
* etc ...

When using filter function, avoid call to the database, as this is a really slow operation. As a solution, you can store the list of each resources the users have access in the access token. This access token must have a short live length to updates the user authorizations and you could use a refresh token to renew automatically access token. 

```javascript
{
    user: ...
    posts: [
        {id: 1, ownerId: 1},
        {id: 2, ownerId: 1},
        {id: 3, ownerId: 1},
        {id: 4, ownerId: 1},
    ]
}
```
 ### 

 ### transformUserName

 This middleware handle the use of User rigth in AccessControl like Role. To differenciate between Role and User with the same name (eg: Admin role and Admin user), you can pass a function that will updates all the users names. For example you can prefixe all the users names with __u-__.

 How you load your users and roles inside accessControl is up to you and out of the scope of this middleware. AccessControl does not provide any support of user's base authorization but it's work really well.

 ## Protect route

Use the check method on every route you want to protect.

```javascript
/**
* Access to a list of resource
*/
findAll() {
    this.router.route(`/foos`).get([passport.authenticate("jwt", {session: false}), acm.check({
            resource: "foo"
            action: "read"
        })], async(req, res) => {
    });
}

/**
* Action on a specific/dynamic resource
*/
find() {
    this.router.route(`/foo/:fooId`).get([passport.authenticate("jwt", {session: false}), acm.check({
            resource: "foo",
            action: "read",
            context: {type: "foo", source: "params", key: `fooId`}
        })], (req, res) => {
    });
}
```

* If you don't use the specific feature, just not specify a context.type.
* context.source is the key used to hold request parameters.
* key is the resource key in the request parameters objet.

## Note

This middleware use [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) to handle token verification.