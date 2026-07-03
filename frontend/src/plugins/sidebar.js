export const sidebarMenu = [
    {
      mainTitle: "Master",
      mainLogo: "fa fa-database",
      children: [
        {
          title: "Referensi",
          logo: "fa fa-book",
          route: "/master/referensi",
        },
        {
          title: "Produk",
          logo: "fa fa-archive",
          route: "/master/produk",
        },
      ],
    },
    {
    staticClass: "nav-item static-item ms-2",
    mainTitle: "DASHBOARD",
    isStatic: true,
  },
  {
    mainTitle: "Doctor Dashboard",
    mainLogo: "ri-hospital-fill",
    route: "/",
  },
  {
    mainTitle: "Hospital Dashboard 1 ",
    mainLogo: "ri-home-8-fill",
    route: "/dashboard-1",
  },
  {
    mainTitle: "Hospital Dashboard 2",
    mainLogo: "ri-briefcase-4-fill",
    route: "/dashboard-2",
  },
  {
    mainTitle: "Patient Dashboard",
    mainLogo: "ri-briefcase-4-fill",
    route: "/patient-dashboard",
  },
  {
    mainTitle: "Covid-19 Dashboard",
    mainLogo: "ri-hospital-fill",
    route: "/dashboard-4",
  },
  {
    isHorizontal: true,
  },
  {
    staticClass: "nav-item static-item ms-2",
    mainTitle: "APPS",
    isStatic: true,
  },
  {
    mainTitle: "Email",
    mainLogo: "ri-mail-open-fill",
    children: [
      {
        title: "Inbox",
        logo: "icon ri-inbox-fill",
        route: "/email/inbox",
      },
      {
        title: "Email Compose",
        logo: "icon ri-edit-2-fill",
        route: "/email/email-compose",
      },
    ],
  },
  {
    mainTitle: "Doctor",
    svgIcon: true,
    mainSvg: `<svg class="icon-20" width="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                         <path opacity="0.4" d="M12.0865 22C11.9627 22 11.8388 21.9716 11.7271 21.9137L8.12599 20.0496C7.10415 19.5201 6.30481 18.9259 5.68063 18.2336C4.31449 16.7195 3.5544 14.776 3.54232 12.7599L3.50004 6.12426C3.495 5.35842 3.98931 4.67103 4.72826 4.41215L11.3405 2.10679C11.7331 1.96656 12.1711 1.9646 12.5707 2.09992L19.2081 4.32684C19.9511 4.57493 20.4535 5.25742 20.4575 6.02228L20.4998 12.6628C20.5129 14.676 19.779 16.6274 18.434 18.1581C17.8168 18.8602 17.0245 19.4632 16.0128 20.0025L12.4439 21.9088C12.3331 21.9686 12.2103 21.999 12.0865 22Z" fill="currentColor"></path>
                                         <path d="M11.3194 14.3209C11.1261 14.3219 10.9328 14.2523 10.7838 14.1091L8.86695 12.2656C8.57097 11.9793 8.56795 11.5145 8.86091 11.2262C9.15387 10.9369 9.63207 10.934 9.92906 11.2193L11.3083 12.5451L14.6758 9.22479C14.9698 8.93552 15.448 8.93258 15.744 9.21793C16.041 9.50426 16.044 9.97004 15.751 10.2574L11.8519 14.1022C11.7049 14.2474 11.5127 14.3199 11.3194 14.3209Z" fill="currentColor"></path>
                                     </svg>`,
    children: [
      {
        title: "All Doctor",
        logo: "ri-file-list-fill",
        route: "/doctor/doctor-list",
      },
      {
        title: "Add Doctor",
        logo: "ri-user-add-fill",
        route: "/doctor/add-doctor",
      },
      {
        title: "Doctor Profile",
        logo: "ri-profile-fill",
        route: "/doctor/doctor-profile",
      },
      {
        title: "Edit Doctor",
        logo: "ri-file-edit-fill",
        route: "/doctor/edit-doctor",
      },
    ],
  },
  {
    mainTitle: "Calendar",
    mainLogo: "ri-calendar-2-line",
    route: "/calendar",
  },
  {
    mainTitle: "Chat",
    mainLogo: "ri-message-fill",
    route: "/chat",
  },
  {
    staticClass: "nav-item static-item ms-2",
    mainTitle: "COMPONENTS",
    isStatic: true,
  },
  {
    mainTitle: "UI Elements",
    mainLogo: "ri-apps-fill",
    children: [
      {
        title: "Colors",
        logo: "ri-font-color",
        route: "/ui-elements/colors",
      },
      {
        title: "typography",
        logo: "ri-text",
        route: "/ui-elements/typography",
      },
      {
        title: "Alerts",
        logo: "ri-alert-fill",
        route: "/ui-elements/alerts",
      },
      {
        title: "Badges",
        logo: "ri-building-3-fill",
        route: "/ui-elements/badges",
      },
      {
        title: "Breadcrumb",
        logo: "ri-guide-fill",
        route: "/ui-elements/breadcrumb",
      },
      {
        title: "Buttons",
        logo: "ri-checkbox-blank-fill",
        route: "/ui-elements/buttons",
      },
      {
        title: "Cards",
        logo: "ri-bank-card-fill",
        route: "/ui-elements/cards",
      },
      {
        title: "Carousel",
        logo: "ri-slideshow-4-fill",
        route: "/ui-elements/carousel",
      },
      {
        title: "Video",
        logo: "ri-movie-fill",
        route: "/ui-elements/video",
      },
      {
        title: "Grid",
        logo: "ri-grid-fill",
        route: "/ui-elements/grid",
      },
      {
        title: "Images",
        logo: "ri-image-fill",
        route: "/ui-elements/images",
      },
      {
        title: "List Group",
        logo: "ri-file-list-fill",
        route: "/ui-elements/list-group",
      },
      {
        title: "Modal",
        logo: "ri-checkbox-blank-fill",
        route: "/ui-elements/modal",
      },
      {
        title: "Notifications",
        logo: "ri-notification-3-fill",
        route: "/ui-elements/notifications",
      },
      {
        title: "Pagination",
        logo: "ri-more-fill",
        route: "/ui-elements/pagination",
      },
      {
        title: "Popovers",
        logo: "ri-folder-shield-fill",
        route: "/ui-elements/popovers",
      },
      {
        title: "Progressbars",
        logo: "ri-battery-low-fill",
        route: "/ui-elements/progressbar",
      },
      {
        title: "Tabs",
        logo: "ri-database-fill",
        route: "/ui-elements/tabs",
      },
      {
        title: "Tooltips",
        logo: "ri-record-mail-fill",
        route: "/ui-elements/tooltips",
      }
    ],
  },
  {
    mainTitle: "Forms",
    mainLogo: "ri-device-fill",
    children: [
      {
        title: "Form Elements",
        logo: "ri-tablet-fill",
        route: "/forms/form-elements",
      },
      {
        title: "Form Validation",
        logo: "ri-device-fill",
        route: "/forms/form-validation",
      },
      {
        title: "Form Switch",
        logo: "ri-toggle-fill",
        route: "/forms/form-switch",
      },
      {
        title: "Form Checkbox",
        logo: "ri-chat-check-fill",
        route: "/forms/form-checkbox",
      },
      {
        title: "Form Radio",
        logo: "ri-radio-button-fill",
        route: "/forms/form-radio",
      },
    ],
  },
  {
    mainTitle: "Form Wizard",
    mainLogo: "ri-file-word-fill",
    children: [
      {
        title: "Simple Wizard",
        logo: "ri-anticlockwise-fill",
        route: "/form-wizard/simple-wizard",
      },
      {
        title: "Validate Wizard",
        logo: "ri-anticlockwise-2-fill",
        route: "/form-wizard/validate-wizard",
      },
      {
        title: "Vertical Wizard",
        logo: "ri-clockwise-fill",
        route: "/form-wizard/vertical-wizard",
      }
    ],
  },
  {
    mainTitle: "Table",
    mainLogo: "ri-table-fill",
    children: [
      {
        title: "Basic Tables",
        logo: "ri-table-fill",
        route: "/table/basic-table",
      },
      {
        title: "Data Table",
        logo: "ri-table-2",
        route: "/table/data-table",
      },
      {
        title: "Editable Table",
        logo: "ri-archive-drawer-fill",
        route: "/table/editable-table",
      },
    ],
  },
  {
    mainTitle: "Charts",
    mainLogo: "ri-bar-chart-2-fill",
    children: [
      {
        title: "Chart Page",
        logo: "ri-file-chart-fill",
        route: "/charts/chart-page",
      },
      {
        title: "ECharts",
        logo: "ri-bar-chart-fill",
        route: "/charts/e-chart",
      },
      {
        title: "Am Charts",
        logo: "ri-bar-chart-box-fill",
        route: "/charts/am-chart",
      },
      {
        title: "Apex Chart",
        logo: "ri-bar-chart-box-fill",
        route: "/charts/apexchart",
      }
    ],
  },
  {
    mainTitle: "Icons",
    mainLogo: "ri-bar-chart-2-fill",
    children: [
      {
        title: "Dripicons",
        logo: "ri-stack-fill",
        route: "/icons/dripicons",
      },
      {
        title: "Font Awesome 5",
        logo: "ri-facebook-fill",
        route: "/icons/fontawesome-5",
      },
      {
        title: "line Awesome",
        logo: "ri-keynote-fill",
        route: "/icons/line-awesome",
      },
      {
        title: "Remixicon",
        logo: "ri-remixicon-fill",
        route: "/icons/remixicon",
      },
      {
        title: "unicons",
        logo: "ri-underline",
        route: "/icons/unicons",
      },
    ],
  },
  {
    staticClass: "nav-item static-item ms-2",
    mainTitle: "PAGES",
    isStatic: true,
  },
  {
    mainTitle: "Authentication",
    mainLogo: "ri-server-fill",
    children: [
      {
        title: "Login",
        logo: "ri-login-box-fill",
        route: "/auth/sign-in",
      },
      {
        title: "Register",
        logo: "ri-logout-box-fill",
        route: "/auth/sign-up",
      },
      {
        title: "Recover Password",
        logo: "ri-record-mail-fill",
        route: "/auth/recover-password",
      },
      {
        title: "Confirm Mail",
        logo: "ri-chat-check-fill",
        route: "/auth/confirm-mail",
      },
      {
        title: "Lock Screen",
        logo: "ri-file-lock-fill",
        route: "/auth/lock-screen",
      },
    ],
  },
  {
    mainTitle: "Maps",
    mainLogo: "ri-map-pin-2-fill",
    children: [
      {
        title: "Google Map",
        logo: "ri-google-fill",
        route: "/maps/google-map",
      },
      {
        title: "Vector Map",
        logo: "ri-map-pin-range-line",
        route: "/maps/vector-map",
      },
    ],
  },
  {
    mainTitle: "Extra Pages",
    mainLogo: "ri-folders-fill",
    children: [
      {
        title: "Timeline",
        logo: "ri-map-pin-time-fill",
        route: "/extra-pages/timeline",
      },
      {
        title: "Invoice",
        logo: "ri-question-answer-fill",
        route: "/extra-pages/invoice",
      },
      {
        title: "Blank page",
        logo: "ri-checkbox-blank-fill",
        route: "/extra-pages/blank-page",
      },
      {
        title: "Error 404",
        logo: "ri-error-warning-fill",
        route: "/error/error-404",
      },
      {
        title: "Error 500",
        logo: "ri-error-warning-fill",
        route: "/error/error-500",
      },
      {
        title: "Pricing",
        logo: "ri-price-tag-3-fill",
        route: "/extra-pages/pricing",
      },
      {
        title: "Pricing 1",
        logo: "ri-price-tag-2-fill",
        route: "/extra-pages/pages-pricing-one",
      },
      {
        title: "Maintenance",
        logo: "ri-git-repository-commits-fill",
        route: "/extra-pages/maintenace",
      },
      {
        title: "Coming Soon",
        logo: "ri-run-fill",
        route: "/extra-pages/coming-soon",
      },
      {
        title: "FAQ",
        logo: "ri-compasses-2-fill",
        route: "/extra-pages/faq",
      },
    ],
  },
  {
    isHorizontal: true,
  },
];
