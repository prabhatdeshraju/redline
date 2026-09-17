# 02: Upload and extract in the browser

**What to build:** A reader drops in a contract as a PDF or DOCX, or pastes
text, and sees the text Redline extracted from it before anything else happens.
The file itself never leaves their machine — only the extracted text is sent
onward, and the interface says so plainly, before it is sent.

A document that is a scan rather than text is detected and refused with an
explanation. Analysis of misread characters produces citations that are wrong
in exactly the way a reader cannot detect, which is why OCR is out of scope
(ADR 0001).

Extraction owns faithful text recovery. When a quoted sentence later fails to
match its document, the defect belongs here — never in loosening the match.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] A reader can upload a PDF, upload a DOCX, or paste text directly
- [ ] Parsing happens in the browser; the file is never uploaded as a file
- [ ] The extracted text and its length are shown before analysis is offered
- [ ] Sentences survive page breaks, column order, hyphenation at line ends, ligatures, and headers interrupting a sentence
- [ ] An image-only PDF is detected and refused with a reason, never analysed
- [ ] A document too long to handle is refused clearly rather than silently truncated
- [ ] The interface states what leaves the reader's machine, before it leaves
