
export const mockData = {
    notes: [
        {
            id: '1',
            title: 'Design a new feature',
            content: 'Design a new feature for the product. This includes understanding user requirements, creating mockups, and defining the technical specifications.',
            last_modified_utc: '2024-01-15T10:30:00Z',
            category: 'design/features',
            tags: ['design', 'features', 'shared']
        },
        {
            id: '2',
            title: 'Design a new user interface',
            content: 'Design a new user interface for the product. Focus on user experience, accessibility, and modern design principles.',
            last_modified_utc: '2024-01-16T14:20:00Z',
            category: 'design/ui',
            tags: ['design', 'ui', 'shared']
        },
        {
            id: '3',
            title: 'Note without category',
            content: 'This note has no category but has tags. It serves as an example of a note that exists outside of a specific category hierarchy.',
            last_modified_utc: '2024-01-17T09:15:00Z',
            category: null,
            tags: ['testing', 'example']
        },
        {
            id: '4',
            title: 'Note without tags',
            content: 'This note has no tags but has a category. It demonstrates how notes can be organized using categories alone.',
            last_modified_utc: '2024-01-18T16:45:00Z',
            category: 'coding/review',
            tags: []
        }
    ]};
