import os

project_dir = r"c:\Users\ADMIN\Desktop\projects\cardio-registry"
hf_jsx_path = os.path.join(project_dir, "frontend", "src", "components", "forms", "hf.jsx")

with open(hf_jsx_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

stack = []
for idx, line in enumerate(lines):
    line_num = idx + 1
    # Simple scanner ignoring comments and string literals
    in_string = False
    string_char = None
    in_comment = False
    in_multiline_comment = False
    
    i = 0
    while i < len(line):
        char = line[i]
        
        # Multiline comment check
        if in_multiline_comment:
            if char == '*' and i + 1 < len(line) and line[i+1] == '/':
                in_multiline_comment = False
                i += 2
                continue
            i += 1
            continue
            
        # Single line comment check
        if in_comment:
            break
            
        # String checks
        if in_string:
            if char == '\\':
                i += 2
                continue
            if char == string_char:
                in_string = False
            i += 1
            continue
            
        # Check start of comment
        if char == '/' and i + 1 < len(line):
            if line[i+1] == '/':
                in_comment = True
                break
            elif line[i+1] == '*':
                in_multiline_comment = True
                i += 2
                continue
                
        # Check start of string
        if char in ["'", '"', '`']:
            in_string = True
            string_char = char
            i += 1
            continue
            
        # Bracket checks
        if char in ['{', '[', '(']:
            stack.append((char, line_num, line.strip()))
        elif char in ['}', ']', ')']:
            if not stack:
                print(f"Extra closing '{char}' at line {line_num}: {line.strip()}")
            else:
                top_char, top_line, top_content = stack.pop()
                if (char == '}' and top_char != '{') or \
                   (char == ']' and top_char != '[') or \
                   (char == ')' and top_char != '('):
                    print(f"Mismatched closing '{char}' at line {line_num}: {line.strip()}")
                    print(f"  Matched with opening '{top_char}' at line {top_line}: {top_content}")
        i += 1

print(f"Scan complete. Stack size: {len(stack)}")
if stack:
    print("Unclosed brackets in stack (last 10):")
    for item in stack[-10:]:
        print(f"  Line {item[1]}: {item[0]} -> {item[2]}")
