# Log Event Endpoint

Records an action a visitor took, such as a click or a purchase.

## Endpoint Details

**Path:** `/split-test/log-event`
<br>**Method:** `POST`

### Payload

* **type** [string] – The event type. It should match the event type of a metric in your project.
* **value** [number] – The event's value. Use `1` to count occurrences, or an amount such as an order total for value-based metrics.
* **data** [object] – (Optional) Details about the visitor, merged into their session.

### Responses

| Status | Meaning |
| --- | --- |
| `201` | Request accepted. Returns `{ event_id, session_id }`. |
| `204` | The request came from a filtered IP address or, in production, a known bot, so nothing was logged. No body. |
| `400` | The payload is invalid. Returns `{ statusCode, error, reason? }`. |
| `500` | Server error. Returns `{ statusCode, error, reason? }`. |

::: info
A `201` doesn't guarantee the event was stored. Events for unknown or untracked metrics are dropped unless the project's [logging settings](/projects#settings) allow them.
:::

### Example Request

```js
const response = await fetch('https://mysplittytest.com/split-test/log-event', {
    method: 'POST',
    credentials: 'include',
    headers: {
        'Authorization': 'API-Key YOUR_API_KEY',
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        type: 'cta_click',
        value: 1,
        data: { day_part: 'weekday' },
    }),
});

if (response.status === 201) {
    const { event_id } = await response.json();
}
```
