/**
 * Format announcement content with basic markdown and line breaks.
 * Supports **bold**, *italic*, __underline__, unordered and ordered lists.
 */
function formatAnnouncementContent(text) {
    if (!text) return '';
    
    const escapeHtml = (value) => value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const applyInlineMarkdown = (value) => {
        return value
            .replace(/__(.+?)__/g, '<u>$1</u>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>');
    };

    const lines = escapeHtml(text).split(/\r?\n/);
    const htmlParts = [];
    let normalLines = [];
    let inUl = false;
    let inOl = false;

    const closeLists = () => {
        if (inUl) {
            htmlParts.push('</ul>');
            inUl = false;
        }
        if (inOl) {
            htmlParts.push('</ol>');
            inOl = false;
        }
    };

    const flushNormalLines = () => {
        if (normalLines.length > 0) {
            htmlParts.push(normalLines.join('<br>'));
            normalLines = [];
        }
    };

    lines.forEach((line) => {
        const olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
        const ulMatch = line.match(/^\s*[-*]\s+(.*)$/);

        if (olMatch) {
            flushNormalLines();
            if (inUl) {
                htmlParts.push('</ul>');
                inUl = false;
            }
            if (!inOl) {
                htmlParts.push('<ol class="announcements-sublist">');
                inOl = true;
            }
            htmlParts.push(`<li>${applyInlineMarkdown(olMatch[1])}</li>`);
            return;
        }

        if (ulMatch) {
            flushNormalLines();
            if (inOl) {
                htmlParts.push('</ol>');
                inOl = false;
            }
            if (!inUl) {
                htmlParts.push('<ul class="announcements-sublist">');
                inUl = true;
            }
            htmlParts.push(`<li>${applyInlineMarkdown(ulMatch[1])}</li>`);
            return;
        }

        closeLists();
        if (line.trim() === '') {
            normalLines.push('');
        } else {
            normalLines.push(applyInlineMarkdown(line));
        }
    });

    flushNormalLines();
    closeLists();

    return htmlParts.join('');
}
