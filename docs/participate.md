# Participate Endpoint

The participate endpoint checks for active tests in the Splitty Test system for the given section and returns a selected variation.

## Endpoint Details

**Path:** `/split-test/participate`
<br>**Method:** `POST`

**Payload:**
* **section_id:** [string] - The ID of the section to return a test for.
* **data:** [object] - A plain object with details about the user. This will be added to the user session and is used when determining audience filters and user segments.
* **test_id:** [string] - (Optional) The ID of a test to force upon the user.
* **variation_id:** [string] - (Optional) The ID of a variation to force upon a user. This is useful when displaying a preview of the test variation.
* **ignore:** [boolean] - (Optional) When forcing a test or variation, the system will ignore session logging and updates. Set this to `false` to log or update the session.

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
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">There are no active tests for the given section</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">200</td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);"><pre class="text-xs">
{
    test_id: null;
    variation: null;
    session_id: string;
}</pre></td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">Selecting a test was skipped or no test was selected for the given section</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">200</td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">
            <pre class="text-xs">
{
    test_id: null;
    variation: {
        id: string;
        data: Record&lt;string, any&gt;;
    };
    session_id: string;
}</pre>
        </td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">A variation was forced and returned for the given section</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">200</td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">
            <pre class="text-xs">
{
    test_id: string;
    variation: {
        id: string;
        data: Record&lt;string, any&gt;;
    };
    session_id: string;
}</pre>
        </td>
        <td style="padding: 12px; border: 1px solid var(--vp-c-divider);">A test and variation were selected and returned for the given section</td>
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