# Log Event Endpoint

The log event endpoint saves a log of a user action on the site.

## Endpoint Details

**Path:** `/split-test/log-event`
<br>**Method:** `POST`

**Payload:**
* **type:** [string] - The slug for the event type that occurred.
* **value:** [number] - The value to assign the user action. When logging a simple event rate, this value is typically `1`, but for an event like a purchase, you may want to put the purchase total or number of products purchased.
* **data:** [object] - A plain object with details about the user. This will be appended to the user session.

### Return Values

<div style="width: 100%; overflow-x: auto;">
  <table style="width: 100%; border-collapse: collapse;">
    <thead>
      <tr style="background-color: var(--vp-c-bg-soft);">
        <th style="padding: 12px; border: 1px solid var(--vp-c-divider); text-align: left;">Status</th>
        <th style="padding: 12px; border: 1px solid var(--vp-c-divider); text-align: left;">Data Type</th>
        <th style="padding: 12px; border: 1px solid var(--vp-c-divider); text-align: left;">Reason</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">204</td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">(Empty)</td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">There was no error but no event was logged due to filters or ome other reason</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">201</td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);"><pre class="text-xs">
{
    event_id: string;
    session_id: string;
}</pre></td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">The event was successfully logged</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">400</td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);"><pre class="text-xs">
{
    statusCode: number;
    error: string;
    reason?: string;
}</pre>
        </td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">There was a problem with the payload you sent to the endpoint</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">500</td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);"><pre class="text-xs">
{
    statusCode: number;
    error: string;
    reason?: string;
}</pre>
        </td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">There was a problem on the server or an unknown error occured</td>
      </tr>
    </tbody>
  </table>
</div>

### Example Request

```js
// We will use fetch for the example
// Make the request to the participate endpoint
const response = await fetch('https://mysplittytest.com/split-test/participate', {
    method: 'POST',
    headers: {
        'Authorization': 'API-Key YOUR_API_KEY',
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        section_id: 'cta_button',
        data: {
            day_part: 'weekday'
        }
    });
});

// Parse the response
if (response.ok) {
    throw new Error('Unable to get test data!');
}
const { variation } = await response.json();

// Apply the variation data where needed...
const cta_button = document.getElementById('cta-button');
if (cta_button && variation.data.label) {
    cta_button.textContent = variation.data.label;
}
```