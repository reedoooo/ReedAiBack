const userPrompts = {
  UI_ANALYSIS_FROM_IMAGE: `Generate a prompt for a component generator UI which gives a precisely accurate analysis of the the component in the image and providers all details necessary for replicating the exact same component`,
};
const initialUserPrompts = [
  {
    name: 'Enhanced Button Styling',
    content:
      'How can I create a custom-styled button component in Material-UI with hover and focus states, and integrate it with a theme?',
    sharing: 'public',
    role: 'user',
    type: 'style-enhancement',
    rating: 4.5,
    tags: ['Material-UI', 'button', 'styling', 'theme'],
  },
  {
    name: 'State Management for Form Inputs',
    content: "What's the best way to manage state for multiple form inputs in a React component using hooks?",
    role: 'user',
    type: 'state-management',
    sharing: 'public',
    rating: 4.7,
    tags: ['React', 'state-management', 'hooks', 'forms'],
  },
  {
    name: 'Responsive Grid Layout with Material-UI',
    content: 'How do I create a responsive grid layout in Material-UI that adapts to different screen sizes?',
    role: 'user',
    type: 'layout',
    sharing: 'public',
    rating: 4.8,
    tags: ['Material-UI', 'grid', 'responsive', 'layout'],
  },
  {
    name: 'Dark Mode Integration',
    content: "How can I implement a dark mode toggle in a React app using Material-UI's theme provider?",
    role: 'user',
    type: 'theme-integration',
    sharing: 'public',
    rating: 4.9,
    tags: ['Material-UI', 'dark mode', 'theme', 'React'],
  },
  {
    name: 'Optimizing Component Performance',
    content: 'What are some best practices for optimizing the performance of large React components?',
    role: 'frontend',
    type: 'performance',
    sharing: 'public',
    rating: 4.6,
    tags: ['React', 'performance', 'optimization', 'components'],
  },
];

module.exports = { userPrompts, initialUserPrompts };
