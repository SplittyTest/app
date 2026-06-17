# API Authentication

Authentication with the Splitty Test API is easy and will require a separate API-key for requests from each subject. You will need a user with at least `Tester` privileges to complete the steps below.

### Create a Subject

In the Splitty Test dashboard, first create a new subject that you will be running tests on. A subject can be a website or application.

1. Click on the "Subjects" link in the main menu.
2. Click the "New Test Subject" button in the upper-right corner.
3. Fill out the form and click the "Save" button.

### Create an API Key

Once a subject exists, you can create an API key for it. Any requests that are received using that API key will be assigned to the subject the API key is attached to.

1. Click on the "Settings" link in the main menu.
2. Click on the "API Keys" tab.
3. Click the "New API Key" button in the upper-right corner.
4. Fill out the API key form and click the "Save" button.
   * To allow all IPs for the API key, add `0.0.0.0/0` to the IP whitelist.
   * To allow all domains for the API key, add `*` to the domain whitelist.

When you save the API key, a window will show with the full API key. Make sure to copy the key and keep it on hand. This is the only time the API key will show. You can generate a new API key if you lose the full key, but doing so will invalidate the old one.

### Using the API Key

All requests made to the Splitty Test API from your website or application will be authenticated using the API key. Simply add the API key as a `Authorization` header on your requests. Make sure to prepend the API key with `API-Key`  when setting the `Authorization` header value (make sure there is a space between them).

```js
// Example using fetch 

const response = await fetch('https://mysplittytestapi.com/split-test/participate', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'API-Key st-35360708-w8I9kEV0oGRIbdRKyxycGCT4DHgRD44JVxU6zDSY9c'
    },
    body: JSON.stringify(payload)
})
```