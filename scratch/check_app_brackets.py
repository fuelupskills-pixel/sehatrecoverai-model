import re
import sys

def remove_comments_and_strings(code):
    pattern = re.compile(
        r'//.*?$|/\*.*?\*/|\'(?:\\\\|\\\'|[^\'])*\'|\"(?:\\\\|\\\"|[^\"])*\"|`(?:\\\\|\\`|[^`])*`',
        re.DOTALL | re.MULTILINE
    )
    clean_code = re.sub(pattern, ' ', code)
    return clean_code

file_path = 'mobile/App.js'
with open(file_path, 'r', encoding='utf-8') as f:
    raw_code = f.read()

code = remove_comments_and_strings(raw_code)
lines = raw_code.splitlines()

stack = []
pairs = {')': '(', '}': '{', ']': '['}

for i, char in enumerate(code):
    if char in '({[':
        stack.append((char, i))
    elif char in ')}]':
        if not stack:
            line = raw_code[:i].count('\n') + 1
            print(f'Unmatched closing "{char}" at line {line}')
            print(f'  Line content: {lines[line-1].strip()[:100]}')
            sys.exit(1)
        top, pos = stack.pop()
        if top != pairs[char]:
            line_open = raw_code[:pos].count('\n') + 1
            line_close = raw_code[:i].count('\n') + 1
            print(f'Mismatch: "{top}" at line {line_open} closed by "{char}" at line {line_close}')
            print(f'  Open line: {lines[line_open-1].strip()[:100]}')
            print(f'  Close line: {lines[line_close-1].strip()[:100]}')
            sys.exit(1)

if stack:
    print('Unclosed brackets at end of file:')
    for char, pos in stack[:10]:
        line = raw_code[:pos].count('\n') + 1
        print(f'  "{char}" opened at line {line}: {lines[line-1].strip()[:100]}')
    sys.exit(1)
else:
    print('SUCCESS: No bracket mismatches found in mobile/App.js!')
