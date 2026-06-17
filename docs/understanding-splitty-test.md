# Understanding Splitty Test

Splitty Test is a simple split testing system. It sends data to help determine what a website visitor or app user sees, then collects information about what they did after they saw it.

## Split Testing Overview 

Let's say you want to test two labels on the call-to-action button on your website's home page. You would create a test in Splitty Test with two different variations of the button label. One version would be the "control" variation and would just show what is already being used on the button. The other version would be a new variation with a label you want to test.

When the visitor visits your home page, your website makes a call to the Splitty Test server with some information about the visitor and that you want to have them participate in a split test. Splitty Test decide which version that user will see and returns the data for that variation. When your website receives that information, it updates the label on the button with the information that was returned.

Let's say the user then clicks on the call-to-action button. When this happens, your website would send another request to the Splitty Test server to let it know that action took place. For every visitor that is served a test variation, some will click the button and some will not. Splitty Test tallies up all the information about what version each visitor saw and what actions they took after seeing it.

We can now determine if the change to the label we are testing results in more vistors clicking that button!

**So to makes things simple:**
* When making changes to your website or app, you set up a test in Splitty Test to help you determine if those changes are driving positive user behaviors.
* Splitty Test helps you determine which version each user will see in real-time.
* Splitty Test collects data about the behaviors your users take after seeing a variation.
* Splitty Test compiles the information and displays it in a format that is easy to understand so you can make clear decisions about how to improve your site or app's performance.

## Split Test Deployment Methodology

Splitty Test focuses on being a split test system. Splitty Test is not a web development platform and doesn't try to be one. With Splitty Test, you can quickly create tests that make changes to underlying data on your website or app--like changing a headline or image url--but more complex changes require some underlying dev work on your end.

### <IconWrapper color="brand"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 5H5v14h14V5zm-5 12h-2V9h-2V7h4v10z" opacity=".3"/><path d="M5 21h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2zM5 5h14v14H5V5zm5 4h2v8h2V7h-4z"/></svg></IconWrapper>Example One: Changing a Headline

To test a headline change on my website, I would create a call to the Splitty Test API on page load, then insert the returned data into the headline similar to the following:

```HTML
<script language="javascript">
(async () => {
    const { variation } = await SplittyTest.participate('headline', { ...user_data });
    
    if (variation && variation.data.headline) {
        window.document.getElementById('headline').innerText = variation.data.headline;
    }
})();
</script>
```

If a test isn't running, the variation will be null and the default text will remain. Alternatively, if the control variation was returned, I could leave the headline null or blank to use the current text.

### <IconWrapper color="brand"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M19 5H5v14h14V5zm-4 6c0 1.11-.9 2-2 2h-2v2h4v2H9v-4c0-1.11.9-2 2-2h2V9H9V7h4c1.1 0 2 .89 2 2v2z" opacity=".3"/><path d="M5 21h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2zM5 5h14v14H5V5zm8 2H9v2h4v2h-2c-1.1 0-2 .89-2 2v4h6v-2h-4v-2h2c1.1 0 2-.89 2-2V9c0-1.11-.9-2-2-2z"/></svg></IconWrapper>Example Two: Changing a Vue Component

If I'm using something like Vue to build my website and I want to test an entirely different component, I could do so by creating the two components 

```VUE
<template>
    <div class="page">
        <Component :is="home_page_component"/>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import ControlVariation from './control.vue';
import VariationB from './variation-b.vue';
import VariationC from './variation-c.vue';

const home_page_component = ref(ControlVariation);
const { variation } = await SplittyTest.participate('home_page', { ...user_data });

const component_map = {
    'ControlVariation': ControlVariation,
    'VariationB': VariationB,
    'VariationC': VariationC
}

if (variation && variation.data.component) {
    home_page_component.value = component_map[variation.data.component];
}
</script>
```