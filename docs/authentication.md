# API Authentication

Every request to the Splitty Test API is authenticated with an API key. Each key belongs to one project, and every request made with it is assigned to that project. You'll need a user with the `tester` or `admin` role.

### Create a Project

If you don't have one yet, [create a project](/projects#creating-a-project) for the website or app you're testing.

### Create an API Key

1. Click **Settings** in the main navigation, then the **API Keys** tab.
2. Click **New API Key** in the upper-right corner.
3. Fill out the form and click **Save**.
   * To allow requests from any IP address, add `0.0.0.0/0` to the IP whitelist (not recommended).
   * To allow requests from any domain, add `*` to the domain whitelist (not recommended).

The full key is shown **only once**, right after you save. Copy it somewhere safe. If you lose it, you can generate a new key, but the old one stops working.

### Use the API Key

Send the key in the `Authorization` header, prefixed with `API-Key` and a space:

```js
const response = await fetch('https://mysplittytestapi.com/split-test/participate', {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'API-Key YOUR_API_KEY',
    },
    body: JSON.stringify(payload),
});
```

Include `credentials: 'include'` so the browser keeps the session cookie that links a visitor's events to their variation.
