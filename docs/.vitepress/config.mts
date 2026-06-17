import { defineConfig, postcssIsolateStyles } from "vitepress";
import tailwindcss from "@tailwindcss/vite";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/",
  title: "Splitty Test",
  description: "A dead simple platform for split testing websites and apps",
  lastUpdated: true,
  themeConfig: {
    logo: "/splitty-test-logo.svg",
    siteTitle: false,

    search: {
      provider: "local",
      options: {
        detailedView: true,
      },
    },

    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Docs", link: "/getting-set-up" },
    ],

    sidebar: [
      {
        text: "About Splitty Test",
        collapsed: false,
        items: [
          { text: "Learn More", link: "/learn-more" },
          { text: "Road Map", link: "/road-map" },
        ],
      },
      {
        text: "Deploying Splitty Test",
        collapsed: false,
        items: [
          {
            text: "Getting Set Up",
            link: "/getting-set-up",
            // collapsed: true,
            // items: [{ text: "Elestio", link: "/elestio-set-up" }],
          },
          { text: "Upgrading", link: "/upgrading" },
        ],
      },
      {
        text: "Running Splitty Tests",
        collapsed: false,
        items: [
          {
            text: "Understanding Splitty Test",
            link: "/understanding-splitty-test",
          },
          { text: "Quick Start", link: "/quick-start" },
          {
            text: "Website/App Integration",
            link: "/website-app-integration",
          },
          { text: "Analyzing Data", link: "/analyzing-data" },
        ],
      },
      {
        text: "Reference",
        collapsed: false,
        items: [
          { text: "Splitty Test Client", link: "/splitty-test-client" },
          {
            text: "API Endpoints",
            collapsed: true,
            items: [
              { text: "Authentication", link: "/authentication" },
              { text: "Participate", link: "/participate" },
              { text: "Log Event", link: "/log-event" },
            ],
          },
          {
            text: "App Sections",
            collapsed: true,
            items: [
              { text: "Subjects", link: "/subjects" },
              { text: "Metrics", link: "/metrics" },
              { text: "Audiences", link: "/audiences" },
              { text: "Split Tests", link: "/split-tests" },
              { text: "API Keys", link: "/api-keys" },
              { text: "Webhooks", link: "/webhooks" },
              { text: "Users", link: "/users" },
              { text: "Misc Settings", link: "/misc-settings" },
            ],
          },
        ],
      },
      {
        text: "Other Information",
        collapsed: false,
        items: [
          { text: "License (STSL 1.0)", link: "/license" },
          { text: "Partnering With Us", link: "/partnering-with-us" },
          { text: "Contributing", link: "/contributing" },
        ],
      },
    ],

    outline: {
      level: [2, 3],
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/SplittyTest/app",
      },
      {
        icon: "docker",
        link: "https://hub.docker.com/r/splittytest/splittytest",
      },
    ],
  },

  plugins: [
    postcssIsolateStyles({
      includeFiles: [/vp-doc\.css/], // Isolates styles within documentation content
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});
