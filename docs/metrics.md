# Metrics

A **metric** turns the events your site logs into a number you can compare across variations, such as click-through rate or average order value. Every split test needs one decision metric, and it can track others alongside it.

Each metric belongs to one project and listens for one event type. When your code logs an event with that `type`, it counts toward the metric.

## Creating a Metric

1. Click **Metrics** in the main navigation.
2. Click **New Metric** in the upper-right corner.
3. Fill out the form and click **Save Metric**.

You need the `tester` or `admin` role to create or edit metrics.

## Metric Form Fields

* **Project** – The project the metric belongs to.
* **Name** – A clear name, e.g. "CTA Clicks".
* **Description** – (Optional) What the metric measures.
* **Event Type** – The event `type` this metric counts, e.g. `cta_click`. Lowercase letters, numbers and underscores. It must match what your code sends to [Log Event](/log-event).
* **Strategy** – How event values are combined:

  | Strategy | Calculation | Typical use |
  | --- | --- | --- |
  | Rate | Sum of values ÷ total count | Conversion or click-through rate |
  | Sum | Total of all values | Total revenue |
  | Average | Mean value across events | Average order value |
  | Median | Middle value across events | Typical order value, ignoring outliers |

* **Session Event Strategy** – What to do when one session logs the event more than once:

  | Option | Behavior |
  | --- | --- |
  | All Events | Count every event and add up their values |
  | First Event | Count one event per session, using the first value |
  | Last Event | Count one event per session, using the last value |
  | Unique Sum | Count one event per session, using the sum of its values |
  | Unique Average | Count one event per session, using the average of its values |
  | Unique Median | Count one event per session, using the median of its values |

  For a conversion rate, **First Event** stops a visitor who clicks five times from counting as five conversions.

* **Display As** – Percent, Number or Currency. Affects reporting only.
* **Result Sorting** – Whether a **larger** or **smaller** value is better. Use "smaller" for things like bounce rate or load time.
* **Default Value** – The value used when an event is logged without one.
* **Idle Logging** – Keep logging this event for visitors who weren't served a test. This builds the baseline described in [Learn More](/learn-more#simple-flexible-data-insights).
* **Idle Logging Percentage** – The share of those events to keep, as a sample. Lower values save storage on busy sites.

## Exploring a Metric

From the metrics list you can explore a metric's data over time and break it down by the data properties your sessions carry. This is useful for spotting trends before and after a test.
