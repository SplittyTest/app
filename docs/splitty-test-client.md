---
outline:
  level: [2, 4]
---

# Splitty Test Client

The official [Splitty Test client library](https://www.npmjs.com/package/@splittytest/client) wraps the API for JavaScript and TypeScript projects.

## Installation

```bash
npm install @splittytest/client
```

## Usage

```js
import SplittyTest from '@splittytest/client';

const st = new SplittyTest('YOUR_API_KEY', { host: 'https://mysplittytestapi.com' });

// Get a variation for a section
const { variation } = await st.participate('section_name', { ...user_data });

// Log an event
const { event_id } = await st.logEvent('event_name', 1, { ...user_data });
```

## Class Methods

### Constructor

<div class="mono nowrap">new SplittyTest(api_key: string, options: SplittyTestOptions)</div>

The API key sets the project for every request.

**Arguments**
* **api_key** [string] – An API key from the Splitty Test dashboard.
* **options.host** [string] – The URL of your Splitty Test API.
* **options.defaults** [object] – (Optional) Data added to the visitor data of every request.

---

### participate

```ts
st.participate(section: string, data?: object, options?: object): Promise<SplitTestInfo>;
```

Places the visitor in a test for the section and returns their variation. If they're already in a test for that section, the same variation is returned.

**Arguments**
* **section** [string] – The section ID.
* **data** [object] – (Optional) Visitor data saved to their session. Used for audience filters, traffic filters and segments.
* **options.test_id** [string] – (Optional) Force a specific test.
* **options.variation_id** [string] – (Optional) Force a specific variation, for previews.

**Returns**
* **test_id** [string | null] – The selected test, or `null` if there's no active test, the visitor was skipped or filtered out, or a variation was forced.
* **variation** [object | null] – The selected variation, or `null` if none was selected.
* **variation.id** [string] – The variation ID.
* **variation.data** [object] – The variation's data.
* **session_id** [string] – The visitor's session ID.

If there's no active test for the section, the API responds with `204` and no data.

```json
{
    "test_id": "01KT63HN900NKPAN8RJB9NHNF6",
    "variation": {
        "id": "01KT63HN900NKPAN8RJB9NHNF6-B",
        "data": {
            "headline": "Lorem Ipsum Dolor Sit Amet!"
        }
    },
    "session_id": "01KT63K3DKMARFPWHANP444V8T"
}
```

---

### logEvent

```ts
st.logEvent(event: string, value: number, data?: object): Promise<{ event_id: string; session_id: string }>;
```

Logs an action the visitor took.

**Arguments**
* **event** [string] – The event type.
* **value** [number] – Use `1` to count occurrences, or an amount for value-based metrics (e.g. `42.75` for a $42.75 purchase).
* **data** [object] – (Optional) Visitor data saved to their session.

**Returns**
* **event_id** [string] – The logged event's ID.
* **session_id** [string] – The visitor's session ID.
