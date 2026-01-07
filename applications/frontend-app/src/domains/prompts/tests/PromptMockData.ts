
export const mockData = {
    prompts: [
        {
            id: '1',
            title: 'Design a new feature',
            instructions: 'Design a new feature for the product',
            template: 'Design a new feature for the product',
            category: 'design/features',
            tags: ['design', 'features', 'shared']
        },
        {
            id: '2',
            title: 'Design a new user interface',
            instructions: 'Design a new user interface for the product',
            template: 'Design a new user interface for the product',
            category: 'design/ui',
            tags: ['design', 'ui', 'shared']
        },
        {
            id: '3',
            title: 'Prompt without category',
            instructions: 'This prompt has no category but has tags',
            template: 'Template for prompt without category',
            category: null,
            tags: ['testing', 'example']
        },
        {
            id: '4',
            title: 'Prompt without tags',
            instructions: 'This prompt has no tags but has a category',
            template: 'Template for prompt without tags',
            category: 'coding/review',
            tags: []
        }
    ]};
