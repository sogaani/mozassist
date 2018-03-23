# MozAssist
[Google Smart Home App](https://developers.google.com/actions/smarthome/) that connect Google Assistant and Mozilla Things Gateway.

## Prerequisites for connecting Things Gateway

### Create authorization credentials

The [Things Gateway](https://github.com/mozilla-iot/gateway/blob/master/README.md) must create authorization credentials that allow the MozAssist to access your Things Gateway APIs.

Things Gateway =< 3.1 have no UI to create authorization credentials, and thus add some codes.
Add following codes to the end of src/models/oauthclients.ts.

```js
oauthClients.register(
  new ClientRegistry(new URL('https://mozassist.sogaani.com/allow'),
    'hoge', // Client ID
    'Hello',
    'hoge', // Client Secret
    'readwrite')
);
```

The Client ID and The Client Secret must change to string that others do not know.

## Known issues

* Things Gateway =< 3.1. After logging into the Things Gateway, it can not redirect to the authentication screen. [See issue](https://github.com/mozilla-iot/gateway/issues/779). In the second access from mozassistant to the Things Gateway, the authentication screen is displayed.

