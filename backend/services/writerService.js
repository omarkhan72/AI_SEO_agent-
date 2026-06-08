import OpenAI from 'openai';

/**
 * Generates an article section-by-section using OpenAI to produce a high-quality Markdown body.
 * @param {string} title The target optimized SEO title of the article.
 * @param {Array<string>} headings The list of H2 headings to generate sections for.
 * @param {string} searchContext The live SERP search context.
 * @returns {Promise<string>} The unified master Markdown string.
 */
export async function generateArticleSections(title, headings, searchContext) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  let fullMarkdown = '';

  for (const heading of headings) {
    console.log(`Writing section for heading: "${heading}"...`);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert Senior Technical Writer and SEO specialist. 
Your task is to write a deeply humanized, thorough, and highly engaging article section under the specified H2 heading.
Do not write the H2 heading itself in your response, as the caller will automatically format it.
Write only the section body under that heading, using raw Markdown formatting (paragraphs, lists, bold text, code blocks if appropriate, etc.).
Keep the tone natural, authoritative, and helpful. Avoid robotic transitions or fluffy statements.`
        },
        {
          role: "user",
          content: `Global Context:
- Article Title: ${title}
- Target Keyword & Live Search Context: ${searchContext}

Current Task:
Write the section content for the H2 heading: "${heading}"`
        }
      ]
    });

    const sectionContent = response.choices[0].message.content.trim();
    fullMarkdown += `## ${heading}\n\n${sectionContent}\n\n`;
  }

  return fullMarkdown;
}
