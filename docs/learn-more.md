# Splitty Test

::: warning Alpha
Splitty Test is in alpha. Use it at your own risk: we've worked to make it reliable, but there may be issues we haven't found or fixed yet.
:::

Splitty Test is a simple tool for testing ideas on your website or app. Your app asks it which variation to show, gets back plain JSON, and reports what the visitor does next.

## How Is Splitty Test Different?

Many split testing platforms make you build and edit pages inside their own editor. Splitty Test doesn't. It returns data values, your app decides how to render them, and the events you log show up in your dashboard. No visual editor and no extra workflows to learn.

## Core Features

### <IconWrapper color="brand"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><g><rect fill="none" height="24" width="24"/></g><g><g><path d="M19.03,3.56c-1.67-1.39-3.74-2.3-6.03-2.51v2.01c1.73,0.19,3.31,0.88,4.61,1.92L19.03,3.56z"/><path d="M11,3.06V1.05C8.71,1.25,6.64,2.17,4.97,3.56l1.42,1.42C7.69,3.94,9.27,3.25,11,3.06z"/><path d="M4.98,6.39L3.56,4.97C2.17,6.64,1.26,8.71,1.05,11h2.01C3.25,9.27,3.94,7.69,4.98,6.39z"/><path d="M20.94,11h2.01c-0.21-2.29-1.12-4.36-2.51-6.03l-1.42,1.42C20.06,7.69,20.75,9.27,20.94,11z"/><polygon points="7,12 10.44,13.56 12,17 13.56,13.56 17,12 13.56,10.44 12,7 10.44,10.44"/><path d="M12,21c-3.11,0-5.85-1.59-7.46-4H7v-2H1v6h2v-2.7c1.99,2.84,5.27,4.7,9,4.7c4.87,0,9-3.17,10.44-7.56l-1.96-0.45 C19.25,18.48,15.92,21,12,21z"/></g></g></svg></IconWrapper>Auto-Optimized Tests

Run tests on autopilot (sometimes called "multi-armed bandit" tests). As a variation pulls ahead, Splitty Test shows it to more visitors, so you get better results sooner without babysitting the test.

### <IconWrapper color="brand"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><g><path d="M0,0h24v24H0V0z" fill="none"/></g><g><g><rect height="5" opacity=".3" width="12" x="6" y="4"/><rect height="5" opacity=".3" width="12" x="6" y="15"/><path d="M18,2H6C4.9,2,4,2.9,4,4v5c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V4C20,2.9,19.1,2,18,2z M18,9H6V4h12V9z"/><path d="M18,13H6c-1.1,0-2,0.9-2,2v5c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2v-5C20,13.9,19.1,13,18,13z M18,20H6v-5h12V20z"/></g></g></svg></IconWrapper>Segmented Traffic

Compare how different groups respond, such as mobile vs. desktop or weekday vs. weekend visitors. You can add several segments to a test, but each one splits your data further, so keep the number small.

### <IconWrapper color="brand"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><g><rect height="14" opacity=".3" width="14" x="5" y="5"/><g><rect fill="none" height="24" width="24"/><g><path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M19,19H5V5h14V19z"/><rect height="5" width="2" x="7" y="12"/><rect height="10" width="2" x="15" y="7"/><rect height="3" width="2" x="11" y="14"/><rect height="2" width="2" x="11" y="10"/></g></g></g></svg></IconWrapper>Simple, Flexible Data Insights

Results are built from sessions and events. Each test has one decision metric, and you can track more metrics alongside it to spot side effects.

Splitty Test can also keep logging events when no test is running. That gives you a baseline, so you can measure how much each test actually improves things over time.
