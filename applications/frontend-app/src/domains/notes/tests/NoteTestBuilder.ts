import { Note } from '../entities/Note';

/**
 * Builder pattern for creating Note test instances.
 * Provides a fluent API for constructing test notes with default values.
 * 
 * @example
 * ```typescript
 * const note = NoteTestBuilder.create()
 *   .withId('1')
 *   .withTitle('Test Note')
 *   .withContent('Test content')
 *   .build();
 * ```
 */
export class NoteTestBuilder {
  private id = 'test-1';
  private title = 'Test Note';
  private content = 'Test content';
  private lastModified = new Date('2024-01-15T10:00:00Z');
  private category: string | null = 'test/category';
  private tags: string[] = ['test'];

  static create(): NoteTestBuilder {
    return new NoteTestBuilder();
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  withContent(content: string): this {
    this.content = content;
    return this;
  }

  withDate(date: Date): this {
    this.lastModified = date;
    return this;
  }

  withCategory(category: string | null): this {
    this.category = category;
    return this;
  }

  withTags(tags: string[]): this {
    this.tags = tags;
    return this;
  }

  withNoCategory(): this {
    this.category = null;
    return this;
  }

  withNoTags(): this {
    this.tags = [];
    return this;
  }

  build(): Note {
    return new Note(
      this.id,
      this.title,
      this.content,
      this.lastModified,
      this.category,
      this.tags
    );
  }
}

