# No-Duplicate Apology Final Guard

Release: 2026-07-12

## Final behavior

- **With Apology** removes every apology produced by AI or an SOP macro, then inserts exactly one controlled apology sentence in the selected output language.
- **Without Apology** removes all Arabic and English apology wording from the final ticket.
- **Internal Escalation** always removes customer-facing apologies, regardless of the selected button.
- Mixed sentences are preserved when possible. For example, the apology clause is removed while the operational statement such as “Your case has been escalated” remains.
- The guard runs after the Worker response and before the ticket is displayed or copied.

## Covered English variants

Examples include: sorry, apologies, apology, apologize/apologise and their common inflections, regret, pardon, “please accept our apologies,” and “we regret to inform you.”

## Covered Arabic variants

Examples include: نعتذر، اعتذر، أعتذر، اعتذارنا، اعتذاراتنا، نأسف، ناسف، آسف، اسف، آسفون، آسفين، يؤسفنا، المعذرة، سامحنا، اعذرنا، وأعذرنا.

## QA result

The deterministic test suite passed 12 cases covering duplicated paragraphs, mixed apology/action clauses, spelling variants, Arabic/English output, no-apology mode, and internal escalation.
