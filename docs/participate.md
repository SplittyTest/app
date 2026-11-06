# Participate Endpoint

Finds an active test for a section and returns the variation the visitor should see. If the visitor has already been placed in a test for that section, they get the same variation again.

## Endpoint Details

**Path:** `/split-test/participate`
<br>**Method:** `POST`

### Payload

* **section_id** [string] – The section to get a test for. Lowercase letters, numbers and underscores.
* **data** [object] – Details about the visitor, saved to their session and used for audience filters and segments. Required; send `{}` if you have nothing to add.
* **test_id** [string] – (Optional) Force a specific test.
* **variation_id** [string] – (Optional) Force a specific variation, for previews. Forced variations are never recorded.
* **ignore** [boolean] – (Optional) Set to `true` to return a variation without recording the view.

A forced `test_id` or `variation_id` only works for tests in the API key's project.

### Responses

| Status | Meaning |
| --- | --- |
| `200` | Success. See the response body below. |
| `204` | No active test for this section, the forced variation isn't in your project, or (in production) the request came from a known bot. No body. |
| `400` | The payload is invalid. |
| `500` | Server error. |

**200 response body**

```ts
{
    test_id: string | null;   // null if the visitor wasn't placed in a test, or a variation was forced
    variation: {
        id: string;
        data: Record<string, any>;
    } | null;                 // null if the visitor wasn't placed in a test
    session_id: string | null; // null when a variation was forced
}
```

A visitor isn't placed in a test when they're filtered out by an audience or held out by the section's **Skip Test Frequency**. Treat a `null` variation the same as no test: show your default content.

**400 and 500 response body**

```ts
{
    statusCode: number;
    error: string;
    reason?: string;
}
```

### Example Request

```js
const response = await fetch('https://mysplittytest.com/split-test/participate', {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Authorization': 'API-Key YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        section_id: 'cta_button',
        data: { day_part: 'weekday' },
    }),
});

if (response.status === 200) {
    const { variation } = await response.json();
    const cta_button = document.getElementById('cta-button');

    if (cta_button && variation?.data.label) {
        cta_button.textContent = variation.data.label;
    }
}
```
