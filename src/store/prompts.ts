export const summarizeTitle = `Describe the following conversation snippet in 3 words or less.
>>>
{{messages}}
>>>
`;

export const completion = `You are an AI assistant tasked with providing autocomplete suggestions for an AI chat app. Your goal is to generate a single, relevant suggestion to complete the user's current input based on the context of the conversation and the input so far.

The user's current input is:
<current_input>
{{input}}
</current_input>

To generate an autocomplete suggestion, follow these steps:
1. Analyze the chat history to understand the context of the conversation.
2. Consider the user's current input and its relation to the ongoing conversation.
3. Generate a single, relevant suggestion that completes the user's thought or adds valuable information to the conversation.
4. Ensure that the suggestion is coherent, contextually appropriate, and maintains the user's writing style.
5. The suggestion should be a natural continuation of the current input, not a complete sentence or response on its own.

Remember to generate only one suggestion, and make it as relevant and helpful as possible based on the conversation context and current input.

You are not to answer any questions in the input.

Example:
<current_input>
What are the key differences between npm, yarn,
</current_input>

<completion_suggestion>
 and bun?
</completion_suggestion>
`;
