---
outline:
  level: [2, 4]
---

# Splitty Test Client

The official [Splitty Test client library](https://www.npmjs.com/package/@splittytest/client) is available through NPM and is easy to use.

## Installation

#### NPM
Install the Splitty Test client library as a dependency.

```bash
npm install @splittytest/client
```

## Usage

Initialize the `SplittyTest` class.
```js
import SplittyTest from '@SplittyTest/client';

const api_key = 'st-52d6c63d-OLiaQiS8BuaFcAEllx6MeOX0enjSpvEM575HOZCC8';
const st = new SplittyTest(api_key, { host: 'https://mysplittytestapi.com' });
```

Participate in a split test.
```js
const { variation } = st.participate('section_name', { ...user_data });
```

Log an event.
```js
const { event_id } = st.logEvent('event_name', { ...user_data });
```

## Class Methods

### Constructor
Create a new instance of the SplittyTest class. The API key that is used will determine the test subject for all requests.
<div class="mono nowrap">SplittyTest(api_key: string, options: SplittyTestOptions): void</div>

**Arguments**
* **api_key** [string] - A subject-specific API key generated from the Splitty Test dashboard.
* **options** [SplittyTestOptions] - Additional options for the SplittyTest instance.
* **options.host** - The URL of the Splitty Test API you are making requests to.
* **options.defaults** [object] - (Optional) An object containing data that will be appended to the user data of every request sent to the SplittyTest API.

---

### Participate
Mark the current user as a participant in a test for the given section. If the user has already participated in a test for the section, the previously returned data will be returned.
```ts
SplittyTest.participate(section: string, data?: object, options?: object): Promise<SplitTestInfo>;
```

**Arguments**
* **section** [string]: The section of the subject to participate in a test for.
* **data** [object] - (Optional) Data to append to the user's session. This data is used to track information about each user, apply test traffic and audience filters, and is used as the underyling options for test segmentation.
* **options** [object] - (Optional) Additional options to send to the participate endpoint.
* **options.test_id** - (Optional) A test_id to force the user to see.
* **options.variation_id** - (Optional) A variation_id to force the user to see. This is useful for previewing variations.

**Return Value** [JSON Object] - The method will return a JSON object containing information about the test and variation that was selected for the user. If there are no active tests for the section, an empty response with status `204` will return.

* **test_id** [string | null] - The ID of the test that was selected for the user or `null` if there are no active test, the test engine decided to skip this user, the user was filtered out, or a variation was forced.
* **variation** [object | null] - Information about the variation that was selected for the user or `null` if no variation was selected.
* **variation.id** [string] - The ID of the variation that was selected for the user.
* **variation.data** [object] - The data associated with the variation.
* **session_id** [string] - The user's session ID.

```json
// Example return value
{
    "test_id": "01KT63HN900NKPAN8RJB9NHNF6",
    "variation": {
        "id": "01KT63HN900NKPAN8RJB9NHNF6-B",
        "data": {
            "headline": "Lorem Ipsom Dolor Sit Amet!"
        }
    },
    "session_id": "01KT63K3DKMARFPWHANP444V8T"
}
```
---
### Log Event
Log an event that was trigger by the user.
<div class="mono nowrap">SplittyTest.logEvent(event: string, value: number, data?: object ): Promise&lt;{ id: string }&gt;</div>

**Arguments**
* **event** [string]: The ID (type) of the event that was triggered.
* **value** [number]: The numeric value for the event. To track event rate, this should be set to `1`. For tracking things like average purchase price, you would enter the monetary value here (e.g. `42.75` for a purchase worth $42.75).
* **data** [object] - (Optional) Data to append to the user's session. This data is used to track information about each user, apply test traffic and audience filters, and is used as the underyling options for test segmentation.

**Return Value** [JSON object] - The method will return a JSON object containing the event ID and session ID.

* **event_id** [string | null] - The ID of the logged event.
* **session_id** [string | null] - The ID of the user session.