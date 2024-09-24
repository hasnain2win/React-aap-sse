export const formatSummary = (data) => {
  let formatted = data
    .replace(/^"(.+(?="$))"$/, '$1') // Remove outer quotes
    .replace(/\\n/g, '\n') // Replace escaped newlines (\n) with actual newlines
    .replace(/\n\n/g, '</p><p>') // Replace double newlines with paragraph tags
    .replace(
      /(Summary:|intent of the call:|Follow-up:)/gi,
      '</p><p><strong>$1</strong>' // Wrap these headings in <p> tags with <strong>
    )
    .replace(
      /(steps taken by agent:|Sentiment of caller:|Entities:)/gi,
      '</p><p><strong>$1</strong>' // Wrap these headings in <p> tags with <strong>
    )
    // Use bullet points for lines starting with "- " after the specific headings
    .replace(
      /(steps taken by agent:|Sentiment of caller:|Entities:)([\s\S]*?)(?=(Summary:|intent of the call:|steps taken by agent:|Follow-up:|Sentiment of caller:|Entities:|$))/gi,
      (match, heading, content) => {
        const listItems = content
          .trim()
          .split('\n')
          .filter((line) => line.startsWith('-')) // Only include lines that start with "-"
          .map((line) => `<li>${line.substring(2)}</li>`) // Convert them into <li> elements
          .join('');

        return `<p>${heading}</strong></p><ul>${listItems}</ul>`; // Ensure correct <p> and <ul> placement
      }
    )
    .replace(/\n/g, '<br/>')
    .replace(/<br\/>-/g, '<br/>'); // Replace single newlines with <br/>

  return `<p>${formatted}</p>`; // Wrap the entire content in <p> tags};
};
