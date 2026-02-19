# Personality Assessment Question Formatting

## Problem Statement

The IPIP-50 questions are stored as **verb phrases** (e.g., "Am quiet around strangers.", "Insult people.", "Have a soft heart."), not complete sentences. When displayed to users, these need to be:
1. Converted into grammatically correct, conversational first-person statements
2. Made accessible to users of all education levels (including high school students and those without formal education)

## Solution

We implemented a `formatQuestionText()` function that converts IPIP verb phrases into proper first-person statements:

```typescript
const formatQuestionText = (questionText: string): string => {
  // Remove trailing period if present
  const cleanText = questionText.trim().replace(/\.$/, '');
  
  // Convert first letter to lowercase for proper grammar
  const lowercaseText = cleanText.charAt(0).toLowerCase() + cleanText.slice(1);
  
  // Add "I " prefix to create first-person statement
  return `I ${lowercaseText}.`;
};
```

## Examples

| Original IPIP Text | Formatted Display |
|-------------------|-------------------|
| "Am quiet around strangers." | "I am quiet around strangers." |
| "Insult people." | "I insult people." |
| "Have a soft heart." | "I have a soft heart." |
| "Don't talk a lot." | "I don't talk a lot." |
| "Feel comfortable around people." | "I feel comfortable around people." |
| "Am the life of the party." | "I am the life of the party." |
| "Get stressed out easily." | "I get stressed out easily." |
| "Have a rich vocabulary." | "I have a rich vocabulary." |

## Why This Approach?

### ✅ Grammatically Correct
- Creates proper first-person statements
- Maintains natural English grammar
- Works with all IPIP question structures

### ✅ Culturally Accessible
- Simple, direct language
- No complex sentence structures
- Easy to understand for non-native English speakers
- Translates well to other languages

### ✅ Conversational & Engaging
- Feels like self-reflection, not a clinical test
- Personal and relatable
- Reduces assessment anxiety

### ✅ Scientifically Valid
- Preserves the original IPIP question meaning
- Doesn't alter the psychological construct being measured
- Maintains research validity

## Alternative Approaches Considered

### ❌ "I am someone who [verb phrase]"
**Problem:** Creates grammatical errors
- "I am someone who am quiet" ❌
- "I am someone who insult people" ❌

### ❌ "Do you [verb phrase]?"
**Problem:** Changes the assessment format
- Converts statements to questions
- May alter response patterns
- Deviates from validated IPIP format

### ❌ Rewriting all 50 questions manually
**Problem:** Risks invalidating the assessment
- IPIP questions are scientifically validated
- Changing wording could alter psychological meaning
- Would require re-validation studies

## Dual-Display Implementation

Each question is displayed in TWO formats for maximum accessibility:

### 1. **Primary Question (IPIP Format)**
- Grammatically correct first-person statement
- Preserves scientific validity
- Displayed in larger text (text-xl)

### 2. **Simplified Context (Below)**
- Plain language explanation
- Uses common vocabulary (8th-grade reading level)
- Displayed in smaller, italic text (text-sm, italic)
- Helps users understand without changing the validated question

```typescript
{/* IPIP Question (Original) */}
<p className="text-xl font-normal text-luna-gray-900 mb-3 text-center">
  {formatQuestionText(currentQuestion.question_text)}
</p>

{/* Simplified Version for Context */}
<p className="text-sm text-luna-gray-600 mb-8 text-center italic">
  {getSimplifiedQuestion(currentQuestion.question_text)}
</p>
```

### Example Display:

**I am exacting in my work.**
*I am very careful and precise when doing my work.*

**I have a vivid imagination.**
*I can easily picture creative ideas and scenarios in my mind.*

**I shirk my duties.**
*I avoid or neglect my responsibilities.*

## Testing

To verify proper formatting, test with these sample questions:
1. Question 1: "Am the life of the party." → "I am the life of the party."
2. Question 6: "Don't talk a lot." → "I don't talk a lot."
3. Question 12: "Insult people." → "I insult people."
4. Question 46: "Am quiet around strangers." → "I am quiet around strangers."

All 50 questions should display as grammatically correct first-person statements.

