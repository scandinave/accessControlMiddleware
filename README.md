# AccessControlMiddleware

Express Middleware for AccessControl library that support generics, specifics and dynamics permissions check

## Permission Type
* Generics : Permissions that applied to a list of resources.(eg: findAll)
* Specifics: Permissions that applied to a specific resource. (eg: find)
* Dynamics : Permissions that applied on a list of resources base on some context.(eg: findAllBy)

## How to use

* Install AccessControlMiddleware
```bash
npm install accessControlMiddleware
```

* Create a new instance of AccessControlMiddleware
```javascript
    // ac = ... Initialisation of the AccessControl instance.
    const acm = new AccessControlMiddleware({secret: "MySecret", accessControl: ac, filter: () => {}});
```

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

* If you don't used the specific feature, just not pass a context.type.
* context.source is the key used to hold request parameters.
* key is the resource key in the request parameters objet.
