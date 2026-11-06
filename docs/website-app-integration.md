# Website/App Integration

This guide connects a website to Splitty Test using plain `fetch` calls. If your site uses JavaScript, the [Splitty Test Client](/splitty-test-client) does this for you.

You'll need an API key for your project. See [Create an API Key](/authentication#create-an-api-key).

::: tip Keep the session
Splitty Test links a visitor's events to the variation they saw through a session cookie. Send requests with `credentials: 'include'` so the browser keeps that cookie between calls.
:::

## Request a Variation

When a visitor reaches a section you're testing, call the participate endpoint. Put details about the visitor in `data`. They're used for audience filtering and segmentation.

```ts
const SPLITTY_TEST_URL = 'https://YOUR_SPLITTY_TEST_URL';
const API_KEY = 'YOUR_API_KEY';

async function getTestData(section_id: string, data: object = {}) {
    try {
        const response = await fetch(`${SPLITTY_TEST_URL}/split-test/participate`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Authorization': `API-Key ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ section_id, data }),
        });

        // 204 means there's no active test for this section
        if (!response.ok || response.status === 204) {
            return null;
        }

        // { test_id, variation: { id, data }, session_id }
        return await response.json();
    } catch (err) {
        return null;
    }
}

async function runCTAButtonTest() {
    const test_data = await getTestData('cta_button', {
        device: 'mobile',
        region: 'north_america',
    });

    const label = test_data?.variation?.data.label;
    const cta_button = document.getElementById('cta-button');
    if (cta_button && label) {
        cta_button.textContent = label;
    }
}
```

<Icon type="&#xe88e" color="green" size="20px" class="mr-1!" /> See the [Participate endpoint](/participate) reference for details.

## Log Events

To measure a variation's effect, log an event whenever a visitor does something you care about, such as clicking the CTA button.

```ts
async function logEvent(type: string, value = 1, data?: object) {
    try {
        const response = await fetch(`${SPLITTY_TEST_URL}/split-test/log-event`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Authorization': `API-Key ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type, value, data }),
        });

        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }
    } catch (err) {
        console.warn('Unable to log the event', err);
    }
}

document.getElementById('cta-button')?.addEventListener('click', () => {
    logEvent('cta_click');
});
```

`type` should match a metric's event type. Use a `value` of `1` to count occurrences, or a number such as an order total for value-based metrics.

<Icon type="&#xe88e" color="green" size="20px" class="mr-1!" /> See the [Log Event endpoint](/log-event) reference for details.
