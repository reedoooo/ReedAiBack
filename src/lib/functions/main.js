const functionCalls = {
  // React Component Optimization and Enhancement
  enhance_react_component: {
    description: 'Enhance a given React component for improved performance and readability',
    parameters: {
      component_name: 'Name of the React component',
      props_description: 'Description of the component props',
      code_sample: 'Current code of the React component',
      library_version: 'Version of React and other used libraries',
    },
  },
  refactor_component: {
    description: 'Refactor a React component to improve code structure and maintainability',
    parameters: {
      component_name: 'Name of the React component',
      code_sample: 'Current code of the React component',
      goals: 'Specific goals for refactoring',
    },
  },
  convert_class_to_functional: {
    description: 'Convert a class component to a functional component',
    parameters: {
      component_name: 'Name of the React component',
      class_code_sample: 'Current class component code',
    },
  },
  optimize_react_memo: {
    description: 'Optimize component rendering using React.memo',
    parameters: {
      component_name: 'Name of the React component',
      component_code: 'Current component code',
    },
  },
  use_effect_optimization: {
    description: 'Optimize useEffect hooks in a React component',
    parameters: {
      component_name: 'Name of the React component',
      use_effect_code: 'Current useEffect code',
    },
  },
  implement_custom_hooks: {
    description: 'Create custom hooks to extract reusable logic',
    parameters: {
      component_code: 'Current component code',
      logic_to_extract: 'Description of logic to be extracted into a custom hook',
    },
  },
  optimize_react_context: {
    description: 'Optimize Context API usage in a React application',
    parameters: {
      context_code: 'Current Context API implementation',
      component_tree: 'Component tree structure',
    },
  },

  // State Management
  implement_redux: {
    description: 'Add Redux state management to a React component',
    parameters: {
      component_name: 'Name of the React component',
      redux_structure: 'Current Redux state structure',
      component_code: 'Current React component code',
    },
  },
  implement_mobx: {
    description: 'Implement MobX state management in a React component',
    parameters: {
      component_name: 'Name of the React component',
      component_code: 'Current component code',
      state_structure: 'Desired state structure',
    },
  },
  implement_recoil: {
    description: 'Implement Recoil state management in a React application',
    parameters: {
      component_name: 'Name of the React component',
      component_code: 'Current component code',
      atom_structure: 'Desired Recoil atom structure',
    },
  },
  implement_zustand: {
    description: 'Implement Zustand state management in a React application',
    parameters: {
      component_name: 'Name of the React component',
      component_code: 'Current component code',
      store_structure: 'Desired Zustand store structure',
    },
  },

  // Performance Optimization
  implement_code_splitting: {
    description: 'Implement code splitting for improved performance',
    parameters: {
      app_structure: 'Current app structure',
      target_component: 'Component to apply code splitting',
    },
  },
  implement_react_query: {
    description: 'Implement React Query for efficient data fetching and caching',
    parameters: {
      component_name: 'Name of the React component',
      api_endpoint: 'API endpoint for data fetching',
      current_fetch_code: 'Current data fetching code',
    },
  },
  implement_swr: {
    description: 'Implement SWR for data fetching and caching',
    parameters: {
      component_name: 'Name of the React component',
      api_endpoint: 'API endpoint for data fetching',
      current_fetch_code: 'Current data fetching code',
    },
  },
  optimize_react_rendering: {
    description: 'Optimize React rendering performance',
    parameters: {
      component_tree: 'Current component tree structure',
      performance_metrics: 'Current performance metrics',
    },
  },
  implement_virtual_scrolling: {
    description: 'Implement virtual scrolling for large lists',
    parameters: {
      component_name: 'Name of the list component',
      data_structure: 'Structure of the list data',
      current_list_code: 'Current list implementation code',
    },
  },

  // Testing and Debugging
  generate_unit_tests: {
    description: 'Generate unit tests for a given React component',
    parameters: {
      component_name: 'Name of the React component',
      code_sample: 'Current code of the React component',
      testing_library: 'Testing framework to use (e.g. Jest, React Testing Library)',
    },
  },
  generate_integration_tests: {
    description: 'Generate integration tests for React components',
    parameters: {
      components: 'List of components to test',
      interaction_flow: 'Description of component interactions to test',
    },
  },
  generate_e2e_tests: {
    description: 'Generate end-to-end tests for a React application',
    parameters: {
      user_flow: 'Description of user flow to test',
      testing_framework: 'E2E testing framework (e.g., Cypress, Playwright)',
    },
  },
  get_debugging_tips: {
    description: 'Provide debugging tips for identified issues in React components',
    parameters: {
      component_name: 'Name of the React component',
      error_message: 'Error message or issue description',
      code_sample: 'Relevant code snippet for debugging',
    },
  },
  implement_error_boundary: {
    description: 'Implement an error boundary for a React component or application',
    parameters: {
      target_component: 'Component to wrap with error boundary',
      error_handling_strategy: 'Strategy for handling and reporting errors',
    },
  },

  // Styling and Design System Integration
  style_react_component: {
    description: 'Update the styling of a React component with modern CSS techniques',
    parameters: {
      component_name: 'Name of the React component',
      current_styles: 'Current CSS styles of the component',
      design_language: 'Preferred design system or language',
    },
  },
  implement_css_in_js: {
    description: 'Implement CSS-in-JS styling for a React component',
    parameters: {
      component_name: 'Name of the React component',
      current_styles: 'Current CSS styles',
      css_in_js_library: 'Preferred CSS-in-JS library (e.g., styled-components, Emotion)',
    },
  },
  convert_css_to_tailwind: {
    description: 'Convert traditional CSS to Tailwind CSS classes',
    parameters: {
      component_name: 'Name of the React component',
      current_css: 'Current CSS styles',
      tailwind_config: 'Custom Tailwind configuration (if any)',
    },
  },
  implement_material_ui: {
    description: 'Implement Material-UI components and styling',
    parameters: {
      component_name: 'Name of the React component',
      current_html: 'Current component JSX',
      desired_mui_components: 'List of Material-UI components to use',
    },
  },
  convert_bootstrap_to_material_ui: {
    description: 'Convert Bootstrap components and classes to Material-UI',
    parameters: {
      component_name: 'Name of the React component',
      bootstrap_code: 'Current Bootstrap-based component code',
    },
  },
  convert_material_ui_to_ant_design: {
    description: 'Convert Material-UI components to Ant Design components',
    parameters: {
      component_name: 'Name of the React component',
      material_ui_code: 'Current Material-UI-based component code',
    },
  },
  implement_chakra_ui: {
    description: 'Implement Chakra UI components and styling',
    parameters: {
      component_name: 'Name of the React component',
      current_html: 'Current component JSX',
      desired_chakra_components: 'List of Chakra UI components to use',
    },
  },
  convert_css_modules_to_styled_components: {
    description: 'Convert CSS Modules to styled-components',
    parameters: {
      component_name: 'Name of the React component',
      css_module_code: 'Current CSS Module code',
      component_jsx: 'Current component JSX',
    },
  },

  // TypeScript Integration
  convert_to_typescript: {
    description: 'Convert a JavaScript React component to TypeScript',
    parameters: {
      component_code: 'Current JavaScript component code',
      strictness_level: 'TypeScript strictness level',
    },
  },
  generate_typescript_types: {
    description: 'Generate TypeScript types from JavaScript code',
    parameters: {
      js_code: 'JavaScript code to convert',
      strictness_level: 'TypeScript strictness level',
    },
  },
  implement_generics: {
    description: 'Implement TypeScript generics in a React component',
    parameters: {
      component_name: 'Name of the React component',
      component_code: 'Current component code',
      use_case: 'Description of the use case for generics',
    },
  },

  // Accessibility
  generate_accessibility_report: {
    description: 'Generate an accessibility report for a given React component',
    parameters: {
      component_code: 'Code of the React component',
      wcag_level: 'WCAG compliance level to check against',
    },
  },
  implement_aria_attributes: {
    description: 'Implement ARIA attributes for improved accessibility',
    parameters: {
      component_name: 'Name of the React component',
      component_html: 'Current component JSX',
    },
  },
  implement_keyboard_navigation: {
    description: 'Implement keyboard navigation for a React component',
    parameters: {
      component_name: 'Name of the React component',
      component_structure: 'Structure of the component (e.g., menu, form)',
    },
  },

  // Build and Bundle Optimization
  optimize_webpack_config: {
    description: 'Optimize Webpack configuration for better build performance',
    parameters: {
      current_config: 'Current Webpack configuration',
      build_target: 'Target environment (e.g., production, development)',
    },
  },
  implement_tree_shaking: {
    description: 'Implement tree shaking for reducing bundle size',
    parameters: {
      current_config: 'Current build configuration',
      target_modules: 'Modules to apply tree shaking',
    },
  },
  analyze_bundle_size: {
    description: 'Analyze and provide recommendations to reduce bundle size',
    parameters: {
      bundle_stats: 'Current bundle size statistics',
      target_size: 'Desired bundle size',
    },
  },
  setup_module_federation: {
    description: 'Set up Webpack Module Federation for micro-frontends',
    parameters: {
      app_structure: 'Current application structure',
      shared_modules: 'List of modules to be shared between apps',
    },
  },

  // Image Optimization
  optimize_images: {
    description: 'Optimize images used in a React application',
    parameters: {
      image_list: 'List of image URLs or file paths',
      target_format: 'Desired image format (e.g., WebP, AVIF)',
    },
  },
  implement_lazy_loading: {
    description: 'Implement lazy loading for images in a React component',
    parameters: {
      component_name: 'Name of the React component',
      image_list: 'List of images to lazy load',
    },
  },

  // Internationalization
  implement_internationalization: {
    description: 'Implement internationalization (i18n) in a React application',
    parameters: {
      app_structure: 'Current app structure',
      supported_languages: 'List of supported languages',
      translation_strings: 'Initial set of translation strings',
    },
  },
  setup_rtl_support: {
    description: 'Set up Right-to-Left (RTL) language support in a React app',
    parameters: {
      current_styles: 'Current CSS styles',
      rtl_languages: 'List of RTL languages to support',
    },
  },

  // Form Handling
  optimize_react_forms: {
    description: 'Optimize form handling in a React component',
    parameters: {
      form_code: 'Current form implementation code',
      validation_requirements: 'Form validation requirements',
    },
  },
  implement_formik: {
    description: 'Implement Formik for advanced form handling',
    parameters: {
      component_name: 'Name of the form component',
      form_fields: 'List of form fields and their types',
      validation_schema: 'Yup validation schema for the form',
    },
  },
  implement_react_hook_form: {
    description: 'Implement react-hook-form for efficient form handling',
    parameters: {
      component_name: 'Name of the form component',
      form_fields: 'List of form fields and their types',
      validation_rules: 'Validation rules for form fields',
    },
  },

  // Advanced Component Types
  implement_compound_component: {
    description: 'Implement a compound component pattern',
    parameters: {
      component_name: 'Name of the main component',
      sub_components: 'List of sub-components',
      shared_state: 'Description of shared state between components',
    },
  },
  implement_render_props: {
    description: 'Implement the render props pattern',
    parameters: {
      component_name: 'Name of the component',
      render_prop: 'Description of the render prop function',
      shared_logic: 'Description of the shared logic',
    },
  },
  implement_hoc: {
    description: 'Implement a Higher-Order Component (HOC)',
    parameters: {
      hoc_name: 'Name of the HOC',
      wrapped_component: 'Component to be wrapped',
      added_functionality: 'Description of functionality to be added',
    },
  },
  implement_controlled_component: {
    description: 'Implement a fully controlled component',
    parameters: {
      component_name: 'Name of the component',
      props: 'List of props for controlling the component',
      state_management: 'Description of how state should be managed',
    },
  },
  implement_portal: {
    description: 'Implement a React Portal for rendering outside the DOM hierarchy',
    parameters: {
      component_name: 'Name of the component to render in a portal',
      target_dom_node: 'Target DOM node for rendering the portal',
    },
  },
  implement_error_boundary: {
    description: 'Implement an Error Boundary component',
    parameters: {
      error_types: 'Types of errors to catch',
      fallback_ui: 'Description of the fallback UI to render on error',
    },
  },
  implement_suspense: {
    description: 'Implement React Suspense for handling async operations',
    parameters: {
      component_name: 'Name of the component using Suspense',
      async_resources: 'List of async resources to be loaded',
      fallback_ui: 'Description of the loading UI',
    },
  },

  // Animation and Transition
  implement_react_spring: {
    description: 'Implement animations using react-spring',
    parameters: {
      component_name: 'Name of the component to animate',
      animation_description: 'Description of the desired animation',
    },
  },
  implement_framer_motion: {
    description: 'Implement animations using Framer Motion',
    parameters: {
      component_name: 'Name of the component to animate',
      animation_description: 'Description of the desired animation',
    },
  },
  implement_gsap: {
    description: 'Implement animations using GreenSock Animation Platform (GSAP)',
    parameters: {
      component_name: 'Name of the component to animate',
      animation_description: 'Description of the desired animation',
    },
  },
};

module.exports = { functionCalls };