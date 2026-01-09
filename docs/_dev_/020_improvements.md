# Continuous improvements

This doc is about how to improve the project, including agent instructions.

## Ask Agent to review and fix a mess

- I noticed that the implementation is not according to guidelines
- Ask agent to review and fix
- Ask agent to explain how to fix the AGENTS.md file

Here's a communication example, after agent messed up.

```text
I think we have a mess with the implementation related to testing and bootstrapping

Looking at auth/testHelpers.ts

Testing SHOULD be real store -> real service -> mock repository, but it is not. It is creating mock service, which is against the guidelines.

Please check that immediatelly
````

Have Agent (in ASK mode) to explain how to self-improve:

```text
How should I change the @applications/frontend-app/AGENTS.md file so that this never happens again?

Perhaps just add to Test Guidelines the following statement
- ✅ ALWAYS test **Real Components** + **Real Store** + **Real Service** + **Mock Repository**

Something else?
```