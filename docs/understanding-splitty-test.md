# Understanding Splitty Test

Splitty Test decides what each visitor sees, then records what they do afterward.

## How a Split Test Works

Say you want to try a new label on the call-to-action (CTA) button on your home page:

1. **Create a test** with two variations: the **control** (your current label) and a **new variation** with the label you want to try.
2. **Request a variation.** When someone visits the page, your site asks Splitty Test which variation to show. Splitty Test picks one and returns its data, and your site updates the button label.
3. **Log what happens.** If the visitor clicks the button, your site sends an event to Splitty Test.
4. **Compare.** Splitty Test tallies which variation each visitor saw and what they did, so you can see whether the new label gets more clicks.

## What Splitty Test Does (and Doesn't) Do

Splitty Test is a split testing system, not a web development platform. Testing changes to data on your site, like a headline or an image URL, is quick. Bigger changes, such as a redesigned component, need some development work on your side.

The examples below use `st`, an instance of the [Splitty Test Client](/splitty-test-client).

### <IconWrapper color="brand"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 5H5v14h14V5zm-5 12h-2V9h-2V7h4v10z" opacity=".3"/><path d="M5 21h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2zM5 5h14v14H5V5zm5 4h2v8h2V7h-4z"/></svg></IconWrapper>Example: Changing a Headline

Request a variation on page load and insert the returned headline:

```html
<script>
(async () => {
    const { variation } = await st.participate('headline', { ...user_data });

    if (variation?.data.headline) {
        document.getElementById('headline').innerText = variation.data.headline;
    }
})();
</script>
```

If no test is running, `variation` is `null` and the page keeps its default headline. Leave `headline` empty in the control variation's data and the control keeps the default too.

### <IconWrapper color="brand"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 5H5v14h14V5zm-4 6c0 1.11-.9 2-2 2h-2v2h4v2H9v-4c0-1.11.9-2 2-2h2V9H9V7h4c1.1 0 2 .89 2 2v2z" opacity=".3"/><path d="M5 21h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2zM5 5h14v14H5V5zm8 2H9v2h4v2h-2c-1.1 0-2 .89-2 2v4h6v-2h-4v-2h2c1.1 0 2-.89 2-2V9c0-1.11-.9-2-2-2z"/></svg></IconWrapper>Example: Swapping a Vue Component

To test entirely different components, build each one and choose between them based on the variation data:

```vue
<template>
    <div class="page">
        <component :is="home_page_component" />
    </div>
</template>

<script setup>
import { ref } from 'vue';
import ControlVariation from './control.vue';
import VariationB from './variation-b.vue';
import VariationC from './variation-c.vue';

const component_map = { ControlVariation, VariationB, VariationC };

const home_page_component = ref(ControlVariation);
const { variation } = await st.participate('home_page', { ...user_data });

if (variation?.data.component) {
    home_page_component.value = component_map[variation.data.component];
}
</script>
```
