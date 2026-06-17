// .vitepress/theme/index.js
import { nextTick, onMounted, watch } from "vue";
import { useRoute } from "vitepress";
import DefaultTheme from "vitepress/theme";
import Home from "../components/Home.vue";
import Icon from "../components/Icon.vue";
import IconWrapper from "../components/IconWrapper.vue";
import mediumZoom from "medium-zoom";

import "medium-zoom/dist/style.css";
import "./custom.css"; // Import your custom variables here

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register global components here if needed
    app.component("Home", Home);
    app.component("Icon", Icon);
    app.component("IconWrapper", IconWrapper);
  },
  setup() {
    const route = useRoute();

    // Function to apply zoom to specific markdown images
    const initZoom = () => {
      // Targets all standard body images, excluding linked images
      mediumZoom(".vp-doc img:not(a img)", {
        background: "var(--vp-c-bg)", // Matches VitePress light/dark mode background
      });
    };

    onMounted(() => {
      initZoom();
    });

    // Watch the route path to re-bind zoom effects on page navigation
    watch(
      () => route.path,
      () => nextTick(() => initZoom()),
    );
  },
};
