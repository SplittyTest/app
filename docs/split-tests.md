# Split Tests

A **split test** serves different variations of a section to visitors and measures which one performs best on your decision metric. For a walkthrough of your first test, see the [Quick Start](/quick-start).

Before creating a test, you need a [project](/projects) with at least one section and a [metric](/metrics). You need the `tester` or `admin` role to create, edit or run tests.

## Creating a Test

1. Click **Split Tests** in the main navigation.
2. Click **New Split Test** in the upper-right corner.
3. Work through each section of the form below, then click **Save Test**.

New tests start as **Pending** and don't serve traffic until you start them.

## Test Form

### Details

* **Split Test Name** – A unique, descriptive name.
* **Description** – (Optional) What you're testing and why.
* **Project** and **Section** – Where the test runs.

### Audiences

Choose **Included Audiences** and **Excluded Audiences**. With none selected, the test serves all traffic. See [Audiences](/audiences#how-audiences-apply-to-a-test).

### Metrics

* **Decision Metric** – The one metric the test is judged on. Auto-optimized tests use it to pick the best variation.
* **Other Tracked Metrics** – Extra metrics shown in the results to catch side effects. They don't affect the outcome.

### Variations

Every test starts with a control variation (ID ending in `-A`), which can be edited but not deleted. Click **Add Variation** for each alternative. Each variation has:

* **Description** – What's different about it.
* **Variation Data** – The JSON returned to your site. It starts from the section's data template.
* **Variation Frequency** – How often it's shown relative to the others.
* **Status** – Active, Paused or Archived. Only active variations are served.

Use the preview button to open the section's [Preview URL](/projects#previewing-variations) with this variation.

### Strategy

* **Standard** – Splits traffic between variations by their frequency for the whole test. You read the results and decide.
  * **Target Confidence Interval** – 70%, 80%, 90%, 95% or 99%. The point at which a variation is marked as confident. See [What Is Confidence?](/analyzing-data#what-is-confidence)
* **Auto-Optimize** – Shifts traffic toward better-performing variations as data comes in.
  * **Target Confidence Interval** – How sure Splitty Test must be that a variation trails the leader before pausing it.
  * **Rolling Window** – How many recent views or days to base decisions on, so the test adapts if performance changes over time.
  * **Exploration Percentage** – The share of traffic still sent to trailing variations, so they get a chance to recover.
  * **Exploration Threshold (Confidence)** – How sure Splitty Test must be that a variation trails before moving it into exploration mode, where it only gets exploration traffic.

### Data Calculation

* **Segmentation** – Up to three data properties (e.g. `device`) to calculate results for separately. Auto-optimized tests optimize each segment independently. Fewer segments, with fewer possible values, reach significance faster.
* **Minimum Calculation Interval** – The minimum number of seconds between recalculations. Higher values reduce server load.
* **Minimum Required Views** – Views needed before results are treated as reliable.
* **Expected Decision Metric Rate** – Your metric's typical value. It's used to smooth early results; see [Data Smoothing](/analyzing-data#data-smoothing).

### Safeguards

* **Auto-Pause Variations** – Let Splitty Test pause a variation that's badly underperforming.
  * **No Conversions Threshold** – Pause a variation that reaches this many views with no conversions.
  * **Losing Percentage Threshold** – Pause a variation that's losing to the control by this much or more.

Safeguards can be changed while a test runs. Audiences, Metrics, Variations, Strategy and Data Calculation are locked once a test starts, to protect the integrity of the results.

## Running a Test

| Status | Meaning | Available actions |
| --- | --- | --- |
| Pending | Created but not serving traffic | Start, Edit, Archive |
| Active | Serving traffic and collecting data | Pause, Stop |
| Paused | Not serving traffic; data is kept | Resume, Stop |
| Complete | Finished, with an outcome recorded | Archive |
| Archived | Hidden from the main list | Unarchive (back to Complete), Delete |

Starting a test fails if the project or section has reached its **Max Concurrent Tests** limit.

When you stop a test, record its **outcome** (Win, Loss or Discard) and any notes. Over time this builds a history of what you've learned.

To run a similar test, use **Duplicate Test**. It copies the settings into a new pending test you can edit freely.

## Test Details Page

Open a test to see its results chart and data table (see [Analyzing Data](/analyzing-data)). From here you can also:

* **Explore Metrics** to compare variations on any tracked metric.
* View a variation's data, preview it, or pause it.
* Add **comments** to keep notes and discussion with the test.
