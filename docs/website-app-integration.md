# Website/App Integration

This is a short guide to help you get Splitty Test set up on a website or app. In the example below, we assume you are installing Splitty test on a simple website that can make external requests to a third-party API server (Splitty Test).

## Create an API Key to Integrate with Your Site or App

You'll need an API key to make requests to your Splitty Test server. Each API key is unique to each website or app you want to run tests on. Generate a new API key to integrate Splitty Test with your website or app.

1. Log into your Splitty Test web app.
2. Click on the "Settings" link in the main navigation.
3. Click the "API Keys" tab.
4. Click the "New API Key" button in the upper right corner.
5. Configure and save the new API key.

> When you save the API key, a window will pop up that will show you the API key *once and only once*. It is important that you copy and save the API key somewhere so when you complete the integration you have it on hand. If you lose the API key, you can generate a new one, but doing so will invalidate any requests using the old API key.

## Add the Test Participation Code to Your Website or App

The test participation code will make a request to your Splitty Test server and return JSON data that you will use to update your website or app in real time. Using the API key you generated, make an HTTP request to your Splitty Test server's participation endpoint. You will send data about the user in the body of the request. This data is used to help segment users and can provide additional useful insights about your tests.

We will use the native fetch API for making the request...

```TS
async function getTestData(section_name: string, data?: object) {
    const splitty_test_url = 'https://YOUR_SPLITTY_TEST_URL/split-test/participate';
    const payload = { data };

    try {
        // Make the request to the participate endpoint
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'API-Key YOUR_API_KEY',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload);
        });

        // Parse the response
        if (response.ok) {
            throw new Error('Unable to get test data!');
        }
        const response_data = await response.json();

        /*
        response_data will look like the following...
        {
            test_id: '01KSXYNW6K2WSPV9MJQJC2RNED',
            variation: {
                id: '01KSXYNW6K2WSPV9MJQJC2RNED-B',
                data: {
                    label: 'Get Started Free!'
                }
            },
            session_id: '01KSXYRBXYSGXN4WR3XAZT8BQN'
        }
        */

        // Return the test data
        return response_data;
    } catch(err) {
        // Return null if here was an error
        return null;
    }
}

async function runCTAButtonTest() {
    // Get the test data
    const test_data = await getTestData('cta_button', {
        device: 'mobile',
        region: 'north_america'
    });

    if (test_data) {
        const cta_button = document.getElementById('cta-button');
        if (cta_button && test_data.variation.data.label) {
            // Update the button label
            cta_button.textContent = test_data.variation.data.label;
        }
    }
}
```

<Icon type="&#xe88e" color="green" size="20px" class="mr-1!" /> See the [Participate API Request](/participate) reference for more details.

## Log Events When Users Do Something Notable

In order to see if the changes we are testing are affecting user behaviors, we'll need to log events for every important action a user makes. For example, if the user clicks the CTA button, we'll send another request to the Splitty Test serve to let it know.

```TS
// Create a function to log a user action
async function logUserAction(event_name: string, data?: object) {
    const splitty_test_url = 'https://YOUR_SPLITTY_TEST_URL/split-test/log';
    // Optionally, you can send additional data about the user with each request and it will get saved to their user session
    const payload = data || {};

    try {
        // Make the request to the participate endpoint
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'API-Key YOUR_API_KEY',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...payload,
                event: event_name // Pass the event name in the body as the 'event' property
            });
        });

        // Parse the response
        if (response.ok) {
            throw new Error('Unable to log the event!');
        }
        const response_data = await response.json();

        /*
        response_data will look like the following...
        {
            event_id: '01KSXZNBD3FDE6249GQVFWTFHW'
        }
        */
    } catch(err) {
        // Return null if here was an error
        console.warn('Unable to log the event!');
    }
}

// Add the function to the CTA button
document.getElementById('cta-button')
    .addEventListener('click', async () => {
        await logUserAction('cta_click');
    });
```

<Icon type="&#xe88e" color="green" size="20px" class="mr-1!" /> See the [Log Event API Request](/log-event) reference for more details.