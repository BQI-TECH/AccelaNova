// vite.config.js
import { defineConfig } from "file:///C:/xampp/htdocs/GEOTECH%20COMPANY%20PROJECTS/anything-llm/frontend/node_modules/vite/dist/node/index.js";
import { fileURLToPath, URL } from "url";

// postcss.config.js
import tailwind from "file:///C:/xampp/htdocs/GEOTECH%20COMPANY%20PROJECTS/anything-llm/frontend/node_modules/tailwindcss/lib/index.js";
import autoprefixer from "file:///C:/xampp/htdocs/GEOTECH%20COMPANY%20PROJECTS/anything-llm/frontend/node_modules/autoprefixer/lib/autoprefixer.js";

// tailwind.config.js
var tailwind_config_default = {
  darkMode: "class",
  content: {
    relative: true,
    files: [
      "./src/components/**/*.{js,jsx}",
      "./src/hooks/**/*.js",
      "./src/models/**/*.js",
      "./src/pages/**/*.{js,jsx}",
      "./src/utils/**/*.js",
      "./src/*.jsx",
      "./index.html",
      "./node_modules/@tremor/**/*.{js,ts,jsx,tsx}"
    ]
  },
  theme: {
    extend: {
      rotate: {
        "270": "270deg",
        "360": "360deg"
      },
      colors: {
        "black-900": "#141414",
        accent: "#3D4147",
        "sidebar-button": "#31353A",
        sidebar: "#25272C",
        "historical-msg-system": "rgba(255, 255, 255, 0.05);",
        "historical-msg-user": "#2C2F35",
        outline: "#4E5153",
        "primary-button": "var(--theme-button-primary)",
        "cta-button": "var(--theme-button-cta)",
        secondary: "#2C2F36",
        "dark-input": "#18181B",
        "mobile-onboarding": "#2C2F35",
        "dark-highlight": "#1C1E21",
        "dark-text": "#222628",
        description: "#D2D5DB",
        "x-button": "#9CA3AF",
        royalblue: "#065986",
        purple: "#4A1FB8",
        magenta: "#9E165F",
        danger: "#F04438",
        error: "#B42318",
        warn: "#854708",
        success: "#05603A",
        darker: "#F4F4F4",
        teal: "#0BA5EC",
        // Generic theme colors
        theme: {
          bg: {
            primary: "var(--theme-bg-primary)",
            secondary: "var(--theme-bg-secondary)",
            sidebar: "var(--theme-bg-sidebar)",
            container: "var(--theme-bg-container)",
            chat: "var(--theme-bg-chat)",
            "chat-input": "var(--theme-bg-chat-input)",
            "popup-menu": "var(--theme-popup-menu-bg)"
          },
          text: {
            primary: "var(--theme-text-primary)",
            secondary: "var(--theme-text-secondary)",
            placeholder: "var(--theme-placeholder)"
          },
          sidebar: {
            item: {
              default: "var(--theme-sidebar-item-default)",
              selected: "var(--theme-sidebar-item-selected)",
              hover: "var(--theme-sidebar-item-hover)"
            },
            subitem: {
              default: "var(--theme-sidebar-subitem-default)",
              selected: "var(--theme-sidebar-subitem-selected)",
              hover: "var(--theme-sidebar-subitem-hover)"
            },
            footer: {
              icon: "var(--theme-sidebar-footer-icon)",
              "icon-hover": "var(--theme-sidebar-footer-icon-hover)"
            },
            border: "var(--theme-sidebar-border)"
          },
          "chat-input": {
            border: "var(--theme-chat-input-border)"
          },
          "action-menu": {
            bg: "var(--theme-action-menu-bg)",
            "item-hover": "var(--theme-action-menu-item-hover)"
          },
          settings: {
            input: {
              bg: "var(--theme-settings-input-bg)",
              active: "var(--theme-settings-input-active)",
              placeholder: "var(--theme-settings-input-placeholder)",
              text: "var(--theme-settings-input-text)"
            }
          },
          modal: {
            border: "var(--theme-modal-border)"
          },
          "file-picker": {
            hover: "var(--theme-file-picker-hover)"
          },
          attachment: {
            bg: "var(--theme-attachment-bg)",
            "error-bg": "var(--theme-attachment-error-bg)",
            "success-bg": "var(--theme-attachment-success-bg)",
            text: "var(--theme-attachment-text)",
            "text-secondary": "var(--theme-attachment-text-secondary)",
            "icon": "var(--theme-attachment-icon)",
            "icon-spinner": "var(--theme-attachment-icon-spinner)",
            "icon-spinner-bg": "var(--theme-attachment-icon-spinner-bg)"
          },
          home: {
            text: "var(--theme-home-text)",
            "text-secondary": "var(--theme-home-text-secondary)",
            "bg-card": "var(--theme-home-bg-card)",
            "bg-button": "var(--theme-home-bg-button)",
            border: "var(--theme-home-border)",
            "button-primary": "var(--theme-home-button-primary)",
            "button-primary-hover": "var(--theme-home-button-primary-hover)",
            "button-secondary": "var(--theme-home-button-secondary)",
            "button-secondary-hover": "var(--theme-home-button-secondary-hover)",
            "button-secondary-text": "var(--theme-home-button-secondary-text)",
            "button-secondary-hover-text": "var(--theme-home-button-secondary-hover-text)",
            "button-secondary-border": "var(--theme-home-button-secondary-border)",
            "button-secondary-border-hover": "var(--theme-home-button-secondary-border-hover)",
            "update-card-bg": "var(--theme-home-update-card-bg)",
            "update-card-hover": "var(--theme-home-update-card-hover)",
            "update-source": "var(--theme-home-update-source)"
          },
          checklist: {
            "item-bg": "var(--theme-checklist-item-bg)",
            "item-bg-hover": "var(--theme-checklist-item-bg-hover)",
            "item-text": "var(--theme-checklist-item-text)",
            "item-completed-bg": "var(--theme-checklist-item-completed-bg)",
            "item-completed-text": "var(--theme-checklist-item-completed-text)",
            "item-hover": "var(--theme-checklist-item-hover)",
            "checkbox-border": "var(--theme-checklist-checkbox-border)",
            "checkbox-fill": "var(--theme-checklist-checkbox-fill)",
            "checkbox-text": "var(--theme-checklist-checkbox-text)",
            "button-border": "var(--theme-checklist-button-border)",
            "button-text": "var(--theme-checklist-button-text)",
            "button-hover-bg": "var(--theme-checklist-button-hover-bg)",
            "button-hover-border": "var(--theme-checklist-button-hover-border)"
          },
          button: {
            text: "var(--theme-button-text)",
            "code-hover-text": "var(--theme-button-code-hover-text)",
            "code-hover-bg": "var(--theme-button-code-hover-bg)",
            "disable-hover-text": "var(--theme-button-disable-hover-text)",
            "disable-hover-bg": "var(--theme-button-disable-hover-bg)",
            "delete-hover-text": "var(--theme-button-delete-hover-text)",
            "delete-hover-bg": "var(--theme-button-delete-hover-bg)"
          }
        }
      },
      backgroundImage: {
        "preference-gradient": "linear-gradient(180deg, #5A5C63 0%, rgba(90, 92, 99, 0.28) 100%);",
        "chat-msg-user-gradient": "linear-gradient(180deg, #3D4147 0%, #2C2F35 100%);",
        "selected-preference-gradient": "linear-gradient(180deg, #313236 0%, rgba(63.40, 64.90, 70.13, 0) 100%);",
        "main-gradient": "linear-gradient(180deg, #3D4147 0%, #2C2F35 100%)",
        "modal-gradient": "linear-gradient(180deg, #3D4147 0%, #2C2F35 100%)",
        "sidebar-gradient": "linear-gradient(90deg, #5B616A 0%, #3F434B 100%)",
        "login-gradient": "linear-gradient(180deg, #3D4147 0%, #2C2F35 100%)",
        "menu-item-gradient": "linear-gradient(90deg, #3D4147 0%, #2C2F35 100%)",
        "menu-item-selected-gradient": "linear-gradient(90deg, #5B616A 0%, #3F434B 100%)",
        "workspace-item-gradient": "linear-gradient(90deg, #3D4147 0%, #2C2F35 100%)",
        "workspace-item-selected-gradient": "linear-gradient(90deg, #5B616A 0%, #3F434B 100%)",
        "switch-selected": "linear-gradient(146deg, #5B616A 0%, #3F434B 100%)"
      },
      fontFamily: {
        sans: [
          "plus-jakarta-sans",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"'
        ]
      },
      animation: {
        sweep: "sweep 0.5s ease-in-out",
        "pulse-glow": "pulse-glow 1.5s infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out forwards",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite"
      },
      keyframes: {
        sweep: {
          "0%": { transform: "scaleX(0)", transformOrigin: "bottom left" },
          "100%": { transform: "scaleX(1)", transformOrigin: "bottom left" }
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 }
        },
        fadeOut: {
          "0%": { opacity: 1 },
          "100%": { opacity: 0 }
        },
        "pulse-glow": {
          "0%": {
            opacity: 1,
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(255, 255, 255, 0.0)",
            backgroundColor: "rgba(255, 255, 255, 0.0)"
          },
          "50%": {
            opacity: 1,
            transform: "scale(1.1)",
            boxShadow: "0 0 15px rgba(255, 255, 255, 0.2)",
            backgroundColor: "rgba(255, 255, 255, 0.1)"
          },
          "100%": {
            opacity: 1,
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(255, 255, 255, 0.0)",
            backgroundColor: "rgba(255, 255, 255, 0.0)"
          }
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-2px)" }
        }
      }
    }
  },
  variants: {
    extend: {
      backgroundColor: ["light"],
      textColor: ["light"]
    }
  },
  // Required for rechart styles to show since they can be rendered dynamically and will be tree-shaken if not safe-listed.
  safelist: [
    {
      pattern: /^(bg-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"]
    },
    {
      pattern: /^(text-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"]
    },
    {
      pattern: /^(border-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/,
      variants: ["hover", "ui-selected"]
    },
    {
      pattern: /^(ring-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/
    },
    {
      pattern: /^(stroke-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/
    },
    {
      pattern: /^(fill-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:50|100|200|300|400|500|600|700|800|900|950))$/
    }
  ],
  plugins: [
    function({ addVariant }) {
      addVariant("light", ".light &");
    }
  ]
};

// postcss.config.js
var postcss_config_default = {
  plugins: [tailwind(tailwind_config_default), autoprefixer]
};

// vite.config.js
import react from "file:///C:/xampp/htdocs/GEOTECH%20COMPANY%20PROJECTS/anything-llm/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import dns from "dns";
import { visualizer } from "file:///C:/xampp/htdocs/GEOTECH%20COMPANY%20PROJECTS/anything-llm/frontend/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_import_meta_url = "file:///C:/xampp/htdocs/GEOTECH%20COMPANY%20PROJECTS/anything-llm/frontend/vite.config.js";
dns.setDefaultResultOrder("verbatim");
var vite_config_default = defineConfig({
  base: "./",
  // Use relative paths for Electron compatibility
  assetsInclude: [
    "./public/piper/ort-wasm-simd-threaded.wasm",
    "./public/piper/piper_phonemize.wasm",
    "./public/piper/piper_phonemize.data"
  ],
  worker: {
    format: "es"
  },
  server: {
    port: 3e3,
    host: "localhost"
  },
  define: {
    "process.env": process.env
  },
  css: {
    postcss: postcss_config_default
  },
  plugins: [
    react(),
    visualizer({
      template: "treemap",
      // or sunburst
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: "bundleinspector.html"
      // will be saved in project's root
    })
  ],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
      },
      {
        process: "process/browser",
        stream: "stream-browserify",
        zlib: "browserify-zlib",
        util: "util",
        find: /^~.+/,
        replacement: (val) => {
          return val.replace(/^~/, "");
        }
      }
    ]
  },
  build: {
    rollupOptions: {
      output: {
        // These settings ensure the primary JS and CSS file references are always index.{js,css}
        // so we can SSR the index.html as text response from server/index.js without breaking references each build.
        entryFileNames: "index.js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "index.css")
            return `index.css`;
          return assetInfo.name;
        }
      },
      external: [
        // Reduces transformation time by 50% and we don't even use this variant, so we can ignore.
        /@phosphor-icons\/react\/dist\/ssr/
      ]
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  optimizeDeps: {
    include: ["@mintplex-labs/piper-tts-web"],
    esbuildOptions: {
      define: {
        global: "globalThis"
      },
      plugins: []
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAicG9zdGNzcy5jb25maWcuanMiLCAidGFpbHdpbmQuY29uZmlnLmpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxceGFtcHBcXFxcaHRkb2NzXFxcXEdFT1RFQ0ggQ09NUEFOWSBQUk9KRUNUU1xcXFxhbnl0aGluZy1sbG1cXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXHhhbXBwXFxcXGh0ZG9jc1xcXFxHRU9URUNIIENPTVBBTlkgUFJPSkVDVFNcXFxcYW55dGhpbmctbGxtXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi94YW1wcC9odGRvY3MvR0VPVEVDSCUyMENPTVBBTlklMjBQUk9KRUNUUy9hbnl0aGluZy1sbG0vZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiXG5pbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tIFwidXJsXCJcbmltcG9ydCBwb3N0Y3NzIGZyb20gXCIuL3Bvc3Rjc3MuY29uZmlnLmpzXCJcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIlxuaW1wb3J0IGRucyBmcm9tIFwiZG5zXCJcbmltcG9ydCB7IHZpc3VhbGl6ZXIgfSBmcm9tIFwicm9sbHVwLXBsdWdpbi12aXN1YWxpemVyXCJcblxuZG5zLnNldERlZmF1bHRSZXN1bHRPcmRlcihcInZlcmJhdGltXCIpXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBiYXNlOiAnLi8nLCAvLyBVc2UgcmVsYXRpdmUgcGF0aHMgZm9yIEVsZWN0cm9uIGNvbXBhdGliaWxpdHlcbiAgYXNzZXRzSW5jbHVkZTogW1xuICAgICcuL3B1YmxpYy9waXBlci9vcnQtd2FzbS1zaW1kLXRocmVhZGVkLndhc20nLFxuICAgICcuL3B1YmxpYy9waXBlci9waXBlcl9waG9uZW1pemUud2FzbScsXG4gICAgJy4vcHVibGljL3BpcGVyL3BpcGVyX3Bob25lbWl6ZS5kYXRhJyxcbiAgXSxcbiAgd29ya2VyOiB7XG4gICAgZm9ybWF0OiAnZXMnXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgaG9zdDogXCJsb2NhbGhvc3RcIlxuICB9LFxuICBkZWZpbmU6IHtcbiAgICBcInByb2Nlc3MuZW52XCI6IHByb2Nlc3MuZW52XG4gIH0sXG4gIGNzczoge1xuICAgIHBvc3Rjc3NcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgdmlzdWFsaXplcih7XG4gICAgICB0ZW1wbGF0ZTogXCJ0cmVlbWFwXCIsIC8vIG9yIHN1bmJ1cnN0XG4gICAgICBvcGVuOiBmYWxzZSxcbiAgICAgIGd6aXBTaXplOiB0cnVlLFxuICAgICAgYnJvdGxpU2l6ZTogdHJ1ZSxcbiAgICAgIGZpbGVuYW1lOiBcImJ1bmRsZWluc3BlY3Rvci5odG1sXCIgLy8gd2lsbCBiZSBzYXZlZCBpbiBwcm9qZWN0J3Mgcm9vdFxuICAgIH0pXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczogW1xuICAgICAge1xuICAgICAgICBmaW5kOiBcIkBcIixcbiAgICAgICAgcmVwbGFjZW1lbnQ6IGZpbGVVUkxUb1BhdGgobmV3IFVSTChcIi4vc3JjXCIsIGltcG9ydC5tZXRhLnVybCkpXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBwcm9jZXNzOiBcInByb2Nlc3MvYnJvd3NlclwiLFxuICAgICAgICBzdHJlYW06IFwic3RyZWFtLWJyb3dzZXJpZnlcIixcbiAgICAgICAgemxpYjogXCJicm93c2VyaWZ5LXpsaWJcIixcbiAgICAgICAgdXRpbDogXCJ1dGlsXCIsXG4gICAgICAgIGZpbmQ6IC9efi4rLyxcbiAgICAgICAgcmVwbGFjZW1lbnQ6ICh2YWwpID0+IHtcbiAgICAgICAgICByZXR1cm4gdmFsLnJlcGxhY2UoL15+LywgXCJcIilcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF1cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgLy8gVGhlc2Ugc2V0dGluZ3MgZW5zdXJlIHRoZSBwcmltYXJ5IEpTIGFuZCBDU1MgZmlsZSByZWZlcmVuY2VzIGFyZSBhbHdheXMgaW5kZXgue2pzLGNzc31cbiAgICAgICAgLy8gc28gd2UgY2FuIFNTUiB0aGUgaW5kZXguaHRtbCBhcyB0ZXh0IHJlc3BvbnNlIGZyb20gc2VydmVyL2luZGV4LmpzIHdpdGhvdXQgYnJlYWtpbmcgcmVmZXJlbmNlcyBlYWNoIGJ1aWxkLlxuICAgICAgICBlbnRyeUZpbGVOYW1lczogJ2luZGV4LmpzJyxcbiAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcbiAgICAgICAgICBpZiAoYXNzZXRJbmZvLm5hbWUgPT09ICdpbmRleC5jc3MnKSByZXR1cm4gYGluZGV4LmNzc2A7XG4gICAgICAgICAgcmV0dXJuIGFzc2V0SW5mby5uYW1lO1xuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgIC8vIFJlZHVjZXMgdHJhbnNmb3JtYXRpb24gdGltZSBieSA1MCUgYW5kIHdlIGRvbid0IGV2ZW4gdXNlIHRoaXMgdmFyaWFudCwgc28gd2UgY2FuIGlnbm9yZS5cbiAgICAgICAgL0BwaG9zcGhvci1pY29uc1xcL3JlYWN0XFwvZGlzdFxcL3Nzci8sXG4gICAgICBdXG4gICAgfSxcbiAgICBjb21tb25qc09wdGlvbnM6IHtcbiAgICAgIHRyYW5zZm9ybU1peGVkRXNNb2R1bGVzOiB0cnVlXG4gICAgfVxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBpbmNsdWRlOiBbXCJAbWludHBsZXgtbGFicy9waXBlci10dHMtd2ViXCJdLFxuICAgIGVzYnVpbGRPcHRpb25zOiB7XG4gICAgICBkZWZpbmU6IHtcbiAgICAgICAgZ2xvYmFsOiBcImdsb2JhbFRoaXNcIlxuICAgICAgfSxcbiAgICAgIHBsdWdpbnM6IFtdXG4gICAgfVxuICB9XG59KVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx4YW1wcFxcXFxodGRvY3NcXFxcR0VPVEVDSCBDT01QQU5ZIFBST0pFQ1RTXFxcXGFueXRoaW5nLWxsbVxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxceGFtcHBcXFxcaHRkb2NzXFxcXEdFT1RFQ0ggQ09NUEFOWSBQUk9KRUNUU1xcXFxhbnl0aGluZy1sbG1cXFxcZnJvbnRlbmRcXFxccG9zdGNzcy5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L3hhbXBwL2h0ZG9jcy9HRU9URUNIJTIwQ09NUEFOWSUyMFBST0pFQ1RTL2FueXRoaW5nLWxsbS9mcm9udGVuZC9wb3N0Y3NzLmNvbmZpZy5qc1wiO2ltcG9ydCB0YWlsd2luZCBmcm9tICd0YWlsd2luZGNzcydcbmltcG9ydCBhdXRvcHJlZml4ZXIgZnJvbSAnYXV0b3ByZWZpeGVyJ1xuaW1wb3J0IHRhaWx3aW5kQ29uZmlnIGZyb20gJy4vdGFpbHdpbmQuY29uZmlnLmpzJ1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIHBsdWdpbnM6IFt0YWlsd2luZCh0YWlsd2luZENvbmZpZyksIGF1dG9wcmVmaXhlcl0sXG59IiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFx4YW1wcFxcXFxodGRvY3NcXFxcR0VPVEVDSCBDT01QQU5ZIFBST0pFQ1RTXFxcXGFueXRoaW5nLWxsbVxcXFxmcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxceGFtcHBcXFxcaHRkb2NzXFxcXEdFT1RFQ0ggQ09NUEFOWSBQUk9KRUNUU1xcXFxhbnl0aGluZy1sbG1cXFxcZnJvbnRlbmRcXFxcdGFpbHdpbmQuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi94YW1wcC9odGRvY3MvR0VPVEVDSCUyMENPTVBBTlklMjBQUk9KRUNUUy9hbnl0aGluZy1sbG0vZnJvbnRlbmQvdGFpbHdpbmQuY29uZmlnLmpzXCI7LyoqIEB0eXBlIHtpbXBvcnQoJ3RhaWx3aW5kY3NzJykuQ29uZmlnfSAqL1xuZXhwb3J0IGRlZmF1bHQge1xuICBkYXJrTW9kZTogXCJjbGFzc1wiLFxuICBjb250ZW50OiB7XG4gICAgcmVsYXRpdmU6IHRydWUsXG4gICAgZmlsZXM6IFtcbiAgICAgIFwiLi9zcmMvY29tcG9uZW50cy8qKi8qLntqcyxqc3h9XCIsXG4gICAgICBcIi4vc3JjL2hvb2tzLyoqLyouanNcIixcbiAgICAgIFwiLi9zcmMvbW9kZWxzLyoqLyouanNcIixcbiAgICAgIFwiLi9zcmMvcGFnZXMvKiovKi57anMsanN4fVwiLFxuICAgICAgXCIuL3NyYy91dGlscy8qKi8qLmpzXCIsXG4gICAgICBcIi4vc3JjLyouanN4XCIsXG4gICAgICBcIi4vaW5kZXguaHRtbFwiLFxuICAgICAgXCIuL25vZGVfbW9kdWxlcy9AdHJlbW9yLyoqLyoue2pzLHRzLGpzeCx0c3h9XCJcbiAgICBdXG4gIH0sXG4gIHRoZW1lOiB7XG4gICAgZXh0ZW5kOiB7XG4gICAgICByb3RhdGU6IHtcbiAgICAgICAgXCIyNzBcIjogXCIyNzBkZWdcIixcbiAgICAgICAgXCIzNjBcIjogXCIzNjBkZWdcIlxuICAgICAgfSxcbiAgICAgIGNvbG9yczoge1xuICAgICAgICBcImJsYWNrLTkwMFwiOiBcIiMxNDE0MTRcIixcbiAgICAgICAgYWNjZW50OiBcIiMzRDQxNDdcIixcbiAgICAgICAgXCJzaWRlYmFyLWJ1dHRvblwiOiBcIiMzMTM1M0FcIixcbiAgICAgICAgc2lkZWJhcjogXCIjMjUyNzJDXCIsXG4gICAgICAgIFwiaGlzdG9yaWNhbC1tc2ctc3lzdGVtXCI6IFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA1KTtcIixcbiAgICAgICAgXCJoaXN0b3JpY2FsLW1zZy11c2VyXCI6IFwiIzJDMkYzNVwiLFxuICAgICAgICBvdXRsaW5lOiBcIiM0RTUxNTNcIixcbiAgICAgICAgXCJwcmltYXJ5LWJ1dHRvblwiOiBcInZhcigtLXRoZW1lLWJ1dHRvbi1wcmltYXJ5KVwiLFxuICAgICAgICBcImN0YS1idXR0b25cIjogXCJ2YXIoLS10aGVtZS1idXR0b24tY3RhKVwiLFxuICAgICAgICBzZWNvbmRhcnk6IFwiIzJDMkYzNlwiLFxuICAgICAgICBcImRhcmstaW5wdXRcIjogXCIjMTgxODFCXCIsXG4gICAgICAgIFwibW9iaWxlLW9uYm9hcmRpbmdcIjogXCIjMkMyRjM1XCIsXG4gICAgICAgIFwiZGFyay1oaWdobGlnaHRcIjogXCIjMUMxRTIxXCIsXG4gICAgICAgIFwiZGFyay10ZXh0XCI6IFwiIzIyMjYyOFwiLFxuICAgICAgICBkZXNjcmlwdGlvbjogXCIjRDJENURCXCIsXG4gICAgICAgIFwieC1idXR0b25cIjogXCIjOUNBM0FGXCIsXG4gICAgICAgIHJveWFsYmx1ZTogXCIjMDY1OTg2XCIsXG4gICAgICAgIHB1cnBsZTogXCIjNEExRkI4XCIsXG4gICAgICAgIG1hZ2VudGE6IFwiIzlFMTY1RlwiLFxuICAgICAgICBkYW5nZXI6IFwiI0YwNDQzOFwiLFxuICAgICAgICBlcnJvcjogXCIjQjQyMzE4XCIsXG4gICAgICAgIHdhcm46IFwiIzg1NDcwOFwiLFxuICAgICAgICBzdWNjZXNzOiBcIiMwNTYwM0FcIixcbiAgICAgICAgZGFya2VyOiBcIiNGNEY0RjRcIixcbiAgICAgICAgdGVhbDogXCIjMEJBNUVDXCIsXG5cbiAgICAgICAgLy8gR2VuZXJpYyB0aGVtZSBjb2xvcnNcbiAgICAgICAgdGhlbWU6IHtcbiAgICAgICAgICBiZzoge1xuICAgICAgICAgICAgcHJpbWFyeTogJ3ZhcigtLXRoZW1lLWJnLXByaW1hcnkpJyxcbiAgICAgICAgICAgIHNlY29uZGFyeTogJ3ZhcigtLXRoZW1lLWJnLXNlY29uZGFyeSknLFxuICAgICAgICAgICAgc2lkZWJhcjogJ3ZhcigtLXRoZW1lLWJnLXNpZGViYXIpJyxcbiAgICAgICAgICAgIGNvbnRhaW5lcjogJ3ZhcigtLXRoZW1lLWJnLWNvbnRhaW5lciknLFxuICAgICAgICAgICAgY2hhdDogJ3ZhcigtLXRoZW1lLWJnLWNoYXQpJyxcbiAgICAgICAgICAgIFwiY2hhdC1pbnB1dFwiOiAndmFyKC0tdGhlbWUtYmctY2hhdC1pbnB1dCknLFxuICAgICAgICAgICAgXCJwb3B1cC1tZW51XCI6ICd2YXIoLS10aGVtZS1wb3B1cC1tZW51LWJnKScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0ZXh0OiB7XG4gICAgICAgICAgICBwcmltYXJ5OiAndmFyKC0tdGhlbWUtdGV4dC1wcmltYXJ5KScsXG4gICAgICAgICAgICBzZWNvbmRhcnk6ICd2YXIoLS10aGVtZS10ZXh0LXNlY29uZGFyeSknLFxuICAgICAgICAgICAgcGxhY2Vob2xkZXI6ICd2YXIoLS10aGVtZS1wbGFjZWhvbGRlciknLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgc2lkZWJhcjoge1xuICAgICAgICAgICAgaXRlbToge1xuICAgICAgICAgICAgICBkZWZhdWx0OiAndmFyKC0tdGhlbWUtc2lkZWJhci1pdGVtLWRlZmF1bHQpJyxcbiAgICAgICAgICAgICAgc2VsZWN0ZWQ6ICd2YXIoLS10aGVtZS1zaWRlYmFyLWl0ZW0tc2VsZWN0ZWQpJyxcbiAgICAgICAgICAgICAgaG92ZXI6ICd2YXIoLS10aGVtZS1zaWRlYmFyLWl0ZW0taG92ZXIpJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWJpdGVtOiB7XG4gICAgICAgICAgICAgIGRlZmF1bHQ6ICd2YXIoLS10aGVtZS1zaWRlYmFyLXN1Yml0ZW0tZGVmYXVsdCknLFxuICAgICAgICAgICAgICBzZWxlY3RlZDogJ3ZhcigtLXRoZW1lLXNpZGViYXItc3ViaXRlbS1zZWxlY3RlZCknLFxuICAgICAgICAgICAgICBob3ZlcjogJ3ZhcigtLXRoZW1lLXNpZGViYXItc3ViaXRlbS1ob3ZlciknLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZvb3Rlcjoge1xuICAgICAgICAgICAgICBpY29uOiAndmFyKC0tdGhlbWUtc2lkZWJhci1mb290ZXItaWNvbiknLFxuICAgICAgICAgICAgICAnaWNvbi1ob3Zlcic6ICd2YXIoLS10aGVtZS1zaWRlYmFyLWZvb3Rlci1pY29uLWhvdmVyKScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYm9yZGVyOiAndmFyKC0tdGhlbWUtc2lkZWJhci1ib3JkZXIpJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiY2hhdC1pbnB1dFwiOiB7XG4gICAgICAgICAgICBib3JkZXI6ICd2YXIoLS10aGVtZS1jaGF0LWlucHV0LWJvcmRlciknLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCJhY3Rpb24tbWVudVwiOiB7XG4gICAgICAgICAgICBiZzogJ3ZhcigtLXRoZW1lLWFjdGlvbi1tZW51LWJnKScsXG4gICAgICAgICAgICBcIml0ZW0taG92ZXJcIjogJ3ZhcigtLXRoZW1lLWFjdGlvbi1tZW51LWl0ZW0taG92ZXIpJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgICAgICBpbnB1dDoge1xuICAgICAgICAgICAgICBiZzogJ3ZhcigtLXRoZW1lLXNldHRpbmdzLWlucHV0LWJnKScsXG4gICAgICAgICAgICAgIGFjdGl2ZTogJ3ZhcigtLXRoZW1lLXNldHRpbmdzLWlucHV0LWFjdGl2ZSknLFxuICAgICAgICAgICAgICBwbGFjZWhvbGRlcjogJ3ZhcigtLXRoZW1lLXNldHRpbmdzLWlucHV0LXBsYWNlaG9sZGVyKScsXG4gICAgICAgICAgICAgIHRleHQ6ICd2YXIoLS10aGVtZS1zZXR0aW5ncy1pbnB1dC10ZXh0KScsXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcbiAgICAgICAgICBtb2RhbDoge1xuICAgICAgICAgICAgYm9yZGVyOiAndmFyKC0tdGhlbWUtbW9kYWwtYm9yZGVyKScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBcImZpbGUtcGlja2VyXCI6IHtcbiAgICAgICAgICAgIGhvdmVyOiAndmFyKC0tdGhlbWUtZmlsZS1waWNrZXItaG92ZXIpJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGF0dGFjaG1lbnQ6IHtcbiAgICAgICAgICAgIGJnOiAndmFyKC0tdGhlbWUtYXR0YWNobWVudC1iZyknLFxuICAgICAgICAgICAgJ2Vycm9yLWJnJzogJ3ZhcigtLXRoZW1lLWF0dGFjaG1lbnQtZXJyb3ItYmcpJyxcbiAgICAgICAgICAgICdzdWNjZXNzLWJnJzogJ3ZhcigtLXRoZW1lLWF0dGFjaG1lbnQtc3VjY2Vzcy1iZyknLFxuICAgICAgICAgICAgdGV4dDogJ3ZhcigtLXRoZW1lLWF0dGFjaG1lbnQtdGV4dCknLFxuICAgICAgICAgICAgJ3RleHQtc2Vjb25kYXJ5JzogJ3ZhcigtLXRoZW1lLWF0dGFjaG1lbnQtdGV4dC1zZWNvbmRhcnkpJyxcbiAgICAgICAgICAgICdpY29uJzogJ3ZhcigtLXRoZW1lLWF0dGFjaG1lbnQtaWNvbiknLFxuICAgICAgICAgICAgJ2ljb24tc3Bpbm5lcic6ICd2YXIoLS10aGVtZS1hdHRhY2htZW50LWljb24tc3Bpbm5lciknLFxuICAgICAgICAgICAgJ2ljb24tc3Bpbm5lci1iZyc6ICd2YXIoLS10aGVtZS1hdHRhY2htZW50LWljb24tc3Bpbm5lci1iZyknLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgaG9tZToge1xuICAgICAgICAgICAgdGV4dDogJ3ZhcigtLXRoZW1lLWhvbWUtdGV4dCknLFxuICAgICAgICAgICAgXCJ0ZXh0LXNlY29uZGFyeVwiOiAndmFyKC0tdGhlbWUtaG9tZS10ZXh0LXNlY29uZGFyeSknLFxuICAgICAgICAgICAgXCJiZy1jYXJkXCI6ICd2YXIoLS10aGVtZS1ob21lLWJnLWNhcmQpJyxcbiAgICAgICAgICAgIFwiYmctYnV0dG9uXCI6ICd2YXIoLS10aGVtZS1ob21lLWJnLWJ1dHRvbiknLFxuICAgICAgICAgICAgYm9yZGVyOiAndmFyKC0tdGhlbWUtaG9tZS1ib3JkZXIpJyxcbiAgICAgICAgICAgIFwiYnV0dG9uLXByaW1hcnlcIjogJ3ZhcigtLXRoZW1lLWhvbWUtYnV0dG9uLXByaW1hcnkpJyxcbiAgICAgICAgICAgIFwiYnV0dG9uLXByaW1hcnktaG92ZXJcIjogJ3ZhcigtLXRoZW1lLWhvbWUtYnV0dG9uLXByaW1hcnktaG92ZXIpJyxcbiAgICAgICAgICAgIFwiYnV0dG9uLXNlY29uZGFyeVwiOiAndmFyKC0tdGhlbWUtaG9tZS1idXR0b24tc2Vjb25kYXJ5KScsXG4gICAgICAgICAgICBcImJ1dHRvbi1zZWNvbmRhcnktaG92ZXJcIjogJ3ZhcigtLXRoZW1lLWhvbWUtYnV0dG9uLXNlY29uZGFyeS1ob3ZlciknLFxuICAgICAgICAgICAgXCJidXR0b24tc2Vjb25kYXJ5LXRleHRcIjogJ3ZhcigtLXRoZW1lLWhvbWUtYnV0dG9uLXNlY29uZGFyeS10ZXh0KScsXG4gICAgICAgICAgICBcImJ1dHRvbi1zZWNvbmRhcnktaG92ZXItdGV4dFwiOiAndmFyKC0tdGhlbWUtaG9tZS1idXR0b24tc2Vjb25kYXJ5LWhvdmVyLXRleHQpJyxcbiAgICAgICAgICAgIFwiYnV0dG9uLXNlY29uZGFyeS1ib3JkZXJcIjogJ3ZhcigtLXRoZW1lLWhvbWUtYnV0dG9uLXNlY29uZGFyeS1ib3JkZXIpJyxcbiAgICAgICAgICAgIFwiYnV0dG9uLXNlY29uZGFyeS1ib3JkZXItaG92ZXJcIjogJ3ZhcigtLXRoZW1lLWhvbWUtYnV0dG9uLXNlY29uZGFyeS1ib3JkZXItaG92ZXIpJyxcbiAgICAgICAgICAgIFwidXBkYXRlLWNhcmQtYmdcIjogJ3ZhcigtLXRoZW1lLWhvbWUtdXBkYXRlLWNhcmQtYmcpJyxcbiAgICAgICAgICAgIFwidXBkYXRlLWNhcmQtaG92ZXJcIjogJ3ZhcigtLXRoZW1lLWhvbWUtdXBkYXRlLWNhcmQtaG92ZXIpJyxcbiAgICAgICAgICAgIFwidXBkYXRlLXNvdXJjZVwiOiAndmFyKC0tdGhlbWUtaG9tZS11cGRhdGUtc291cmNlKScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjaGVja2xpc3Q6IHtcbiAgICAgICAgICAgIFwiaXRlbS1iZ1wiOiAndmFyKC0tdGhlbWUtY2hlY2tsaXN0LWl0ZW0tYmcpJyxcbiAgICAgICAgICAgIFwiaXRlbS1iZy1ob3ZlclwiOiAndmFyKC0tdGhlbWUtY2hlY2tsaXN0LWl0ZW0tYmctaG92ZXIpJyxcbiAgICAgICAgICAgIFwiaXRlbS10ZXh0XCI6ICd2YXIoLS10aGVtZS1jaGVja2xpc3QtaXRlbS10ZXh0KScsXG4gICAgICAgICAgICBcIml0ZW0tY29tcGxldGVkLWJnXCI6ICd2YXIoLS10aGVtZS1jaGVja2xpc3QtaXRlbS1jb21wbGV0ZWQtYmcpJyxcbiAgICAgICAgICAgIFwiaXRlbS1jb21wbGV0ZWQtdGV4dFwiOiAndmFyKC0tdGhlbWUtY2hlY2tsaXN0LWl0ZW0tY29tcGxldGVkLXRleHQpJyxcbiAgICAgICAgICAgIFwiaXRlbS1ob3ZlclwiOiAndmFyKC0tdGhlbWUtY2hlY2tsaXN0LWl0ZW0taG92ZXIpJyxcbiAgICAgICAgICAgIFwiY2hlY2tib3gtYm9yZGVyXCI6ICd2YXIoLS10aGVtZS1jaGVja2xpc3QtY2hlY2tib3gtYm9yZGVyKScsXG4gICAgICAgICAgICBcImNoZWNrYm94LWZpbGxcIjogJ3ZhcigtLXRoZW1lLWNoZWNrbGlzdC1jaGVja2JveC1maWxsKScsXG4gICAgICAgICAgICBcImNoZWNrYm94LXRleHRcIjogJ3ZhcigtLXRoZW1lLWNoZWNrbGlzdC1jaGVja2JveC10ZXh0KScsXG4gICAgICAgICAgICBcImJ1dHRvbi1ib3JkZXJcIjogJ3ZhcigtLXRoZW1lLWNoZWNrbGlzdC1idXR0b24tYm9yZGVyKScsXG4gICAgICAgICAgICBcImJ1dHRvbi10ZXh0XCI6ICd2YXIoLS10aGVtZS1jaGVja2xpc3QtYnV0dG9uLXRleHQpJyxcbiAgICAgICAgICAgIFwiYnV0dG9uLWhvdmVyLWJnXCI6ICd2YXIoLS10aGVtZS1jaGVja2xpc3QtYnV0dG9uLWhvdmVyLWJnKScsXG4gICAgICAgICAgICBcImJ1dHRvbi1ob3Zlci1ib3JkZXJcIjogJ3ZhcigtLXRoZW1lLWNoZWNrbGlzdC1idXR0b24taG92ZXItYm9yZGVyKScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBidXR0b246IHtcbiAgICAgICAgICAgIHRleHQ6ICd2YXIoLS10aGVtZS1idXR0b24tdGV4dCknLFxuICAgICAgICAgICAgJ2NvZGUtaG92ZXItdGV4dCc6ICd2YXIoLS10aGVtZS1idXR0b24tY29kZS1ob3Zlci10ZXh0KScsXG4gICAgICAgICAgICAnY29kZS1ob3Zlci1iZyc6ICd2YXIoLS10aGVtZS1idXR0b24tY29kZS1ob3Zlci1iZyknLFxuICAgICAgICAgICAgJ2Rpc2FibGUtaG92ZXItdGV4dCc6ICd2YXIoLS10aGVtZS1idXR0b24tZGlzYWJsZS1ob3Zlci10ZXh0KScsXG4gICAgICAgICAgICAnZGlzYWJsZS1ob3Zlci1iZyc6ICd2YXIoLS10aGVtZS1idXR0b24tZGlzYWJsZS1ob3Zlci1iZyknLFxuICAgICAgICAgICAgJ2RlbGV0ZS1ob3Zlci10ZXh0JzogJ3ZhcigtLXRoZW1lLWJ1dHRvbi1kZWxldGUtaG92ZXItdGV4dCknLFxuICAgICAgICAgICAgJ2RlbGV0ZS1ob3Zlci1iZyc6ICd2YXIoLS10aGVtZS1idXR0b24tZGVsZXRlLWhvdmVyLWJnKScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICBiYWNrZ3JvdW5kSW1hZ2U6IHtcbiAgICAgICAgXCJwcmVmZXJlbmNlLWdyYWRpZW50XCI6XG4gICAgICAgICAgXCJsaW5lYXItZ3JhZGllbnQoMTgwZGVnLCAjNUE1QzYzIDAlLCByZ2JhKDkwLCA5MiwgOTksIDAuMjgpIDEwMCUpO1wiLFxuICAgICAgICBcImNoYXQtbXNnLXVzZXItZ3JhZGllbnRcIjpcbiAgICAgICAgICBcImxpbmVhci1ncmFkaWVudCgxODBkZWcsICMzRDQxNDcgMCUsICMyQzJGMzUgMTAwJSk7XCIsXG4gICAgICAgIFwic2VsZWN0ZWQtcHJlZmVyZW5jZS1ncmFkaWVudFwiOlxuICAgICAgICAgIFwibGluZWFyLWdyYWRpZW50KDE4MGRlZywgIzMxMzIzNiAwJSwgcmdiYSg2My40MCwgNjQuOTAsIDcwLjEzLCAwKSAxMDAlKTtcIixcbiAgICAgICAgXCJtYWluLWdyYWRpZW50XCI6IFwibGluZWFyLWdyYWRpZW50KDE4MGRlZywgIzNENDE0NyAwJSwgIzJDMkYzNSAxMDAlKVwiLFxuICAgICAgICBcIm1vZGFsLWdyYWRpZW50XCI6IFwibGluZWFyLWdyYWRpZW50KDE4MGRlZywgIzNENDE0NyAwJSwgIzJDMkYzNSAxMDAlKVwiLFxuICAgICAgICBcInNpZGViYXItZ3JhZGllbnRcIjogXCJsaW5lYXItZ3JhZGllbnQoOTBkZWcsICM1QjYxNkEgMCUsICMzRjQzNEIgMTAwJSlcIixcbiAgICAgICAgXCJsb2dpbi1ncmFkaWVudFwiOiBcImxpbmVhci1ncmFkaWVudCgxODBkZWcsICMzRDQxNDcgMCUsICMyQzJGMzUgMTAwJSlcIixcbiAgICAgICAgXCJtZW51LWl0ZW0tZ3JhZGllbnRcIjpcbiAgICAgICAgICBcImxpbmVhci1ncmFkaWVudCg5MGRlZywgIzNENDE0NyAwJSwgIzJDMkYzNSAxMDAlKVwiLFxuICAgICAgICBcIm1lbnUtaXRlbS1zZWxlY3RlZC1ncmFkaWVudFwiOlxuICAgICAgICAgIFwibGluZWFyLWdyYWRpZW50KDkwZGVnLCAjNUI2MTZBIDAlLCAjM0Y0MzRCIDEwMCUpXCIsXG4gICAgICAgIFwid29ya3NwYWNlLWl0ZW0tZ3JhZGllbnRcIjpcbiAgICAgICAgICBcImxpbmVhci1ncmFkaWVudCg5MGRlZywgIzNENDE0NyAwJSwgIzJDMkYzNSAxMDAlKVwiLFxuICAgICAgICBcIndvcmtzcGFjZS1pdGVtLXNlbGVjdGVkLWdyYWRpZW50XCI6XG4gICAgICAgICAgXCJsaW5lYXItZ3JhZGllbnQoOTBkZWcsICM1QjYxNkEgMCUsICMzRjQzNEIgMTAwJSlcIixcbiAgICAgICAgXCJzd2l0Y2gtc2VsZWN0ZWRcIjogXCJsaW5lYXItZ3JhZGllbnQoMTQ2ZGVnLCAjNUI2MTZBIDAlLCAjM0Y0MzRCIDEwMCUpXCJcbiAgICAgIH0sXG4gICAgICBmb250RmFtaWx5OiB7XG4gICAgICAgIHNhbnM6IFtcbiAgICAgICAgICBcInBsdXMtamFrYXJ0YS1zYW5zXCIsXG4gICAgICAgICAgXCJ1aS1zYW5zLXNlcmlmXCIsXG4gICAgICAgICAgXCJzeXN0ZW0tdWlcIixcbiAgICAgICAgICBcIi1hcHBsZS1zeXN0ZW1cIixcbiAgICAgICAgICBcIkJsaW5rTWFjU3lzdGVtRm9udFwiLFxuICAgICAgICAgICdcIlNlZ29lIFVJXCInLFxuICAgICAgICAgIFwiUm9ib3RvXCIsXG4gICAgICAgICAgJ1wiSGVsdmV0aWNhIE5ldWVcIicsXG4gICAgICAgICAgXCJBcmlhbFwiLFxuICAgICAgICAgICdcIk5vdG8gU2Fuc1wiJyxcbiAgICAgICAgICBcInNhbnMtc2VyaWZcIixcbiAgICAgICAgICAnXCJBcHBsZSBDb2xvciBFbW9qaVwiJyxcbiAgICAgICAgICAnXCJTZWdvZSBVSSBFbW9qaVwiJyxcbiAgICAgICAgICAnXCJTZWdvZSBVSSBTeW1ib2xcIicsXG4gICAgICAgICAgJ1wiTm90byBDb2xvciBFbW9qaVwiJ1xuICAgICAgICBdXG4gICAgICB9LFxuICAgICAgYW5pbWF0aW9uOiB7XG4gICAgICAgIHN3ZWVwOiBcInN3ZWVwIDAuNXMgZWFzZS1pbi1vdXRcIixcbiAgICAgICAgXCJwdWxzZS1nbG93XCI6IFwicHVsc2UtZ2xvdyAxLjVzIGluZmluaXRlXCIsXG4gICAgICAgICdmYWRlLWluJzogJ2ZhZGUtaW4gMC4zcyBlYXNlLW91dCcsXG4gICAgICAgICdzbGlkZS11cCc6ICdzbGlkZS11cCAwLjRzIGVhc2Utb3V0IGZvcndhcmRzJyxcbiAgICAgICAgJ2JvdW5jZS1zdWJ0bGUnOiAnYm91bmNlLXN1YnRsZSAycyBlYXNlLWluLW91dCBpbmZpbml0ZSdcbiAgICAgIH0sXG4gICAgICBrZXlmcmFtZXM6IHtcbiAgICAgICAgc3dlZXA6IHtcbiAgICAgICAgICBcIjAlXCI6IHsgdHJhbnNmb3JtOiBcInNjYWxlWCgwKVwiLCB0cmFuc2Zvcm1PcmlnaW46IFwiYm90dG9tIGxlZnRcIiB9LFxuICAgICAgICAgIFwiMTAwJVwiOiB7IHRyYW5zZm9ybTogXCJzY2FsZVgoMSlcIiwgdHJhbnNmb3JtT3JpZ2luOiBcImJvdHRvbSBsZWZ0XCIgfVxuICAgICAgICB9LFxuICAgICAgICBmYWRlSW46IHtcbiAgICAgICAgICBcIjAlXCI6IHsgb3BhY2l0eTogMCB9LFxuICAgICAgICAgIFwiMTAwJVwiOiB7IG9wYWNpdHk6IDEgfVxuICAgICAgICB9LFxuICAgICAgICBmYWRlT3V0OiB7XG4gICAgICAgICAgXCIwJVwiOiB7IG9wYWNpdHk6IDEgfSxcbiAgICAgICAgICBcIjEwMCVcIjogeyBvcGFjaXR5OiAwIH1cbiAgICAgICAgfSxcbiAgICAgICAgXCJwdWxzZS1nbG93XCI6IHtcbiAgICAgICAgICBcIjAlXCI6IHtcbiAgICAgICAgICAgIG9wYWNpdHk6IDEsXG4gICAgICAgICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMSlcIixcbiAgICAgICAgICAgIGJveFNoYWRvdzogXCIwIDAgMCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMClcIixcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogXCJyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMClcIlxuICAgICAgICAgIH0sXG4gICAgICAgICAgXCI1MCVcIjoge1xuICAgICAgICAgICAgb3BhY2l0eTogMSxcbiAgICAgICAgICAgIHRyYW5zZm9ybTogXCJzY2FsZSgxLjEpXCIsXG4gICAgICAgICAgICBib3hTaGFkb3c6IFwiMCAwIDE1cHggcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpXCIsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEpXCJcbiAgICAgICAgICB9LFxuICAgICAgICAgIFwiMTAwJVwiOiB7XG4gICAgICAgICAgICBvcGFjaXR5OiAxLFxuICAgICAgICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDEpXCIsXG4gICAgICAgICAgICBib3hTaGFkb3c6IFwiMCAwIDAgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjApXCIsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6IFwicmdiYSgyNTUsIDI1NSwgMjU1LCAwLjApXCJcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgICdmYWRlLWluJzoge1xuICAgICAgICAgICcwJSc6IHsgb3BhY2l0eTogJzAnIH0sXG4gICAgICAgICAgJzEwMCUnOiB7IG9wYWNpdHk6ICcxJyB9XG4gICAgICAgIH0sXG4gICAgICAgICdzbGlkZS11cCc6IHtcbiAgICAgICAgICAnMCUnOiB7IHRyYW5zZm9ybTogJ3RyYW5zbGF0ZVkoMTBweCknLCBvcGFjaXR5OiAnMCcgfSxcbiAgICAgICAgICAnMTAwJSc6IHsgdHJhbnNmb3JtOiAndHJhbnNsYXRlWSgwKScsIG9wYWNpdHk6ICcxJyB9XG4gICAgICAgIH0sXG4gICAgICAgICdib3VuY2Utc3VidGxlJzoge1xuICAgICAgICAgICcwJSwgMTAwJSc6IHsgdHJhbnNmb3JtOiAndHJhbnNsYXRlWSgwKScgfSxcbiAgICAgICAgICAnNTAlJzogeyB0cmFuc2Zvcm06ICd0cmFuc2xhdGVZKC0ycHgpJyB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHZhcmlhbnRzOiB7XG4gICAgZXh0ZW5kOiB7XG4gICAgICBiYWNrZ3JvdW5kQ29sb3I6IFsnbGlnaHQnXSxcbiAgICAgIHRleHRDb2xvcjogWydsaWdodCddLFxuICAgIH1cbiAgfSxcbiAgLy8gUmVxdWlyZWQgZm9yIHJlY2hhcnQgc3R5bGVzIHRvIHNob3cgc2luY2UgdGhleSBjYW4gYmUgcmVuZGVyZWQgZHluYW1pY2FsbHkgYW5kIHdpbGwgYmUgdHJlZS1zaGFrZW4gaWYgbm90IHNhZmUtbGlzdGVkLlxuICBzYWZlbGlzdDogW1xuICAgIHtcbiAgICAgIHBhdHRlcm46XG4gICAgICAgIC9eKGJnLSg/OnNsYXRlfGdyYXl8emluY3xuZXV0cmFsfHN0b25lfHJlZHxvcmFuZ2V8YW1iZXJ8eWVsbG93fGxpbWV8Z3JlZW58ZW1lcmFsZHx0ZWFsfGN5YW58c2t5fGJsdWV8aW5kaWdvfHZpb2xldHxwdXJwbGV8ZnVjaHNpYXxwaW5rfHJvc2UpLSg/OjUwfDEwMHwyMDB8MzAwfDQwMHw1MDB8NjAwfDcwMHw4MDB8OTAwfDk1MCkpJC8sXG4gICAgICB2YXJpYW50czogW1wiaG92ZXJcIiwgXCJ1aS1zZWxlY3RlZFwiXVxuICAgIH0sXG4gICAge1xuICAgICAgcGF0dGVybjpcbiAgICAgICAgL14odGV4dC0oPzpzbGF0ZXxncmF5fHppbmN8bmV1dHJhbHxzdG9uZXxyZWR8b3JhbmdlfGFtYmVyfHllbGxvd3xsaW1lfGdyZWVufGVtZXJhbGR8dGVhbHxjeWFufHNreXxibHVlfGluZGlnb3x2aW9sZXR8cHVycGxlfGZ1Y2hzaWF8cGlua3xyb3NlKS0oPzo1MHwxMDB8MjAwfDMwMHw0MDB8NTAwfDYwMHw3MDB8ODAwfDkwMHw5NTApKSQvLFxuICAgICAgdmFyaWFudHM6IFtcImhvdmVyXCIsIFwidWktc2VsZWN0ZWRcIl1cbiAgICB9LFxuICAgIHtcbiAgICAgIHBhdHRlcm46XG4gICAgICAgIC9eKGJvcmRlci0oPzpzbGF0ZXxncmF5fHppbmN8bmV1dHJhbHxzdG9uZXxyZWR8b3JhbmdlfGFtYmVyfHllbGxvd3xsaW1lfGdyZWVufGVtZXJhbGR8dGVhbHxjeWFufHNreXxibHVlfGluZGlnb3x2aW9sZXR8cHVycGxlfGZ1Y2hzaWF8cGlua3xyb3NlKS0oPzo1MHwxMDB8MjAwfDMwMHw0MDB8NTAwfDYwMHw3MDB8ODAwfDkwMHw5NTApKSQvLFxuICAgICAgdmFyaWFudHM6IFtcImhvdmVyXCIsIFwidWktc2VsZWN0ZWRcIl1cbiAgICB9LFxuICAgIHtcbiAgICAgIHBhdHRlcm46XG4gICAgICAgIC9eKHJpbmctKD86c2xhdGV8Z3JheXx6aW5jfG5ldXRyYWx8c3RvbmV8cmVkfG9yYW5nZXxhbWJlcnx5ZWxsb3d8bGltZXxncmVlbnxlbWVyYWxkfHRlYWx8Y3lhbnxza3l8Ymx1ZXxpbmRpZ298dmlvbGV0fHB1cnBsZXxmdWNoc2lhfHBpbmt8cm9zZSktKD86NTB8MTAwfDIwMHwzMDB8NDAwfDUwMHw2MDB8NzAwfDgwMHw5MDB8OTUwKSkkL1xuICAgIH0sXG4gICAge1xuICAgICAgcGF0dGVybjpcbiAgICAgICAgL14oc3Ryb2tlLSg/OnNsYXRlfGdyYXl8emluY3xuZXV0cmFsfHN0b25lfHJlZHxvcmFuZ2V8YW1iZXJ8eWVsbG93fGxpbWV8Z3JlZW58ZW1lcmFsZHx0ZWFsfGN5YW58c2t5fGJsdWV8aW5kaWdvfHZpb2xldHxwdXJwbGV8ZnVjaHNpYXxwaW5rfHJvc2UpLSg/OjUwfDEwMHwyMDB8MzAwfDQwMHw1MDB8NjAwfDcwMHw4MDB8OTAwfDk1MCkpJC9cbiAgICB9LFxuICAgIHtcbiAgICAgIHBhdHRlcm46XG4gICAgICAgIC9eKGZpbGwtKD86c2xhdGV8Z3JheXx6aW5jfG5ldXRyYWx8c3RvbmV8cmVkfG9yYW5nZXxhbWJlcnx5ZWxsb3d8bGltZXxncmVlbnxlbWVyYWxkfHRlYWx8Y3lhbnxza3l8Ymx1ZXxpbmRpZ298dmlvbGV0fHB1cnBsZXxmdWNoc2lhfHBpbmt8cm9zZSktKD86NTB8MTAwfDIwMHwzMDB8NDAwfDUwMHw2MDB8NzAwfDgwMHw5MDB8OTUwKSkkL1xuICAgIH1cbiAgXSxcbiAgcGx1Z2luczogW1xuICAgIGZ1bmN0aW9uICh7IGFkZFZhcmlhbnQgfSkge1xuICAgICAgYWRkVmFyaWFudCgnbGlnaHQnLCAnLmxpZ2h0ICYnKSAvLyBBZGQgdGhlIGBsaWdodDpgIHZhcmlhbnRcbiAgICB9LFxuICBdXG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRYLFNBQVMsb0JBQW9CO0FBQ3paLFNBQVMsZUFBZSxXQUFXOzs7QUNEK1YsT0FBTyxjQUFjO0FBQ3ZaLE9BQU8sa0JBQWtCOzs7QUNBekIsSUFBTywwQkFBUTtBQUFBLEVBQ2IsVUFBVTtBQUFBLEVBQ1YsU0FBUztBQUFBLElBQ1AsVUFBVTtBQUFBLElBQ1YsT0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxNQUNOLFFBQVE7QUFBQSxRQUNOLE9BQU87QUFBQSxRQUNQLE9BQU87QUFBQSxNQUNUO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixhQUFhO0FBQUEsUUFDYixRQUFRO0FBQUEsUUFDUixrQkFBa0I7QUFBQSxRQUNsQixTQUFTO0FBQUEsUUFDVCx5QkFBeUI7QUFBQSxRQUN6Qix1QkFBdUI7QUFBQSxRQUN2QixTQUFTO0FBQUEsUUFDVCxrQkFBa0I7QUFBQSxRQUNsQixjQUFjO0FBQUEsUUFDZCxXQUFXO0FBQUEsUUFDWCxjQUFjO0FBQUEsUUFDZCxxQkFBcUI7QUFBQSxRQUNyQixrQkFBa0I7QUFBQSxRQUNsQixhQUFhO0FBQUEsUUFDYixhQUFhO0FBQUEsUUFDYixZQUFZO0FBQUEsUUFDWixXQUFXO0FBQUEsUUFDWCxRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsUUFDVCxRQUFRO0FBQUEsUUFDUixPQUFPO0FBQUEsUUFDUCxNQUFNO0FBQUEsUUFDTixTQUFTO0FBQUEsUUFDVCxRQUFRO0FBQUEsUUFDUixNQUFNO0FBQUE7QUFBQSxRQUdOLE9BQU87QUFBQSxVQUNMLElBQUk7QUFBQSxZQUNGLFNBQVM7QUFBQSxZQUNULFdBQVc7QUFBQSxZQUNYLFNBQVM7QUFBQSxZQUNULFdBQVc7QUFBQSxZQUNYLE1BQU07QUFBQSxZQUNOLGNBQWM7QUFBQSxZQUNkLGNBQWM7QUFBQSxVQUNoQjtBQUFBLFVBQ0EsTUFBTTtBQUFBLFlBQ0osU0FBUztBQUFBLFlBQ1QsV0FBVztBQUFBLFlBQ1gsYUFBYTtBQUFBLFVBQ2Y7QUFBQSxVQUNBLFNBQVM7QUFBQSxZQUNQLE1BQU07QUFBQSxjQUNKLFNBQVM7QUFBQSxjQUNULFVBQVU7QUFBQSxjQUNWLE9BQU87QUFBQSxZQUNUO0FBQUEsWUFDQSxTQUFTO0FBQUEsY0FDUCxTQUFTO0FBQUEsY0FDVCxVQUFVO0FBQUEsY0FDVixPQUFPO0FBQUEsWUFDVDtBQUFBLFlBQ0EsUUFBUTtBQUFBLGNBQ04sTUFBTTtBQUFBLGNBQ04sY0FBYztBQUFBLFlBQ2hCO0FBQUEsWUFDQSxRQUFRO0FBQUEsVUFDVjtBQUFBLFVBQ0EsY0FBYztBQUFBLFlBQ1osUUFBUTtBQUFBLFVBQ1Y7QUFBQSxVQUNBLGVBQWU7QUFBQSxZQUNiLElBQUk7QUFBQSxZQUNKLGNBQWM7QUFBQSxVQUNoQjtBQUFBLFVBQ0EsVUFBVTtBQUFBLFlBQ1IsT0FBTztBQUFBLGNBQ0wsSUFBSTtBQUFBLGNBQ0osUUFBUTtBQUFBLGNBQ1IsYUFBYTtBQUFBLGNBQ2IsTUFBTTtBQUFBLFlBQ1I7QUFBQSxVQUNGO0FBQUEsVUFDQSxPQUFPO0FBQUEsWUFDTCxRQUFRO0FBQUEsVUFDVjtBQUFBLFVBQ0EsZUFBZTtBQUFBLFlBQ2IsT0FBTztBQUFBLFVBQ1Q7QUFBQSxVQUNBLFlBQVk7QUFBQSxZQUNWLElBQUk7QUFBQSxZQUNKLFlBQVk7QUFBQSxZQUNaLGNBQWM7QUFBQSxZQUNkLE1BQU07QUFBQSxZQUNOLGtCQUFrQjtBQUFBLFlBQ2xCLFFBQVE7QUFBQSxZQUNSLGdCQUFnQjtBQUFBLFlBQ2hCLG1CQUFtQjtBQUFBLFVBQ3JCO0FBQUEsVUFDQSxNQUFNO0FBQUEsWUFDSixNQUFNO0FBQUEsWUFDTixrQkFBa0I7QUFBQSxZQUNsQixXQUFXO0FBQUEsWUFDWCxhQUFhO0FBQUEsWUFDYixRQUFRO0FBQUEsWUFDUixrQkFBa0I7QUFBQSxZQUNsQix3QkFBd0I7QUFBQSxZQUN4QixvQkFBb0I7QUFBQSxZQUNwQiwwQkFBMEI7QUFBQSxZQUMxQix5QkFBeUI7QUFBQSxZQUN6QiwrQkFBK0I7QUFBQSxZQUMvQiwyQkFBMkI7QUFBQSxZQUMzQixpQ0FBaUM7QUFBQSxZQUNqQyxrQkFBa0I7QUFBQSxZQUNsQixxQkFBcUI7QUFBQSxZQUNyQixpQkFBaUI7QUFBQSxVQUNuQjtBQUFBLFVBQ0EsV0FBVztBQUFBLFlBQ1QsV0FBVztBQUFBLFlBQ1gsaUJBQWlCO0FBQUEsWUFDakIsYUFBYTtBQUFBLFlBQ2IscUJBQXFCO0FBQUEsWUFDckIsdUJBQXVCO0FBQUEsWUFDdkIsY0FBYztBQUFBLFlBQ2QsbUJBQW1CO0FBQUEsWUFDbkIsaUJBQWlCO0FBQUEsWUFDakIsaUJBQWlCO0FBQUEsWUFDakIsaUJBQWlCO0FBQUEsWUFDakIsZUFBZTtBQUFBLFlBQ2YsbUJBQW1CO0FBQUEsWUFDbkIsdUJBQXVCO0FBQUEsVUFDekI7QUFBQSxVQUNBLFFBQVE7QUFBQSxZQUNOLE1BQU07QUFBQSxZQUNOLG1CQUFtQjtBQUFBLFlBQ25CLGlCQUFpQjtBQUFBLFlBQ2pCLHNCQUFzQjtBQUFBLFlBQ3RCLG9CQUFvQjtBQUFBLFlBQ3BCLHFCQUFxQjtBQUFBLFlBQ3JCLG1CQUFtQjtBQUFBLFVBQ3JCO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLGlCQUFpQjtBQUFBLFFBQ2YsdUJBQ0U7QUFBQSxRQUNGLDBCQUNFO0FBQUEsUUFDRixnQ0FDRTtBQUFBLFFBQ0YsaUJBQWlCO0FBQUEsUUFDakIsa0JBQWtCO0FBQUEsUUFDbEIsb0JBQW9CO0FBQUEsUUFDcEIsa0JBQWtCO0FBQUEsUUFDbEIsc0JBQ0U7QUFBQSxRQUNGLCtCQUNFO0FBQUEsUUFDRiwyQkFDRTtBQUFBLFFBQ0Ysb0NBQ0U7QUFBQSxRQUNGLG1CQUFtQjtBQUFBLE1BQ3JCO0FBQUEsTUFDQSxZQUFZO0FBQUEsUUFDVixNQUFNO0FBQUEsVUFDSjtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFdBQVc7QUFBQSxRQUNULE9BQU87QUFBQSxRQUNQLGNBQWM7QUFBQSxRQUNkLFdBQVc7QUFBQSxRQUNYLFlBQVk7QUFBQSxRQUNaLGlCQUFpQjtBQUFBLE1BQ25CO0FBQUEsTUFDQSxXQUFXO0FBQUEsUUFDVCxPQUFPO0FBQUEsVUFDTCxNQUFNLEVBQUUsV0FBVyxhQUFhLGlCQUFpQixjQUFjO0FBQUEsVUFDL0QsUUFBUSxFQUFFLFdBQVcsYUFBYSxpQkFBaUIsY0FBYztBQUFBLFFBQ25FO0FBQUEsUUFDQSxRQUFRO0FBQUEsVUFDTixNQUFNLEVBQUUsU0FBUyxFQUFFO0FBQUEsVUFDbkIsUUFBUSxFQUFFLFNBQVMsRUFBRTtBQUFBLFFBQ3ZCO0FBQUEsUUFDQSxTQUFTO0FBQUEsVUFDUCxNQUFNLEVBQUUsU0FBUyxFQUFFO0FBQUEsVUFDbkIsUUFBUSxFQUFFLFNBQVMsRUFBRTtBQUFBLFFBQ3ZCO0FBQUEsUUFDQSxjQUFjO0FBQUEsVUFDWixNQUFNO0FBQUEsWUFDSixTQUFTO0FBQUEsWUFDVCxXQUFXO0FBQUEsWUFDWCxXQUFXO0FBQUEsWUFDWCxpQkFBaUI7QUFBQSxVQUNuQjtBQUFBLFVBQ0EsT0FBTztBQUFBLFlBQ0wsU0FBUztBQUFBLFlBQ1QsV0FBVztBQUFBLFlBQ1gsV0FBVztBQUFBLFlBQ1gsaUJBQWlCO0FBQUEsVUFDbkI7QUFBQSxVQUNBLFFBQVE7QUFBQSxZQUNOLFNBQVM7QUFBQSxZQUNULFdBQVc7QUFBQSxZQUNYLFdBQVc7QUFBQSxZQUNYLGlCQUFpQjtBQUFBLFVBQ25CO0FBQUEsUUFDRjtBQUFBLFFBQ0EsV0FBVztBQUFBLFVBQ1QsTUFBTSxFQUFFLFNBQVMsSUFBSTtBQUFBLFVBQ3JCLFFBQVEsRUFBRSxTQUFTLElBQUk7QUFBQSxRQUN6QjtBQUFBLFFBQ0EsWUFBWTtBQUFBLFVBQ1YsTUFBTSxFQUFFLFdBQVcsb0JBQW9CLFNBQVMsSUFBSTtBQUFBLFVBQ3BELFFBQVEsRUFBRSxXQUFXLGlCQUFpQixTQUFTLElBQUk7QUFBQSxRQUNyRDtBQUFBLFFBQ0EsaUJBQWlCO0FBQUEsVUFDZixZQUFZLEVBQUUsV0FBVyxnQkFBZ0I7QUFBQSxVQUN6QyxPQUFPLEVBQUUsV0FBVyxtQkFBbUI7QUFBQSxRQUN6QztBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsVUFBVTtBQUFBLElBQ1IsUUFBUTtBQUFBLE1BQ04saUJBQWlCLENBQUMsT0FBTztBQUFBLE1BQ3pCLFdBQVcsQ0FBQyxPQUFPO0FBQUEsSUFDckI7QUFBQSxFQUNGO0FBQUE7QUFBQSxFQUVBLFVBQVU7QUFBQSxJQUNSO0FBQUEsTUFDRSxTQUNFO0FBQUEsTUFDRixVQUFVLENBQUMsU0FBUyxhQUFhO0FBQUEsSUFDbkM7QUFBQSxJQUNBO0FBQUEsTUFDRSxTQUNFO0FBQUEsTUFDRixVQUFVLENBQUMsU0FBUyxhQUFhO0FBQUEsSUFDbkM7QUFBQSxJQUNBO0FBQUEsTUFDRSxTQUNFO0FBQUEsTUFDRixVQUFVLENBQUMsU0FBUyxhQUFhO0FBQUEsSUFDbkM7QUFBQSxJQUNBO0FBQUEsTUFDRSxTQUNFO0FBQUEsSUFDSjtBQUFBLElBQ0E7QUFBQSxNQUNFLFNBQ0U7QUFBQSxJQUNKO0FBQUEsSUFDQTtBQUFBLE1BQ0UsU0FDRTtBQUFBLElBQ0o7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxTQUFVLEVBQUUsV0FBVyxHQUFHO0FBQ3hCLGlCQUFXLFNBQVMsVUFBVTtBQUFBLElBQ2hDO0FBQUEsRUFDRjtBQUNGOzs7QURqU0EsSUFBTyx5QkFBUTtBQUFBLEVBQ2IsU0FBUyxDQUFDLFNBQVMsdUJBQWMsR0FBRyxZQUFZO0FBQ2xEOzs7QURIQSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsa0JBQWtCO0FBTG9OLElBQU0sMkNBQTJDO0FBT2hTLElBQUksc0JBQXNCLFVBQVU7QUFHcEMsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBO0FBQUEsRUFDTixlQUFlO0FBQUEsSUFDYjtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sUUFBUTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTixlQUFlLFFBQVE7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0g7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixXQUFXO0FBQUEsTUFDVCxVQUFVO0FBQUE7QUFBQSxNQUNWLE1BQU07QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFlBQVk7QUFBQSxNQUNaLFVBQVU7QUFBQTtBQUFBLElBQ1osQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMO0FBQUEsUUFDRSxNQUFNO0FBQUEsUUFDTixhQUFhLGNBQWMsSUFBSSxJQUFJLFNBQVMsd0NBQWUsQ0FBQztBQUFBLE1BQzlEO0FBQUEsTUFDQTtBQUFBLFFBQ0UsU0FBUztBQUFBLFFBQ1QsUUFBUTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sTUFBTTtBQUFBLFFBQ04sYUFBYSxDQUFDLFFBQVE7QUFDcEIsaUJBQU8sSUFBSSxRQUFRLE1BQU0sRUFBRTtBQUFBLFFBQzdCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxlQUFlO0FBQUEsTUFDYixRQUFRO0FBQUE7QUFBQTtBQUFBLFFBR04sZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCLENBQUMsY0FBYztBQUM3QixjQUFJLFVBQVUsU0FBUztBQUFhLG1CQUFPO0FBQzNDLGlCQUFPLFVBQVU7QUFBQSxRQUNuQjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFVBQVU7QUFBQTtBQUFBLFFBRVI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsaUJBQWlCO0FBQUEsTUFDZix5QkFBeUI7QUFBQSxJQUMzQjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyw4QkFBOEI7QUFBQSxJQUN4QyxnQkFBZ0I7QUFBQSxNQUNkLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxNQUNWO0FBQUEsTUFDQSxTQUFTLENBQUM7QUFBQSxJQUNaO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
