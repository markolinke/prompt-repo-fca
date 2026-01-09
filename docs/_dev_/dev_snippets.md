# Development Process and snippets

## Planning and implementation

In general, this is the flow:

1. Plan Feature
2. Plan Implementation
3. Implement
4. Refactor
5. Document

### Plan feature

Ensure that the expected outcomes are clear.

1. Explain your intent, using agent, and dump the functional requirements into a markdown file.
2. Point the Agent to the plan, and ask it to create clarification questions
3. Once all the questions are complete, ask it to review the plan for any issues (ambiguity, inconsistency, etc)
4. Update the plan

### Plan Implementation

Ensure that the implementation will proceed as expected.

1. Point the Agent to the plan, and explain you're about to implement it. Start with the implementation plan (Agent is in Plan mode). Request the agent to ask you any questions regarding the implementation
2. Once all the questions are answered, remind it to include the following to the plan
   1. reference to Implementation guidelines, Testing, and principles
   2. Testing instructions
   3. Review of the implementation
3. If nececary, ask the agent to code in phases. If that is the case, ask it to create a subplan. Emphasize that each phase must:
   1. end up in a stable state
   2. remind it to guidelines
   3. remind it to testing
   4. remind it to build once done
4. Save the plan to file in the project

Example conversation

Message 1 - create the plan

```text
Next, I'd like to add authentication and authorization.

Given this is FastAPI rest service, it serves frontend application, obviously we'll need login flow, we'll need protected endpoints. I'll definitelly need social sign in, such as Google SSO and later on Microsoft SSO.

Also, I am considering using a third-party provider, such as AWS Cognito.

How should I decide about implementation? What options do we have? Let's discuss this a bit
```

Message 2 - split the huge plan

```text
split the to-dos per phase, so we can execute the phase one at a time
```

> **NOTE**
> Save the plan to the file system (inside project)
>
> It should be saved in something like .cursor/plans directory

### Implement

Proceed with implementation

1. Implement the plan
   1. Implement yourself or by Agent
   2. Run Build (you do it!)
      1. HINT: It's useful to try to fix errors yourself, as a learning process
   3. Run Tests (you do it!)
      1. HINT: See above
   4. Repeat until running
2. Review process:
   1. Be very, very strict (YOU own the code)
   2. Review everything thoroughly
   3. Run tests (automated and manual)
   4. ask it to fix issues
3. Commit often

#### Example Conversation

Trigger the agent to start implementation

```text
Please proceed with implementation of phase 1 to-dos
```

For large plans, have it done in phases. For example:

```text
Let's proceed with Phase 4 in the [PLAN FILENAME] for enabling authorization

The Phase 4 is Frontend JWT Integration, so let's do it.

Please plan the implementation of frontend jwt integration. 

Make sure to make the plan also phased, so we can have a more chunked approach to building, and have multiple stable milestones along that way

Please provide me with instructions and code that I should write
````

Or even...

```text
Please proceed with the implementation of the plan. Please build phase 4.1 now, but not anything else
```

Paste any errors and/or logs from terminal

```text
zsh (23-41)
```

When the code is working, and it seems right, next step is **refactoring**.

### Refactoring

Ask the agent to review the implementation and assess how it complies with development guidelines.

Ask Agent to review the implementation, how does it comply with guidelines.

#### (Optional) Check does the agent see relevant guidelines

```text
Now, I need you to review the work done, how it complies to the standards and practices described in the guidelines outlined in markdown files in this project.

Before continuing with that, tell me which guidelines will you use for that?
````

#### Check the implementation based on the guidelines

```text
Please review the work done, how it complies to the standards and practices described in the guidelines outlined in markdown files in this project.
````

### Document

1. Prepare the document where the review should be stored (as it will be long)
2. Ask for a review and to store it to the file. The review should contain
   1. Architectural implementation info
   2. Dependencies and bootstrapping information
   3. Runtime process information
   4. Information how to test, and how to learn more 
   5. Any other relevant information specific to implementation...

For example:

```text
Now, explain to me, as to a junior developer, as simply and straightforward as possible, how does the system work with respect to the phase 1 implementation. For example (but not restricted to)
- What calls what, 
- what depends on what, 
- how do requests work
- what routes have been added and what is their purpose
- what is the sequence of execution
- what is middleware and how it works, 
- how to play with it in order to better understand and learn more

Please append a file [FILENAME] with your reply
```

## Testing

Frontend

- Run tests: pnpm test
- Get coverage: pnpm test-coverage
