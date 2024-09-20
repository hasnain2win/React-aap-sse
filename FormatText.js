 const formattedData = data
                .replace(/^"(.+(?="$))"$/, '$1')
                .replace(/\\n/g, '<br/>')
                .replace(
                  /(intent of the call:|steps taken by agent:|Follow-up:|Sentiment of caller:|entities:)/g,
                  '<strong>$1</strong>'
                )
                .replace(/Summary:/g, '') // Remove "Summary:" keyword
                .replace(/-\s/g, '<li>') // Replace hyphens with <li> tags
                .replace(/<li>([^<]+)<br\/>/g, '<li>$1</li>') // Close <li> tags
                .replace(/<li>/g, '<ul><li>') // Wrap list items in <ul> tags
                .replace(/<\/li>(?!<li>)/g, '</li></ul>'); // Close <ul> tags
              const newFormat = formattedData
                .trim()
                .replace(/<ul><li>\s*intent of the call:<\/li><\/ul>/g, 'intent of the call:')
                .replace(/<ul><li>\s*Follow-up:<\/li><\/ul>/g, 'Follow-up:')
                .replace(/<ul><li>\s*intent of the call:<br\/>/g, 'intent of the call:<br/>')
                .replace(/<ul><li>\s*Follow-up:<br\/>/g, 'Follow-up:<br/>');
