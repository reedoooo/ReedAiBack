const promptCategories = {
  CODING: {
    name: 'Coding',
    sub: {
      FRONTEND: {
        name: 'Frontend',
        sub: {
          name: 'React',
          sub: {
            UI_LIBRARIES: {
							name: 'UI Libraries',
              sub: ['React-Bootstrap', 'Material-UI', 'Ant-Design'],
						},
						STATE_MANAGEMENT: {
							name: 'State Management',
              sub: ['Redux', 'MobX', 'Context API'],
						},
						ROUTING: {
							name: 'Routing',
              sub: ['React-Router', 'Next.js', 'Gatsby'],
						},
          },
        },
      },
      BACKEND: {
        name: 'Backend',
				sub: {
          name: 'Node.js',
          sub: {
						FRAMEWORKS: {
							name: 'Frameworks',
							sub: ['Express', 'Koa', 'NestJS'],
						},
						DATABASES: {
							name: 'Databases',
							sub: ['MongoDB', 'PostgreSQL', 'MySQL'],
						},
						TESTING: {
							name: 'Testing',
							sub: ['Jest', 'Mocha', 'Chai'],
						},
          },
        },
      },
      DEBUGGING: 'Debugging',
      IDEAS: 'Ideas',
      TESTING: 'Testing',
      REFACTORING: 'Refactoring',
      VERSION_CONTROL: 'Version Control',
      CI_CD: 'CI/CD',
      TOOLS: 'Tools',
    },
  },
};
