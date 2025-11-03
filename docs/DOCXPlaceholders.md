# DOCX Templates: Placeholders and Content Controls

This app supports importing a `.docx` file as a template and generating tailored resumes by replacing only the body text, preserving all original fonts, styles, spacing, and layout. To enable reliable replacement, your DOCX must include anchors where dynamic content goes.

Two supported anchor styles:

1) Mustache placeholders (plain text tokens)
   - Syntax examples:
     - {{name}}
     - {{contact.email}}
     - {{summary}}
     - {{#each experience}} ... {{/each}}
   - Good for simple documents without using Word’s advanced features.

2) Word Content Controls (Structured Document Tags)
   - Richer and more robust; ideal for professional templates.
   - Types supported: Rich Text, Plain Text, Repeating Section.
   - Add via Word: Developer tab → Controls.

Data model keys you can reference:

- contactInfo
  - name
  - email
  - phone
  - location
  - linkedin
  - github
  - website
- summary
- experience (array)
  - company
  - role
  - location
  - startDate
  - endDate
  - bullets (array of strings)
- education (array)
  - school
  - degree
  - location
  - startDate
  - endDate
  - gpa
- projects (array)
  - name
  - technologies (array of strings)
  - bullets (array of strings)
- skills (array of strings or grouped object)

Recommended placeholder layout

- Header
  - Name: {{contactInfo.name}}
  - Contacts line: {{contactInfo.email}} • {{contactInfo.phone}} • {{contactInfo.location}}
- Summary
  - Paragraph: {{summary}}
- Experience
  - Use a Repeating Section content control or a mustache loop:
    - {{#each experience}}
      - Company: {{company}} — Role: {{role}} — {{location}}
      - Dates: {{startDate}} – {{endDate}}
      - Bullets:
        - {{#each bullets}}• {{this}}{{/each}}
    - {{/each}}
- Education
  - {{#each education}}
    - {{school}} — {{degree}} — {{location}}
    - {{startDate}} – {{endDate}}{{#if gpa}} — GPA: {{gpa}}{{/if}}
  - {{/each}}
- Projects
  - {{#each projects}}
    - {{name}} | {{#each technologies}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}
    - Bullets:
      - {{#each bullets}}• {{this}}{{/each}}
  - {{/each}}
- Skills
  - One line: {{#each skills}}{{this}}{{#unless @last}}, {{/unless}}{{/each}}

Content Controls mapping (when present)

- Rich Text/Plain Text controls with tags matching keys above are replaced directly.
  - Example tag: contactInfo.name → replaced with the user’s name.
- Repeating Section controls tagged as experience, education, or projects are duplicated per item.
  - Within a repeating item, nested controls with tags like company, role, bullets are populated.

Best practices

- Keep existing headers (e.g., “Experience”, “Education”) as static text in your template.
- Put placeholders/controls only where variable content goes (company, bullets, dates…).
- Use the template’s own bullet styling; we only inject text.
- Set paragraph and character styles in the template; we do not change formatting.
- Prefer Content Controls for stability across different Word versions.

Troubleshooting

- If you still see the HTML preview instead of a DOCX download:
  - Open the resume, which triggers a DOCX availability probe; the viewer will show a “Download DOCX” button when the probe succeeds.
  - Ensure your imported template was a .docx and uploaded successfully (file size > 0).
- If generated DOCX is empty or missing content:
  - Verify placeholder names match the keys above.
  - For arrays (experience/projects/education), ensure you used a loop (mustache) or a Repeating Section control.
- If bullets lose their style:
  - Keep bullets as part of the template list formatting; placeholders should only be the text.

Versioning

- This document describes the current supported keys and patterns; future fields may be added without breaking the existing ones.
