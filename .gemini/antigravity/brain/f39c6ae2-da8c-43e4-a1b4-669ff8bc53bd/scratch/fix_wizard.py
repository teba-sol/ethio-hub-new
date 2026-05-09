import sys

file_path = r'c:\Users\ASUS\ethio-hub-new\src\components\dashboard\Wizards.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = 0
for i, line in enumerate(lines):
    if skip > 0:
        skip -= 1
        continue
    
    # Replace alert in handleSaveDraft
    if "alert('Festival saved as draft successfully!');" in line:
        new_lines.append(line.replace("alert('Festival saved as draft successfully!');", "showNotification('Festival saved as draft successfully!', 'success');"))
    elif 'alert(`Please fill out all required fields:\\n- ${allMissing.join(\'\\n- \')}`);' in line:
        new_lines.append(line.replace('alert(`Please fill out all required fields:\\n- ${allMissing.join(\'\\n- \')}`);', "showNotification(`Missing: ${allMissing.join(', ')}`, 'error');"))
    elif "alert(initialData ? 'Festival updated successfully!' : 'Festival submitted for verification successfully!');" in line:
        new_lines.append(line.replace("alert(initialData ? 'Festival updated successfully!' : 'Festival submitted for verification successfully!');", "showNotification(initialData ? 'Festival updated successfully!' : 'Festival submitted for verification successfully!', 'success');"))
    elif "alert(`Failed to publish festival: ${response.message}`);" in line:
        new_lines.append(line.replace("alert(`Failed to publish festival: ${response.message}`);", "showNotification(`Failed to publish festival: ${response.message}`, 'error');"))
    elif "alert('An error occurred while publishing the festival.');" in line:
        new_lines.append(line.replace("alert('An error occurred while publishing the festival.');", "showNotification('An error occurred while publishing the festival.', 'error');"))
    
    # Replace Age Restriction
    elif '<label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1 mb-2 block">Age Restriction</label>' in line:
        new_lines.append(line)
        # Look for the Input block following this label
        input_start = -1
        for j in range(i+1, i+10):
            if '<Input' in lines[j]:
                input_start = j
                break
        
        if input_start != -1:
            # Skip until closing />
            for j in range(input_start, input_start+10):
                if '/>' in lines[j]:
                    skip = j - i
                    break
            
            # Add the new select
            indent = line[:line.find('<')]
            new_lines.append(f'{indent}<select\n')
            new_lines.append(f'{indent}  value={{formData.policies.ageRestriction || ""}}\n')
            new_lines.append(f'{indent}  onChange={{(e) => setFormData(prev => ({{ ...prev, policies: {{ ...prev.policies, ageRestriction: e.target.value }} }}))}}\n')
            new_lines.append(f'{indent}  className="w-full px-4 py-3.5 bg-white border border-gray-100 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm font-bold text-gray-700 shadow-sm"\n')
            new_lines.append(f'{indent}>\n')
            new_lines.append(f'{indent}  <option value="">All Ages</option>\n')
            new_lines.append(f'{indent}  <option value="12+">12+</option>\n')
            new_lines.append(f'{indent}  <option value="18+">18+</option>\n')
            new_lines.append(f'{indent}  <option value="21+">21+</option>\n')
            new_lines.append(f'{indent}  <option value="Adults Only">Adults Only</option>\n')
            new_lines.append(f'{indent}  <option value="Family Friendly">Family Friendly</option>\n')
            new_lines.append(f'{indent}</select>\n')
        else:
            new_lines.append(line)

    # Insert Notification UI
    elif 'return (' in line and 'max-w-[1400px]' in lines[i+1]:
        new_lines.append(line)
        new_lines.append(lines[i+1].replace('max-w-[1400px] mx-auto pb-20', 'max-w-[1400px] mx-auto pb-20 relative'))
        indent = lines[i+1][:lines[i+1].find('<')]
        new_lines.append(f'{indent}  {{/* Modern Notification System */}}\n')
        new_lines.append(f'{indent}  <AnimatePresence>\n')
        new_lines.append(f'{indent}    {{notification && (\n')
        new_lines.append(f'{indent}      <motion.div\n')
        new_lines.append(f'{indent}        initial={{{{ opacity: 0, y: -50, scale: 0.9 }}}}\n')
        new_lines.append(f'{indent}        animate={{{{ opacity: 1, y: 0, scale: 1 }}}}\n')
        new_lines.append(f'{indent}        exit={{{{ opacity: 0, y: -50, scale: 0.9 }}}}\n')
        new_lines.append(f'{indent}        className="fixed top-12 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"\n')
        new_lines.append(f'{indent}      >\n')
        new_lines.append(f'{indent}        <div className={{`\n')
        new_lines.append(f'{indent}          p-5 rounded-[24px] shadow-2xl backdrop-blur-xl border flex items-center gap-4\n')
        new_lines.append(f'{indent}          ${{notification.type === "success" ? "bg-emerald-50/90 border-emerald-100 text-emerald-800" : \n')
        new_lines.append(f'{indent}            notification.type === "error" ? "bg-red-50/90 border-red-100 text-red-800" : \n')
        new_lines.append(f'{indent}            "bg-white/90 border-gray-100 text-gray-800"}}\n')
        new_lines.append(f'{indent}        `}}>\n')
        new_lines.append(f'{indent}          <div className={{`\n')
        new_lines.append(f'{indent}            w-10 h-10 rounded-xl flex items-center justify-center shrink-0\n')
        new_lines.append(f'{indent}            ${{notification.type === "success" ? "bg-emerald-100" : \n')
        new_lines.append(f'{indent}              notification.type === "error" ? "bg-red-100" : \n')
        new_lines.append(f'{indent}              "bg-gray-100"}}\n')
        new_lines.append(f'{indent}          `}}>\n')
        new_lines.append(f'{indent}            {{notification.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : \n')
        new_lines.append(f'{indent}             notification.type === "error" ? <AlertCircle className="w-5 h-5" /> : \n')
        new_lines.append(f'{indent}             <Info className="w-5 h-5" />}}\n')
        new_lines.append(f'{indent}          </div>\n')
        new_lines.append(f'{indent}          <p className="text-sm font-bold leading-tight">{{notification.message}}</p>\n')
        new_lines.append(f'{indent}          <button onClick={{() => setNotification(null)}} className="ml-auto p-1 hover:bg-black/5 rounded-lg transition-colors">\n')
        new_lines.append(f'{indent}            <X className="w-4 h-4 opacity-40" />\n')
        new_lines.append(f'{indent}          </button>\n')
        new_lines.append(f'{indent}        </div>\n')
        new_lines.append(f'{indent}      </motion.div>\n')
        new_lines.append(f'{indent}    )}}\n')
        new_lines.append(f'{indent}  </AnimatePresence>\n')
        skip = 1
    else:
        new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
