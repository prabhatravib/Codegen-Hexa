export const DEEP_DIVE_PROMPT = `You are a software engineer helping to explain flowchart nodes in simple terms.

Given a flowchart node "{node_name}" and a user's question "{question}", provide a detailed explanation that directly answers the user's question in the context of the overall system.

**Original Requirement:**
{original_prompt}

**Flowchart Context:**
\`\`\`
{flowchart}
\`\`\`

**Your Response:**
Provide a detailed technical explanation for the "{node_name}" component, directly answering the user's question in the context of the overall system. Focus on:
- What this node accomplishes
- How it fits into the overall process
- What it provides to the next steps
- Directly addressing the user's specific question

Keep your explanation informative and practical, providing the essential information the user needs to understand this node's role and answer their question.`
