# SMS Spam Filter - NLP Project

## Current State
New project, no existing code.

## Requested Changes (Diff)

### Add
- SMS message input form with classify button
- Spam/Ham classification engine (Naive Bayes-style scoring using token probabilities)
- Confidence score display with visual indicator
- Highlighted spam keywords in message
- Classification history log (stored in backend)
- Statistics dashboard: total classified, spam count, ham count, accuracy metrics
- Sample test messages for quick demo
- About/How it works section explaining the NLP approach

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: Store classified messages (text, label, confidence, timestamp). Expose APIs: classify message, get history, get stats, clear history.
2. Frontend: 
   - NLP classification logic in TypeScript using a Naive Bayes token probability model pre-trained on a small spam/ham vocabulary corpus
   - Main page: text input + classify button
   - Result card: Spam/Ham badge, confidence bar, highlighted tokens
   - History table: past classifications
   - Stats panel: pie/bar charts of spam vs ham ratio
   - Sample messages panel for quick testing
